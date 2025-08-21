import { Request, Response } from "express"
import prisma from "../../config/database.config"
import { getPagination } from "../../utils/pagination"
import {
  sendErrorResponse,
  sendPaginatedResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils"
import {
  ExcelExporter,
  createPaginationSubtitle,
  formatters,
} from "../../utils/excelUtils"
import axios from "axios"
import { getManagementToken } from "../../utils/auth0.managementtoken"
import {
  createAuth0User,
  addUserToOrganization,
  addUserToRole,
  updateAuth0User,
  deleteAuth0User,
} from "../../services/auth0.service"
import {
  UserListQueryDTO,
  UserFilterDTO,
  UserCustomerAccountsResponseDTO,
  GetUsersByCustomerIdQueryDTO,
  CreateUserColumnPreferenceDto,
} from "../../types/dtos/user.dto"
import { UserService } from "../../services/user.service"
import { sendWelcomeEmail } from "../../services/sendGrid.service"
import { column_preferences } from "../../utils/coloumPrefrences"
const userService = new UserService()

/// to get list of tenUser for tenAdmin

export const getAllTenUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page, perPage, skip, take } = getPagination(req.query)

    const query: UserListQueryDTO = {
      page,
      perPage,
      first_name: req.query.first_name as string,
      last_name: req.query.last_name as string,
      email: req.query.email as string,
      phone_number: req.query.phone_number as string,
      designation: req.query.designation as string,
      status: req.query.status as string,
      user_role_id: req.query.user_role_id
        ? Number(req.query.user_role_id)
        : undefined,
      customer_id: req.query.customer_id
        ? Number(req.query.customer_id)
        : undefined,
    }

    const { users, total } = await userService.getAllTenantUsers(
      query,
      skip,
      take
    )
    let tableName = column_preferences.users.tenUser

    return sendPaginatedResponse(res, users, total, page, perPage, undefined, {
      tableName,
    })
  } catch (error) {
    console.error("getAllTenantUsers error:", error)
    return sendErrorResponse(res, "Internal server error")
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId)
    if (!userId) {
      return sendErrorResponse(res, "User ID missing or invalid", 400)
    }

    const user = await userService.getCurrentUser(userId)

    if (!user) {
      return sendErrorResponse(res, "User not found", 404)
    }

    return sendSuccessResponse(res, user)
  } catch (error) {
    console.error("getCurrentUser error:", error)
    return sendErrorResponse(res, "Internal server error", 500)
  }
}

export const getCustomerUsersByAccountAssignment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.params

    //  Normalize req.query into UserFilterDTO
    const query: UserFilterDTO = {
      accountIds: (req.query.accountIds as string) || "all", // default "all"
      first_name: req.query.first_name as string,
      last_name: req.query.last_name as string,
      email: req.query.email as string,
      status: req.query.status as string,
      is_customer_user: req.query.is_customer_user as string,
      user_role_id: req.query.user_role_id as string,
      page: req.query.page ? Number(req.query.page) : 1,
      perPage: req.query.perPage ? Number(req.query.perPage) : 10,
    }

    //  Call service with a proper DTO
    const result = await userService.fetchCustomerUsersByAccountAssignment(
      Number(userId),
      query
    )

    return sendSuccessResponse(res, result, column_preferences.users.customUser)
  } catch (error) {
    console.error("getCustomerUsersByAccountAssignment error:", error)
    return sendErrorResponse(res, "Internal server error")
  }
}
/// to fecth customerDetails And AccountsByUserId

export const getCustomerDetailsAndAccountsByUserId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = parseInt(req.params.userId, 10)

    const result: UserCustomerAccountsResponseDTO =
      await userService.fetchCustomerDetailsAndAccountsByUserId(userId)

    return sendSuccessResponse(res, result)
  } catch (error) {
    console.error("getCustomerDetailsAndAccountsByUserId error:", error)
    return sendErrorResponse(res, "Internal server error")
  }
}
/// to fecth list of customer for TenAdmin

export const fetchCustomers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page, perPage, skip, take } = getPagination(req.query)

    const filters = {
      customer_name: req.query.customer_name as string,
      status: req.query.status as string,
      reference_number: req.query.reference_number as string,
      sold_by_salesperson_id: req.query.sold_by_salesperson_id
        ? Number(req.query.sold_by_salesperson_id)
        : undefined,
      created_by: req.query.created_by
        ? Number(req.query.created_by)
        : undefined,
    }

    const { customers, total } = await userService.fetchCustomersService(
      filters,
      skip,
      take
    )
    let tablename = column_preferences.customers.tenCustomers

    return sendPaginatedResponse(res, customers, total, page, perPage, 200, {
      tablename,
    })
  } catch (err) {
    console.error("fetchCustomers error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

/// to fecth list of users for a particular customer for TenAdmin

export const getAllUsersByCustomerId = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page, perPage, skip, take } = getPagination(req.query)

    const filters: GetUsersByCustomerIdQueryDTO = {
      customer_id: Number(req.query.customer_id),
      first_name: req.query.first_name?.toString(),
      last_name: req.query.last_name?.toString(),
      email: req.query.email?.toString(),
      phone_number: req.query.phone_number?.toString(),
      designation: req.query.designation?.toString(),
      status: req.query.status?.toString(),
      user_role_id: req.query.user_role_id
        ? Number(req.query.user_role_id)
        : undefined,
      is_customer_user:
        typeof req.query.is_customer_user !== "undefined"
          ? req.query.is_customer_user === "true"
          : undefined,
    }

    const { users, totalUsers } =
      await userService.getAllUsersByCustomerIdService(filters, skip, take)

    return sendPaginatedResponse(res, users, totalUsers, page, perPage)
  } catch (error) {
    console.error("getAllUsersByCustomerId error:", error)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const createUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone_number,
      designation,
      avatar,
      status,
      is_customer_user,
      user_role_id,
      customer_id,
      password,
      assigned_account_ids,
      permissions,
    } = req.body

    //  Validate required fields
    if (!user_role_id || isNaN(Number(user_role_id))) {
      return sendErrorResponse(res, "Invalid or missing user_role_id", 400)
    }
    if (!customer_id || isNaN(Number(customer_id))) {
      return sendErrorResponse(res, "Invalid or missing customer_id", 400)
    }
    if (!email || !password) {
      return sendErrorResponse(
        res,
        "Email and password are required for Auth0",
        400
      )
    }

    // Step 0: Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { customer_id: Number(customer_id) },
    })
    if (!customer) {
      return sendErrorResponse(res, "Customer not found", 404)
    }

    // Fetch role
    const userRole = await prisma.user_role.findUnique({
      where: { user_role_id: Number(user_role_id) },
      select: { accessible_account_ids: true, auth0_role_id: true },
    })
    if (!userRole) {
      return sendErrorResponse(res, "User role not found", 404)
    }

    /**
     * Step 1: Create user in Auth0
     */
    const auth0Payload = {
      email,
      given_name: first_name,
      family_name: last_name,
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      picture: avatar,
      // phone_number,
      connection: "Username-Password-Authentication",
      password,
      verify_email: true,
    }
    const auth0User = await createAuth0User(auth0Payload)

    /**
     * Step 2: Save user in Postgres
     */
    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        phone_number,
        designation,
        avatar,
        auth_0_reference_id: auth0User.user_id,
        status,
        is_customer_user,
        user_role_id: Number(user_role_id),
        customer_id: customer.customer_id,
        auth0_customer_id: customer.auth0_customer_id,
        auth0_role_id: userRole.auth0_role_id,
        assigned_account_ids,
        permissions: permissions,
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        user_role_id: true,
        customer_id: true,
        assigned_account_ids: true,
        auth_0_reference_id: true,
        auth0_role_id: true,
        permissions: true,
        phone_number: true,
      },
    })

    /**
     * Step 3: Add user to Auth0 Organization
     */
    if (customer.auth0_customer_id) {
      await addUserToOrganization(customer.auth0_customer_id, auth0User.user_id)
      console.log(`✅ User added to org ${customer.auth0_customer_id}`)
    }

    /**
     * Step 4: Assign Auth0 Role
     */
    if (userRole.auth0_role_id) {
      await addUserToRole(userRole.auth0_role_id, auth0User.user_id)
      console.log(`✅ User added to role ${userRole.auth0_role_id}`)
    }

    /**
     *  Step 5: Send Welcome Email
     */
    await sendWelcomeEmail(email, {
      name: `${first_name} ${last_name}`,
      // organization: customer.name,
      Temporary_Password: password,
      to: email,
    })

    return sendSuccessResponse(res, newUser)
  } catch (error: any) {
    console.error("createUser error:", error.response?.data || error.message)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { user_id } = req.params // local DB user_id

    // Step 0: Find user in Postgres
    const existingUser = await prisma.user.findUnique({
      where: { user_id: Number(user_id) },
    })
    if (!existingUser) {
      return sendErrorResponse(res, "User not found", 404)
    }

    // Step 1: Delete in Auth0 (disable account completely)
    await deleteAuth0User(existingUser.auth_0_reference_id)

    /// for perment delete
    //   await prisma.user.delete({
    //   where: { user_id: Number(id) },
    // })

    // Step 2: Soft delete in Postgres → mark as INACTIVE/DELETED
    const updatedUser = await prisma.user.update({
      where: { user_id: Number(user_id) },
      data: {
        status: "INACTIVE", // or "DELETED" depending on your lookup table
        updated_at: new Date(),
      },
      select: {
        user_id: true,
        email: true,
        status: true,
      },
    })

    return sendSuccessResponse(res, {
      message: "User soft-deleted successfully",
      user: updatedUser,
    })
  } catch (error: any) {
    console.error("deleteUser error:", error.response?.data || error.message)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const updateUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { user_id } = req.params
    const {
      first_name,
      last_name,
      email,
      phone_number,
      designation,
      avatar,
      status,
      user_role_id,
      customer_id,
      permissions,
      assigned_account_ids,
    } = req.body

    // Step 0: Find user in Postgres
    const existingUser = await prisma.user.findUnique({
      where: { user_id: Number(user_id) },
      include: { customer_ref: true, user_role_ref: true },
    })
    if (!existingUser) {
      return sendErrorResponse(res, "User not found", 404)
    }

    // Step 1: Update Auth0 user
    const auth0Payload: any = {
      email,
      given_name: first_name,
      family_name: last_name,
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      picture: avatar,
    }
    await updateAuth0User(existingUser.auth_0_reference_id, auth0Payload)

    // Step 2: Update Postgres
    const updatedUser = await prisma.user.update({
      where: { user_id: Number(user_id) },
      data: {
        first_name,
        last_name,
        email,
        phone_number,
        designation,
        avatar,
        status,
        permissions,
        assigned_account_ids,
        user_role_id: user_role_id
          ? Number(user_role_id)
          : existingUser.user_role_id,
        customer_id: customer_id
          ? Number(customer_id)
          : existingUser.customer_id,
        updated_at: new Date(),
      },
    })

    // Step 3: If role or org changed, update in Auth0
    if (
      customer_id &&
      customer_id !== existingUser.customer_id &&
      existingUser.auth0_customer_id
    ) {
      await addUserToOrganization(
        existingUser.auth0_customer_id,
        existingUser.auth_0_reference_id
      )
    }

    if (
      user_role_id &&
      user_role_id !== existingUser.user_role_id &&
      existingUser.auth0_role_id
    ) {
      await addUserToRole(
        existingUser.auth0_role_id,
        existingUser.auth_0_reference_id
      )
    }

    return sendSuccessResponse(res, updatedUser)
  } catch (error: any) {
    console.error("updateUser error:", error.response?.data || error.message)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const downloadAllTenUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { buffer, filename } = await userService.downloadAllTenantUsers(
      req.query as any
    )

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`)
    res.status(200).end(buffer)
  } catch (error: any) {
    console.error("downloadAllTenUsers error:", error)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const downloadCustomerUsersByAccountAssignment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId)
    if (!userId || isNaN(userId)) {
      return sendErrorResponse(res, "Invalid or missing user ID", 400)
    }

    const { buffer, filename } =
      await userService.downloadCustomerUsersByAccountAssignment(
        userId,
        req.query as any
      )

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`)
    res.status(200).end(buffer)
  } catch (error: any) {
    if (error?.message === "USER_NOT_FOUND") {
      return sendErrorResponse(res, "User not found", 404)
    }
    if (error?.message === "NO_ASSIGNED_ACCOUNTS") {
      return sendErrorResponse(res, "No accounts assigned to user", 400)
    }
    if (error?.message === "INVALID_ACCOUNT_IDS") {
      return sendErrorResponse(res, "No valid accountIds provided", 400)
    }
    if (error?.message === "MISSING_ACCOUNT_IDS") {
      return sendErrorResponse(res, "accountIds query parameter required", 400)
    }
    console.error("downloadCustomerUsersByAccountAssignment error:", error)
    return sendErrorResponse(res, "Internal server error")
  }
}
export const downloadCustomers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { buffer, filename } = await userService.downloadCustomers(
      req.query as any
    )

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`)
    res.status(200).end(buffer)
  } catch (error: any) {
    console.error("downloadCustomers error:", error)
    return sendErrorResponse(res, "Internal server error")
  }
}

// export const downloadAllTenUsers = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { page, perPage, skip, take } = getPagination(req.query)

//     const {
//       first_name,
//       last_name,
//       email,
//       phone_number,
//       designation,
//       status,
//       user_role_id,
//       customer_id,
//     } = req.query

//     // Build filters based on API logic
//     const filters: any = {
//       is_customer_user: false,
//       ...(first_name && {
//         first_name: { contains: String(first_name), mode: "insensitive" },
//       }),
//       ...(last_name && {
//         last_name: { contains: String(last_name), mode: "insensitive" },
//       }),
//       ...(email && {
//         email: { contains: String(email), mode: "insensitive" },
//       }),
//       ...(phone_number && {
//         phone_number: { contains: String(phone_number), mode: "insensitive" },
//       }),
//       ...(designation && {
//         designation: { contains: String(designation), mode: "insensitive" },
//       }),
//       ...(status && {
//         status: { equals: String(status), mode: "insensitive" },
//       }),
//       ...(user_role_id && { user_role_id: Number(user_role_id) }),
//       ...(customer_id && { customer_id: Number(customer_id) }),
//     }

//     // Get total user count for pagination info
//     const totalUsers = await prisma.user.count({ where: filters })

//     // Get users, paginated
//     const users = await prisma.user.findMany({
//       where: filters,
//       skip,
//       take,
//       orderBy: { user_id: "asc" },
//       select: {
//         user_id: true,
//         customer_id: true,
//         first_name: true,
//         last_name: true,
//         email: true,
//         phone_number: true,
//         designation: true,
//         avatar: true,
//         status: true,
//         is_customer_user: true,
//         first_active: true,
//         last_active: true,
//         created_at: true,
//         created_by: true,
//         updated_at: true,
//         updated_by: true,
//         assigned_account_ids: true,
//         user_role_ref: {
//           select: {
//             user_role_id: true,
//             name: true,
//             description: true,
//           },
//         },
//       },
//     })

//     // Define columns for spreadsheet
//     const columns = [
//       { header: "S.No", key: "sno", width: 8 },
//       { header: "User ID", key: "user_id", width: 12 },
//       { header: "First Name", key: "first_name", width: 20 },
//       { header: "Last Name", key: "last_name", width: 20 },
//       { header: "Email", key: "email", width: 30 },
//       { header: "Phone Number", key: "phone_number", width: 18 },
//       { header: "Designation", key: "designation", width: 20 },
//       { header: "Status", key: "status", width: 12 },
//       { header: "User Role", key: "user_role", width: 18 },
//       {
//         header: "Is Customer User",
//         key: "is_customer_user",
//         width: 15,
//         formatter: formatters.boolean,
//       },
//     ]

//     // Format data
//     const formattedData = users.map((user: any, index: any) => ({
//       sno: formatters.serialNumber(index, skip),
//       user_id: user.user_id,
//       first_name: user.first_name || "",
//       last_name: user.last_name || "",
//       email: user.email || "",
//       phone_number: user.phone_number || "",
//       designation: user.designation || "",
//       status: user.status || "",
//       user_role: user.user_role_ref?.name || "",
//       is_customer_user: user.is_customer_user,
//     }))

//     // Filename and title logic
//     const timestamp = new Date()
//       .toISOString()
//       .replace(/[:.]/g, "-")
//       .slice(0, -5)
//     const totalPages = Math.ceil(totalUsers / perPage)
//     const filename = `tenant_users_page_${page}_of_${totalPages}_${timestamp}.xlsx`

//     const exporter = new ExcelExporter()
//     await exporter.generateWorkbook({
//       sheetName: "Tenant Users",
//       title: `All Tenant Users Export`,
//       subtitle: createPaginationSubtitle(page, perPage, skip, totalUsers),
//       columns,
//       data: formattedData,
//       filename,
//     })

//     await exporter.writeToResponse(res, filename)
//   } catch (error) {
//     console.error("downloadAllTenUsers error:", error)
//     res.status(500).json({ error: "Internal server error" })
//   }
// }

// export const downloadCustomerUsersByAccountAssignment = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { userId } = req.params
//     const {
//       accountIds,
//       first_name,
//       last_name,
//       email,
//       status,
//       is_customer_user,
//       user_role_id,
//     } = req.query

//     const { skip, take, page, perPage } = getPagination(req.query)

//     let accountIdArray: number[] = []

//     if (accountIds === "all") {
//       // Get assigned accounts from the user
//       const user = await prisma.user.findUnique({
//         where: { user_id: Number(userId) },
//         select: { assigned_account_ids: true },
//       })
//       if (!user || !user.assigned_account_ids.length) {
//         // Create and send an empty Excel file with message
//         const exporter = new ExcelExporter()
//         await exporter.generateWorkbook({
//           sheetName: "Users",
//           title: `No accounts assigned for user ${userId}`,
//           columns: [{ header: "Message", key: "msg", width: 40 }],
//           data: [{ msg: "No assigned accounts found." }],
//           filename: "empty.xlsx",
//         })
//         await exporter.writeToResponse(res, "empty.xlsx")
//         return
//       }
//       accountIdArray = user.assigned_account_ids
//     } else if (typeof accountIds === "string") {
//       accountIdArray = accountIds
//         .split(",")
//         .map((id) => Number(id.trim()))
//         .filter((id) => !isNaN(id) && id > 0)
//       if (!accountIdArray.length) {
//         res.status(400).json({ error: "No valid accountIds provided." })
//         return
//       }
//     } else {
//       res.status(400).json({ error: "'accountIds' query parameter required." })
//       return
//     }

//     // Dynamic filter construction
//     const filters: any = {
//       assigned_account_ids: { hasSome: accountIdArray },
//       ...(first_name && {
//         first_name: { contains: String(first_name), mode: "insensitive" },
//       }),
//       ...(last_name && {
//         last_name: { contains: String(last_name), mode: "insensitive" },
//       }),
//       ...(email && {
//         email: { contains: String(email), mode: "insensitive" },
//       }),
//       ...(status && {
//         status: { equals: String(status), mode: "insensitive" },
//       }),
//       ...(user_role_id && { user_role_id: Number(user_role_id) }),
//       ...(typeof is_customer_user !== "undefined" && {
//         is_customer_user: String(is_customer_user).toLowerCase() === "true",
//       }),
//     }

//     const totalUsers = await prisma.user.count({ where: filters })

//     const users = await prisma.user.findMany({
//       where: filters,
//       skip,
//       take,
//       orderBy: { user_id: "asc" },
//       select: {
//         user_id: true,
//         first_name: true,
//         last_name: true,
//         email: true,
//         status: true,
//         is_customer_user: true,
//         user_role_ref: { select: { name: true } },
//         assigned_account_ids: true,
//       },
//     })

//     // Define columns for spreadsheet
//     const columns = [
//       { header: "S.No", key: "sno", width: 8 },
//       { header: "User ID", key: "user_id", width: 12 },
//       { header: "First Name", key: "first_name", width: 20 },
//       { header: "Last Name", key: "last_name", width: 20 },
//       { header: "Email", key: "email", width: 30 },
//       { header: "Status", key: "status", width: 12 },
//       { header: "User Role", key: "user_role", width: 18 },
//       {
//         header: "Is Customer User",
//         key: "is_customer_user",
//         width: 15,
//         formatter: formatters.boolean,
//       },
//       {
//         header: "Assigned Account IDs",
//         key: "assigned_account_ids",
//         width: 20,
//       },
//     ]

//     const formattedData = users.map((user: any, index: any) => ({
//       sno: formatters.serialNumber(index, skip),
//       user_id: user.user_id,
//       first_name: user.first_name || "",
//       last_name: user.last_name || "",
//       email: user.email || "",
//       status: user.status || "",
//       user_role: user.user_role_ref?.name || "",
//       is_customer_user: user.is_customer_user,
//       assigned_account_ids: user.assigned_account_ids?.join(",") || "",
//     }))

//     // Filename and pagination subtitle
//     const timestamp = new Date()
//       .toISOString()
//       .replace(/[:.]/g, "-")
//       .slice(0, -5)
//     const totalPages = Math.max(
//       1,
//       Math.ceil(totalUsers / (perPage ? Number(perPage) : 1))
//     )
//     const filename = `customer_users_by_account_assignment_${page}_of_${totalPages}_${timestamp}.xlsx`

//     const exporter = new ExcelExporter()
//     await exporter.generateWorkbook({
//       sheetName: "Users",
//       title: `Customer Users by Account Assignment`,
//       subtitle: createPaginationSubtitle(page, perPage, skip, totalUsers),
//       columns,
//       data: formattedData,
//       filename,
//     })
//     await exporter.writeToResponse(res, filename)
//   } catch (error) {
//     console.error("downloadCustomerUsersByAccountAssignment error:", error)
//     res.status(500).json({ error: "Internal server error" })
//   }
// }

// export const downloadCustomers = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { page, perPage, skip, take } = getPagination(req.query)

//     const {
//       customer_name,
//       status,
//       reference_number,
//       sold_by_salesperson_id,
//       created_by,
//     } = req.query

//     const filters: any = {
//       is_deleted: false,
//       ...(customer_name && {
//         customer_name: { contains: String(customer_name), mode: "insensitive" },
//       }),
//       ...(reference_number && {
//         reference_number: {
//           contains: String(reference_number),
//           mode: "insensitive",
//         },
//       }),
//       ...(status && {
//         status: { contains: String(status), mode: "insensitive" },
//       }),
//       ...(sold_by_salesperson_id && {
//         sold_by_salesperson_id: Number(sold_by_salesperson_id),
//       }),
//       ...(created_by && { created_by: Number(created_by) }),
//     }

//     const totalCustomers = await prisma.customer.count({ where: filters })

//     const customers = await prisma.customer.findMany({
//       skip,
//       take,
//       where: filters,
//       orderBy: { customer_id: "asc" },
//       select: {
//         customer_id: true,
//         customer_name: true,
//         customer_class: true,
//         status: true,
//         reference_number: true,
//         sold_by_salesperson_id: true,
//         is_deleted: true,
//         deleted_by: true,
//         deleted_at: true,
//         created_at: true,
//         created_by: true,
//         updated_at: true,
//         updated_by: true,
//       },
//     })

//     // Define columns for spreadsheet
//     const columns = [
//       { header: "S.No", key: "sno", width: 8 },
//       { header: "Customer ID", key: "customer_id", width: 12 },
//       { header: "Customer Name", key: "customer_name", width: 28 },
//       { header: "Customer Class", key: "customer_class", width: 15 },
//       { header: "Status", key: "status", width: 12 },
//       { header: "Reference Number", key: "reference_number", width: 18 },
//       { header: "Salesperson ID", key: "sold_by_salesperson_id", width: 14 },
//       {
//         header: "Created At",
//         key: "created_at",
//         width: 20,
//         formatter: formatters.date,
//       },
//       { header: "Created By", key: "created_by", width: 12 },
//       {
//         header: "Updated At",
//         key: "updated_at",
//         width: 20,
//         formatter: formatters.date,
//       },
//       { header: "Updated By", key: "updated_by", width: 12 },
//     ]

//     // Format data for Excel
//     const formattedData = customers.map((cust: any, index: any) => ({
//       sno: formatters.serialNumber(index, skip),
//       customer_id: cust.customer_id,
//       customer_name: cust.customer_name || "",
//       customer_class: cust.customer_class || "",
//       status: cust.status || "",
//       reference_number: cust.reference_number || "",
//       sold_by_salesperson_id: cust.sold_by_salesperson_id || "",
//       created_at: cust.created_at || "",
//       created_by: cust.created_by || "",
//       updated_at: cust.updated_at || "",
//       updated_by: cust.updated_by || "",
//     }))

//     // Excel file name and meta
//     const timestamp = new Date()
//       .toISOString()
//       .replace(/[:.]/g, "-")
//       .slice(0, -5)
//     const totalPages = Math.max(
//       1,
//       Math.ceil(totalCustomers / (perPage ? Number(perPage) : 1))
//     )
//     const filename = `customers_page_${page}_of_${totalPages}_${timestamp}.xlsx`

//     const exporter = new ExcelExporter()
//     await exporter.generateWorkbook({
//       sheetName: "Customers",
//       title: `Customers Export`,
//       subtitle: createPaginationSubtitle(page, perPage, skip, totalCustomers),
//       columns,
//       data: formattedData,
//       filename,
//     })

//     await exporter.writeToResponse(res, filename)
//   } catch (error) {
//     console.error("downloadCustomers error:", error)
//     res.status(500).json({ error: "Internal server error" })
//   }
// }

export const createUserColumnPreference = async (
  req: Request,
  res: Response
) => {
  // No need for validation check here since withValidation handles it
  const data: CreateUserColumnPreferenceDto = req.body

  const preference = await userService.createOrUpdatePreference(data)

  return sendSuccessResponse(res, preference)
}

export const getUserColumnPreferences = async (req: Request, res: Response) => {
  const user_id = Number(req.params)

  const preferences = await userService.getUserPreferences(user_id)

  return sendSuccessResponse(res, preferences)
}

export const getUserTablePreference = async (req: Request, res: Response) => {
  const user_id = Number(req.params.user_id)
  const { table_name } = req.params

  console.log("Params:", req.params)

  // If no table_name, get all user preferences
  if (!table_name) {
    const preferences = await userService.getUserPreferences(user_id)
    return sendSuccessResponse(res, preferences)
  }

  // If table_name provided, get specific preference
  const preference = await userService.getPreferenceByUserAndTable(
    user_id,
    table_name
  )

  if (!preference) {
    return sendErrorResponse(
      res,
      "No preferences found for this user and table"
    )
  }

  return sendSuccessResponse(res, preference)
}

//not using
export const deleteUserColumnPreference = async (
  req: Request,
  res: Response
) => {
  const user_id = Number(req.params)
  const { table_name } = req.params

  const deleted = await userService.deleteUserPreference(user_id, table_name)

  if (!deleted) {
    return sendErrorResponse(
      res,
      "Preference not found or could not be deleted"
    )
  }

  return sendSuccessResponse(res, null)
}

//not using
export const getTablePreferences = async (req: Request, res: Response) => {
  const { table_name } = req.params

  const preferences = await userService.getAllTablePreferences(table_name)

  return sendSuccessResponse(res, preferences)
}
