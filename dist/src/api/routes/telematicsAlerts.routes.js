"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/telematicsAlerts.routes.ts
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const telematicsAlerts_controller_1 = require("../controllers/telematicsAlerts.controller");
const router = (0, express_1.Router)();
// Create
router.post("/", (0, asyncHandler_1.asyncHandler)(telematicsAlerts_controller_1.createTelematicsAlert));
// Get alerts by customer_id
router.get("/", (0, asyncHandler_1.asyncHandler)(telematicsAlerts_controller_1.getTelematicsAlertsByCustomer));
// Read (one)
router.get("/:id", (0, asyncHandler_1.asyncHandler)(telematicsAlerts_controller_1.getTelematicsAlert));
// Update (partial)
router.patch("/:id", (0, asyncHandler_1.asyncHandler)(telematicsAlerts_controller_1.updateTelematicsAlert));
// Soft delete
router.delete("/:id", (0, asyncHandler_1.asyncHandler)(telematicsAlerts_controller_1.deleteTelematicsAlert));
// Preview (no DB write)
router.post("/preview", (0, asyncHandler_1.asyncHandler)(telematicsAlerts_controller_1.previewTelematicsAlert));
exports.default = router;
