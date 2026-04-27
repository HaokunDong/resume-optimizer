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

export async function POST() {
  // 直接测试 CodeBuddy API，不走工具层
  const apiKey = process.env.CODEBUDDY_API_KEY || "";
  const baseUrl = "https://copilot.tencent.com/chat/completions";

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "auto",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 10,
      }),
    });

    const text = await response.text();
    return NextResponse.json({
      apiStatus: response.status,
      apiStatusText: response.statusText,
      apiHeaders: Object.fromEntries(response.headers.entries()),
      apiBody: text.slice(0, 500),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
