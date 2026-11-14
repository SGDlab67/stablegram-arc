import { Suspense } from "react";
import { AssetScreen } from "./asset-screen";

export default function AssetPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <AssetScreen />
    </Suspense>
  );
}
