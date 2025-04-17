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

const VideoMeet = () => {
  const [token, setToken] = useState("")
  const [roomName, setRoomName] = useState("")

  const handleConnect = async () => {
    try {

      const response = await fetch("/api/get-participant-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room: roomName,
          username: "User-" + Math.floor(Math.random() * 1000),
        }),
      })
      console.log("response", response)
      const data = await response.json()
      setToken(data.token)
    } catch (error) {
      console.error("Error getting token:", error)
    }
  }

  if (token === "") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">VideoMeet</h1>
            <p className="text-gray-400">Connect to a room to start your meeting</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter room name"
              />
            </div>

            <button
              onClick={handleConnect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded"
              disabled={!roomName}
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      video={true}
      audio={true}
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}

export default VideoMeet
