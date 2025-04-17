    "use client";

    import { useState } from "react";
    import MonacoEditor from "@/components/monacoEditor";
    import { motion } from "framer-motion";
    import { 
    Code2, 
    Settings, 
    Save, 
    Play, 
    FileCode, 
    FolderGit2,
    ChevronRight,
    Menu
    } from "lucide-react";
    import Link from "next/link";

    const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("editor");

    const menuItems = [
        { icon: <Code2 className="h-5 w-5" />, label: "Editor", id: "editor" },
        { icon: <FileCode className="h-5 w-5" />, label: "My Files", id: "files" },
        { icon: <FolderGit2 className="h-5 w-5" />, label: "Projects", id: "projects" },
        { icon: <Settings className="h-5 w-5" />, label: "Settings", id: "settings" },
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
            
            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Save className="h-4 w-4" />
                <span>Save</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-all">
                <Play className="h-4 w-4" />
                <span>Run</span>
                </button>
            </div>
            </header>

            {/* Content Area */}
            <main className="p-6">
            {activeTab === "editor" && <MonacoEditor />}
            {activeTab === "files" && (
                <div className="text-center text-gray-400 py-12">
                <FileCode className="h-12 w-12 mx-auto mb-4" />
                <p>Your files will appear here</p>
                </div>
            )}
            {activeTab === "projects" && (
                <div className="text-center text-gray-400 py-12">
                <FolderGit2 className="h-12 w-12 mx-auto mb-4" />
                <p>Your projects will appear here</p>
                </div>
            )}
            {activeTab === "settings" && (
                <div className="text-center text-gray-400 py-12">
                <Settings className="h-12 w-12 mx-auto mb-4" />
                <p>Settings will appear here</p>
                </div>
            )}
            </main>
        </div>
        </div>
    );
    };

    export default Dashboard;