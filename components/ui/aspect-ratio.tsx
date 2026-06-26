import { AspectRatio as AspectRatioPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

export function AspectRatio({
  ...props
}: ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}
