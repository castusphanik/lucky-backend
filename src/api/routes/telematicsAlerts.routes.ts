// routes/telematicsAlerts.routes.ts
import { Router } from "express"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  createTelematicsAlert,
  getTelematicsAlert,
  updateTelematicsAlert,
  deleteTelematicsAlert,
  previewTelematicsAlert,
  getTelematicsAlertsByCustomer,
} from "../controllers/telematicsAlerts.controller"

const router = Router()

// Create
router.post("/", asyncHandler(createTelematicsAlert))

// Get alerts by customer_id
router.get("/", asyncHandler(getTelematicsAlertsByCustomer))
// Read (one)
router.get("/:id", asyncHandler(getTelematicsAlert))

// Update (partial)
router.patch("/:id", asyncHandler(updateTelematicsAlert))

// Soft delete
router.delete("/:id", asyncHandler(deleteTelematicsAlert))

// Preview (no DB write)
router.post("/preview", asyncHandler(previewTelematicsAlert))

export default router
