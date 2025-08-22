"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateSecondaryContactsQuery = exports.paginateAndFilterAccountsQuery = exports.validateAccountIdParam = exports.validateUserIdParam = exports.validateCustomerIdParam = void 0;
// ──────────────────────────────────────────────────────────────────────────────
const express_validator_1 = require("express-validator");
exports.validateCustomerIdParam = [
    (0, express_validator_1.param)("customerId")
        .isInt({ gt: 0 })
        .withMessage("customerId must be a positive integer"),
];
exports.validateUserIdParam = [
    (0, express_validator_1.param)("userId")
        .isInt({ gt: 0 })
        .withMessage("userId must be a positive integer"),
];
exports.validateAccountIdParam = [
    (0, express_validator_1.param)("accountId")
        .isInt({ gt: 0 })
        .withMessage("accountId must be a positive integer"),
];
exports.paginateAndFilterAccountsQuery = [
    (0, express_validator_1.query)("page").optional().isInt({ min: 1 }),
    (0, express_validator_1.query)("perPage").optional().isInt({ min: 1, max: 200 }),
    (0, express_validator_1.query)("account_name").optional().isString(),
    (0, express_validator_1.query)("account_number").optional().isString(),
    (0, express_validator_1.query)("legacy_account_number").optional().isString(),
    (0, express_validator_1.query)("account_type").optional().isString(),
    (0, express_validator_1.query)("account_manager_id").optional().isInt({ min: 1 }),
    (0, express_validator_1.query)("status").optional().isString(),
    (0, express_validator_1.query)("country_lookup_id").optional().isInt({ min: 1 }),
    (0, express_validator_1.query)("number_of_users").optional().isInt({ min: 0 }),
    (0, express_validator_1.query)("is_deleted").optional().isBoolean().toBoolean(),
];
exports.paginateSecondaryContactsQuery = [
    (0, express_validator_1.query)("page").optional().isInt({ min: 1 }),
    (0, express_validator_1.query)("perPage").optional().isInt({ min: 1, max: 200 }),
    (0, express_validator_1.query)("first_name").optional().isString(),
    (0, express_validator_1.query)("last_name").optional().isString(),
    (0, express_validator_1.query)("email").optional().isString(),
    (0, express_validator_1.query)("designation").optional().isString(),
    (0, express_validator_1.query)("status").optional().isString(),
    (0, express_validator_1.query)("phone_number").optional().isString(),
];
