"use client";

/**
 * Wallet sign-in. Three ways in, no ID checks:
 *  1. "Create one for me": a new wallet made on this phone.
 *  2. Phantom or MetaMask: connect the wallet the person already has.
 *  3. Any other wallet (WalletConnect).
 *
 * What runs today (demo):
 *  - If the browser already has Phantom or MetaMask (desktop extension, or the app's own in-app browser),
 *    we really ask it for the account with `eth_requestAccounts`.
 *  - On a phone without the extension, we open the wallet app with its official deep link, which loads
 *    this page inside the wallet's browser so the connect works there.
 *  - Otherwise, and for "create" and "other", we make a demo address so the flow can be shown end to end.
 *
 * TODO (contracts + chain integration):
 *  - After connecting, switch to Arc testnet (chain 5042002) with `wallet_addEthereumChain` / `wallet_switchEthereumChain`.
 *  - Ask the wallet to sign one message (Sign-In with Ethereum) and register the username → address on-chain.
 *  - "Create one for me": replace `demoAddress()` with an embedded wallet (e.g. Circle user-controlled wallets,
 *    Privy or a passkey wallet) so the key is kept safely and can be backed up.
 *  - "Other wallet": wire WalletConnect / Reown AppKit.
 */

export type WalletKind = "created" | "phantom" | "metamask" | "other";

export interface ConnectedWallet {
  kind: WalletKind;
  address: string;
  /** True when no real wallet answered and a demo address was made instead. */
  demo: boolean;
}

export const WALLET_INFO: Record<WalletKind, { name: string; hint: string; download?: string }> = {
  created: { name: "Create a wallet", hint: "Ready in a second. Lives on this phone. Back it up whenever you like." },
  phantom: { name: "Phantom", hint: "Connect your Phantom wallet.", download: "https://phantom.app/download" },
  metamask: { name: "MetaMask", hint: "Connect your MetaMask wallet.", download: "https://metamask.io/download/" },
  other: { name: "Another wallet", hint: "Rabby, Coinbase Wallet, Rainbow and others." },
};

type Eip1193 = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; isMetaMask?: boolean; isPhantom?: boolean };

function providers(): { phantom?: Eip1193; metamask?: Eip1193 } {
  if (typeof window === "undefined") return {};
  const w = window as unknown as { phantom?: { ethereum?: Eip1193 }; ethereum?: Eip1193 & { providers?: Eip1193[] } };
  const list = w.ethereum?.providers ?? (w.ethereum ? [w.ethereum] : []);
  return {
    phantom: w.phantom?.ethereum ?? list.find((p) => p.isPhantom),
    metamask: list.find((p) => p.isMetaMask && !p.isPhantom),
  };
}

const isPhone = () => typeof navigator !== "undefined" && /iphone|ipad|android/i.test(navigator.userAgent);

/** Opens this page inside the wallet app's own browser, where the wallet can connect. */
function deepLink(kind: "phantom" | "metamask"): string {
  const url = window.location.href;
  return kind === "phantom"
    ? `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(window.location.origin)}`
    : `https://metamask.app.link/dapp/${url.replace(/^https?:\/\//, "")}`;
}

function demoAddress(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Connects the chosen wallet. Returns null when the page is handing off to the wallet app
 * (the person comes back to this page inside the wallet's browser).
 */
export async function connectWallet(kind: WalletKind): Promise<ConnectedWallet | null> {
  if (kind === "phantom" || kind === "metamask") {
    const provider = providers()[kind];
    if (provider) {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (accounts?.[0]) return { kind, address: accounts[0], demo: false };
    } else if (isPhone()) {
      window.location.href = deepLink(kind);
      return null;
    }
  }
  // Demo stand-in so the flow can be shown without a wallet installed.
  await new Promise((r) => setTimeout(r, kind === "created" ? 900 : 700));
  return { kind, address: demoAddress(), demo: true };
}

export function shortAddress(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
