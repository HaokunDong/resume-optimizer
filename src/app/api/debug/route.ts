import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.DEEPSEEK_API_KEY,
    apiKeyLength: process.env.DEEPSEEK_API_KEY?.length ?? 0,
    apiKeyPrefix: process.env.DEEPSEEK_API_KEY?.slice(0, 8) ?? "MISSING",
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
  });
}

export async function POST() {
  const apiKey = process.env.DEEPSEEK_API_KEY || "";

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 10,
      }),
    });

    const text = await response.text();
    return NextResponse.json({
      apiStatus: response.status,
      contentType: response.headers.get("content-type"),
      apiBody: text.slice(0, 500),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
