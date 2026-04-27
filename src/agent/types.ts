// ============================================================
// L1 - 信息边界层: 类型定义和输入验证
// ============================================================

export interface ResumeInput {
  jd: string;
  resume: string;
}

export interface KeywordsAnalysis {
  matched: string[];
  missing: string[];
}

export interface ResumeResult {
  keywords_analysis: KeywordsAnalysis;
  optimized_resume: string;
  suggestions: string[];
}

export interface AgentState {
  sessionId: string;
  input: ResumeInput | null;
  currentStep: AgentStep;
  result: ResumeResult | null;
  error: string | null;
  metadata: {
    startedAt: number;
    completedAt: number | null;
    tokenUsage: number;
    retryCount: number;
  };
}

export type AgentStep =
  | "idle"
  | "parsing"
  | "analyzing_jd"
  | "comparing"
  | "optimizing"
  | "validating"
  | "completed"
  | "error";

// 输入验证 - L1 核心
export function validateInput(input: unknown): { valid: boolean; error?: string } {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "输入必须是对象" };
  }

  const { jd, resume } = input as Record<string, unknown>;

  if (typeof jd !== "string" || jd.trim().length === 0) {
    return { valid: false, error: "JD 不能为空" };
  }

  if (typeof resume !== "string" || resume.trim().length === 0) {
    return { valid: false, error: "简历不能为空" };
  }

  if (jd.length > 50000) {
    return { valid: false, error: "JD 内容过长（最大 50000 字符）" };
  }

  if (resume.length > 50000) {
    return { valid: false, error: "简历内容过长（最大 50000 字符）" };
  }

  return { valid: true };
}

// 输出验证 - L5 核心
export function validateResult(result: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!result || typeof result !== "object") {
    return { valid: false, errors: ["结果必须是对象"] };
  }

  const r = result as Record<string, unknown>;

  // 检查 keywords_analysis
  if (!r.keywords_analysis || typeof r.keywords_analysis !== "object") {
    errors.push("缺少 keywords_analysis 字段");
  } else {
    const ka = r.keywords_analysis as Record<string, unknown>;
    if (!Array.isArray(ka.matched)) errors.push("matched 必须是数组");
    if (!Array.isArray(ka.missing)) errors.push("missing 必须是数组");
  }

  // 检查 optimized_resume
  if (typeof r.optimized_resume !== "string") {
    errors.push("optimized_resume 必须是字符串");
  }

  // 检查 suggestions
  if (!Array.isArray(r.suggestions)) {
    errors.push("suggestions 必须是数组");
  } else if (r.suggestions.length < 1 || r.suggestions.length > 10) {
    errors.push("suggestions 数量应在 1-10 条之间");
  }

  return { valid: errors.length === 0, errors };
}
