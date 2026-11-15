import { LegalDoc } from "@/components/legal-doc";
import { PRIVACY } from "@/lib/legal";

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      summary={[
        "We collect only what you put in your profile, your wallet address and your app activity.",
        "No ID documents. We don't sell your data.",
        "The blockchain is public and permanent, whatever your app settings say.",
      ]}
      sections={PRIVACY}
    />
  );
}
