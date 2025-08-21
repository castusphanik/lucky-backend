import { Router } from "express"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  getListView,
  getMapView,
  getEquipmentDetails,
  getEquipmentCounts,
  downloadListView,
} from "../controllers/fleet.view.controller"

const router = Router()

router.get("/getListView", asyncHandler(getListView))
router.get("/getMapView", asyncHandler(getMapView))
router.get("/getEquipmentDetails", asyncHandler(getEquipmentDetails))
router.get("/getEquipmentCounts", asyncHandler(getEquipmentCounts))
router.get("/downloadListView", asyncHandler(downloadListView))
export default router
