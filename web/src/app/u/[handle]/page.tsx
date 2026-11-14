import { Suspense } from "react";
import { ProfileScreen } from "./profile-screen";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-app" />}>
      <ProfileScreen />
    </Suspense>
  );
}
