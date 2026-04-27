import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy initialization to avoid build-time API key check
const getOpenAI = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API Key 未配置" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { resume, jd } = body;

    if (!resume || !jd) {
      return NextResponse.json(
        { error: "简历和JD都不能为空" },
        { status: 400 }
      );
    }

    // If resume is a PDF reference, return a message
    if (resume.includes("[PDF_FILE:")) {
      return NextResponse.json(
        { error: "PDF文件暂不支持，请使用TXT格式的简历", resume: null },
        { status: 400 }
      );
    }

    const prompt = `你是一位专业的简历优化师。请根据以下岗位JD帮助用户优化简历。

## 岗位JD：
${jd}

## 用户简历：
${resume}

## 请按以下格式优化简历：

### 1. 关键词匹配度分析
列出简历中与JD匹配的关键词，以及简历中缺少但JD中要求的关键词。

### 2. 优化后的简历内容
在保留原意的基础上，使用更有力的动词和量化数据来描述经历，使内容更贴合目标岗位。

### 3. 简历优化建议
给出3-5条具体的改进建议。

请用JSON格式返回，包含以下字段：
- keywords_analysis: { matched: string[], missing: string[] }
- optimized_resume: string
- suggestions: string[]
`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "你是一位专业的简历优化师，擅长根据岗位要求优化简历内容，使其更具竞争力。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      {
        error: error.message || "处理失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}
