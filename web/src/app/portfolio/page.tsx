import { Suspense } from "react";
import { Portfolio } from "./portfolio";

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Portfolio />
    </Suspense>
  );
}
