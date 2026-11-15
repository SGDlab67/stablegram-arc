"use client";

/**
 * Face ID / Touch ID sign-in with passkeys (WebAuthn).
 *
 * What runs today (demo):
 *  - On a secure page (https or localhost) with a built-in authenticator, this really asks the phone for
 *    Face ID / Touch ID and creates or uses a passkey for this site. That proves the person is the owner of
 *    the phone, and on iPhone the passkey syncs through iCloud Keychain to a new phone.
 *  - Anywhere else (e.g. opened over the local network on http), it plays the Face ID animation only.
 *  - The passkey does NOT hold the wallet key yet. In the demo the wallet is still the demo address.
 *
 * TODO (wallet integration):
 *  - Make the passkey the wallet's signer, e.g. Circle Modular Wallets (passkey-owned smart accounts) or
 *    another passkey smart-account, so Face ID approves payments directly. Check Arc testnet support first.
 *  - On "Sign in with Face ID", look up the account by the passkey's credential id and load that wallet.
 */

export interface PasskeyResult {
  /** The credential id, or a demo id when no real authenticator answered. */
  id: string;
  real: boolean;
}

const RP_NAME = "Osmo";

function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const b = new Uint8Array(new ArrayBuffer(n));
  crypto.getRandomValues(b);
  return b;
}

function toB64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** True when this browser can show a real Face ID / Touch ID prompt for this page. */
export async function passkeysAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !window.isSecureContext || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Creates a passkey for this username. Falls back to a demo result when real passkeys aren't available. */
export async function createPasskey(username: string): Promise<PasskeyResult> {
  if (await passkeysAvailable()) {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: RP_NAME, id: window.location.hostname },
        user: { id: randomBytes(16), name: username || "new-user", displayName: username || "New user" },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256, what Face ID / Touch ID use
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: { authenticatorAttachment: "platform", residentKey: "required", userVerification: "required" },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null;
    if (cred) return { id: toB64Url(cred.rawId), real: true };
  }
  await pause(1400);
  return { id: `demo-${toB64Url(randomBytes(9).buffer)}`, real: false };
}

/** Signs in with an existing passkey for this site. Falls back to a demo result. */
export async function signInWithPasskey(): Promise<PasskeyResult> {
  if (await passkeysAvailable()) {
    const cred = (await navigator.credentials.get({
      publicKey: { challenge: randomBytes(32), rpId: window.location.hostname, userVerification: "required", timeout: 60_000 },
    })) as PublicKeyCredential | null;
    if (cred) return { id: toB64Url(cred.rawId), real: true };
  }
  await pause(1300);
  return { id: "demo-signin", real: false };
}
