# Osmo — the app

A phone app for paying friends by @username, in dollars, where each person receives the asset they chose.

**Status: a preview.** Every screen works, on made-up people and payments held in memory. Nothing here talks to a wallet or a chain yet, and reloading returns to the sample account.

## It is an app, not a website
- On a phone it fills the screen. Added to the Home Screen it opens from its own icon, full screen, with no browser bar (`src/app/manifest.ts`, icons in `public/icons/`).
- On a computer it never stretches into a web page. It shows inside a phone-sized frame, next to a code that sends you to your phone (`src/components/app-frame.tsx`).
- It is not in the App Store or Play Store. It is installed from a link or a QR code.

## Run it
```bash
npm install
npm run dev
```
Open http://localhost:3000. To try it on your phone, open the "Network" address that `npm run dev` prints while both devices are on the same Wi-Fi.

## Screens
| Path | Screen |
|---|---|
| `/` | Home: search, top people, feed with a Friends / Everyone switch |
| `/pay` | Pay or request: person, amount, note, who can see it, what to pay with |
| `/friends` | Friend requests, suggestions, your friends |
| `/portfolio`, `/portfolio/[symbol]` | Holdings, "Get paid in", one asset with Buy and Sell |
| `/me`, `/me/code`, `/me/settings` | Profile, your QR code, settings |
| `/welcome` | Sign-up: sign-in choice, name, username, photo, what to get paid in, who can see payments |
| `/u/[handle]` | Someone's profile: what they get paid in, add friend, pay |
| `/p/[ref]` | One payment: details for the two people, reactions, comments |
| `/requests`, `/notifications` | Requests waiting, and notifications |

## Where things are
- `src/lib/data.ts`: the sample people, payments and prices.
- `src/lib/store.tsx`: the in-memory state every screen reads. The real build replaces this with the server and the chain.
- `src/components/`: the tab bar, feed card, sheets and buttons.
- `../spec/UI-SPEC.md`: the screen-by-screen design this follows.

## Note for coding agents
Read `AGENTS.md` first. This Next.js version differs from older ones.
