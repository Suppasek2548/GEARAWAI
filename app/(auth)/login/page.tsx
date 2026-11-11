import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-[420px] rounded-card border border-line bg-surface p-6 shadow-2xl sm:p-8">
      <h1 className="font-display text-3xl font-bold">Welcome back</h1>
      <p className="mt-1 mb-6 text-ink-soft">เข้าสู่ระบบเพื่อใช้งานตะกร้า รายการโปรด และสะสมคะแนน</p>
      {/* useSearchParams (for ?redirect=) needs a Suspense boundary */}
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </div>
  );
}
