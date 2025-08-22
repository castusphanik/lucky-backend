"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
exports.generateToken = generateToken;
exports.decodeJwtPayload = decodeJwtPayload;
exports.normalizeDomain = normalizeDomain;
exports.getAuth0Config = getAuth0Config;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
/**
 * Generates a JWT token
 */
function generateToken(payload, expiresIn = "24h") {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn });
}
/**
 * Verifies and decodes a JWT token
 */
const verifyToken = (token) => {
    let response;
    let error = { name: "", message: "" };
    try {
        response = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        error = {
            name: "authentication error",
            message: err?.message,
        };
    }
    return { response, error };
};
exports.verifyToken = verifyToken;
// src/utils/authUtils.ts
function decodeJwtPayload(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const jsonPayload = Buffer.from(padded, "base64").toString("utf8");
        return JSON.parse(jsonPayload);
    }
    catch {
        return null;
    }
}
function normalizeDomain(domain) {
    let normalized = domain.startsWith("http") ? domain : `https://${domain}`;
    normalized = normalized.replace(/\/$/, "");
    return normalized;
}
function getAuth0Config() {
    const domainEnv = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const redirectUri = process.env.AUTH0_REDIRECT_URI;
    if (!domainEnv || !clientId || !clientSecret || !redirectUri) {
        throw new Error("One or more Auth0 environment variables are missing");
    }
    return {
        domain: normalizeDomain(domainEnv),
        clientId,
        clientSecret,
        redirectUri,
    };
}
