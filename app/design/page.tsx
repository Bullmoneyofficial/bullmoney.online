import type { Metadata } from "next";
import DesignStudioPage from "@/components/studio/DesignStudioPage";
import "./design.css";

export const metadata: Metadata = {
  title: "Design Studio",
  description: "Create, edit, and export designs with BullMoney Studio.",
};

export default function DesignPage() {
  return (
    <main className="design-root min-h-screen">
      <div className="design-ambient" aria-hidden="true" />
      <DesignStudioPage />
    </main>
  );
}
