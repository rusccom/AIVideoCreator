import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "aivs_session";

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  name?: string | null;
};

function secretKey() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is required");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySession(token?: string) {
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.user as SessionUser;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
