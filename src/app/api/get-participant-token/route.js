import { AccessToken } from "livekit-server-sdk"

export async function POST(req) {
  try {
    const { room, username } = await req.json()

    if (!room || !username) {
      return new Response(JSON.stringify({ error: "Missing room or username" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    const apiKey = process.env.NEXT_PUBLIC_LIVEKIT_API_KEY
    const apiSecret = process.env.NEXT_PUBLIC_LIVEKIT_API_SECRET

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: username,
    })

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    })

    const token = at.toJwt()

    return new Response(JSON.stringify({ token }), {
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error generating token:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
} 