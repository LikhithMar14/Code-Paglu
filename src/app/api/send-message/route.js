import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';

const host = process.env.NEXT_PUBLIC_LIVEKIT_URL;
const apiKey = process.env.NEXT_PUBLIC_LIVEKIT_API_KEY;
const apiSecret = process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET;

const roomService = new RoomServiceClient(host, apiKey, apiSecret);

export async function POST(req) {
  try {
    const body = await req.json();
    const { room, message, topic = '', sender = 'server' } = body;

    if (!room || !message) {
      return NextResponse.json({ error: 'Missing room or message' }, { status: 400 });
    }

    const encoded = new TextEncoder().encode(message);

    // Broadcast message to all participants
    await roomService.sendData(room, encoded, {
      kind: 'RELIABLE', // RELIABLE or LOSSY
      topic,
    });

    return NextResponse.json({ success: true, message: 'Message sent' });
  } catch (err) {
    console.error('Failed to send message:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
