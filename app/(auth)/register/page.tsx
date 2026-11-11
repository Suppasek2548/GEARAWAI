import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-[420px] rounded-card border border-line bg-surface p-6 shadow-2xl sm:p-8">
      <h1 className="font-display text-3xl font-bold">Create account</h1>
      <p className="mt-1 mb-6 text-ink-soft">สมัครสมาชิกเพื่อสั่งซื้อสินค้า สะสมคะแนน และรับสิทธิพิเศษ</p>
      <RegisterForm />
    </div>
  );
}
