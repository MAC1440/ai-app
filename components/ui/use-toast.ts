"use client";

import { useEffect, useState } from "react";

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const listeners: Array<(state: ToasterToast[]) => void> = [];
let memoryState: ToasterToast[] = [];

function dispatch(action: {
  type: "ADD" | "UPDATE" | "DISMISS" | "REMOVE";
  toast?: ToasterToast;
  toastId?: string;
}) {
  switch (action.type) {
    case "ADD":
      memoryState = [action.toast!, ...memoryState].slice(0, TOAST_LIMIT);
      break;
    case "UPDATE":
      memoryState = memoryState.map((toast) =>
        toast.id === action.toast!.id ? { ...toast, ...action.toast } : toast,
      );
      break;
    case "DISMISS":
      memoryState = memoryState.map((toast) =>
        toast.id === action.toastId || action.toastId === undefined
          ? { ...toast, open: false }
          : toast,
      );
      break;
    case "REMOVE":
      memoryState =
        action.toastId === undefined
          ? []
          : memoryState.filter((toast) => toast.id !== action.toastId);
      break;
  }

  listeners.forEach((listener) => listener(memoryState));
}

function genId() {
  return crypto.randomUUID();
}

export function toast({ ...props }: Omit<ToasterToast, "id">) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({ type: "UPDATE", toast: { ...props, id } });
  const dismiss = () => dispatch({ type: "DISMISS", toastId: id });

  dispatch({
    type: "ADD",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  setTimeout(() => {
    dispatch({ type: "REMOVE", toastId: id });
  }, TOAST_REMOVE_DELAY);

  return { id, dismiss, update };
}

export function useToast() {
  const [state, setState] = useState<ToasterToast[]>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    toasts: state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS", toastId }),
  };
}
