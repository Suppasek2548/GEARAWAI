"use client";

import { useState, useTransition } from "react";
import { Cake, Lock } from "lucide-react";
import { toast } from "sonner";
import { setBirthDateAction } from "@/lib/actions/member";
import { formatThaiDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Birth date (S11-F01 / UI §11.2 Profile): set the first time freely, change once more afterwards,
 * then locked (BIRTH_DATE_LOCKED → contact the store; Admin can fix it).
 */
export function BirthDateForm({
  birthDate,
  changeCount,
  today,
}: {
  birthDate: string | null;
  changeCount: number;
  today: string;
}) {
  const [value, setValue] = useState(birthDate ?? "");
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const locked = birthDate !== null && changeCount >= 1;
  const isFirstSet = birthDate === null;
  const invalid = value !== "" && (value > today || value <= "1900-01-01");

  const save = () =>
    start(async () => {
      const res = await setBirthDateAction(value);
      setConfirm(false);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    });

  return (
    <section
      id="birth-date"
      aria-labelledby="bd-heading"
      className="flex scroll-mt-28 flex-col gap-4 rounded-card border border-line bg-surface p-6"
    >
      <h2 id="bd-heading" className="flex items-center gap-2 font-display text-xl font-semibold">
        <Cake className="size-5 text-brand-lime" aria-hidden /> วันเกิด
      </h2>
      {birthDate && (
        <p className="text-ink-soft">
          วันเกิดปัจจุบัน:{" "}
          <span className="font-semibold text-ink">
            {formatThaiDate(`${birthDate}T00:00:00+07:00`, { dateStyle: "long" })}
          </span>
        </p>
      )}

      {locked ? (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Lock className="size-4" aria-hidden /> แก้ไขวันเกิดครบสิทธิ์แล้ว หากต้องการเปลี่ยน กรุณาติดต่อร้าน
        </p>
      ) : (
        <>
          <Field
            id="birthDateInput"
            label={isFirstSet ? "ตั้งวันเกิด" : "แก้ไขวันเกิด"}
            error={invalid ? "วันเกิดไม่ถูกต้อง" : undefined}
            hint={isFirstSet ? "หลังตั้งครั้งแรกแล้ว จะแก้ไขได้อีก 1 ครั้งเท่านั้น" : "แก้ไขได้อีก 1 ครั้ง — หลังจากนี้จะแก้เองไม่ได้"}
            className="max-w-xs"
          >
            <Input
              id="birthDateInput"
              type="date"
              min="1900-01-02"
              max={today}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              invalid={invalid}
            />
          </Field>
          <Button
            variant="secondary"
            className="self-start"
            disabled={!value || invalid || value === birthDate}
            onClick={() => setConfirm(true)}
          >
            บันทึกวันเกิด
          </Button>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title={isFirstSet ? "ยืนยันการตั้งวันเกิด?" : "ยืนยันการแก้ไขวันเกิด?"}
        description={
          isFirstSet ? "หลังบันทึก คุณจะแก้ไขวันเกิดได้อีกเพียง 1 ครั้ง" : "นี่คือการแก้ไขครั้งสุดท้าย หลังจากนี้จะแก้ไขเองไม่ได้อีก"
        }
        confirmLabel="บันทึก"
        loading={pending}
        onCancel={() => setConfirm(false)}
        onConfirm={save}
      />
    </section>
  );
}
