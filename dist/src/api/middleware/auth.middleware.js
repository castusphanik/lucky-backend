"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.Role = void 0;
const lodash_1 = __importDefault(require("lodash"));
const authUtils_1 = require("../../utils/authUtils"); // Assuming this returns { response, error }
const responseUtils_1 = require("../../utils/responseUtils");
var Role;
(function (Role) {
    Role["SuperAdmin"] = "SuperAdmin";
    Role["TenAdmin"] = "TenAdmin";
    Role["AccountAdmin"] = "AccountAdmin";
    Role["AccountUser"] = "AccountUser";
})(Role || (exports.Role = Role = {}));
const authMiddleware = (allowedRoles) => (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Unauthorized - No token provided", 401);
        }
        const token = authHeader.split(" ")[1];
        const { response: decoded, error } = (0, authUtils_1.verifyToken)(token);
        if (lodash_1.default.get(error, "message") && lodash_1.default.get(error, "name")) {
            return (0, responseUtils_1.sendErrorResponse)(res, `Unauthorized - ${error.name}: ${error.message}`, 401);
        }
        const userRole = lodash_1.default.get(decoded, "user_role", "PUBLIC");
        if (!allowedRoles.includes(userRole)) {
            return (0, responseUtils_1.sendErrorResponse)(res, `Forbidden - User role '${userRole}' is not allowed to access this resource`, 403);
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return (0, responseUtils_1.sendErrorResponse)(res, `Internal server error: ${error.message}`, 500);
    }
};
exports.authMiddleware = authMiddleware;
