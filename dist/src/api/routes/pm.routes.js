"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const pm_dot_controller_1 = require("../controllers/pm.dot.controller");
const router = (0, express_1.Router)();
router.get("/preventiveMaintenance", (0, asyncHandler_1.asyncHandler)(pm_dot_controller_1.getPMsByAccounts));
router.get("/:pmScheduleId/detail", (0, asyncHandler_1.asyncHandler)(pm_dot_controller_1.getPMScheduleDetail));
exports.default = router;
