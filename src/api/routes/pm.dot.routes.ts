import { Router } from "express"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  exportDOTInspectionsExcel,
  exportPMsByAccountsExcel,
  getDOTInspectionsByAccounts,
  getPMsByAccounts,
  getPMScheduleDetail,
} from "../controllers/pm.dot.controller"

const router = Router()

router.get("/preventiveMaintenance", asyncHandler(getPMsByAccounts))
router.get("/:pmScheduleId/detail", asyncHandler(getPMScheduleDetail))
router.get("/dotInspections", asyncHandler(getDOTInspectionsByAccounts))
router.get("/dotInspections/export", asyncHandler(exportDOTInspectionsExcel))
router.get(
  "/preventiveMaintenance/export",
  asyncHandler(exportPMsByAccountsExcel)
)

export default router
