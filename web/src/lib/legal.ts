/**
 * Terms, privacy and help text. Plain language.
 *
 * DRAFT for the UBC 2026 hackathon demo. Not reviewed by a lawyer. Before any real launch, have counsel review
 * every section (money transmission, securities rules for tokenized stocks, sanctions, consumer protection, privacy laws).
 */

import { APP_NAME } from "./data";

export const LEGAL_UPDATED = "November 14, 2026";
export const TERMS_VERSION = "0.1-draft";

export interface LegalSection {
  id: string;
  title: string;
  body: string[];
}

export const TERMS: LegalSection[] = [
  {
    id: "about",
    title: "1. What this app is",
    body: [
      `${APP_NAME} is an app for paying people by username. You can send stablecoins, crypto and tokenized assets (like tokenized stocks or gold) from your own wallet to someone else's wallet. The person you pay gets exactly the asset you sent.`,
      `${APP_NAME} is software. It is not a bank, a broker, an exchange or a money transmitter, and your balances are not bank deposits. They are not insured by the FDIC or any government scheme.`,
    ],
  },
  {
    id: "wallet",
    title: "2. Your wallet, your responsibility",
    body: [
      "Your money lives in a wallet that only you control. We never hold your funds and we cannot move them, freeze them, reverse them or get them back for you.",
      "Your wallet is protected by Face ID or Touch ID (a passkey), or by the wallet app you connected. Your recovery phrase is the only backup. Anyone who has it can take everything in the wallet. We will never ask for it, and we cannot reset it.",
      "If you lose your phone and have not backed up your recovery phrase, your funds may be lost for good.",
    ],
  },
  {
    id: "eligibility",
    title: "3. Who can use it",
    body: [
      "You must be at least 18 years old and allowed to use crypto where you live.",
      "You can't use the app if you are in, or ordinarily live in, a country or region under comprehensive sanctions, or if you are on a sanctions list.",
      "Some assets are not available everywhere. For example, tokenized stocks may not be offered to people in the United States. We may hide assets based on where you are.",
    ],
  },
  {
    id: "identity",
    title: "4. Identity checks",
    body: [
      "Sending and receiving with your own wallet does not require an ID check.",
      "Buying with a card, bank, Apple Pay, Venmo, PayPal or Cash App goes through a licensed payment partner. That partner may ask for your ID and other details, and its own terms apply to that purchase.",
      "Your name, photo and country in the app are chosen by you and are not verified. Always check the photo, flag and @username before you pay someone.",
    ],
  },
  {
    id: "fees",
    title: "5. Fees",
    body: [
      "Network fee: every payment is a blockchain transaction with a small network fee, usually under one cent on Arc. We show an estimate before you pay.",
      "Buying with outside money: the payment partner charges its own fee, shown before you confirm.",
      "Swapping one asset for another (for example selling a stock token for dollars) may include a market spread and a small swap fee, shown before you confirm.",
      `${APP_NAME} app fee: none during the demo. If that changes, we will show it before you pay and update these terms first.`,
    ],
  },
  {
    id: "blockchain",
    title: "6. How the blockchain works, and its risks",
    body: [
      "Payments settle on a public blockchain, usually within seconds. Once a payment is confirmed it cannot be undone. If you pay the wrong person, only they can send it back.",
      "Blockchains are public. Your wallet address, its balances and its transactions can be seen by anyone who knows the address, even if a payment is set to Private in the app.",
      "Smart contracts, networks and bridges can have bugs, outages or attacks. Wallet apps and payment partners can fail. You could lose money because of any of these.",
    ],
  },
  {
    id: "assets",
    title: "7. Assets and prices",
    body: [
      "Crypto and tokenized assets can lose value quickly, including all of their value. Stablecoins aim to stay at $1 (or €1) but can lose their peg, and depend on the company or protocol behind them.",
      "A tokenized stock is a token issued by a third party that tracks a share. It usually does not give you shareholder rights such as voting, and it depends on its issuer keeping the backing.",
      "In the demo, stock, gold and treasury tokens are test tokens that follow real prices. They are not shares, gold or treasuries, and have no cash value.",
      "Prices in the app come from third-party data and may be delayed or wrong.",
    ],
  },
  {
    id: "advice",
    title: "8. Not advice",
    body: [
      "Nothing in the app is financial, investment, tax or legal advice. Seeing what friends hold is not a recommendation to buy it. You are responsible for your own decisions and for any taxes on your payments and trades.",
    ],
  },
  {
    id: "social",
    title: "9. Profiles, feeds and privacy settings",
    body: [
      "Public payments show your name, the other person's name and the note in feeds. The amount is only shown to the two of you. You choose Public or Private on each payment.",
      "Your portfolio settings control what the app shows on your profile. They do not hide anything on the blockchain itself.",
      "Don't post notes or photos that are illegal, hateful, harassing, or that impersonate someone else. We can hide content and accounts that break these rules.",
    ],
  },
  {
    id: "prohibited",
    title: "10. Things you can't do",
    body: [
      "Use the app for fraud, scams, money laundering, terrorist financing, sanctions evasion, or buying or selling anything illegal.",
      "Pretend to be someone else, take a username to mislead people, or try to break, overload or reverse-engineer the service.",
    ],
  },
  {
    id: "liability",
    title: "11. Liability",
    body: [
      'The app is provided "as is" and "as available", without warranties of any kind, to the fullest extent the law allows.',
      "We are not liable for losses caused by blockchains, smart contracts, wallets, payment partners, price moves, your lost recovery phrase or device, payments sent to the wrong person, or anything else outside our control.",
      "Where the law allows, our total liability to you for any claim is limited to the fees you paid us in the 12 months before the claim (during the demo, that is $0).",
    ],
  },
  {
    id: "changes",
    title: "12. Changes and ending",
    body: [
      "We may change the app or these terms. If a change matters, we will tell you in the app before it applies. You can stop using the app at any time; your wallet and funds stay yours.",
      "We may suspend access to the app (not to your wallet) if you break these terms or the law requires it.",
    ],
  },
  {
    id: "contact",
    title: "13. Contact",
    body: [`Questions about these terms: hello@${APP_NAME.toLowerCase()}.app (placeholder address for the demo).`],
  },
];

export const PRIVACY: LegalSection[] = [
  {
    id: "collect",
    title: "What we collect",
    body: [
      "What you give us: your name or nickname, @username, photo, country, and the notes and comments you write.",
      "From your wallet: your public wallet address and the payments made with the app.",
      "From your device: basic technical data needed to run the app, such as app version and errors. No ID documents: we don't ask for them.",
    ],
  },
  {
    id: "use",
    title: "How we use it",
    body: [
      "To find people by username, show feeds and profiles the way your settings allow, send you notifications, keep the app secure, and fix bugs.",
      "We don't sell your personal data.",
    ],
  },
  {
    id: "public",
    title: "What is public no matter what",
    body: [
      "Anything recorded on a blockchain, including your wallet address, balances and transfers, is public and permanent. We can't delete it.",
    ],
  },
  {
    id: "share",
    title: "Who we share with",
    body: [
      "Payment partners when you choose to buy through them (they collect their own data under their own policy), service providers that host the app, and authorities when the law requires it.",
    ],
  },
  {
    id: "choices",
    title: "Your choices",
    body: [
      "Change your profile, photo and portfolio visibility in Settings at any time. Set any payment to Private. Ask us to delete your app account; on-chain records can't be deleted.",
    ],
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: { group: string; items: FaqItem[] }[] = [
  {
    group: "Getting started",
    items: [
      { q: "Do I need an ID to use it?", a: "No. Creating an account and sending or receiving needs no ID. Only buying with a card, bank or Venmo goes through a partner that may ask for ID." },
      { q: "Who holds my money?", a: "You do. It sits in your own wallet, protected by Face ID or your wallet app. We can't touch it." },
      { q: "Does the person I pay need the app?", a: "To find them by username, yes. Anyone can also receive to their wallet address from a QR code." },
    ],
  },
  {
    group: "Paying",
    items: [
      { q: "What does my friend get?", a: "Exactly what you sent. Pay $10 in NVIDIA and they get $10 of NVIDIA. They can keep it or sell it for dollars any time." },
      { q: "How fast is it?", a: "Usually a few seconds, any day and any hour. There are no banking hours on a blockchain." },
      { q: "I paid the wrong person. Can I undo it?", a: "No. Blockchain payments are final. Ask the person to send it back. That's why the app shows a photo and flag and warns you on a first payment." },
      { q: "Can I pay someone in another country?", a: "Yes. It works the same anywhere. Check the flag next to their name to make sure it's the right person." },
    ],
  },
  {
    group: "Fees",
    items: [
      { q: "What does a payment cost?", a: "A network fee, usually under one cent. We show an estimate before you pay. The app itself charges nothing during the demo." },
      { q: "What does buying cost?", a: "The payment partner's fee, shown before you confirm. Paying from a wallet you already own skips it." },
    ],
  },
  {
    group: "Assets",
    items: [
      { q: "Are the stocks real shares?", a: "In the demo they are test tokens that follow real prices. Real tokenized stocks are issued by third parties, usually without voting rights, and aren't available in every country." },
      { q: "What are stablecoins?", a: "Digital dollars or euros, like USDC or PayPal USD, that aim to always be worth $1 or €1. Good for paying people who just want cash." },
      { q: "Can I lose money?", a: "Yes. Stocks, crypto and gold go up and down. Stablecoins are steadier but can still lose their peg. Only send and hold what you're comfortable with." },
    ],
  },
  {
    group: "Security and privacy",
    items: [
      { q: "What if I lose my phone?", a: "On iPhone, your Face ID passkey comes back through iCloud Keychain. Your recovery phrase (Settings → Back up your wallet) restores it on any phone." },
      { q: "Is my portfolio public?", a: "Only the parts you turn on in Settings. Remember the wallet itself is on a public blockchain." },
      { q: "Will you ever ask for my recovery phrase?", a: "Never. Anyone who asks for it is trying to steal from you." },
    ],
  },
];
