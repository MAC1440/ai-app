import { Portal as PortalPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

export function Portal({
  ...props
}: ComponentProps<typeof PortalPrimitive.Portal>) {
  return <PortalPrimitive.Portal data-slot="portal" {...props} />;
}
