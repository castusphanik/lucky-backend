"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tagLookup_controller_1 = require("../controllers/tagLookup.controller"); // adjust path
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.post("/", (0, asyncHandler_1.asyncHandler)(tagLookup_controller_1.createTagLookup));
router.get("/", (0, asyncHandler_1.asyncHandler)(tagLookup_controller_1.fetchTagLookups));
router.get("/:id", (0, asyncHandler_1.asyncHandler)(tagLookup_controller_1.getTagLookupById));
router.patch("/:id", (0, asyncHandler_1.asyncHandler)(tagLookup_controller_1.updateTagLookup));
// router.delete("/:id", deleteTagLookup);
exports.default = router;
