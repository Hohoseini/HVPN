import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AnimationKind = "spin" | "pulse" | "bounce" | "wiggle" | "float" | "ping" | "none";

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  animation?: AnimationKind;
  hoverOnly?: boolean;
  size?: number;
}

const animationClass: Record<AnimationKind, string> = {
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
  ping: "animate-ping",
  wiggle: "group-hover:[animation:wiggle_0.5s_ease-in-out]",
  float: "animate-[float_3s_ease-in-out_infinite]",
  none: "",
};

export function AnimatedIcon({
  icon: Icon,
  className,
  animation = "none",
  hoverOnly = false,
  size,
}: AnimatedIconProps) {
  const anim = animationClass[animation];
  return (
    <span className="group inline-flex">
      <Icon
        size={size}
        className={cn(
          "transition-transform duration-200",
          hoverOnly ? "group-hover:scale-110" : anim,
          hoverOnly && animation !== "none" ? `group-hover:${anim}` : "",
          className,
        )}
      />
    </span>
  );
}
