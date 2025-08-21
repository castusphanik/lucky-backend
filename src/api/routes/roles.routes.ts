import { Router } from "express"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  createUserRole,
  removeRolePermissions,
  editUserRole,
  getUserRoleById,
  getUserRolesByCustomerId,
} from "../controllers/roles.controller"

const router = Router()

router.post("/createRole", asyncHandler(createUserRole))
router.get(
  "/customerRoles/:customer_id",
  asyncHandler(getUserRolesByCustomerId)
)
router.put("/editUserRole", asyncHandler(editUserRole))
router.get("/getUserRoleById/:role_id", asyncHandler(getUserRoleById))
router.delete("/:id/removeRolePermissions", asyncHandler(removeRolePermissions))
export default router
