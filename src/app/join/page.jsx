"use client";
import { useState } from "react";
import { IoEnterOutline, IoRefreshOutline, IoPersonOutline, IoCopyOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";

export default function JoinRoomComponent() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const generateRoomId = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    setRoomId(newRoomId);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinRoom = () => {
    if (roomId.trim() && name.trim()) {
        console.log("PUsheed")
      router.push(`/dashboard?roomId=${encodeURIComponent(roomId)}&username=${encodeURIComponent(name)}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030014] font-sans flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10" />
      </div>

      <div className="max-w-6xl w-full mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Left side with Simpson SVG */}
          <div className="w-full lg:w-1/2 p-8 flex items-center justify-center bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20">
            <div className="max-w-md">
              <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
                {/* Homer Simpson SVG */}
                <g>
                  {/* Head */}
                  <circle cx="200" cy="150" r="120" fill="#FED90F" />
                  
                  {/* Eyes */}
                  <circle cx="160" cy="120" r="30" fill="white" />
                  <circle cx="240" cy="120" r="30" fill="white" />
                  <circle cx="160" cy="120" r="10" fill="black" />
                  <circle cx="240" cy="120" r="10" fill="black" />
                  
                  {/* Mouth region */}
                  <path d="M140,190 Q200,230 260,190" stroke="#333" strokeWidth="5" fill="none" />
                  <path d="M140,190 Q200,280 260,190" fill="#D8D8D0" />
                  
                  {/* Ear */}
                  <circle cx="80" cy="150" r="20" fill="#FED90F" />
                  <path d="M80,145 Q80,155 75,160" stroke="#333" strokeWidth="2" fill="none" />
                  
                  {/* Hair */}
                  <path d="M120,60 Q150,30 180,50 L190,30 L200,50 Q250,30 280,60" stroke="#333" strokeWidth="3" fill="none" />
                  
                  {/* Body */}
                  <path d="M120,250 Q200,300 280,250 L300,400 L100,400 Z" fill="#0074D9" />
                  <rect x="140" y="400" width="120" height="80" fill="#0074D9" />
                  
                  {/* Collar */}
                  <path d="M150,250 L200,280 L250,250" stroke="white" strokeWidth="8" fill="none" />
                </g>
                
                {/* Code symbols around Homer */}
                <text x="50" y="50" fill="rgba(255,255,255,0.5)" fontSize="20">&lt;/&gt;</text>
                <text x="300" y="80" fill="rgba(255,255,255,0.5)" fontSize="20">{}</text>
                <text x="70" y="350" fill="rgba(255,255,255,0.5)" fontSize="20">const</text>
                <text x="280" y="320" fill="rgba(255,255,255,0.5)" fontSize="20">=&gt;</text>
                <text x="320" y="400" fill="rgba(255,255,255,0.5)" fontSize="20">import</text>
                <text x="30" y="430" fill="rgba(255,255,255,0.5)" fontSize="20">function</text>
              </svg>
            </div>
          </div>
          
          {/* Right side with join room form */}
          <div className="w-full lg:w-1/2 p-8 lg:p-16">
            <div className="max-w-md mx-auto">
              <div className="inline-block py-2 px-4 mb-6 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 backdrop-blur-sm border border-violet-500/30">
                <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  ✨ Real-time Code Collaboration
                </span>
              </div>
              
              <h2 className="text-4xl font-bold mb-8 text-white">
                Join a
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 ml-2">
                  Room
                </span>
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Your Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IoPersonOutline className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">Room ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Enter room ID or generate new"
                    />
                    <div className="absolute inset-y-0 right-0 flex">
                      {roomId && (
                        <button
                          onClick={copyToClipboard}
                          className="px-3 flex items-center justify-center text-gray-400 hover:text-violet-400 transition-colors"
                          title="Copy room ID"
                        >
                          {copied ? (
                            <span className="text-xs text-green-400">Copied!</span>
                          ) : (
                            <IoCopyOutline className="text-lg" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={generateRoomId}
                        className="px-3 flex items-center justify-center text-gray-400 hover:text-violet-400 transition-colors"
                        title="Generate new room ID"
                      >
                        <IoRefreshOutline className="text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomId.trim() || !name.trim()}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transform transition-all hover:scale-105 shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoEnterOutline className="text-lg" />
                  Enter Room
                </button>
                
                <div className="text-center mt-6">
                  <span className="text-gray-400 text-sm">
                    Don't have a room ID?{" "}
                    <button
                      onClick={generateRoomId}
                      className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
                    >
                      Generate one
                    </button>
                  </span>
                </div>
              </div>
              
              <div className="mt-16 flex items-center gap-2 justify-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs border-2 border-[#030014]"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <span className="text-gray-400 text-sm">+10,000 developers collaborating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}