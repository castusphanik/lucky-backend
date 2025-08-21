// import { RequestHandler } from "express"
// import { auth } from "express-oauth2-jwt-bearer"

// // 1. Auth0 JWT validation
// export const jwtCheck = auth({
//   audience: "https://ten-customer-portal.com",
//   issuerBaseURL: process.env.AUTH0_DOMAIN,
//   tokenSigningAlg: "RS256",
// })

// // 2. Extend Express Request type
// declare module "express-serve-static-core" {
//   interface Request {
//     auth?: {
//       payload?: {
//         scope?: string
//         permissions?: string[]
//       }
//       [key: string]: unknown
//     }
//   }
// }

// // 3. Permission middleware (typed as RequestHandler)
// export const requirePermission = (permission: string): RequestHandler[] => {
//   const checkPermission: RequestHandler = (req, res, next) => {
//     const permissions: string[] = req.auth?.payload?.permissions ?? []
//     if (permissions.includes(permission)) {
//       return next()
//     }
//     res.status(403).json({
//       message: "Insufficient permissions",
//       // required: permission,
//       // given: permissions,
//     })
//     return
//   }

//   return [jwtCheck, checkPermission]
// }

import { RequestHandler } from "express"
import { auth } from "express-oauth2-jwt-bearer"

export const jwtCheck = auth({
  audience: "https://ten-customer-portal.com",
  issuerBaseURL: process.env.AUTH0_DOMAIN,
  tokenSigningAlg: "RS256",
})

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      payload?: {
        scope?: string
        permissions?: string[]
      }
      [key: string]: unknown
    }
    // user?: { customer_id?: number | string }
  }
}

export const requirePermission = (
  requiredPermissions: string | string[]
): RequestHandler[] => {
  const checkPermission: RequestHandler = (req, res, next) => {
    const userPermissions: string[] = req.auth?.payload?.permissions ?? []

    const requiredArray = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions]

    // Check that user has *all* required permissions
    const hasAll = requiredArray.every((perm) => userPermissions.includes(perm))

    if (hasAll) return next()

    res.status(403).json({
      message: `Insufficient permissions. Required: ${requiredArray.join(
        ", "
      )}`,
    })
    return
  }

  return [jwtCheck, checkPermission]
}
