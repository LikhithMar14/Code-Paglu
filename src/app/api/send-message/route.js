import { NextResponse } from 'next/server';
import { RoomServiceClient, DataPacket_Kind } from 'livekit-server-sdk';

const host = process.env.NEXT_PUBLIC_LIVEKIT_URL;
const apiKey = process.env.NEXT_PUBLIC_LIVEKIT_API_KEY;
const apiSecret = process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET;

const roomService = new RoomServiceClient(host, apiKey, apiSecret);

export async function POST(req) {
  try {
    
    const body = await req.json();
    const { room, message, topic = '', sender = 'server' , user} = body;

    if (!room || !message || ! user) {
      return NextResponse.json({ error: 'Missing room or message' }, { status: 400 });
    }

    let encoded  = {};

    encoded.message = new TextEncoder().encode(message);
    encoded.user = user;

    // Define the SendDataOptions based on the given data
    const options = {
      kind: DataPacket_Kind.RELIABLE, // RELIABLE or LOSSY
      topic: topic, // Topic is optional, you can use the default empty string if not provided
    };

    // Broadcast message to all participants in the specified room
    await roomService.sendData(room, encoded, DataPacket_Kind.RELIABLE, options);

    return NextResponse.json({ success: true, message: 'Message sent' });
  } catch (err) {
    console.error('Failed to send message:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
