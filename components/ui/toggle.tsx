import { Toggle as TogglePrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentProps<typeof TogglePrimitive.Root> & {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=on]:bg-zinc-100 data-[state=on]:text-zinc-900",
        "dark:data-[state=on]:bg-zinc-800 dark:data-[state=on]:text-zinc-100",
        variant === "default" && "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800",
        variant === "outline" &&
          "border border-zinc-200 bg-transparent hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
        size === "default" && "h-9 px-3",
        size === "sm" && "h-8 px-2",
        size === "lg" && "h-10 px-4",
        className,
      )}
      {...props}
    />
  );
}
