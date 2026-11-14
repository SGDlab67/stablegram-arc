import { Suspense } from "react";
import { PayFlow } from "./pay-flow";

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-white" />}>
      <PayFlow />
    </Suspense>
  );
}
