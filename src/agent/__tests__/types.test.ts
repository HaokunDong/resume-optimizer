import { describe, it, expect } from "vitest";
import type {
  ExecutionState,
  KeywordsAnalysis,
  ResumeResult,
  AgentConfig,
  ToolDefinition,
} from "../types";

describe("L1 - Type System", () => {
  describe("KeywordsAnalysis", () => {
    it("应该接受 matched 和 missing 字段", () => {
      const analysis: KeywordsAnalysis = {
        matched: ["React", "TypeScript"],
        missing: ["GraphQL"],
      };

      expect(analysis.matched).toHaveLength(2);
      expect(analysis.missing).toHaveLength(1);
    });

    it("应该允许空数组", () => {
      const analysis: KeywordsAnalysis = {
        matched: [],
        missing: [],
      };

      expect(analysis.matched).toEqual([]);
      expect(analysis.missing).toEqual([]);
    });
  });

  describe("ResumeResult", () => {
    it("应该包含所有必需字段", () => {
      const result: ResumeResult = {
        optimized: "优化后的简历内容",
        suggestions: ["建议1", "建议2"],
        keywords: {
          matched: ["React"],
          missing: ["GraphQL"],
        },
      };

      expect(result.optimized).toBeTruthy();
      expect(result.suggestions).toHaveLength(2);
      expect(result.keywords.matched).toContain("React");
    });
  });

  describe("ExecutionState", () => {
    it("应该包含所有状态字段", () => {
      const state: ExecutionState = {
        currentStep: "optimize",
        jd: "测试 JD",
        resume: "测试简历",
        keywords: { matched: [], missing: [] },
        result: null,
        error: null,
        sessionId: "test-session",
        metadata: {
          tokenUsage: 0,
          retryCount: 0,
        },
      };

      expect(state.currentStep).toBe("optimize");
      expect(state.sessionId).toBe("test-session");
      expect(state.metadata.retryCount).toBe(0);
    });
  });

  describe("AgentConfig", () => {
    it("应该提供合理的默认值", () => {
      const config: AgentConfig = {
        maxRetries: 5,
        retryDelay: 2000,
      };

      expect(config.maxRetries).toBe(5);
      expect(config.retryDelay).toBe(2000);
    });
  });

  describe("ToolDefinition", () => {
    it("应该定义工具的输入schema", () => {
      const tool: ToolDefinition = {
        name: "test_tool",
        description: "测试工具",
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string" },
          },
          required: ["input"],
        },
      };

      expect(tool.name).toBe("test_tool");
      expect(tool.inputSchema).toHaveProperty("properties");
    });
  });
});
