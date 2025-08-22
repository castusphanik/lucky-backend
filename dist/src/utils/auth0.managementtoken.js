"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.axiosWithRetry = void 0;
exports.getManagementToken = getManagementToken;
exports.chunkArray = chunkArray;
const axios_1 = __importDefault(require("axios"));
async function getManagementToken() {
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
function chunkArray(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}
// Helper: Retry wrapper with exponential backoff for 429 errors
// export async function axiosWithRetry(
//   config: any,
//   retries = 5,
//   delay = 500
// ): Promise<any> {
//   try {
//     return await axios(config)
//   } catch (error: any) {
//     if (error.response?.status === 429 && retries > 0) {
//       const waitTime = delay * 2 // exponential backoff
//       console.warn(`Rate limited by Auth0. Retrying in ${waitTime}ms...`)
//       await new Promise((res) => setTimeout(res, waitTime))
//       return axiosWithRetry(config, retries - 1, waitTime)
//     }
//     throw error
//   }
// }
const axiosWithRetry = async (config, retries = 3, delay = 500) => {
    let attempt = 0;
    let error;
    while (attempt <= retries) {
        try {
            const res = await (0, axios_1.default)(config);
            return res.data;
        }
        catch (err) {
            error = err;
            attempt++;
            if (attempt > retries) {
                throw error;
            }
            // exponential backoff
            const backoff = delay * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, backoff));
        }
    }
    throw error;
};
exports.axiosWithRetry = axiosWithRetry;
