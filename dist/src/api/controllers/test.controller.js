"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAccounts = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const responseUtils_1 = require("../../utils/responseUtils");
const getAllAccounts = async (req, res) => {
    try {
        const selectedAccount = await database_config_1.default.account.findMany({});
        return (0, responseUtils_1.sendSuccessResponse)(res, {
            selectedAccountDetails: selectedAccount,
        });
    }
    catch (err) {
        console.error("getAllAccounts error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.getAllAccounts = getAllAccounts;
