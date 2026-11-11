import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/** Storefront + member area: shared Header/Footer on every page (SPEC §8). */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-btn focus:bg-brand-lime focus:px-4 focus:py-2 focus:text-canvas"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}
