import { NotFoundView } from "@/components/shared/not-found-view";

/** 404 inside the storefront (e.g. notFound() on /shop/[slug]) — the (store) layout already provides Header/Footer. */
export default function StoreNotFound() {
  return <NotFoundView />;
}
