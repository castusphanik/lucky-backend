import { Router } from "express"
import { getAllAccounts } from "../controllers/test.controller"
import { asyncHandler } from "../../utils/asyncHandler"
import { jwtCheck, requirePermission } from "../middleware/auth0.middleware"
const router = Router()

// router.get(
//   "/getAllAccounts",
//   jwtCheck,
//   requireScope("read:dashboard"),
//   asyncHandler(getAllAccounts)
// )
router.get(
  "/getAllAccounts",
  ...requirePermission("read:dashboard"),
  asyncHandler(getAllAccounts)
)

export default router
