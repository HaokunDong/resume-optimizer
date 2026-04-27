import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.CODEBUDDY_API_KEY,
    apiKeyLength: process.env.CODEBUDDY_API_KEY?.length ?? 0,
    apiKeyPrefix: process.env.CODEBUDDY_API_KEY?.slice(0, 8) ?? "MISSING",
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
  });
}
