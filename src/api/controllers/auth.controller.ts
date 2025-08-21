import { Request, Response } from "express"
import { AuthService } from "../../services/auth.service"
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils"
import type {
  LoginRequestDTO,
  ExchangeTokenRequestDTO,
} from "../../types/dtos/auth.dto"

const authService = new AuthService()

export async function loginHandler(req: Request, res: Response) {
  try {
    const { auth_0_reference_id } = req.body as LoginRequestDTO
    const result = await authService.login(auth_0_reference_id)
    return sendSuccessResponse(res, result)
  } catch (error: any) {
    return sendErrorResponse(
      res,
      error.message,
      error.message === "User not found" ? 404 : 500
    )
  }
}

export async function exchangeTokenHandler(req: Request, res: Response) {
  try {
    const { code } = req.body as ExchangeTokenRequestDTO
    if (!code)
      return sendErrorResponse(res, "Authorization code is required", 400)

    const origin = req.get("origin") || `${req.protocol}://${req.get("host")}`
    const result = await authService.exchangeToken(code, origin)
    return sendSuccessResponse(res, result)
  } catch (error: any) {
    return sendErrorResponse(res, error.message, 400)
  }
}
