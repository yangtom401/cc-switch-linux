import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import ApiKeyInput from "../ApiKeyInput";
import type { ProviderCategory } from "@/types";

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface ApiKeySectionProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  category?: ProviderCategory;
  shouldShowLink: boolean;
  websiteUrl: string;
  placeholder?: {
    official: string;
    thirdParty: string;
  };
  disabled?: boolean;
  isPartner?: boolean;
  partnerPromotionKey?: string;
  // 多 KEY 均衡使用：备用 KEY 列表（首个为主 KEY，通过 value/onChange 同步）
  keys?: string[];
  onKeysChange?: (keys: string[]) => void;
}

export function ApiKeySection({
  id,
  label,
  value,
  onChange,
  category,
  shouldShowLink,
  websiteUrl,
  placeholder,
  disabled,
  isPartner,
  partnerPromotionKey,
  keys,
  onKeysChange,
}: ApiKeySectionProps) {
  const { t } = useTranslation();

  const defaultPlaceholder = {
    official: t("providerForm.officialNoApiKey", {
      defaultValue: "官方供应商无需 API Key",
    }),
    thirdParty: t("providerForm.apiKeyAutoFill", {
      defaultValue: "输入 API Key，将自动填充到配置",
    }),
  };

  const finalPlaceholder = placeholder || defaultPlaceholder;
  const normalizedWebsiteUrl = websiteUrl.trim();
  const safeWebsiteUrl = isSafeUrl(normalizedWebsiteUrl)
    ? normalizedWebsiteUrl
    : "";
  const shouldRenderApiKeyLink = shouldShowLink && Boolean(safeWebsiteUrl);
  const shouldRenderPartnerInfo = Boolean(
    shouldShowLink && isPartner && partnerPromotionKey,
  );
  const shouldRenderFooter = shouldRenderApiKeyLink || shouldRenderPartnerInfo;

  // 多 KEY 模式：keys 数组整体渲染；首个即主 KEY（value 同步）。
  // keys 为空时回退到单 KEY（渲染 value），保证新增模式主 KEY 输入框可见。
  const isMultiKey = Array.isArray(keys) && typeof onKeysChange === "function";
  const allKeys = isMultiKey && keys.length > 0 ? keys : [value];
  const inputDisabled = disabled ?? category === "official";

  const handleItemChange = useCallback(
    (index: number, nextValue: string) => {
      if (!isMultiKey) {
        onChange(nextValue);
        return;
      }
      const nextKeys = [...keys];
      nextKeys[index] = nextValue;
      onKeysChange(nextKeys);
      if (index === 0) {
        onChange(nextValue);
      }
    },
    [isMultiKey, keys, onChange, onKeysChange],
  );

  const handleAddKey = useCallback(() => {
    if (!isMultiKey) {
      return;
    }
    onKeysChange([...keys, ""]);
  }, [isMultiKey, keys, onKeysChange]);

  const handleRemoveKey = useCallback(
    (index: number) => {
      if (!isMultiKey) {
        return;
      }
      const nextKeys = keys.filter((_, i) => i !== index);
      onKeysChange(nextKeys);
      if (index === 0) {
        onChange("");
      }
    },
    [isMultiKey, keys, onChange, onKeysChange],
  );

  return (
    <div className="space-y-1">
      <div className="space-y-2">
        {allKeys.map((key, index) => (
          <div key={index} className="space-y-2">
            <ApiKeyInput
              id={index === 0 ? id : `${id ?? "apiKey"}-${index + 1}`}
              label={
                isMultiKey && allKeys.length > 1
                  ? `${label ?? "API Key"} ${index + 1}`
                  : label
              }
              value={key}
              onChange={(next) => handleItemChange(index, next)}
              placeholder={
                category === "official"
                  ? finalPlaceholder.official
                  : finalPlaceholder.thirdParty
              }
              disabled={inputDisabled}
            />
            {isMultiKey && !inputDisabled && allKeys.length > 1 && (
              <div className="flex items-center justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => handleRemoveKey(index)}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  aria-label={t("apiKeyInput.remove", {
                    defaultValue: "删除此 Key",
                  })}
                >
                  <Trash2 size={13} />
                  {t("apiKeyInput.remove", { defaultValue: "删除" })}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 添加更多 KEY */}
      {isMultiKey && !inputDisabled && (
        <button
          type="button"
          onClick={handleAddKey}
          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <Plus size={14} />
          {t("apiKeyInput.addAnother", {
            defaultValue: "添加更多 API Key（均衡使用）",
          })}
        </button>
      )}

      {/* API Key 获取链接 */}
      {shouldRenderFooter && (
        <div className="space-y-2 -mt-1 pl-1">
          {shouldRenderApiKeyLink && (
            <a
              href={safeWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              {t("providerForm.getApiKey", {
                defaultValue: "获取 API Key",
              })}
            </a>
          )}

          {/* 合作伙伴促销信息 */}
          {shouldRenderPartnerInfo && partnerPromotionKey && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-2.5 border border-blue-200 dark:border-blue-800">
              <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                💡{" "}
                {t(`providerForm.partnerPromotion.${partnerPromotionKey}`, {
                  defaultValue: "",
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
