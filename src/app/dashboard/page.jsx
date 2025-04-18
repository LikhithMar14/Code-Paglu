"use client";

import { useEffect, useState } from "react";
import { MonacoEditorPage } from "@/components/monacoEditor";
import { VideoMeet } from "@/components/video-meet";
import { motion } from "framer-motion";
import { 
    Code2, 
    Video,
    MessageSquare,
    ChevronRight,
    Menu
} from "lucide-react";

import { LiveKitRoom } from "@livekit/components-react";
import LiveKitChat from "@/components/chat";
import '../livekit-styles';

const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("editor");
    const [roomId, setRoomId] = useState("");
    const [username, setUsername] = useState("");
    const [token, setToken] = useState("");


    useEffect(() => {
        // Use regex to extract query parameters from the URL
        const url = window.location.href;
        const matchRoom = url.match(/[?&]roomId=([^&]+)/);
        const matchUser = url.match(/[?&]username=([^&]+)/);

        const room = matchRoom ? decodeURIComponent(matchRoom[1]) : '';
        const user = matchUser ? decodeURIComponent(matchUser[1]) : '';

        if (room) setRoomId(room);
        if (user) setUsername(user);

        if (room && user) {
            const fetchToken = async () => {
                try {
                    console.log("Fetching token for:", { room, user });
                    const response = await fetch(
                        `/api/token?room=${encodeURIComponent(room)}&username=${encodeURIComponent(user)}`
                    );
                    const data = await response.json();
                    console.log("Token received:", data.token ? "Token exists" : "No token");
                    setToken(data.token);
                } catch (error) {
                    console.error("Error fetching token:", error);
                }
            };

            fetchToken();
        }
    }, []);


    console.log("Dashboard state:", { roomId, username, hasToken: !!token });

    const handleMessageReceived = (message) => {
        // Log the received message for debugging
        console.log("Message received:", message);
        
        // You can add additional processing here if needed
        // For example, you could update a notification system or
        // trigger a sound effect when a new message arrives
        
        // If you want to store messages at the dashboard level
        // you could add a state variable for messages and update it here
    };

    // Function to handle typing indicators
    const handleTypingIndicator = (data) => {
        if (data.type === 'typing') {
            console.log(`${data.user.name} is ${data.isTyping ? 'typing' : 'not typing'}`);
            // You could update UI to show typing indicators
        }
    };

    const menuItems = [
        { icon: <Code2 className="h-5 w-5" />, label: "Editor", id: "editor" },
        { icon: <Video className="h-5 w-5" />, label: "Video", id: "video" },
        { icon: <MessageSquare className="h-5 w-5" />, label: "Chat", id: "chat" },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Sidebar */}
            <motion.div
                initial={{ x: -250 }}
                animate={{ x: isSidebarOpen ? 0 : -250 }}
                transition={{ duration: 0.3 }}
                className="fixed left-0 top-0 h-full w-64 bg-black/30 backdrop-blur-lg border-r border-white/10 z-40"
            >
                <div className="p-4">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                            Code Paglu
                        </h1>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <nav className="space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                    activeTab === item.id
                                        ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-white/10"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
                {/* Header */}
                <header className="h-16 border-b border-white/10 bg-black/30 backdrop-blur-lg flex items-center justify-between px-6">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </header>

                {/* Content Area */}
                <main className="p-6">
                    {activeTab === "editor" && <MonacoEditorPage token={token} roomId={roomId} />}
                    {activeTab === "video" && <VideoMeet token={token? token : ""} roomName={roomId}/>}
                    {activeTab === "chat" && token && (
                                <LiveKitRoom
                                token={token}
                                serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                                connect={true}
                                data-lk-theme="default"
                                className="h-full"
                              >
                                <LiveKitChat
                                  roomId={roomId}
                                  userName={username}
                                  onMessageReceived={handleMessageReceived}
                                />
                              </LiveKitRoom>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
