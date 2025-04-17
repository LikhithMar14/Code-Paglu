"use client"
import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';
import { RoomContext } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import debounce from 'lodash/debounce';

// Add custom animation styles
const typingAnimation = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  @keyframes typingDots {
    0% { content: ''; }
    25% { content: '.'; }
    50% { content: '..'; }
    75% { content: '...'; }
    100% { content: ''; }
  }
  
  .typing-dots::after {
    content: '';
    animation: typingDots 1.5s infinite;
    display: inline-block;
    width: 1.5em;
    text-align: left;
  }
`;

// Dynamically import Monaco Editor to ensure it only loads on the client
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full min-h-[500px] bg-slate-800">
      <div className="text-xl text-white flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
        <div>Loading editor...</div>
      </div>
    </div>
  ),
});

export default function EditorPage() {
  // Create a room instance but don't connect yet
  const [roomInstance] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
  }));

  const [roomName, setRoomName] = useState('editor-room');
  const [username, setUsername] = useState('user-' + Math.floor(Math.random() * 10000));
  const [joined, setJoined] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('initializing');
  const [errorDetails, setErrorDetails] = useState(null);
  const [code, setCode] = useState('// Start coding here...\n\nfunction helloWorld() {\n  console.log("Hello from Code Paglu!");\n}\n\nhelloWorld();');
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [editorInstance, setEditorInstance] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [cursorPositions, setCursorPositions] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [usernameMap, setUsernameMap] = useState({});
  
  // Keep track of local changes to prevent feedback loops
  const ignoreChanges = useRef(false);
  
  // Track participants
  const [participantCount, setParticipantCount] = useState(0);
  
  // Connection state ref
  const mountedRef = useRef(true);

  // Handle editor ready event
  const handleEditorDidMount = (editor, monaco) => {
    setEditorInstance(editor);
    setIsEditorReady(true);
    
    // Set up cursor position tracking
    editor.onDidChangeCursorPosition(handleCursorPositionChanged);
    
    // Set up a debounced version for performance
    const debouncedCursorUpdate = debounce(handleCursorPositionChanged, 50);
    editor.onDidChangeCursorSelection(debouncedCursorUpdate);
  };

  // Handle code changes and sync with room
  const handleEditorChange = (value) => {
    if (ignoreChanges.current) {
      ignoreChanges.current = false;
      return;
    }
    
    setCode(value);
    
    // Update typing status with debounce to prevent excessive updates
    const now = Date.now();
    setTypingUsers(prev => ({
      ...prev,
      [username]: now
    }));
    
    // Send code updates to room participants - with additional connection check
    if (roomInstance && 
        roomInstance.state === ConnectionState.Connected && 
        roomInstance.localParticipant && 
        isEditorReady) {
      try {
        const data = {
          type: 'code-update',
          content: value,
          language,
          timestamp: now,
          username: username
        };
        
        roomInstance.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(data)),
          { reliable: true }
        );
      } catch (e) {
        console.error('Failed to publish code update', e);
      }
    }
  };

  // Track cursor position changes
  const handleCursorPositionChanged = useCallback(() => {
    if (!editorInstance || 
        !roomInstance || 
        roomInstance.state !== ConnectionState.Connected || 
        !roomInstance.localParticipant) return;
    
    const position = editorInstance.getPosition();
    if (!position) return;
    
    // Generate a consistent color for this user
    const userColor = `hsl(${Math.abs(username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360}, 70%, 60%)`;
    
    try {
      const data = {
        type: 'cursor-position',
        position: {
          lineNumber: position.lineNumber,
          column: position.column
        },
        color: userColor,
        timestamp: Date.now(),
        username: username
      };
      
      roomInstance.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(data)),
        { reliable: false } // Use unreliable for cursor updates for better performance
      );
    } catch (e) {
      console.error('Failed to publish cursor position', e);
    }
  }, [editorInstance, roomInstance, username]);

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    
    if (roomInstance && 
        roomInstance.state === ConnectionState.Connected && 
        roomInstance.localParticipant) {
      try {
        const data = {
          type: 'language-change',
          language: newLanguage,
          timestamp: Date.now()
        };
        
        roomInstance.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(data)),
          { reliable: true }
        );
      } catch (e) {
        console.error('Failed to publish language change', e);
      }
    }
  };

  // Handle theme change
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleJoinRoom = () => {
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
    
    // Initialize username map with our own username
    setUsernameMap(prev => ({
      ...prev,
      [username]: username
    }));
  };

  // Move disconnect function outside useEffect so it can be accessed throughout the component
  const disconnectRoom = useCallback(() => {
    try {
      // Check if room instance exists and is in a state where we can disconnect
      if (roomInstance) {
        console.log('Current room state:', roomInstance.state);
        
        // Only attempt to disconnect if we're in a connected or connecting state
        if (roomInstance.state === ConnectionState.Connected || 
            roomInstance.state === ConnectionState.Connecting) {
          console.log('Disconnecting from room...');
          roomInstance.disconnect(true);
        } else {
          console.log('Room is not in a connected state, skipping disconnect');
        }
      } else {
        console.log('No room instance available, skipping disconnect');
      }
    } catch (err) {
      console.error('Error disconnecting from room:', err);
    }
  }, [roomInstance]);

  // Connect to LiveKit room and sync data
  useEffect(() => {
    if (!joined) return;
    
    mountedRef.current = true;
    
    // Listen for connection state changes
    const handleConnectionStateChanged = (state) => {
      console.log('Connection state changed:', state);
      if (state === ConnectionState.Disconnected) {
        setConnectionStatus('disconnected');
      } else if (state === ConnectionState.Connected) {
        setConnectionStatus('connected');
        // Count participants when connected
        setParticipantCount(roomInstance.participants ? roomInstance.participants.size + 1 : 1); // +1 for local participant
      } else if (state === ConnectionState.Connecting) {
        setConnectionStatus('connecting');
      }
    };
    
    // Handle connection error
    const handleError = (error) => {
      console.error('Room connection error:', error);
      setErrorDetails(error.message || 'Unknown connection error');
      setConnectionStatus('connection-failed');
    };
    
    // Listen for participant joins/leaves
    const handleParticipantConnected = () => {
      const participantCount = roomInstance.participants ? roomInstance.participants.size + 1 : 1;
      console.log('Participant connected, count:', participantCount);
      setParticipantCount(participantCount);
      
      // Safely access participants
      if (roomInstance.participants) {
        setCollaborators(Array.from(roomInstance.participants.values()).map(p => p.identity));
      } else {
        setCollaborators([]);
      }
      
      // Send current state to new participant
      if (roomInstance.localParticipant) {
        try {
          const data = {
            type: 'code-update',
            content: code,
            language,
            timestamp: Date.now()
          };
          
          roomInstance.localParticipant.publishData(
            new TextEncoder().encode(JSON.stringify(data)),
            { reliable: true }
          );
        } catch (e) {
          console.error('Failed to publish initial code state', e);
        }
      }
    };
    
    const handleParticipantDisconnected = () => {
      const participantCount = roomInstance.participants ? roomInstance.participants.size + 1 : 1;
      console.log('Participant disconnected, count:', participantCount);
      setParticipantCount(participantCount);
      
      // Safely access participants
      if (roomInstance.participants) {
        setCollaborators(Array.from(roomInstance.participants.values()).map(p => p.identity));
      } else {
        setCollaborators([]);
      }
    };
    
    // Listen for data messages (code updates, language changes)
    const handleDataReceived = (payload, participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        const now = Date.now();
        
        // Handle different message types
        if (data.type === 'code-update') {
          // Prevent feedback loop when receiving updates from others
          ignoreChanges.current = true;
          setCode(data.content);
          
          // Update username map if username is provided
          if (data.username) {
            setUsernameMap(prev => ({
              ...prev,
              [participant.identity]: data.username
            }));
          }
          
          // Use the correct username for active editor
          const editorUsername = data.username || participant.identity;
          setActiveEditor(editorUsername);
          
          // Update typing status for this user
          setTypingUsers(prev => ({
            ...prev,
            [editorUsername]: now
          }));
          
          // Clear active editor after 3 seconds of inactivity
          setTimeout(() => {
            setActiveEditor(prev => prev === editorUsername ? null : prev);
          }, 3000);
        } else if (data.type === 'language-change') {
          setLanguage(data.language);
        } else if (data.type === 'cursor-position') {
          // Update username map if username is provided
          if (data.username) {
            setUsernameMap(prev => ({
              ...prev,
              [participant.identity]: data.username
            }));
          }
          
          // Use the correct username for cursor position
          const cursorUsername = data.username || participant.identity;
          
          setCursorPositions(prev => ({
            ...prev,
            [cursorUsername]: {
              position: data.position,
              color: data.color,
              name: cursorUsername,
              timestamp: data.timestamp
            }
          }));
          
          // Also update typing status when cursor moves
          setTypingUsers(prev => ({
            ...prev,
            [cursorUsername]: now
          }));
        } else if (data.type === 'username-update') {
          // Update username map
          setUsernameMap(prev => ({
            ...prev,
            [participant.identity]: data.username
          }));
        }
      } catch (e) {
        console.error('Failed to parse data message', e);
      }
    };
    
    // Add connection error handler and event listeners
    roomInstance.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    roomInstance.on(RoomEvent.RoomDisconnected, handleError);
    roomInstance.on(RoomEvent.MediaConnectionError, handleError);
    
    // Add event listeners for participants and data
    roomInstance.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    roomInstance.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    roomInstance.on(RoomEvent.DataReceived, handleDataReceived);

    async function connectToRoom() {
      try {
        setConnectionStatus('connecting');
        console.log(`Connecting to room: ${roomName}`);
        
        // Get token from API
        console.log('Fetching token...');
        const response = await fetch(`/api/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(username)}`);
        console.log('response:', response);
        
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
        
        if (!mountedRef.current) return;
        
        if (!data || !data.token) {
          throw new Error('No token returned from server');
        }
        
        const token = data.token;

        const wsUrl = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_LIVEKIT_URL 
          ? process.env.NEXT_PUBLIC_LIVEKIT_URL 
          : null;
        console.log('wsUrl:', wsUrl);
        if (!wsUrl) {
          throw new Error("Missing NEXT_PUBLIC_LIVEKIT_URL - Make sure it's properly set in your environment");
        }
        
        console.log('Connecting to LiveKit server:', wsUrl);
        console.log('Room name:', roomName);
        console.log('Username:', username);
        
        // Make sure room is in correct state before connecting
        if (roomInstance.state !== ConnectionState.Disconnected) {
          console.log('Room not in disconnected state, disconnecting first...');
          try {
            await roomInstance.disconnect(true);
          } catch (e) {
            console.warn('Error disconnecting existing connection:', e);
          }
        }
        
        // Configure connection options
        const connectionOptions = {
          autoSubscribe: true,
          // Disable automatic reconnection
          reconnectAttempts: 0,
          timeoutMs: 15000, // 15 seconds connection timeout
        };
        
        // Connect to the room with proper options
        await roomInstance.connect(wsUrl, token, connectionOptions);
        console.log('Connected to room successfully');
        
        // Only access participants after connection is confirmed
        if (roomInstance.participants) {
          setCollaborators(Array.from(roomInstance.participants.values()).map(p => p.identity));
        } else {
          setCollaborators([]);
        }
        
      } catch (e) {
        console.error('LiveKit connect error:', e);
        
        if (mountedRef.current) {
          setConnectionStatus('connection-failed');
          setErrorDetails(e.message || 'Unknown connection error');
        }
      }
    }

    // Connect when component mounts
    connectToRoom();
    
    return () => {
      mountedRef.current = false;
      
      // Remove event listeners
      roomInstance.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
      roomInstance.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      roomInstance.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      roomInstance.off(RoomEvent.DataReceived, handleDataReceived);
      roomInstance.off(RoomEvent.RoomDisconnected, handleError);
      roomInstance.off(RoomEvent.MediaConnectionError, handleError);
      
      // Disconnect from room properly - with additional safety checks
      try {
        if (roomInstance && 
            (roomInstance.state === ConnectionState.Connected || 
             roomInstance.state === ConnectionState.Connecting)) {
          console.log('Cleaning up: disconnecting from room...');
          roomInstance.disconnect(true);
        } else {
          console.log('Cleaning up: room not in connected state, skipping disconnect');
        }
      } catch (err) {
        console.error('Error during cleanup disconnect:', err);
      }
    };
  }, [roomInstance, roomName, username, joined, disconnectRoom]);

  // Clean up stale cursor positions
  useEffect(() => {
    if (Object.keys(cursorPositions).length === 0) return;
    
    const now = Date.now();
    const STALE_THRESHOLD = 5000; // 5 seconds
    
    const stalePositions = Object.entries(cursorPositions).filter(
      ([_, data]) => now - data.timestamp > STALE_THRESHOLD
    );
    
    if (stalePositions.length > 0) {
      setCursorPositions(prev => {
        const updated = { ...prev };
        stalePositions.forEach(([userId]) => {
          delete updated[userId];
        });
        return updated;
      });
    }
  }, [cursorPositions]);

  // Clean up stale typing users
  useEffect(() => {
    if (Object.keys(typingUsers).length === 0) return;
    
    const now = Date.now();
    const TYPING_THRESHOLD = 3000; // 3 seconds
    
    // Use a more efficient approach to clean up stale typing users
    const hasStaleTyping = Object.entries(typingUsers).some(
      ([_, timestamp]) => now - timestamp > TYPING_THRESHOLD
    );
    
    if (hasStaleTyping) {
      setTypingUsers(prev => {
        const updated = {};
        Object.entries(prev).forEach(([userId, timestamp]) => {
          if (now - timestamp <= TYPING_THRESHOLD) {
            updated[userId] = timestamp;
          }
        });
        return updated;
      });
    }
  }, [typingUsers]);

  // If not joined, show the join screen
  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">Join Collaborative Editor</h1>
          
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
            onClick={() => {
              // Only try to disconnect if we're actually connected
              if (roomInstance && 
                  (roomInstance.state === ConnectionState.Connected || 
                   roomInstance.state === ConnectionState.Connecting)) {
                disconnectRoom();
              }
              setJoined(false);
              setConnectionStatus('initializing');
            }}
          >
            Back to Join Screen
          </button>
        </div>
      </div>
    );
  }

  // Connected and ready - render the editor
  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Custom animations */}
      <style jsx global>{typingAnimation}</style>
      
      {/* Header with room info and controls */}
      <div className="bg-slate-800 text-white p-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center">
          <div className="flex items-center bg-slate-700 px-3 py-1 rounded-full">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            <h1 className="text-lg font-semibold mr-2 truncate max-w-[150px] md:max-w-xs">{roomName}</h1>
          </div>
          <span className="ml-2 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
          </span>
          
          {/* Typing indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="ml-3 flex items-center text-xs text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full transition-all duration-300 animate-fade-in">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1 animate-pulse"></span>
              <span>
                {Object.keys(typingUsers).length === 1 
                  ? `${usernameMap[Object.keys(typingUsers)[0]] || Object.keys(typingUsers)[0]} is typing` 
                  : Object.keys(typingUsers).length === 2
                    ? `${usernameMap[Object.keys(typingUsers)[0]] || Object.keys(typingUsers)[0]} and ${usernameMap[Object.keys(typingUsers)[1]] || Object.keys(typingUsers)[1]} are typing`
                    : `${Object.keys(typingUsers).length} people are typing`}
                <span className="typing-dots"></span>
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 items-center">
          {/* Language Selector */}
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-slate-700 text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="cpp">C++</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>
          
          {/* Theme Selector */}
          <select
            value={theme}
            onChange={handleThemeChange}
            className="bg-slate-700 text-white text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
            <option value="hc-black">High Contrast Dark</option>
          </select>
          
          {/* Leave Button */}
          <button 
            onClick={() => {
              // Only try to disconnect if we're actually connected
              if (roomInstance && 
                  (roomInstance.state === ConnectionState.Connected || 
                   roomInstance.state === ConnectionState.Connecting)) {
                disconnectRoom();
              }
              setJoined(false);
              setConnectionStatus('initializing');
            }}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm transition duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Leave Room
          </button>
        </div>
      </div>
      
      {/* Collaborator List */}
      {collaborators.length > 0 && (
        <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 flex flex-wrap gap-2">
          <span className="text-slate-400 text-sm">Collaborators:</span>
          {collaborators.map((collaborator, index) => {
            // Get the display name from the username map or use the identity
            const displayName = usernameMap[collaborator] || collaborator;
            
            // Generate a consistent color for this user
            const userColor = `hsl(${Math.abs(displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360}, 70%, 60%)`;
            
            return (
              <span 
                key={index} 
                className={`px-2 py-1 text-xs rounded-full transition-all duration-300 ${
                  activeEditor === displayName 
                    ? 'bg-indigo-600 text-white shadow-md scale-105' 
                    : 'bg-indigo-500/30 text-indigo-200'
                }`}
                style={{
                  borderLeft: `3px solid ${userColor}`
                }}
              >
                {displayName}
                {activeEditor === displayName && (
                  <span className="ml-1 inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                )}
                {typingUsers[displayName] && activeEditor !== displayName && (
                  <span className="ml-1 inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                )}
              </span>
            );
          })}
        </div>
      )}
      
      {/* Main Editor */}
      <div className="flex-1 overflow-hidden relative">
        <MonacoEditor
          height="100%"
          width="100%"
          language={language}
          theme={theme}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            tabSize: 2,
            renderLineHighlight: 'all',
            fontLigatures: true,
            smoothScrolling: true,
          }}
        />
        
        {/* Cursor Indicators */}
        {Object.entries(cursorPositions).map(([userId, data]) => (
          <div 
            key={userId}
            className="absolute pointer-events-none transition-all duration-100"
            style={{
              left: `${data.position.column * 8}px`,
              top: `${(data.position.lineNumber - 1) * 20}px`,
              zIndex: 10
            }}
          >
            <div 
              className="w-0.5 h-5"
              style={{ backgroundColor: data.color }}
            ></div>
            <div 
              className="px-2 py-1 text-xs rounded shadow-md animate-fade-in"
              style={{ 
                backgroundColor: data.color,
                color: 'white',
                transform: 'translateY(-100%)',
                marginTop: '-4px',
                boxShadow: `0 2px 4px rgba(0,0,0,0.2), 0 0 0 1px ${data.color}`
              }}
            >
              {data.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}