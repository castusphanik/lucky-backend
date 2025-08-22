"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const account_controller_1 = require("../controllers/account.controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const account_validator_1 = require("../validators/account.validator");
const validation_middleware_1 = require("../middleware/validation.middleware");
const router = (0, express_1.Router)();
// unified validation error handler
router.get("/customerUserAccounts/:userId", 
// requirePermission([
//   "read:accounts",
//   "download:accounts",
//   "read:account-details",
// ]),
(0, validation_middleware_1.withValidation)([account_validator_1.validateUserIdParam, account_validator_1.paginateAndFilterAccountsQuery]), (0, asyncHandler_1.asyncHandler)(account_controller_1.getAccountsByUserId));
router.get("/accountLinkedUsers/:accountId", 
// requirePermission("read:account-details"),
(0, validation_middleware_1.withValidation)([account_validator_1.validateAccountIdParam, account_validator_1.paginateSecondaryContactsQuery]), (0, asyncHandler_1.asyncHandler)(account_controller_1.getSecondaryContacts));
router.get("/customerAccounts/:customerId", 
// requirePermission(["read:accounts", "download:accounts"]),
(0, validation_middleware_1.withValidation)([account_validator_1.validateCustomerIdParam, account_validator_1.paginateAndFilterAccountsQuery]), (0, asyncHandler_1.asyncHandler)(account_controller_1.fetchAccountsOfCustomer));
router.get("/AssignedAccountsDropdown/:customerId", 
// requirePermission(["read:accounts"]),
(0, validation_middleware_1.withValidation)([account_validator_1.validateCustomerIdParam]), (0, asyncHandler_1.asyncHandler)(account_controller_1.fetchAssignedAccountsDropdown));
router.get("/accountPrimaryContactAndRelated/:accountId", 
// requirePermission("read:account-details"),
(0, validation_middleware_1.withValidation)([account_validator_1.validateAccountIdParam]), (0, asyncHandler_1.asyncHandler)(account_controller_1.getAccountPrimaryContactAndRelated));
router.get("/userAccounts/:userId", 
// requirePermission("read:accounts"),
...(0, validation_middleware_1.withValidation)([account_validator_1.validateUserIdParam]), (0, asyncHandler_1.asyncHandler)(account_controller_1.getUserAccountsMinimal));
router.get("/downloadAccountsByUserId/:userId", 
// requirePermission("download:accounts"),
(0, validation_middleware_1.withValidation)([account_validator_1.validateUserIdParam, account_validator_1.paginateAndFilterAccountsQuery]), (0, asyncHandler_1.asyncHandler)(account_controller_1.downloadAccountsByUserId));
router.get("/downloadSecondaryContacts/:accountId", 
// requirePermission("download:accounts"),
(0, validation_middleware_1.withValidation)([account_validator_1.validateAccountIdParam, account_validator_1.paginateSecondaryContactsQuery]), (0, asyncHandler_1.asyncHandler)(account_controller_1.downloadSecondaryContacts));
exports.default = router;
