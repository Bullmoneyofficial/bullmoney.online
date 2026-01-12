import { NextRequest, NextResponse } from "next/server";
import { randomString, sha256Base64Url } from "@/lib/spotifyPkce";

function getBaseUrl(req: NextRequest) {
  // Prefer explicit base url.
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error: "Missing SPOTIFY_CLIENT_ID",
        hint: "Set SPOTIFY_CLIENT_ID in your environment to enable Spotify login.",
      },
      { status: 500 }
    );
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/spotify/callback`;

  const codeVerifier = randomString(48);
  const codeChallenge = sha256Base64Url(codeVerifier);
  const state = randomString(24);

  const scope = [
    // Keep this conservative; you can expand later for Web Playback SDK.
    "user-read-email",
    "user-read-private",
  ].join(" ");

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("show_dialog", "true");

  const res = NextResponse.redirect(authUrl.toString());

  const secure = process.env.NODE_ENV === "production";

  res.cookies.set("bm_spotify_cv", codeVerifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });
  res.cookies.set("bm_spotify_state", state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return res;
}
