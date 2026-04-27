// ============================================================
// L3 - 执行编排层 & L4 - 状态管理层
// ============================================================

import { v4 as uuidv4 } from "uuid";
import { AgentState, AgentStep, ResumeInput, ResumeResult, validateInput, validateResult } from "./types";
import { ToolExecutor } from "./tools";

// L4 - 状态持久化接口
export interface StateStore {
  save(state: AgentState): Promise<void>;
  load(sessionId: string): Promise<AgentState | null>;
  list(): Promise<string[]>;
}

// L4 - 内存状态存储（生产环境应替换为 Redis/DB）
class MemoryStateStore implements StateStore {
  private states: Map<string, AgentState> = new Map();

  async save(state: AgentState): Promise<void> {
    this.states.set(state.sessionId, { ...state });
  }

  async load(sessionId: string): Promise<AgentState | null> {
    return this.states.get(sessionId) || null;
  }

  async list(): Promise<string[]> {
    return Array.from(this.states.keys());
  }
}

// L3 - 执行编排器
export class ResumeAgentOrchestrator {
  private toolExecutor: ToolExecutor;
  private stateStore: StateStore;
  private maxRetries: number;
  private retryDelay: number;

  constructor(
    options: {
      stateStore?: StateStore;
      maxRetries?: number;
      retryDelay?: number;
    } = {}
  ) {
    this.toolExecutor = new ToolExecutor();
    this.stateStore = options.stateStore || new MemoryStateStore();
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  // 创建新会话
  createSession(): AgentState {
    return {
      sessionId: uuidv4(),
      input: null,
      currentStep: "idle",
      result: null,
      error: null,
      metadata: {
        startedAt: Date.now(),
        completedAt: null,
        tokenUsage: 0,
        retryCount: 0,
      },
    };
  }

  // L3 - 主执行流程
  async execute(input: unknown): Promise<{ state: AgentState; result?: ResumeResult }> {
    // L1 - 输入验证
    const validation = validateInput(input);
    if (!validation.valid) {
      const errorState = this.createSession();
      errorState.currentStep = "error";
      errorState.error = validation.error!;
      return { state: errorState };
    }

    const typedInput = input as ResumeInput;
    let state = this.createSession();
    state.input = typedInput;

    try {
      // L3 - 步骤 1: 解析
      state = await this.transition(state, "parsing");

      // L3 - 步骤 2: 分析 JD
      state = await this.transition(state, "analyzing_jd");
      const keywordsAnalysis = await this.safeExecute(
        () => this.toolExecutor.analyzeJD(typedInput.jd),
        state
      );

      if (!keywordsAnalysis) {
        return this.handleError(state, "JD 分析失败");
      }

      // L3 - 步骤 3: 对比
      state = await this.transition(state, "comparing");

      // L3 - 步骤 4: 优化
      state = await this.transition(state, "optimizing");
      const optimization = await this.safeExecute(
        () => this.toolExecutor.optimizeResume(typedInput.resume, keywordsAnalysis, typedInput.jd),
        state
      );

      if (!optimization) {
        return this.handleError(state, "简历优化失败");
      }

      // L3 - 步骤 5: 组装结果
      state = await this.transition(state, "validating");

      const result: ResumeResult = {
        keywords_analysis: keywordsAnalysis,
        optimized_resume: optimization.optimized,
        suggestions: optimization.suggestions,
      };

      // L5 - 输出验证
      const resultValidation = validateResult(result);
      if (!resultValidation.valid) {
        return this.handleError(state, `输出验证失败: ${resultValidation.errors.join(", ")}`);
      }

      state.result = result;
      state = await this.transition(state, "completed");
      state.metadata.tokenUsage = this.toolExecutor.getTokenUsage();

      return { state, result };

    } catch (error: any) {
      return this.handleError(state, error.message);
    }
  }

  // L3 - 步骤转换
  private async transition(state: AgentState, step: AgentStep): Promise<AgentState> {
    state.currentStep = step;
    await this.stateStore.save(state);
    return state;
  }

  // L6 - 安全执行（带重试）
  private async safeExecute<T>(
    fn: () => Promise<T>,
    state: AgentState
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        state.metadata.retryCount = i;
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (i < this.maxRetries) {
          // L6 - 指数退避重试
          const delay = this.retryDelay * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    state.error = `执行失败（已重试 ${this.maxRetries} 次）: ${lastError?.message}`;
    return null;
  }

  // L6 - 错误处理
  private handleError(state: AgentState, message: string): { state: AgentState; result?: ResumeResult } {
    state.currentStep = "error";
    state.error = message;
    return { state };
  }

  // L4 - 恢复会话
  async resume(sessionId: string): Promise<AgentState | null> {
    return this.stateStore.load(sessionId);
  }

  // L4 - 获取会话列表
  async listSessions(): Promise<string[]> {
    return this.stateStore.list();
  }
}
