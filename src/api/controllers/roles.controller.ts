import { Request, Response } from "express"
import prisma from "../../config/database.config"
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils"
import axios from "axios"
import {
  axiosWithRetry,
  chunkArray,
  getManagementToken,
} from "../../utils/auth0.managementtoken"
import {
  ensureResourceServerExists,
  getAuthToken,
} from "../../services/auth0.service"

export interface CheckPermissionBody {
  group: string
  feature: string
  right: "read" | "write" | "view"
}

export const getUserRolesByCustomerId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { customer_id } = req.params

    if (!customer_id || isNaN(Number(customer_id))) {
      return sendErrorResponse(res, "Valid customer_id is required")
    }

    const roles = await prisma.user_role.findMany({
      where: { customer_id: Number(customer_id) },
      select: {
        user_role_id: true,
        name: true,
        description: true,
        accessible_account_ids: true,
        customer_id: true,
        auth0_role_id: true,
        auth0_role_name: true,
        created_at: true,
        created_by: true,
        updated_by: true,
        role_permission: true, // JSON permissions array
      },
      orderBy: { user_role_id: "asc" }, // Optional: Order results
    })

    if (!roles || roles.length === 0) {
      return sendErrorResponse(res, "No roles found for this customer")
    }

    return sendSuccessResponse(res, { roles })
  } catch (error: any) {
    console.error("getUserRolesByCustomerId error:", error.message)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const createUserRole = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, description, customer_id, permissions } = req.body

    if (!name || !description) {
      return sendErrorResponse(res, "Missing required fields")
    }
    if (
      !permissions ||
      !Array.isArray(permissions) ||
      permissions.length === 0
    ) {
      return sendErrorResponse(res, "Permissions array is required")
    }

    // 1 Check if role already exists
    const existingRole = await prisma.user_role.findFirst({
      where: { name, customer_id },
    })
    if (existingRole) {
      return sendErrorResponse(
        res,
        `Role '${name}' already exists for this customer.`
      )
    }

    // 2️ Generate unique Auth0 role name
    const auth0RoleName = `${customer_id ? customer_id : "TEN"}-${name}`
    const managementToken = await getManagementToken()
    const domain = process.env.AUTH0_DOMAIN?.replace(/\/$/, "")

    // 3️ Ensure resource servers exist (optimized)
    const resourceServers = [
      ...new Set(permissions.map((p: any) => p.resource_server_identifier)),
    ]

    for (const server of resourceServers) {
      const permsForServer = permissions
        .filter((p: any) => p.resource_server_identifier === server)
        .map((p: any) => p.permission_name)

      await ensureResourceServerExists(
        domain!,
        managementToken,
        server,
        permsForServer
      )
    }

    // 4️ Create role in Auth0
    const createRoleResponse = await axiosWithRetry({
      method: "POST",
      url: `${domain}/api/v2/roles`,
      data: { name: auth0RoleName, description },
      headers: {
        Authorization: `Bearer ${managementToken}`,
        "Content-Type": "application/json",
      },
    })

    const auth0RoleId = createRoleResponse.data.id

    // 5️ Assign permissions in chunks of 10 with retry
    const permissionChunks = chunkArray(permissions, 10)

    for (const chunk of permissionChunks) {
      await axiosWithRetry(
        {
          method: "POST",
          url: `${domain}/api/v2/roles/${auth0RoleId}/permissions`,
          data: { permissions: chunk },
          headers: {
            Authorization: `Bearer ${managementToken}`,
            "Content-Type": "application/json",
          },
        },
        5, // retries
        500 // initial delay
      )
    }

    // 6️ Store role in DB
    const newRole = await prisma.user_role.create({
      data: {
        name,
        description,
        customer_id,
        auth0_role_id: auth0RoleId,
        auth0_role_name: auth0RoleName,
        role_permission: permissions,
      },
      select: {
        user_role_id: true,
        name: true,
        accessible_account_ids: true,
        customer_id: true,
        auth0_role_id: true,
        auth0_role_name: true,
        role_permission: true,
      },
    })

    return sendSuccessResponse(res, {
      message:
        "Role created in Auth0, permissions assigned, and stored locally",
      role: newRole,
    })
  } catch (error: any) {
    console.error("createUserRole error:", error.response?.data || error)

    if (error.response?.status === 409) {
      return sendErrorResponse(
        res,
        "Role with this name already exists in Auth0."
      )
    }

    return sendErrorResponse(
      res,
      error.response?.data?.error_description ||
        error.response?.data?.message ||
        "Internal server error"
    )
  }
}

export const editUserRole = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { role_id, name, description, permissions, customer_id } = req.body
    if (!role_id) return sendErrorResponse(res, "role_id is required")

    // 1️⃣ Find role in DB
    const existingRole = await prisma.user_role.findUnique({
      where: { user_role_id: role_id },
    })
    if (!existingRole) return sendErrorResponse(res, "Role not found")

    const managementToken = await getManagementToken()
    const domain = process.env.AUTH0_DOMAIN?.replace(/\/$/, "")

    // 2️⃣ Generate updated Auth0 role name if name changes
    const auth0RoleName = name
      ? `${customer_id ? customer_id : "TEN"}-${name}`
      : existingRole.auth0_role_name

    // 3️⃣ Ensure resource servers exist (optimized)
    if (Array.isArray(permissions) && permissions.length > 0) {
      const resourceServers = [
        ...new Set(permissions.map((p: any) => p.resource_server_identifier)),
      ]
      for (const server of resourceServers) {
        const permsForServer = permissions
          .filter((p: any) => p.resource_server_identifier === server)
          .map((p: any) => p.permission_name)

        await ensureResourceServerExists(
          domain!,
          managementToken,
          server,
          permsForServer
        )
      }
    }

    const oldPermissions = Array.isArray(existingRole.role_permission)
      ? existingRole.role_permission
      : []

    const rolePermissionsUrl = `${domain}/api/v2/roles/${existingRole.auth0_role_id}/permissions`

    // 4️⃣ Remove old permissions if new ones provided
    if (
      Array.isArray(permissions) &&
      permissions.length > 0 &&
      oldPermissions.length > 0
    ) {
      try {
        await axiosWithRetry({
          method: "DELETE",
          url: rolePermissionsUrl,
          headers: {
            Authorization: `Bearer ${managementToken}`,
            "Content-Type": "application/json",
          },
          data: { permissions: oldPermissions },
        })
      } catch (err: any) {
        console.error(
          "Error removing permissions:",
          err.response?.data || err.message
        )
        return sendErrorResponse(
          res,
          "Failed to remove old permissions from Auth0 role"
        )
      }
    }

    // 5️⃣ Add new permissions in chunks of 10
    if (Array.isArray(permissions) && permissions.length > 0) {
      const permissionChunks = chunkArray(permissions, 10)
      for (const chunk of permissionChunks) {
        try {
          await axiosWithRetry({
            method: "POST",
            url: rolePermissionsUrl,
            data: { permissions: chunk },
            headers: {
              Authorization: `Bearer ${managementToken}`,
              "Content-Type": "application/json",
            },
          })
        } catch (err: any) {
          console.error(
            "Error adding permissions:",
            err.response?.data || err.message
          )
          return sendErrorResponse(
            res,
            "Failed to add new permissions to Auth0 role"
          )
        }
      }
    }

    // 6️⃣ Update role name/description in Auth0
    if (name || description) {
      try {
        await axiosWithRetry({
          method: "PATCH",
          url: `${domain}/api/v2/roles/${existingRole.auth0_role_id}`,
          data: { name: auth0RoleName, description },
          headers: {
            Authorization: `Bearer ${managementToken}`,
            "Content-Type": "application/json",
          },
        })
      } catch (err: any) {
        console.error(
          "Error updating role in Auth0:",
          err.response?.data || err.message
        )
        if (err.response?.status === 409) {
          return sendErrorResponse(res, "Role name already exists in Auth0.")
        }
        return sendErrorResponse(res, "Failed to update role in Auth0")
      }
    }

    // 7️⃣ Update role in local DB
    const updatedRole = await prisma.user_role.update({
      where: { user_role_id: role_id },
      data: {
        name: name ?? existingRole.name,
        description: description ?? existingRole.description,
        auth0_role_name: auth0RoleName,
        role_permission: permissions ?? existingRole.role_permission,
      },
      select: {
        user_role_id: true,
        name: true,
        description: true,
        accessible_account_ids: true,
        auth0_role_id: true,
        auth0_role_name: true,
        role_permission: true,
      },
    })

    return sendSuccessResponse(res, {
      message: "Role updated successfully in Auth0 and local DB",
      role: updatedRole,
    })
  } catch (error: any) {
    console.error("editUserRole error:", error.response?.data || error.message)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const getUserRoleById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { role_id } = req.params

    if (!role_id || isNaN(Number(role_id))) {
      return sendErrorResponse(res, "Valid role_id is required")
    }

    // Fetch role from DB
    const role = await prisma.user_role.findUnique({
      where: { user_role_id: Number(role_id) },
      select: {
        user_role_id: true,
        name: true,
        description: true,
        accessible_account_ids: true,
        customer_id: true,
        auth0_role_id: true,
        created_by: true,
        updated_by: true,
        role_permission: true, // This is the JSON field with permissions
      },
    })

    if (!role) {
      return sendErrorResponse(res, "Role not found")
    }

    return sendSuccessResponse(res, { role })
  } catch (error: any) {
    console.error("getUserRoleById error:", error.message)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const removeRolePermissions = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params
    const { permissions } = req.body

    if (!id) {
      return res.status(400).json({ error: "Role ID is required" })
    }

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: "Permissions array is required" })
    }

    // Validate permissions structure
    for (const permission of permissions) {
      if (
        !permission.resource_server_identifier ||
        !permission.permission_name
      ) {
        return res.status(400).json({
          error:
            "Each permission must have resource_server_identifier and permission_name",
        })
      }
    }

    // Get management token
    const managementToken = await getAuthToken()
    const domain = process.env.AUTH0_DOMAIN?.replace(/\/$/, "")
    const rolePermissionsUrl = `${domain}/api/v2/roles/${id}/permissions`

    // Remove permissions from role
    const response = await axios.delete(rolePermissionsUrl, {
      headers: {
        authorization: `Bearer ${managementToken}`,
        "content-type": "application/json",
      },
      data: { permissions },
    })

    return res.json({
      success: true,
      message: "Permissions removed from role successfully",
      roleId: id,
      permissionsRemoved: permissions,
      data: response.data,
    })
  } catch (error: any) {
    console.error(
      "Error removing permissions from role:",
      error.response?.data || error.message
    )
    return res.status(500).json({
      error: "Failed to remove permissions from role",
      details: error.response?.data?.error_description || error.message,
    })
  }
}
