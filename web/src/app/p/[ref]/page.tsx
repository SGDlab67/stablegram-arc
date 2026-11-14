import { Suspense } from "react";
import { PaymentScreen } from "./payment-screen";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-app" />}>
      <PaymentScreen />
    </Suspense>
  );
}
