"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adjustPointsAction } from "@/lib/actions/admin-members";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

/** ADMIN §4.10 — choose member → amount (±) → reason (required) → admin_adjust_points(); never below 0. */
export function PointsAdjustForm({
  members,
  defaultUserId,
}: {
  members: { id: string; label: string; balance: number }[];
  defaultUserId: string | null;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(defaultUserId ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const member = members.find((m) => m.id === userId);
  const n = Number(amount);
  const after = member && Number.isInteger(n) ? member.balance + n : null;

  return (
    <form
      className="grid gap-4 rounded-card border border-line bg-surface p-5 md:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!userId) return setError("กรุณาเลือกสมาชิก");
        if (!Number.isInteger(n) || n === 0) return setError("จำนวนต้องเป็นจำนวนเต็มที่ไม่ใช่ 0");
        if (after !== null && after < 0) return setError("คะแนนหลังปรับต้องไม่ติดลบ");
        if (!note.trim()) return setError("กรุณาระบุเหตุผล");
        start(async () => {
          const res = await adjustPointsAction(userId, n, note);
          if (!res.ok) return setError(res.message);
          toast.success(res.message);
          setAmount("");
          setNote("");
          router.refresh();
        });
      }}
    >
      <Field id="pa-user" label="สมาชิก" required>
        <Select id="pa-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">— เลือก —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} ({m.balance})
            </option>
          ))}
        </Select>
      </Field>
      <Field
        id="pa-amount"
        label="จำนวน (+/−)"
        required
        hint={after !== null ? `คงเหลือหลังปรับ = ${after}` : undefined}
      >
        <Input
          id="pa-amount"
          type="number"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field id="pa-note" label="เหตุผล" required className="md:col-span-2">
        <Input id="pa-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-danger md:col-span-4">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending} className="md:col-span-1">
        บันทึกการปรับคะแนน
      </Button>
    </form>
  );
}
