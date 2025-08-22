"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const test_controller_1 = require("../controllers/test.controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const auth0_middleware_1 = require("../middleware/auth0.middleware");
const router = (0, express_1.Router)();
// router.get(
//   "/getAllAccounts",
//   jwtCheck,
//   requireScope("read:dashboard"),
//   asyncHandler(getAllAccounts)
// )
router.get("/getAllAccounts", ...(0, auth0_middleware_1.requirePermission)("read:dashboard"), (0, asyncHandler_1.asyncHandler)(test_controller_1.getAllAccounts));
exports.default = router;
