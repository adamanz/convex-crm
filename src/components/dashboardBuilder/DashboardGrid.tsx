"use client";

import { useCallback, useMemo } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { Id } from "../../../convex/_generated/dataModel";
import { WidgetCard } from "./WidgetCard";
import "react-grid-layout/css/styles.css";

interface Widget {
  _id: Id<"dashboardWidgets">;
  type: "metric" | "chart" | "list" | "table" | "funnel" | "leaderboard";
  title: string;
  description?: string;
  config: Record<string, unknown>;
  refreshInterval?: number;
  order: number;
}

interface LayoutItem {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

interface Dashboard {
  _id: Id<"dashboards">;
  name: string;
  layout: LayoutItem[];
  widgets: Widget[];
}

interface DashboardGridProps {
  dashboard: Dashboard;
  isEditing: boolean;
  selectedWidgetId: Id<"dashboardWidgets"> | null;
  onLayoutChange: (layout: LayoutItem[]) => void;
  onWidgetSelect: (widgetId: Id<"dashboardWidgets"> | null) => void;
  onRemoveWidget: (widgetId: Id<"dashboardWidgets">) => void;
}

export function DashboardGrid({
  dashboard,
  isEditing,
  selectedWidgetId,
  onLayoutChange,
  onWidgetSelect,
  onRemoveWidget,
}: DashboardGridProps) {
  const COLS = 12;
  const ROW_HEIGHT = 80;

  // Convert our layout format to react-grid-layout format
  const gridLayout: Layout[] = useMemo(() => {
    return dashboard.layout.map((item) => ({
      i: item.widgetId,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW ?? 2,
      minH: item.minH ?? 2,
      maxW: item.maxW,
      maxH: item.maxH,
      static: !isEditing,
    }));
  }, [dashboard.layout, isEditing]);

  // Handle layout changes from the grid
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!isEditing) return;

      const convertedLayout: LayoutItem[] = newLayout.map((item) => ({
        widgetId: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }));

      onLayoutChange(convertedLayout);
    },
    [isEditing, onLayoutChange]
  );

  // Get widget by ID
  const getWidget = useCallback(
    (widgetId: string): Widget | undefined => {
      return dashboard.widgets.find((w) => w._id === widgetId);
    },
    [dashboard.widgets]
  );

  // Handle clicking on the grid background (deselect)
  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onWidgetSelect(null);
      }
    },
    [onWidgetSelect]
  );

  // Empty state
  if (dashboard.widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isEditing
            ? 'Click "Add Widget" to add your first widget'
            : "No widgets on this dashboard yet"}
        </p>
      </div>
    );
  }

  return (
    <div
      className="dashboard-grid min-h-[400px]"
      onClick={handleGridClick}
    >
      <GridLayout
        className="layout"
        layout={gridLayout}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={1200}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {dashboard.layout.map((layoutItem) => {
          const widget = getWidget(layoutItem.widgetId);
          if (!widget) return null;

          return (
            <div key={layoutItem.widgetId}>
              <WidgetCard
                widget={widget}
                isEditing={isEditing}
                isSelected={selectedWidgetId === widget._id}
                onSelect={() => onWidgetSelect(widget._id)}
                onRemove={() => onRemoveWidget(widget._id)}
              />
            </div>
          );
        })}
      </GridLayout>

      <style jsx global>{`
        .dashboard-grid .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }

        .dashboard-grid .react-grid-item.cssTransforms {
          transition-property: transform;
        }

        .dashboard-grid .react-grid-item.resizing {
          z-index: 10;
          will-change: width, height;
        }

        .dashboard-grid .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 10;
          will-change: transform;
        }

        .dashboard-grid .react-grid-item.dropping {
          visibility: hidden;
        }

        .dashboard-grid .react-grid-placeholder {
          background: rgb(59, 130, 246);
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 0.75rem;
          border: 2px dashed rgb(59, 130, 246);
        }

        .dashboard-grid .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }

        .dashboard-grid .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 8px;
          height: 8px;
          border-right: 2px solid rgba(0, 0, 0, 0.3);
          border-bottom: 2px solid rgba(0, 0, 0, 0.3);
        }

        .dark .dashboard-grid .react-resizable-handle::after {
          border-right: 2px solid rgba(255, 255, 255, 0.3);
          border-bottom: 2px solid rgba(255, 255, 255, 0.3);
        }

        .dashboard-grid .react-resizable-handle-se {
          bottom: 0;
          right: 0;
          cursor: se-resize;
        }

        .dashboard-grid .react-resizable-handle-sw {
          bottom: 0;
          left: 0;
          cursor: sw-resize;
        }

        .dashboard-grid .react-resizable-handle-nw {
          top: 0;
          left: 0;
          cursor: nw-resize;
        }

        .dashboard-grid .react-resizable-handle-ne {
          top: 0;
          right: 0;
          cursor: ne-resize;
        }

        .dashboard-grid .react-resizable-handle-w,
        .dashboard-grid .react-resizable-handle-e {
          top: 50%;
          margin-top: -10px;
          cursor: ew-resize;
        }

        .dashboard-grid .react-resizable-handle-w {
          left: 0;
        }

        .dashboard-grid .react-resizable-handle-e {
          right: 0;
        }

        .dashboard-grid .react-resizable-handle-n,
        .dashboard-grid .react-resizable-handle-s {
          left: 50%;
          margin-left: -10px;
          cursor: ns-resize;
        }

        .dashboard-grid .react-resizable-handle-n {
          top: 0;
        }

        .dashboard-grid .react-resizable-handle-s {
          bottom: 0;
        }
      `}</style>
    </div>
  );
}
