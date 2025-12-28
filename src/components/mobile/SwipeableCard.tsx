"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type TouchEvent,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils";
import { Trash2, Edit, MoreHorizontal, Phone, Mail } from "lucide-react";

type SwipeAction = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
};

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeComplete?: (direction: "left" | "right", actionId: string) => void;
  className?: string;
  disabled?: boolean;
  threshold?: number; // Percentage of card width to trigger action
}

const DEFAULT_LEFT_ACTIONS: SwipeAction[] = [
  {
    id: "call",
    icon: Phone,
    label: "Call",
    color: "text-white",
    bgColor: "bg-green-500",
    onClick: () => {},
  },
  {
    id: "email",
    icon: Mail,
    label: "Email",
    color: "text-white",
    bgColor: "bg-blue-500",
    onClick: () => {},
  },
];

const DEFAULT_RIGHT_ACTIONS: SwipeAction[] = [
  {
    id: "edit",
    icon: Edit,
    label: "Edit",
    color: "text-white",
    bgColor: "bg-zinc-500",
    onClick: () => {},
  },
  {
    id: "delete",
    icon: Trash2,
    label: "Delete",
    color: "text-white",
    bgColor: "bg-red-500",
    onClick: () => {},
  },
];

export function SwipeableCard({
  children,
  leftActions = DEFAULT_LEFT_ACTIONS,
  rightActions = DEFAULT_RIGHT_ACTIONS,
  onSwipeComplete,
  className,
  disabled = false,
  threshold = 0.3,
}: SwipeableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSwipedOpen, setIsSwipedOpen] = useState<"left" | "right" | null>(null);

  const ACTION_WIDTH = 72; // Width of each action button
  const maxLeftSwipe = leftActions.length * ACTION_WIDTH;
  const maxRightSwipe = rightActions.length * ACTION_WIDTH;

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (disabled) return;
      setStartX(e.touches[0].clientX - currentX);
      setIsDragging(true);
    },
    [disabled, currentX]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      setStartX(e.clientX - currentX);
      setIsDragging(true);
    },
    [disabled, currentX]
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || disabled) return;

      const diff = clientX - startX;

      // Limit the swipe range with resistance at edges
      let newX = diff;
      if (diff > maxLeftSwipe) {
        newX = maxLeftSwipe + (diff - maxLeftSwipe) * 0.2;
      } else if (diff < -maxRightSwipe) {
        newX = -maxRightSwipe + (diff + maxRightSwipe) * 0.2;
      }

      setCurrentX(newX);
    },
    [isDragging, disabled, startX, maxLeftSwipe, maxRightSwipe]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      handleMove(e.touches[0].clientX);
    },
    [handleMove]
  );

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      handleMove(e.clientX);
    },
    [handleMove]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const containerWidth = containerRef.current?.offsetWidth || 300;
    const swipeThreshold = containerWidth * threshold;

    if (currentX > swipeThreshold && leftActions.length > 0) {
      // Snap to show left actions
      setCurrentX(maxLeftSwipe);
      setIsSwipedOpen("left");
    } else if (currentX < -swipeThreshold && rightActions.length > 0) {
      // Snap to show right actions
      setCurrentX(-maxRightSwipe);
      setIsSwipedOpen("right");
    } else {
      // Snap back to closed
      setCurrentX(0);
      setIsSwipedOpen(null);
    }
  }, [isDragging, currentX, threshold, leftActions.length, rightActions.length, maxLeftSwipe, maxRightSwipe]);

  const handleActionClick = useCallback(
    (action: SwipeAction, direction: "left" | "right") => {
      action.onClick();
      onSwipeComplete?.(direction, action.id);
      // Reset the card position
      setCurrentX(0);
      setIsSwipedOpen(null);
    },
    [onSwipeComplete]
  );

  const resetPosition = useCallback(() => {
    setCurrentX(0);
    setIsSwipedOpen(null);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    if (isSwipedOpen) {
      const handleClickOutside = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          resetPosition();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [isSwipedOpen, resetPosition]);

  // Mouse move/up listeners
  useEffect(() => {
    if (isDragging) {
      const handleMouseUp = () => handleEnd();

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden touch-pan-y",
        disabled && "pointer-events-none",
        className
      )}
    >
      {/* Left Actions (shown when swiping right) */}
      <div
        className="absolute inset-y-0 left-0 flex"
        style={{ width: maxLeftSwipe }}
      >
        {leftActions.map((action, index) => {
          const Icon = action.icon;
          const actionProgress = Math.min(1, currentX / ((index + 1) * ACTION_WIDTH));

          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action, "left")}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1",
                action.bgColor,
                action.color,
                "touch-manipulation transition-transform"
              )}
              style={{
                width: ACTION_WIDTH,
                transform: `scale(${0.8 + actionProgress * 0.2})`,
                opacity: Math.max(0.6, actionProgress),
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Actions (shown when swiping left) */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: maxRightSwipe }}
      >
        {rightActions.map((action, index) => {
          const Icon = action.icon;
          const actionProgress = Math.min(1, -currentX / ((index + 1) * ACTION_WIDTH));

          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action, "right")}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1",
                action.bgColor,
                action.color,
                "touch-manipulation transition-transform"
              )}
              style={{
                width: ACTION_WIDTH,
                transform: `scale(${0.8 + actionProgress * 0.2})`,
                opacity: Math.max(0.6, actionProgress),
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div
        ref={contentRef}
        className={cn(
          "relative bg-white dark:bg-zinc-900",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          !isDragging && "transition-transform duration-200 ease-out"
        )}
        style={{
          transform: `translateX(${currentX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
}

// Pre-configured swipe actions
export const contactSwipeActions = {
  left: [
    {
      id: "call",
      icon: Phone,
      label: "Call",
      color: "text-white",
      bgColor: "bg-green-500",
      onClick: () => {},
    },
    {
      id: "email",
      icon: Mail,
      label: "Email",
      color: "text-white",
      bgColor: "bg-blue-500",
      onClick: () => {},
    },
  ],
  right: [
    {
      id: "edit",
      icon: Edit,
      label: "Edit",
      color: "text-white",
      bgColor: "bg-zinc-500",
      onClick: () => {},
    },
    {
      id: "delete",
      icon: Trash2,
      label: "Delete",
      color: "text-white",
      bgColor: "bg-red-500",
      onClick: () => {},
    },
  ],
};

export const dealSwipeActions = {
  left: [
    {
      id: "won",
      icon: () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ),
      label: "Won",
      color: "text-white",
      bgColor: "bg-green-500",
      onClick: () => {},
    },
  ],
  right: [
    {
      id: "edit",
      icon: Edit,
      label: "Edit",
      color: "text-white",
      bgColor: "bg-zinc-500",
      onClick: () => {},
    },
    {
      id: "lost",
      icon: () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      ),
      label: "Lost",
      color: "text-white",
      bgColor: "bg-red-500",
      onClick: () => {},
    },
  ],
};

export default SwipeableCard;
