import { Router } from "express"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  createGeofenceCtrl,
  fetchGeofencesByCustAndAccIdsCtrl,
  getGeofenceByCustIdCtrl,
  getGeofenceByIdCtrl,
  toggleGeofenceStatus,
  updateGeofenceCtrl,
} from "../controllers/geofence.controller" // adjust path as needed

const router = Router()

router.post("/", asyncHandler(createGeofenceCtrl))

// Add this in your routes file
router.patch("/:id", asyncHandler(updateGeofenceCtrl))

// router.get("/accId/:accIds", asyncHandler(fetchGeofencesByAccIdCtrl));
router.get(
  "/customer_id/:customer_id/account_ids/:account_ids",
  asyncHandler(fetchGeofencesByCustAndAccIdsCtrl)
)

router.get("/:id", asyncHandler(getGeofenceByIdCtrl))
router.get("/custId/:custId", asyncHandler(getGeofenceByCustIdCtrl))

router.patch(
  "/toggle-status/:geofence_account_id",
  asyncHandler(toggleGeofenceStatus)
)

export default router
