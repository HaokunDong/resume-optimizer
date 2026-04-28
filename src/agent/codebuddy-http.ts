// ============================================================
// L2 - LLM 适配器层（当前使用 DeepSeek API）
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

export class LLMAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(options?: { apiKey?: string; baseUrl?: string }) {
    this.apiKey = options?.apiKey || process.env.DEEPSEEK_API_KEY || "";
    this.baseUrl = options?.baseUrl || "https://api.deepseek.com/v1";
  }

  async chatCompletionsCreate(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const systemMessage = options.messages.find(m => m.role === "system");
    const otherMessages = options.messages.filter(m => m.role !== "system");

    const jsonHint = options.response_format?.type === "json_object"
      ? "\n\n请严格返回 JSON 格式，不要包含其他内容。"
      : "";

    console.log("[LLM] 发送请求到 DeepSeek...");

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
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
      console.error("[LLM] API 错误:", response.status, errorText);
      throw new Error(`LLM API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      id: data.id || `ds-${Date.now()}`,
      model: data.model || "deepseek-chat",
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
let cachedAdapter: LLMAdapter | null = null;

export function getLLMAdapter(): LLMAdapter {
  if (!cachedAdapter) {
    cachedAdapter = new LLMAdapter();
  }
  return cachedAdapter;
}
