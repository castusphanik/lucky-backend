import axios from "axios"
import { getManagementToken } from "../utils/auth0.managementtoken"

const domain = process.env.AUTH0_DOMAIN?.replace(/\/$/, "")

if (!domain) {
  throw new Error("AUTH0_DOMAIN is not defined in environment variables")
}

/**
 * Create user in Auth0
 */
export const createAuth0User = async (payload: Record<string, any>) => {
  const token = await getManagementToken()
  const res = await axios.post(`${domain}/api/v2/users`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  return res.data
}

/**
 * Update user in Auth0
 */
export const updateAuth0User = async (
  auth0UserId: string,
  payload: Record<string, any>
) => {
  const token = await getManagementToken()
  const res = await axios.patch(
    `${domain}/api/v2/users/${encodeURIComponent(auth0UserId)}`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return res.data
}

/**
 * Delete user in Auth0
 */
export const deleteAuth0User = async (auth0UserId: string) => {
  const token = await getManagementToken()
  await axios.delete(
    `${domain}/api/v2/users/${encodeURIComponent(auth0UserId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

/**
 * Add user to an Auth0 organization
 */
export const addUserToOrganization = async (orgId: string, userId: string) => {
  const token = await getManagementToken()
  await axios.post(
    `${domain}/api/v2/organizations/${orgId}/members`,
    { members: [userId] },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

/**
 * Assign a role to a user in Auth0
 */
export const addUserToRole = async (roleId: string, userId: string) => {
  const token = await getManagementToken()
  await axios.post(
    `${domain}/api/v2/roles/${roleId}/users`,
    { users: [userId] },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

/**
 *
 * @returns  getAUth token getAuthToken
 */

export async function getAuthToken(): Promise<string> {
  try {
    const response = await axios.post(
      `${process.env.AUTH0_DOMAIN}/oauth/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.AUTH0_CLIENT_ID || "",
        client_secret: process.env.AUTH0_CLIENT_SECRET || "",
        audience: `${process.env.AUTH0_DOMAIN}/api/v2/`,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    )

    if (!response.data?.access_token) {
      throw new Error("No access token returned from Auth0")
    }

    return response.data.access_token as string
  } catch (error: any) {
    console.error(
      "Error getting Auth0 token:",
      error.response?.data || error.message
    )
    throw new Error("Failed to get Auth0 token")
  }
}

// Helper to ensure resource server exists in Auth0
export async function ensureResourceServerExists(
  domain: string,
  token: string,
  identifier: string,
  permissions: string[]
) {
  // Check existing APIs
  const listApis = await axios.get(`${domain}/api/v2/resource-servers`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const existingApi = listApis.data.find(
    (api: any) => api.identifier === identifier
  )

  if (!existingApi) {
    console.log(`Creating new resource server: ${identifier}`)

    // Create API
    const newApi = await axios.post(
      `${domain}/api/v2/resource-servers`,
      {
        name: identifier.replace(/^https?:\/\//, ""), // remove protocol for name
        identifier: identifier,
        signing_alg: "RS256",
        scopes: permissions.map((p) => ({ value: p, description: p })),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    return newApi.data
  } else {
    // Add missing scopes if needed
    const missingScopes = permissions.filter(
      (p) => !existingApi.scopes?.some((scope: any) => scope.value === p)
    )
    if (missingScopes.length > 0) {
      console.log(`Adding missing scopes to API: ${identifier}`)
      await axios.patch(
        `${domain}/api/v2/resource-servers/${existingApi.id}`,
        {
          scopes: [
            ...existingApi.scopes,
            ...missingScopes.map((p) => ({ value: p, description: p })),
          ],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }
  }
}

// export const updateAuth0UserStatus = async (
//   auth0UserId: string,
//   isActive: boolean
// ) => {
//   try {
//     const url = `${domain}/api/v2/users/${auth0UserId}`
//     const res = await axios.patch(
//       url,
//       { blocked: !isActive }, // blocked = true → deactivated
//       {
//         headers: {
//           Authorization: `Bearer ${managementToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     )
//     return res.data
//   } catch (error: any) {
//     console.error(
//       "Auth0 update user status error:",
//       error.response?.data || error.message
//     )
//     throw error
//   }
// }
