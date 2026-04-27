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
  const apiKey = process.env.CODEBUDDY_API_KEY || "";
  const results: Record<string, any> = {};

  // Test multiple possible endpoints
  const endpoints = [
    "https://copilot.tencent.com/chat/completions",
    "https://api.hunyuan.cloud.tencent.com/v1/chat/completions",
    "https://hunyuan.cloud.tencent.com/v1/chat/completions",
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
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
      results[url] = {
        status: response.status,
        contentType: response.headers.get("content-type"),
        bodyPreview: text.slice(0, 200),
      };
    } catch (error: any) {
      results[url] = { error: error.message };
    }
  }

  return NextResponse.json(results);
}
