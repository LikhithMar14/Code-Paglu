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
 * API handler for sending chat messages through LiveKit data channels
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
      message, 
      user,
      topic = 'chat', 
      sender = 'server',
      timestamp = Date.now(),
      messageType = 'text'
    } = body;

    console.log("Received message:", { room, message, user, topic, sender, timestamp, messageType });
    

    // Validate required fields
    if (!room) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }
    
    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User information is required' }, { status: 400 });
    }


    // Create a structured chat message object
    const chatMessage = {
      id: crypto.randomUUID(),
      content: message,
      user,
      sender,
      timestamp,
      messageType,
    };

    // Encode the chat message
    const encodedMessage = new TextEncoder().encode(JSON.stringify(chatMessage));

    // Define data sending options
    const options = {
      destinationSids: [], // Empty for broadcast to all participants
      topic,
    };

    // Send the message with reliable delivery
    await roomService.sendData(room, encodedMessage, DataPacket_Kind.RELIABLE, options);

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Message sent',
      messageId: chatMessage.id,
      timestamp: chatMessage.timestamp
    });
    
  } catch (err) {
    console.error('Failed to send message:', err);
    
    // Provide more specific error messages based on error type
    const errorMessage = err.message || 'Unknown error occurred';
    const statusCode = err.statusCode || 500;
    
    return NextResponse.json({ 
      error: 'Failed to send message', 
      details: errorMessage 
    }, { status: statusCode });
  }
}