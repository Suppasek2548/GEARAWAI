"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { GENERIC_ERROR } from "@/lib/errors";
import { fieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { addressSchema, MAX_ADDRESSES } from "@/lib/validation/address";

/**
 * Member shipping addresses (D-24). Every action re-checks the signed-in user; the database enforces
 * ownership again through RLS (owner-only writes, admins read-only) and column GRANTs.
 */

export type AddressFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

const UUID_RE = /^[0-9a-f-]{36}$/i;

function readForm(formData: FormData) {
  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    addressLine: String(formData.get("addressLine") ?? ""),
    subdistrict: String(formData.get("subdistrict") ?? ""),
    district: String(formData.get("district") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    province: String(formData.get("province") ?? ""),
  };
  return { raw, parsed: addressSchema.safeParse(raw) };
}

function toRow(d: ReturnType<typeof addressSchema.parse>) {
  return {
    full_name: d.fullName,
    phone: d.phone,
    address_line: d.addressLine,
    subdistrict: d.subdistrict,
    district: d.district,
    postal_code: d.postalCode,
    province: d.province,
  };
}

/** Readable Thai message for a failed write (table missing before migration 0020, suspended account …). */
function writeError(error: { code?: string; message?: string }) {
  if (error.code === "42P01" || /member_addresses/i.test(error.message ?? "")) {
    return "ระบบที่อยู่ยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลร้าน";
  }
  if (error.code === "42501") return "ไม่สามารถบันทึกที่อยู่ได้ — บัญชีอาจถูกระงับ กรุณาติดต่อร้าน";
  return GENERIC_ERROR;
}

export async function createAddressAction(
  _prev: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/addresses/new");

  const { raw, parsed } = readForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const supabase = await createClient();
  const { count } = await supabase
    .from("member_addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_ADDRESSES) {
    return { error: `บันทึกที่อยู่ได้สูงสุด ${MAX_ADDRESSES} รายการ กรุณาลบที่อยู่เก่าก่อน`, values: raw };
  }

  const { error } = await supabase.from("member_addresses").insert(toRow(parsed.data));
  if (error) return { error: writeError(error), values: raw };

  revalidatePath("/dashboard/addresses");
  redirect("/dashboard/addresses?saved=added");
}

export async function updateAddressAction(
  id: string,
  _prev: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/addresses");
  if (!UUID_RE.test(id)) return { error: "ไม่พบที่อยู่นี้" };

  const { raw, parsed } = readForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_addresses")
    .update(toRow(parsed.data))
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error) return { error: writeError(error), values: raw };
  if (!data?.length) return { error: "ไม่พบที่อยู่นี้ หรือคุณไม่มีสิทธิ์แก้ไข", values: raw };

  revalidatePath("/dashboard/addresses");
  redirect("/dashboard/addresses?saved=updated");
}

export async function deleteAddressAction(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "กรุณาเข้าสู่ระบบ" };
  if (!UUID_RE.test(id)) return { ok: false, message: "ไม่พบที่อยู่นี้" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");
  if (error) return { ok: false, message: writeError(error) };
  if (!data?.length) return { ok: false, message: "ไม่พบที่อยู่นี้ หรือคุณไม่มีสิทธิ์ลบ" };

  revalidatePath("/dashboard/addresses");
  return { ok: true, message: "ลบที่อยู่แล้ว" };
}
