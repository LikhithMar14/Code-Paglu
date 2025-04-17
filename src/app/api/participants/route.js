import { RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export const revalidate = 0; // Prevent caching

// 👇 Create the RoomServiceClient with your LiveKit credentials
const roomService = new RoomServiceClient(
  process.env.NEXT_PUBLIC_LIVEKIT_URL,
  process.env.NEXT_PUBLIC_LIVEKIT_API_KEY,
  process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET
);

// GET all participant details from a room
export async function GET(req) {
  const roomName = req.nextUrl.searchParams.get('room');

  if (!roomName) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  }

  try {
    // Get all participants in the room
    const participants = await roomService.listParticipants(roomName);

    // Optionally, get detailed participant info
    const detailedParticipants = await Promise.all(
      participants.map(async (p) => {
        return await roomService.getParticipant(roomName, p.identity);
      })
    );

    return NextResponse.json({ participants: detailedParticipants });
  } catch (error) {
    console.error('[LiveKit] Failed to list participants:', error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}
