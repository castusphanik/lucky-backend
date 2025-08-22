"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const geofence_controller_1 = require("../controllers/geofence.controller"); // adjust path as needed
const router = (0, express_1.Router)();
router.post("/", (0, asyncHandler_1.asyncHandler)(geofence_controller_1.createGeofenceCtrl));
// Add this in your routes file
router.patch("/:id", (0, asyncHandler_1.asyncHandler)(geofence_controller_1.updateGeofenceCtrl));
// router.get("/accId/:accIds", asyncHandler(fetchGeofencesByAccIdCtrl));
router.get("/customer_id/:customer_id/account_ids/:account_ids", (0, asyncHandler_1.asyncHandler)(geofence_controller_1.fetchGeofencesByCustAndAccIdsCtrl));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(geofence_controller_1.getGeofenceByIdCtrl));
router.get("/custId/:custId", (0, asyncHandler_1.asyncHandler)(geofence_controller_1.getGeofenceByCustIdCtrl));
router.patch("/toggle-status/:geofence_account_id", (0, asyncHandler_1.asyncHandler)(geofence_controller_1.toggleGeofenceStatus));
exports.default = router;
