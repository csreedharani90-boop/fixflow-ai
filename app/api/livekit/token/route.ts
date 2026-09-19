import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export const runtime = "nodejs";

export async function GET() {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "LiveKit credentials are missing in .env.local",
        },
        { status: 500 }
      );
    }

    const roomName = `fixflow-${Date.now()}`;
    const participantName = `technician-${Date.now()}`;

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: "FixFlow Technician",
      ttl: "1h",
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    console.log("LiveKit token created");
    console.log("Room:", roomName);

    return NextResponse.json({
      success: true,
      token: jwt,
      roomName,
      url: livekitUrl,
    });
  } catch (error: any) {
    console.error("LiveKit token error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Failed to generate LiveKit token",
      },
      { status: 500 }
    )
  };
}