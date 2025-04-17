// api/token/route.js
import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export const revalidate = 0;

export async function GET(req) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const room = url.searchParams.get('room');
    const username = url.searchParams.get('username');
    
    console.log('Token request for:', { room, username });
    
    // Validate parameters
    if (!room) {
      return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
    } else if (!username) {
      return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
    }
    
    // Get environment variables
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasLivekitUrl: !!livekitUrl,
      livekitUrl: livekitUrl
    });
    
    // Check server configuration
    if (!apiKey || !apiSecret) {
      console.error('Missing LiveKit configuration');
      return NextResponse.json({ error: 'Server misconfigured - Missing LiveKit API key or secret' }, { status: 500 });
    }
    
    if (!livekitUrl) {
      console.error('Missing LiveKit URL');
      return NextResponse.json({ error: 'Server misconfigured - Missing LiveKit URL' }, { status: 500 });
    }
    
    // Create token
    const token = new AccessToken(apiKey, apiSecret, { identity: username });
    
    // Add grant with permissions
    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true // Make sure data publishing is enabled for chat
    });
    
    // Convert to JWT
    const jwt = await token.toJwt();
    
    console.log('Token generated successfully');
    
    // Return JSON with no-cache headers
    return new Response(
      JSON.stringify({ token: jwt }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('Error in token API:', error);
    return NextResponse.json({ 
      error: 'Failed to generate token: ' + (error.message || 'Unknown error') 
    }, { status: 500 });
  }
}