"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/modules/auth/services/auth.service.ts
const database_config_1 = __importDefault(require("../config/database.config"));
const axios_1 = __importDefault(require("axios"));
const authUtils_1 = require("../utils/authUtils");
class AuthService {
    async login(auth_0_reference_id) {
        const user = await database_config_1.default.user.findUnique({
            where: { auth_0_reference_id },
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
                status: true,
                user_role_id: true,
                auth_0_reference_id: true,
                customer_id: true,
                assigned_account_ids: true,
                user_role_ref: { select: { name: true } },
            },
        });
        if (!user)
            throw new Error("User not found");
        const token = (0, authUtils_1.generateToken)({
            user_id: user.user_id,
            user_role: user.user_role_ref?.name,
            customer_id: user.customer_id,
        }, "24h");
        const { user_role_ref, ...userData } = user;
        return {
            user: { ...userData, role: user_role_ref?.name ?? null },
            token,
        };
    }
    async exchangeToken(code, origin) {
        const { domain, clientId, clientSecret } = (0, authUtils_1.getAuth0Config)();
        const redirectUri = `${origin}/verify`;
        const tokenEndpoint = `${domain}/oauth/token`;
        const params = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
        });
        const tokenResponse = await axios_1.default.post(tokenEndpoint, params.toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        const tokens = tokenResponse.data;
        let userInfo = null;
        try {
            const userInfoResponse = await axios_1.default.get(`${domain}/userinfo`, {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            userInfo = userInfoResponse.data;
        }
        catch {
            if (tokens.id_token) {
                const decoded = (0, authUtils_1.decodeJwtPayload)(tokens.id_token);
                if (decoded?.sub) {
                    userInfo = {
                        sub: decoded.sub,
                        email: decoded.email,
                        name: decoded.name,
                        picture: decoded.picture,
                    };
                }
            }
        }
        if (!userInfo?.sub)
            throw new Error("Unable to determine user ID from token");
        const user = await database_config_1.default.user.findUnique({
            where: { auth_0_reference_id: userInfo.sub },
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
                status: true,
                user_role_id: true,
                auth_0_reference_id: true,
                customer_id: true,
                assigned_account_ids: true,
                user_role_ref: { select: { name: true } },
            },
        });
        if (!user)
            throw new Error("User not found");
        const jwtToken = (0, authUtils_1.generateToken)({
            user_id: user.user_id,
            user_role: user.user_role_ref?.name,
            customer_id: user.customer_id,
        }, "24h");
        const { user_role_ref, ...userData } = user;
        return {
            user: { ...userData, role: user_role_ref?.name ?? null },
            token: jwtToken,
            auth0_token: tokens.access_token,
        };
    }
}
exports.AuthService = AuthService;
