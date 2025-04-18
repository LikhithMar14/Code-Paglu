"use client"

import { useState, useEffect } from "react"
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react"
import "@livekit/components-styles"
import { Camera, MicrophoneOff, Mic, CameraOff, ScreenShare, Phone, UserPlus, Settings } from "lucide-react"

export const VideoMeet = ({ token, roomName }) => {
  const [error, setError] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  
  // Handle connection errors
  const handleError = (err) => {
    console.error("LiveKit connection error:", err)
    setError("Failed to connect to meeting room. Please check your connection.")
    setIsConnected(false)
  }
  
  // Handle successful connection
  const handleConnected = () => {
    setIsConnected(true)
    setError("")
  }

  // Environmental variables check
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      setError("LiveKit server URL is not configured properly.")
    }
  }, [])

  // Validate props
  useEffect(() => {
    if (!token) {
      setError("Authentication token is required.")
    }
    if (!roomName) {
      setError("Room name is required.")
    }
  }, [token, roomName])

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <h2 className="text-xl font-semibold text-white">{roomName || "Video Conference"}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-all">
            <UserPlus size={16} />
            <span>Invite</span>
          </button>
          <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-all">
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-500 text-white text-center">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative">
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          connect={true}
          video={true}
          audio={true}
          onError={handleError}
          onConnected={handleConnected}
          data-lk-theme="default"
        >
          <div className="h-full">
            <VideoConference
              className="rounded-lg overflow-hidden h-full"
              style={{
                height: "100%",
                borderRadius: "0.5rem",
              }}
            />

          </div>
          
          {/* Custom control bar */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center justify-center space-x-4 bg-gray-800 bg-opacity-80 p-3 rounded-full backdrop-blur-sm shadow-lg">
            <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all">
              <Mic size={20} />
            </button>
            <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all">
              <Camera size={20} />
            </button>
            <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all">
              <ScreenShare size={20} />
            </button>
            <button className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all">
              <Phone size={20} />
            </button>
          </div>
          
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  )
}

export default VideoMeet