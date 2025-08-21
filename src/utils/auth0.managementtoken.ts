import axios, { AxiosRequestConfig } from "axios"

export async function getManagementToken(): Promise<string> {
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

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
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

export const axiosWithRetry = async (
  config: AxiosRequestConfig,
  retries = 3,
  delay = 500
): Promise<any> => {
  let attempt = 0
  let error: any

  while (attempt <= retries) {
    try {
      const res = await axios(config)
      return res.data
    } catch (err: any) {
      error = err
      attempt++

      if (attempt > retries) {
        throw error
      }

      // exponential backoff
      const backoff = delay * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, backoff))
    }
  }

  throw error
}
