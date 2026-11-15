# UI-SPEC — the app, screen by screen
For Charlie's build session. Written Fri Nov 13 2026 from Venmo's current app: three screens from its May 2026 redesign, two App Store screenshots (all saved in `reference/venmo/`), and Venmo's help centre. Sources are at the end.

SPEC v3.1 covers the chain, the server and the data, and already includes the tables and routes this file needs. This file is the source for everything a user sees.

Nothing here has been built. Venmo's Me tab, settings and Crypto tab are described from its help pages, not from screenshots, so those layouts are our reading of the text.

---

## 1. What we copy, what we change, what we leave out

**Copy the layout and the flows. Do not copy the brand.** No Venmo name, no "V" logo, none of its blue, none of its illustrations. A judge should think "this works like Venmo", not "this is a Venmo knock-off".

| Venmo | Ours |
|---|---|
| Tab bar: Home · Cards · Pay/Request · Crypto · Me | **Home · Friends · Pay/Request · Portfolio · Me** |
| Cards tab | Left out for now. Friends takes its slot. |
| Crypto tab | **Portfolio**: stocks, crypto and cash in one clean list |
| Search pill "Find a person or business" with a QR button beside it | Same, "Find a person" |
| Feed of cards: one big sentence with small inline avatars, a visual, an action row | Same, plus a chip showing which asset was sent |
| Audience line on each card: Public, Visible to friends, Only visible to you | Same three |
| Action row: one black pill ("Pay again", "Say thanks", "Split"), comment, reactions with counts, add a reaction | Same |
| Pay screen: avatar, "+" to add people, large dollar amount, note field, Request and Pay side by side | Same |
| Split a request among several people | Same (requests are free for us) |
| Friends you add, and their activity in your feed | Same |
| Amounts hidden in the feed except to the two people | Same |
| "Venmo me" QR code on your profile picture | Same, "My code" |
| Pending requests at the top of your own activity | Same |
| New users default to friends-only (May 2026) | **Public by default for now**, as Charlie asked. The control is there on every payment and in settings. |
| Phone, email, bank, legal name, identity checks | None. A wallet and a username. |
| Calculator keys on the keypad (÷ × − +) | Left out. Digits, a decimal point and delete. |
| Business profiles, shout-outs, brand offers, rewards, teen accounts, scheduled payments, gifts | Left out |

---

## 2. Look

- **Page:** beige `#F3EEE5`. **Cards:** white, 28 px radius, no border, 12 px gap between cards, 16 px side margin.
- **Type:** Inter. Feed sentences are large, about 26 px, tight line height, weight 500. Names are near-black; the joining words ("paid", "for") are warm grey `#7A7265`. Small labels are 14 px grey.
- **Colours: blue and beige** (Charlie's choice, Nov 14). Ink `#14202E`; deep navy `#1F4F82` for the centre button, the Pay and Request buttons, links and active states, with `#E3ECF6` as its light tint; beige `#EFE9DF` for chips and icon circles; lines `#E8E1D5`; green `#2B8A57` for money in; red `#C8433A` for losses and `#E5484D` only for unread dots. The navy is kept well away from Venmo's bright sky blue so it never reads as Venmo's brand. The primary action inside a feed card is a **black pill with white text**, as on Venmo.
- **Icon buttons** in a card: 56 px beige circles `#EFE9DF` with a dark outline icon.
- **Avatars:** round photos. Demo accounts use pixel-art pictures (`design/pfp/`). Real users pick from the camera roll or take a selfie, then move and zoom it in a circle (DECISIONS 68). Inline in a feed sentence they are 28 px; on a profile 96 px. No photo: initials on one of eight colours picked from the username.
- **Motion:** new feed cards slide in from the top; a sent payment ends on a full-screen tick with the sentence it will show in the feed; reactions pop.
- **Shape of the app: a phone app, never a website.** Built at 390 px wide with safe-area padding. Added to the Home Screen it opens from its own icon, full screen, with no browser bar (a manifest, icons, and the standalone setting). On a computer it does not stretch: it shows inside a phone-sized frame beside a QR code that sends people to their phone. No landing page, no desktop layout, no hover-only controls. On a phone in a browser tab, Home shows one dismissible card explaining how to add it to the Home Screen. It is installed from a link or a QR code, not from the App Store or Play Store; a store build would be a wrapper around this same app and is not planned for this week.
- **Logo: "The Slice"** (Charlie's pick, Nov 14): a pie with one slice pulled out, for paying a friend a slice of what you hold. Beige on navy for the app icon, navy on beige elsewhere, white inside the centre Pay/Request button. Because of it, the Portfolio tab uses a line-chart icon, not a pie. Options considered: `design/logo-options.html`.
- No lightning bolt anywhere.

---

## 3. Tab bar

White bar, hairline top border, five slots, labels under icons.
1. **Home** (house)
2. **Friends** (two people); a red dot when a friend request is waiting
3. **Pay/Request**: a 64 px purple circle with our mark in white, raised so it overlaps the top edge of the bar, label underneath
4. **Portfolio** (pie or chart icon)
5. **Me**: the user's own avatar; a red dot when a money request is waiting

The active label is black; inactive icons and labels are purple, as Venmo's are blue.

---

## 4. Welcome and sign-up

One idea per screen, a large heading, one purple button at the bottom.

1. **Welcome.** The wordmark, one line ("Pay friends in what you hold."), then **Get started** and a text link, "I already have an account".
2. **How do you want to sign in?** Two big rows: **Start without a wallet** ("We'll make one on this device. You can back it up later.") and **Use my wallet** (lists what the browser found: MetaMask, Rabby, Coinbase Wallet, Phantom; a grey line says "Phantom: turn on Testnet Mode first"). On Saturday only the first row works; the second arrives Monday and email with M8.
3. **Your name.** First name and last name. The feed shows "Wes K.", as Venmo does.
4. **Pick a username.** An "@" prefix, lower case as you type, a suggestion from the name, and a live tick or "taken". Rules shown underneath: 3 to 20 letters, numbers or underscores.
5. **Add a photo.** Camera or library, cropped to a circle, **Skip** allowed. The app shrinks it to 256 px before upload.
6. **Pick your first stock.** Five large tiles with logo, name and price: four stocks and "Just dollars". "Your portfolio is what you pay friends with, so it starts with a little of something." The choice becomes the starter grant.
7. **Who can see your payments?** Three rows with the same icons the feed uses: Public (selected), Friends, Private. Two grey lines: "You can change this on any payment." and "Your username is linked to a public wallet. Anyone can see its balances and payments on the blockchain."
8. **Setting up.** A progress screen while the relayer signs the user up. On Arc with a connected wallet, one more step: **Turn on payments** (the one approval).
9. **Find friends.** Suggested people (recent sign-ups, and anyone who has paid you), each with **Add**. **Done** goes to Home.

**Quick join for a room** is a separate one-screen page, `/join`, described in SPEC section 7.

Returning users: **I already have an account** → connect, or use the wallet on this device → sign one message → Home.

---

## 5. Home

Top to bottom:
1. **Top bar.** A search pill, "Find a person", and a round QR button on its right. Both stay pinned while the feed scrolls under them.
2. **People row.** The six people you pay most, as avatars with first names; tap one to open Pay/Request with them filled in. A new user sees suggested friends here.
3. **Shortcut pills,** two across, in the place Venmo puts brand offers: "Portfolio $367" (masked when amounts are hidden), and "2 requests waiting" when true, otherwise "Add friends".
4. **Feed switch:** **Friends** and **Everyone**. Friends is the default once the user has a friend; before that, Everyone.
5. **The feed** of cards (section 6). Pull to refresh. It loads 20 at a time.

Empty Friends feed: "Add a few friends to see what they're paying for," with a button to the Friends tab.

---

## 6. The feed card

Compact, not Venmo-sized (Charlie, Nov 14): about 155 px tall, 16 px padding, no picture. The structure still follows `reference/venmo/01`, `02` and `05`.

1. **Header line,** small and grey: an audience icon and label ("Public", "Visible to friends", "Only visible to you"), a dot, the age ("2h"). A "…" menu on the right: Copy link, View on explorer, and for the payer, Change who can see this.
2. **The sentence,** 17 px with 22 px avatars: [avatar] **Sabina O.** paid [avatar] **Wes K.** for **🍕 pizza and burgers**, with the note's emoji kept small and inline. The viewer is written "You" or "you". If the viewer is one of the two people, the amount follows the second name: "You paid Wes K. **$20** for Coffee". Nobody else ever sees an amount. A request that was paid reads the same as a payment.
3. **Asset chip,** first in the action row, ours and not Venmo's: the logo and name of the asset that was sent ("NVIDIA"). The receiver got that same asset.
4. **No picture tile.** Venmo shows an illustration; we leave it out to keep the feed dense.
5. **Action row,** 36 px tall buttons, left to right after the chip:
   - one **black pill**, chosen by who is looking: **Pay again** on a payment you sent; **Say thanks** on one you received (it adds a 🙏 reaction and opens the comment box); **Split** on one you sent that is over $10. Nothing for strangers' payments.
   - a comment button, with a count when there are comments
   - one pill per reaction already given, emoji and count; yours is filled
   - an add-reaction button that opens a row of six: ❤️ 😂 🔥 🙏 💸 ✨
6. Tapping the card opens the payment page (section 12).

Likes are open to anyone who can see the card. Comments need you to be a friend of one of the two people, or one of them, as on Venmo.

---

## 7. Pay/Request

**Legal and help (Nov 14).** `LegalDoc` component: a draft notice, the short-version card, jump chips, then one card per section. Settings has an About section (Help & FAQ, Fees, Terms of Service, Privacy Policy) and shows "You agreed to Terms version …". See DECISIONS 75.

**Stablecoins and Add money (Nov 14).** See DECISIONS 73. Home has a Portfolio card and a Stablecoins card (small stacked USDC/USDT/PYUSD logos, the balance, and an "Add money" pill). `/deposit` is the Add money screen. Portfolio has a 3-button quick-action row under the chart.

**Sign-in, Face ID and backup (Nov 14).** Screens in DECISIONS 72. `<FaceScan state>` in `feel.tsx` shows a rounded-square Face ID glyph that pulses while scanning and turns into a green check. The backup words sit in a 3-column grid, blurred until tapped. The word check uses 3-option rows: green when right, red with a shake when wrong.

**Splash (Charlie, Nov 14).** The opening screen is navy, the only dark screen in the app. Everything after it is beige. See DECISIONS 71. Sheets force `text-ink` so they stay readable over dark screens.

**Sign-up v2 (Charlie, Nov 14).**
- **Steps:** intro → wallet → profile → done, with a 1/2 · 2/2 counter. Details in DECISIONS 70.
- **Wallet tiles:** the "Create a wallet" tile has a navy ring and a Fastest badge. Phantom, MetaMask and Another wallet are rows in one white card with brand-coloured badges.
- **Profile screen:** a live preview at the top (photo, name and flag, @username, wallet short address), then Name or nickname, Username and Country fields, and "Create my account".
- **Done screen:** confetti, "You're in, @handle 🇮🇳", and a pill showing the wallet with its address.
- **`<Flag code>`** in `ui.tsx` renders the emoji flag, with the country name as its accessible label.

**Polish pass (Nov 14).** App feel lives in `web/src/components/feel.tsx`:
- **Shared pieces:**
  - `haptic()`: vibration on Android, ignored on iPhone.
  - `toast()` / `<Toaster>`: a dark pill at the top, about 2.2 s.
  - `<Confetti>`, `<SuccessCheck>` (a check that draws itself), and `useCountUp`.
- **Motion and pressing:**
  - Screens fade in on route change (opacity only, so the fixed tab bar is never trapped).
  - Everything pressable scales to 0.97.
  - Reduced-motion is respected, and there is a keyboard focus ring.
- **Sheets:** drag the handle or title down to close, Escape closes, the backdrop fades, and there is safe-area padding.
- **Tab bar:** frosted glass, a sliding active bar, a bold active label, a gradient Pay button, and tapping the current tab scrolls to the top.
- **Pay:**
  - Recent people row, then Friends, then More people, so you can pay anyone.
  - The keypad gives haptics, shakes on input it can't take, and shrinks long amounts.
  - The confirm screen shows the asset logo as a badge on the person's photo.
  - Success has confetti, the check and "See the payment".
- **Buy:** spinner while paying, confetti on done.
- **Feed:**
  - Double-tap a card to heart it, with a big heart burst; a single tap still opens it, about 0.24 s later.
  - Reactions give a haptic.
- **Home:** time-of-day greeting ("Good evening, Charlie"); the portfolio number counts up, as on Portfolio.
- **Payment page:** Status "Settled in seconds", Network, and a receipt ID that copies the link. New comments slide in.
- **Asset page:** "People who hold NVIDIA", an avatar stack of people whose privacy allows it, friends first.
- **Notifications:** grouped into New / Today / Earlier, with unread dots on New.
- **Toasts** for: friend request sent, friends accepted, removed, sold, photo updated, link copied.
- **Smaller fixes:**
  - Friend request rows: Accept plus a round X, so names no longer get cut off.
  - Demo badges removed from portfolio rows.
  - Me's portfolio number uses the same font as everywhere else.
  - Empty state for "Your activity".
- **Sign-up:** steps fade between each other, and there is confetti on "You're in".
- **Installed app:** long-press the icon for Pay, Buy, Markets and My code shortcuts.

**Profile portfolio + privacy (Charlie, Nov 14).**
- **Profile card.** `/u/[handle]` shows "{Name}'s portfolio" under the Pay and Friends buttons. It holds:
  - the Total (or "Hidden" with an eye-off icon) and today's change;
  - a category bar, shown only when amounts are visible;
  - rows with logo, name, symbol, and then $ value, %, or nothing, plus each row's change.
- **Hidden states:** "{Name} keeps their portfolio private" (lock) and "{Name} only shows their portfolio to friends" (people icon).
- **Your own profile** shows "Your portfolio, as others see it", with an Edit link.
- **Settings controls,** in order: master switch; Everyone | Friends only; Total value; What I hold; How much of each (Dollars | Percent | Hide); Gains and losses; What I send and receive.
- **Settings behaviour:** rows dim when they don't apply. A footnote says the wallet is still public on-chain.

**Markets (Charlie, Nov 14).** `/markets` is reached from Portfolio ("See all" or a category chip). From top to bottom:
1. A soft-blue banner with a pulsing green dot: "Open 24/7. Everything here trades on-chain, so buys and sells fill nights and weekends too."
2. A search box.
3. A "Moving today" carousel of 6 cards (logo, name, price, change), shown only when no filter or search is active.
4. Sticky category chips: All · Stocks · Crypto · Gold & silver · Treasuries · Dollars & euros.
5. A count and sort pills (Biggest moves / Price / A to Z), then rows: logo, name, symbol, a 56 px line chart, price and change.
6. The demo note at the bottom.

**Buy (Charlie, Nov 14).** `/buy` is a full-screen flow in four steps:
1. Pick an asset, grouped Stocks / Crypto / Dollars and euros. Skipped when you start from an asset page.
2. Type the amount on a keypad, with $10 / $25 / $50 / $100 shortcuts. A "Pay with" row opens a sheet listing Apple Pay, debit card, Venmo, PayPal, Cash App, bank account, wallet and "Your dollars", each with a one-line hint.
3. Review: what you get, how you pay, "Goes to: your own wallet", and fees ("Shown by the partner first"). With Apple Pay the button is black: "Buy with Apple Pay".
4. Done: "Send some to a friend", or "Send it to Wes now" when the flow started from paying someone.

Every screen carries "Demo: no real money moves". The buy entry points are listed in DECISIONS 65.

**Who can see it: Public or Private only (Charlie, Nov 14).** No audience pill in the corner of the pay screen. The confirm screen has a "Who can see it" row with a Public | Private toggle, preset from the default in Settings, and one grey line under it explaining the choice. Feed cards show only the age for public payments, and "· 🔒 Private" for private ones (seen only by the two people). Sign-up and Settings offer the same two choices.

**Pay with → Confirm (Charlie, Nov 14; simplified later the same day, see DECISIONS 74: no summary rows, name shown once, button reads just "Pay $15").** Tapping Pay opens a list of holdings, the ones that cover the amount first; tapping one goes straight to a full **Confirm** screen: the person's photo, "Pay Wes Kim", the dollar amount very large, "with" and the chosen asset's logo, name and token amount, then For / Wes gets / Who can see it / Fee, the first-time warning, and one button, "Pay $20 with Bitcoin", with "Pay with something else" under it. No selecting-then-scrolling. Coming from an asset's "Send some to a friend", the list is skipped.

**No conversion.** The sender picks which holding to send; the receiver gets exactly that asset, and can keep it or tap **Sell for dollars** on the payment page or the asset page. A request is in dollars; whoever pays it picks the asset.


The centre button opens a full-height sheet.

**Step 1, who.** A search field ("Name or @username") with a Scan button. Under it: Top people, then Friends A to Z. Typing searches everyone. Tapping a person moves to step 2. The "+" beside the chosen avatar adds more people, which turns the screen into a split (section 8).

**Step 2, how much.** Match `reference/venmo/03`.
- the recipient's avatar, centred, with the "+" circle beside it, and their name and @username under it
- the amount, very large, with a small raised "$" and a clear button
- a note field in an outlined box, "What's it for?", required, with an emoji button
- an audience pill showing the current choice and icon; tap to change it. When Private is chosen it shows: "Hidden from feeds. The transfer is still visible on the blockchain." The server may return a stricter audience than the one chosen; the confirm sheet then says "Private because @wes keeps payments private".
- **Request** and **Pay**, side by side, both purple, disabled until there is an amount and a note
- a number pad: digits, a decimal point, delete

**Step 3, Pay only: confirm.** A half-sheet.
- "Pay Wes K. $20"
- **Pay with:** your holdings, largest first, each with its dollar value and a radio button; anything too small is greyed out
- "Wes gets it as NVDA", with the logo. If he has no preference: "Wes gets SOL."
- the fee in cents; on Arc, a Public payment also says "The note will be public on the blockchain."
- "First time paying @wes" when true
- "The price moved" with the new amount, when the quote changed between opening the sheet and tapping Pay
- a purple **Pay $20** button

**Step 4, done.** A full-screen tick, the sentence as the feed will show it, and **Done**. If the wallet is rejected or the transaction fails, stay on step 3 with one plain line saying why.

Request skips step 3 and goes straight to "Requested $20 from Wes K."

---

## 8. Requests and splits

- **Incoming requests** sit at the top of the Me tab and behind the Home shortcut pill. Each is a card: "**Wes K.** requests **$20** for Coffee", with **Pay** (opens step 3) and **Decline**.
- **Outgoing requests** show under them: **Remind** and **Cancel**.
- **Split.** Match `reference/venmo/04`. Add several people in step 1. Step 2 shows "Total amount", then one row per person with an amount box, yourself included by default; the total divides evenly and any box can be edited. One note for all. **Request** sends one request to each person. Splitting a payment to several people at once comes later.

---

## 9. Friends

1. A search field, "Find people".
2. **Requests,** when there are any: avatar, name, **Accept** and **Ignore**.
3. **Suggested:** people who have paid you or been paid by you, friends of friends, then recent sign-ups. Each with **Add**.
4. **Your friends,** A to Z, with a count. Tap for their profile.

Adding a friend sends a request; they become a friend when it is accepted. A profile button reads **Add friend**, then **Requested**, then **Friends** (tap for Unfriend).

---

## 10. Portfolio

Clean, mostly white space. This is Venmo's Crypto tab widened to everything the wallet holds.

1. **Total value,** very large, with the change over the chosen range in dollars and percent, green or red. An eye button beside it masks every dollar figure on this tab and on Me, for when someone else is looking at the screen.
2. A **line chart** of the total, with ranges 1D, 1W, 1M that switch the line and the change above it. Dragging along the line shows the value at that point in the big number. On day one this is today's holdings priced backwards; say "based on what you hold now" in small grey text.
2a. **What you hold:** one bar split into stocks and real-world assets, crypto, and cash, with the percent of each. No advice and no prompts to buy.
3. **What you hold** bar (see 2a). There is no "Get paid in" setting: you receive whatever a friend sends, and sell it if you'd rather have dollars.
4. **Holdings,** in three groups with a subtotal each:
   - **Stocks and real-world assets**
   - **Crypto**
   - **Cash** (USDC, and EURC on Arc)
   Each row: logo, name, ticker, a "demo" tag where it applies, the amount, the dollar value, and the 24-hour change. Largest holding first in each group. Assets the user does not hold are not listed.
5. **Explore,** under the holdings: everything else you could hold, each with its price and change.
6. A grey line at the bottom: the wallet's short address and a link to the explorer.

**Asset page,** as Venmo's coin page: name and logo, price, a chart with working 1D, 1W, 1M, 6M, 1Y and All ranges that can be dragged the same way, "You hold 0.0214 (about $3.02)", **Buy** and **Sell** against dollars, **Send some to a friend** (opens Pay with this asset chosen), "$20 of this came from friends" when true, a short description, and your activity in this asset. Demo assets say "Test token that follows the real price."

---

## 11. Me

1. **Header.** A settings gear top right and a bell beside it. The profile photo, large, with a small QR badge on its corner; display name; @username.
2. **Tiles,** two across: **Friends** with the count, and **Portfolio** with the total value.
3. **Requests** waiting, as cards (section 8).
4. **Your activity:** every payment you are in, newest first, in a compact row: the other person's avatar, the sentence, the age, and the amount at the right, green "+ $20" or plain "− $20".

**My code** (the QR badge, or the QR button on Home): two tabs, **Scan** and **My code**. My code shows the user's photo in the centre of the QR, the @username, **Share** and **Copy link**. Scan opens the camera, with a button to pick an image instead. A scanned code opens that person's profile, or step 2 already filled in when the code carries an amount.

**Settings:**
- **Profile:** photo, name, username
- **Privacy:** who sees future payments (Public, Friends, Private); "Make all past payments private"; who can see your friends list
- **Wallet:** address, chain, explorer link, back up or export the key for a wallet made in the browser, the one-time approvals
- **Sign out**

**Notifications** (the bell): friend requests, money requests, payments received, reactions and comments on your payments. A list, newest first. No push notifications.

---

## 12. Other people's profiles and the payment page

**`/u/[handle]`.** The photo, name, @username, **Pay or Request** (purple, full width), the friend button, a count of mutual friends, and then the payments this person shares that the viewer is allowed to see. Someone who is not signed in sees the profile and a **Sign up to pay @wes** button, and comes back here after signing up.

**`/p/[ref]`.** The feed card at full size, then the details visible to the two people only (amount, the asset and how much of it was sent, the fee in cents), a **Sell for dollars** button for the receiver while they still hold it, an explorer link, every reaction with who gave it, and the comments with a box to add one.

---

## 13. Words

- Buttons: Pay, Request, Pay again, Say thanks, Split, Add friend, Accept, Decline, Remind, Cancel, Done.
- Money always has a dollar sign and two decimals above the keypad stage: "$20.00" on receipts, "$20" in sentences when it is a whole number.
- Errors are one sentence and say what to do: "You don't have enough SOL. Pick something else to pay with." "That username is taken." "The price moved. Try again." "@wes hasn't signed up yet."
- Never show an address where a name exists. Never say "transaction hash", "gas" or "token" outside Settings and the payment page; say "fee" and "asset".

---

## 14. Privacy, as built this week

- Every new account starts on **Public**, and the sign-up screen says so and lets the user change it.
- The audience control is on every payment and in settings.
- The stricter of the two people's settings wins, as on Venmo.
- Friends-only payments are visible to friends of either person.
- Amounts are never shown to anyone but the two people.
- Private hides a payment from feeds and profiles. It does not hide the transfer on the chain, and the app says so at the moment of choosing.

---

## 15. Data and routes
Merged into SPEC v3.1: tables and shapes in Appendix B, routes in section 8, the sharing rules in section 10. Build against those.

## 16. Build order for this session

| Step | When | Deliverable | Check |
|---|---|---|---|
| U0 | Sat | App live on Vercel: tab bar, grey page, white cards, fonts, the five empty tabs, the manifest and icons, the phone frame for computers. Schema, session helper and shared types committed. | Production URL returns 200 on a phone |
| U1 | Sat | Home, the feed card, from fixture data with all three audiences, both pill types, reactions and an emoji tile | A screenshot beside `reference/venmo/01` has the same structure |
| U2 | Sat | Sign-up with a browser-made wallet: screens 1, 2 (first row only), 3, 4, 6, 7, 8. Initials for avatars. | A new browser profile reaches Home with a username |
| U3 | Sat | Pay/Request steps 1 to 4 with real quotes; requests: create, list, pay; "My code" and pay links (no camera yet) | A real payment between two test accounts appears in both feeds |
| U4 | Mon | Friends tab, friend requests, profiles, photos, both feeds, reactions and comments on real data, the payment page | Two accounts become friends and see each other's payment |
| U5 | Mon | "Use my wallet": MetaMask, Rabby, Coinbase Wallet, Phantom, with the "Turn on payments" step | A MetaMask account signs up and pays |
| U6 | Mon–Tue | Portfolio chart, the asset page with Buy and Sell, Me, settings, notifications, decline, cancel, remind, split, the camera scanner | A scanned code opens a filled-in payment; a split makes one request per person |
| U7 | Wed | Polish on a real iPhone and a real Android phone: safe areas, keyboard over the note field, pull to refresh | — |

On Sunday the room uses `/join` and `/room` (SPEC section 7), which Session A builds.

## 17. Sources

- Venmo's redesign, with the three feed screens: TechCrunch, May 11 2026, `https://techcrunch.com/2026/05/11/venmos-biggest-makeover-in-years-comes-at-a-very-interesting-time/`
- Friends-only as the new default: The Verge, `https://www.theverge.com/tech/927503/venmo-app-redesign-privacy-posts` (from the search result; not read in full)
- Pay and request steps, top people on Home, paying several people: `https://help.venmo.com/cs/articles/sending-requesting-money-vhel171`
- Audiences, hidden amounts, the stricter setting wins, comments need friendship: `https://help.venmo.com/cs/articles/who-can-see-my-venmo-payments-vhel351`
- Friends list, Add Friend, Unfriend: `https://help.venmo.com/cs/articles/adding-removing-friends-vhel249`
- QR codes, Scan, "Venmo me": `https://help.venmo.com/cs/articles/personal-qr-codes-on-venmo-faq-vhel316`
- Usernames (5 to 30 characters, hyphen and underscore): `https://help.venmo.com/cs/articles/check-or-edit-your-username-vhel208`
- Notes required, 280 characters: `https://help.venmo.com/cs/articles/customize-your-payment-vhel147`
- Crypto tab, chart ranges: `https://help.venmo.com/cs/articles/holding-cryptocurrency-on-venmo-vhel184`
- App Store screenshots of the pay and split screens: `https://apps.apple.com/us/app/venmo/id351727428`

The images in `reference/venmo/` are Venmo's. Use them to build from. Do not commit them to the public repo.
