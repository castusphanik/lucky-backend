import { Router } from "express"
import {
  fetchAccountsOfCustomer,
  getAccountsByUserId,
  getSecondaryContacts,
  getAccountPrimaryContactAndRelated,
  getUserAccountsMinimal,
  downloadAccountsByUserId,
  downloadSecondaryContacts,
  fetchAssignedAccountsDropdown,
} from "../controllers/account.controller"
import { asyncHandler } from "../../utils/asyncHandler"
import { requirePermission } from "../middleware/auth0.middleware"
import {
  validateAccountIdParam,
  validateCustomerIdParam,
  validateUserIdParam,
  paginateAndFilterAccountsQuery,
  paginateSecondaryContactsQuery,
} from "../validators/account.validator"
import { validationResult } from "express-validator"
import { withValidation } from "../middleware/validation.middleware"

const router = Router()

// unified validation error handler

router.get(
  "/customerUserAccounts/:userId",

  // requirePermission([
  //   "read:accounts",
  //   "download:accounts",
  //   "read:account-details",
  // ]),
  withValidation([validateUserIdParam, paginateAndFilterAccountsQuery]),
  asyncHandler(getAccountsByUserId)
)

router.get(
  "/accountLinkedUsers/:accountId",
  // requirePermission("read:account-details"),
  withValidation([validateAccountIdParam, paginateSecondaryContactsQuery]),
  asyncHandler(getSecondaryContacts)
)

router.get(
  "/customerAccounts/:customerId",
  // requirePermission(["read:accounts", "download:accounts"]),
  withValidation([validateCustomerIdParam, paginateAndFilterAccountsQuery]),
  asyncHandler(fetchAccountsOfCustomer)
)

router.get(
  "/AssignedAccountsDropdown/:customerId",
  // requirePermission(["read:accounts"]),
  withValidation([validateCustomerIdParam]),
  asyncHandler(fetchAssignedAccountsDropdown)
)

router.get(
  "/accountPrimaryContactAndRelated/:accountId",
  // requirePermission("read:account-details"),
  withValidation([validateAccountIdParam]),
  asyncHandler(getAccountPrimaryContactAndRelated)
)

router.get(
  "/userAccounts/:userId",
  // requirePermission("read:accounts"),
  ...withValidation([validateUserIdParam]),
  asyncHandler(getUserAccountsMinimal)
)

router.get(
  "/downloadAccountsByUserId/:userId",
  // requirePermission("download:accounts"),
  withValidation([validateUserIdParam, paginateAndFilterAccountsQuery]),
  asyncHandler(downloadAccountsByUserId)
)

router.get(
  "/downloadSecondaryContacts/:accountId",
  // requirePermission("download:accounts"),
  withValidation([validateAccountIdParam, paginateSecondaryContactsQuery]),
  asyncHandler(downloadSecondaryContacts)
)

export default router
