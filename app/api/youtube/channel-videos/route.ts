import { NextRequest, NextResponse } from 'next/server';

// You'll need to add your YouTube API key to .env.local
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  isLive: boolean;
  channelTitle: string;
}

// Map channel handles to IDs (YouTube API requires channel IDs)
const CHANNEL_HANDLE_TO_ID: Record<string, string> = {
  '@bullmoney.streams': '', // You'll need to fill these in
  '@bullmoney.online': '',
  '@bullmoney.gaming': '',
};

async function getChannelIdFromHandle(handle: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.items?.[0]?.id?.channelId || null;
  } catch (error) {
    console.error('[YouTube API] Error fetching channel ID:', error);
    return null;
  }
}

async function getChannelVideos(channelId: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) return [];
  
  try {
    // Get recent uploads
    const uploadsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 30 } } // Cache for 30 seconds
    );
    
    if (!uploadsResponse.ok) return [];
    
    const uploadsData = await uploadsResponse.json();
    
    // Check if any videos are live
    const videoIds = uploadsData.items.map((item: any) => item.id.videoId).join(',');
    
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`,
      { next: { revalidate: 30 } }
    );
    
    if (!detailsResponse.ok) return [];
    
    const detailsData = await detailsResponse.json();
    
    const videos: YouTubeVideo[] = detailsData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description || '',
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
      isLive: item.liveStreamingDetails?.actualStartTime && !item.liveStreamingDetails?.actualEndTime,
      channelTitle: item.snippet.channelTitle,
    }));
    
    return videos;
  } catch (error) {
    console.error('[YouTube API] Error fetching channel videos:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { channels } = await request.json();
    
    if (!channels || !Array.isArray(channels)) {
      return NextResponse.json(
        { success: false, error: 'Invalid channels parameter' },
        { status: 400 }
      );
    }
    
    if (!YOUTUBE_API_KEY) {
      console.warn('[YouTube API] No API key configured');
      return NextResponse.json(
        { success: false, error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }
    
    const allVideos: YouTubeVideo[] = [];
    
    // Fetch videos from each channel
    for (const handle of channels) {
      let channelId = CHANNEL_HANDLE_TO_ID[handle];
      
      // If we don't have the channel ID cached, fetch it
      if (!channelId) {
        channelId = await getChannelIdFromHandle(handle) || '';
      }
      
      if (channelId) {
        const videos = await getChannelVideos(channelId, 5);
        allVideos.push(...videos);
      }
    }
    
    // Sort by date, prioritize live streams
    const sortedVideos = allVideos.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
    
    return NextResponse.json({
      success: true,
      videos: sortedVideos,
      hasLive: sortedVideos.some(v => v.isLive),
    });
  } catch (error) {
    console.error('[YouTube API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch YouTube videos' },
      { status: 500 }
    );
  }
}
