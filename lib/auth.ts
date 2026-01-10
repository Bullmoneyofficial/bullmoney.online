import { NextRequest, NextResponse } from "next/server";

export interface AuthResult {
  authorized: boolean;
  user?: any;
  response?: NextResponse;
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized - No token provided" },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.substring(7);

    if (token === process.env.ADMIN_TOKEN) {
      return {
        authorized: true,
        user: { role: "admin" },
      };
    }

    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      ),
    };
  } catch (error) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      ),
    };
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unauthorized - No token provided" },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.substring(7);

    if (token) {
      return {
        authorized: true,
        user: { token },
      };
    }

    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      ),
    };
  } catch (error) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      ),
    };
  }
}

const auth = { requireAdmin, requireAuth };
export default auth;
