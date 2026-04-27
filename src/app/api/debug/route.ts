import { NextResponse } from "next/server";
import { ToolExecutor } from "@/agent/tools";

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

export async function POST() {
  const executor = new ToolExecutor();
  try {
    const result = await executor.analyzeJD("React 工程师，需要 TypeScript 和 Node.js");
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      cause: error.cause,
    }, { status: 200 });
  }
}
