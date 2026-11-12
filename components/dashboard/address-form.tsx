"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import type { AddressFormState } from "@/lib/actions/address";
import type { MemberAddress } from "@/lib/data/member";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useFocusFirstError } from "@/hooks/use-focus-first-error";

type Action = (prev: AddressFormState, formData: FormData) => Promise<AddressFormState>;

/**
 * Manual shipping-address form (D-24): name → phone → address → sub-district → district → postcode →
 * province, then the submit button at the bottom-left. The button is disabled while saving, so a
 * double click cannot save twice.
 */
export function AddressForm({
  action,
  initial,
  submitLabel = "เพิ่มที่อยู่",
}: {
  action: Action;
  initial?: MemberAddress | null;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<AddressFormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values;
  const formRef = useFocusFirstError(state);
  const val = (key: string, fallback?: string) => v?.[key] ?? fallback ?? "";

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-6"
    >
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-btn border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field id="fullName" label="ชื่อ-นามสกุล" error={fe.fullName} required>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            maxLength={100}
            defaultValue={val("fullName", initial?.full_name)}
            invalid={Boolean(fe.fullName)}
            required
          />
        </Field>
        <Field id="phone" label="เบอร์โทรศัพท์" error={fe.phone} required>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={15}
            placeholder="0812345678"
            defaultValue={val("phone", initial?.phone)}
            invalid={Boolean(fe.phone)}
            required
          />
        </Field>
      </div>

      <Field
        id="addressLine"
        label="ที่อยู่"
        hint="บ้านเลขที่ หมู่บ้าน อาคาร ซอย ถนน ฯลฯ"
        error={fe.addressLine}
        required
      >
        <Textarea
          id="addressLine"
          name="addressLine"
          rows={3}
          maxLength={300}
          autoComplete="street-address"
          defaultValue={val("addressLine", initial?.address_line)}
          invalid={Boolean(fe.addressLine)}
          required
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field id="subdistrict" label="ตำบล / แขวง" error={fe.subdistrict} required>
          <Input
            id="subdistrict"
            name="subdistrict"
            maxLength={100}
            defaultValue={val("subdistrict", initial?.subdistrict)}
            invalid={Boolean(fe.subdistrict)}
            required
          />
        </Field>
        <Field id="district" label="อำเภอ / เขต" error={fe.district} required>
          <Input
            id="district"
            name="district"
            maxLength={100}
            defaultValue={val("district", initial?.district)}
            invalid={Boolean(fe.district)}
            required
          />
        </Field>
        <Field id="postalCode" label="รหัสไปรษณีย์" error={fe.postalCode} required>
          <Input
            id="postalCode"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            defaultValue={val("postalCode", initial?.postal_code)}
            invalid={Boolean(fe.postalCode)}
            required
          />
        </Field>
        <Field id="province" label="จังหวัด" error={fe.province} required>
          <Input
            id="province"
            name="province"
            maxLength={100}
            defaultValue={val("province", initial?.province)}
            invalid={Boolean(fe.province)}
            required
          />
        </Field>
      </div>

      <div className="mt-2 flex justify-start">
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
