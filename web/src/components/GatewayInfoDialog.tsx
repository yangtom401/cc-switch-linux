import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Server, Cpu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GatewayInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GatewayInfoDialog({ open, onOpenChange }: GatewayInfoDialogProps) {
  const { t } = useTranslation();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const origin = window.location.origin || "http://127.0.0.1:3456";

  const endpoints = [
    {
      id: "anthropic",
      title: "Anthropic 协议接口 (Messages API)",
      subtitle: "适用于 Cherry Studio (Anthropic)、Claude Code、Cursor 等",
      baseUrl: origin,
      fullUrl: `${origin}/v1/messages`,
      clientHint: "在客户端中 Base URL 填: " + origin + " (或 /v1/messages)",
    },
    {
      id: "openai",
      title: "OpenAI 兼容协议接口 (Chat API)",
      subtitle: "适用于 Cherry Studio (OpenAI)、NextChat、ChatGPT-Next 等",
      baseUrl: `${origin}/v1`,
      fullUrl: `${origin}/v1/chat/completions`,
      clientHint: "在客户端中 Base URL 填: " + `${origin}/v1`,
    },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success(t("common.copied", { defaultValue: "已复制到剪贴板" }));
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            <DialogTitle className="text-xl">
              {t("gateway.title", { defaultValue: "统一 AI 网关接口" })}
            </DialogTitle>
          </div>
          <DialogDescription>
            {t("gateway.desc", {
              defaultValue:
                "无论供应商上游是 OpenAI、Claude 还是 Gemini，网关均会自动转换协议，你可以使用任意一种接口格式接入下游客户端。",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {endpoints.map((ep) => (
            <div
              key={ep.id}
              className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
            >
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {ep.title}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{ep.subtitle}</span>
              </div>

              <div className="mt-2 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded bg-white p-2 border dark:bg-gray-800 dark:border-gray-700">
                  <div className="truncate font-mono">
                    <span className="text-gray-500 mr-2">Base URL:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {ep.baseUrl}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleCopy(ep.baseUrl, `${ep.id}-base`)}
                  >
                    {copiedKey === `${ep.id}-base` ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded bg-white p-2 border dark:bg-gray-800 dark:border-gray-700">
                  <div className="truncate font-mono">
                    <span className="text-gray-500 mr-2">Endpoint:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {ep.fullUrl}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleCopy(ep.fullUrl, `${ep.id}-full`)}
                  >
                    {copiedKey === `${ep.id}-full` ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-lg bg-blue-50/60 p-3 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <p className="font-medium">💡 使用提示：</p>
            <ul className="mt-1 list-disc pl-4 space-y-1">
              <li>API Key：填入对应供应商的 Key 或任意占位符即可。</li>
              <li>模型选择：支持当前激活的供应商默认模型，或在请求体中直接指定目标模型名。</li>
              <li>内置流式 SSE 协议双向互转，完整支持 Reasoning / Thinking 思考过程。</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
