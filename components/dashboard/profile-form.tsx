"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Camera, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { setAvatarUrlAction, updateProfileAction, type ProfileFormState } from "@/lib/actions/member";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MemberAvatar } from "./member-avatar";

const MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

type Profile = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
};

/** S14-F02 — only full_name, phone, address, avatar_url are writable by members (column GRANT, R-01). */
export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, saving] = useActionState<ProfileFormState, FormData>(updateProfileAction, {
    status: "idle",
  });
  const [avatar, setAvatar] = useState(profile.avatarUrl);
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const fe = state.fieldErrors ?? {};

  const ownPath = (url: string | null) => {
    const marker = `/storage/v1/object/public/avatars/`;
    const i = url?.indexOf(marker) ?? -1;
    return url && i >= 0 ? url.slice(i + marker.length) : null;
  };

  const upload = (file: File) =>
    startUpload(async () => {
      if (!MIME.includes(file.type)) return void toast.error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP");
      if (file.size > MAX_BYTES) return void toast.error("ไฟล์ต้องมีขนาดไม่เกิน 2 MB");
      const supabase = createClient();
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      // New file name each time so browsers/CDN never show a cached old picture
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
      if (error) return void toast.error("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
      const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const res = await setAvatarUrlAction(url);
      if (!res.ok) {
        await supabase.storage.from("avatars").remove([path]);
        return void toast.error(res.message);
      }
      const old = ownPath(avatar);
      if (old) await supabase.storage.from("avatars").remove([old]); // tidy up the previous picture
      setAvatar(url);
      toast.success(res.message);
    });

  const removeAvatar = () =>
    startUpload(async () => {
      const res = await setAvatarUrlAction(null);
      if (!res.ok) return void toast.error(res.message);
      const old = ownPath(avatar);
      if (old) await createClient().storage.from("avatars").remove([old]);
      setAvatar(null);
      toast.success(res.message);
    });

  return (
    <div className="flex flex-col gap-6 rounded-card border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center gap-4">
        <MemberAvatar name={profile.fullName} url={avatar} />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
              {!uploading && <Camera className="size-4" aria-hidden />}
              เปลี่ยนรูปโปรไฟล์
            </Button>
            {avatar && (
              <Button variant="ghost" onClick={removeAvatar} disabled={uploading} aria-label="ลบรูปโปรไฟล์">
                <Trash2 className="size-4" aria-hidden />
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-muted">JPG / PNG / WebP ไม่เกิน 2 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept={MIME.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-label="เลือกไฟล์รูปโปรไฟล์"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) upload(f);
            }}
          />
        </div>
      </div>

      <form action={action} noValidate className="flex flex-col gap-4">
        {state.status === "success" && (
          <p role="status" className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="size-4" aria-hidden /> {state.message}
          </p>
        )}
        {state.status === "error" && state.message && (
          <p role="alert" className="text-sm text-danger">
            {state.message}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="fullName" label="ชื่อ-นามสกุล" error={fe.fullName} required>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={profile.fullName}
              maxLength={100}
              invalid={Boolean(fe.fullName)}
            />
          </Field>
          <Field id="email" label="อีเมล" hint="เปลี่ยนอีเมลไม่ได้">
            <Input id="email" value={profile.email} readOnly disabled />
          </Field>
          <Field id="phone" label="เบอร์โทร" error={fe.phone}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
              maxLength={15}
              invalid={Boolean(fe.phone)}
            />
          </Field>
        </div>
        <Field id="address" label="ที่อยู่ (ใช้เติมอัตโนมัติตอน Checkout)" error={fe.address}>
          <Textarea
            id="address"
            name="address"
            defaultValue={profile.address ?? ""}
            maxLength={500}
            className="min-h-28"
            invalid={Boolean(fe.address)}
          />
        </Field>
        <Button type="submit" size="lg" loading={saving} className="self-start sm:w-40">
          บันทึกข้อมูล
        </Button>
      </form>
    </div>
  );
}
