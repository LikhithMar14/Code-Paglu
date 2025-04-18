"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Room, RoomEvent, ConnectionState } from 'livekit-client';
import { RoomContext } from '@livekit/components-react';
import debounce from 'lodash/debounce';

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

// Map Monaco language identifiers to Piston API language identifiers
const LANGUAGE_MAPPING = {
  "cpp": "cpp",
  "c": "c",
  "javascript": "javascript",
  "python": "python",
  "java": "java",
  "csharp": "csharp",
  "php": "php",
  "ruby": "ruby",
  "go": "go",
  "rust": "rust",
};

const THEMES = ["vs", "vs-dark", "hc-black", "hc-light"];

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

export const MonacoEditorPage = ({ token, roomId }) => {
  // State variables
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

  // Collaboration state
  const [roomInstance] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
  }));
  const [roomName, setRoomName] = useState('editor-room');
  const [username, setUsername] = useState(() => {
    if (roomId) {
      return `user-${roomId.substring(0, 6)}`;
    }
    return `user-${Date.now().toString(36).substring(2, 8)}`;
  });
  const [joined, setJoined] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('initializing');
  const [errorDetails, setErrorDetails] = useState(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [editorInstance, setEditorInstance] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const [cursorPositions, setCursorPositions] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [usernameMap, setUsernameMap] = useState({});
  const [participantCount, setParticipantCount] = useState(0);

  // Refs
  const ignoreChanges = useRef(false);
  const mountedRef = useRef(true);

  // Event handler functions
  const handleConnectionStateChanged = useCallback((state) => {
    if (!mountedRef.current) return;
    
    setConnectionStatus(state);
    console.log('Connection state changed:', state);
    
    if (state === ConnectionState.Disconnected) {
      setJoined(false);
    }
  }, []);

  const handleError = useCallback((error) => {
    if (!mountedRef.current) return;
    console.error('Room error:', error);
    setErrorDetails(error.message);
  }, []);

  const handleParticipantConnected = useCallback(() => {
    if (!mountedRef.current) return;
    
    // Check if roomInstance and participants exist before accessing
    if (roomInstance && roomInstance.participants) {
      const participants = Array.from(roomInstance.participants.values());
      setCollaborators(participants);
      setParticipantCount(participants.length + 1); // +1 for local participant
      
      console.log('Participant connected. Total participants:', participants.length + 1);
    }
  }, [roomInstance]);

  const handleParticipantDisconnected = useCallback(() => {
    if (!mountedRef.current) return;
    
    // Check if roomInstance and participants exist before accessing
    if (roomInstance && roomInstance.participants) {
      const participants = Array.from(roomInstance.participants.values());
      setCollaborators(participants);
      setParticipantCount(participants.length + 1);
      
      console.log('Participant disconnected. Total participants:', participants.length + 1);
    }
  }, [roomInstance]);

  const handleDataReceived = useCallback((payload, participant) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(payload));
      console.log("Data received:", data);
      
      // Handle different types of data
      switch (data.type) {
        case 'code-update':
          // Only update code if it's from another participant
          if (data.username !== username && !ignoreChanges.current) {
            console.log("Updating code from participant:", data.username);
            setCode(data.content);
            
            // Update language if it changed
            if (data.language && data.language !== language) {
              setLanguage(data.language);
            }
          }
          break;
          
        case 'cursor-position':
          // Update cursor position for other participants
          if (data.username !== username) {
            setCursorPositions(prev => ({
              ...prev,
              [data.username]: {
                position: data.position,
                color: data.color,
                timestamp: data.timestamp
              }
            }));
          }
          break;
          
        case 'language-change':
          // Update language if it changed
          if (data.language && data.language !== language) {
            setLanguage(data.language);
          }
          break;
          
        case 'user-joined':
          // Add user to collaborators list
          if (data.username !== username) {
            setCollaborators(prev => {
              if (!prev.includes(data.username)) {
                return [...prev, data.username];
              }
              return prev;
            });
            
            // Update username map
            setUsernameMap(prev => ({
              ...prev,
              [data.username]: data.username
            }));
          }
          break;
          
        default:
          console.log("Unknown data type:", data.type);
      }
    } catch (error) {
      console.error("Error handling received data:", error);
    }
  }, [username, language]);

  // Disconnect from LiveKit room
  const disconnectRoom = useCallback(() => {
    try {
      if (roomInstance && roomInstance.state === ConnectionState.Connected) {
        console.log("Disconnecting from room");
        roomInstance.disconnect();
        setJoined(false);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error("Error disconnecting from room:", error);
    }
  }, [roomInstance]);

  // Connect to LiveKit room
  const connectToRoom = useCallback(async () => {
    if (!token) {
      console.error("No token provided for room connection");
      setErrorDetails("No token provided for room connection");
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // Connect to the room
      await roomInstance.connect(
        process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com',
        token
      );
      
      console.log("Connected to room:", roomName);
      setJoined(true);
      setConnectionStatus('connected');
      
      // Set up event listeners
      roomInstance.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
      roomInstance.on(RoomEvent.Disconnected, () => {
        console.log("Disconnected from room");
        setJoined(false);
        setConnectionStatus('disconnected');
      });
      roomInstance.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
      roomInstance.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      roomInstance.on(RoomEvent.DataReceived, handleDataReceived);
      
      // Update participant count
      if (roomInstance && roomInstance.participants) {
        setParticipantCount(roomInstance.participants.size + 1);
      } else {
        setParticipantCount(1); // Just the local participant
      }
      
      // Notify others that we've joined
      if (roomInstance.localParticipant) {
        const data = {
          type: 'user-joined',
          username,
          timestamp: Date.now()
        };
        
        roomInstance.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify(data)),
          { reliable: true }
        );
      }
    } catch (error) {
      console.error("Failed to connect to room:", error);
      setErrorDetails(error.message || "Failed to connect to room");
      setConnectionStatus('error');
    }
  }, [token, roomName, roomInstance, username, handleConnectionStateChanged, handleParticipantConnected, handleParticipantDisconnected, handleDataReceived]);

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

  // Handle language change with collaboration
  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    setCode(getLanguagePlaceholder(newLang));
    
    if (roomInstance && 
        roomInstance.state === ConnectionState.Connected && 
        roomInstance.localParticipant) {
      try {
        const data = {
          type: 'language-change',
          language: newLang,
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
  }, [roomInstance]);

  const handleEditorChange = useCallback((value) => {
    setCode(value);
    
    // Collaboration: Update typing status with debounce
    const now = Date.now();
    setTypingUsers(prev => ({
      ...prev,
      [username]: now
    }));
    
    // Send code updates to room participants
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
  }, [roomInstance, username, language, isEditorReady]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    console.log("Editor mounted successfully");
    setEditorInstance(editor);
    setIsEditorReady(true);
    editor.focus();

    // Set up cursor position tracking
    editor.onDidChangeCursorPosition(handleCursorPositionChanged);
    
    // Set up a debounced version for performance
    const debouncedCursorUpdate = debounce(handleCursorPositionChanged, 50);
    editor.onDidChangeCursorSelection(debouncedCursorUpdate);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
      console.log("Saving code:", code);
    });

    // Add run command shortcut (Ctrl+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
      runCode();
    });
  }, [handleCursorPositionChanged, code]);

  const handleJoinRoom = useCallback(() => {
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
  }, [roomName, username]);

  // Language-specific placeholders
  const getLanguagePlaceholder = useCallback((lang) => {
    switch (lang) {
      case "javascript":
        return "// JavaScript Example\nconst input = prompt('Enter your name:');\nconsole.log(`Hello, ${input}!`);\n";
      case "python":
        return "# Python Example\nname = input('Enter your name: ')\nprint(f'Hello, {name}!')\n";
      case "java":
        return "// Java Example\nimport java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    System.out.print(\"Enter your name: \");\n    String name = scanner.nextLine();\n    System.out.println(\"Hello, \" + name + \"!\");\n  }\n}\n";
      case "c":
        return "// C Example\n#include <stdio.h>\n\nint main() {\n  char name[50];\n  printf(\"Enter your name: \");\n  scanf(\"%s\", name);\n  printf(\"Hello, %s!\\n\", name);\n  return 0;\n}\n";
      case "cpp":
        return "// C++ Example\n#include <iostream>\n#include <string>\n\nint main() {\n  std::string name;\n  std::cout << \"Enter your name: \";\n  std::cin >> name;\n  std::cout << \"Hello, \" << name << \"!\" << std::endl;\n  return 0;\n}\n";
      case "go":
        return "// Go Example\npackage main\n\nimport (\n  \"fmt\"\n  \"bufio\"\n  \"os\"\n  \"strings\"\n)\n\nfunc main() {\n  reader := bufio.NewReader(os.Stdin)\n  fmt.Print(\"Enter your name: \")\n  name, _ := reader.ReadString('\\n')\n  name = strings.TrimSpace(name)\n  fmt.Printf(\"Hello, %s!\\n\", name)\n}\n";
      default:
        return "// Write your code here";
    }
  }, []);

  const runCode = useCallback(async () => {
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
      if (!code.includes("main(") && !code.includes("main (")) {
        setError("Your code must include a main function.");
        setIsRunning(false);
        return;
      }
    }
    
    if (language === "go" && !code.includes("package main")) {
      // For Go, add package main if not present
      codeToRun = "package main\n\n" + code;
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
              content: codeToRun,
            },
          ],
          stdin: userInput, // Use the user input
          args: [],
          compile_timeout: 10000,
          run_timeout: 5000,
        }),
      });

      const data = await response.json();
      
      if (data.run) {
        if (data.run.stderr) {
          setError(data.run.stderr);
          setOutput("");
        } else {
          setOutput(data.run.output || "Program executed successfully with no output.");
        }
      } else if (data.compile && data.compile.stderr) {
        // Handle compilation errors
        setError(data.compile.stderr);
        setOutput("");
      } else {
        setError("Failed to execute code.");
      }
    } catch (err) {
      setError(`Error executing code: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, language, userInput]);

  // Adjust editor height based on screen size
  const adjustEditorHeight = useCallback(() => {
    if (window.innerWidth < 768) {
      setEditorHeight("300px");
    } else {
      setEditorHeight("400px");
    }
  }, []);

  // Initialize room connection when component mounts
  useEffect(() => {
    if (token && roomId && !joined) {
      console.log("Initializing room connection with token and roomId:", { roomId });
      setRoomName(roomId);
      connectToRoom();
    }
  }, [token, roomId, joined, connectToRoom]);

  // Clean up room connection when component unmounts
  useEffect(() => {
    return () => {
      if (roomInstance && roomInstance.state === ConnectionState.Connected) {
        console.log("Disconnecting from room on component unmount");
        roomInstance.disconnect();
      }
    };
  }, [roomInstance]);

  // Connect to LiveKit room and sync data
  useEffect(() => {
    if (!joined) return;
    
    mountedRef.current = true;
    
    // Cleanup
    return () => {
      mountedRef.current = false;
      disconnectRoom();
      
      roomInstance
        .off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
        .off(RoomEvent.Disconnected, () => handleConnectionStateChanged(ConnectionState.Disconnected))
        .off(RoomEvent.ParticipantConnected, handleParticipantConnected)
        .off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
        .off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [joined, roomInstance, username, disconnectRoom, handleConnectionStateChanged, handleParticipantConnected, handleParticipantDisconnected, handleDataReceived]);

  // Use useEffect for the resize event listener
  useEffect(() => {
    // Add event listener
    window.addEventListener("resize", adjustEditorHeight);
    
    // Call once to set initial height
    adjustEditorHeight();
    
    // Cleanup function to remove event listener when component unmounts
    return () => {
      window.removeEventListener("resize", adjustEditorHeight);
    };
  }, [adjustEditorHeight]);

  const isLanguageRunnable = RUNNABLE_LANGUAGES.hasOwnProperty(language);

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
         Code Editor
      </h1>

      {/* Collaboration Controls */}
    
        <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-400">Room: </span>
              <span className="text-white font-medium">{roomName}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-sm text-gray-400">Connected as: </span>
              {/* <span className="text-white font-medium">{username}</span> */}
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-sm text-gray-400">Participants: </span>
              <span className="text-white font-medium">{participantCount}</span>
            </div>
            <button
              onClick={disconnectRoom}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              Leave Room
            </button>
          </div>
        </div>
      

      {/* Editor Controls */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-4">
        <div className="w-1/2 sm:w-auto">
          <label htmlFor="language-select" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
            Language:
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full sm:w-40 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang} className="bg-black">
                {lang} {RUNNABLE_LANGUAGES[lang] ? "(runnable)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="w-1/2 sm:w-auto">
          <label htmlFor="theme-select" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
            Theme:
          </label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full sm:w-40 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm"
          >
            {THEMES.map((t) => (
              <option key={t} value={t} className="bg-black">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="w-1/3 sm:w-auto">
          <label htmlFor="font-size" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
            Font Size:
          </label>
          <input
            id="font-size"
            type="number"
            min="10"
            max="30"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full sm:w-20 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm"
          />
        </div>

        <div className="w-1/3 sm:w-auto flex items-center">
          <label htmlFor="minimap-toggle" className="block text-xs sm:text-sm font-medium text-gray-400 mr-2">
            Minimap:
          </label>
          <input
            id="minimap-toggle"
            type="checkbox"
            checked={minimapEnabled}
            onChange={(e) => setMinimapEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-white/5 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
          />
        </div>
      </div>

      {/* Editor */}
      <div className="mb-4">
        <MonacoEditor
          height={editorHeight}
          language={language}
          theme={theme}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: fontSize,
            minimap: { enabled: minimapEnabled },
            automaticLayout: true,
          }}
        />
      </div>

      {/* Output Section */}
      <div className="mb-2 sm:mb-4">
        <label htmlFor="user-input" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
          Input (stdin):
        </label>
        <textarea
          id="user-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter input for your program here..."
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm resize-y"
          rows="3"
        />
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-4">
        <button
          onClick={runCode}
          disabled={isRunning || !isLanguageRunnable}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
            isLanguageRunnable
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
              : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
          }`}
        >
          {isRunning ? "Running..." : "Run Code"} {isLanguageRunnable ? "(Ctrl+Enter)" : "(Not Available)"}
        </button>
        {!isLanguageRunnable && (
          <p className="text-yellow-500 self-center text-xs sm:text-sm">
            Selected language is not supported for execution.
          </p>
        )}
      </div>

      {showOutput && (
        <div className="mt-2 sm:mt-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-300">Output:</h2>
          {error && (
            <div className="bg-red-500/10 text-red-400 p-2 sm:p-4 mt-2 rounded-lg border border-red-500/20 overflow-x-auto">
              <p className="font-semibold">Error:</p>
              <pre className="mt-2 whitespace-pre-wrap text-sm">{error}</pre>
            </div>
          )}
          {output && (
            <pre className="bg-white/5 p-2 sm:p-4 mt-2 rounded-lg border border-white/10 overflow-x-auto text-gray-300 whitespace-pre-wrap text-sm">
              {output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default MonacoEditorPage;