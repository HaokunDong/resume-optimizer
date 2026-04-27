"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/file-upload";
import { Sparkles, ArrowRight, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RewriteResult {
  keywords_analysis: {
    matched: string[];
    missing: string[];
  };
  optimized_resume: string;
  suggestions: string[];
}

export default function HomePage() {
  const [jdText, setJdText] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResumeFileChange = useCallback(
    (file: File | null, content: string) => {
      setResumeFile(file);
      setResumeContent(content);
    },
    []
  );

  const handleRewrite = async () => {
    if (!resumeContent) {
      setError("请先上传简历");
      return;
    }
    if (!jdText.trim()) {
      setError("请先输入岗位JD");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resumeContent,
          jd: jdText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "改写失败");
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const content = `
# 优化后的简历

## 关键词匹配度分析
### 已匹配关键词
${result.keywords_analysis.matched.map((k) => `- ${k}`).join("\n")}

### 缺失关键词
${result.keywords_analysis.missing.map((k) => `- ${k}`).join("\n")}

## 优化后的简历内容
${result.optimized_resume}

## 改进建议
${result.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "优化后的简历.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text">
                简历智改
              </h1>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI 驱动的简历优化
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            上传你的简历和目标岗位JD，AI 将分析关键词匹配度，生成更具竞争力的简历版本
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* JD Input Card */}
          <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-bold">
                  1
                </span>
                粘贴岗位 JD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="在这里粘贴目标岗位的职位描述..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="min-h-[300px] resize-none border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
              />
            </CardContent>
          </Card>

          {/* Resume Upload Card */}
          <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                  2
                </span>
                上传简历
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileChange={handleResumeFileChange}
                accept=".pdf,.txt"
                label="简历文件"
                icon="resume"
              />
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={handleRewrite}
            disabled={isLoading || !resumeContent || !jdText.trim()}
            className={cn(
              "px-8 py-6 text-lg font-semibold rounded-2xl transition-all duration-300",
              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
              "shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            )}
          >
            {isLoading ? (
              <>
                <span className="animate-pulse">AI 正在优化中...</span>
              </>
            ) : (
              <>
                开始优化
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Keywords Analysis */}
            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  关键词匹配度分析
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    已匹配关键词 ({result.keywords_analysis.matched.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords_analysis.matched.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    缺失关键词 ({result.keywords_analysis.missing.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords_analysis.missing.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimized Resume */}
            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">优化后的简历</CardTitle>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="gap-2 border-slate-300 dark:border-slate-600"
                >
                  <Download className="w-4 h-4" />
                  下载
                </Button>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                    {result.optimized_resume}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card className="border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">改进建议</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {suggestion}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>简历智改 · 使用 AI 技术优化你的求职竞争力</p>
        </div>
      </footer>
    </div>
  );
}
