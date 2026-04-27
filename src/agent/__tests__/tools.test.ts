import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolExecutor } from "../tools";
import { getCodeBuddyHTTP } from "../codebuddy-http";

// 顶部 mock — vi.mock 会被 hoisted，在所有 import 之前执行
vi.mock("../codebuddy-http", () => ({
  getCodeBuddyHTTP: vi.fn(),
}));

describe("L2 - Tool System", () => {
  let executor: ToolExecutor;

  beforeEach(() => {
    vi.clearAllMocks();
    // 每个测试前让 factory 返回一个新的 mock 实例
    (getCodeBuddyHTTP as any).mockReturnValue({
      chatCompletionsCreate: vi.fn(),
    });
    executor = new ToolExecutor();
  });

  describe("analyzeJD", () => {
    it("应该解析 JD 返回关键词匹配结果", async () => {
      const mock = getCodeBuddyHTTP() as any;

      mock.chatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                matched: ["React", "TypeScript", "Node.js", "REST API"],
                missing: [],
              }),
            },
          },
        ],
        usage: { total_tokens: 150 },
      });

      const result = await executor.analyzeJD(
        "需要 React、TypeScript、Node.js 经验"
      );

      expect(result.matched).toContain("React");
      expect(result.matched).toContain("TypeScript");
      expect(result.matched).toContain("Node.js");
      expect(mock.chatCompletionsCreate).toHaveBeenCalledTimes(1);
    });

    it("遇到 API 错误应该抛出异常", async () => {
      const mock = getCodeBuddyHTTP() as any;
      mock.chatCompletionsCreate.mockRejectedValue(new Error("API Error"));

      await expect(executor.analyzeJD("测试 JD")).rejects.toThrow(
        "API Error"
      );
    });
  });

  describe("optimizeResume", () => {
    it("应该返回优化后的简历和建议", async () => {
      const mock = getCodeBuddyHTTP() as any;

      mock.chatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                optimized_resume: "优化后的简历内容...",
                suggestions: ["增加量化数据", "突出 TypeScript 经验"],
              }),
            },
          },
        ],
        usage: { total_tokens: 300 },
      });

      const result = await executor.optimizeResume(
        "原始简历",
        { matched: ["React"], missing: ["TypeScript"] },
        "需要 React 经验"
      );

      expect(result.optimized).toBeTruthy();
      expect(result.suggestions).toHaveLength(2);
    });

    it("应该处理 markdown 代码块包裹的 JSON", async () => {
      const mock = getCodeBuddyHTTP() as any;

      mock.chatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content:
                '```json\n{"matched":["Vue"],"missing":[]}\n```',
            },
          },
        ],
        usage: { total_tokens: 50 },
      });

      const result = await executor.analyzeJD("Vue 开发者");

      expect(result.matched).toContain("Vue");
    });

    it("应该正确追踪 token 使用量", async () => {
      const mock = getCodeBuddyHTTP() as any;

      mock.chatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                matched: ["Go"],
                missing: [],
              }),
            },
          },
        ],
        usage: { total_tokens: 100 },
      });

      await executor.analyzeJD("Go 开发者");
      expect(executor.getTokenUsage()).toBe(100);

      mock.chatCompletionsCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                optimized_resume: "opt",
                suggestions: [],
              }),
            },
          },
        ],
        usage: { total_tokens: 200 },
      });

      await executor.optimizeResume("raw", { matched: [], missing: [] }, "JD");
      expect(executor.getTokenUsage()).toBe(300);
    });
  });
});
