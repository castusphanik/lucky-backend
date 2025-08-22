"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeTokenValidator = exports.loginValidator = void 0;
const express_validator_1 = require("express-validator");
exports.loginValidator = [
    (0, express_validator_1.body)("auth_0_reference_id").isString().notEmpty(),
];
exports.exchangeTokenValidator = [(0, express_validator_1.body)("code").isString().notEmpty()];
