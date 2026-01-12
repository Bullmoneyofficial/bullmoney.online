import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const access = req.cookies.get("bm_spotify_access")?.value;
  const expires = req.cookies.get("bm_spotify_expires")?.value;

  const expiresAt = expires ? Number(expires) : null;
  const connected = Boolean(access) && (expiresAt ? Date.now() < expiresAt : true);

  return NextResponse.json({ connected, expiresAt });
}
