import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// POST /api/upload/presign - Generate presigned URL for upload
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { filename, contentType, fileSize, uploadType = 'analysis' } = body;
    
    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and contentType are required' }, { status: 400 });
    }
    
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json({ 
        error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` 
      }, { status: 400 });
    }
    
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }
    
    // Generate unique file path
    const fileExt = filename.split('.').pop() || 'bin';
    const uniqueId = crypto.randomUUID();
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    let bucketPath: string;
    switch (uploadType) {
      case 'avatar':
        bucketPath = `avatars/${user.id}/${timestamp}_${sanitizedFilename}`;
        break;
      case 'comment':
        bucketPath = `comments/${user.id}/${uniqueId}.${fileExt}`;
        break;
      case 'analysis':
      default:
        bucketPath = `analyses/${user.id}/${uniqueId}.${fileExt}`;
        break;
    }
    
    // Create signed URL for upload
    const { data, error } = await supabase.storage
      .from('bull-feed')
      .createSignedUploadUrl(bucketPath);
    
    if (error) {
      console.error('Create signed URL error:', error);
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
    }
    
    // Generate public URL
    const { data: publicUrlData } = supabase.storage
      .from('bull-feed')
      .getPublicUrl(bucketPath);
    
    return NextResponse.json({
      uploadUrl: data.signedUrl,
      token: data.token,
      path: bucketPath,
      publicUrl: publicUrlData.publicUrl,
      expiresIn: 3600, // 1 hour
    });
    
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/upload/presign - Get download URL for private files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase.storage
      .from('bull-feed')
      .createSignedUrl(path, 3600);
    
    if (error) {
      console.error('Create download URL error:', error);
      return NextResponse.json({ error: 'Failed to create download URL' }, { status: 500 });
    }
    
    return NextResponse.json({
      downloadUrl: data.signedUrl,
      expiresIn: 3600,
    });
    
  } catch (error) {
    console.error('Get download URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
