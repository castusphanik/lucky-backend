"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const serviceRequest_controller_1 = require("../controllers/serviceRequest.controller");
const router = (0, express_1.Router)();
router.post("/", (0, asyncHandler_1.asyncHandler)(serviceRequest_controller_1.createServiceRequest));
exports.default = router;
