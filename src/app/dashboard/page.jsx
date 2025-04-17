"use client";

import { useState } from "react";
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

const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("editor");

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
                    {activeTab === "editor" && <MonacoEditorPage />}
                    {activeTab === "video" && <VideoMeet />}
                    {activeTab === "chat" && (
                        <div className="text-center text-gray-400 py-12">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                            <p>Chat functionality will be implemented here</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;