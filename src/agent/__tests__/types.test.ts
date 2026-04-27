import { describe, it, expect } from "vitest";
import { validateInput, validateResult } from "../types";

describe("L1 - Input Validation", () => {
  describe("validateInput", () => {
    it("应该通过有效输入", () => {
      const result = validateInput({ jd: "React 工程师", resume: "3年经验" });
      expect(result.valid).toBe(true);
    });

    it("应该拒绝空 JD", () => {
      const result = validateInput({ jd: "", resume: "有内容" });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("JD");
    });

    it("应该拒绝空简历", () => {
      const result = validateInput({ jd: "React 工程师", resume: "  " });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("简历");
    });

    it("应该拒绝非对象输入", () => {
      expect(validateInput(null).valid).toBe(false);
      expect(validateInput("string").valid).toBe(false);
      expect(validateInput(undefined).valid).toBe(false);
    });

    it("应该拒绝超长输入", () => {
      const long = "a".repeat(50001);
      const result = validateInput({ jd: long, resume: "简历" });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("过长");
    });

    it("应该接受最大长度边界值", () => {
      const max = "a".repeat(50000);
      const result = validateInput({ jd: max, resume: max });
      expect(result.valid).toBe(true);
    });
  });

  describe("validateResult", () => {
    it("应该通过有效结果", () => {
      const result = validateResult({
        keywords_analysis: { matched: ["React"], missing: ["GraphQL"] },
        optimized_resume: "优化后的简历",
        suggestions: ["建议1", "建议2"],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("应该拒绝缺少 keywords_analysis", () => {
      const result = validateResult({
        optimized_resume: "简历",
        suggestions: ["建议"],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("缺少 keywords_analysis 字段");
    });

    it("应该拒绝非字符串 optimized_resume", () => {
      const result = validateResult({
        keywords_analysis: { matched: [], missing: [] },
        optimized_resume: 123,
        suggestions: [],
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("optimized_resume 必须是字符串");
    });

    it("应该拒绝非数组 suggestions", () => {
      const result = validateResult({
        keywords_analysis: { matched: [], missing: [] },
        optimized_resume: "简历",
        suggestions: "not array",
      } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("suggestions 必须是数组");
    });

    it("应该拒绝 suggestions 数量超出范围", () => {
      const result = validateResult({
        keywords_analysis: { matched: [], missing: [] },
        optimized_resume: "简历",
        suggestions: Array(11).fill("建议"),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes("1-10"))).toBe(true);
    });

    it("应该拒绝空 keywords matched/missing", () => {
      const result = validateResult({
        keywords_analysis: { matched: "not array", missing: [] },
        optimized_resume: "简历",
        suggestions: [],
      } as any);
      expect(result.valid).toBe(false);
    });
  });
});
