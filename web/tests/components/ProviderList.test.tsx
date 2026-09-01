import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Provider } from "@/types";
import { ProviderList } from "@/components/providers/ProviderList";

const useDragSortMock = vi.fn();
const useSortableMock = vi.fn();
const providerCardRenderSpy = vi.fn();
const getOmoPluginStatusMock = vi.fn();
const getOmoSlimPluginStatusMock = vi.fn();
const disableCurrentOmoMock = vi.fn();
const disableCurrentOmoSlimMock = vi.fn();
const checkProviderMock = vi.fn();
const checkProvidersMock = vi.fn();
const isCheckingMock = vi.fn();
const useLatestStreamCheckHistoryMock = vi.fn();
const useProviderRoutingStatusMock = vi.fn();

vi.mock("@/hooks/useDragSort", () => ({
  useDragSort: (...args: unknown[]) => useDragSortMock(...args),
}));

vi.mock("@/lib/query", () => ({
  useOpenClawStatusQuery: () => ({ data: undefined }),
}));

vi.mock("@/components/providers/ProviderCard", () => ({
  ProviderCard: (props: any) => {
    providerCardRenderSpy(props);
    const {
      provider,
      onSwitch,
      onEdit,
      onDelete,
      onDuplicate,
      onConfigureUsage,
      onStreamCheck,
    } = props;

    return (
      <div data-testid={`provider-card-${provider.id}`}>
        <button
          data-testid={`switch-${provider.id}`}
          onClick={() => onSwitch(provider)}
        >
          switch
        </button>
        <button
          data-testid={`edit-${provider.id}`}
          onClick={() => onEdit(provider)}
        >
          edit
        </button>
        <button
          data-testid={`duplicate-${provider.id}`}
          onClick={() => onDuplicate(provider)}
        >
          duplicate
        </button>
        <button
          data-testid={`usage-${provider.id}`}
          onClick={() => onConfigureUsage(provider)}
        >
          usage
        </button>
        <button
          data-testid={`stream-check-${provider.id}`}
          data-enabled={onStreamCheck ? "true" : "false"}
          data-checking={props.isStreamChecking ? "true" : "false"}
          onClick={() => onStreamCheck?.(provider)}
        >
          stream-check
        </button>
        <button
          data-testid={`delete-${provider.id}`}
          onClick={() => onDelete(provider)}
        >
          delete
        </button>
        <span data-testid={`is-current-${provider.id}`}>
          {props.isCurrent ? "current" : "inactive"}
        </span>
        <span data-testid={`edit-mode-${provider.id}`}>
          {props.isEditMode ? "edit-mode" : "view-mode"}
        </span>
        <span data-testid={`drag-attr-${provider.id}`}>
          {props.dragHandleProps?.attributes?.["data-dnd-id"] ?? "none"}
        </span>
      </div>
    );
  },
}));

vi.mock("@/lib/api", () => ({
  providersApi: {
    getOmoPluginStatus: (...args: unknown[]) => getOmoPluginStatusMock(...args),
    getOmoSlimPluginStatus: (...args: unknown[]) =>
      getOmoSlimPluginStatusMock(...args),
    disableCurrentOmo: (...args: unknown[]) => disableCurrentOmoMock(...args),
    disableCurrentOmoSlim: (...args: unknown[]) =>
      disableCurrentOmoSlimMock(...args),
  },
}));

vi.mock("@/hooks/useStreamCheck", () => ({
  useStreamCheck: () => ({
    checkProvider: (...args: unknown[]) => checkProviderMock(...args),
    checkProviders: (...args: unknown[]) => checkProvidersMock(...args),
    isChecking: (...args: unknown[]) => isCheckingMock(...args),
    batchProgress: {
      running: false,
      completed: 0,
      total: 0,
      failed: 0,
    },
  }),
}));

vi.mock("@/hooks/useStreamCheckHistory", () => ({
  useLatestStreamCheckHistory: (...args: unknown[]) =>
    useLatestStreamCheckHistoryMock(...args),
}));

vi.mock("@/hooks/useProviderRoutingStatus", () => ({
  useProviderRoutingStatus: (...args: unknown[]) =>
    useProviderRoutingStatusMock(...args),
}));

vi.mock("@/components/providers/StreamCheckHistoryPanel", () => ({
  StreamCheckHistoryPanel: () => <div data-testid="stream-check-history" />,
}));

vi.mock("@/components/UsageFooter", () => ({
  default: () => <div data-testid="usage-footer" />,
}));

vi.mock("@dnd-kit/sortable", async () => {
  const actual = await vi.importActual<any>("@dnd-kit/sortable");

  return {
    ...actual,
    useSortable: (...args: unknown[]) => useSortableMock(...args),
  };
});

function createProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: overrides.id ?? "provider-1",
    name: overrides.name ?? "Test Provider",
    settingsConfig: overrides.settingsConfig ?? {},
    category: overrides.category,
    createdAt: overrides.createdAt,
    sortIndex: overrides.sortIndex,
    meta: overrides.meta,
    websiteUrl: overrides.websiteUrl,
  };
}

beforeEach(() => {
  useDragSortMock.mockReset();
  useSortableMock.mockReset();
  providerCardRenderSpy.mockClear();
  getOmoPluginStatusMock.mockReset();
  getOmoPluginStatusMock.mockResolvedValue(false);
  getOmoSlimPluginStatusMock.mockReset();
  getOmoSlimPluginStatusMock.mockResolvedValue(false);
  disableCurrentOmoMock.mockReset();
  disableCurrentOmoMock.mockResolvedValue(true);
  disableCurrentOmoSlimMock.mockReset();
  disableCurrentOmoSlimMock.mockResolvedValue(true);
  checkProviderMock.mockReset();
  checkProviderMock.mockResolvedValue(null);
  checkProvidersMock.mockReset();
  checkProvidersMock.mockResolvedValue(undefined);
  isCheckingMock.mockReset();
  isCheckingMock.mockReturnValue(false);
  useLatestStreamCheckHistoryMock.mockReset();
  useLatestStreamCheckHistoryMock.mockReturnValue({ data: [] });
  useProviderRoutingStatusMock.mockReset();
  useProviderRoutingStatusMock.mockReturnValue({ data: undefined });

  useSortableMock.mockImplementation(({ id }: { id: string }) => ({
    setNodeRef: vi.fn(),
    attributes: { "data-dnd-id": id },
    listeners: { onPointerDown: vi.fn() },
    transform: null,
    transition: null,
    isDragging: false,
  }));

  useDragSortMock.mockReturnValue({
    sortedProviders: [],
    sensors: [],
    handleDragEnd: vi.fn(),
  });
});

describe("ProviderList Component", () => {
  it("should render skeleton placeholders when loading", () => {
    const { container } = render(
      <ProviderList
        providers={{}}
        currentProviderId=""
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
        isLoading
      />,
    );

    const placeholders = container.querySelectorAll(
      ".border-dashed.border-muted-foreground\\/40",
    );
    expect(placeholders).toHaveLength(3);
  });

  it("should show empty state and trigger create callback when no providers exist", () => {
    const handleCreate = vi.fn();
    useDragSortMock.mockReturnValueOnce({
      sortedProviders: [],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    render(
      <ProviderList
        providers={{}}
        currentProviderId=""
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
        onCreate={handleCreate}
      />,
    );

    const addButton = screen.getByRole("button", {
      name: "provider.addProvider",
    });
    fireEvent.click(addButton);

    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it("should render in order returned by useDragSort and pass through action callbacks", () => {
    const providerA = createProvider({ id: "a", name: "A" });
    const providerB = createProvider({ id: "b", name: "B" });

    const handleSwitch = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const handleDuplicate = vi.fn();
    const handleUsage = vi.fn();
    const handleOpenWebsite = vi.fn();

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerB, providerA],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    render(
      <ProviderList
        providers={{ a: providerA, b: providerB }}
        currentProviderId="b"
        appId="claude"
        isEditMode
        onSwitch={handleSwitch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onConfigureUsage={handleUsage}
        onOpenWebsite={handleOpenWebsite}
      />,
    );

    // Verify sort order
    expect(providerCardRenderSpy).toHaveBeenCalledTimes(2);
    expect(providerCardRenderSpy.mock.calls[0][0].provider.id).toBe("b");
    expect(providerCardRenderSpy.mock.calls[1][0].provider.id).toBe("a");

    // Verify current provider marker and edit mode pass-through
    expect(providerCardRenderSpy.mock.calls[0][0].isCurrent).toBe(true);
    expect(providerCardRenderSpy.mock.calls[0][0].isEditMode).toBe(true);

    // Drag attributes from useSortable
    expect(
      providerCardRenderSpy.mock.calls[0][0].dragHandleProps?.attributes[
        "data-dnd-id"
      ],
    ).toBe("b");
    expect(
      providerCardRenderSpy.mock.calls[1][0].dragHandleProps?.attributes[
        "data-dnd-id"
      ],
    ).toBe("a");

    // Trigger action buttons
    fireEvent.click(screen.getByTestId("switch-b"));
    fireEvent.click(screen.getByTestId("edit-b"));
    fireEvent.click(screen.getByTestId("duplicate-b"));
    fireEvent.click(screen.getByTestId("usage-b"));
    fireEvent.click(screen.getByTestId("delete-a"));

    expect(handleSwitch).toHaveBeenCalledWith(providerB);
    expect(handleEdit).toHaveBeenCalledWith(providerB);
    expect(handleDuplicate).toHaveBeenCalledWith(providerB);
    expect(handleUsage).toHaveBeenCalledWith(providerB);
    expect(handleDelete).toHaveBeenCalledWith(providerA);

    // Verify useDragSort call parameters
    expect(useDragSortMock).toHaveBeenCalledWith(
      { a: providerA, b: providerB },
      "claude",
    );
  });


  it("maps proxy routing, failover priority, and circuit health to cards", () => {
    const provider = createProvider({ id: "routed", name: "Routed" });
    const proxyHealth = {
      appType: "claude",
      providerId: "routed",
      state: "half_open",
      failureCount: 2,
      recoverySuccessCount: 1,
      windowRequests: 12,
      windowFailures: 4,
    };
    useDragSortMock.mockReturnValue({
      sortedProviders: [provider],
      sensors: [],
      handleDragEnd: vi.fn(),
    });
    useProviderRoutingStatusMock.mockReturnValue({
      data: {
        routeApp: "claude",
        configApp: "claude",
        status: {
          running: true,
          activeTargets: [
            {
              appType: "claude",
              providerId: "routed",
              providerName: "Routed",
            },
          ],
          providerHealth: [proxyHealth],
          takeover: { claude: true },
        },
        settings: {
          apps: { claude: { autoFailoverEnabled: true } },
        },
        queue: [{ providerId: "routed", providerName: "Routed", position: 0 }],
      },
    });

    render(
      <ProviderList
        providers={{ routed: provider }}
        currentProviderId="another-provider"
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    const props = providerCardRenderSpy.mock.calls.find(
      ([value]) => value.provider.id === "routed",
    )?.[0];
    expect(useProviderRoutingStatusMock).toHaveBeenCalledWith("claude");
    expect(props).toMatchObject({
      failoverPriority: 1,
      failoverActive: true,
      isActiveRoute: true,
      proxyHealth,
    });
  });

  it("uses the Claude Desktop route id for proxy circuit health", () => {
    const provider = createProvider({ id: "desktop-route" });
    const proxyHealth = {
      appType: "claude-desktop",
      providerId: "desktop-route",
      state: "open",
      failureCount: 1,
      recoverySuccessCount: 0,
      windowRequests: 3,
      windowFailures: 1,
    };
    useDragSortMock.mockReturnValue({
      sortedProviders: [provider],
      sensors: [],
      handleDragEnd: vi.fn(),
    });
    useProviderRoutingStatusMock.mockReturnValue({
      data: {
        routeApp: "claude-desktop",
        configApp: "claude",
        status: {
          running: true,
          activeTargets: [],
          providerHealth: [proxyHealth],
          takeover: { claude: true },
        },
        settings: {
          apps: { claude: { autoFailoverEnabled: true } },
        },
        queue: [],
      },
    });

    render(
      <ProviderList
        providers={{ "desktop-route": provider }}
        currentProviderId="desktop-route"
        appId="claude-desktop"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    const props = providerCardRenderSpy.mock.calls.find(
      ([value]) => value.provider.id === "desktop-route",
    )?.[0];
    expect(props.proxyHealth).toEqual(proxyHealth);
  });

  it("does not expose stream check action for OpenClaw additive providers", () => {
    const provider = createProvider({ id: "openclaw-1", name: "OpenClaw" });
    useDragSortMock.mockReturnValue({
      sortedProviders: [provider],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    render(
      <ProviderList
        providers={{ "openclaw-1": provider }}
        currentProviderId=""
        appId="openclaw"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    expect(screen.getByTestId("stream-check-openclaw-1")).toHaveAttribute(
      "data-enabled",
      "false",
    );
  });
});
