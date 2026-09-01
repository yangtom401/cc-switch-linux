import { CSS } from "@dnd-kit/utilities";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AlertTriangle } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { Provider } from "@/types";
import type { ProxyProviderHealth } from "@/types";
import type { AppId, ProviderHealth } from "@/lib/api";
import { useDragSort } from "@/hooks/useDragSort";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { ProviderEmptyState } from "@/components/providers/ProviderEmptyState";
import { useStreamCheck } from "@/hooks/useStreamCheck";
import { useLatestStreamCheckHistory } from "@/hooks/useStreamCheckHistory";
import { StreamCheckHistoryPanel } from "./StreamCheckHistoryPanel";
import { useOpenClawStatusQuery } from "@/lib/query";
import { useProviderRoutingStatus } from "@/hooks/useProviderRoutingStatus";

interface ProviderListProps {
  providers: Record<string, Provider>;
  currentProviderId: string;
  backupProviderId?: string | null;
  healthMap?: Record<string, ProviderHealth>;
  appId: AppId;
  isEditMode?: boolean;
  onSwitch: (provider: Provider) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onDuplicate: (provider: Provider) => void;
  onConfigureUsage?: (provider: Provider) => void;
  onOpenWebsite: (url: string) => void;
  onCreate?: () => void;
  isLoading?: boolean;
  onAutoFailover?: (targetId?: string | null) => void;
  }

export function ProviderList({
  providers,
  currentProviderId,
  backupProviderId,
  healthMap,
  appId,
  isEditMode = false,
  onSwitch,
  onEdit,
  onDelete,
  onDuplicate,
  onConfigureUsage,
  onOpenWebsite,
  onCreate,
  isLoading = false,
  onAutoFailover,
}: ProviderListProps) {
  const { t } = useTranslation();
  const { sortedProviders, sensors, handleDragEnd } = useDragSort(
    providers,
    appId,
  );
  const { checkProvider, checkProviders, isChecking, batchProgress } =
    useStreamCheck(appId);
  const { data: latestStreamChecks } = useLatestStreamCheckHistory(appId);
  const { data: openClawStatus } = useOpenClawStatusQuery(appId === "openclaw");
  const { data: routingSnapshot } = useProviderRoutingStatus(appId);
  const openClawDefaultProviderId = openClawStatus?.defaultModel?.primary.split(
    "/",
    1,
  )[0];
  const effectiveCurrentProviderId =
    appId === "openclaw" && openClawStatus
      ? (openClawDefaultProviderId ?? "")
      : currentProviderId;
  const openClawLiveProviderIds = new Set(
    openClawStatus?.providers.map((provider) => provider.id) ?? [],
  );
  const latestStreamCheckByProvider = useMemo(
    () =>
      new Map(
        (latestStreamChecks ?? []).map((log) => [log.providerId, log] as const),
      ),
    [latestStreamChecks],
  );
  const failoverPriorityByProvider = useMemo(
    () =>
      new Map(
        (routingSnapshot?.queue ?? []).map((item, index) => [
          item.providerId,
          index + 1,
        ]),
      ),
    [routingSnapshot?.queue],
  );
  const proxyHealthByProvider = useMemo(
    () =>
      new Map(
        (routingSnapshot?.status.providerHealth ?? [])
          .filter((health) => health.appType === routingSnapshot?.routeApp)
          .map((health) => [health.providerId, health]),
      ),
    [routingSnapshot],
  );
  const activeRouteProviderId = routingSnapshot?.status.activeTargets.find(
    (target) => target.appType === routingSnapshot.routeApp,
  )?.providerId;
  const autoFailoverEnabled = routingSnapshot
    ? (routingSnapshot.settings.apps[routingSnapshot.configApp]
        ?.autoFailoverEnabled ?? false)
    : false;
  const failoverActive = Boolean(
    routingSnapshot?.status.running &&
      autoFailoverEnabled &&
      (routingSnapshot.routeApp === "claude-desktop"
        ? activeRouteProviderId
        : routingSnapshot.status.takeover[routingSnapshot.configApp]),
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-28 w-full rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (sortedProviders.length === 0) {
    return <ProviderEmptyState onCreate={onCreate} />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedProviders.map((provider) => provider.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {appId === "openclaw" && openClawStatus ? (
            <div className="flex flex-col gap-2 border-y border-border-default bg-muted/30 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="font-medium">
                  {t("openclaw.defaultModelValue", {
                    defaultValue: "默认模型：{{model}}",
                    model: openClawStatus.defaultModel?.primary ?? "-",
                  })}
                </span>
                <span className="ml-2 text-muted-foreground">
                  {t("openclaw.liveProviders", {
                    defaultValue: "已写入 {{live}} / {{total}} 个 Provider",
                    live: openClawStatus.providers.length,
                    total: sortedProviders.length,
                  })}
                </span>
              </div>
              {openClawStatus.warnings.length > 0 ? (
                <span
                  className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300"
                  title={openClawStatus.warnings
                    .map((warning) => warning.message)
                    .join("\n")}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {t("openclaw.configWarnings", {
                    defaultValue: "{{count}} 项配置告警",
                    count: openClawStatus.warnings.length,
                  })}
                </span>
              ) : null}
            </div>
          ) : null}
          <StreamCheckHistoryPanel
            appId={appId}
            providers={providers}
            onCheckAll={() => void checkProviders(sortedProviders)}
            batchProgress={batchProgress}
          />
          {sortedProviders.map((provider) => (
            <SortableProviderCard
              key={provider.id}
              provider={provider}
              isCurrent={provider.id === effectiveCurrentProviderId}
              isLiveConfigured={
                appId === "openclaw"
                  ? openClawLiveProviderIds.has(provider.id)
                  : undefined
              }
              backupProviderId={backupProviderId}
              appId={appId}
              isEditMode={isEditMode}
              onSwitch={onSwitch}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onConfigureUsage={onConfigureUsage}
              onStreamCheck={
                appId === "grokbuild" || appId === "hermes" || appId === "openclaw"
                  ? undefined
                  : (provider) => void checkProvider(provider.id, provider.name)
              }
              isStreamChecking={isChecking(provider.id)}
              onOpenWebsite={onOpenWebsite}
              onAutoFailover={onAutoFailover}
              healthStatus={healthMap?.[provider.id]}
              streamCheckLog={latestStreamCheckByProvider.get(provider.id)}
              failoverPriority={failoverPriorityByProvider.get(provider.id)}
              failoverActive={failoverActive}
              proxyHealth={proxyHealthByProvider.get(provider.id)}
              isActiveRoute={provider.id === activeRouteProviderId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableProviderCardProps {
  provider: Provider;
  isCurrent: boolean;
  backupProviderId?: string | null;
  healthStatus?: ProviderHealth;
  streamCheckLog?: import("@/lib/api/model-test").StreamCheckLog;
  isLiveConfigured?: boolean;
  failoverPriority?: number;
  failoverActive?: boolean;
  proxyHealth?: ProxyProviderHealth;
  isActiveRoute?: boolean;
  appId: AppId;
  isEditMode: boolean;
  onSwitch: (provider: Provider) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onDuplicate: (provider: Provider) => void;
  onConfigureUsage?: (provider: Provider) => void;
  onStreamCheck?: (provider: Provider) => void;
  isStreamChecking?: boolean;
  onOpenWebsite: (url: string) => void;
  onAutoFailover?: (targetId?: string | null) => void;
}

function SortableProviderCard({
  provider,
  isCurrent,
  backupProviderId,
  healthStatus,
  streamCheckLog,
  isLiveConfigured,
  failoverPriority,
  failoverActive,
  proxyHealth,
  isActiveRoute,
  appId,
  isEditMode,
  onSwitch,
  onEdit,
  onDelete,
  onDuplicate,
  onConfigureUsage,
  onStreamCheck,
  isStreamChecking,
  onOpenWebsite,
  onAutoFailover,
}: SortableProviderCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: provider.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ProviderCard
        provider={provider}
        isCurrent={isCurrent}
        backupProviderId={backupProviderId}
        appId={appId}
        isEditMode={isEditMode}
        onSwitch={onSwitch}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onConfigureUsage={
          onConfigureUsage ? (item) => onConfigureUsage(item) : () => undefined
        }
        onStreamCheck={onStreamCheck}
        isStreamChecking={isStreamChecking}
        onOpenWebsite={onOpenWebsite}
        onAutoFailover={onAutoFailover}
        healthStatus={healthStatus}
        streamCheckLog={streamCheckLog}
        isLiveConfigured={isLiveConfigured}
        failoverPriority={failoverPriority}
        failoverActive={failoverActive}
        proxyHealth={proxyHealth}
        isActiveRoute={isActiveRoute}
        dragHandleProps={{
          attributes,
          listeners,
          isDragging,
        }}
      />
    </div>
  );
}
