import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { thTodayISO } from "@/lib/utils/format";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { BirthDateForm } from "@/components/dashboard/birth-date-form";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Profile" };

/** S14-F02 profile + S11-F01 birth date. */
export default function ProfilePage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">Profile</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}

async function ProfileContent() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("profiles")
    .select("full_name, email, phone, address, avatar_url, birth_date, birth_date_change_count")
    .eq("id", user.id)
    .single();
  if (!p) return null;

  return (
    <>
      <ProfileForm
        profile={{
          id: user.id,
          fullName: p.full_name,
          email: p.email,
          phone: p.phone,
          address: p.address,
          avatarUrl: p.avatar_url,
        }}
      />
      <BirthDateForm birthDate={p.birth_date} changeCount={p.birth_date_change_count} today={thTodayISO()} />
    </>
  );
}
