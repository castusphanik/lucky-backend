"use strict";
// import { RequestHandler } from "express"
// import { auth } from "express-oauth2-jwt-bearer"
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.jwtCheck = void 0;
const express_oauth2_jwt_bearer_1 = require("express-oauth2-jwt-bearer");
exports.jwtCheck = (0, express_oauth2_jwt_bearer_1.auth)({
    audience: "https://ten-customer-portal.com",
    issuerBaseURL: process.env.AUTH0_DOMAIN,
    tokenSigningAlg: "RS256",
});
const requirePermission = (requiredPermissions) => {
    const checkPermission = (req, res, next) => {
        const userPermissions = req.auth?.payload?.permissions ?? [];
        const requiredArray = Array.isArray(requiredPermissions)
            ? requiredPermissions
            : [requiredPermissions];
        // Check that user has *all* required permissions
        const hasAll = requiredArray.every((perm) => userPermissions.includes(perm));
        if (hasAll)
            return next();
        res.status(403).json({
            message: `Insufficient permissions. Required: ${requiredArray.join(", ")}`,
        });
        return;
    };
    return [exports.jwtCheck, checkPermission];
};
exports.requirePermission = requirePermission;
