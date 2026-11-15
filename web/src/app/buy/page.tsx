import { Suspense } from "react";
import { BuyFlow } from "./buy-flow";

export default function BuyPage() {
  return (
    <Suspense fallback={<div className="min-h-app bg-white" />}>
      <BuyFlow />
    </Suspense>
  );
}
