import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/admin/guard";
import {
  deleteMessageAction,
  setMessageNoteAction,
  setMessageStatusAction,
} from "@/lib/actions/admin-content";
import { formatThaiDateTime } from "@/lib/utils/format";
import { ActionButton } from "@/components/admin/action-button";
import { MarkRead } from "@/components/admin/mark-read";
import { AdminShell } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/misc";
import { MESSAGE_STATUS } from "@/lib/admin/labels";

export const metadata: Metadata = { title: "Message" };

export default function MessagePage({ params }: PageProps<"/admin/messages/[id]">) {
  return (
    <AdminShell>
      <Link
        href="/admin/messages"
        className="inline-flex items-center gap-1 text-sm text-brand-accent hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Contact Messages
      </Link>
      <Suspense fallback={<Skeleton className="h-80" />}>
        <Detail params={params} />
      </Suspense>
    </AdminShell>
  );
}

async function Detail({ params }: { params: PageProps<"/admin/messages/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const supabase = await createClient();
  const { data: m } = await supabase.from("contact_messages").select("*").eq("id", id).maybeSingle();
  if (!m) notFound();
  const s = MESSAGE_STATUS[m.status as keyof typeof MESSAGE_STATUS];
  const mailto = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`;

  return (
    <article className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 md:p-6">
      <MarkRead id={m.id} isNew={m.status === "new"} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{m.subject}</h1>
          <p className="text-sm text-ink-soft">
            {m.name} &lt;{m.email}&gt; · {m.user_id ? "สมาชิก" : "Guest"} · {formatThaiDateTime(m.created_at)}
          </p>
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      <p className="rounded-btn border border-line bg-canvas p-4 leading-relaxed whitespace-pre-wrap">
        {m.message}
      </p>
      {m.admin_note && <p className="text-sm text-ink-soft">หมายเหตุผู้ดูแล: {m.admin_note}</p>}
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <a href={mailto} className={buttonClasses({ variant: "secondary", size: "sm" })}>
          <Mail className="size-4" aria-hidden /> ตอบกลับทางอีเมล
        </a>
        {m.status !== "replied" && (
          <ActionButton
            label="ทำเครื่องหมายว่าตอบแล้ว"
            run={async () => {
              "use server";
              return setMessageStatusAction(id, "replied");
            }}
          />
        )}
        {m.status !== "archived" && (
          <ActionButton
            label="เก็บถาวร"
            run={async () => {
              "use server";
              return setMessageStatusAction(id, "archived");
            }}
          />
        )}
        <ActionButton
          label="หมายเหตุ"
          variant="ghost"
          input={{ label: "Admin Note", required: true }}
          confirm={{ title: "บันทึกหมายเหตุ" }}
          run={async (note) => {
            "use server";
            return setMessageNoteAction(id, note);
          }}
        />
        <ActionButton
          label="ลบ"
          danger
          redirectTo="/admin/messages"
          confirm={{
            title: "ลบข้อความนี้?",
            description: "ลบแล้วกู้คืนไม่ได้ — แนะนำให้ “เก็บถาวร” แทน",
            confirmLabel: "ลบ",
          }}
          run={async () => {
            "use server";
            return deleteMessageAction(id);
          }}
        />
      </div>
    </article>
  );
}
