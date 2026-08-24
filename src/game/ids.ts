/** Every room in the game. Values double as save-file keys, so keep them stable. */
export const RoomId = {
  Title: 'title',
  AgeCheck: 'age-check',
  OutsideBar: 'outside-bar',
  InsideBar: 'inside-bar',
  BarHallway: 'bar-hallway',
  BarToilet: 'bar-toilet',
  BarBackroom: 'bar-backroom',
  HookerRoom: 'hooker-room',
  Alley: 'alley',
  DarkStreet: 'dark-street',
  Taxi: 'taxi',
  OutsideStore: 'outside-store',
  InsideStore: 'inside-store',
  OutsideDisco: 'outside-disco',
  InsideDisco: 'inside-disco',
  OutsideCasino: 'outside-casino',
  InsideCasino: 'inside-casino',
  Slots: 'slots',
  Blackjack: 'blackjack',
  Lounge: 'lounge',
  OutsideChapel: 'outside-chapel',
  InsideChapel: 'inside-chapel',
  ElevatorLobby: 'elevator-lobby',
  Elevator: 'elevator',
  ReceptionDesk: 'reception-desk',
  HoneymoonSuite: 'honeymoon-suite',
  PenthouseLounge: 'penthouse-lounge',
  PenthouseHotTub: 'penthouse-hot-tub',
  PenthouseBedroom: 'penthouse-bedroom',
  Sunrise: 'sunrise',
  Ending: 'ending',
} as const;

export type RoomId = (typeof RoomId)[keyof typeof RoomId];

/** Inventory items. */
export const ItemId = {
  Wallet: 'wallet',
  BreathSpray: 'breath-spray',
  PocketLint: 'pocket-lint',
  Watch: 'watch',
  Whiskey: 'whiskey',
  Rose: 'rose',
  Ring: 'ring',
  RemoteControl: 'remote-control',
  Condom: 'condom',
  UsedCondom: 'used-condom',
  Candy: 'candy',
  Wine: 'wine',
  Magazine: 'magazine',
  Knife: 'knife',
  Hammer: 'hammer',
  Pills: 'pills',
  Rope: 'rope',
  DiscoPass: 'disco-pass',
  Apple: 'apple',
  Doll: 'doll',
} as const;

export type ItemId = (typeof ItemId)[keyof typeof ItemId];

/** The maximum attainable score, matching the original's point total. */
export const MAX_SCORE = 222;
