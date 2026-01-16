# YouTube OAuth Setup Guide

This guide explains how to set up YouTube OAuth login for BullMoney TV.

## Prerequisites

1. A Google Cloud Console account
2. A project in Google Cloud Console

## Step 1: Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Select **Web application** as the application type
6. Configure the OAuth client:
   - **Name**: BullMoney YouTube Login (or any name you prefer)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/youtube/callback` (for development)
     - `https://yourdomain.com/auth/youtube/callback` (for production)
7. Click **CREATE**
8. Copy the **Client ID** (you'll need this)

## Step 2: Enable YouTube Data API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click on it and click **ENABLE**

## Step 3: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# YouTube OAuth (Google Cloud Console)
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

## Step 4: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Fill in the app information:
   - **App name**: BullMoney TV
   - **User support email**: your email
   - **Developer contact email**: your email
4. Add the following scopes:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users (while in development mode)

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Open BullMoney TV modal
3. Click "My YouTube" tab
4. Click "Sign in with Google"
5. Complete the OAuth flow
6. Your YouTube playlists and liked videos should now be available

## Features Available After Login

- **Liked Videos**: Watch videos you've liked on YouTube
- **Playlists**: Access all your personal playlists
- **User Profile**: Your Google profile picture and name are displayed

## Troubleshooting

### "YouTube login is not configured"
- Make sure `NEXT_PUBLIC_YOUTUBE_CLIENT_ID` is set in `.env.local`
- Restart the development server after adding the environment variable

### "Access blocked" error
- Ensure your redirect URIs match exactly
- Check that you've added test users in the OAuth consent screen
- Make sure the YouTube Data API is enabled

### "Invalid scope" error
- Verify all required scopes are added to the OAuth consent screen
- Make sure the YouTube Data API is enabled

## Security Notes

- The access token is stored in `localStorage` and expires after 1 hour
- Users can log out at any time, which clears all stored data
- No sensitive data is sent to any server - everything is client-side
