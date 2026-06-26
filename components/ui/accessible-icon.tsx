import { AccessibleIcon as AccessibleIconPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

export function AccessibleIcon({
  ...props
}: ComponentProps<typeof AccessibleIconPrimitive.AccessibleIcon>) {
  return (
    <AccessibleIconPrimitive.AccessibleIcon
      data-slot="accessible-icon"
      {...props}
    />
  );
}
