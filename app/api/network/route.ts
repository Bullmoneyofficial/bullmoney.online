import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

type NetworkAccount = {
  id: string;
  platform: string;
  handle: string | null;
  label: string | null;
  color: string | null;
  profile_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

type NetworkPost = {
  id: string;
  account_id: string;
  post_url: string;
  sort_order: number | null;
  is_active: boolean | null;
};

const toInstagramEmbed = (url: string) => {
  const clean = url.replace(/\/$/, "");
  return clean.includes("/embed") ? clean : `${clean}/embed/`;
};

const toYouTubeEmbed = (url: string) => {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
  if (!match) return url;
  return `https://www.youtube.com/embed/${match[1]}`;
};

const toTikTokEmbed = (url: string) => {
  const match = url.match(/video\/(\d+)/);
  if (!match) return url;
  return `https://www.tiktok.com/embed/${match[1]}`;
};

const buildEmbedUrl = (platform: string, url: string) => {
  if (!url) return url;
  const normalized = platform.toLowerCase();
  if (normalized === "instagram") return toInstagramEmbed(url);
  if (normalized === "youtube") return toYouTubeEmbed(url);
  if (normalized === "tiktok") return toTikTokEmbed(url);
  return url;
};

export async function GET() {
  const supabase = createServerSupabase();

  const { data: accountsData, error: accountsError } = await supabase
    .from("network_accounts")
    .select("id, platform, handle, label, color, profile_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (accountsError) {
    return NextResponse.json({ accounts: [], error: accountsError.message }, { status: 500 });
  }

  const { data: postsData, error: postsError } = await supabase
    .from("network_posts")
    .select("id, account_id, post_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (postsError) {
    return NextResponse.json({ accounts: [], error: postsError.message }, { status: 500 });
  }

  const accounts = (accountsData || []) as NetworkAccount[];
  const posts = (postsData || []) as NetworkPost[];
  const postsByAccount = new Map<string, NetworkPost[]>();

  posts.forEach((post) => {
    if (!postsByAccount.has(post.account_id)) postsByAccount.set(post.account_id, []);
    postsByAccount.get(post.account_id)!.push(post);
  });

  const responseAccounts = accounts.map((account) => {
    const accountPosts = postsByAccount.get(account.id) || [];
    return {
      id: account.id,
      platform: account.platform,
      handle: account.handle,
      label: account.label,
      color: account.color,
      profileUrl: account.profile_url,
      posts: accountPosts.map((post) => ({
        id: post.id,
        postUrl: post.post_url,
        embedUrl: buildEmbedUrl(account.platform, post.post_url),
        isExample: false,
      })),
    };
  });

  return NextResponse.json({ accounts: responseAccounts });
}
