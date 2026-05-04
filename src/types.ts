export type Screen = "loading" | "home" | "setup" | "shop" | "interview" | "offer" | "error";

export type CharacterId = string;
export type DifficultyId = string;
export type CardId = string;
export type CardType = "Tech" | "Charm";
export type ConnectionId = string;
export type TraitId = string;
export type InterviewerId = string;
export type ItemId = string;
export type Rarity = "common" | "lame" | "rare" | "epic" | "legendary";
export type CardRarity = Rarity;
export type LinkedOutTier = "none" | "premium" | "platinum";
export type BoosterPackId = string;
export type BoosterPackType = CardType | "Both";
export type RoundScale = [number, number, number];
export type InterviewerDialogs = [string, string[], string, string, string, string[]?];
export type InterviewRunResult = "on-time" | "overtime" | "dnf";

export type InterviewRunSummary = {
  interviewer: InterviewerId;
  round: number;
  result: InterviewRunResult;
};

export type InterviewChatMessage = {
  sender: "interviewer" | "player";
  text: string;
};

export type InterviewRetrySnapshot = {
  interviewer: InterviewerId;
  run: Run;
  deck: Card[];
  items: Item[];
  connectedConnectionIds: ConnectionId[];
  retiredConnectionIds: ConnectionId[];
  defeatedInterviewerIds: InterviewerId[];
};

export type InterviewVictoryResult = {
  sanityReward: number;
  turnsLeft: number;
  timeBonus: number;
  connectionsBonus: number;
  totalSanityGain: number;
  rejectionPreventedBy: string | null;
  timeBonusConnectionIds: ConnectionId[];
  flatBonusConnectionIds: ConnectionId[];
};

export type Character = {
  id: CharacterId;
  name: string;
  tagline: string;
  image: string;
  maxHP: number;
  maxEnergy: number;
  baseAtk: number;
  baseShield: number;
  deckCapacity: number;
  networkCapacity: number;
  sanity: number;
  traits: string[];
};

export type Difficulty = {
  id: DifficultyId;
  name: string;
  traits: string[];
  hpScale: number;
  atkScale: number;
  rewardScale: number;
  timeLimitOffset: number;
};

export type Card = {
  id: CardId;
  name: string;
  image: string;
  rarity: CardRarity;
  type: CardType;
  energyCost: number;
  atkIncrement: number;
  atkMult: number;
  hpIncrement: number;
  shieldIncrement: number;
  shieldMult: number;
  sanityIncrement: number;
  extraEffects: string[];
};

export type Connection = {
  id: ConnectionId;
  name: string;
  image: string;
  tagline: string;
  price: number;
  description: string[];
  rarity: Rarity;
};

export type Item = {
  id: ItemId;
  name: string;
  image: string;
  sound: string;
  price: number;
  description: string;
};

export type Trait = {
  id: TraitId;
  name: string;
  difficulty: DifficultyId;
  sanity: number;
  hp: number;
  attack: number;
  energy: number;
  shield: number;
  description: string;
};

export type ShopConnectionSuggestion = Connection & {
  traitIds: TraitId[];
};

export type BoosterPack = {
  id: BoosterPackId;
  name: string;
  type: BoosterPackType;
  cost: number;
  common: number;
  rare: number;
  epic: number;
  legendary: number;
};

export type Interviewer = {
  id: InterviewerId;
  name: string;
  debut: number;
  retire: number;
  tagline: string;
  image: string;
  hps: number[];
  atks: number[];
  shields: number[];
  delays: number[];
  timeLimit: number;
  descriptions: string[];
  dialogs: InterviewerDialogs;
};

export type InterviewEncounter = {
  interviewer: InterviewerId;
  currentPhase: number;
  currentMaxHP: number;
  currentHP: number;
  currentInterviewerAtk: number;
  currentInterviewerShield: number;
  skipTurns: number;
  currentAtk: number;
  currentShield: number;
  turnsUntilAttack: number;
  interviewerMissProbability: number;
  turnsUntilShieldReset: number;
  turnsRemaining: number;
  turnsPlayed: number;
  discardPullsLeft: number;
  hasSentTimeoutDialog: boolean;
  pendingDrawCount: number;
  isInterviewerDefeated: boolean;
  isPlayerRejected: boolean;
  victoryResult: InterviewVictoryResult | null;
  rejectionLetter: string[] | null;
  chatMessages: InterviewChatMessage[];
  extraDialogIndex: number;
  drawPile: Card[];
  discardPile: Card[];
  hand: Card[];
  handPage: number;
  slots: Array<Card | null>;
};

export type GameData = {
  characters: Character[];
  difficulties: Difficulty[];
  cards: Card[];
  connections: Connection[];
  items: Item[];
  traits: Trait[];
  boosterPacks: BoosterPack[];
  interviewers: Interviewer[];
  roundScales: RoundScale[];
  startingDeck: CardId[];
};

export type Run = {
  character: CharacterId;
  hp: number;
  maxHP: number;
  energy: number;
  maxEnergy: number;
  baseAtk: number;
  baseShield: number;
  interviewerAtkMult: number;
  shieldResetTurns: number;
  interviewBonusTurns: number;
  sanity: number;
  interviewStartEnergyOffset: number;
  initialInterviewHandSize: number;
  interviewSlotCount: number;
  slotEnergyRefills: number[];
  cardsDrawPerTurn: number;
  discardPullsPerInterview: number;
  deckCapacity: number;
  networkCapacity: number;
  difficulty: DifficultyId;
  roundsPassed: number;
  refreshCost: number;
  bufferRerollCost: number;
  connectionTraitChance: number;
  connectDiscount: number;
  packDiscount: number;
  itemCapacity: number;
  freeItemBuys: number;
  gihunInterviewsSurvived: number;
  spookyInterviewsSurvived: number;
  interviewHistory: InterviewRunSummary[];
  brainCapacity: number;
  usedBrainCapacity: number;
  brainCapacityUpgradesPurchased: number;
  hpUpgradesPurchased: number;
  energyUpgradesPurchased: number;
  atkUpgradesPurchased: number;
  shieldUpgradesPurchased: number;
  removalUpgradesPurchased: number;
  cardRemovals: number;
  hasLeekCodePremium: boolean;
  hasAwazonPrime: boolean;
  linkedOutTier: LinkedOutTier;
};

export type AppState = {
  screen: Screen;
  data: GameData | null;
  selectedCharacterId: CharacterId | null;
  selectedDifficultyId: DifficultyId | null;
  run: Run | null;
  deck: Card[];
  buffer: Card[];
  items: Item[];
  connectedConnectionIds: ConnectionId[];
  retiredConnectionIds: ConnectionId[];
  defeatedInterviewerIds: InterviewerId[];
  shopSuggestions: ShopConnectionSuggestion[];
  itemSuggestions: Item[];
  currentInterview: InterviewEncounter | null;
  interviewRetrySnapshot: InterviewRetrySnapshot | null;
  isDeckOpen: boolean;
  isNetworkOpen: boolean;
  isDiscardPileOpen: boolean;
  isItemsOpen: boolean;
  isMusicMuted: boolean;
  isSanityCounterDimmed: boolean;
  isShieldCounterDimmed: boolean;
  isTurnResolving: boolean;
  predictedPlayerDamage: number | null;
  isOfferResultsVisible: boolean;
  activeInterviewSlotIndex: number | null;
  isPlayerDamageFlashActive: boolean;
  isInterviewerDisabled: boolean;
  isInterviewerDamageFlashActive: boolean;
};
