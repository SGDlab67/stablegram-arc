# SEED-DATA v3.1 — facts the build needs
Checked Fri Nov 13 2026 unless a row says otherwise. **[check]** means not confirmed; test it before relying on it.

## 1. Assets

**Demo assets** (our test tokens, 18 decimals). **Only assets with a clean logo are in the demo** (Charlie, Nov 14): the S&P 500, Nasdaq 100 and gold tokens were dropped because they have no recognisable logo.

| Symbol | Name shown | CoinGecko id | Kind | Offered as a first stock |
|---|---|---|---|---|
| dNVDA | NVIDIA (demo) | `nvidia-xstock` | stock | yes |
| dTSLA | Tesla (demo) | `tesla-xstock` | stock | yes |
| dAAPL | Apple (demo) | `apple-xstock` | stock | yes |
| dAMZN | Amazon (demo) | `amazon-xstock` | stock | yes |
| dGOOGL | Google (demo) | `alphabet-xstock` | stock |  |
| dMETA | Meta (demo) | `meta-xstock` | stock |  |
| dMSFT | Microsoft (demo) | `microsoft-xstock` | stock |  |
| dNFLX | Netflix (demo) | `netflix-xstock` | stock |  |
| dCOIN | Coinbase (demo) | `coinbase-xstock` | stock |  |
| dCRCL | Circle (demo) | `circle-xstock` | stock |  |
| dBTC | Bitcoin (demo) | `bitcoin` | crypto |  |
| dETH | Ethereum (demo) | `ethereum` | crypto |  |
| dSOL | Solana (demo) | `solana` | crypto |  |
| dMON | Monad (demo) | `monad` | crypto |  |

**Real-world assets (added Nov 14):**

| Symbol | Name shown | Source token | Market |
|---|---|---|---|
| dPAXG | Gold | PAX Gold | Gold & silver |
| dXAUT | Tether Gold | Tether Gold | Gold & silver |
| dKAG | Silver | Kinesis Silver | Gold & silver |
| dUSDY | US Treasuries | Ondo US Dollar Yield | Treasuries |
| dBUIDL | BlackRock Treasury Fund | BlackRock BUIDL | Treasuries |

Prices for PAXG, XAUT, USDY and BUIDL come from Blockworks (`asset-price`, daily close 2026-11-13). KAG is not on Blockworks; its price comes from CoinGecko (`kinesis-silver`). Logos are CoinGecko's large images. The Tether Gold diamond sits on a cream tile. Silver alternatives that were not used: Ondo SLVON, xStocks SLVX, Matrixdock XAGM.

**Prices and logos (pulled 2026-11-14T22:56Z).** Crypto prices come from the Blockworks API (`asset-price`, daily close 2026-11-13 UTC). Blockworks does not carry the xStocks tokens, so stock prices come from CoinGecko's xStocks ids, which trade all week. Crypto logos are Blockworks' `logoURL` (CoinGecko where Blockworks' copy was too small or failed: MON, EURC). Stock logos are the xStocks token images, cropped to the company mark. All are saved in `web/public/logos/` so the app never loads them from a third party. Sign-up offers NVDA, TSLA, AAPL and AMZN, plus "Just dollars". NVDA and TSLA have a real Uniswap market on Monad as of Nov 12; AAPL and AMZN were chosen for their logos.

**The dollar:** USDC on Arc, tUSD on Monad. CoinGecko id `usd-coin` for display only; the contracts treat it as exactly one dollar.

## 2. Arc testnet (from docs.arc.io and the RPC)

| Thing | Value |
|---|---|
| Chain ID | 5042002 (mainnet is 5042; we do not use it) |
| RPC | `https://rpc.testnet.arc.io`; WebSocket `wss://rpc.testnet.arc.io` |
| Explorer | `https://explorer.testnet.arc.io` |
| Gas price | 25 gwei read from the RPC; the floor is 20 gwei |
| USDC (ERC-20 interface, 6 decimals) | `0x3600000000000000000000000000000000000000`; supports signed approvals (it returned a domain separator) |
| EURC (6 decimals) | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`; price id `euro-coin` |
| cirBTC (8 decimals, confirmed by a call) | `0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF`; price id `bitcoin` |
| WETH (18 decimals) | `0x2c4047028a72803939b6fb674D01bC059B5C4961`; price id `ethereum` |
| Memo | `0x5294E9927c3306DcBaDb03fe70b92e01cCede505` (has code). One function: `memo(target, data, memoId, memoData)`. Emits `BeforeMemo`, then the target's events, then `Memo(sender, target, callDataHash, memoId, memo, memoIndex)`. Must be called by a plain account. A failed inner call comes back as `MemoFailed(bytes)`, selector `0xed1966a2`, wrapping the inner error. A reviewer's read-only simulation showed a contract called this way sees the wallet as the sender and can pull USDC against an allowance; a memo-wrapped approval estimated at about 75,000 gas against 56,000 plain. |
| Multicall3From | `0x522fAf9A91c41c443c66765030741e4AaCe147D0` (batches calls and keeps the original sender) |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| A blocklisted test address | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (transfers to it revert; use it in one test) |
| Faucet | `https://faucet.circle.com`, 20 USDC per address per 2 hours. Arc's docs say it also gives EURC on Arc testnet; not tried. |
| Circle Swap Kit | Works on Arc testnet for USDC, EURC and cirBTC only. The docs show a `to.recipientAddress` option for a same-chain swap; not tried. Packages `@circle-fin/swap-kit` and `@circle-fin/adapter-viem-v2`. An API key from the Circle Console is optional; without one the rate limit is shared. |
| Circle Wallets | Chain identifier `ARC-TESTNET` |
| Wallets | Arc documents MetaMask, Rabby and Coinbase Wallet. **Phantom supports Arc** (Phantom help centre); Arc testnet needs Phantom's Testnet Mode turned on. |
| Arc mainnet | Chain ID 5042, live since Sep 16 2026 according to a Circle press release seen only as a search snippet. Expect "why testnet?" (RUNBOOK E). |
| Deploy tool | Arc's Foundry fork (`arc-forge`, `arc-cast`, `arc-anvil`). Arc's docs say standard Foundry cannot reproduce how USDC moves. No Intel-Mac build. Whether plain `forge script` fails is unverified. |
| Privacy | Arc's private execution is on its roadmap and not available. Do not claim it. |
| A fee, estimated | A 200,000-gas payment at 25 gwei is 0.005 USDC, half a cent. Measure and print the real one. |

Arc's docs also recommend an agent skill (`use-arc`). It has not been reviewed here. Read it before installing.

## 3. Monad

- Testnet chain ID 10143 (confirmed by `eth_chainId` on Nov 13), RPC `https://testnet-rpc.monad.xyz`, gas billed on the limit. Details are in `archive/vote-project-build-kit-v2.1/SPEC.md` section 4. Sync send on a keyed endpoint is unverified.
- **Tokenized stocks on Monad, in order:** xStocks deployed on Monad in October 2026, and Kuru was already trading tokenized stocks then (Monad's October highlights). **On Thu Nov 12, Uniswap v4 on Monad opened ten xStocks markets:** EWYx, MUx, NVDAx, QQQx, SGOVx, SKHYx, SMHx, SPCXx, SPYx, TSLAx (Monad's post on X). Pool depth is unchecked.
- Say "On Thursday, Uniswap on Monad opened ten real stock markets." Do not say tokenized stocks arrived on Monad this week.
- Of our demo stocks, NVDA, TSLA, SPY and QQQ have one of those markets. AAPL, CRCL and COIN do not.
- The real CRCLx on Monad mainnet is `0xfEbDEd1B0986a8ee107f5AB1a1c5a813491DeCEB` (91,240 tokens, read from the RPC on Nov 13).
- xStocks move on-chain like any token. They may not be offered to US persons, and the issuer's terms put that duty on the distributor. We do not trade them.
- Phantom ended Monad support on Aug 26 2026. On Monad the wallets are MetaMask and the browser-made one.
- Monad has a name service, NNS (`.nad` names). Not used; resolving `.nad` names as recipients is a later addition.

## 4. Sign-up grants

| | Arc, final deployment | Arc, development deployments | Monad testnet |
|---|---|---|---|
| Dollar grant | 4.00 USDC | 0.50 | 50.00 tUSD |
| Starter asset | 3.00 dollars' worth | 0.50 | 50.00 dollars' worth |
| Gas grant | none; fees come out of the USDC | none | 0.30 MON, an estimate for about nine transactions; set it after measuring one payment |
| Cost to us per sign-up | 7 real testnet USDC | 1 | gas only |

- Arc: one faucet claim (20 USDC) covers two final sign-ups. Thirty need 210 USDC, eleven claims. Claim to several addresses every two hours and ask Circle for more at office hours.
- Scripts reuse their wallets and pay $0.10 and $0.05, so a run costs cents.
- Monad: a room of 60 at 0.30 MON is 18 MON in grants alone. Ask for 50.

## 5. Reserved usernames
`admin`, `support`, `help`, `official`, `security`, `team`, `staff`, `venmo`, `paypal`, `cashapp`, `zelle`, `circle`, `arc`, `usdc`, `eurc`, `monad`, `phantom`, `metamask`, `coinbase`, `kraken`, `krak`, `gemini`, `quicknode`, `ubc`, `obg`, and the app's own name once chosen.

## 6. Note shortcuts
🍕 🍔 🌮 ☕ 🍻 🏠 🚗 ⛽ 🎟️ 🎉 🛒 ✈️ 💸 🎂 🏀. No lightning bolt.

Sample notes for seeded demo data: "🍕 Friday pizza", "☕ thanks for the coffee", "🏠 utilities", "🎟️ Ducks tickets", "⛽ gas money", "🍻 last night".

## 7. Who already does part of this

Checked by a reviewer against each product's own pages on Nov 13 (`reviews/judge-redteam.md` has the quotes and links). "Snippet" means only search-result text was seen.

| Product | Pays a username | Receiver's own wallet | Receiver chooses the asset | Stocks | Notes |
|---|---|---|---|---|---|
| Venmo | Yes | No, custodial | No | No | Six coins and PYUSD, US only |
| Phantom | Yes, inside Phantom | **Yes** | No | Holds tokenized stocks outside the US | Dropped Monad in August; supports Arc |
| Krak (Kraken) | Yes, "Kraktags" | No, custodial | A request is in the requester's currency | Kraken owns xStocks; sending them user to user is unconfirmed | Converts automatically if the sender lacks the currency. 160+ countries. |
| Base app | Yes | **Yes** | No | — | |
| Strike | Yes | No, custodial | **Yes**: cash or bitcoin | No | A "Receive currency" setting |
| Moove | Yes, a handle | **Yes** | **Yes**: a "settlement crypto" | Not checked | Converts on the payer's side |
| Yodl | ENS names | **Yes** | **Yes** | Payers can use stock tokens | Shaped like a checkout, not a friends app |
| Cash App | $cashtags | No | In 2021, a gift could be taken as dollars | Stock gifts launched in 2021; current status unconfirmed | Bitcoin between $cashtags ended Dec 20 2024 |
| Robinhood | No | — | — | — | Does not support sending assets to other people |

**Since v3.2 (no conversion)** the receiver-chooses column no longer describes us. The closest product is now **Cash App's stock gifts** (2021; current status unconfirmed): check it before the pitch. Our difference to defend: paying a friend back, by username, priced in dollars, in a feed, into the friend's own wallet, with crypto and stocks side by side.

**What this meant for v3.1.** Both halves of our first pitch line were wrong: receiver-chosen settlement exists, and so does a username that pays your own wallet. What the reviewer could not find, which is not proof it does not exist: a friends app with a feed, priced in dollars, where a **stock** is on the list of things you can be paid in.

## 8. Lines for the pitch

| Line | Why it holds |
|---|---|
| "I owe you ten bucks. Here's ten bucks of Nvidia." | It is the product. Open with it, not with "Venmo for crypto". |
| "Venmo moves cash. This moves your portfolio. Pay a friend back in a slice of Nvidia; they keep it or sell it." | §7. Check Cash App first. |
| "It's in his wallet, not ours." | The router keeps no balance; a test asserts it |
| "That payment cost under a cent, paid in the same dollars." | Arc; read the real fee off the receipt |
| "Taihl sent me ten dollars of euros. One tap, and it's dollars." | The Arc demo: selling EURC through Swap Kit, once it ships |
| "On Thursday, Uniswap on Monad opened ten real stock markets. Tonight's stocks are test tokens. Those pools are where real ones come from." (Blitz) | §3 |
| "The stocks are test tokens with real prices." | Say it before a judge asks |

Do not say: "Venmo for crypto"; "nobody lets the receiver choose"; "nobody sends it to your own wallet"; "tokenized stocks went live on Monad three days ago"; "private payments"; "send real Nvidia stock"; "no fees"; "issuers restrict who can hold a tokenized stock".

## 9. Name ideas (from the red-team; a quick search each, not trademark clearance)
| Name | Why | What the search found |
|---|---|---|
| Potluck | Everyone brings what they have | A hackathon project and an event-planning app; no payments company |
| Halves | "Go halves" | A small expense-splitting tool; Halvest, an investing app |
| Payfolio | Pay from your portfolio | One small open-source project |
| Whipround | A collection among friends | Fleet software in another field; a British idiom |
| Tradesies | "Trade you my Solana for your Nvidia" | Tradesy, a Mac portfolio tracker; it leans on "trade" |

