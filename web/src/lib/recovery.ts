/**
 * Recovery phrase helpers for the demo.
 *
 * The demo phrase is made from real BIP-39 English words, but it is NOT a real wallet's phrase:
 * it is random words shown so the backup and restore screens can be walked through.
 *
 * TODO (wallet integration): generate and restore with a real library, e.g. viem's
 * `generateMnemonic(english)` / `mnemonicToAccount(phrase)`, keep the phrase only on the phone,
 * and check the checksum on restore (`validateMnemonic`).
 */

const WORDS = (
  "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act " +
  "action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead " +
  "aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount " +
  "amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple " +
  "approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artist artwork ask aspect assault asset " +
  "assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware " +
  "away awesome awful awkward axis baby bachelor bacon badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket " +
  "battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle " +
  "bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body " +
  "boil bomb bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass brave bread breeze brick bridge brief " +
  "bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger " +
  "burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp can canal cancel candy cannon canoe canvas " +
  "canyon capable capital captain car carbon card cargo carpet carry cart case cash casino castle casual cat catalog catch category cattle caught " +
  "cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase chat cheap check " +
  "cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk churn cigar cinnamon circle citizen city civil claim clap " +
  "clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth cloud clown club clump cluster clutch coach coast " +
  "coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider " +
  "control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft cram " +
  "crane crash crater crawl crazy cream credit creek crew cricket crime crisp critic crop cross crouch crowd crucial cruel cruise crumble crunch crush"
).split(" ");

export function demoPhrase(count = 12): string[] {
  const idx = new Uint32Array(count);
  crypto.getRandomValues(idx);
  return Array.from(idx, (n) => WORDS[n % WORDS.length]);
}

/** Splits pasted or typed text into words. */
export function toWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** A recovery phrase is 12 or 24 lower-case words. (The real build also checks the checksum.) */
export function looksLikePhrase(words: string[]): boolean {
  return (words.length === 12 || words.length === 24) && words.every((w) => /^[a-z]{3,8}$/.test(w));
}
