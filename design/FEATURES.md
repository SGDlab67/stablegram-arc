# Osmo — what the app looks like and what it does

**It is a phone app, not a website.** Added to the Home Screen it opens from its own icon, full screen, with no browser bar. On a computer it shows inside a phone-sized frame, next to a code that sends you to your phone. It installs from a link or QR code, not from the App Store.

The app is in `../web/`. Run it with `cd web && npm install && npm run dev`. Every screen works on made-up people and payments; nothing talks to a wallet or a chain yet, and reloading returns to the sample account.

`osmo-prototype.html` in this folder was a first single-file mock. `web/` has replaced it.

The layout and flows follow Venmo's current app (its May 2026 redesign). The name, colours, logo and artwork are ours. The full screen-by-screen description is in `../spec/UI-SPEC.md`.

## Every screen in `web/`

| Screen | What it does |
|---|---|
| Welcome and sign-up | Sign-in choice, name, @username with a live availability check, photo or colour, a first stock, who can see payments. Creates a fresh account with a starter balance. |
| Home | Search, top people, portfolio and requests shortcuts, a Friends / Everyone switch, the feed. |
| Pay/Request | Person, dollar amount, note, audience, then a sheet to pick what to pay with that shows what the other person receives. Split among several people. |
| Friends | Requests to accept, suggestions, your friends. |
| Someone's profile | Photo, @username, friends in common, add friend, pay, payments between you. |
| Payment page | The payment, its details for the two people involved, reactions, comments, quick thank-you replies. |
| Portfolio and asset page | Total, chart, holdings mix, holdings by group, Buy and Sell, "Send some to a friend", how much came from friends. |
| Me, My code, Settings | Profile, QR code, requests, activity, default audience, name. |
| Requests, Notifications | What is waiting for you and what happened. |

## The five tabs

| Tab | What is on it |
|---|---|
| **Home** | Search ("Find a person") with a QR button. Your top people as a row of faces. Two shortcuts: your portfolio total, and requests waiting. A Friends / Everyone switch. Then the feed. |
| **Friends** | Friend requests to accept, suggested people, and your friends list with a Pay button on each. |
| **Pay/Request** (the big button) | Pick a person, type a dollar amount, add a note, choose who can see it, then Request or Pay. |
| **Portfolio** | Total value, a chart, the mix of what you hold, then what you hold in three groups: stocks and real-world assets, crypto, cash. Under that, everything else you could hold. |
| **Me** | Your photo, name and @username, your QR code, friend count and portfolio value, requests waiting for you, and your own activity with amounts. |

## Features

**Paying**
- Pay or request by @username. No addresses anywhere.
- Amounts are in dollars. You choose which holding to pay with.
- **You send a slice of your portfolio.** Pick which holding to pay with: dollars, NVIDIA, bitcoin. Your friend receives exactly that, in their own wallet. No conversion.
- **They keep it or sell it.** A received payment has "Sell for dollars"; so does every asset page.
- Requests: ask one person or split among several. Pay, decline, remind, cancel.
- Pay again and Say thanks, one tap from the feed.
- QR codes: yours opens your profile; one with an amount opens a filled-in payment.

**Social**
- A feed of payments: who paid whom and what for. Amounts are hidden from everyone but the two people.
- A big emoji picture on a payment when its note has an emoji.
- Reactions with counts, and comments.
- Friends are mutual: one asks, the other accepts.
- Three audiences on every payment: Public, Friends, Private. New accounts start on Public for now.
- A chip on each payment showing which asset was sent, for example NVIDIA. This is ours, not Venmo's.

**Account**
- Sign up with a wallet you already have (MetaMask, Phantom, Rabby, Coinbase Wallet) or start without one.
- A simple username: 3 to 20 lower-case letters, numbers or underscores.
- A profile photo, or your initials on a colour.
- Sign-up asks you to pick a first stock, so your portfolio starts with something to send.

## What we took from Venmo and what we changed

| Venmo | Osmo |
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
Sample: people, payments, charts, prices (a snapshot from Nov 13 2026), and the fee, which is an estimate. Missing: any wallet connection, the camera scanner, saving anything between visits, and sharing a photo with other people (a photo you add stays on your phone).
