import type {
  AppState,
  BoosterPack,
  BoosterPackId,
  Card,
  CardType,
  CardId,
  Character,
  CharacterId,
  Connection,
  ConnectionId,
  Difficulty,
  DifficultyId,
  GameData,
  InterviewEncounter,
  Interviewer,
  InterviewerId,
  Item,
  ItemId,
  LinkedOutTier,
  RoundScale,
  Run,
  InterviewVictoryResult,
  ShopConnectionSuggestion,
  Trait,
  TraitId,
} from "../types.js";

export const INTERVIEW_HAND_PAGE_SIZE = 5;
export const DEFAULT_INITIAL_INTERVIEW_HAND_SIZE = 5;
export const DEFAULT_INTERVIEW_SLOT_COUNT = 3;
export const DEFAULT_BASE_SHIELD = 0;
export const DEFAULT_SHIELD_RESET_TURNS = 1;
export const DEFAULT_CARDS_DRAW_PER_TURN = 1;
export const INTERVIEW_PAID_DRAW_ENERGY_COST = 3;
const OFFER_TARGET_ROUNDS: Record<DifficultyId, number> = {
  simple: 12,
  fair: 12,
  tough: 15,
  extreme: 18,
  impossible: 21,
};
const BRAIN_CAPACITY_UPGRADE_COSTS = [100, 200];
const TOUCHING_GRASS_UPGRADE_COST = 75;
const TOUCHING_GRASS_UPGRADE_LIMIT = 5;
const TOUCHING_GRASS_REMOVAL_BASE_COST = 50;
const TOUCHING_GRASS_REMOVAL_COST_STEP = 25;
const TOUCHING_GRASS_REMOVAL_LIMIT = 5;
const SHOP_REFRESH_BASE_COST = 50;
const SHOP_REFRESH_COST_STEP = 25;
const BUFFER_REROLL_BASE_COST = 0;
const BUFFER_REROLL_COST_STEP = 25;
const TIME_BONUS_TURN_CAP = 10;
const AWAZON_PRIME_COST = 200;
const REJECTION_PREVENTION_CONNECTION_IDS: ConnectionId[] = ["asgore", "anubis"];
const DIFFICULTY_ORDER = ["simple", "fair", "tough", "extreme", "impossible"] as const;

export function createInitialState(): AppState {
  return {
    screen: "loading",
    data: null,
    selectedCharacterId: null,
    selectedDifficultyId: null,
    run: null,
    deck: [],
    buffer: [],
    items: [],
    connectedConnectionIds: [],
    retiredConnectionIds: [],
    defeatedInterviewerIds: [],
    shopSuggestions: [],
    itemSuggestions: [],
    currentInterview: null,
    isDeckOpen: false,
    isNetworkOpen: false,
    isDiscardPileOpen: false,
    isItemsOpen: false,
    isMusicMuted: false,
    isSanityCounterDimmed: false,
    isShieldCounterDimmed: false,
    isTurnResolving: false,
    predictedPlayerDamage: null,
    isOfferResultsVisible: false,
    activeInterviewSlotIndex: null,
    isPlayerDamageFlashActive: false,
    isInterviewerDisabled: false,
    isInterviewerDamageFlashActive: false,
  };
}

export function getCharacter(data: GameData, characterId: CharacterId): Character {
  const character = data.characters.find(({ id }) => id === characterId);

  if (!character) {
    throw new Error(`Unknown character: ${characterId}`);
  }

  return character;
}

export function getDifficulty(data: GameData, difficultyId: DifficultyId): Difficulty {
  const difficulty = data.difficulties.find(({ id }) => id === difficultyId);

  if (!difficulty) {
    throw new Error(`Unknown difficulty: ${difficultyId}`);
  }

  return difficulty;
}

export function getCard(data: GameData, cardId: CardId): Card {
  const card = data.cards.find(({ id }) => id === cardId);

  if (!card) {
    throw new Error(`Unknown card: ${cardId}`);
  }

  return card;
}

export function getConnection(data: GameData, connectionId: ConnectionId): Connection {
  const connection = data.connections.find(({ id }) => id === connectionId);

  if (!connection) {
    throw new Error(`Unknown connection: ${connectionId}`);
  }

  return connection;
}

export function getItem(data: GameData, itemId: ItemId): Item {
  const item = data.items.find(({ id }) => id === itemId);

  if (!item) {
    throw new Error(`Unknown item: ${itemId}`);
  }

  return item;
}

export function getTrait(data: GameData, traitId: TraitId): Trait {
  const trait = data.traits.find(({ id }) => id === traitId);

  if (!trait) {
    throw new Error(`Unknown trait: ${traitId}`);
  }

  return trait;
}

export function getInterviewer(data: GameData, interviewerId: InterviewerId): Interviewer {
  const interviewer = data.interviewers.find(({ id }) => id === interviewerId);

  if (!interviewer) {
    throw new Error(`Unknown interviewer: ${interviewerId}`);
  }

  return interviewer;
}

export function getInterviewerIntroDialog(interviewer: Interviewer): string {
  return interviewer.dialogs[0];
}

export function getInterviewerPhaseDialog(interviewer: Interviewer, phaseIndex: number): string {
  const phaseDialogs = interviewer.dialogs[1];
  const safeIndex = Math.min(Math.max(phaseIndex, 0), phaseDialogs.length - 1);

  return phaseDialogs[safeIndex];
}

export function getInterviewerDefeatedDialog(interviewer: Interviewer): string {
  return interviewer.dialogs[2];
}

export function getInterviewerTimeoutDialog(interviewer: Interviewer): string {
  return interviewer.dialogs[3];
}

export function getInterviewerPlayerDeathDialog(interviewer: Interviewer): string {
  return interviewer.dialogs[4];
}

export function getInterviewerExtraDialogs(interviewer: Interviewer): string[] {
  return interviewer.dialogs[5] ?? [];
}

export function getBoosterPack(data: GameData, boosterPackId: BoosterPackId): BoosterPack {
  const boosterPack = data.boosterPacks.find(({ id }) => id === boosterPackId);

  if (!boosterPack) {
    throw new Error(`Unknown booster pack: ${boosterPackId}`);
  }

  return boosterPack;
}

export function getRoundScale(data: GameData, roundsPassed: number): RoundScale {
  const roundIndex = Math.min(Math.max(roundsPassed, 0), data.roundScales.length - 1);

  return data.roundScales[roundIndex];
}

export function getScaledInterviewerHP(
  data: GameData,
  run: Run,
  interviewer: Interviewer,
  phaseIndex: number,
): number {
  const [hpScale] = getRoundScale(data, run.roundsPassed);
  const difficulty = getDifficulty(data, run.difficulty);

  return Math.max(1, Math.round(interviewer.hps[phaseIndex] * hpScale * difficulty.hpScale));
}

export function getScaledInterviewerAtk(
  data: GameData,
  run: Run,
  interviewer: Interviewer,
  phaseIndex: number,
): number {
  const [, atkScale] = getRoundScale(data, run.roundsPassed);
  const difficulty = getDifficulty(data, run.difficulty);

  return Math.max(1, Math.round(interviewer.atks[phaseIndex] * atkScale * difficulty.atkScale));
}

export function getInterviewerShield(interviewer: Interviewer, phaseIndex: number): number {
  return Math.max(0, interviewer.shields[phaseIndex] ?? 0);
}

export function getInterviewRewardScale(data: GameData, run: Run): number {
  const [, , rewardScale] = getRoundScale(data, run.roundsPassed);
  const difficulty = getDifficulty(data, run.difficulty);

  return Math.max(0, rewardScale * difficulty.rewardScale);
}

export function getOfferTargetRounds(difficultyId: DifficultyId): number {
  return OFFER_TARGET_ROUNDS[difficultyId] ?? OFFER_TARGET_ROUNDS.fair;
}

function requireData(state: AppState): GameData {
  if (!state.data) {
    throw new Error("Game data not loaded.");
  }

  return state.data;
}

export function requireSelection(state: AppState): { characterId: CharacterId; difficultyId: DifficultyId } {
  if (!state.selectedCharacterId || !state.selectedDifficultyId) {
    throw new Error("Selection not initialized.");
  }

  return {
    characterId: state.selectedCharacterId,
    difficultyId: state.selectedDifficultyId,
  };
}

export function buildRun(data: GameData, characterId: CharacterId, difficultyId: DifficultyId): Run {
  const character = getCharacter(data, characterId);
  const difficulty = getDifficulty(data, difficultyId);
  let connectDiscount = 1;
  let packDiscount = 1;

  if (character.id === "tatar") {
    connectDiscount = 0.9;
    packDiscount = 0.9;
  }
  if (character.id === "ekaterina") {
    packDiscount = 1.1;
  }
  if (character.id === "max") {
    connectDiscount = 1.1;
  }

  return {
    character: character.id,
    hp: character.maxHP,
    maxHP: character.maxHP,
    energy: character.maxEnergy,
    maxEnergy: character.maxEnergy,
    baseAtk: character.baseAtk,
    baseShield: character.baseShield,
    shieldResetTurns: DEFAULT_SHIELD_RESET_TURNS,
    interviewBonusTurns: difficulty.timeLimitOffset,
    sanity: character.sanity,
    interviewStartEnergyOffset: 0,
    initialInterviewHandSize: DEFAULT_INITIAL_INTERVIEW_HAND_SIZE,
    interviewSlotCount: DEFAULT_INTERVIEW_SLOT_COUNT,
    slotEnergyRefills: Array.from({ length: DEFAULT_INTERVIEW_SLOT_COUNT }, () => 1),
    cardsDrawPerTurn: DEFAULT_CARDS_DRAW_PER_TURN,
    discardPullsPerInterview: 0,
    deckCapacity: character.deckCapacity,
    networkCapacity: character.networkCapacity,
    difficulty: difficultyId,
    roundsPassed: 0,
    refreshCost: SHOP_REFRESH_BASE_COST,
    bufferRerollCost: BUFFER_REROLL_BASE_COST,
    connectionTraitChance: 0.2,
    connectDiscount,
    packDiscount,
    itemCapacity: 2,
    gihunInterviewsSurvived: 0,
    interviewHistory: [],
    brainCapacity: 1,
    usedBrainCapacity: 0,
    brainCapacityUpgradesPurchased: 0,
    hpUpgradesPurchased: 0,
    energyUpgradesPurchased: 0,
    atkUpgradesPurchased: 0,
    shieldUpgradesPurchased: 0,
    removalUpgradesPurchased: 0,
    cardRemovals: 0,
    hasLeekCodePremium: false,
    hasAwazonPrime: false,
    linkedOutTier: "none",
  };
}

export function buildDeck(data: GameData): Card[] {
  return data.startingDeck.map((cardId) => getCard(data, cardId));
}

export function getConnectionCost(
  data: GameData,
  run: Run,
  connection: Connection,
  networkSize = 0,
  traitIds: TraitId[] = [],
): number {
  const extraConnections = Math.max(0, networkSize - run.networkCapacity);
  const networkPenalty = 1 + extraConnections * 0.1;
  const traitCost = traitIds.reduce((total, traitId) => total + getTrait(data, traitId).sanity, 0);
  const connectionCost = Math.floor(connection.price * run.connectDiscount * networkPenalty);

  return Math.max(0, connectionCost + traitCost);
}

export function getBoosterPackCost(run: Run, boosterPack: BoosterPack, deckSize = 0): number {
  const extraCards = Math.max(0, deckSize - run.deckCapacity);
  const deckPenalty = 1 + extraCards * 0.1;

  return Math.max(0, Math.floor(boosterPack.cost * run.packDiscount * deckPenalty));
}

export function isBrainCapacityFull(run: Run): boolean {
  return run.usedBrainCapacity >= Math.max(0, run.brainCapacity);
}

export function getBrainCapacityUpgradeCost(run: Run): number | null {
  return BRAIN_CAPACITY_UPGRADE_COSTS[run.brainCapacityUpgradesPurchased] ?? null;
}

export function getTouchingGrassRemovalCost(run: Run): number | null {
  if (run.removalUpgradesPurchased >= TOUCHING_GRASS_REMOVAL_LIMIT) {
    return null;
  }

  return TOUCHING_GRASS_REMOVAL_BASE_COST + TOUCHING_GRASS_REMOVAL_COST_STEP * run.removalUpgradesPurchased;
}

export function getTouchingGrassUpgradeCost(): number {
  return TOUCHING_GRASS_UPGRADE_COST;
}

export function purchaseBrainCapacityUpgrade(state: AppState): AppState {
  if (!state.run) {
    return state;
  }

  const upgradeCost = getBrainCapacityUpgradeCost(state.run);

  if (upgradeCost === null || state.run.sanity < upgradeCost) {
    return state;
  }

  return {
    ...state,
    run: {
      ...state.run,
      sanity: state.run.sanity - upgradeCost,
      brainCapacity: state.run.brainCapacity + 1,
      brainCapacityUpgradesPurchased: state.run.brainCapacityUpgradesPurchased + 1,
    },
  };
}

export function purchaseTouchingGrassUpgrade(
  state: AppState,
  stat: "hp" | "energy" | "atk" | "shield",
): AppState {
  if (!state.run || state.run.sanity < TOUCHING_GRASS_UPGRADE_COST) {
    return state;
  }

  if (stat === "hp") {
    if (state.run.hpUpgradesPurchased >= TOUCHING_GRASS_UPGRADE_LIMIT) {
      return state;
    }

    return {
      ...state,
      run: {
        ...state.run,
        sanity: state.run.sanity - TOUCHING_GRASS_UPGRADE_COST,
        hp: state.run.hp + 10,
        maxHP: state.run.maxHP + 10,
        hpUpgradesPurchased: state.run.hpUpgradesPurchased + 1,
      },
    };
  }

  if (stat === "energy") {
    if (state.run.energyUpgradesPurchased >= TOUCHING_GRASS_UPGRADE_LIMIT) {
      return state;
    }

    return {
      ...state,
      run: {
        ...state.run,
        sanity: state.run.sanity - TOUCHING_GRASS_UPGRADE_COST,
        energy: state.run.energy + 1,
        maxEnergy: state.run.maxEnergy + 1,
        energyUpgradesPurchased: state.run.energyUpgradesPurchased + 1,
      },
    };
  }

  if (state.run.atkUpgradesPurchased >= TOUCHING_GRASS_UPGRADE_LIMIT) {
    if (stat === "atk") {
      return state;
    }
  }

  if (stat === "atk") {
    return {
      ...state,
      run: {
        ...state.run,
        sanity: state.run.sanity - TOUCHING_GRASS_UPGRADE_COST,
        baseAtk: state.run.baseAtk + 2,
        atkUpgradesPurchased: state.run.atkUpgradesPurchased + 1,
      },
    };
  }

  if (state.run.shieldUpgradesPurchased >= TOUCHING_GRASS_UPGRADE_LIMIT) {
    return state;
  }

  return {
    ...state,
    run: {
      ...state.run,
      sanity: state.run.sanity - TOUCHING_GRASS_UPGRADE_COST,
      baseShield: state.run.baseShield + 2,
      shieldUpgradesPurchased: state.run.shieldUpgradesPurchased + 1,
    },
  };
}

export function purchaseTouchingGrassRemoval(state: AppState): AppState {
  if (!state.run) {
    return state;
  }

  const removalCost = getTouchingGrassRemovalCost(state.run);

  if (removalCost === null || state.run.sanity < removalCost) {
    return state;
  }

  return {
    ...state,
    run: {
      ...state.run,
      sanity: state.run.sanity - removalCost,
      cardRemovals: state.run.cardRemovals + 1,
      removalUpgradesPurchased: state.run.removalUpgradesPurchased + 1,
    },
  };
}

export function isBoosterPackLocked(run: Run, boosterPack: BoosterPack): boolean {
  if (run.hasLeekCodePremium) {
    return false;
  }

  return boosterPack.epic > 0 || boosterPack.legendary > 0;
}

export function getSuggestionCount(run: Run): number {
  if (run.linkedOutTier === "platinum") {
    return 4;
  }

  if (run.linkedOutTier === "premium") {
    return 3;
  }

  return 2;
}

export function getItemCapacity(run: Run): number {
  return Math.max(0, run.itemCapacity);
}

export function getAwazonItemCost(run: Run, connectedConnectionIds: ConnectionId[], suggestionIndex: number, item: Item): number {
  let cost = item.price;

  if (suggestionIndex === 0 && connectedConnectionIds.includes("jaehun")) {
    cost -= 25;
  }

  return Math.max(0, cost);
}

export function getItemSuggestionCount(run: Run): number {
  return run.hasAwazonPrime ? 4 : 2;
}

export function canSeeLegendaryConnections(run: Run): boolean {
  return run.linkedOutTier === "platinum";
}

function getSuggestionPool(
  data: GameData,
  connectedConnectionIds: ConnectionId[],
  retiredConnectionIds: ConnectionId[],
  allowLegendary: boolean,
  excludedConnectionIds: ConnectionId[] = [],
): Connection[] {
  return data.connections.filter(({ id, rarity }) => {
    if (connectedConnectionIds.includes(id) || retiredConnectionIds.includes(id) || excludedConnectionIds.includes(id)) {
      return false;
    }

    if (!allowLegendary && rarity === "legendary") {
      return false;
    }

    return true;
  });
}

function getDifficultyRank(difficultyId: DifficultyId): number {
  const difficultyRank = DIFFICULTY_ORDER.indexOf(difficultyId as (typeof DIFFICULTY_ORDER)[number]);

  return difficultyRank === -1 ? 0 : difficultyRank;
}

function getAvailableConnectionTraits(data: GameData, difficultyId: DifficultyId): Trait[] {
  const currentRank = getDifficultyRank(difficultyId);

  return data.traits.filter((trait) => getDifficultyRank(trait.difficulty) <= currentRank);
}

function buildShopSuggestion(data: GameData, connection: Connection, run: Run): ShopConnectionSuggestion {
  const traitIds = getAvailableConnectionTraits(data, run.difficulty)
    .filter(() => Math.random() < run.connectionTraitChance)
    .map(({ id }) => id);

  return {
    ...connection,
    traitIds,
  };
}

export function getEligibleSuggestionCount(
  data: GameData,
  connectedConnectionIds: ConnectionId[],
  retiredConnectionIds: ConnectionId[],
  run: Run,
): number {
  return getSuggestionPool(data, connectedConnectionIds, retiredConnectionIds, canSeeLegendaryConnections(run)).length;
}

export function buildShopSuggestions(
  data: GameData,
  connectedConnectionIds: ConnectionId[],
  retiredConnectionIds: ConnectionId[],
  run: Run,
): ShopConnectionSuggestion[] {
  const pool = getSuggestionPool(data, connectedConnectionIds, retiredConnectionIds, canSeeLegendaryConnections(run));
  const shuffled = [...pool];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, getSuggestionCount(run)).map((connection) => buildShopSuggestion(data, connection, run));
}

export function extendShopSuggestions(
  data: GameData,
  connectedConnectionIds: ConnectionId[],
  retiredConnectionIds: ConnectionId[],
  currentSuggestions: ShopConnectionSuggestion[],
  run: Run,
): ShopConnectionSuggestion[] {
  const targetCount = getSuggestionCount(run);

  if (currentSuggestions.length >= targetCount) {
    return currentSuggestions.slice(0, targetCount);
  }

  const pool = getSuggestionPool(
    data,
    connectedConnectionIds,
    retiredConnectionIds,
    canSeeLegendaryConnections(run),
    currentSuggestions.map(({ id }) => id),
  );
  const shuffled = [...pool];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return [
    ...currentSuggestions,
    ...shuffled.slice(0, targetCount - currentSuggestions.length).map((connection) => buildShopSuggestion(data, connection, run)),
  ];
}

function buildItemSuggestions(data: GameData, run: Run): Item[] {
  const shuffled = [...data.items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, getItemSuggestionCount(run));
}

function extendItemSuggestions(data: GameData, currentSuggestions: Item[], run: Run): Item[] {
  const targetCount = getItemSuggestionCount(run);

  if (currentSuggestions.length >= targetCount) {
    return currentSuggestions.slice(0, targetCount);
  }

  const remainingItems = data.items.filter(
    (item) => !currentSuggestions.some((suggestion) => suggestion.id === item.id),
  );
  const shuffled = [...remainingItems];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return [...currentSuggestions, ...shuffled.slice(0, targetCount - currentSuggestions.length)];
}

function getSantaItems(data: GameData, currentItems: Item[], run: Run, connectedConnectionIds: ConnectionId[]): Item[] {
  if (!connectedConnectionIds.includes("santa")) {
    return currentItems;
  }

  const freeSlots = Math.max(0, getItemCapacity(run) - currentItems.length);

  if (freeSlots <= 0) {
    return currentItems;
  }

  const shuffled = [...data.items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return [...currentItems, ...shuffled.slice(0, Math.min(2, freeSlots))];
}

function getDefaultDifficultyId(data: GameData): DifficultyId | null {
  return data.difficulties.find(({ id }) => id === "fair")?.id ?? data.difficulties[0]?.id ?? null;
}

export function initializeState(data: GameData): AppState {
  return {
    screen: "home",
    data,
    selectedCharacterId: data.characters[0]?.id ?? null,
    selectedDifficultyId: getDefaultDifficultyId(data),
    run: null,
    deck: [],
    buffer: [],
    items: [],
    connectedConnectionIds: [],
    retiredConnectionIds: [],
    defeatedInterviewerIds: [],
    shopSuggestions: [],
    itemSuggestions: [],
    currentInterview: null,
    isDeckOpen: false,
    isNetworkOpen: false,
    isDiscardPileOpen: false,
    isItemsOpen: false,
    isMusicMuted: false,
    isSanityCounterDimmed: false,
    isShieldCounterDimmed: false,
    isTurnResolving: false,
    predictedPlayerDamage: null,
    isOfferResultsVisible: false,
    activeInterviewSlotIndex: null,
    isPlayerDamageFlashActive: false,
    isInterviewerDisabled: false,
    isInterviewerDamageFlashActive: false,
  };
}

export function createErrorState(previous: AppState): AppState {
  return {
    ...previous,
    screen: "error",
  };
}

export function startNewRun(state: AppState): AppState {
  const data = requireData(state);
  const { characterId, difficultyId } = requireSelection(state);

  return {
    ...state,
    screen: "setup",
    run: buildRun(data, characterId, difficultyId),
    deck: buildDeck(data),
    buffer: [],
    items: [],
    connectedConnectionIds: [],
    retiredConnectionIds: [],
    defeatedInterviewerIds: [],
    shopSuggestions: [],
    itemSuggestions: [],
    currentInterview: null,
    isDeckOpen: false,
    isNetworkOpen: false,
    isDiscardPileOpen: false,
    isItemsOpen: false,
    isSanityCounterDimmed: false,
    isShieldCounterDimmed: false,
    isTurnResolving: false,
    predictedPlayerDamage: null,
    isOfferResultsVisible: false,
    activeInterviewSlotIndex: null,
    isPlayerDamageFlashActive: false,
    isInterviewerDisabled: false,
    isInterviewerDamageFlashActive: false,
  };
}

export function enterShop(state: AppState): AppState {
  const data = requireData(state);

  if (!state.run) {
    return state;
  }

  return {
    ...state,
    screen: "shop",
    run: {
      ...state.run,
      usedBrainCapacity: 0,
      bufferRerollCost: BUFFER_REROLL_BASE_COST,
    },
    shopSuggestions: buildShopSuggestions(data, state.connectedConnectionIds, state.retiredConnectionIds, state.run),
    itemSuggestions: buildItemSuggestions(data, state.run),
    currentInterview: null,
    isDeckOpen: false,
    isNetworkOpen: false,
    isDiscardPileOpen: false,
    isItemsOpen: false,
    isSanityCounterDimmed: false,
    isShieldCounterDimmed: false,
    isTurnResolving: false,
    predictedPlayerDamage: null,
    isOfferResultsVisible: false,
    activeInterviewSlotIndex: null,
    isPlayerDamageFlashActive: false,
    isInterviewerDisabled: false,
    isInterviewerDamageFlashActive: false,
  };
}

function setOpenPanel(state: AppState, panel: "deck" | "network" | "discard" | "items" | null): AppState {
  return {
    ...state,
    isDeckOpen: panel === "deck",
    isNetworkOpen: panel === "network",
    isDiscardPileOpen: panel === "discard",
    isItemsOpen: panel === "items",
  };
}

export function toggleDeck(state: AppState): AppState {
  return setOpenPanel(state, state.isDeckOpen ? null : "deck");
}

export function toggleNetwork(state: AppState): AppState {
  return setOpenPanel(state, state.isNetworkOpen ? null : "network");
}

export function toggleDiscardPile(state: AppState): AppState {
  return setOpenPanel(state, state.isDiscardPileOpen ? null : "discard");
}

export function toggleItems(state: AppState): AppState {
  return setOpenPanel(state, state.isItemsOpen ? null : "items");
}

export function toggleMusicMuted(state: AppState): AppState {
  return {
    ...state,
    isMusicMuted: !state.isMusicMuted,
  };
}

export function toggleShieldCounter(state: AppState): AppState {
  return {
    ...state,
    isShieldCounterDimmed: !state.isShieldCounterDimmed,
  };
}

export function toggleSanityCounter(state: AppState): AppState {
  return {
    ...state,
    isSanityCounterDimmed: !state.isSanityCounterDimmed,
  };
}

export function setInterviewTurnResolving(state: AppState, isTurnResolving: boolean): AppState {
  return {
    ...state,
    isTurnResolving,
    predictedPlayerDamage: isTurnResolving ? predictPlayerDamage(state) : null,
  };
}

export function setActiveInterviewSlotIndex(state: AppState, activeInterviewSlotIndex: number | null): AppState {
  return {
    ...state,
    activeInterviewSlotIndex,
  };
}

export function setPlayerDamageFlashActive(state: AppState, isPlayerDamageFlashActive: boolean): AppState {
  return {
    ...state,
    isPlayerDamageFlashActive,
  };
}

export function setInterviewerDamageFlashActive(state: AppState, isInterviewerDamageFlashActive: boolean): AppState {
  return {
    ...state,
    isInterviewerDamageFlashActive,
  };
}

export function setInterviewerDisabled(state: AppState, isInterviewerDisabled: boolean): AppState {
  return {
    ...state,
    isInterviewerDisabled,
  };
}

function drawCardsByRarity(
  data: GameData,
  rarity: "common" | "rare" | "epic" | "legendary",
  boosterPackType: CardType | "Both",
  count: number,
): Card[] {
  if (count <= 0) {
    return [];
  }

  const pool = data.cards.filter((card) => {
    if (card.rarity !== rarity) {
      return false;
    }

    if (boosterPackType === "Both") {
      return true;
    }

    return card.type === boosterPackType;
  });

  if (!pool.length) {
    return [];
  }

  return Array.from({ length: count }, () => {
    const cardIndex = Math.floor(Math.random() * pool.length);

    return pool[cardIndex];
  });
}

function openBoosterPack(data: GameData, boosterPack: BoosterPack): Card[] {
  return [
    ...drawCardsByRarity(data, "common", boosterPack.type, boosterPack.common),
    ...drawCardsByRarity(data, "rare", boosterPack.type, boosterPack.rare),
    ...drawCardsByRarity(data, "epic", boosterPack.type, boosterPack.epic),
    ...drawCardsByRarity(data, "legendary", boosterPack.type, boosterPack.legendary),
  ];
}

function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function drawCards(drawPile: Card[], count: number, fallbackCard: Card): { drawnCards: Card[]; remainingDrawPile: Card[] } {
  const drawnCards = drawPile.slice(0, count);
  const fallbackCount = Math.max(0, count - drawnCards.length);

  return {
    drawnCards: [...drawnCards, ...Array.from({ length: fallbackCount }, () => fallbackCard)],
    remainingDrawPile: drawPile.slice(count),
  };
}

function getHandPageCount(handLength: number): number {
  return Math.max(1, Math.ceil(handLength / INTERVIEW_HAND_PAGE_SIZE));
}

function clampHandPage(handLength: number, handPage: number): number {
  return Math.min(Math.max(handPage, 0), getHandPageCount(handLength) - 1);
}

export function buildInterviewSlotEnergyRefills(
  run: Run,
): number[] {
  return Array.from(
    { length: Math.max(0, run.interviewSlotCount) },
    (_, index) => Math.max(0, run.slotEnergyRefills[index] ?? 1),
  );
}

function buildInterviewEncounter(
  data: GameData,
  run: Run,
  interviewer: Interviewer,
  deck: Card[],
  connectedConnectionIds: ConnectionId[],
): InterviewEncounter {
  const shuffledDeck = shuffleCards(deck);
  const { drawnCards, remainingDrawPile } = drawCards(shuffledDeck, run.initialInterviewHandSize, getCard(data, "yap"));
  const slots = Array.from({ length: run.interviewSlotCount }, () => null);
  const turnsRemaining = Math.max(1, interviewer.timeLimit + run.interviewBonusTurns);
  const skipTurns = connectedConnectionIds.includes("catnap") ? 2 : 0;
  const currentMaxHP = getScaledInterviewerHP(data, run, interviewer, 0);

  return {
    interviewer: interviewer.id,
    currentPhase: 0,
    currentMaxHP,
    currentHP: currentMaxHP,
    currentInterviewerAtk: getScaledInterviewerAtk(data, run, interviewer, 0),
    currentInterviewerShield: getInterviewerShield(interviewer, 0),
    skipTurns,
    currentAtk: run.baseAtk,
    currentShield: run.baseShield,
    turnsUntilAttack: Math.max(0, interviewer.delays[0]),
    interviewerMissProbability: 1,
    turnsUntilShieldReset: run.shieldResetTurns,
    turnsRemaining,
    turnsPlayed: 0,
    discardPullsLeft: run.discardPullsPerInterview,
    hasSentTimeoutDialog: false,
    pendingDrawCount: 0,
    isInterviewerDefeated: false,
    isPlayerRejected: false,
    victoryResult: null,
    rejectionLetter: null,
    chatMessages: [],
    extraDialogIndex: 0,
    drawPile: remainingDrawPile,
    discardPile: [],
    hand: drawnCards,
    handPage: 0,
    slots,
  };
}

export function applyInterviewSlot(
  currentState: AppState,
  run: Run,
  slotIndex: number,
  playedCharmCount: number,
): AppState {
  if (!currentState.currentInterview || currentState.screen !== "interview") {
    return currentState;
  }

  const slot = currentState.currentInterview.slots[slotIndex];

  if (slotIndex < 0 || slotIndex >= currentState.currentInterview.slots.length) {
    return currentState;
  }

  const nextRun: Run = {
    ...run,
  };
  const nextInterview: InterviewEncounter = {
    ...currentState.currentInterview,
  };
  const nextState: AppState = {
    ...currentState,
    run: nextRun,
    currentInterview: nextInterview,
  };

  if (!slot) {
    const slotEnergyRefill = buildInterviewSlotEnergyRefills(run)[slotIndex] ?? 1;
    const energyAfterRefill = Math.max(0, run.energy + slotEnergyRefill);
    const wastedEnergy = Math.max(0, energyAfterRefill - run.maxEnergy);

    nextRun.energy = Math.min(run.maxEnergy, energyAfterRefill);
    if (currentState.connectedConnectionIds.includes("robbie") && wastedEnergy > 0) {
      nextRun.sanity += wastedEnergy * 15;
    }

    return nextState;
  }

  nextRun.hp = Math.max(1, Math.min(run.maxHP, run.hp + slot.hpIncrement));
  nextRun.sanity = Math.max(0, run.sanity + slot.sanityIncrement);

  if (slot.type === "Charm" &&
    playedCharmCount === 2 &&
    currentState.connectedConnectionIds.includes("michael-scott")
  ) {
    nextRun.sanity += 75;
  }
  
  nextInterview.currentAtk = Math.max(0,
    (currentState.currentInterview.currentAtk + slot.atkIncrement) * slot.atkMult);
  
  nextInterview.currentShield = Math.max(0,
  (currentState.currentInterview.currentShield + slot.shieldIncrement) * slot.shieldMult);

  if (slot.id === "bs") {
    nextInterview.pendingDrawCount += 2;
  }
  if (slot.id === "linked-list") {
    nextInterview.pendingDrawCount += 3;
  }
  if (slot.id === "st") {
    nextInterview.pendingDrawCount += 4;
  }
  if (slot.id === "enthusiasm") {
    nextInterview.pendingDrawCount += 2;
  }

  if (slot.id === "flattery") {
    nextInterview.skipTurns = Math.max(1, nextInterview.skipTurns);
    nextState.isInterviewerDisabled = true;
  }
  if (slot.id === "deep-voice") {
    nextInterview.skipTurns = Math.max(1, nextInterview.skipTurns);
    nextState.isInterviewerDisabled = true;
  }
  if (slot.id === "pet-rock") {
    nextInterview.skipTurns = Math.max(1, nextInterview.skipTurns);
    nextState.isInterviewerDisabled = true;
    if (currentState.data) {
      const interviewer = getInterviewer(currentState.data, nextInterview.interviewer);
      const currentPhaseDelay = interviewer.delays[nextInterview.currentPhase];
      nextInterview.turnsUntilAttack = Math.max(0, currentPhaseDelay);
      nextInterview.interviewerMissProbability = 1;
    }
  }
  if (slot.id == "hypnosis") {
    nextInterview.skipTurns = Math.max(1, nextInterview.skipTurns);
    nextState.isInterviewerDisabled = true;
    if (currentState.data) {
      const interviewer = getInterviewer(currentState.data, nextInterview.interviewer);
      const currentPhaseDelay = interviewer.delays[nextInterview.currentPhase];
      nextInterview.turnsUntilAttack = Math.max(0, currentPhaseDelay);
      nextInterview.interviewerMissProbability = 1;
    }
  }
  if (slot.id === "kettle") {
    nextInterview.skipTurns = Math.max(1, nextInterview.skipTurns);
    nextState.isInterviewerDisabled = true;
  }

  return nextState;
}

export function roundInterviewCombatStats(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      currentAtk: Math.max(0, Math.round(state.currentInterview.currentAtk)),
      currentShield: Math.max(0, Math.round(state.currentInterview.currentShield)),
    },
  };
}

export function applyInterviewExtraBuffs(state: AppState, foundCharmCard: boolean): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  let nextCurrentAtk = state.currentInterview.currentAtk;
  let nextCurrentShield = state.currentInterview.currentShield;

  if (state.connectedConnectionIds.includes("daniel")) {
    nextCurrentAtk *= 1.1;
  }
  if (state.connectedConnectionIds.includes("innokentiy")) {
    nextCurrentAtk *= 1.2;
  }
  if (state.connectedConnectionIds.includes("vineet")) {
    nextCurrentAtk *= 1.4;
  }
  if (state.connectedConnectionIds.includes("achilles") && state.currentInterview.turnsPlayed <= 3) {
    nextCurrentShield += 100;
  }

  if (
    nextCurrentAtk === state.currentInterview.currentAtk &&
    nextCurrentShield === state.currentInterview.currentShield
  ) {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      currentAtk: Math.max(0, nextCurrentAtk),
      currentShield: Math.max(0, nextCurrentShield),
    },
  };
}

export function applyInterviewPostRoundAtkCap(state: AppState, playedCharmCount: number): AppState {
  if (!state.currentInterview || !state.data || !state.run || state.screen !== "interview") {
    return state;
  }

  let cappedAtk = state.currentInterview.currentAtk;

  if (state.currentInterview.interviewer === "boopie" && playedCharmCount < 1) {
    cappedAtk = 0;
  }

  if (state.currentInterview.interviewer === "careless-guy") {
    const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
    const currentPhaseMaxHP = getScaledInterviewerHP(
      state.data,
      state.run,
      interviewer,
      state.currentInterview.currentPhase,
    );

    if (cappedAtk > currentPhaseMaxHP) {
      cappedAtk = 0;
    }
  }
  if (state.currentInterview.interviewer === "hm-guy") {
    const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
    const currentPhaseMaxHP = getScaledInterviewerHP(
      state.data,
      state.run,
      interviewer,
      state.currentInterview.currentPhase,
    );

    cappedAtk = Math.min(cappedAtk, Math.ceil(currentPhaseMaxHP * 0.2));
  }

  if (cappedAtk === state.currentInterview.currentAtk) {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      currentAtk: Math.max(0, cappedAtk),
    },
  };
}

export function getPlayerDamageAfterMitigation(state: AppState, damage: number): number {
  if (!state.currentInterview) {
    return Math.max(0, damage);
  }

  const safeDamage = Math.max(0, damage);
  let hpDamage = safeDamage;

  if (state.currentInterview.interviewer != "mazziotta") {
    hpDamage = Math.max(0, safeDamage - state.currentInterview.currentShield);
  }

  if (state.connectedConnectionIds.includes("anubis")) {
    hpDamage = Math.min(hpDamage, 20);
  }

  return hpDamage;
}

export function getInterviewerDamageAfterMitigation(state: AppState, damage: number): number {
  if (!state.currentInterview) {
    return Math.max(0, damage);
  }

  const safeDamage = Math.max(0, damage);

  return Math.max(0, safeDamage - state.currentInterview.currentInterviewerShield);
}

export function predictPlayerDamage(state: AppState): number {
  if (!state.currentInterview || !state.data || !state.run || state.screen !== "interview") {
    return 0;
  }

  if (state.isTurnResolving && state.predictedPlayerDamage !== null) {
    return state.predictedPlayerDamage;
  }

  let predictedAtk = state.currentInterview.currentAtk;

  for (const slot of state.currentInterview.slots) {
    if (!slot) {
      continue;
    }

    predictedAtk = Math.max(0, (predictedAtk + slot.atkIncrement) * slot.atkMult);
  }

  if (state.connectedConnectionIds.includes("daniel")) {
    predictedAtk *= 1.1;
  }
  if (state.connectedConnectionIds.includes("innokentiy")) {
    predictedAtk *= 1.2;
  }
  if (state.connectedConnectionIds.includes("vineet")) {
    predictedAtk *= 1.4;
  }

  predictedAtk = Math.max(0, Math.round(predictedAtk));

  return predictedAtk;
}

export function damageInterviewer(state: AppState, damage: number): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  const hpDamage = getInterviewerDamageAfterMitigation(state, damage);
  let nextHP = Math.max(0, state.currentInterview.currentHP - hpDamage);

  if (state.currentInterview.interviewer === "legal") {
    nextHP = state.currentInterview.currentHP - hpDamage;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      currentHP: nextHP,
    },
  };
}

export function damagePlayer(state: AppState, damage: number): AppState {
  if (!state.currentInterview || !state.run || state.screen !== "interview") {
    return state;
  }

  const hpDamage = getPlayerDamageAfterMitigation(state, damage);
  let nextBaseAtk = state.run.baseAtk;

  if (state.connectedConnectionIds.includes("baldi") && hpDamage > 0) {
    nextBaseAtk += 2;
  }

  return {
    ...state,
    run: {
      ...state.run,
      hp: Math.max(0, state.run.hp - hpDamage),
      baseAtk: nextBaseAtk,
    },
  };
}

export function tickInterviewerDelay(state: AppState, isOvertimeTurn = false): AppState {
  if (!state.currentInterview || !state.data || state.screen !== "interview") {
    return state;
  }

  const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
  const currentPhaseDelay = interviewer.delays[state.currentInterview.currentPhase];

  if (currentPhaseDelay < 0) {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      turnsUntilAttack: Math.max(0, state.currentInterview.turnsUntilAttack - (isOvertimeTurn ? 2 : 1)),
    },
  };
}

export function resetInterviewerDelay(state: AppState): AppState {
  if (!state.currentInterview || !state.data || state.screen !== "interview") {
    return state;
  }

  const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      turnsUntilAttack: Math.max(0, interviewer.delays[state.currentInterview.currentPhase]),
      interviewerMissProbability: 1,
    },
  };
}

export function tickInterviewerMissProbability(state: AppState, isOvertimeTurn = false): AppState {
  if (!state.currentInterview || !state.data || state.screen !== "interview") {
    return state;
  }

  const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
  const currentPhaseDelay = interviewer.delays[state.currentInterview.currentPhase];

  if (currentPhaseDelay >= 0) {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      interviewerMissProbability: Math.max(
        0,
        state.currentInterview.interviewerMissProbability + currentPhaseDelay * (isOvertimeTurn ? 2 : 1),
      ),
    },
  };
}

export function resetInterviewerMissProbability(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      interviewerMissProbability: 1,
    },
  };
}

export function consumeInterviewerSkipTurn(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  if (state.currentInterview.skipTurns < 1) {
    return state;
  }

  const nextSkipTurns = Math.max(0, state.currentInterview.skipTurns - 1);

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      skipTurns: nextSkipTurns,
    },
    isInterviewerDisabled: nextSkipTurns > 0,
  };
}

export function advanceInterviewerPhase(state: AppState): AppState {
  if (!state.currentInterview || !state.data || !state.run || state.screen !== "interview") {
    return state;
  }

  const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
  const nextPhase = state.currentInterview.currentPhase + 1;

  if (nextPhase >= interviewer.hps.length) {
    return state;
  }

  let hpCarry = 0;

  if (state.currentInterview.interviewer === "legal" && state.currentInterview.currentHP < 0) {
    hpCarry = Math.max(0, Math.abs(state.currentInterview.currentHP));
  }

  const nextMaxHP = getScaledInterviewerHP(state.data, state.run, interviewer, nextPhase);
  const nextHP = nextMaxHP + hpCarry;

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      currentPhase: nextPhase,
      currentMaxHP: nextMaxHP,
      currentHP: nextHP,
      currentInterviewerAtk: getScaledInterviewerAtk(state.data, state.run, interviewer, nextPhase),
      currentInterviewerShield: getInterviewerShield(interviewer, nextPhase),
      skipTurns: Math.max(1, state.currentInterview.skipTurns),
      turnsUntilAttack: Math.max(0, interviewer.delays[nextPhase]),
      interviewerMissProbability: 1,
    },
    isInterviewerDisabled: true,
  };
}

export function useChrisPhaseSkip(state: AppState): AppState {
  if (!state.currentInterview || !state.data || !state.run || state.screen !== "interview") {
    return state;
  }

  if (
    !state.connectedConnectionIds.includes("chris") ||
    state.currentInterview.isInterviewerDefeated ||
    state.currentInterview.isPlayerRejected ||
    state.currentInterview.victoryResult ||
    state.currentInterview.rejectionLetter
  ) {
    return state;
  }

  const nextConnectedConnectionIds = state.connectedConnectionIds.filter((connectionId) => connectionId !== "chris");
  const nextRetiredConnectionIds = state.retiredConnectionIds.includes("chris")
    ? state.retiredConnectionIds
    : [...state.retiredConnectionIds, "chris"];
  const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
  const isLastPhase = state.currentInterview.currentPhase >= interviewer.hps.length - 1;
  const nextState = {
    ...state,
    connectedConnectionIds: nextConnectedConnectionIds,
    retiredConnectionIds: nextRetiredConnectionIds,
  };

  if (isLastPhase) {
    return {
      ...nextState,
      currentInterview: {
        ...state.currentInterview,
        isInterviewerDefeated: true,
      },
    };
  }

  return advanceInterviewerPhase(nextState);
}

export function resetInterviewCurrentAtk(state: AppState): AppState {
  if (!state.currentInterview || !state.run || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      currentAtk: Math.max(0, state.run.baseAtk),
    },
  };
}

export function tickInterviewShieldReset(state: AppState): AppState {
  if (!state.currentInterview || !state.run || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      turnsUntilShieldReset: Math.max(0, state.currentInterview.turnsUntilShieldReset - 1),
    },
  };
}

export function resolveInterviewShieldReset(state: AppState): AppState {
  if (!state.currentInterview || !state.run || state.screen !== "interview") {
    return state;
  }

  if (state.currentInterview.turnsUntilShieldReset > 0) {
    return state;
  }

  const resetTurns = Math.max(1, state.run.shieldResetTurns);

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      currentShield: Math.max(0, state.run.baseShield),
      turnsUntilShieldReset: resetTurns,
    },
  };
}

export function decrementInterviewTime(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      turnsRemaining: Math.max(0, state.currentInterview.turnsRemaining - 1),
      turnsPlayed: state.currentInterview.turnsPlayed + 1,
    },
  };
}

export function discardInterviewSlotsAndQueueDraw(state: AppState): AppState {
  if (!state.currentInterview || !state.run || state.screen !== "interview") {
    return state;
  }

  const discardedCards = state.currentInterview.slots.filter((card): card is Card => card !== null);
  const nextSlots = Array.from({ length: state.currentInterview.slots.length }, () => null);

  let automaticDrawCount = state.run.cardsDrawPerTurn;
  if (state.currentInterview.interviewer === "janitor") {
    automaticDrawCount = Math.max(0, automaticDrawCount - 1);
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      discardPile: [...discardedCards, ...state.currentInterview.discardPile],
      pendingDrawCount: state.currentInterview.pendingDrawCount + automaticDrawCount,
      slots: nextSlots,
    },
  };
}

export function drawInterviewCard(state: AppState): AppState {
  if (!state.currentInterview || !state.data || !state.run || state.screen !== "interview") {
    return state;
  }

  const hasQueuedDraw = state.currentInterview.pendingDrawCount > 0;
  const canAffordPaidDraw = state.run.energy >= INTERVIEW_PAID_DRAW_ENERGY_COST;

  if (!hasQueuedDraw && !canAffordPaidDraw) {
    return state;
  }

  const { drawnCards, remainingDrawPile } = drawCards(state.currentInterview.drawPile, 1, getCard(state.data, "yap"));
  const [nextCard] = drawnCards;
  const nextHand = [nextCard, ...state.currentInterview.hand];
  const spentEnergy = hasQueuedDraw ? 0 : INTERVIEW_PAID_DRAW_ENERGY_COST;
  const nextPendingDrawCount = hasQueuedDraw ? state.currentInterview.pendingDrawCount - 1 : 0;

  return {
    ...state,
    run: {
      ...state.run,
      energy: Math.max(0, state.run.energy - spentEnergy),
    },
    currentInterview: {
      ...state.currentInterview,
      drawPile: remainingDrawPile,
      hand: nextHand,
      handPage: clampHandPage(nextHand.length, state.currentInterview.handPage),
      pendingDrawCount: nextPendingDrawCount,
    },
  };
}

export function retrieveDiscardPileCard(state: AppState, discardIndex: number): AppState {
  if (
    !state.currentInterview ||
    state.screen !== "interview" ||
    state.isTurnResolving ||
    state.currentInterview.isInterviewerDefeated ||
    state.currentInterview.isPlayerRejected ||
    state.currentInterview.victoryResult ||
    state.currentInterview.rejectionLetter ||
    state.currentInterview.discardPullsLeft < 1 ||
    discardIndex < 0 ||
    discardIndex >= state.currentInterview.discardPile.length
  ) {
    return state;
  }

  const retrievedCard = state.currentInterview.discardPile[discardIndex];
  const nextDiscardPile = state.currentInterview.discardPile.filter((_, index) => index !== discardIndex);
  const nextHand = [retrievedCard, ...state.currentInterview.hand];

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      discardPile: nextDiscardPile,
      discardPullsLeft: state.currentInterview.discardPullsLeft - 1,
      hand: nextHand,
      handPage: 0,
    },
  };
}

export function buffInterviewerAtkForOvertime(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      currentInterviewerAtk: Math.max(0, Math.ceil(state.currentInterview.currentInterviewerAtk * 1.25)),
    },
  };
}

function chooseNextInterviewer(
  data: GameData,
  run: Run,
  defeatedInterviewerIds: InterviewerId[],
): Interviewer | null {
  const pool = data.interviewers.filter(
    ({ id, debut, retire }) =>
      !defeatedInterviewerIds.includes(id) && debut <= run.roundsPassed && run.roundsPassed < retire,
  );

  const fallbackPool = pool.length ? pool : data.interviewers;

  if (!fallbackPool.length) {
    return null;
  }

  const interviewerIndex = Math.floor(Math.random() * fallbackPool.length);

  return fallbackPool[interviewerIndex];
}

function applyConnectionEffects(
  data: GameData,
  run: Run,
  deck: Card[],
  connection: Connection,
  networkSize: number,
  traits: Trait[] = [],
): { run: Run; deck: Card[] } {
  const traitIds = traits.map((trait) => trait.id);
  const connectionCost = getConnectionCost(data, run, connection, networkSize, traitIds);
  const nextRun: Run = {
    ...run,
    sanity: run.sanity - connectionCost,
  };
  let nextDeck = deck;

  // ON CONNECT HERE
  if (connection.id === "doofenshmirtz") {
    nextRun.baseAtk += 4;
  }
  if (connection.id === "pingli") {
    nextRun.baseAtk += 4;
  }
  if (connection.id === "turner") {
    nextRun.baseAtk += 4;
  }
  if (connection.id === "gurovic") {
    nextRun.baseAtk += 4;
  }
  if (connection.id === "kishore") {
    nextRun.baseAtk += 4;
  }
  if (connection.id === "spiderman") {
    nextRun.baseAtk += 8;
  }
  if (connection.id === "johnwick") {
    nextRun.baseAtk += 8;
  }
  if (connection.id === "hitman") {
    nextRun.baseAtk += 8;
  }
  if (connection.id === "murphy") {
    nextRun.maxHP += 20;
    nextRun.hp += 20;
  }
  if (connection.id === "applejack") {
    nextRun.maxHP += 20;
    nextRun.hp += 20;
  }
  if (connection.id === "homer") {
    nextRun.maxHP += 20;
    nextRun.hp += 20;
  }
  if (connection.id === "noe") {
    nextRun.maxEnergy += 2;
    nextRun.energy = nextRun.maxEnergy;
  }
  if (connection.id === "lou") {
    nextRun.maxEnergy += 2;
    nextRun.energy = nextRun.maxEnergy;
  }
  if (connection.id === "henry-yu") {
    nextRun.maxEnergy += 2;
    nextRun.energy = nextRun.maxEnergy;
  }
  if (connection.id === "potter") {
    nextRun.baseShield += 4;
  }
  if (connection.id === "dave") {
    nextRun.baseShield += 4;
  }
  if (connection.id === "hopps") {
    nextRun.baseShield += 4;
  }
  if (connection.id === "shrek") {
    nextRun.baseShield += 8;
  }
  if (connection.id === "ash") {
    nextRun.slotEnergyRefills = [...nextRun.slotEnergyRefills];
    if (nextRun.slotEnergyRefills.length > 0) {
      nextRun.slotEnergyRefills[0] += 1;
    }
  }
  if (connection.id === "epstein") {
    nextRun.connectDiscount *= 0.8;
    nextRun.networkCapacity += 2;
  }
  if (connection.id === "tourist") {
    nextRun.packDiscount *= 0.8;
    nextRun.deckCapacity += 2;
  }
  if (connection.id === "kevin") {
    nextRun.cardRemovals += 2;
  }
  if (connection.id === "artem") {
    nextRun.cardRemovals += 2;
  }
  if (connection.id === "raymond") {
    nextRun.cardRemovals += 2;
  }
  if (connection.id === "rocky") {
    nextRun.cardRemovals += 4;
  }
  if (connection.id === "leshy") {
    nextRun.cardRemovals += 4;
  }
  if (connection.id === "dora") {
    nextRun.initialInterviewHandSize += 2;
  }
  if (connection.id === "ted") {
    nextRun.initialInterviewHandSize += 2;
  }
  if (connection.id === "freddy") {
    nextRun.interviewBonusTurns += 2;
  }
  if (connection.id === "wario") {
    nextRun.interviewBonusTurns += 2;
  }
  if (connection.id === "dio") {
    nextRun.interviewBonusTurns += 4;
  }
  if (connection.id === "leonardo") {
    nextRun.shieldResetTurns += 1;
  }
  if (connection.id === "lancelot") {
    nextRun.shieldResetTurns += 2;
  }
  if (connection.id === "santa") {
    nextRun.itemCapacity += 1;
  }
  if (connection.id === "marquise") {
    nextRun.discardPullsPerInterview += 1;
  }
  if (connection.id === "churchill") {
    nextRun.sanity += 300;
    const yapCard = getCard(data, "yap");
    nextDeck = [yapCard, yapCard, ...nextDeck];
  }
  if (connection.id === "rustam") {
    nextRun.sanity += 300;
  }

  for (const trait of traits) {
    nextRun.maxHP = Math.max(1, nextRun.maxHP + trait.hp);
    nextRun.hp = Math.min(nextRun.hp, nextRun.maxHP);
    nextRun.baseAtk = Math.max(0, nextRun.baseAtk + trait.attack);
    nextRun.maxEnergy = Math.max(0, nextRun.maxEnergy + trait.energy);
    nextRun.energy = Math.min(nextRun.energy, nextRun.maxEnergy);
    nextRun.baseShield = Math.max(0, nextRun.baseShield + trait.shield);
  }
  
  return {
    run: nextRun,
    deck: nextDeck,
  };
}

export function connectToSuggestion(state: AppState, connectionId: ConnectionId): AppState {
  const data = requireData(state);

  if (!state.run || state.connectedConnectionIds.includes(connectionId) || state.retiredConnectionIds.includes(connectionId)) {
    return state;
  }

  const suggestion = state.shopSuggestions.find(({ id }) => id === connectionId);

  if (!suggestion) {
    return state;
  }

  const connection = getConnection(data, connectionId);
  const traits = suggestion.traitIds.map((traitId) => getTrait(data, traitId));
  const connectionCost = getConnectionCost(data, state.run, suggestion, state.connectedConnectionIds.length, suggestion.traitIds);

  if (state.run.sanity < connectionCost) {
    return state;
  }

  const effects = applyConnectionEffects(data, state.run, state.deck, connection, state.connectedConnectionIds.length, traits);

  return {
    ...state,
    run: effects.run,
    deck: effects.deck,
    connectedConnectionIds: [...state.connectedConnectionIds, connectionId],
  };
}

export function refreshShopSuggestions(state: AppState): AppState {
  const data = requireData(state);

  if (!state.run || state.run.sanity < state.run.refreshCost) {
    return state;
  }

  const nextRun: Run = {
    ...state.run,
    sanity: state.run.sanity - state.run.refreshCost,
    refreshCost: state.run.refreshCost + SHOP_REFRESH_COST_STEP,
  };

  return {
    ...state,
    run: nextRun,
    shopSuggestions: buildShopSuggestions(data, state.connectedConnectionIds, state.retiredConnectionIds, nextRun),
  };
}

export function purchaseLinkedOutTier(state: AppState, tier: LinkedOutTier): AppState {
  const data = requireData(state);

  if (!state.run) {
    return state;
  }

  if (tier === "premium") {
    if (state.run.linkedOutTier !== "none" || state.run.sanity < 200) {
      return state;
    }

    const nextRun: Run = {
      ...state.run,
      sanity: state.run.sanity - 200,
      connectionTraitChance: Math.max(0, state.run.connectionTraitChance - 0.05),
      networkCapacity: state.run.networkCapacity + 5,
      linkedOutTier: "premium",
    };

    return {
      ...state,
      run: nextRun,
      shopSuggestions: extendShopSuggestions(
        data,
        state.connectedConnectionIds,
        state.retiredConnectionIds,
        state.shopSuggestions,
        nextRun,
      ),
    };
  }

  if (tier === "platinum") {
    if (state.run.linkedOutTier !== "premium" || state.run.sanity < 400) {
      return state;
    }

    const nextRun: Run = {
      ...state.run,
      sanity: state.run.sanity - 400,
      connectionTraitChance: Math.max(0, state.run.connectionTraitChance - 0.05),
      networkCapacity: state.run.networkCapacity + 5,
      linkedOutTier: "platinum",
    };

    return {
      ...state,
      run: nextRun,
      shopSuggestions: extendShopSuggestions(
        data,
        state.connectedConnectionIds,
        state.retiredConnectionIds,
        state.shopSuggestions,
        nextRun,
      ),
    };
  }

  return state;
}

export function purchaseBoosterPack(state: AppState, boosterPackId: BoosterPackId): AppState {
  const data = requireData(state);

  if (!state.run) {
    return state;
  }

  const boosterPack = getBoosterPack(data, boosterPackId);

  if (isBoosterPackLocked(state.run, boosterPack)) {
    return state;
  }

  if (isBrainCapacityFull(state.run)) {
    return state;
  }

  const boosterPackCost = getBoosterPackCost(state.run, boosterPack, state.deck.length);

  if (state.run.sanity < boosterPackCost) {
    return state;
  }

  const openedCards = openBoosterPack(data, boosterPack);

  return {
    ...state,
    run: {
      ...state.run,
      sanity: state.run.sanity - boosterPackCost,
      usedBrainCapacity: Math.min(state.run.brainCapacity, state.run.usedBrainCapacity + 1),
    },
    buffer: [...openedCards, ...state.buffer],
  };
}

export function purchaseItem(state: AppState, itemId: ItemId): AppState {
  if (!state.run || state.screen !== "shop") {
    return state;
  }

  const suggestionIndex = state.itemSuggestions.findIndex((suggestion) => suggestion.id === itemId);
  const item = suggestionIndex >= 0 ? state.itemSuggestions[suggestionIndex] : undefined;
  const itemCost =
    item && suggestionIndex >= 0 ? getAwazonItemCost(state.run, state.connectedConnectionIds, suggestionIndex, item) : null;

  if (!item || itemCost === null || state.run.sanity < itemCost || state.items.length >= getItemCapacity(state.run)) {
    return state;
  }

  return {
    ...state,
    run: {
      ...state.run,
      sanity: state.run.sanity - itemCost,
    },
    items: [...state.items, item],
  };
}

export function purchaseAwazonPrime(state: AppState): AppState {
  const data = requireData(state);

  if (state.screen !== "shop" || !state.run || state.run.hasAwazonPrime || state.run.sanity < AWAZON_PRIME_COST) {
    return state;
  }

  const nextRun: Run = {
    ...state.run,
    sanity: state.run.sanity - AWAZON_PRIME_COST,
    hasAwazonPrime: true,
    itemCapacity: state.run.itemCapacity + 2,
  };

  return {
    ...state,
    run: nextRun,
    itemSuggestions: extendItemSuggestions(data, state.itemSuggestions, nextRun),
  };
}

export function purchaseLeekCodePremium(state: AppState): AppState {
  if (!state.run || state.run.hasLeekCodePremium || state.run.sanity < 400) {
    return state;
  }

  return {
    ...state,
    run: {
      ...state.run,
      sanity: state.run.sanity - 400,
      deckCapacity: state.run.deckCapacity + 5,
      hasLeekCodePremium: true,
    },
  };
}

export function canStartInterview(state: AppState): boolean {
  if (!state.data || !state.run) {
    return false;
  }

  return Boolean(chooseNextInterviewer(state.data, state.run, state.defeatedInterviewerIds));
}

export function enterInterviewArena(state: AppState): AppState {
  const data = requireData(state);

  if (!state.run) {
    return state;
  }

  const interviewer = chooseNextInterviewer(data, state.run, state.defeatedInterviewerIds);

  if (!interviewer) {
    return state;
  }

  const nextRun = {
    ...state.run,
    energy: Math.max(0, state.run.maxEnergy + state.run.interviewStartEnergyOffset),
  };
  const nextInterview = buildInterviewEncounter(data, nextRun, interviewer, state.deck, state.connectedConnectionIds);

  return {
    ...state,
    screen: "interview",
    run: nextRun,
    currentInterview: nextInterview,
    isDeckOpen: false,
    isNetworkOpen: false,
    isDiscardPileOpen: false,
    isItemsOpen: false,
    isSanityCounterDimmed: false,
    isShieldCounterDimmed: false,
    isTurnResolving: false,
    predictedPlayerDamage: null,
    isOfferResultsVisible: false,
    activeInterviewSlotIndex: null,
    isPlayerDamageFlashActive: false,
    isInterviewerDisabled: nextInterview.skipTurns > 0,
    isInterviewerDamageFlashActive: false,
  };
}

export function markInterviewerDefeated(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      isInterviewerDefeated: true,
    },
  };
}

export function stabilizePlayerForInterviewVictory(state: AppState): AppState {
  if (!state.run) {
    return state;
  }

  if (state.run.hp >= 1) {
    return state;
  }

  return {
    ...state,
    run: {
      ...state.run,
      hp: 1,
    },
  };
}

export function markPlayerRejected(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      isPlayerRejected: true,
    },
  };
}

function buildInterviewVictoryResult(
  state: AppState,
  rejectionPreventedBy: string | null = null,
): InterviewVictoryResult {
  if (!state.data || !state.run || !state.currentInterview) {
    throw new Error("Cannot build interview results without game data, run, and interview state.");
  }
  
  let bonusPerTurn = 25;
  const timeBonusConnectionIds: ConnectionId[] = [];
  const flatBonusConnectionIds: ConnectionId[] = [];
  if (state.run.character === "max") {
    bonusPerTurn = 50;
  }
  if (state.connectedConnectionIds.includes("peppino")) {
    bonusPerTurn += 25;
    timeBonusConnectionIds.push("peppino");
  }
  if (state.connectedConnectionIds.includes("posh")) {
    bonusPerTurn += 25;
    timeBonusConnectionIds.push("posh");
  }

  const rewardScale = getInterviewRewardScale(state.data, state.run);
  const sanityReward = Math.round(200 * rewardScale);
  const turnsLeft = Math.max(0, state.currentInterview.turnsRemaining);
  let timeBonus = 0;
  if (!rejectionPreventedBy) {
    const bonusTurns = Math.min(turnsLeft, TIME_BONUS_TURN_CAP);
    timeBonus = bonusTurns * bonusPerTurn;
  }
  const subtotal = sanityReward + timeBonus;
  let total = subtotal;

  if (state.connectedConnectionIds.includes("rustam")) {
    total -= 75;
    flatBonusConnectionIds.push("rustam");
  }
  if (state.connectedConnectionIds.includes("spongebob")) {
    total += 75;
    flatBonusConnectionIds.push("spongebob");
  }
  if (state.connectedConnectionIds.includes("stanley")) {
    total += 75;
    flatBonusConnectionIds.push("stanley");
  }
  if (state.connectedConnectionIds.includes("robin-hood") && state.run.sanity <= 100) {
    total += 125;
    flatBonusConnectionIds.push("robin-hood");
  }
  if (state.connectedConnectionIds.includes("white-rabbit") && !state.currentInterview.hasSentTimeoutDialog && !rejectionPreventedBy) {
    total += 150;
    flatBonusConnectionIds.push("white-rabbit");
  }
  if (state.connectedConnectionIds.includes("tink")) {
    total += 175;
    flatBonusConnectionIds.push("tink");
  }
  if (state.connectedConnectionIds.includes("mrbeast")) {
    total += 350;
    flatBonusConnectionIds.push("mrbeast");
  }
  if (state.connectedConnectionIds.includes("gihun") && state.run.gihunInterviewsSurvived >= 2) {
    total += 500;
    flatBonusConnectionIds.push("gihun");
  }

  return {
    sanityReward,
    turnsLeft,
    timeBonus,
    connectionsBonus: total - subtotal,
    totalSanityGain: total,
    rejectionPreventedBy,
    timeBonusConnectionIds,
    flatBonusConnectionIds,
  };
}

function buildInterviewRejectionLetter(): string[] {
  return [
    "Thank you for taking the time to interview for the Software Engineer position. We sincerely appreciate your interest in our team and the effort you invested throughout the process.",
    "After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs. This was not an easy decision, as we were fortunate to speak with many talented applicants.",
    "We were especially grateful for the perspective you brought to the conversation and for the thoughtfulness you showed during the interview. Your background is clearly promising, and this outcome should not be taken as a reflection of your long-term potential.",
    "The hiring market is highly competitive, and small differences in timing, fit, and team priorities often influence decisions in ways that are difficult to capture in a single conversation. We encourage you to continue building, learning, and applying with confidence.",
    "We wish you the very best in your search and hope you will consider reapplying for future Software Engineer opportunities."
  ];
}

export function disconnectInterviewRejected(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  if (!state.currentInterview.isPlayerRejected || state.currentInterview.rejectionLetter) {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      rejectionLetter: buildInterviewRejectionLetter(),
    },
  };
}

function getRejectionPreventionConnection(state: AppState): Connection | null {
  if (!state.data) {
    return null;
  }

  for (const connectionId of REJECTION_PREVENTION_CONNECTION_IDS) {
    if (!state.connectedConnectionIds.includes(connectionId)) {
      continue;
    }

    return getConnection(state.data, connectionId);
  }

  return null;
}

export function preventInterviewRejection(state: AppState): AppState {
  if (!state.run || !state.currentInterview || state.screen !== "interview") {
    return state;
  }

  if (!state.currentInterview.isPlayerRejected || state.currentInterview.rejectionLetter || state.currentInterview.victoryResult) {
    return state;
  }

  const savingConnection = getRejectionPreventionConnection(state);

  if (!savingConnection) {
    return state;
  }

  const interviewerId = state.currentInterview.interviewer;
  const nextDefeatedInterviewerIds = state.defeatedInterviewerIds.includes(interviewerId)
    ? state.defeatedInterviewerIds
    : [...state.defeatedInterviewerIds, interviewerId];
  const nextConnectedConnectionIds = state.connectedConnectionIds.filter((connectionId) => connectionId !== savingConnection.id);
  const nextRetiredConnectionIds = state.retiredConnectionIds.includes(savingConnection.id)
    ? state.retiredConnectionIds
    : [...state.retiredConnectionIds, savingConnection.id];
  const nextInterview: InterviewEncounter = {
    ...state.currentInterview,
    isInterviewerDefeated: true,
    isPlayerRejected: false,
    rejectionLetter: null,
  };
  const resultStateBase: AppState = {
    ...state,
    run: appendInterviewRunSummary(
      {
        ...state.run,
        gihunInterviewsSurvived: state.connectedConnectionIds.includes("gihun")
          ? state.run.gihunInterviewsSurvived + 1
          : state.run.gihunInterviewsSurvived,
        hp: Math.max(1, Math.ceil(state.run.maxHP * 0.5)),
      },
      nextInterview,
      "dnf",
    ),
    connectedConnectionIds: nextConnectedConnectionIds,
    retiredConnectionIds: nextRetiredConnectionIds,
    defeatedInterviewerIds: nextDefeatedInterviewerIds,
    currentInterview: nextInterview,
  };
  const nextStateBase: AppState = {
    ...resultStateBase,
    run: {
      ...resultStateBase.run!,
      hp: Math.max(1, Math.ceil(state.run.maxHP * 0.5)),
    },
  };

  return {
    ...nextStateBase,
    currentInterview: {
      ...nextInterview,
      victoryResult: buildInterviewVictoryResult(resultStateBase, savingConnection.name),
    },
  };
}

export function disconnectInterviewVictory(state: AppState): AppState {
  if (!state.run || !state.currentInterview || state.screen !== "interview") {
    return state;
  }

  if (!state.currentInterview.isInterviewerDefeated || state.currentInterview.victoryResult) {
    return state;
  }

  const interviewerId = state.currentInterview.interviewer;
  const nextDefeatedInterviewerIds = state.defeatedInterviewerIds.includes(interviewerId)
    ? state.defeatedInterviewerIds
    : [...state.defeatedInterviewerIds, interviewerId];
  const resultStateBase: AppState = {
    ...state,
    run: appendInterviewRunSummary(
      {
        ...state.run,
        gihunInterviewsSurvived: state.connectedConnectionIds.includes("gihun")
          ? state.run.gihunInterviewsSurvived + 1
          : state.run.gihunInterviewsSurvived,
      },
      state.currentInterview,
      state.currentInterview.hasSentTimeoutDialog ? "overtime" : "on-time",
    ),
    defeatedInterviewerIds: nextDefeatedInterviewerIds,
    currentInterview: {
      ...state.currentInterview,
    },
  };
  const nextStateBase: AppState = {
    ...resultStateBase,
    run: {
      ...resultStateBase.run!,
    },
  };

  return {
    ...nextStateBase,
    currentInterview: {
      ...state.currentInterview,
      victoryResult: buildInterviewVictoryResult(resultStateBase),
    },
  };
}

export function returnToShopAfterInterviewVictory(state: AppState): AppState {
  const data = requireData(state);

  if (!state.run || !state.currentInterview?.victoryResult) {
    return state;
  }

  const nextRun: Run = {
    ...state.run,
    sanity: state.run.sanity + state.currentInterview.victoryResult.totalSanityGain,
    energy: state.run.maxEnergy,
    roundsPassed: state.run.roundsPassed + 1,
    refreshCost: SHOP_REFRESH_BASE_COST,
    bufferRerollCost: BUFFER_REROLL_BASE_COST,
    usedBrainCapacity: 0,
  };
  const shouldRetireGihun =
    state.connectedConnectionIds.includes("gihun") && state.run.gihunInterviewsSurvived >= 2;
  let nextConnectionIds = state.connectedConnectionIds;
  let nextRetiredIds = state.retiredConnectionIds;

  if (shouldRetireGihun) {
    nextConnectionIds = state.connectedConnectionIds.filter((connectionId) => connectionId !== "gihun");
    if (!state.retiredConnectionIds.includes("gihun")) {
      nextRetiredIds = [...state.retiredConnectionIds, "gihun"];
    }
  }

  if (nextConnectionIds.includes("poppins")) {
    nextRun.cardRemovals += 1;
  }
  const nextItems = getSantaItems(data, state.items, nextRun, nextConnectionIds);
  const hasClearedRun = nextRun.roundsPassed >= getOfferTargetRounds(nextRun.difficulty);

  if (hasClearedRun) {
    return {
      ...state,
      screen: "offer",
      run: nextRun,
      items: nextItems,
      connectedConnectionIds: nextConnectionIds,
      retiredConnectionIds: nextRetiredIds,
      currentInterview: null,
      isDeckOpen: false,
      isNetworkOpen: false,
      isDiscardPileOpen: false,
      isItemsOpen: false,
      isSanityCounterDimmed: false,
      isShieldCounterDimmed: false,
      isTurnResolving: false,
      predictedPlayerDamage: null,
      isOfferResultsVisible: true,
      activeInterviewSlotIndex: null,
      isPlayerDamageFlashActive: false,
      isInterviewerDisabled: false,
      isInterviewerDamageFlashActive: false,
    };
  }

  return {
    ...state,
    screen: "shop",
    run: nextRun,
    items: nextItems,
    connectedConnectionIds: nextConnectionIds,
    retiredConnectionIds: nextRetiredIds,
    shopSuggestions: buildShopSuggestions(data, nextConnectionIds, nextRetiredIds, nextRun),
    itemSuggestions: buildItemSuggestions(data, nextRun),
    currentInterview: null,
    isDeckOpen: false,
    isNetworkOpen: false,
    isDiscardPileOpen: false,
    isItemsOpen: false,
    isSanityCounterDimmed: false,
    isShieldCounterDimmed: false,
    isTurnResolving: false,
    predictedPlayerDamage: null,
    isOfferResultsVisible: false,
    activeInterviewSlotIndex: null,
    isPlayerDamageFlashActive: false,
    isInterviewerDisabled: false,
    isInterviewerDamageFlashActive: false,
  };
}

export function reapplyAfterInterviewRejection(state: AppState): AppState {
  const data = requireData(state);

  return initializeState(data);
}

export function returnToMainMenu(state: AppState): AppState {
  const data = requireData(state);

  return initializeState(data);
}

export function appendInterviewMessage(state: AppState, message: string): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      chatMessages: [...state.currentInterview.chatMessages, message],
    },
  };
}

export function appendNextExtraDialog(state: AppState): AppState {
  if (!state.currentInterview || !state.data || state.screen !== "interview") {
    return state;
  }

  const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
  const extraDialogs = getInterviewerExtraDialogs(interviewer);
  const nextDialog = extraDialogs[state.currentInterview.extraDialogIndex];

  if (!nextDialog) {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      chatMessages: [...state.currentInterview.chatMessages, nextDialog],
      extraDialogIndex: state.currentInterview.extraDialogIndex + 1,
    },
  };
}

export function markTimeoutDialogSent(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      hasSentTimeoutDialog: true,
    },
  };
}

function appendInterviewRunSummary(
  run: Run,
  currentInterview: InterviewEncounter,
  result: "on-time" | "overtime" | "dnf",
): Run {
  return {
    ...run,
    interviewHistory: [
      ...run.interviewHistory,
      {
        interviewer: currentInterview.interviewer,
        round: run.roundsPassed + 1,
        result,
      },
    ],
  };
}

export function goToPreviousInterviewHandPage(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview" || state.currentInterview.handPage <= 0) {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      handPage: state.currentInterview.handPage - 1,
    },
  };
}

export function goToNextInterviewHandPage(state: AppState): AppState {
  if (!state.currentInterview || state.screen !== "interview") {
    return state;
  }

  const maxPage = getHandPageCount(state.currentInterview.hand.length) - 1;

  if (state.currentInterview.handPage >= maxPage) {
    return state;
  }

  return {
    ...state,
    currentInterview: {
      ...state.currentInterview,
      handPage: state.currentInterview.handPage + 1,
    },
  };
}

export function placeHandCardInSlot(state: AppState, handIndex: number): AppState {
  if (!state.currentInterview || !state.run || state.screen !== "interview") {
    return state;
  }

  const { hand, slots } = state.currentInterview;
  const freeSlotIndex = slots.findIndex((slot) => slot === null);
  const filledSlotCount = slots.filter((slot) => slot !== null).length;

  if (handIndex < 0 || handIndex >= hand.length || freeSlotIndex === -1) {
    return state;
  }

  if (state.currentInterview.interviewer === "old-guy" && filledSlotCount >= 2) {
    return state;
  }

  const card = hand[handIndex];

  if (state.currentInterview.interviewer === "depressed-guy" && card.type === "Charm") {
    return state;
  }

  if (state.run.energy < card.energyCost) {
    return state;
  }

  const nextHand = hand.filter((_, index) => index !== handIndex);
  const nextSlots = [...slots];

  nextSlots[freeSlotIndex] = card;

  return {
    ...state,
    run: {
      ...state.run,
      energy: state.run.energy - card.energyCost,
    },
    currentInterview: {
      ...state.currentInterview,
      hand: nextHand,
      handPage: clampHandPage(nextHand.length, state.currentInterview.handPage),
      slots: nextSlots,
    },
  };
}

export function returnSlottedCardToHand(state: AppState, slotIndex: number): AppState {
  if (!state.currentInterview || !state.run || state.screen !== "interview") {
    return state;
  }

  const { slots } = state.currentInterview;

  if (slotIndex < 0 || slotIndex >= slots.length || !slots[slotIndex]) {
    return state;
  }

  const card = slots[slotIndex];
  const nextFilledSlots = slots.filter(
    (slottedCard, index): slottedCard is Card => index !== slotIndex && slottedCard !== null,
  );
  const nextSlots = [
    ...nextFilledSlots,
    ...Array.from({ length: slots.length - nextFilledSlots.length }, () => null),
  ];

  return {
    ...state,
    run: {
      ...state.run,
      energy: Math.min(state.run.maxEnergy, state.run.energy + card.energyCost),
    },
    currentInterview: {
      ...state.currentInterview,
      hand: [card, ...state.currentInterview.hand],
      handPage: 0,
      slots: nextSlots,
    },
  };
}

export function addBufferCardToDeck(state: AppState, bufferIndex: number): AppState {
  if (bufferIndex < 0 || bufferIndex >= state.buffer.length) {
    return state;
  }

  const bufferCard = state.buffer[bufferIndex];
  const nextBuffer = state.buffer.filter((_, index) => index !== bufferIndex);

  return {
    ...state,
    deck: [bufferCard, ...state.deck],
    buffer: nextBuffer,
  };
}

export function rerollBufferCard(state: AppState, bufferIndex: number): AppState {
  const data = requireData(state);

  if (!state.run || bufferIndex < 0 || bufferIndex >= state.buffer.length || state.run.sanity < state.run.bufferRerollCost) {
    return state;
  }

  const currentCard = state.buffer[bufferIndex];
  const matchingCards = data.cards.filter(
    (card) => card.rarity === currentCard.rarity && card.type === currentCard.type,
  );

  if (!matchingCards.length) {
    return state;
  }

  const alternativeCards = matchingCards.filter(({ id }) => id !== currentCard.id);
  const rerollPool = alternativeCards.length ? alternativeCards : matchingCards;
  const rerolledCard = rerollPool[Math.floor(Math.random() * rerollPool.length)];
  const nextBuffer = state.buffer.map((card, index) => (index === bufferIndex ? rerolledCard : card));

  return {
    ...state,
    run: {
      ...state.run,
      sanity: state.run.sanity - state.run.bufferRerollCost,
      bufferRerollCost: state.run.bufferRerollCost + BUFFER_REROLL_COST_STEP,
    },
    buffer: nextBuffer,
  };
}

export function removeDeckCard(state: AppState, deckIndex: number): AppState {
  if (!state.run || state.run.cardRemovals < 1 || deckIndex < 0 || deckIndex >= state.deck.length) {
    return state;
  }

  return {
    ...state,
    deck: state.deck.filter((_, index) => index !== deckIndex),
    run: {
      ...state.run,
      cardRemovals: state.run.cardRemovals - 1,
    },
  };
}

export function removeItem(state: AppState, itemIndex: number): AppState {
  if (state.screen !== "shop" || itemIndex < 0 || itemIndex >= state.items.length) {
    return state;
  }

  return {
    ...state,
    items: state.items.filter((_, index) => index !== itemIndex),
  };
}

export function consumeItem(state: AppState, itemIndex: number): AppState {
  if (
    !state.run ||
    !state.data ||
    !state.currentInterview ||
    state.screen !== "interview" ||
    state.isTurnResolving ||
    state.currentInterview.isInterviewerDefeated ||
    state.currentInterview.isPlayerRejected ||
    state.currentInterview.victoryResult ||
    state.currentInterview.rejectionLetter ||
    itemIndex < 0 ||
    itemIndex >= state.items.length
  ) {
    return state;
  }

  const item = state.items[itemIndex];
  const nextItems = state.items.filter((_, index) => index !== itemIndex);
  const nextRun: Run = {
    ...state.run,
  };
  const nextInterview: InterviewEncounter = {
    ...state.currentInterview,
  };

  if (item.id === "energy-drink") {
    const energyAfterItem = Math.max(0, nextRun.energy + 3);
    const wastedEnergy = Math.max(0, energyAfterItem - nextRun.maxEnergy);

    nextRun.energy = Math.min(nextRun.maxEnergy, energyAfterItem);
    if (state.connectedConnectionIds.includes("robbie") && wastedEnergy > 0) {
      nextRun.sanity += wastedEnergy * 15;
    }
  }
  if (item.id === "chocolate-bar") {
    nextInterview.pendingDrawCount += 2;
  }
  if (item.id === "instant-coffee") {
    const interviewer = getInterviewer(state.data, nextInterview.interviewer);
    nextInterview.turnsUntilAttack = Math.max(0, interviewer.delays[nextInterview.currentPhase]);
    nextInterview.interviewerMissProbability = 1;
  }
  if (item.id === "canned-salmon") {
    nextInterview.currentShield = Math.max(0, nextInterview.currentShield + 50);
  }
  if (item.id === "minty-gum") {
    nextInterview.currentAtk = Math.max(0, nextInterview.currentAtk + 30);
  }
  if (item.id === "herbal-tea") {
    nextRun.hp = Math.min(nextRun.maxHP, nextRun.hp + 30);
  }

  return {
    ...state,
    run: nextRun,
    currentInterview: nextInterview,
    items: nextItems,
  };
}

export function selectCharacter(state: AppState, characterId: CharacterId): AppState {
  const data = requireData(state);
  const nextState: AppState = {
    ...state,
    selectedCharacterId: characterId,
  };

  if (state.screen !== "setup" || !nextState.selectedDifficultyId) {
    return nextState;
  }

  return {
    ...nextState,
    run: buildRun(data, characterId, nextState.selectedDifficultyId),
  };
}

export function selectDifficulty(state: AppState, difficultyId: DifficultyId): AppState {
  const data = requireData(state);
  const nextState: AppState = {
    ...state,
    selectedDifficultyId: difficultyId,
  };

  if (state.screen !== "setup" || !nextState.selectedCharacterId) {
    return nextState;
  }

  return {
    ...nextState,
    run: buildRun(data, nextState.selectedCharacterId, difficultyId),
  };
}
