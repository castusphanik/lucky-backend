"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserAndTableParams = exports.validateTableNameParam = exports.createUserColumnPreferenceValidator = exports.validateGetUsersByCustomerId = exports.validateUserIdParam = exports.deleteUserValidator = exports.updateUserValidator = exports.createUserValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createUserValidator = [
    (0, express_validator_1.body)("first_name").notEmpty().withMessage("First name is required"),
    (0, express_validator_1.body)("last_name").notEmpty().withMessage("Last name is required"),
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email is required"),
    (0, express_validator_1.body)("phone_number")
        .optional()
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage("Phone number must follow E.164 format"),
    (0, express_validator_1.body)("designation").optional().isString(),
    (0, express_validator_1.body)("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
    (0, express_validator_1.body)("status").isIn(["ACTIVE", "INACTIVE"]).withMessage("Invalid status"),
    (0, express_validator_1.body)("is_customer_user").isBoolean(),
    (0, express_validator_1.body)("user_role_id").isInt().withMessage("user_role_id must be an integer"),
    (0, express_validator_1.body)("customer_id").isInt().withMessage("customer_id must be an integer"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long"),
    (0, express_validator_1.body)("assigned_account_ids")
        .optional()
        .isArray()
        .withMessage("assigned_account_ids must be an array of integers"),
];
exports.updateUserValidator = [
    (0, express_validator_1.body)("first_name").optional().isString(),
    (0, express_validator_1.body)("last_name").optional().isString(),
    (0, express_validator_1.body)("email").optional().isEmail(),
    (0, express_validator_1.body)("phone_number")
        .optional()
        .matches(/^\+[1-9]\d{1,14}$/)
        .withMessage("Phone number must follow E.164 format"),
    (0, express_validator_1.body)("designation").optional().isString(),
    (0, express_validator_1.body)("avatar").optional().isURL(),
    (0, express_validator_1.body)("status").optional().isIn(["ACTIVE", "INACTIVE"]),
    (0, express_validator_1.body)("is_customer_user").optional().isBoolean(),
    (0, express_validator_1.body)("user_role_id").optional().isInt(),
    (0, express_validator_1.body)("customer_id").optional().isInt(),
    (0, express_validator_1.body)("password").optional().isLength({ min: 8 }),
    (0, express_validator_1.body)("assigned_account_ids").optional().isArray(),
];
exports.deleteUserValidator = [
    (0, express_validator_1.param)("user_id").isInt().withMessage("user_id must be an integer"),
];
exports.validateUserIdParam = [
    (0, express_validator_1.param)("user_id")
        .isInt({ gt: 0 })
        .withMessage("userId must be a positive integer"),
];
exports.validateGetUsersByCustomerId = [
    (0, express_validator_1.query)("customer_id")
        .exists()
        .withMessage("customer_id is required")
        .isInt({ gt: 0 })
        .withMessage("customer_id must be a positive integer"),
];
exports.createUserColumnPreferenceValidator = [
    (0, express_validator_1.body)("user_id")
        .notEmpty()
        .withMessage("user_id is required")
        .isString()
        .withMessage("user_id must be a string"),
    (0, express_validator_1.body)("table_name")
        .notEmpty()
        .withMessage("table_name is required")
        .isString()
        .withMessage("table_name must be a string"),
    (0, express_validator_1.body)("selected_columns")
        .isArray({ min: 1 })
        .withMessage("selected_columns must be a non-empty array")
        .custom((columns) => {
        if (!columns.every((col) => typeof col === "string")) {
            throw new Error("All selected_columns must be strings");
        }
        return true;
    }),
];
// export const validateUserIdParam = [
//   param("user_id").isNumeric().withMessage("user_id must be a number"),
// ]
exports.validateTableNameParam = [
    (0, express_validator_1.param)("table_name")
        .notEmpty()
        .withMessage("table_name parameter is required")
        .isString()
        .withMessage("table_name must be a valid string"),
];
exports.validateUserAndTableParams = [
    (0, express_validator_1.param)("user_id")
        .notEmpty()
        .withMessage("user_id parameter is required")
        .isNumeric()
        .withMessage("user_id must be a number"),
    (0, express_validator_1.param)("table_name")
        .notEmpty()
        .withMessage("table_name parameter is required")
        .isString()
        .withMessage("table_name must be a valid string"),
];
