"use client";

import { unstable_OneTimePasswordField as OneTimePasswordFieldPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function OneTimePasswordField({
  className,
  ...props
}: ComponentProps<typeof OneTimePasswordFieldPrimitive.Root>) {
  return (
    <OneTimePasswordFieldPrimitive.Root
      data-slot="one-time-password-field"
      className={cn("flex gap-2", className)}
      {...props}
    />
  );
}

export function OneTimePasswordFieldInput({
  className,
  ...props
}: ComponentProps<typeof OneTimePasswordFieldPrimitive.Input>) {
  return (
    <OneTimePasswordFieldPrimitive.Input
      data-slot="one-time-password-field-input"
      className={cn(
        "flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-center text-sm shadow-xs",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
      {...props}
    />
  );
}

export function OneTimePasswordFieldHiddenInput({
  ...props
}: ComponentProps<typeof OneTimePasswordFieldPrimitive.HiddenInput>) {
  return (
    <OneTimePasswordFieldPrimitive.HiddenInput
      data-slot="one-time-password-field-hidden-input"
      {...props}
    />
  );
}
