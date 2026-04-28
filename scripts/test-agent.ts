/**
 * Resume Optimizer Agent - 本地测试脚本
 *
 * 使用 DeepSeek API（OpenAI 兼容格式）
 *
 * 运行方式:
 * cd resume-optimizer
 * export DEEPSEEK_API_KEY="your-key"
 * npx tsx scripts/test-agent.ts
 */

import { config } from "dotenv";
import { ResumeAgentOrchestrator } from "../src/agent";

// 加载 .env.local 文件
config({ path: ".env.local" });

const SAMPLE_JD = `
职位：高级前端工程师

岗位描述：
我们正在寻找一位经验丰富的前端工程师，加入我们的产品团队。你将负责设计和实现高质量的 Web 应用程序。

岗位要求：
1. 5 年以上前端开发经验
2. 精通 React 和 TypeScript
3. 熟悉 Node.js 和 Express
4. 有良好的代码规范和架构设计能力
5. 熟悉 Git 版本控制
6. 具备良好的沟通能力和团队协作精神

加分项：
- 有大型项目架构经验
- 熟悉 GraphQL
- 有开源项目贡献经历
`;

const SAMPLE_RESUME = `
张三
前端工程师
电话：138-xxxx-xxxx | 邮箱：zhangsan@example.com

教育背景
2020 - 2023  某某大学 计算机科学 硕士
2016 - 2020  某某大学 软件工程 学士

工作经历

2022 - 至今  ABC科技公司  前端工程师
- 负责公司核心产品的前端开发
- 使用 Vue.js 构建后台管理系统
- 优化页面性能，提升加载速度 50%
- 参与团队代码评审，制定前端规范

2020 - 2022  XYZ互联网公司  前端开发实习生
- 协助开发公司官网
- 使用 React 完成多个页面组件
- 修复用户反馈的 Bug

技能
- 熟练使用 React、Vue.js
- 了解 TypeScript
- 掌握 HTML5、CSS3、JavaScript
- 使用 Git 进行版本控制
- 了解 Node.js 基础

项目经验
- 电商后台管理系统：使用 Vue + Element UI
- 博客系统：React + Next.js
`;

async function main() {
  console.log("🚀 启动 Resume Optimizer Agent 测试\n");

  // 检查 API Key
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("❌ 错误：请设置 DEEPSEEK_API_KEY 环境变量");
    console.log("\n方式 1: 命令行设置");
    console.log('  export DEEPSEEK_API_KEY="your-key"');
    console.log("  npx tsx scripts/test-agent.ts");
    console.log("\n方式 2: 创建 .env.local 文件");
    console.log('  echo "DEEPSEEK_API_KEY=your-key" > .env.local');
    console.log("  npx tsx scripts/test-agent.ts\n");
    console.log("API Key 获取地址: https://platform.deepseek.com/api_keys");
    process.exit(1);
  }

  // 创建 Agent（不再需要传入 openai 实例）
  const agent = new ResumeAgentOrchestrator({
    maxRetries: 3,
    retryDelay: 1000,
  });

  console.log("📝 测试输入:");
  console.log("─".repeat(50));
  console.log("JD 长度:", SAMPLE_JD.length, "字符");
  console.log("简历长度:", SAMPLE_RESUME.length, "字符");
  console.log("─".repeat(50), "\n");

  console.log("⏳ 正在处理...\n");

  const startTime = Date.now();

  try {
    // 执行 Agent
    const { state, result } = await agent.execute({
      jd: SAMPLE_JD,
      resume: SAMPLE_RESUME,
    });

    const duration = Date.now() - startTime;

    console.log("✅ 执行完成!");
    console.log("─".repeat(50));
    console.log("执行步骤:", state.currentStep);
    console.log("耗时:", duration, "ms");
    console.log("Token 消耗:", state.metadata.tokenUsage);
    console.log("重试次数:", state.metadata.retryCount);
    console.log("─".repeat(50), "\n");

    if (result) {
      console.log("📊 关键词匹配分析:");
      console.log("─".repeat(50));
      console.log("\n✅ 已匹配关键词:");
      result.keywords_analysis.matched.forEach((k, i) => {
        console.log(`  ${i + 1}. ${k}`);
      });

      console.log("\n❌ 缺失关键词:");
      if (result.keywords_analysis.missing.length === 0) {
        console.log("  (无)");
      } else {
        result.keywords_analysis.missing.forEach((k, i) => {
          console.log(`  ${i + 1}. ${k}`);
        });
      }

      console.log("\n\n📋 改进建议:");
      console.log("─".repeat(50));
      result.suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s}`);
      });

      console.log("\n\n📄 优化后的简历:");
      console.log("─".repeat(50));
      console.log(result.optimized_resume);
    } else {
      console.log("❌ 执行失败:", state.error);
    }
  } catch (error: any) {
    console.error("❌ 测试失败:", error.message);
    process.exit(1);
  }
}

main();
