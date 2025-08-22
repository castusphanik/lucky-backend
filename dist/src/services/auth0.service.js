"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserToRole = exports.addUserToOrganization = exports.deleteAuth0User = exports.updateAuth0User = exports.createAuth0User = void 0;
exports.getAuthToken = getAuthToken;
exports.ensureResourceServerExists = ensureResourceServerExists;
const axios_1 = __importDefault(require("axios"));
const auth0_managementtoken_1 = require("../utils/auth0.managementtoken");
const domain = process.env.AUTH0_DOMAIN?.replace(/\/$/, "");
if (!domain) {
    throw new Error("AUTH0_DOMAIN is not defined in environment variables");
}
/**
 * Create user in Auth0
 */
const createAuth0User = async (payload) => {
    const token = await (0, auth0_managementtoken_1.getManagementToken)();
    const res = await axios_1.default.post(`${domain}/api/v2/users`, payload, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};
exports.createAuth0User = createAuth0User;
/**
 * Update user in Auth0
 */
const updateAuth0User = async (auth0UserId, payload) => {
    const token = await (0, auth0_managementtoken_1.getManagementToken)();
    const res = await axios_1.default.patch(`${domain}/api/v2/users/${encodeURIComponent(auth0UserId)}`, payload, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};
exports.updateAuth0User = updateAuth0User;
/**
 * Delete user in Auth0
 */
const deleteAuth0User = async (auth0UserId) => {
    const token = await (0, auth0_managementtoken_1.getManagementToken)();
    await axios_1.default.delete(`${domain}/api/v2/users/${encodeURIComponent(auth0UserId)}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};
exports.deleteAuth0User = deleteAuth0User;
/**
 * Add user to an Auth0 organization
 */
const addUserToOrganization = async (orgId, userId) => {
    const token = await (0, auth0_managementtoken_1.getManagementToken)();
    await axios_1.default.post(`${domain}/api/v2/organizations/${orgId}/members`, { members: [userId] }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
};
exports.addUserToOrganization = addUserToOrganization;
/**
 * Assign a role to a user in Auth0
 */
const addUserToRole = async (roleId, userId) => {
    const token = await (0, auth0_managementtoken_1.getManagementToken)();
    await axios_1.default.post(`${domain}/api/v2/roles/${roleId}/users`, { users: [userId] }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
};
exports.addUserToRole = addUserToRole;
/**
 *
 * @returns  getAUth token getAuthToken
 */
async function getAuthToken() {
    try {
        const response = await axios_1.default.post(`${process.env.AUTH0_DOMAIN}/oauth/token`, new URLSearchParams({
            grant_type: "client_credentials",
            client_id: process.env.AUTH0_CLIENT_ID || "",
            client_secret: process.env.AUTH0_CLIENT_SECRET || "",
            audience: `${process.env.AUTH0_DOMAIN}/api/v2/`,
        }), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        if (!response.data?.access_token) {
            throw new Error("No access token returned from Auth0");
        }
        return response.data.access_token;
    }
    catch (error) {
        console.error("Error getting Auth0 token:", error.response?.data || error.message);
        throw new Error("Failed to get Auth0 token");
    }
}
// Helper to ensure resource server exists in Auth0
async function ensureResourceServerExists(domain, token, identifier, permissions) {
    // Check existing APIs
    const listApis = await axios_1.default.get(`${domain}/api/v2/resource-servers`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const existingApi = listApis.data.find((api) => api.identifier === identifier);
    if (!existingApi) {
        console.log(`Creating new resource server: ${identifier}`);
        // Create API
        const newApi = await axios_1.default.post(`${domain}/api/v2/resource-servers`, {
            name: identifier.replace(/^https?:\/\//, ""), // remove protocol for name
            identifier: identifier,
            signing_alg: "RS256",
            scopes: permissions.map((p) => ({ value: p, description: p })),
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return newApi.data;
    }
    else {
        // Add missing scopes if needed
        const missingScopes = permissions.filter((p) => !existingApi.scopes?.some((scope) => scope.value === p));
        if (missingScopes.length > 0) {
            console.log(`Adding missing scopes to API: ${identifier}`);
            await axios_1.default.patch(`${domain}/api/v2/resource-servers/${existingApi.id}`, {
                scopes: [
                    ...existingApi.scopes,
                    ...missingScopes.map((p) => ({ value: p, description: p })),
                ],
            }, { headers: { Authorization: `Bearer ${token}` } });
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
