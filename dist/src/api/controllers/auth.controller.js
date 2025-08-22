"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = loginHandler;
exports.exchangeTokenHandler = exchangeTokenHandler;
const auth_service_1 = require("../../services/auth.service");
const responseUtils_1 = require("../../utils/responseUtils");
const authService = new auth_service_1.AuthService();
async function loginHandler(req, res) {
    try {
        const { auth_0_reference_id } = req.body;
        const result = await authService.login(auth_0_reference_id);
        return (0, responseUtils_1.sendSuccessResponse)(res, result);
    }
    catch (error) {
        return (0, responseUtils_1.sendErrorResponse)(res, error.message, error.message === "User not found" ? 404 : 500);
    }
}
async function exchangeTokenHandler(req, res) {
    try {
        const { code } = req.body;
        if (!code)
            return (0, responseUtils_1.sendErrorResponse)(res, "Authorization code is required", 400);
        const origin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
        const result = await authService.exchangeToken(code, origin);
        return (0, responseUtils_1.sendSuccessResponse)(res, result);
    }
    catch (error) {
        return (0, responseUtils_1.sendErrorResponse)(res, error.message, 400);
    }
}
