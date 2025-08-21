import jwt, { Secret, SignOptions } from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET as Secret

/**
 * Generates a JWT token
 */
export function generateToken(
  payload: object,
  expiresIn: string | number = "24h"
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as SignOptions)
}

/**
 * Verifies and decodes a JWT token
 */
export const verifyToken = (token: string) => {
  let response: unknown
  let error: { name: string; message: string } = { name: "", message: "" }
  try {
    response = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    error = {
      name: "authentication error",
      message: (err as Error)?.message,
    }
  }
  return { response, error }
}

// src/utils/authUtils.ts

export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    )
    const jsonPayload = Buffer.from(padded, "base64").toString("utf8")
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function normalizeDomain(domain: string): string {
  let normalized = domain.startsWith("http") ? domain : `https://${domain}`
  normalized = normalized.replace(/\/$/, "")
  return normalized
}

export function getAuth0Config() {
  const domainEnv = process.env.AUTH0_DOMAIN
  const clientId = process.env.AUTH0_CLIENT_ID
  const clientSecret = process.env.AUTH0_CLIENT_SECRET
  const redirectUri = process.env.AUTH0_REDIRECT_URI

  if (!domainEnv || !clientId || !clientSecret || !redirectUri) {
    throw new Error("One or more Auth0 environment variables are missing")
  }

  return {
    domain: normalizeDomain(domainEnv),
    clientId,
    clientSecret,
    redirectUri,
  }
}
