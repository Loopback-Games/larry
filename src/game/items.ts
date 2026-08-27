import { ItemId } from './ids.js';

export interface ItemDef {
  readonly id: ItemId;
  /** Name shown in the inventory list. */
  readonly name: string;
  /** Words the parser accepts for this item. */
  readonly nouns: readonly string[];
  /** Text shown when the player examines it. */
  readonly description: string;
  /** Items Larry starts the game carrying. */
  readonly carriedAtStart?: boolean;
}

/**
 * All twenty inventory items. Descriptions are original writing; the item set
 * and its role in the puzzle chain follow the structure of the original game.
 */
export const ITEMS: Readonly<Record<ItemId, ItemDef>> = {
  [ItemId.Wallet]: {
    id: ItemId.Wallet,
    name: 'Wallet',
    nouns: ['wallet', 'money', 'cash', 'billfold'],
    description:
      'Genuine imitation leather. Inside: a wad of small bills, three expired ' +
      'club memberships, and a photograph of your mother.',
    carriedAtStart: true,
  },
  [ItemId.BreathSpray]: {
    id: ItemId.BreathSpray,
    name: 'Breath Spray',
    nouns: ['spray', 'breath spray', 'breathspray', 'mint'],
    description:
      'Two atomised puffs of what the label calls "Alpine Confidence". It ' +
      'tastes like a pine tree died in your mouth, but it works.',
    carriedAtStart: true,
  },
  [ItemId.PocketLint]: {
    id: ItemId.PocketLint,
    name: 'Pocket Lint',
    nouns: ['lint', 'pocket lint', 'fluff'],
    description:
      'A small grey sphere of accumulated disappointment. You have had it ' +
      'longer than most of your friendships.',
    carriedAtStart: true,
  },
  [ItemId.Watch]: {
    id: ItemId.Watch,
    name: 'Wrist Watch',
    nouns: ['watch', 'wristwatch', 'wrist watch', 'time'],
    description: 'A digital watch with a cracked face. It still keeps the time.',
    carriedAtStart: true,
  },
  [ItemId.Whiskey]: {
    id: ItemId.Whiskey,
    name: 'Glass of Whiskey',
    nouns: ['whiskey', 'whisky', 'drink', 'glass', 'booze'],
    description:
      'A generous pour of something amber. It smells less like a distillery ' +
      'than like a filling station.',
  },
  [ItemId.Rose]: {
    id: ItemId.Rose,
    name: 'Rose',
    nouns: ['rose', 'flower'],
    description:
      'A single red rose, slightly crushed. Romance on a budget, but romance ' + 'nonetheless.',
  },
  [ItemId.Ring]: {
    id: ItemId.Ring,
    name: 'Diamond Ring',
    nouns: ['ring', 'diamond', 'diamond ring'],
    description:
      'The stone catches the light and throws it back in a way that suggests ' +
      'either enormous value or enormous confidence.',
  },
  [ItemId.RemoteControl]: {
    id: ItemId.RemoteControl,
    name: 'Remote Control',
    nouns: ['remote', 'remote control', 'controller', 'clicker'],
    description:
      'A slab of brown plastic with too many buttons and no labels. Somewhere ' +
      'in this town is a television that answers to it.',
  },
  [ItemId.Condom]: {
    id: ItemId.Condom,
    name: 'Prophylactic',
    nouns: ['condom', 'prophylactic', 'rubber', 'protection'],
    description: 'Still sealed, and frankly the single most responsible object you own.',
  },
  [ItemId.UsedCondom]: {
    id: ItemId.UsedCondom,
    name: 'Used Prophylactic',
    nouns: ['used condom', 'used prophylactic', 'used rubber'],
    description: 'It has served its purpose with distinction. Do not dwell on it.',
  },
  [ItemId.Candy]: {
    id: ItemId.Candy,
    name: 'Box of Candy',
    nouns: ['candy', 'chocolates', 'box', 'box of candy', 'sweets'],
    description:
      'A heart-shaped box of assorted chocolates. Two are missing. You are ' +
      'choosing not to investigate that.',
  },
  [ItemId.Wine]: {
    id: ItemId.Wine,
    name: 'Bottle of Wine',
    nouns: ['wine', 'bottle', 'bottle of wine'],
    description:
      'A bottle of house red with a screw cap and an optimistic label. The ' +
      'vintage is "recent".',
  },
  [ItemId.Magazine]: {
    id: ItemId.Magazine,
    name: 'Magazine',
    nouns: ['magazine', 'mag', 'periodical'],
    description:
      'A glossy magazine you bought strictly for the articles. There is, ' +
      'improbably, something useful written inside the back cover.',
  },
  [ItemId.Knife]: {
    id: ItemId.Knife,
    name: 'Pocket Knife',
    nouns: ['knife', 'pocket knife', 'pocketknife', 'blade'],
    description: 'A small folding knife. Blunt, but persistent.',
  },
  [ItemId.Hammer]: {
    id: ItemId.Hammer,
    name: 'Hammer',
    nouns: ['hammer', 'mallet'],
    description:
      'A claw hammer with a taped handle. It solves a narrow class of problem ' +
      'extremely well.',
  },
  [ItemId.Pills]: {
    id: ItemId.Pills,
    name: 'Bottle of Pills',
    nouns: ['pills', 'bottle of pills', 'medicine', 'tablets'],
    description:
      'An unlabelled bottle of small white tablets. Whatever they are, they ' +
      'are certainly something.',
  },
  [ItemId.Rope]: {
    id: ItemId.Rope,
    name: 'Rope',
    nouns: ['rope', 'cord', 'line'],
    description: 'A decent length of nylon rope. Strong enough. Probably.',
  },
  [ItemId.DiscoPass]: {
    id: ItemId.DiscoPass,
    name: 'Disco Pass',
    nouns: ['pass', 'disco pass', 'card', 'membership'],
    description:
      'A laminated card entitling the bearer to enter the finest discotheque ' +
      'within a two-block radius.',
  },
  [ItemId.Apple]: {
    id: ItemId.Apple,
    name: 'Apple',
    nouns: ['apple', 'fruit'],
    description:
      'A red apple, polished to a shine. Historically, these have caused ' +
      'trouble in gardens.',
  },
  [ItemId.Doll]: {
    id: ItemId.Doll,
    name: 'Inflatable Doll',
    nouns: ['doll', 'inflatable doll', 'blow up doll'],
    description:
      'Deflated, she is a sad puddle of vinyl. Inflated, she is a sad puddle ' +
      'of vinyl with ambition.',
  },
};

export const ALL_ITEMS: readonly ItemDef[] = Object.values(ITEMS);

export const STARTING_ITEMS: readonly ItemId[] = ALL_ITEMS.filter((i) => i.carriedAtStart).map(
  (i) => i.id,
);
