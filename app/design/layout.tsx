import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/shop/StoreFooter";
import { DesignScrollGuard } from "./DesignScrollGuard";

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesignScrollGuard />
      <StoreHeader />
      <div style={{ paddingTop: 48 }}>{children}</div>
      <StoreFooter />
    </>
  );
}

