import { Suspense } from "react";
import { PayFlow } from "./pay-flow";

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-app bg-white" />}>
      <PayFlow />
    </Suspense>
  );
}
