import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(req: NextRequest) {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Missing SPOTIFY_CLIENT_ID" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect("/");
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code/state" },
      { status: 400 }
    );
  }

  const cookieState = req.cookies.get("bm_spotify_state")?.value;
  const codeVerifier = req.cookies.get("bm_spotify_cv")?.value;

  if (!cookieState || cookieState !== state || !codeVerifier) {
    return NextResponse.json(
      { error: "Invalid auth state" },
      { status: 400 }
    );
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/spotify/callback`;

  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", redirectUri);
  body.set("code_verifier", codeVerifier);

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    // Spotify token endpoint is external; no caching.
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "Spotify token exchange failed" },
      { status: 502 }
    );
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
    refresh_token?: string;
  };

  const expiresAt = Date.now() + (tokenJson.expires_in || 3600) * 1000;

  const res = NextResponse.redirect("/");
  const secure = process.env.NODE_ENV === "production";

  res.cookies.set("bm_spotify_access", tokenJson.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokenJson.expires_in || 3600,
  });

  if (tokenJson.refresh_token) {
    res.cookies.set("bm_spotify_refresh", tokenJson.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      // Spotify refresh tokens typically long-lived; keep a week here.
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  res.cookies.set("bm_spotify_expires", String(expiresAt), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  // Clear transient cookies.
  res.cookies.set("bm_spotify_cv", "", { path: "/", maxAge: 0 });
  res.cookies.set("bm_spotify_state", "", { path: "/", maxAge: 0 });

  return res;
}
