import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function ToggleGroup({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root> & {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  );
}

export function ToggleGroupItem({
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item> & {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
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
