import { AccessToken } from 'livekit-server-sdk';

// Do not cache endpoint result
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('room');
    const username = searchParams.get('username');
    
    if (!roomName || !username) {
      return new Response(
        JSON.stringify({ error: 'Room name and username are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Log environment variables for debugging (remove in production)
    console.log('API Key available:', !!process.env.LIVEKIT_API_KEY);
    console.log('API Secret available:', !!process.env.LIVEKIT_API_SECRET);
    
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return new Response(
        JSON.stringify({ error: 'LiveKit API key and secret are not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a new access token
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: username,
        name: username,
      }
    );
    
    // Grant permissions to the room
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    
    // Generate the token
    const token = at.toJwt();
    
    // Log token for debugging (remove in production)
    console.log('Token generated successfully');
    
    return new Response(
      JSON.stringify({ token }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate token: ' + error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}