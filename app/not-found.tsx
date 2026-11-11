import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { NotFoundView } from "@/components/shared/not-found-view";

/** 404 for URLs outside the storefront layout (only the root layout wraps this, so it adds Header/Footer). */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        <NotFoundView />
      </main>
      <Footer />
    </>
  );
}
