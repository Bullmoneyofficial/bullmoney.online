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
8. **IMPORTANT**: Copy both the **Client ID** and **Client Secret** (you'll need both)

## Step 2: Enable YouTube Data API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "YouTube Data API v3"
3. Click on it and click **ENABLE**

## Step 3: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# YouTube OAuth (Google Cloud Console)
# Client ID - used on both client and server
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com

# Client Secret - SERVER ONLY (never expose this publicly!)
YOUTUBE_CLIENT_SECRET=your-client-secret-here
```

> ⚠️ **Security Note**: The `YOUTUBE_CLIENT_SECRET` should NEVER be prefixed with `NEXT_PUBLIC_` as it must remain server-side only.

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
- **Automatic Token Refresh**: Sessions persist without re-prompting (using refresh tokens)

## OAuth Flow Details

BullMoney TV uses the **Authorization Code Flow** with the following features:

- **Refresh Tokens**: Sessions persist until explicitly logged out
- **Automatic Refresh**: Access tokens are automatically refreshed before expiry
- **Secure Token Exchange**: Authorization codes are exchanged server-side
- **Offline Access**: Users don't need to re-authenticate every hour

### How It Works

1. User clicks "Sign in with Google"
2. Popup opens to Google's consent screen
3. After consent, Google returns an authorization code
4. Our server exchanges the code for access + refresh tokens
5. Access token is used for API calls
6. When access token expires, refresh token gets a new one automatically

## Troubleshooting

### "YouTube login is not configured"
- Make sure `NEXT_PUBLIC_YOUTUBE_CLIENT_ID` is set in `.env.local`
- Restart the development server after adding the environment variable

### "OAuth credentials not configured"
- Make sure `YOUTUBE_CLIENT_SECRET` is set in `.env.local`
- Ensure the secret matches the one from Google Cloud Console

### "Access blocked" error
- Ensure your redirect URIs match exactly
- Check that you've added test users in the OAuth consent screen
- Make sure the YouTube Data API is enabled

### "Invalid scope" error
- Verify all required scopes are added to the OAuth consent screen
- Make sure the YouTube Data API is enabled

### "Session expired" error
- If refresh token is revoked, user needs to sign in again
- This can happen if user revokes access in Google Account settings

## Security Notes

- Access tokens expire after 1 hour but are automatically refreshed
- Refresh tokens persist until user logs out or revokes access
- Client secret is never exposed to the browser (server-side only)
- State parameter protects against CSRF attacks
- Token exchange happens server-side for security

## API Routes

The following API routes handle OAuth:

- `POST /api/auth/youtube` - Exchanges authorization code for tokens
- `POST /api/auth/youtube/refresh` - Refreshes expired access tokens
