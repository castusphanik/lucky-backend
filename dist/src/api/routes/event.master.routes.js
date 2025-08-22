"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const event_master_controller_1 = require("../controllers/event.master.controller");
const router = (0, express_1.Router)();
// POST -> create new event master
router.post("/", (0, asyncHandler_1.asyncHandler)(event_master_controller_1.createEventMaster));
router.get("/", (0, asyncHandler_1.asyncHandler)(event_master_controller_1.getAllEventMasters));
exports.default = router;
