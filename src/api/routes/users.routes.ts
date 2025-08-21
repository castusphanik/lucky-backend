import { Router } from "express"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  getCurrentUser,
  fetchCustomers,
  createUser,
  getAllTenUsers,
  getCustomerDetailsAndAccountsByUserId,
  getCustomerUsersByAccountAssignment,
  downloadAllTenUsers,
  downloadCustomerUsersByAccountAssignment,
  getAllUsersByCustomerId,
  downloadCustomers,
  updateUser,
  createUserColumnPreference,
  deleteUser,
  getUserTablePreference,
} from "../controllers/users.controller"
import {
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  validateGetUsersByCustomerId,
  validateUserAndTableParams,
  createUserColumnPreferenceValidator,
  validateUserIdParam,
} from "../validators/user.validator"

import { withValidation } from "../middleware/validation.middleware"
import { paginateAndFilterAccountsQuery } from "../validators/common.validator"

const router = Router()

router.post(
  "/createUser",
  createUserValidator,
  withValidation([createUserValidator]),
  asyncHandler(createUser)
)

router.patch(
  "/update/:user_id",
  ...withValidation([updateUserValidator]),
  asyncHandler(updateUser)
)

router.delete(
  "/delete/:user_id",
  ...withValidation([deleteUserValidator]),
  asyncHandler(deleteUser)
)

router.get("/tenUsers", asyncHandler(getAllTenUsers))

router.get("/userDetails/:userId", asyncHandler(getCurrentUser))

router.get(
  "/tenCustomers",
  ...withValidation([paginateAndFilterAccountsQuery]),
  asyncHandler(fetchCustomers)
)

router.get(
  "/usersByCustomerId",
  ...withValidation([validateGetUsersByCustomerId]),
  asyncHandler(getAllUsersByCustomerId)
)

router.get(
  "/userCustomerDetailsAndAccounts/:userId",
  asyncHandler(getCustomerDetailsAndAccountsByUserId)
)

router.get(
  "/customerUsersByAssignedAccounts/:userId",

  asyncHandler(getCustomerUsersByAccountAssignment)
)

router.get(
  "/downloadAllTenUsers",

  asyncHandler(downloadAllTenUsers)
)

router.get(
  "/downloadCustomerUsersByAccountAssignment/:userId",
  asyncHandler(downloadCustomerUsersByAccountAssignment)
)

router.get("/downloadCustomers", asyncHandler(downloadCustomers))
router.post(
  "/userColumnPreferences",
  withValidation([createUserColumnPreferenceValidator]),
  asyncHandler(createUserColumnPreference)
)
router.get(
  "/getUserColumnPreference/:user_id/:table_name",
  withValidation(validateUserIdParam),
  asyncHandler(getUserTablePreference)
)

export default router
