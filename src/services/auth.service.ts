// src/modules/auth/services/auth.service.ts
import prisma from "../config/database.config"
import axios from "axios"
import {
  generateToken,
  decodeJwtPayload,
  getAuth0Config,
} from "../utils/authUtils"
import type {
  LoginResponseDTO,
  ExchangeTokenResponseDTO,
  Auth0Tokens,
  UserInfo,
} from "../types/dtos/auth.dto"

export class AuthService {
  async login(auth_0_reference_id: string): Promise<LoginResponseDTO> {
    const user = await prisma.user.findUnique({
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
    })

    if (!user) throw new Error("User not found")

    const token = generateToken(
      {
        user_id: user.user_id,
        user_role: user.user_role_ref?.name,
        customer_id: user.customer_id,
      },
      "24h"
    )

    const { user_role_ref, ...userData } = user

    return {
      user: { ...userData, role: user_role_ref?.name ?? null },
      token,
    }
  }

  async exchangeToken(
    code: string,
    origin: string
  ): Promise<ExchangeTokenResponseDTO> {
    const { domain, clientId, clientSecret } = getAuth0Config()

    const redirectUri = `${origin}/verify`
    const tokenEndpoint = `${domain}/oauth/token`

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    })

    const tokenResponse = await axios.post<Auth0Tokens>(
      tokenEndpoint,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    )

    const tokens = tokenResponse.data

    let userInfo: UserInfo | null = null
    try {
      const userInfoResponse = await axios.get<UserInfo>(`${domain}/userinfo`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      userInfo = userInfoResponse.data
    } catch {
      if (tokens.id_token) {
        const decoded = decodeJwtPayload(tokens.id_token)
        if (decoded?.sub) {
          userInfo = {
            sub: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture,
          }
        }
      }
    }

    if (!userInfo?.sub)
      throw new Error("Unable to determine user ID from token")

    const user = await prisma.user.findUnique({
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
    })

    if (!user) throw new Error("User not found")

    const jwtToken = generateToken(
      {
        user_id: user.user_id,
        user_role: user.user_role_ref?.name,
        customer_id: user.customer_id,
      },
      "24h"
    )

    const { user_role_ref, ...userData } = user

    return {
      user: { ...userData, role: user_role_ref?.name ?? null },
      token: jwtToken,
      auth0_token: tokens.access_token,
    }
  }
}
