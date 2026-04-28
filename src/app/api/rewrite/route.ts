import { NextRequest, NextResponse } from "next/server";
import { ResumeAgentOrchestrator, globalObservability } from "@/agent";

// 创建全局 Agent 实例
let agent: ResumeAgentOrchestrator | null = null;

function getAgent(): ResumeAgentOrchestrator {
  if (!agent) {
    agent = new ResumeAgentOrchestrator({
      maxRetries: 3,
      retryDelay: 1000,
    });
  }
  return agent;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API Key 未配置" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { jd, resume } = body;

    // L1 - 输入验证
    if (!jd || !resume) {
      return NextResponse.json(
        { error: "JD 和简历都不能为空" },
        { status: 400 }
      );
    }

    if (jd.includes("[PDF_FILE:")) {
      return NextResponse.json(
        { error: "PDF 文件暂不支持，请使用 TXT 格式的简历" },
        { status: 400 }
      );
    }

    // 执行 Agent
    const orchestrator = getAgent();
    const { state, result } = await orchestrator.execute({ jd, resume });

    // L6 - 错误处理
    if (state.currentStep === "error") {
      return NextResponse.json(
        { error: state.error || "处理失败" },
        { status: 500 }
      );
    }

    // L5 - 记录指标
    globalObservability.emit({
      type: "token_usage",
      tokens: state.metadata.tokenUsage,
      sessionId: state.sessionId,
    });

    return NextResponse.json({
      success: true,
      data: result,
      sessionId: state.sessionId,
      metadata: {
        step: state.currentStep,
        tokenUsage: state.metadata.tokenUsage,
        retryCount: state.metadata.retryCount,
      },
    });
  } catch (error: any) {
    console.error("[Harness] API Error:", error);
    return NextResponse.json(
      { error: error.message || "处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}
