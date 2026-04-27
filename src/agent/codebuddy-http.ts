// ============================================================
// CodeBuddy HTTP API 适配器 - 用于 Vercel 等服务端环境
// ============================================================

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class CodeBuddyHTTPAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CODEBUDDY_API_KEY || "";
    // 中国版 API
    this.baseUrl = "https://copilot.tencent.com/chat/completions";
  }

  async chatCompletionsCreate(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const systemMessage = options.messages.find(m => m.role === "system");
    const otherMessages = options.messages.filter(m => m.role !== "system");
    
    // 添加 JSON 输出提示
    const jsonHint = options.response_format?.type === "json_object"
      ? "\n\n请严格返回 JSON 格式，不要包含其他内容。"
      : "";

    console.log("[CodeBuddy HTTP] 发送请求...");

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "auto",
        messages: [
          ...(systemMessage ? [systemMessage] : []),
          ...otherMessages.map(m => ({
            role: m.role,
            content: m.content + jsonHint
          }))
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CodeBuddy HTTP] API 错误:", response.status, errorText);
      throw new Error(`CodeBuddy API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 适配返回格式
    return {
      id: data.id || `cb-${Date.now()}`,
      model: data.model || "codebuddy",
      choices: [
        {
          message: {
            role: "assistant",
            content: data.choices?.[0]?.message?.content || "",
          },
          finish_reason: data.choices?.[0]?.finish_reason || "stop",
        },
      ],
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || 0,
        completion_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
      },
    };
  }
}

// 工厂函数
let cachedAdapter: CodeBuddyHTTPAdapter | null = null;

export function getCodeBuddyHTTP(): CodeBuddyHTTPAdapter {
  if (!cachedAdapter) {
    cachedAdapter = new CodeBuddyHTTPAdapter();
  }
  return cachedAdapter;
}
