import { VisuallyHidden as VisuallyHiddenPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

export function VisuallyHidden({
  ...props
}: ComponentProps<typeof VisuallyHiddenPrimitive.Root>) {
  return (
    <VisuallyHiddenPrimitive.Root data-slot="visually-hidden" {...props} />
  );
}
