import { Request, Response } from "express"
import { AccountService } from "../../services/account.service"
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendPaginatedResponse,
} from "../../utils/responseUtils"
import { column_preferences } from "../../utils/coloumPrefrences"

const accountService = new AccountService()

export const fetchAccountsOfCustomer = async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.params.customerId)
    if (!customerId || isNaN(customerId))
      return sendErrorResponse(res, "Invalid or missing customer ID", 400)

    const { data, total, page, perPage } =
      await accountService.fetchAccountsOfCustomer(customerId, req.query as any)
    let tablename = column_preferences.account.customerAccounts
    return sendPaginatedResponse(res, data, total, page, perPage, 200, {
      tablename,
    })
  } catch (err) {
    console.error("fetchAccountsOfCustomer error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const getAccountsByUserId = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId)
    if (isNaN(userId) || userId <= 0)
      return sendErrorResponse(
        res,
        "Please provide a valid userId parameter.",
        400
      )

    const { data, total, page, perPage } =
      await accountService.getAccountsByUserId(userId, req.query as any)
    let tableName = column_preferences.account.customerUserAccounts
    return sendPaginatedResponse(res, data, total, page, perPage, 200, {
      tableName,
    })
  } catch (err) {
    console.error("getAccountsByUserId error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const getSecondaryContacts = async (req: Request, res: Response) => {
  try {
    const accountId = Number(req.params.accountId)
    if (!accountId || isNaN(accountId))
      return sendErrorResponse(res, "Invalid or missing account ID", 400)

    const { data, total, page, perPage } =
      await accountService.getSecondaryContacts(accountId, req.query as any)
    return sendPaginatedResponse(res, data, total, page, perPage, undefined)
  } catch (err) {
    console.error("getSecondaryContacts error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const getAccountPrimaryContactAndRelated = async (
  req: Request,
  res: Response
) => {
  try {
    const accountId = Number(req.params.accountId)
    if (!accountId || isNaN(accountId))
      return sendErrorResponse(
        res,
        "Invalid or missing account ID in params",
        400
      )

    const customerId = req.user?.customer_id
      ? Number(req.user.customer_id)
      : undefined
    const payload = await accountService.getAccountPrimaryContactAndRelated(
      accountId,
      customerId
    )
    return sendSuccessResponse(res, payload)
  } catch (err: any) {
    if (err?.message === "ACCOUNT_NOT_FOUND")
      return sendErrorResponse(res, "Account not found", 404)
    console.error("getAccountPrimaryContactAndRelated error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const getUserAccountsMinimal = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId)
    if (isNaN(userId) || userId <= 0)
      return sendErrorResponse(
        res,
        "Please provide a valid userId parameter.",
        400
      )
    let tablename = column_preferences.account.userAccounts
    const accounts = await accountService.getUserAccountsMinimal(userId)
    return sendSuccessResponse(res, accounts, tablename)
  } catch (err) {
    console.error("getUserAccountsMinimal error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const fetchAssignedAccountsDropdown = async (
  req: Request,
  res: Response
) => {
  try {
    const customerId = req.query.customer_id
      ? Number(req.query.customer_id)
      : Number(req.params.customerId)
    if (!customerId || isNaN(customerId))
      return sendErrorResponse(res, "Missing or invalid 'customer_id'", 400)

    const data = await accountService.fetchAssignedAccountsDropdown(customerId)
    return sendSuccessResponse(res, data)
  } catch (err: any) {
    if (err?.message === "CUSTOMER_NOT_FOUND")
      return sendErrorResponse(res, "Customer not found", 404)
    console.error("fetchAssignedAccountsDropdown error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const downloadAccountsByUserId = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId)
    if (isNaN(userId) || userId <= 0)
      return sendErrorResponse(
        res,
        "Please provide a valid userId parameter.",
        400
      )

    const { buffer, filename } = await accountService.downloadAccountsByUserId(
      userId,
      req.query as any
    )

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`)

    res.status(200).end(buffer)
  } catch (err: any) {
    if (err?.message === "USER_NOT_FOUND")
      return sendErrorResponse(res, "User not found.", 404)
    console.error("downloadAccountsByUserId error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

export const downloadSecondaryContacts = async (
  req: Request,
  res: Response
) => {
  try {
    const accountId = Number(req.params.accountId)
    if (!accountId || isNaN(accountId))
      return sendErrorResponse(res, "Invalid or missing account ID", 400)

    const { buffer, filename } = await accountService.downloadSecondaryContacts(
      accountId,
      req.query as any
    )

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`)
    res.status(200).end(buffer)
  } catch (err: any) {
    if (err?.message === "ACCOUNT_NOT_FOUND")
      return sendErrorResponse(res, "Account not found", 404)
    console.error("downloadSecondaryContacts error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}
