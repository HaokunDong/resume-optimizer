// ============================================================
// L2 - 工具系统层: 工具定义和调用
// ============================================================

import { KeywordsAnalysis, ResumeResult } from "./types";
import { getLLMAdapter } from "./codebuddy-http";

// L2 - 工具定义
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
}

// 可用工具列表
export const TOOLS: ToolDefinition[] = [
  {
    name: "analyze_jd",
    description: "分析 JD 中的关键词和技能要求",
    inputSchema: {
      type: "object",
      properties: {
        jd: { type: "string", description: "岗位 JD 内容" },
      },
      required: ["jd"],
    },
  },
  {
    name: "optimize_resume",
    description: "根据 JD 关键词优化简历内容",
    inputSchema: {
      type: "object",
      properties: {
        resume: { type: "string", description: "原始简历" },
        keywords: {
          type: "object",
          description: "关键词分析结果",
          properties: {
            matched: { type: "array", items: { type: "string" } },
            missing: { type: "array", items: { type: "string" } },
          },
        },
      },
      required: ["resume", "keywords"],
    },
  },
];

// L2 - 工具执行器
export class ToolExecutor {
  private codebuddy: any;
  private tokenUsage: number = 0;

  constructor() {
    this.codebuddy = getLLMAdapter();
  }

  // 分析 JD 关键词
  async analyzeJD(jd: string): Promise<KeywordsAnalysis> {
    console.log("[Harness] 开始分析 JD...");

    const prompt = `你是 JD 分析专家。请从以下岗位 JD 中提取：
1. 必备技能关键词
2. 加分技能关键词
3. 经验要求关键词
4. 软技能关键词

## JD 内容：
${jd}

## 输出格式（严格 JSON）：
{
  "matched": ["从 JD 中提取的所有关键词"],
  "missing": []  // 初次分析为空
}

只返回 JSON，不要其他内容。`;

    try {
      const response = await this.codebuddy.chatCompletionsCreate({
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      console.log("[Harness] API 调用成功");

      this.tokenUsage += response.usage.total_tokens;

      const rawContent = response.choices[0].message.content || "{}";
      // 移除 markdown 代码块
      const content = rawContent.replace(/```json\s*|```\s*$/g, "").trim();
      const result = JSON.parse(content);

      return {
        matched: result.matched || [],
        missing: result.missing || [],
      };
    } catch (error: any) {
      console.error("[Harness] API 错误:", error.message);
      console.error("[Harness] 错误详情:", JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // 优化简历
  async optimizeResume(
    resume: string,
    keywords: KeywordsAnalysis,
    jd: string
  ): Promise<{ optimized: string; suggestions: string[] }> {
    const prompt = `你是专业的简历优化师。

## 目标 JD 关键技能：
${keywords.matched.map((k) => `- ${k}`).join("\n")}

## JD 内容：
${jd}

## 用户简历：
${resume}

## 优化要求：
1. 突出与 JD 匹配的技能和经历
2. 使用更有力的动词描述工作成果
3. 适当量化成果（使用合理的估算数据）
4. 保持简历结构清晰（姓名、教育背景、工作经历、技能）
5. 不要创造虚假信息，只优化表达方式

## 输出格式（严格 JSON）：
{
  "optimized_resume": "优化后的完整简历",
  "suggestions": ["3-5条具体改进建议"]
}

只返回 JSON，不要其他内容。`;

    const response = await this.codebuddy.chatCompletionsCreate({
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    this.tokenUsage += response.usage.total_tokens;

    const rawContent = response.choices[0].message.content || "{}";
    // 移除 markdown 代码块
    const content = rawContent.replace(/```json\s*|```\s*$/g, "").trim();
    const result = JSON.parse(content);

    return {
      optimized: result.optimized_resume || resume,
      suggestions: result.suggestions || [],
    };
  }

  getTokenUsage(): number {
    return this.tokenUsage;
  }
}
