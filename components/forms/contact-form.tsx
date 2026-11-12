"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { submitContactAction, type ContactFormState } from "@/lib/actions/contact";
import { MESSAGE_MAX } from "@/lib/validation/contact";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useFocusFirstError } from "@/hooks/use-focus-first-error";

/** S20 Contact Form (600×550) — validation, honeypot, loading/disabled while sending, result box 360×100. */
export function ContactForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(submitContactAction, {
    status: "idle",
  });
  const fe = state.fieldErrors ?? {};
  const v = state.values;
  const formRef = useFocusFirstError(state);

  return (
    <form ref={formRef} action={action} noValidate className="flex w-full flex-col gap-4">
      <div aria-live="polite">
        {state.status === "success" && state.message && (
          <div
            role="status"
            className="flex min-h-[100px] items-center gap-3 rounded-card border border-success/40 bg-success/10 p-4 text-success sm:max-w-[360px]"
          >
            <CheckCircle2 className="size-6 shrink-0" aria-hidden />
            {state.message}
          </div>
        )}
        {state.status === "error" && state.message && (
          <div
            role="alert"
            className="flex min-h-[100px] items-center gap-3 rounded-card border border-danger/40 bg-danger/10 p-4 text-danger sm:max-w-[360px]"
          >
            <AlertCircle className="size-6 shrink-0" aria-hidden />
            {state.message}
          </div>
        )}
      </div>

      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" label="Name" error={fe.name} required>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            maxLength={100}
            defaultValue={v?.name ?? defaultName}
            invalid={Boolean(fe.name)}
            required
          />
        </Field>
        <Field id="contact-email" label="Email" error={fe.email} required>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={v?.email ?? defaultEmail}
            invalid={Boolean(fe.email)}
            required
          />
        </Field>
      </div>
      <Field id="contact-subject" label="Subject" error={fe.subject} required>
        <Input
          id="contact-subject"
          name="subject"
          maxLength={150}
          defaultValue={v?.subject}
          invalid={Boolean(fe.subject)}
          required
        />
      </Field>
      {/* React resets the form after a successful action (S20-F04); the key remounts the counter too */}
      <MessageField key={state.sentAt ?? 0} defaultValue={v?.message ?? ""} error={fe.message} />
      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-40">
        {!pending && <Send className="size-4" aria-hidden />}
        SEND MESSAGE
      </Button>
    </form>
  );
}

function MessageField({ defaultValue, error }: { defaultValue: string; error?: string }) {
  const [length, setLength] = useState(defaultValue.length);
  return (
    <Field
      id="contact-message"
      label="Message"
      error={error}
      hint={`${length.toLocaleString("th-TH")}/${MESSAGE_MAX.toLocaleString("th-TH")} ตัวอักษร (อย่างน้อย 10)`}
      required
    >
      <Textarea
        id="contact-message"
        name="message"
        maxLength={MESSAGE_MAX}
        defaultValue={defaultValue}
        onChange={(e) => setLength(e.target.value.length)}
        invalid={Boolean(error)}
        required
      />
    </Field>
  );
}
