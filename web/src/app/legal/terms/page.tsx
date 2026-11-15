import { LegalDoc } from "@/components/legal-doc";
import { TERMS } from "@/lib/legal";

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      summary={[
        "Your money stays in your own wallet. We can't move, freeze or recover it.",
        "Payments are final and settle on a public blockchain in seconds.",
        "A network fee (usually under 1¢) applies. Buying through a partner has its fee. No app fee in the demo.",
        "No ID to send or receive. Card and bank purchases go through partners that may ask for ID.",
        "Prices go up and down. Nothing here is investment advice.",
        "Lose your phone and recovery phrase, and the funds may be gone. Back it up.",
      ]}
      sections={TERMS}
    />
  );
}
