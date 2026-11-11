"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MediaCategory } from "@/lib/admin/media-types";
import type { FormState } from "@/lib/admin/form";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ImagePicker } from "./image-picker";

export type FieldDef =
  | {
      name: string;
      label: string;
      type: "text" | "email" | "url";
      required?: boolean;
      hint?: string;
      maxLength?: number;
      placeholder?: string;
      uppercase?: boolean;
    }
  | { name: string; label: string; type: "textarea"; required?: boolean; hint?: string; maxLength?: number }
  | {
      name: string;
      label: string;
      type: "number";
      required?: boolean;
      hint?: string;
      step?: string;
      min?: number;
      max?: number;
    }
  | {
      name: string;
      label: string;
      type: "select";
      required?: boolean;
      hint?: string;
      options: { value: string; label: string }[];
    }
  | { name: string; label: string; type: "checkbox"; hint?: string }
  | { name: string; label: string; type: "date" | "datetime-local"; required?: boolean; hint?: string }
  | { name: string; label: string; type: "image"; category: MediaCategory; hint?: string }
  | { name: string; label: string; type: "kv"; hint?: string }
  | { name: string; label: string; type: "slug"; source: string; required?: boolean; hint?: string };

type Values = Record<string, string | number | boolean | null | Record<string, string> | undefined>;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Specifications editor (ADMIN §4.2): add / remove / reorder rows; serialised to JSON in a hidden input. */
function KeyValueEditor({
  name,
  initial,
  error,
}: {
  name: string;
  initial: Record<string, string>;
  error?: string;
}) {
  const [rows, setRows] = useState<{ k: string; v: string }[]>(
    Object.entries(initial).map(([k, v]) => ({ k, v })),
  );
  const obj: Record<string, string> = {};
  for (const r of rows) if (r.k.trim()) obj[r.k.trim()] = r.v;
  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={JSON.stringify(obj)} />
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input
            aria-label={`หัวข้อแถว ${i + 1}`}
            value={r.k}
            onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))}
            placeholder="Key"
            className="h-10 w-2/5 min-w-0 rounded-btn border border-line bg-canvas px-3 text-sm text-ink"
          />
          <input
            aria-label={`ค่าแถว ${i + 1}`}
            value={r.v}
            onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))}
            placeholder="Value"
            className="h-10 min-w-0 flex-1 rounded-btn border border-line bg-canvas px-3 text-sm text-ink"
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`ลบแถว ${i + 1}`}
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setRows([...rows, { k: "", v: "" }])}
      >
        <Plus className="size-4" aria-hidden /> เพิ่มแถว
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

/**
 * Config-driven admin form (FormPanel, ADMIN §3): Server Action validation, field errors under each input,
 * success toast, optional redirect, and a warning before leaving with unsaved changes.
 */
export function EntityForm({
  fields,
  action,
  defaults = {},
  submitLabel = "บันทึก",
  cancelHref,
  columns = 2,
}: {
  fields: FieldDef[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  defaults?: Values;
  submitLabel?: string;
  cancelHref?: string;
  columns?: 1 | 2;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, { status: "idle" });
  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults.slug));
  const fe = state.fieldErrors ?? {};
  const v = (name: string) => state.values?.[name] ?? defaults[name];

  // A successful save clears the "unsaved changes" flag (state adjusted during render, not in an effect)
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.status === "success") setDirty(false);
  }

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "บันทึกแล้ว");
      if (state.redirect) router.push(state.redirect);
    } else if (state.status === "error" && state.message) toast.error(state.message);
  }, [state, router]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form
      action={formAction}
      noValidate
      onChange={() => setDirty(true)}
      onInput={(e) => {
        // Auto-fill slug from its source field until the admin edits the slug itself
        const t = e.target as HTMLInputElement;
        const slugField = fields.find((f) => f.type === "slug" && f.source === t.name) as
          Extract<FieldDef, { type: "slug" }> | undefined;
        if (slugField && !slugTouched) {
          const el = t.form?.elements.namedItem(slugField.name) as HTMLInputElement | null;
          if (el) el.value = slugify(t.value);
        }
        if (fields.some((f) => f.type === "slug" && f.name === t.name)) setSlugTouched(true);
      }}
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 md:p-6"
    >
      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      <div className={columns === 2 ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
        {fields.map((f) => {
          const id = `f-${f.name}`;
          const err = fe[f.name];
          const wide = f.type === "textarea" || f.type === "kv" || f.type === "image";
          const cls = wide ? "md:col-span-2" : undefined;
          switch (f.type) {
            case "checkbox":
              return (
                <label
                  key={f.name}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 text-sm ${cls ?? ""}`}
                >
                  <input type="hidden" name={f.name} value="off" />
                  <input
                    type="checkbox"
                    name={f.name}
                    value="on"
                    defaultChecked={Boolean(v(f.name))}
                    className="size-[18px] accent-brand-lime"
                  />
                  <span>
                    {f.label}
                    {f.hint && <span className="block text-xs text-ink-muted">{f.hint}</span>}
                  </span>
                </label>
              );
            case "image":
              return (
                <div key={f.name} className={cls}>
                  <ImagePicker
                    name={f.name}
                    category={f.category}
                    label={f.label}
                    defaultUrl={(v(f.name) as string) ?? ""}
                  />
                  {err && <p className="mt-1 text-sm text-danger">{err}</p>}
                </div>
              );
            case "kv":
              return (
                <div key={f.name} className={`flex flex-col gap-1.5 ${cls}`}>
                  <span className="text-sm font-medium text-ink-soft">{f.label}</span>
                  <KeyValueEditor
                    name={f.name}
                    initial={(v(f.name) as Record<string, string>) ?? {}}
                    error={err}
                  />
                </div>
              );
            case "textarea":
              return (
                <Field
                  key={f.name}
                  id={id}
                  label={f.label}
                  error={err}
                  hint={f.hint}
                  required={f.required}
                  className={cls}
                >
                  <Textarea
                    id={id}
                    name={f.name}
                    defaultValue={(v(f.name) as string) ?? ""}
                    maxLength={f.maxLength}
                    invalid={Boolean(err)}
                    className="min-h-28"
                  />
                </Field>
              );
            case "select":
              return (
                <Field key={f.name} id={id} label={f.label} error={err} hint={f.hint} required={f.required}>
                  <Select
                    id={id}
                    name={f.name}
                    defaultValue={(v(f.name) as string) ?? ""}
                    invalid={Boolean(err)}
                  >
                    {!f.required && <option value="">—</option>}
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              );
            case "number":
              return (
                <Field key={f.name} id={id} label={f.label} error={err} hint={f.hint} required={f.required}>
                  <Input
                    id={id}
                    name={f.name}
                    type="number"
                    inputMode="decimal"
                    step={f.step ?? "1"}
                    min={f.min}
                    max={f.max}
                    defaultValue={v(f.name) === null || v(f.name) === undefined ? "" : String(v(f.name))}
                    invalid={Boolean(err)}
                  />
                </Field>
              );
            case "slug":
              return (
                <Field
                  key={f.name}
                  id={id}
                  label={f.label}
                  error={err}
                  hint={f.hint ?? "a-z 0-9 และ - เท่านั้น"}
                  required={f.required}
                >
                  <Input
                    id={id}
                    name={f.name}
                    defaultValue={(v(f.name) as string) ?? ""}
                    maxLength={80}
                    invalid={Boolean(err)}
                  />
                </Field>
              );
            default:
              return (
                <Field
                  key={f.name}
                  id={id}
                  label={f.label}
                  error={err}
                  hint={f.hint}
                  required={"required" in f ? f.required : false}
                >
                  <Input
                    id={id}
                    name={f.name}
                    type={f.type}
                    defaultValue={(v(f.name) as string) ?? ""}
                    maxLength={"maxLength" in f ? f.maxLength : undefined}
                    placeholder={"placeholder" in f ? f.placeholder : undefined}
                    className={"uppercase" in f && f.uppercase ? "uppercase" : undefined}
                    invalid={Boolean(err)}
                  />
                </Field>
              );
          }
        })}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button type="submit" size="lg" loading={pending} className="sm:w-40">
          {submitLabel}
        </Button>
        {cancelHref && (
          <Link href={cancelHref} className={buttonClasses({ variant: "ghost", size: "lg" })}>
            ยกเลิก
          </Link>
        )}
      </div>
    </form>
  );
}
