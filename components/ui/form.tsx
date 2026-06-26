import { Form as FormPrimitive } from "radix-ui";
import { type ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function Form({
  ...props
}: ComponentProps<typeof FormPrimitive.Root>) {
  return <FormPrimitive.Root data-slot="form" {...props} />;
}

export function FormField({
  className,
  ...props
}: ComponentProps<typeof FormPrimitive.Field>) {
  return (
    <FormPrimitive.Field
      data-slot="form-field"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

export function FormLabel({
  className,
  ...props
}: ComponentProps<typeof FormPrimitive.Label>) {
  return (
    <FormPrimitive.Label asChild>
      <Label data-slot="form-label" className={className} {...props} />
    </FormPrimitive.Label>
  );
}

export function FormControl({
  ...props
}: ComponentProps<typeof FormPrimitive.Control>) {
  return <FormPrimitive.Control data-slot="form-control" {...props} />;
}

export function FormMessage({
  className,
  ...props
}: ComponentProps<typeof FormPrimitive.Message>) {
  return (
    <FormPrimitive.Message
      data-slot="form-message"
      className={cn("text-sm text-red-600 dark:text-red-400", className)}
      {...props}
    />
  );
}

export function FormSubmit({
  className,
  ...props
}: ComponentProps<typeof FormPrimitive.Submit>) {
  return (
    <FormPrimitive.Submit
      data-slot="form-submit"
      className={cn(className)}
      {...props}
    />
  );
}

export function FormValidityState({
  ...props
}: ComponentProps<typeof FormPrimitive.ValidityState>) {
  return (
    <FormPrimitive.ValidityState data-slot="form-validity-state" {...props} />
  );
}
