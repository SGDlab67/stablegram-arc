# stablegram — what the app looks like and what it does

There are two ways to look at the layout. Both use made-up people and payments, and neither touches a chain.

| | What it is | How to open it |
|---|---|---|
| `../web/` | The app preview, built with Next.js. Home, Pay/Request, Friends, Portfolio with an asset page, Me, My code, settings. This is the base the real app grows from. | `cd web && npm install && npm run dev`, then open localhost:3000 on a phone-sized window |
| `stablegram-prototype.html` | One file, no install. Same tabs, plus the sign-up screens, which `web/` does not have yet. | Double-click it |

The two were made separately, so their sample people and prices differ. Where they disagree on layout, `web/` wins.

The layout and flows follow Venmo's current app (its May 2026 redesign). The name, colours, logo and artwork are ours. The full screen-by-screen description is in `../spec/UI-SPEC.md`.

## The five tabs

| Tab | What is on it |
|---|---|
| **Home** | Search ("Find a person") with a QR button. Your top people as a row of faces. Two shortcuts: requests waiting, and "Get paid in". A Friends / Everyone switch. Then the feed. |
| **Friends** | Friend requests to accept, suggested people, and your friends list with a Pay button on each. |
| **Pay/Request** (the big button) | Pick a person, type a dollar amount, add a note, choose who can see it, then Request or Pay. |
| **Portfolio** | Total value, a chart, your "Get paid in" setting, then what you hold in three groups: stocks and real-world assets, crypto, cash. Under that, everything else you could hold. |
| **Me** | Your photo, name and @username, your QR code, friend count and portfolio value, requests waiting for you, and your own activity with amounts. |

## Features

**Paying**
- Pay or request by @username. No addresses anywhere.
- Amounts are in dollars. You choose which holding to pay with.
- "Get paid in": set once, and every payment to you arrives as that asset. The confirm sheet tells the sender what the other person will receive.
- Requests: ask one person or split among several. Pay, decline, remind, cancel.
- Pay again and Say thanks, one tap from the feed.
- QR codes: yours opens your profile; one with an amount opens a filled-in payment.

**Social**
- A feed of payments: who paid whom and what for. Amounts are hidden from everyone but the two people.
- A big emoji picture on a payment when its note has an emoji.
- Reactions with counts, and comments.
- Friends are mutual: one asks, the other accepts.
- Three audiences on every payment: Public, Friends, Private. New accounts start on Public for now.
- A chip on each payment showing what was paid and what was received, for example SOL → NVDA. This is ours, not Venmo's.

**Account**
- Sign up with a wallet you already have (MetaMask, Phantom, Rabby, Coinbase Wallet) or start without one.
- A simple username: 3 to 20 lower-case letters, numbers or underscores.
- A profile photo, or your initials on a colour.
- Sign-up asks one product question: what do you want to get paid in?

## What we took from Venmo and what we changed

| Venmo | stablegram |
|---|---|
| Home · Cards · Pay/Request · Crypto · Me | Home · Friends · Pay/Request · Portfolio · Me |
| Cards tab | Left out for now |
| Crypto tab | Portfolio: stocks, crypto and cash together |
| Big one-sentence feed cards with small faces, a picture, a black action button, reactions | Same structure, with an emoji tile where Venmo uses illustrations |
| Avatar, large amount, note, Request and Pay side by side, number pad | Same |
| Friends-only by default since May 2026 | Public by default for now |
| A cash balance | No cash balance. You hold assets. |
| Blue, the "V" mark | Purple, our own wordmark |

## Build order for the app
Saturday: the app shell, the feed, sign-up without a wallet, and one real payment.
Monday: friends, photos, reactions and comments on real data, connecting MetaMask or Phantom, the portfolio chart and asset pages, the camera scanner.
Detail and checks: `../spec/UI-SPEC.md` section 16.

## What is sample and what is missing
Sample in both: people, payments, charts, and the fee shown on the confirm sheet, which is an estimate. Missing from both: the camera scanner and any wallet connection. Sign-up exists only in the single-file prototype.
