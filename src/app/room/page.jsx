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
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const LANGUAGES = [
  "javascript",
  "typescript",
  "html",
  "css",
  "json",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "php",
  "ruby",
  "go",
  "rust",
  "sql",
  "markdown",
  "yaml",
  "shell",
  "xml",
];

// Languages supported by Piston API with correct language identifiers
const RUNNABLE_LANGUAGES = {
  "javascript": { language: "javascript", version: "18.15.0" },
  "python": { language: "python", version: "3.10.0" },
  "java": { language: "java", version: "15.0.2" },
  "c": { language: "c", version: "10.2.0" },
  "cpp": { language: "cpp", version: "10.2.0" },
  "csharp": { language: "csharp", version: "6.12.0" },
  "php": { language: "php", version: "8.2.3" },
  "ruby": { language: "ruby", version: "3.2.1" },
  "go": { language: "go", version: "1.20.2" },
  "rust": { language: "rust", version: "1.68.2" },
};

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
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Join Room</h1>
          
          {errorDetails && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded">
              {errorDetails}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room name"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>
          
          <Button 
            onClick={handleJoinRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Join Room
          </Button>
        </div>
      </div>
    );
  }

  // If joined, show the room with editor
  return (
    <RoomContext.Provider value={roomInstance}>
      <CombinedRoom room={roomInstance} roomName={roomName} username={username} onLeave={() => setJoined(false)} />
    </RoomContext.Provider>
  );
}

function CombinedRoom({ room, roomName, username, onLeave }) {
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
  const [showEditor, setShowEditor] = useState(true);
  const [editorLayout, setEditorLayout] = useState('split'); // 'split', 'full', 'hidden'
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries, setMaxRetries] = useState(3);
  const chatContainerRef = useRef(null);
  const controlsContainerRef = useRef(null);
  
  // Editor state
  const [code, setCode] = useState("// Write your code here");
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [error, setError] = useState("");
  const [userInput, setUserInput] = useState("");
  const [editorHeight, setEditorHeight] = useState("400px");
  
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
      
      // Clear any existing timeout
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      // Set a new timeout to hide controls after 3 seconds
      const timeout = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3000);
      
      setControlsTimeout(timeout);
    };
    
    // Add event listener
    document.addEventListener('mousemove', handleMouseMove);
    
    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

  // Handle connection state changes
  const handleConnectionStateChanged = (state) => {
    console.log('Connection state changed:', state);
    setConnectionStatus(state);
    
    if (state === ConnectionState.Connected) {
      console.log('Connected to room');
      setRetryCount(0); // Reset retry count on successful connection
    } else if (state === ConnectionState.Disconnected) {
      console.log('Disconnected from room');
    } else if (state === ConnectionState.Connecting) {
      console.log('Connecting to room...');
    } else if (state === ConnectionState.Reconnecting) {
      console.log('Reconnecting to room...');
    }
  };

  // Handle participant connected
  const handleParticipantConnected = () => {
    console.log('Participant connected');
    setParticipantCount(room.participants.size + 1); // +1 for local participant
  };

  // Handle participant disconnected
  const handleParticipantDisconnected = () => {
    console.log('Participant disconnected');
    setParticipantCount(room.participants.size + 1); // +1 for local participant
  };

  // Handle data received
  const handleDataReceived = (payload, participant) => {
    console.log('Data received:', payload, 'from:', participant.identity);
    
    try {
      const data = JSON.parse(new TextDecoder().decode(payload));
      
      if (data.type === 'chat') {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          sender: participant.identity,
          message: data.message,
          timestamp: new Date().toISOString()
        }]);
      } else if (data.type === 'code') {
        // Handle code updates from other participants
        setCode(data.code);
        setLanguage(data.language);
      }
    } catch (e) {
      console.error('Error parsing data:', e);
    }
  };

  // Connect to room
  useEffect(() => {
    let mounted = true;
    let connectionTimeout;
    
    // Add event listeners
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.DataReceived, handleDataReceived);
    
    async function connectToRoom() {
      try {
        setConnectionStatus('connecting');
        
        // Check environment variables first
        const envCheckResponse = await fetch('/api/check-env');
        const envCheckData = await envCheckResponse.json();
        console.log('Environment check:', envCheckData);
        
        if (!envCheckData.LIVEKIT_API_KEY || !envCheckData.LIVEKIT_API_SECRET || !envCheckData.NEXT_PUBLIC_LIVEKIT_URL) {
          throw new Error('Missing required environment variables');
        }
        
        // Get token from server
        console.log('Fetching token for room:', roomName, 'username:', username);
        const response = await fetch(`/api/get-token?room=${roomName}&username=${username}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Token fetch failed:', response.status, errorText);
          throw new Error(`Failed to get token: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Token response received:', !!data.token);
        
        if (!data.token) {
          throw new Error('No token received from server');
        }
        
        // Get WebSocket URL from environment
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        
        if (!wsUrl) {
          throw new Error("Missing NEXT_PUBLIC_LIVEKIT_URL - Make sure it's properly set in your environment");
        }
        
        console.log('Connecting to LiveKit server:', wsUrl);
        console.log('Room name:', roomName);
        console.log('Username:', username);
        
        // Connect to the room with the token string directly
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
        
        // Retry connection if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(`Retrying connection (${retryCount + 1}/${maxRetries})...`);
          setRetryCount(prev => prev + 1);
          
          // Wait 2 seconds before retrying
          connectionTimeout = setTimeout(() => {
            if (mounted) {
              connectToRoom();
            }
          }, 2000);
        }
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
      
      // Clear any pending timeouts
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      
      // Disconnect from room
      if (room && room.state !== ConnectionState.Disconnected) {
        room.disconnect();
      }
    };
  }, [room, roomName, username, retryCount, maxRetries]);
  
  // Send chat message function
  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim() || !room || !room.localParticipant) return;
    
    // Check if the room is connected before sending data
    if (room.state !== ConnectionState.Connected) {
      console.warn('Cannot send chat message: Room is not connected');
      setErrorDetails('Cannot send message: Room is not connected');
      return;
    }
    
    try {
      const data = {
        type: 'chat',
        message: chatInput.trim()
      };
      
      const encoded = new TextEncoder().encode(JSON.stringify(data));
      room.localParticipant.publishData(encoded);
      
      // Add message to local chat
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        sender: room.localParticipant.identity,
        message: chatInput.trim(),
        timestamp: new Date().toISOString()
      }]);
      
      // Clear input
      setChatInput('');
    } catch (e) {
      console.error('Error sending chat message:', e);
      setErrorDetails('Failed to send message: ' + e.message);
      
      // If we get a connection error, try to reconnect
      if (e.message && e.message.includes('PC manager is closed')) {
        console.log('Connection appears to be closed, attempting to reconnect...');
        // Only attempt to reconnect if we're not already trying
        if (connectionStatus !== 'connecting' && connectionStatus !== 'reconnecting') {
          setConnectionStatus('reconnecting');
          // Trigger a reconnection by updating the retry count
          setRetryCount(prev => prev + 1);
        }
      }
    }
  }, [chatInput, room, connectionStatus]);
  
  // Send code update function
  const sendCodeUpdate = useCallback(() => {
    if (!room || !room.localParticipant) return;
    
    // Check if the room is connected before sending data
    if (room.state !== ConnectionState.Connected) {
      console.warn('Cannot send code update: Room is not connected');
      return;
    }
    
    try {
      const data = {
        type: 'code',
        code: code,
        language: language
      };
      
      const encoded = new TextEncoder().encode(JSON.stringify(data));
      room.localParticipant.publishData(encoded);
    } catch (e) {
      console.error('Error sending code update:', e);
      // If we get a connection error, try to reconnect
      if (e.message && e.message.includes('PC manager is closed')) {
        console.log('Connection appears to be closed, attempting to reconnect...');
        // Only attempt to reconnect if we're not already trying
        if (connectionStatus !== 'connecting' && connectionStatus !== 'reconnecting') {
          setConnectionStatus('reconnecting');
          // Trigger a reconnection by updating the retry count
          setRetryCount(prev => prev + 1);
        }
      }
    }
  }, [code, language, room, connectionStatus]);
  
  // Handle editor changes
  const handleEditorChange = useCallback((value) => {
    setCode(value);
    
    // Only send updates if we're connected
    if (room && room.state === ConnectionState.Connected) {
      // Debounce the code updates to prevent flooding
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      debounceTimeout.current = setTimeout(() => {
        try {
          sendCodeUpdate(value);
        } catch (e) {
          console.error('Error in debounced code update:', e);
          // Don't set error details here as it might flood the UI
        }
      }, 1000); // Wait 1 second before sending update
    }
  }, [room, sendCodeUpdate]);

  const handleEditorDidMount = (editor, monaco) => {
    console.log("Editor mounted successfully");
    editor.focus();

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
      console.log("Saving code:", code);
    });

    // Add run command shortcut (Ctrl+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
      runCode();
    });
  };

  const runCode = async () => {
    setIsRunning(true);
    setShowOutput(true);
    setError("");
    setOutput("Running...");

    if (!RUNNABLE_LANGUAGES[language]) {
      setError(`Language '${language}' is not supported for execution.`);
      setIsRunning(false);
      return;
    }

    // Handle language-specific cases
    let codeToRun = code;
    let langConfig = RUNNABLE_LANGUAGES[language];
    
    // Special handling for certain languages
    if (language === "c" || language === "cpp") {
      // For C/C++, add a main function if not present
      if (!codeToRun.includes("int main(") && !codeToRun.includes("void main(")) {
        codeToRun = `int main() {\n${codeToRun}\nreturn 0;\n}`;
      }
    }

    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: langConfig.language,
          version: langConfig.version,
          files: [
            {
              name: `main.${getFileExtension(language)}`,
              content: codeToRun,
            },
          ],
          stdin: userInput,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOutput(data.output || "No output");
      } else {
        setError(data.error || "Unknown error occurred");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getFileExtension = (lang) => {
    const extensions = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      c: "c",
      cpp: "cpp",
      csharp: "cs",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
    };
    return extensions[lang] || "txt";
  };

  const getLanguagePlaceholder = (lang) => {
    const placeholders = {
      javascript: "// Write your JavaScript code here",
      python: "# Write your Python code here",
      java: "public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n    }\n}",
      c: "int main() {\n    // Write your C code here\n    return 0;\n}",
      cpp: "int main() {\n    // Write your C++ code here\n    return 0;\n}",
      csharp: "using System;\n\nclass Program {\n    static void Main(string[] args) {\n        // Write your C# code here\n    }\n}",
      php: "<?php\n// Write your PHP code here\n?>",
      ruby: "# Write your Ruby code here",
      go: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Write your Go code here\n}",
      rust: "fn main() {\n    // Write your Rust code here\n}",
    };
    return placeholders[lang] || `// Write your ${lang} code here`;
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(getLanguagePlaceholder(newLang));
    sendCodeUpdate();
  };

  const adjustEditorHeight = () => {
    const windowHeight = window.innerHeight;
    // Account for the navbar (48px) and editor toolbar (40px)
    const newHeight = windowHeight - 88;
    setEditorHeight(`${newHeight}px`);
  };

  useEffect(() => {
    adjustEditorHeight();
    window.addEventListener("resize", adjustEditorHeight);
    return () => window.removeEventListener("resize", adjustEditorHeight);
  }, []);

  // Toggle editor visibility
  const toggleEditor = () => {
    if (editorLayout === 'split') {
      setEditorLayout('full');
    } else if (editorLayout === 'full') {
      setEditorLayout('hidden');
    } else {
      setEditorLayout('split');
    }
  };

  // Render the combined room with editor
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Top bar with controls */}
      <div className="flex items-center justify-between h-12 min-h-[48px] px-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-bold">Room: {roomName}</h1>
          <span className="text-sm text-slate-300">|</span>
          <span className="text-sm text-slate-300">User: {username}</span>
          <span className="text-sm text-slate-300">|</span>
          <span className={`text-sm ${connectionStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}`}>
            {connectionStatus}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={toggleEditor}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm"
          >
            {editorLayout === 'split' ? 'Full Editor' : editorLayout === 'full' ? 'Hide Editor' : 'Show Editor'}
          </Button>
          <Button 
            onClick={() => setShowChat(!showChat)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm"
          >
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </Button>
          <Button 
            onClick={onLeave}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Leave Room
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className={`${editorLayout === 'full' ? 'hidden' : editorLayout === 'hidden' ? 'w-full' : 'w-1/2'} h-full`}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <GridLayout
                tracks={tracks}
                style={{ height: '100%' }}
              >
                <ParticipantTile />
              </GridLayout>
            </div>
            <RoomAudioRenderer />
            <EnhancedControlBar 
              room={room} 
              isMobile={isMobile} 
              isVisible={isControlsVisible} 
            />
          </div>
        </div>

        {/* Editor section */}
        {editorLayout !== 'hidden' && (
          <div className={`${editorLayout === 'full' ? 'w-full' : 'w-1/2'} h-full flex flex-col border-l border-slate-700`}>
            <div className="flex items-center justify-between h-10 min-h-[40px] px-4 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
                >
                  <option value="vs-dark">Dark</option>
                  <option value="vs-light">Light</option>
                  <option value="hc-black">High Contrast</option>
                </select>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
                >
                  {[12, 14, 16, 18, 20, 22, 24].map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setMinimapEnabled(!minimapEnabled)}
                  className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
                >
                  {minimapEnabled ? "Hide Minimap" : "Show Minimap"}
                </button>
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  {isRunning ? "Running..." : "Run Code"}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <MonacoEditor
                height="100%"
                language={language}
                theme={theme}
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  fontSize,
                  minimap: { enabled: minimapEnabled },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  roundedSelection: false,
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                  },
                }}
              />
            </div>
            
            {showOutput && (
              <div className="bg-slate-800 p-2 border-t border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-sm font-semibold">Output</h2>
                  <button
                    onClick={() => setShowOutput(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Close
                  </button>
                </div>
                <div className="bg-slate-900 p-2 rounded font-mono text-xs overflow-auto max-h-32">
                  {error ? (
                    <div className="text-red-500">{error}</div>
                  ) : (
                    <pre className="whitespace-pre-wrap">{output}</pre>
                  )}
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-medium mb-1">Input (stdin):</label>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full bg-slate-900 text-white p-1 rounded border border-slate-700 text-xs"
                    rows={2}
                    placeholder="Enter input for your program..."
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat panel */}
        {showChat && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
            <div className="p-2 bg-slate-700 flex justify-between items-center">
              <h2 className="font-semibold">Chat</h2>
              <button 
                onClick={() => setShowChat(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-2 space-y-2"
            >
              {chatMessages.map((msg) => (
                <div key={msg.id} className="bg-slate-700 p-2 rounded">
                  <div className="flex justify-between">
                    <span className="font-semibold text-blue-300">{msg.sender}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{msg.message}</p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-slate-700">
              <div className="flex">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="flex-1 bg-slate-700 text-white px-3 py-1 rounded-l focus:outline-none"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendChatMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-r"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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