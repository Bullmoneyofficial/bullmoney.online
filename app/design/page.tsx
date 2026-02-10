import type { Metadata } from "next";
import DesignStudioPage from "@/components/studio/DesignStudioPage";
import "./design.css";

export const metadata: Metadata = {
  title: "Design Studio | BullMoney",
  description: "Professional design studio for creating stunning graphics, illustrations, and digital art with ease.",
};

export default function DesignPage() {
  return (
    <main className="design-root min-h-screen">
      <div className="design-ambient" aria-hidden="true" />
      <DesignStudioPage />
    </main>
  );
}
