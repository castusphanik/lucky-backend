import { Request, Response, NextFunction } from "express"
import _ from "lodash"
import { verifyToken } from "../../utils/authUtils" // Assuming this returns { response, error }
import { sendErrorResponse } from "../../utils/responseUtils"

export enum Role {
  SuperAdmin = "SuperAdmin",
  TenAdmin = "TenAdmin",
  AccountAdmin = "AccountAdmin",
  AccountUser = "AccountUser",
}

interface DecodedUser {
  user_id: string
  user_role: Role
  customer_id?: string
  account_id?: string
}

// Extending Express Request type to include `user`
declare module "express-serve-static-core" {
  interface Request {
    user?: DecodedUser
  }
}

export const authMiddleware =
  (allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader) {
        return sendErrorResponse(res, "Unauthorized - No token provided", 401)
      }
      const token = authHeader.split(" ")[1]
      const { response: decoded, error } = verifyToken(token)

      if (_.get(error, "message") && _.get(error, "name")) {
        return sendErrorResponse(
          res,
          `Unauthorized - ${error.name}: ${error.message}`,
          401
        )
      }

      const userRole = _.get(decoded, "user_role", "PUBLIC") as Role
      if (!allowedRoles.includes(userRole)) {
        return sendErrorResponse(
          res,
          `Forbidden - User role '${userRole}' is not allowed to access this resource`,
          403
        )

        return
      }

      req.user = decoded as DecodedUser
      next()
    } catch (error) {
      return sendErrorResponse(
        res,
        `Internal server error: ${(error as Error).message}`,
        500
      )
    }
  }
