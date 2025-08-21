import { Request, Response } from "express"
import prisma from "../../config/database.config"
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../../utils/responseUtils"

export const getAllAccounts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const selectedAccount = await prisma.account.findMany({})
    return sendSuccessResponse(res, {
      selectedAccountDetails: selectedAccount,
    })
  } catch (err) {
    console.error("getAllAccounts error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}
