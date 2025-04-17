"use client"
import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
  useParticipants,
  useLocalParticipant,
  VideoRenderer,
} from '@livekit/components-react';
import { Room, Track, ConnectionState, RoomEvent, ParticipantEvent } from 'livekit-client';
import '@livekit/components-styles';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

export default function Page() {
  // Create a room instance but don't connect yet
  const [roomInstance] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
  }));

  const [roomName, setRoomName] = useState('quickstart-room');
  const [username, setUsername] = useState('user-' + Math.floor(Math.random() * 10000));
  const [joined, setJoined] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('initializing');
  const [errorDetails, setErrorDetails] = useState(null);

  const handleJoinRoom = () => {
    console.log("handleJoinRoom called");
    if (!roomName.trim()) {
      setErrorDetails("Room name cannot be empty");
      return;
    }
    
    if (!username.trim()) {
      setErrorDetails("Username cannot be empty");
      return;
    }
    
    setErrorDetails(null);
    setJoined(true);
  };

  // If not joined, show the join screen
  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">Join Video Chat</h1>
          
          {errorDetails && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errorDetails}
            </div>
          )}
          
          <div className="mb-5">
            <label className="block text-slate-700 text-sm font-medium mb-2" htmlFor="room-name">
              Room Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <input
                id="room-name"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="pl-10 block w-full rounded-lg border border-slate-300 bg-slate-50 py-3 px-4 text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="Enter room name"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-slate-700 text-sm font-medium mb-2" htmlFor="username">
              Your Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 block w-full rounded-lg border border-slate-300 bg-slate-50 py-3 px-4 text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="Enter your name"
              />
            </div>
          </div>
          
          <button
            onClick={handleJoinRoom}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  // If joined, show the room component - Wrap the VideoRoom with RoomContext.Provider
  return (
    <RoomContext.Provider value={roomInstance}>
      <VideoRoom 
        room={roomInstance} 
        roomName={roomName} 
        username={username}
        onLeave={() => {
          roomInstance.disconnect();
          setJoined(false);
          setConnectionStatus('initializing');
        }}
      />
    </RoomContext.Provider>
  );
}

function VideoRoom({ room, roomName, username, onLeave }) {
  const [connectionStatus, setConnectionStatus] = useState('initializing');
  const [errorDetails, setErrorDetails] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const chatContainerRef = useRef(null);
  const controlsContainerRef = useRef(null);
  
  // Add the tracks hook here at the top level
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ]
  );

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount
    checkMobile();
    
    // Check on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setIsControlsVisible(true);
      
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (!showSettings && !showChat) {
          setIsControlsVisible(false);
        }
      }, 3000);
      
      setControlsTimeout(timeout);
    };
    
    // Only for desktop
    if (!isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleMouseMove);
    }
    
    return () => {
      if (!isMobile) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleMouseMove);
      }
      
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [isMobile, controlsTimeout, showSettings, showChat]);

  // Connect to the room when component mounts
  useEffect(() => {
    let mounted = true;
    
    // Listen for connection state changes
    const handleConnectionStateChanged = (state) => {
      console.log('Connection state changed:', state);
      if (state === ConnectionState.Disconnected) {
        setConnectionStatus('disconnected');
      } else if (state === ConnectionState.Connected) {
        setConnectionStatus('connected');
        // Count participants when connected
        const participantCount = room.participants ? room.participants.size + 1 : 1; // +1 for local participant
        setParticipantCount(participantCount);
      }
    };
    
    // Listen for participant joins/leaves
    const handleParticipantConnected = () => {
      const participantCount = room.participants ? room.participants.size + 1 : 1;
      console.log('Participant connected, count:', participantCount);
      setParticipantCount(participantCount);
    };
    
    const handleParticipantDisconnected = () => {
      const participantCount = room.participants ? room.participants.size + 1 : 1;
      console.log('Participant disconnected, count:', participantCount);
      setParticipantCount(participantCount);
    };
    
    // Listen for data messages
    const handleDataReceived = (payload, participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'chat') {
          setChatMessages(prev => [...prev, {
            sender: participant.identity || 'Unknown',
            message: data.message,
            timestamp: new Date()
          }]);
        }
      } catch (e) {
        console.error('Failed to parse data message', e);
      }
    };
    
    // Add event listeners
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.DataReceived, handleDataReceived);
    
    async function connectToRoom() {
      try {
        setConnectionStatus('connecting');
        console.log('Fetching token...');
        
        // Get token from API
        const response = await fetch(`/api/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(username)}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get token: ${response.status} ${errorText}`);
        }
        
        // Parse response
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${e.message}\nResponse: ${responseText}`);
        }
        
        if (!mounted) return;
        
        if (!data || !data.token) {
          throw new Error('No token returned from server');
        }

        // Get the WebSocket URL from env
        // Safely check if process.env exists (fixes undefined error on mobile)
        const wsUrl = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_LIVEKIT_URL 
          ? process.env.NEXT_PUBLIC_LIVEKIT_URL 
          : null;
          
        if (!wsUrl) {
          throw new Error("Missing NEXT_PUBLIC_LIVEKIT_URL - Make sure it's properly set in your environment");
        }
        
        console.log('Connecting to LiveKit server:', wsUrl);
        console.log('Room name:', roomName);
        console.log('Username:', username);
        
        // Connect to the room
        await room.connect(wsUrl, data.token);
        console.log('Connected to room successfully');
        
        // Enable camera and microphone
        try {
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch (mediaError) {
          console.warn('Could not enable media:', mediaError);
        }
      } catch (e) {
        console.error('LiveKit connect error:', e);
        setConnectionStatus('connection-failed');
        setErrorDetails(e.message || 'Unknown connection error');
      }
    }

    connectToRoom();
    
    return () => {
      mounted = false;
      // Remove event listeners
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.DataReceived, handleDataReceived);
      
      // Disconnect from room
      if (room && room.state !== ConnectionState.Disconnected) {
        room.disconnect();
      }
    };
  }, [room, roomName, username]);
  
  // Send chat message function
  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || !room || !room.localParticipant) return;
    
    try {
      const data = {
        type: 'chat',
        message: chatInput.trim()
      };
      
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(data)),
        { reliable: true }
      );
      
      // Add own message to chat
      setChatMessages(prev => [...prev, {
        sender: username,
        message: chatInput.trim(),
        timestamp: new Date(),
        isLocal: true
      }]);
      
      setChatInput('');
    } catch (e) {
      console.error('Failed to send chat message', e);
    }
  }, [chatInput, room, username]);

  // Handle connection UI states
  if (connectionStatus === 'initializing' || connectionStatus === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-xl text-white mb-6">Connecting to <span className="font-bold">{roomName}</span></div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
              <div className="w-12 h-12 rounded-full border-r-4 border-l-4 border-transparent absolute top-0 animate-ping opacity-60"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected' || connectionStatus === 'connection-failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl text-center text-red-600 mb-2 font-bold">Connection Failed</h2>
          <p className="mb-4 text-slate-700 text-center">Could not connect to the LiveKit server.</p>
          
          {errorDetails && (
            <div className="bg-slate-100 p-4 rounded-lg overflow-auto mb-4 border border-slate-200">
              <p className="font-mono text-sm break-words text-slate-700">{errorDetails}</p>
            </div>
          )}
          
          <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              Troubleshooting:
            </h3>
            <ul className="list-disc pl-5 text-slate-700 space-y-1">
              <li>Check that your LiveKit server is running</li>
              <li>Verify NEXT_PUBLIC_LIVEKIT_URL in your .env file starts with "wss://"</li>
              <li>Ensure LIVEKIT_API_KEY and LIVEKIT_API_SECRET are set correctly</li>
              <li>Check your browser's console for more details</li>
            </ul>
          </div>
          
          <button 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
            onClick={onLeave}
          >
            Back to Join Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-lk-theme="default" className="flex flex-col h-screen bg-slate-900">
      {/* Header with room info and controls */}
      <div className={`bg-slate-800 text-white p-3 flex justify-between items-center shadow-md z-10 transition-opacity duration-300 ${isControlsVisible || isMobile ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center">
          <div className="flex items-center bg-slate-700 px-3 py-1 rounded-full">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            <h1 className="text-lg font-semibold mr-2 truncate max-w-[150px] md:max-w-xs">{roomName}</h1>
          </div>
          <span className="ml-2 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
          </span>
        </div>
        <div className="flex gap-2">
          {!isMobile && (
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`px-3 py-1 rounded-md text-sm transition duration-200 flex items-center ${showSettings ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Settings
            </button>
          )}
          <button 
            onClick={() => {
              setShowChat(!showChat);
              // On mobile, always hide settings when toggling chat
              if (isMobile && showSettings) {
                setShowSettings(false);
              }
            }}
            className={`px-3 py-1 rounded-md text-sm transition duration-200 flex items-center ${showChat ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            Chat
          </button>
          <button 
            onClick={onLeave} 
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm transition duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Leave
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main video area */}
        <div className={`${isMobile ? (showChat ? 'hidden' : 'w-full') : (showChat ? 'w-2/3 lg:w-3/4' : 'w-full')} h-full flex flex-col`}>
          {showSettings && <EnhancedDeviceSettings room={room} />}
          
          <div className="flex-1 relative bg-slate-900">
            <div className="absolute inset-0 w-full h-full">
              <GridLayout 
                tracks={tracks}
                className="rounded-lg overflow-hidden bg-slate-800/50 backdrop-blur-sm"
              >
                <ParticipantTile 
                  className="[&>div]:rounded-lg [&>div]:overflow-hidden [&>div]:border [&>div]:border-slate-700 [&>div]:shadow-lg"
                />
              </GridLayout>
              <RoomAudioRenderer />
            </div>
          </div>
          
          <EnhancedControlBar 
            room={room} 
            isMobile={isMobile}
            isVisible={isControlsVisible} 
          />
        </div>
        
        {/* Chat sidebar */}
        {showChat && (
          <div className={`${isMobile ? 'w-full' : 'w-1/3 lg:w-1/4'} bg-white border-l border-slate-300 flex flex-col h-full shadow-xl`}>
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-black font-medium flex justify-between items-center">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                Chat
              </span>
              {isMobile && (
                <button 
                  onClick={() => setShowChat(false)} 
                  className="text-white hover:text-slate-200 flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                  Back to Video
                </button>
              )}
            </div>
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
            >
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <svg className="w-12 h-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-sm mt-1">Be the first to send a message!</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (<div key={i} className={`${msg.isLocal ? 'ml-auto' : ''} max-w-[80%] rounded-lg p-3 ${msg.isLocal ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200'} shadow-sm`}>
                  {!msg.isLocal && <div className="font-medium text-sm text-slate-700 mb-1">{msg.sender}</div>}
                  <div className={`text-sm ${msg.isLocal ? 'text-white' : 'text-slate-800'}`}>{msg.message}</div>
                  <div className={`text-xs mt-1 ${msg.isLocal ? 'text-blue-200' : 'text-slate-500'}`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <form onSubmit={(e) => {
              e.preventDefault();
              sendChatMessage();
            }}>
              <div className="flex">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 p-2 rounded-l-lg border border-r-0 border-slate-300  text-black focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  placeholder="Type your message..."
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-blue-600 text-white rounded-r-lg px-4 py-2 disabled:bg-blue-400"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

// Enhanced device settings component
function EnhancedDeviceSettings({ room }) {
const [devices, setDevices] = useState({
  audioInput: [],
  audioOutput: [],
  videoInput: []
});
const [selectedDevices, setSelectedDevices] = useState({
  audioInput: '',
  audioOutput: '',
  videoInput: ''
});
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  async function loadDevices() {
    try {
      setIsLoading(true);
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      // Get all devices
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputDevices = mediaDevices.filter(device => device.kind === 'audioinput');
      const audioOutputDevices = mediaDevices.filter(device => device.kind === 'audiooutput');
      const videoInputDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      
      setDevices({
        audioInput: audioInputDevices,
        audioOutput: audioOutputDevices,
        videoInput: videoInputDevices
      });
      
      // Get current selections from LiveKit if possible
      if (room && room.localParticipant) {
        const currentAudioTrack = room.localParticipant.getTrack(Track.Source.Microphone)?.track;
        const currentVideoTrack = room.localParticipant.getTrack(Track.Source.Camera)?.track;
        
        if (currentAudioTrack) {
          const settings = currentAudioTrack.getSettings();
          if (settings.deviceId) {
            setSelectedDevices(prev => ({ ...prev, audioInput: settings.deviceId }));
          }
        }
        
        if (currentVideoTrack) {
          const settings = currentVideoTrack.getSettings();
          if (settings.deviceId) {
            setSelectedDevices(prev => ({ ...prev, videoInput: settings.deviceId }));
          }
        }
      }
    } catch (e) {
      console.error('Failed to load devices', e);
    } finally {
      setIsLoading(false);
    }
  }

  loadDevices();
}, [room]);

// Handle device changes
const handleDeviceChange = async (deviceType, deviceId) => {
  try {
    setSelectedDevices(prev => ({ ...prev, [deviceType]: deviceId }));
    
    if (deviceType === 'audioInput') {
      await room.switchActiveDevice('audioinput', deviceId);
    } else if (deviceType === 'audioOutput') {
      await room.switchActiveDevice('audiooutput', deviceId);
    } else if (deviceType === 'videoInput') {
      await room.switchActiveDevice('videoinput', deviceId);
    }
  } catch (e) {
    console.error(`Failed to switch ${deviceType}`, e);
  }
};

return (
  <div className="bg-slate-800 text-white p-4 z-20 border-b border-slate-700">
    <h3 className="font-medium mb-4 flex items-center">
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
      Device Settings
    </h3>
    
    {isLoading ? (
      <div className="flex justify-center py-4">
        <div className="w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Camera Select */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Camera</label>
          <select
            value={selectedDevices.videoInput}
            onChange={(e) => handleDeviceChange('videoInput', e.target.value)}
            className="bg-slate-700 text-white w-full p-2 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {devices.videoInput.length === 0 ? (
              <option value="">No cameras found</option>
            ) : (
              devices.videoInput.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                </option>
              ))
            )}
          </select>
        </div>
        
        {/* Microphone Select */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Microphone</label>
          <select
            value={selectedDevices.audioInput}
            onChange={(e) => handleDeviceChange('audioInput', e.target.value)}
            className="bg-slate-700 text-white w-full p-2 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {devices.audioInput.length === 0 ? (
              <option value="">No microphones found</option>
            ) : (
              devices.audioInput.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                </option>
              ))
            )}
          </select>
        </div>
        
        {/* Speaker Select */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Speaker</label>
          <select
            value={selectedDevices.audioOutput}
            onChange={(e) => handleDeviceChange('audioOutput', e.target.value)}
            className="bg-slate-700 text-white w-full p-2 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {devices.audioOutput.length === 0 ? (
              <option value="">No speakers found</option>
            ) : (
              devices.audioOutput.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    )}
  </div>
);
}

// Enhanced control bar with animations and better UI
function EnhancedControlBar({ room, isMobile, isVisible }) {
const [isCameraEnabled, setIsCameraEnabled] = useState(true);
const [isMicEnabled, setIsMicEnabled] = useState(true);
const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);

useEffect(() => {
  if (!room) return;
  
  const handleCameraUpdate = () => {
    if (room.localParticipant) {
      setIsCameraEnabled(room.localParticipant.isCameraEnabled);
    }
  };
  
  const handleMicUpdate = () => {
    if (room.localParticipant) {
      setIsMicEnabled(room.localParticipant.isMicrophoneEnabled);
    }
  };
  
  room.on(RoomEvent.LocalTrackPublished, handleCameraUpdate);
  room.on(RoomEvent.LocalTrackPublished, handleMicUpdate);
  room.on(RoomEvent.LocalTrackUnpublished, handleCameraUpdate);
  room.on(RoomEvent.LocalTrackUnpublished, handleMicUpdate);
  
  return () => {
    room.off(RoomEvent.LocalTrackPublished, handleCameraUpdate);
    room.off(RoomEvent.LocalTrackPublished, handleMicUpdate);
    room.off(RoomEvent.LocalTrackUnpublished, handleCameraUpdate);
    room.off(RoomEvent.LocalTrackUnpublished, handleMicUpdate);
  };
}, [room]);

const toggleCamera = async () => {
  if (room && room.localParticipant) {
    try {
      await room.localParticipant.setCameraEnabled(!isCameraEnabled);
      setIsCameraEnabled(!isCameraEnabled);
    } catch (e) {
      console.error('Failed to toggle camera', e);
    }
  }
};

const toggleMic = async () => {
  if (room && room.localParticipant) {
    try {
      await room.localParticipant.setMicrophoneEnabled(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    } catch (e) {
      console.error('Failed to toggle microphone', e);
    }
  }
};

const toggleScreenShare = async () => {
  if (room && room.localParticipant) {
    try {
      if (isScreenShareEnabled) {
        await room.localParticipant.setScreenShareEnabled(false);
      } else {
        await room.localParticipant.setScreenShareEnabled(true);
      }
      setIsScreenShareEnabled(!isScreenShareEnabled);
    } catch (e) {
      console.error('Failed to toggle screen share', e);
    }
  }
};

return (
  <div className={`w-full p-4 flex justify-center items-center bg-gradient-to-t from-slate-900 to-transparent z-10 transition-opacity duration-300 ${isVisible || isMobile ? 'opacity-100' : 'opacity-0'}`}>
    <div className="rounded-full bg-slate-800 shadow-lg p-2 flex space-x-2">
      <button 
        onClick={toggleMic}
        className={`p-3 rounded-full ${isMicEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} transition duration-200 transform hover:scale-105 active:scale-95`}
      >
        {isMicEnabled ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>
          </svg>
        )}
      </button>
      
      <button 
        onClick={toggleCamera}
        className={`p-3 rounded-full ${isCameraEnabled ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-600 hover:bg-red-700'} transition duration-200 transform hover:scale-105 active:scale-95`}
      >
        {isCameraEnabled ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>
          </svg>
        )}
      </button>

      <button 
        onClick={toggleScreenShare}
        className={`p-3 rounded-full ${isScreenShareEnabled ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-600'} transition duration-200 transform hover:scale-105 active:scale-95`}
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      </button>
    </div>
  </div>
);
}