'use client';

import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
} from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';

import ChatBox from './chatbot';
export default function Page() {
  
  
  // TODO: get user input for room and name
  const room = 'quickstart-room';
  const name = 'ashish11';
  const [roomInstance] = useState(() => new Room({
    // Optimize video quality for each participant's screen
    adaptiveStream: true,
    // Enable automatic audio/video quality optimization
    dynacast: true,
  }));

  const [token , setToken] = useState("")

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch(`/api/token?room=${room}&username=${name}`);
        const data = await resp.json();
        setToken(data.token)
        
        if (!mounted) return;
        if (data.token) {
          await roomInstance.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL, data.token);
        }

        //--------------------------------------------

        roomInstance.on('dataReceived', (payload, participant) => {
          const message = new TextDecoder().decode(payload); 
          console.log(`Message from ${participant}: ${payload}`);
        
          // setMessages((prev) => [
          //   ...prev,
          //   {
          //     sender: participant,
          //     text: message,
          //   },
          // ]);
        });
        

      } catch (e) {
        console.error(e);
      }
    })();
  
    return () => {
      mounted = false;
      roomInstance.disconnect();
    };
  }, [roomInstance]);

  

  if (token === '') {
    return <div>Getting token...</div>;
  }

  return (
    <RoomContext.Provider value={roomInstance}>
      <div data-lk-theme="default" style={{ height: '100dvh' }}>
        {/* Your custom component with basic video conferencing functionality. */}
        <MyVideoConference />
        {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
        <RoomAudioRenderer />
        {/* Controls for the user to start/stop audio, video, and screen share tracks */}
        <ControlBar />
      </div>
      <button onClick={() => getAllParticipantDetails("quickstart-room")}>get all details</button>
      <ChatBox roomName={"quickstart-room"} user={name}/>
    </RoomContext.Provider>
  );
}

function MyVideoConference() {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}>
      {/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
      <ParticipantTile />
    </GridLayout>
  );
}

async function getAllParticipantDetails(roomName) {
  try {
    const res = await fetch(`/api/participants?room=${encodeURIComponent(roomName)}`);
    
    if (!res.ok) {
      console.error('API returned an error:', res.status);
      return [];
    }

    const data = await res.json();
    console.log('Participants:', data.participants);
    
    return data.participants || [];

  } catch (error) {
    console.error('Error fetching participant details from API:', error);
    return [];
  }
}
