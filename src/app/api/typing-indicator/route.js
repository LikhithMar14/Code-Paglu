import { NextResponse } from 'next/server';
import { RoomServiceClient, DataPacket_Kind } from 'livekit-server-sdk';

// Environment configuration
const host = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

// Validate essential environment variables
if (!host || !apiKey || !apiSecret) {
  console.error('Missing LiveKit configuration. Please set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET');
}

// Initialize the room service client
const roomService = new RoomServiceClient(host, apiKey, apiSecret);

/**
 * API handler for sending typing indicators through LiveKit data channels
 * 
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} - JSON response
 */
export async function POST(req) {
  try {
    // Parse incoming request body
    const body = await req.json();
    const { 
      room, 
      user,
      isTyping,
      topic = 'typing'
    } = body;

    // Validate required fields
    if (!room) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User information is required' }, { status: 400 });
    }

    if (isTyping === undefined) {
      return NextResponse.json({ error: 'Typing status is required' }, { status: 400 });
    }

    // Check if room exists before sending
    try {
      const roomInfo = await roomService.getRoom(room);
      if (!roomInfo) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
    } catch (roomErr) {
      return NextResponse.json({ error: 'Room not found or invalid' }, { status: 404 });
    }

    // Create a structured typing indicator object
    const typingData = {
      type: 'typing',
      user,
      isTyping,
      timestamp: Date.now()
    };

    // Encode the typing indicator
    const encodedData = new TextEncoder().encode(JSON.stringify(typingData));

    // Define data sending options
    const options = {
      destinationSids: [], // Empty for broadcast to all participants
      topic,
    };

    // Send the typing indicator with reliable delivery
    await roomService.sendData(room, encodedData, DataPacket_Kind.RELIABLE, options);

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Typing indicator sent',
      timestamp: typingData.timestamp
    });
    
  } catch (err) {
    console.error('Failed to send typing indicator:', err);
    
    // Provide more specific error messages based on error type
    const errorMessage = err.message || 'Unknown error occurred';
    const statusCode = err.statusCode || 500;
    
    return NextResponse.json({ 
      error: 'Failed to send typing indicator', 
      details: errorMessage 
    }, { status: statusCode });
  }
} 