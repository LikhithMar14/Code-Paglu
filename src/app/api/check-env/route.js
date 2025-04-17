export async function GET() {
  // Check if environment variables are available
  const envVars = {
    LIVEKIT_API_KEY: !!process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: !!process.env.LIVEKIT_API_SECRET,
    NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
  };
  
  return new Response(
    JSON.stringify(envVars),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      } 
    }
  );
} 