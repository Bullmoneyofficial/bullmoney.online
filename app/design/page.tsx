import { Suspense } from "react";
import DesignShowcaseCards from "./DesignShowcaseCards";
import DesignPageClientLoader from "./DesignPageClientLoader";
import "./design.css";

export default function DesignPage() {
  return (
    <main className="design-page-root">
      {/* Showcase cards are lightweight — render immediately on server */}
      <DesignShowcaseCards />

      {/* Heavy interactive sections load client-side with loading fallbacks */}
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="inline-block w-8 h-8 border-[3px] border-black/10 border-t-black/60 rounded-full animate-spin" />
          </div>
        }
      >
        <DesignPageClientLoader />
      </Suspense>
    </main>
  );
}
