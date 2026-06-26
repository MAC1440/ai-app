import { Direction as DirectionPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

export function DirectionProvider({
  ...props
}: ComponentProps<typeof DirectionPrimitive.DirectionProvider>) {
  return (
    <DirectionPrimitive.DirectionProvider
      data-slot="direction-provider"
      {...props}
    />
  );
}
