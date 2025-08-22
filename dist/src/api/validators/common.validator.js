"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginateAndFilterAccountsQuery = void 0;
const express_validator_1 = require("express-validator");
exports.paginateAndFilterAccountsQuery = [
    (0, express_validator_1.query)("page").optional().isInt({ min: 1 }),
    (0, express_validator_1.query)("perPage").optional().isInt({ min: 1, max: 200 }),
];
