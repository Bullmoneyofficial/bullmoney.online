import { NextResponse } from 'next/server';

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  views?: string;
  hasMedia: boolean;
}

// Channel username (without @)
const CHANNEL_USERNAME = 'bullmoneyfx';

export async function GET() {
  try {
    // Fetch the public channel preview page
    const response = await fetch(`https://t.me/s/${CHANNEL_USERNAME}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch channel: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse the HTML to extract messages
    const posts = parseChannelHTML(html);

    return NextResponse.json({
      success: true,
      posts: posts.slice(0, 10), // Return last 10 posts
      channel: CHANNEL_USERNAME,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching Telegram channel:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch channel posts',
      posts: [],
    }, { status: 500 });
  }
}

function parseChannelHTML(html: string): TelegramPost[] {
  const posts: TelegramPost[] = [];
  
  try {
    // Extract message blocks using regex patterns
    // Telegram uses specific class names for messages
    
    // Pattern to find message containers
    const messagePattern = /class="tgme_widget_message_wrap[^"]*"[^>]*data-post="([^"]+)"[^>]*>([\s\S]*?)(?=class="tgme_widget_message_wrap|$)/gi;
    
    // Alternative: simpler pattern for message text
    const textPattern = /class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const datePattern = /class="tgme_widget_message_date[^"]*"[^>]*><time[^>]*datetime="([^"]+)"[^>]*>([^<]+)<\/time>/gi;
    const viewsPattern = /class="tgme_widget_message_views"[^>]*>([^<]+)</gi;
    const mediaPattern = /class="tgme_widget_message_photo|class="tgme_widget_message_video/gi;
    
    // Find all data-post attributes (message IDs)
    const postIdPattern = /data-post="bullmoneyfx\/(\d+)"/gi;
    const postIds: string[] = [];
    let idMatch;
    while ((idMatch = postIdPattern.exec(html)) !== null) {
      postIds.push(idMatch[1]);
    }
    
    // Extract message texts
    const texts: string[] = [];
    let textMatch;
    const textRegex = /class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    while ((textMatch = textRegex.exec(html)) !== null) {
      // Clean HTML tags and decode entities
      let text = textMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      texts.push(text);
    }
    
    // Extract dates
    const dates: string[] = [];
    let dateMatch;
    const dateRegex = /<time[^>]*datetime="([^"]+)"[^>]*>([^<]+)<\/time>/gi;
    while ((dateMatch = dateRegex.exec(html)) !== null) {
      dates.push(formatDate(dateMatch[1]) || dateMatch[2]);
    }
    
    // Extract view counts
    const views: string[] = [];
    let viewMatch;
    const viewRegex = /class="tgme_widget_message_views"[^>]*>([^<]+)</gi;
    while ((viewMatch = viewRegex.exec(html)) !== null) {
      views.push(viewMatch[1].trim());
    }
    
    // Check for media
    const hasMediaList: boolean[] = [];
    const mediaCheckPattern = /data-post="bullmoneyfx\/(\d+)"[\s\S]*?(?:tgme_widget_message_photo|tgme_widget_message_video|tgme_widget_message_document)/gi;
    const mediaIds = new Set<string>();
    let mediaMatch;
    while ((mediaMatch = mediaCheckPattern.exec(html)) !== null) {
      mediaIds.add(mediaMatch[1]);
    }
    
    // Combine data into posts
    const maxPosts = Math.min(postIds.length, texts.length);
    for (let i = 0; i < maxPosts; i++) {
      posts.push({
        id: postIds[i],
        text: texts[i] || '(Media post)',
        date: dates[i] || 'Recently',
        views: views[i],
        hasMedia: mediaIds.has(postIds[i]),
      });
    }
    
    // Reverse to show newest first
    posts.reverse();
    
  } catch (parseError) {
    console.error('Error parsing Telegram HTML:', parseError);
  }
  
  return posts;
}

function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}
