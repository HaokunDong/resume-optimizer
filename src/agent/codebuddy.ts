// ============================================================
// CodeBuddy CLI 适配器 - 通过子进程调用 CLI
// ============================================================

import { spawn } from "child_process";

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

export class CodeBuddyAdapter {
  async chatCompletionsCreate(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const userMessage = options.messages.filter(m => m.role !== "system").map(m => m.content).join("\n");
    
    // 添加 JSON 输出提示
    const jsonHint = options.response_format?.type === "json_object"
      ? "\n\n请严格返回 JSON 格式，不要包含其他内容。"
      : "";

    const fullPrompt = userMessage + jsonHint;

    console.log("[CodeBuddy] 调用 CLI...");

    return new Promise((resolve, reject) => {
      const child = spawn("codebuddy", [
        "-p", fullPrompt,
        "--dangerously-skip-permissions"
      ], {
        env: {
          ...process.env,
          CODEBUDDY_API_KEY: process.env.CODEBUDDY_API_KEY,
          CODEBUDDY_INTERNET_ENVIRONMENT: "internal"
        }
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0 && !stdout) {
          console.error("[CodeBuddy] CLI 错误:", stderr);
          reject(new Error(`CodeBuddy CLI 错误: ${stderr}`));
          return;
        }

        const content = stdout.trim();
        // 估算 token
        const estimatedTokens = Math.ceil(content.length / 3);

        resolve({
          id: `cb-${Date.now()}`,
          model: "codebuddy",
          choices: [
            {
              message: {
                role: "assistant",
                content: content,
              },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: Math.ceil(userMessage.length / 4),
            completion_tokens: estimatedTokens,
            total_tokens: Math.ceil(userMessage.length / 4) + estimatedTokens,
          },
        });
      });

      child.on("error", (err) => {
        console.error("[CodeBuddy] 启动失败:", err);
        reject(err);
      });
    });
  }
}

// 工厂函数
let cachedAdapter: CodeBuddyAdapter | null = null;

export function getCodeBuddy(): CodeBuddyAdapter {
  if (!cachedAdapter) {
    cachedAdapter = new CodeBuddyAdapter();
  }
  return cachedAdapter;
}
