"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadSecondaryContacts = exports.downloadAccountsByUserId = exports.fetchAssignedAccountsDropdown = exports.getUserAccountsMinimal = exports.getAccountPrimaryContactAndRelated = exports.getSecondaryContacts = exports.getAccountsByUserId = exports.fetchAccountsOfCustomer = void 0;
const account_service_1 = require("../../services/account.service");
const responseUtils_1 = require("../../utils/responseUtils");
const coloumPrefrences_1 = require("../../utils/coloumPrefrences");
const accountService = new account_service_1.AccountService();
const fetchAccountsOfCustomer = async (req, res) => {
    try {
        const customerId = Number(req.params.customerId);
        if (!customerId || isNaN(customerId))
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid or missing customer ID", 400);
        const { data, total, page, perPage } = await accountService.fetchAccountsOfCustomer(customerId, req.query);
        let tablename = coloumPrefrences_1.column_preferences.account.customerAccounts;
        return (0, responseUtils_1.sendPaginatedResponse)(res, data, total, page, perPage, 200, {
            tablename,
        });
    }
    catch (err) {
        console.error("fetchAccountsOfCustomer error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.fetchAccountsOfCustomer = fetchAccountsOfCustomer;
const getAccountsByUserId = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (isNaN(userId) || userId <= 0)
            return (0, responseUtils_1.sendErrorResponse)(res, "Please provide a valid userId parameter.", 400);
        const { data, total, page, perPage } = await accountService.getAccountsByUserId(userId, req.query);
        let tableName = coloumPrefrences_1.column_preferences.account.customerUserAccounts;
        return (0, responseUtils_1.sendPaginatedResponse)(res, data, total, page, perPage, 200, {
            tableName,
        });
    }
    catch (err) {
        console.error("getAccountsByUserId error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.getAccountsByUserId = getAccountsByUserId;
const getSecondaryContacts = async (req, res) => {
    try {
        const accountId = Number(req.params.accountId);
        if (!accountId || isNaN(accountId))
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid or missing account ID", 400);
        const { data, total, page, perPage } = await accountService.getSecondaryContacts(accountId, req.query);
        return (0, responseUtils_1.sendPaginatedResponse)(res, data, total, page, perPage, undefined);
    }
    catch (err) {
        console.error("getSecondaryContacts error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.getSecondaryContacts = getSecondaryContacts;
const getAccountPrimaryContactAndRelated = async (req, res) => {
    try {
        const accountId = Number(req.params.accountId);
        if (!accountId || isNaN(accountId))
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid or missing account ID in params", 400);
        const customerId = req.user?.customer_id
            ? Number(req.user.customer_id)
            : undefined;
        const payload = await accountService.getAccountPrimaryContactAndRelated(accountId, customerId);
        return (0, responseUtils_1.sendSuccessResponse)(res, payload);
    }
    catch (err) {
        if (err?.message === "ACCOUNT_NOT_FOUND")
            return (0, responseUtils_1.sendErrorResponse)(res, "Account not found", 404);
        console.error("getAccountPrimaryContactAndRelated error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.getAccountPrimaryContactAndRelated = getAccountPrimaryContactAndRelated;
const getUserAccountsMinimal = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (isNaN(userId) || userId <= 0)
            return (0, responseUtils_1.sendErrorResponse)(res, "Please provide a valid userId parameter.", 400);
        let tablename = coloumPrefrences_1.column_preferences.account.userAccounts;
        const accounts = await accountService.getUserAccountsMinimal(userId);
        return (0, responseUtils_1.sendSuccessResponse)(res, accounts, tablename);
    }
    catch (err) {
        console.error("getUserAccountsMinimal error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.getUserAccountsMinimal = getUserAccountsMinimal;
const fetchAssignedAccountsDropdown = async (req, res) => {
    try {
        const customerId = req.query.customer_id
            ? Number(req.query.customer_id)
            : Number(req.params.customerId);
        if (!customerId || isNaN(customerId))
            return (0, responseUtils_1.sendErrorResponse)(res, "Missing or invalid 'customer_id'", 400);
        const data = await accountService.fetchAssignedAccountsDropdown(customerId);
        return (0, responseUtils_1.sendSuccessResponse)(res, data);
    }
    catch (err) {
        if (err?.message === "CUSTOMER_NOT_FOUND")
            return (0, responseUtils_1.sendErrorResponse)(res, "Customer not found", 404);
        console.error("fetchAssignedAccountsDropdown error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.fetchAssignedAccountsDropdown = fetchAssignedAccountsDropdown;
const downloadAccountsByUserId = async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (isNaN(userId) || userId <= 0)
            return (0, responseUtils_1.sendErrorResponse)(res, "Please provide a valid userId parameter.", 400);
        const { buffer, filename } = await accountService.downloadAccountsByUserId(userId, req.query);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.status(200).end(buffer);
    }
    catch (err) {
        if (err?.message === "USER_NOT_FOUND")
            return (0, responseUtils_1.sendErrorResponse)(res, "User not found.", 404);
        console.error("downloadAccountsByUserId error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.downloadAccountsByUserId = downloadAccountsByUserId;
const downloadSecondaryContacts = async (req, res) => {
    try {
        const accountId = Number(req.params.accountId);
        if (!accountId || isNaN(accountId))
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid or missing account ID", 400);
        const { buffer, filename } = await accountService.downloadSecondaryContacts(accountId, req.query);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.status(200).end(buffer);
    }
    catch (err) {
        if (err?.message === "ACCOUNT_NOT_FOUND")
            return (0, responseUtils_1.sendErrorResponse)(res, "Account not found", 404);
        console.error("downloadSecondaryContacts error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.downloadSecondaryContacts = downloadSecondaryContacts;
