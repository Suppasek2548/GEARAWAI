import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ForbiddenView } from "@/components/auth/forbidden-view";

export const metadata: Metadata = { title: "ไม่มีสิทธิ์เข้าถึง", robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        <ForbiddenView />
      </main>
      <Footer />
    </>
  );
}
