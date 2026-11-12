"use client";

import { useEffect, useRef } from "react";

/**
 * After a server action returns validation errors, move keyboard focus to the first invalid
 * field (TC-REG-06 "Focus ไปช่องแรก", TC-RSP-05). Pass the action state; attach the ref to <form>.
 * Fields mark themselves with aria-invalid (components/ui/field.tsx).
 */
export function useFocusFirstError<T extends HTMLElement = HTMLFormElement>(state: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!state) return;
    ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  return ref;
}
