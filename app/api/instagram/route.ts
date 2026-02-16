import { NextResponse } from "next/server";

// Simple Instagram post embed data
// No API keys needed! Just add post URLs from your Instagram accounts.
// To get a post URL: open any post on Instagram → copy the URL from browser
// Format: https://www.instagram.com/p/SHORTCODE/
// or: https://www.instagram.com/reel/SHORTCODE/

// ====== EDIT THESE ARRAYS WITH YOUR REAL POST URLS ======

const ACCOUNTS = [
  {
    handle: "bullmoney.online",
    label: "BullMoney Online",
    color: "#3b82f6",
    profileUrl: "https://instagram.com/bullmoney.online",
    posts: [
      "https://www.instagram.com/p/DUya0WiDjkm/",
      "https://www.instagram.com/p/DUybOzrDglP/",
      "https://www.instagram.com/p/DUyb2jtDm44/",
    ],
  },
  {
    handle: "bullmoney.official",
    label: "BullMoney Official",
    color: "#8b5cf6",
    profileUrl: "https://instagram.com/bullmoney.official",
    posts: [
      "https://www.instagram.com/p/DLDd2HMI6qy/",
      "https://www.instagram.com/p/DPl4t2hjeE8/",
      "https://www.instagram.com/p/DLImzKJIvj4/",
    ],
  },
  {
    handle: "bullmoney.trades",
    label: "BullMoney Trades",
    color: "#22c55e",
    profileUrl: "https://instagram.com/bullmoney.trades",
    posts: [
      "https://www.instagram.com/p/DSRL_fniG6g/",
      "https://www.instagram.com/p/DSRLxRNCPUS/",
      "https://www.instagram.com/p/DRrqQO9iCvE/",
    ],
  },
  {
    handle: "bullmoney.shop",
    label: "BullMoney Shop",
    color: "#f59e0b",
    profileUrl: "https://instagram.com/bullmoney.shop",
    posts: [
      "https://www.instagram.com/p/DUya0WiDjkm/",
      "https://www.instagram.com/p/DUybOzrDglP/",
      "https://www.instagram.com/p/DUyb2jtDm44/",
    ],
  },
];

function getEmbedUrl(postUrl: string): string {
  // Convert Instagram post URL to embed URL
  // https://www.instagram.com/p/ABC123/ → https://www.instagram.com/p/ABC123/embed/
  const clean = postUrl.replace(/\/$/, "");
  return `${clean}/embed/`;
}

export async function GET() {
  const accounts = ACCOUNTS.map((account) => ({
    handle: account.handle,
    label: account.label,
    color: account.color,
    profileUrl: account.profileUrl,
    posts: account.posts.map((url, i) => ({
      id: `${account.handle}-${i}`,
      postUrl: url,
      embedUrl: getEmbedUrl(url),
      isExample: url.includes("EXAMPLE"),
    })),
  }));

  return NextResponse.json({ accounts });
}
