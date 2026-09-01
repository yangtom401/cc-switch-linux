import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { promptsApi, type Prompt, type AppId } from "@/lib/api";

function deepClone<T>(value: T): T {
  const structuredCloneFn: undefined | ((input: T) => T) = (
    globalThis as unknown as { structuredClone?: (input: T) => T }
  ).structuredClone;

  try {
    if (typeof structuredCloneFn === "function") {
      return structuredCloneFn(value);
    }
  } catch {
    // Fall through to JSON clone.
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function usePromptActions(appId: AppId) {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<Record<string, Prompt>>({});
  const [loading, setLoading] = useState(false);
  const [currentFileContent, setCurrentFileContent] = useState<string | null>(
    null,
  );

  const promptsRef = useRef(prompts);
  const lastPromptsWriteTokenRef = useRef(0);

  useEffect(() => {
    promptsRef.current = prompts;
  }, [prompts]);

  const bumpPromptsWriteToken = useCallback(() => {
    lastPromptsWriteTokenRef.current += 1;
    return lastPromptsWriteTokenRef.current;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await promptsApi.getPrompts(appId);
      bumpPromptsWriteToken();
      promptsRef.current = data;
      setPrompts(data);

      // 同时加载当前文件内容
      try {
        const content = await promptsApi.getCurrentFileContent(appId);
        setCurrentFileContent(content);
      } catch (error) {
        setCurrentFileContent(null);
      }
    } catch (error) {
      toast.error(t("prompts.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [appId, bumpPromptsWriteToken, t]);

  const savePrompt = useCallback(
    async (id: string, prompt: Prompt) => {
      try {
        await promptsApi.upsertPrompt(appId, id, prompt);
        await reload();
        toast.success(t("prompts.saveSuccess"));
      } catch (error) {
        toast.error(t("prompts.saveFailed"));
        throw error;
      }
    },
    [appId, reload, t],
  );

  const deletePrompt = useCallback(
    async (id: string) => {
      try {
        await promptsApi.deletePrompt(appId, id);
        await reload();
        toast.success(t("prompts.deleteSuccess"));
      } catch (error) {
        toast.error(t("prompts.deleteFailed"));
        throw error;
      }
    },
    [appId, reload, t],
  );

  const enablePrompt = useCallback(
    async (id: string) => {
      try {
        await promptsApi.enablePrompt(appId, id);
        await reload();
        toast.success(t("prompts.enableSuccess"));
      } catch (error) {
        toast.error(t("prompts.enableFailed"));
        throw error;
      }
    },
    [appId, reload, t],
  );

  const toggleEnabled = useCallback(
    async (id: string, enabled: boolean) => {
      const previousPromptsSnapshot = deepClone(promptsRef.current);
      const writeToken = bumpPromptsWriteToken();

      setPrompts((prev) => {
        const target = prev[id];
        if (!target) return prev;

        if (enabled) {
          return Object.keys(prev).reduce(
            (acc, key) => {
              const existing = prev[key];
              if (!existing) return acc;
              acc[key] = {
                ...existing,
                enabled: key === id,
              };
              return acc;
            },
            {} as Record<string, Prompt>,
          );
        }

        return {
          ...prev,
          [id]: {
            ...target,
            enabled: false,
          },
        };
      });

      try {
        if (enabled) {
          await promptsApi.enablePrompt(appId, id);
          toast.success(t("prompts.enableSuccess"));
        } else {
          // 禁用提示词 - 需要后端支持
          const promptToUpdate = previousPromptsSnapshot[id];
          if (!promptToUpdate) {
            await reload();
            toast.error(t("prompts.disableFailed"));
            return;
          }

          await promptsApi.upsertPrompt(appId, id, {
            ...promptToUpdate,
            enabled: false,
          });
          toast.success(t("prompts.disableSuccess"));
        }
        await reload();
      } catch (error) {
        // Rollback on failure
        if (lastPromptsWriteTokenRef.current === writeToken) {
          setPrompts(previousPromptsSnapshot);
        }
        toast.error(
          enabled ? t("prompts.enableFailed") : t("prompts.disableFailed"),
        );
        throw error;
      }
    },
    [appId, bumpPromptsWriteToken, reload, t],
  );

  const importFromFile = useCallback(async () => {
    try {
      const id = await promptsApi.importFromFile(appId);
      await reload();
      toast.success(t("prompts.importSuccess"));
      return id;
    } catch (error) {
      toast.error(t("prompts.importFailed"));
      throw error;
    }
  }, [appId, reload, t]);

  return {
    prompts,
    loading,
    currentFileContent,
    reload,
    savePrompt,
    deletePrompt,
    enablePrompt,
    toggleEnabled,
    importFromFile,
  };
}
