"use client";

import { RequestCards } from "@/components/requests";
import { BackHeader, Screen } from "@/components/shell";
import { PrimaryButton } from "@/components/ui";

export default function RequestsPage() {
  return (
    <Screen tabs={false}>
      <BackHeader title="Requests" fallback="/me" />
      <div className="px-4 pt-2">
        <RequestCards empty />
        <PrimaryButton href="/pay" className="mt-6">
          Request money
        </PrimaryButton>
      </div>
    </Screen>
  );
}
