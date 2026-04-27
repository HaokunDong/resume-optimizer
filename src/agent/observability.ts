// ============================================================
// L5 - 评估与观测层: 可观测性实现
// ============================================================

import { AgentState, AgentStep, ResumeResult } from "./types";

// L5 - 观测事件类型
export type ObservabilityEvent =
  | { type: "step_transition"; from: AgentStep; to: AgentStep; sessionId: string }
  | { type: "tool_call"; tool: string; sessionId: string }
  | { type: "error"; error: string; sessionId: string }
  | { type: "retry"; attempt: number; sessionId: string }
  | { type: "completed"; sessionId: string; duration: number }
  | { type: "token_usage"; tokens: number; sessionId: string };

// L5 - 观测器接口
export interface Observer {
  onEvent(event: ObservabilityEvent): void;
}

// L5 - 日志观测器
export class LoggingObserver implements Observer {
  private logs: ObservabilityEvent[] = [];

  onEvent(event: ObservabilityEvent): void {
    this.logs.push(event);
    console.log(`[Harness] ${event.type}:`, this.formatEvent(event));
  }

  private formatEvent(event: ObservabilityEvent): string {
    switch (event.type) {
      case "step_transition":
        return `${event.from} → ${event.to}`;
      case "tool_call":
        return `调用工具: ${event.tool}`;
      case "error":
        return `错误: ${event.error}`;
      case "retry":
        return `重试 #${event.attempt}`;
      case "completed":
        return `完成，耗时 ${event.duration}ms`;
      case "token_usage":
        return `Token 消耗: ${event.tokens}`;
      default:
        return JSON.stringify(event);
    }
  }

  getLogs(): ObservabilityEvent[] {
    return [...this.logs];
  }

  getMetrics(): ObservabilityMetrics {
    const logs = this.logs;
    const completed = logs.filter((l) => l.type === "completed").length;
    const errors = logs.filter((l) => l.type === "error").length;
    const retries = logs.filter((l) => l.type === "retry").length;
    const totalTokens = logs
      .filter((l) => l.type === "token_usage")
      .reduce((sum, l) => sum + (l as any).tokens, 0);

    return {
      totalRuns: completed + errors,
      successfulRuns: completed,
      failedRuns: errors,
      totalRetries: retries,
      totalTokenUsage: totalTokens,
      successRate: completed + errors > 0 ? completed / (completed + errors) : 0,
    };
  }
}

// L5 - 指标聚合
export interface ObservabilityMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalRetries: number;
  totalTokenUsage: number;
  successRate: number;
}

// L5 - 可观测性管理器
export class ObservabilityManager {
  private observers: Observer[] = [];

  addObserver(observer: Observer): void {
    this.observers.push(observer);
  }

  removeObserver(observer: Observer): void {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  emit(event: ObservabilityEvent): void {
    for (const observer of this.observers) {
      try {
        observer.onEvent(event);
      } catch (error) {
        console.error("[Harness] Observer error:", error);
      }
    }
  }

  // L5 - 从状态生成事件
  emitFromState(state: AgentState, prevStep?: AgentStep): void {
    if (prevStep && prevStep !== state.currentStep) {
      this.emit({
        type: "step_transition",
        from: prevStep,
        to: state.currentStep,
        sessionId: state.sessionId,
      });
    }

    if (state.currentStep === "completed") {
      this.emit({
        type: "completed",
        sessionId: state.sessionId,
        duration: (state.metadata.completedAt || Date.now()) - state.metadata.startedAt,
      });
    }

    if (state.error) {
      this.emit({
        type: "error",
        error: state.error,
        sessionId: state.sessionId,
      });
    }
  }
}

// L5 - 导出全局可观测性实例
export const globalObservability = new ObservabilityManager();
globalObservability.addObserver(new LoggingObserver());
