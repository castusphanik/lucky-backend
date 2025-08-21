import { Router } from "express"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  getPMsByAccounts,
  getPMScheduleDetail,
} from "../controllers/pm.dot.controller"

const router = Router()

router.get("/preventiveMaintenance", asyncHandler(getPMsByAccounts))
router.get("/:pmScheduleId/detail", asyncHandler(getPMScheduleDetail))

export default router
