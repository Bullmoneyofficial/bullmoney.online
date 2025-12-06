import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.CMC_API_KEY;
  if (!key) return NextResponse.json({ error: "CMC_API_KEY not set" }, { status: 500 });

  const res = await fetch(
    "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest",
    { headers: { "X-CMC_PRO_API_KEY": key, Accept: "application/json" }, cache: "no-store" }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "CMC error", detail: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } });
}
