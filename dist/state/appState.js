export const INTERVIEW_HAND_PAGE_SIZE = 5;
export const DEFAULT_INITIAL_INTERVIEW_HAND_SIZE = 5;
export const DEFAULT_INTERVIEW_SLOT_COUNT = 3;
export const DEFAULT_BASE_SHIELD = 0;
export const DEFAULT_SHIELD_RESET_TURNS = 1;
export const DEFAULT_CARDS_DRAW_PER_TURN = 1;
export const INTERVIEW_PAID_DRAW_ENERGY_COST = 3;
const BRAIN_CAPACITY_UPGRADE_COSTS = [50, 200];
const TOUCHING_GRASS_UPGRADE_COST = 50;
const TOUCHING_GRASS_UPGRADE_LIMIT = 5;
const TOUCHING_GRASS_REMOVAL_BASE_COST = 50;
const TOUCHING_GRASS_REMOVAL_COST_STEP = 25;
const TOUCHING_GRASS_REMOVAL_LIMIT = 5;
const REJECTION_PREVENTION_CONNECTION_IDS = ["asgore", "marquise"];
export function createInitialState() {
    return {
        screen: "loading",
        data: null,
        selectedCharacterId: null,
        selectedDifficultyId: null,
        run: null,
        deck: [],
        buffer: [],
        connectedConnectionIds: [],
        retiredConnectionIds: [],
        defeatedInterviewerIds: [],
        shopSuggestions: [],
        currentInterview: null,
        isDeckOpen: false,
        isNetworkOpen: false,
        isDiscardPileOpen: false,
        isMusicMuted: false,
        isSanityCounterDimmed: false,
        isShieldCounterDimmed: false,
        isTurnResolving: false,
        activeInterviewSlotIndex: null,
        isPlayerDamageFlashActive: false,
        isInterviewerDisabled: false,
        isInterviewerDamageFlashActive: false,
    };
}
export function getCharacter(data, characterId) {
    const character = data.characters.find(({ id }) => id === characterId);
    if (!character) {
        throw new Error(`Unknown character: ${characterId}`);
    }
    return character;
}
export function getDifficulty(data, difficultyId) {
    const difficulty = data.difficulties.find(({ id }) => id === difficultyId);
    if (!difficulty) {
        throw new Error(`Unknown difficulty: ${difficultyId}`);
    }
    return difficulty;
}
export function getCard(data, cardId) {
    const card = data.cards.find(({ id }) => id === cardId);
    if (!card) {
        throw new Error(`Unknown card: ${cardId}`);
    }
    return card;
}
export function getConnection(data, connectionId) {
    const connection = data.connections.find(({ id }) => id === connectionId);
    if (!connection) {
        throw new Error(`Unknown connection: ${connectionId}`);
    }
    return connection;
}
export function getInterviewer(data, interviewerId) {
    const interviewer = data.interviewers.find(({ id }) => id === interviewerId);
    if (!interviewer) {
        throw new Error(`Unknown interviewer: ${interviewerId}`);
    }
    return interviewer;
}
export function getInterviewerIntroDialog(interviewer) {
    return interviewer.dialogs[0];
}
export function getInterviewerPhaseDialog(interviewer, phaseIndex) {
    const phaseDialogs = interviewer.dialogs[1];
    const safeIndex = Math.min(Math.max(phaseIndex, 0), phaseDialogs.length - 1);
    return phaseDialogs[safeIndex];
}
export function getInterviewerDefeatedDialog(interviewer) {
    return interviewer.dialogs[2];
}
export function getInterviewerTimeoutDialog(interviewer) {
    return interviewer.dialogs[3];
}
export function getInterviewerPlayerDeathDialog(interviewer) {
    return interviewer.dialogs[4];
}
export function getBoosterPack(data, boosterPackId) {
    const boosterPack = data.boosterPacks.find(({ id }) => id === boosterPackId);
    if (!boosterPack) {
        throw new Error(`Unknown booster pack: ${boosterPackId}`);
    }
    return boosterPack;
}
export function getRoundScale(data, roundsPassed) {
    const roundIndex = Math.min(Math.max(roundsPassed, 0), data.roundScales.length - 1);
    return data.roundScales[roundIndex];
}
export function getScaledInterviewerHP(data, run, interviewer, phaseIndex) {
    const [hpScale] = getRoundScale(data, run.roundsPassed);
    return Math.max(1, Math.round(interviewer.hps[phaseIndex] * hpScale));
}
export function getScaledInterviewerAtk(data, run, interviewer, phaseIndex) {
    const [, atkScale] = getRoundScale(data, run.roundsPassed);
    return Math.max(1, Math.round(interviewer.atks[phaseIndex] * atkScale));
}
export function getInterviewerShield(interviewer, phaseIndex) {
    return Math.max(0, interviewer.shields[phaseIndex] ?? 0);
}
export function getInterviewRewardScale(data, run) {
    const [, , rewardScale] = getRoundScale(data, run.roundsPassed);
    return Math.max(0, rewardScale);
}
function requireData(state) {
    if (!state.data) {
        throw new Error("Game data not loaded.");
    }
    return state.data;
}
export function requireSelection(state) {
    if (!state.selectedCharacterId || !state.selectedDifficultyId) {
        throw new Error("Selection not initialized.");
    }
    return {
        characterId: state.selectedCharacterId,
        difficultyId: state.selectedDifficultyId,
    };
}
export function buildRun(data, characterId, difficultyId) {
    const character = getCharacter(data, characterId);
    const connectDiscount = character.id === "tatar" ? 0.9 : 1;
    const packDiscount = character.id === "tatar" ? 0.9 : character.id === "ekaterina" ? 1.1 : 1;
    return {
        character: character.id,
        hp: character.maxHP,
        maxHP: character.maxHP,
        energy: character.maxEnergy,
        maxEnergy: character.maxEnergy,
        baseAtk: character.baseAtk,
        baseShield: character.baseShield,
        shieldResetTurns: DEFAULT_SHIELD_RESET_TURNS,
        interviewBonusTurns: 0,
        sanity: character.sanity,
        interviewStartEnergyOffset: 0,
        initialInterviewHandSize: DEFAULT_INITIAL_INTERVIEW_HAND_SIZE,
        interviewSlotCount: DEFAULT_INTERVIEW_SLOT_COUNT,
        slotEnergyRefills: Array.from({ length: DEFAULT_INTERVIEW_SLOT_COUNT }, () => 1),
        cardsDrawPerTurn: DEFAULT_CARDS_DRAW_PER_TURN,
        difficulty: difficultyId,
        roundsPassed: 0,
        refreshCost: 50,
        bufferRerollCost: 25,
        connectDiscount,
        packDiscount,
        gihunInterviewsSurvived: 0,
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
        linkedOutTier: "none",
    };
}
export function buildDeck(data) {
    return data.startingDeck.map((cardId) => getCard(data, cardId));
}
export function getConnectionCost(run, connection) {
    return Math.max(0, Math.floor(connection.price * run.connectDiscount));
}
export function getBoosterPackCost(run, boosterPack) {
    return Math.max(0, Math.floor(boosterPack.cost * run.packDiscount));
}
export function isBrainCapacityFull(run) {
    return run.usedBrainCapacity >= Math.max(0, run.brainCapacity);
}
export function getBrainCapacityUpgradeCost(run) {
    return BRAIN_CAPACITY_UPGRADE_COSTS[run.brainCapacityUpgradesPurchased] ?? null;
}
export function getTouchingGrassRemovalCost(run) {
    if (run.removalUpgradesPurchased >= TOUCHING_GRASS_REMOVAL_LIMIT) {
        return null;
    }
    return TOUCHING_GRASS_REMOVAL_BASE_COST + TOUCHING_GRASS_REMOVAL_COST_STEP * run.removalUpgradesPurchased;
}
export function purchaseBrainCapacityUpgrade(state) {
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
export function purchaseTouchingGrassUpgrade(state, stat) {
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
export function purchaseTouchingGrassRemoval(state) {
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
export function isBoosterPackLocked(run, boosterPack) {
    if (run.hasLeekCodePremium) {
        return false;
    }
    return boosterPack.epic > 0 || boosterPack.legendary > 0;
}
export function getSuggestionCount(run) {
    if (run.linkedOutTier === "platinum") {
        return 4;
    }
    if (run.linkedOutTier === "premium") {
        return 3;
    }
    return 2;
}
export function canSeeLegendaryConnections(run) {
    return run.linkedOutTier === "platinum";
}
function getSuggestionPool(data, connectedConnectionIds, retiredConnectionIds, allowLegendary, excludedConnectionIds = []) {
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
export function getEligibleSuggestionCount(data, connectedConnectionIds, retiredConnectionIds, run) {
    return getSuggestionPool(data, connectedConnectionIds, retiredConnectionIds, canSeeLegendaryConnections(run)).length;
}
export function buildShopSuggestions(data, connectedConnectionIds, retiredConnectionIds, run) {
    const pool = getSuggestionPool(data, connectedConnectionIds, retiredConnectionIds, canSeeLegendaryConnections(run));
    const shuffled = [...pool];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled.slice(0, getSuggestionCount(run));
}
export function extendShopSuggestions(data, connectedConnectionIds, retiredConnectionIds, currentSuggestions, run) {
    const targetCount = getSuggestionCount(run);
    if (currentSuggestions.length >= targetCount) {
        return currentSuggestions.slice(0, targetCount);
    }
    const pool = getSuggestionPool(data, connectedConnectionIds, retiredConnectionIds, canSeeLegendaryConnections(run), currentSuggestions.map(({ id }) => id));
    const shuffled = [...pool];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return [...currentSuggestions, ...shuffled.slice(0, targetCount - currentSuggestions.length)];
}
export function initializeState(data) {
    return {
        screen: "home",
        data,
        selectedCharacterId: data.characters[0]?.id ?? null,
        selectedDifficultyId: data.difficulties[0]?.id ?? null,
        run: null,
        deck: buildDeck(data),
        buffer: [],
        connectedConnectionIds: [],
        retiredConnectionIds: [],
        defeatedInterviewerIds: [],
        shopSuggestions: [],
        currentInterview: null,
        isDeckOpen: false,
        isNetworkOpen: false,
        isDiscardPileOpen: false,
        isMusicMuted: false,
        isSanityCounterDimmed: false,
        isShieldCounterDimmed: false,
        isTurnResolving: false,
        activeInterviewSlotIndex: null,
        isPlayerDamageFlashActive: false,
        isInterviewerDisabled: false,
        isInterviewerDamageFlashActive: false,
    };
}
export function createErrorState(previous) {
    return {
        ...previous,
        screen: "error",
    };
}
export function startNewRun(state) {
    const data = requireData(state);
    const { characterId, difficultyId } = requireSelection(state);
    return {
        ...state,
        screen: "setup",
        run: buildRun(data, characterId, difficultyId),
        deck: buildDeck(data),
        buffer: [],
        connectedConnectionIds: [],
        retiredConnectionIds: [],
        defeatedInterviewerIds: [],
        shopSuggestions: [],
        currentInterview: null,
        isDeckOpen: false,
        isNetworkOpen: false,
        isDiscardPileOpen: false,
        isSanityCounterDimmed: false,
        isShieldCounterDimmed: false,
        isTurnResolving: false,
        activeInterviewSlotIndex: null,
        isPlayerDamageFlashActive: false,
        isInterviewerDisabled: false,
        isInterviewerDamageFlashActive: false,
    };
}
export function enterShop(state) {
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
            bufferRerollCost: 25,
        },
        shopSuggestions: buildShopSuggestions(data, state.connectedConnectionIds, state.retiredConnectionIds, state.run),
        currentInterview: null,
        isDeckOpen: false,
        isNetworkOpen: false,
        isDiscardPileOpen: false,
        isSanityCounterDimmed: false,
        isShieldCounterDimmed: false,
        isTurnResolving: false,
        activeInterviewSlotIndex: null,
        isPlayerDamageFlashActive: false,
        isInterviewerDisabled: false,
        isInterviewerDamageFlashActive: false,
    };
}
function setOpenPanel(state, panel) {
    return {
        ...state,
        isDeckOpen: panel === "deck",
        isNetworkOpen: panel === "network",
        isDiscardPileOpen: panel === "discard",
    };
}
export function toggleDeck(state) {
    return setOpenPanel(state, state.isDeckOpen ? null : "deck");
}
export function toggleNetwork(state) {
    return setOpenPanel(state, state.isNetworkOpen ? null : "network");
}
export function toggleDiscardPile(state) {
    return setOpenPanel(state, state.isDiscardPileOpen ? null : "discard");
}
export function toggleMusicMuted(state) {
    return {
        ...state,
        isMusicMuted: !state.isMusicMuted,
    };
}
export function toggleShieldCounter(state) {
    return {
        ...state,
        isShieldCounterDimmed: !state.isShieldCounterDimmed,
    };
}
export function toggleSanityCounter(state) {
    return {
        ...state,
        isSanityCounterDimmed: !state.isSanityCounterDimmed,
    };
}
export function setInterviewTurnResolving(state, isTurnResolving) {
    return {
        ...state,
        isTurnResolving,
    };
}
export function setActiveInterviewSlotIndex(state, activeInterviewSlotIndex) {
    return {
        ...state,
        activeInterviewSlotIndex,
    };
}
export function setPlayerDamageFlashActive(state, isPlayerDamageFlashActive) {
    return {
        ...state,
        isPlayerDamageFlashActive,
    };
}
export function setInterviewerDamageFlashActive(state, isInterviewerDamageFlashActive) {
    return {
        ...state,
        isInterviewerDamageFlashActive,
    };
}
export function setInterviewerDisabled(state, isInterviewerDisabled) {
    return {
        ...state,
        isInterviewerDisabled,
    };
}
function drawCardsByRarity(data, rarity, boosterPackType, count) {
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
function openBoosterPack(data, boosterPack) {
    return [
        ...drawCardsByRarity(data, "common", boosterPack.type, boosterPack.common),
        ...drawCardsByRarity(data, "rare", boosterPack.type, boosterPack.rare),
        ...drawCardsByRarity(data, "epic", boosterPack.type, boosterPack.epic),
        ...drawCardsByRarity(data, "legendary", boosterPack.type, boosterPack.legendary),
    ];
}
function shuffleCards(cards) {
    const shuffled = [...cards];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}
function drawCards(drawPile, count, fallbackCard) {
    const drawnCards = drawPile.slice(0, count);
    const fallbackCount = Math.max(0, count - drawnCards.length);
    return {
        drawnCards: [...drawnCards, ...Array.from({ length: fallbackCount }, () => fallbackCard)],
        remainingDrawPile: drawPile.slice(count),
    };
}
function getHandPageCount(handLength) {
    return Math.max(1, Math.ceil(handLength / INTERVIEW_HAND_PAGE_SIZE));
}
function clampHandPage(handLength, handPage) {
    return Math.min(Math.max(handPage, 0), getHandPageCount(handLength) - 1);
}
export function buildInterviewSlotEnergyRefills(run) {
    return Array.from({ length: Math.max(0, run.interviewSlotCount) }, (_, index) => Math.max(0, run.slotEnergyRefills[index] ?? 1));
}
function buildInterviewEncounter(data, run, interviewer, deck, connectedConnectionIds) {
    const shuffledDeck = shuffleCards(deck);
    const { drawnCards, remainingDrawPile } = drawCards(shuffledDeck, run.initialInterviewHandSize, getCard(data, "yap"));
    const slots = Array.from({ length: run.interviewSlotCount }, () => null);
    const turnsRemaining = interviewer.timeLimit + run.interviewBonusTurns;
    const skipTurns = connectedConnectionIds.includes("catnap") ? 2 : 0;
    return {
        interviewer: interviewer.id,
        currentPhase: 0,
        currentHP: getScaledInterviewerHP(data, run, interviewer, 0),
        currentInterviewerAtk: getScaledInterviewerAtk(data, run, interviewer, 0),
        currentInterviewerShield: getInterviewerShield(interviewer, 0),
        skipTurns,
        currentAtk: run.baseAtk,
        currentShield: run.baseShield,
        turnsUntilAttack: Math.max(0, interviewer.delays[0]),
        interviewerMissProbability: 1,
        turnsUntilShieldReset: run.shieldResetTurns,
        turnsRemaining,
        pendingDrawCount: 0,
        isInterviewerDefeated: false,
        isPlayerRejected: false,
        victoryResult: null,
        rejectionLetter: null,
        chatMessages: [],
        drawPile: remainingDrawPile,
        discardPile: [],
        hand: drawnCards,
        handPage: 0,
        slots,
    };
}
export function applyInterviewSlot(currentState, run, slotIndex) {
    if (!currentState.currentInterview || currentState.screen !== "interview") {
        return currentState;
    }
    const slot = currentState.currentInterview.slots[slotIndex];
    if (slotIndex < 0 || slotIndex >= currentState.currentInterview.slots.length) {
        return currentState;
    }
    const nextRun = {
        ...run,
    };
    const nextInterview = {
        ...currentState.currentInterview,
    };
    const nextState = {
        ...currentState,
        run: nextRun,
        currentInterview: nextInterview,
    };
    if (!slot) {
        const slotEnergyRefill = buildInterviewSlotEnergyRefills(run)[slotIndex] ?? 1;
        nextRun.energy = Math.min(run.maxEnergy, Math.max(0, run.energy + slotEnergyRefill));
        return nextState;
    }
    nextRun.hp = Math.max(1, Math.min(run.maxHP, run.hp + slot.hpIncrement));
    nextRun.sanity = Math.max(0, run.sanity + slot.sanityIncrement);
    nextInterview.currentAtk = Math.max(0, (currentState.currentInterview.currentAtk + slot.atkIncrement) * slot.atkMult);
    nextInterview.currentShield = Math.max(0, (currentState.currentInterview.currentShield + slot.shieldIncrement) * slot.shieldMult);
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
export function roundInterviewCombatStats(state) {
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
export function applyInterviewExtraBuffs(state, foundCharmCard) {
    if (!state.currentInterview || state.screen !== "interview") {
        return state;
    }
    let nextCurrentAtk = state.currentInterview.currentAtk;
    if (state.connectedConnectionIds.includes("daniel")) {
        nextCurrentAtk *= 1.1;
    }
    if (state.connectedConnectionIds.includes("innokentiy")) {
        nextCurrentAtk *= 1.2;
    }
    if (state.connectedConnectionIds.includes("vineet")) {
        nextCurrentAtk *= 1.4;
    }
    if (nextCurrentAtk === state.currentInterview.currentAtk) {
        return state;
    }
    return {
        ...state,
        currentInterview: {
            ...state.currentInterview,
            currentAtk: Math.max(0, nextCurrentAtk),
        },
    };
}
export function applyInterviewPostRoundAtkCap(state, foundCharmCard) {
    if (!state.currentInterview || !state.data || !state.run || state.screen !== "interview") {
        return state;
    }
    let cappedAtk = state.currentInterview.currentAtk;
    if (state.currentInterview.interviewer === "boopie" && !foundCharmCard) {
        cappedAtk = Math.min(cappedAtk, 20);
    }
    if (state.currentInterview.interviewer === "careless-guy") {
        const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
        const currentPhaseMaxHP = getScaledInterviewerHP(state.data, state.run, interviewer, state.currentInterview.currentPhase);
        cappedAtk = Math.min(cappedAtk, Math.ceil(currentPhaseMaxHP * 0.5));
    }
    if (state.currentInterview.interviewer === "hm-guy") {
        const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
        const currentPhaseMaxHP = getScaledInterviewerHP(state.data, state.run, interviewer, state.currentInterview.currentPhase);
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
export function getPlayerDamageAfterMitigation(state, damage) {
    if (!state.currentInterview) {
        return Math.max(0, damage);
    }
    const safeDamage = Math.max(0, damage);
    let hpDamage = safeDamage;
    if (state.currentInterview.interviewer != "mazziotta") {
        hpDamage = Math.max(0, safeDamage - state.currentInterview.currentShield);
    }
    if (state.connectedConnectionIds.includes("marquise")) {
        hpDamage = Math.min(hpDamage, 20);
    }
    return hpDamage;
}
export function getInterviewerDamageAfterMitigation(state, damage) {
    if (!state.currentInterview) {
        return Math.max(0, damage);
    }
    const safeDamage = Math.max(0, damage);
    return Math.max(0, safeDamage - state.currentInterview.currentInterviewerShield);
}
export function damageInterviewer(state, damage) {
    if (!state.currentInterview || state.screen !== "interview") {
        return state;
    }
    const hpDamage = getInterviewerDamageAfterMitigation(state, damage);
    return {
        ...state,
        currentInterview: {
            ...state.currentInterview,
            currentHP: Math.max(0, state.currentInterview.currentHP - hpDamage),
        },
    };
}
export function damagePlayer(state, damage) {
    if (!state.currentInterview || !state.run || state.screen !== "interview") {
        return state;
    }
    const hpDamage = getPlayerDamageAfterMitigation(state, damage);
    return {
        ...state,
        run: {
            ...state.run,
            hp: Math.max(0, state.run.hp - hpDamage),
        },
    };
}
export function tickInterviewerDelay(state, isOvertimeTurn = false) {
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
export function resetInterviewerDelay(state) {
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
export function tickInterviewerMissProbability(state, isOvertimeTurn = false) {
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
            interviewerMissProbability: Math.max(0, state.currentInterview.interviewerMissProbability + currentPhaseDelay * (isOvertimeTurn ? 2 : 1)),
        },
    };
}
export function resetInterviewerMissProbability(state) {
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
export function consumeInterviewerSkipTurn(state) {
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
export function advanceInterviewerPhase(state) {
    if (!state.currentInterview || !state.data || !state.run || state.screen !== "interview") {
        return state;
    }
    const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
    const nextPhase = state.currentInterview.currentPhase + 1;
    if (nextPhase >= interviewer.hps.length) {
        return state;
    }
    return {
        ...state,
        currentInterview: {
            ...state.currentInterview,
            currentPhase: nextPhase,
            currentHP: getScaledInterviewerHP(state.data, state.run, interviewer, nextPhase),
            currentInterviewerAtk: getScaledInterviewerAtk(state.data, state.run, interviewer, nextPhase),
            currentInterviewerShield: getInterviewerShield(interviewer, nextPhase),
            skipTurns: Math.max(1, state.currentInterview.skipTurns),
            turnsUntilAttack: Math.max(0, interviewer.delays[nextPhase]),
            interviewerMissProbability: 1,
        },
        isInterviewerDisabled: true,
    };
}
export function useChrisPhaseSkip(state) {
    if (!state.currentInterview || !state.data || !state.run || state.screen !== "interview") {
        return state;
    }
    if (!state.connectedConnectionIds.includes("chris") ||
        state.currentInterview.isInterviewerDefeated ||
        state.currentInterview.isPlayerRejected ||
        state.currentInterview.victoryResult ||
        state.currentInterview.rejectionLetter) {
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
export function resetInterviewCurrentAtk(state) {
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
export function tickInterviewShieldReset(state) {
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
export function resolveInterviewShieldReset(state) {
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
export function decrementInterviewTime(state) {
    if (!state.currentInterview || state.screen !== "interview") {
        return state;
    }
    return {
        ...state,
        currentInterview: {
            ...state.currentInterview,
            turnsRemaining: Math.max(0, state.currentInterview.turnsRemaining - 1),
        },
    };
}
export function discardInterviewSlotsAndQueueDraw(state) {
    if (!state.currentInterview || !state.run || state.screen !== "interview") {
        return state;
    }
    const discardedCards = state.currentInterview.slots.filter((card) => card !== null);
    const nextSlots = Array.from({ length: state.currentInterview.slots.length }, () => null);
    return {
        ...state,
        currentInterview: {
            ...state.currentInterview,
            discardPile: [...discardedCards, ...state.currentInterview.discardPile],
            pendingDrawCount: state.currentInterview.pendingDrawCount + Math.max(0, state.run.cardsDrawPerTurn),
            slots: nextSlots,
        },
    };
}
export function drawInterviewCard(state) {
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
export function buffInterviewerAtkForOvertime(state) {
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
function chooseNextInterviewer(data, run, defeatedInterviewerIds) {
    const pool = data.interviewers.filter(({ id, debut }) => !defeatedInterviewerIds.includes(id) && debut <= run.roundsPassed);
    const fallbackPool = pool.length ? pool : data.interviewers;
    if (!fallbackPool.length) {
        return null;
    }
    const interviewerIndex = Math.floor(Math.random() * fallbackPool.length);
    return fallbackPool[interviewerIndex];
}
function applyConnectionEffects(run, connection) {
    const nextRun = {
        ...run,
        sanity: run.sanity - getConnectionCost(run, connection),
    };
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
    if (connection.id === "robbie") {
        nextRun.maxEnergy -= 1;
        nextRun.maxEnergy = Math.max(nextRun.maxEnergy, 1);
        nextRun.energy = nextRun.maxEnergy;
        nextRun.maxHP += 40;
        nextRun.hp += 40;
    }
    if (connection.id === "murphy") {
        nextRun.maxHP += 20;
        nextRun.hp += 20;
    }
    if (connection.id === "applejack") {
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
    if (connection.id === "ash") {
        nextRun.slotEnergyRefills = [...nextRun.slotEnergyRefills];
        if (nextRun.slotEnergyRefills.length > 0) {
            nextRun.slotEnergyRefills[0] += 2;
        }
    }
    if (connection.id === "epstein") {
        nextRun.connectDiscount *= 0.8;
    }
    if (connection.id === "tourist") {
        nextRun.packDiscount *= 0.8;
        nextRun.brainCapacity += 2;
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
    if (connection.id === "catnap") {
        nextRun.interviewStartEnergyOffset -= 3;
    }
    return nextRun;
}
export function connectToSuggestion(state, connectionId) {
    const data = requireData(state);
    if (!state.run || state.connectedConnectionIds.includes(connectionId) || state.retiredConnectionIds.includes(connectionId)) {
        return state;
    }
    const connection = getConnection(data, connectionId);
    const connectionCost = getConnectionCost(state.run, connection);
    if (state.run.sanity < connectionCost) {
        return state;
    }
    return {
        ...state,
        run: applyConnectionEffects(state.run, connection),
        connectedConnectionIds: [...state.connectedConnectionIds, connectionId],
    };
}
export function refreshShopSuggestions(state) {
    const data = requireData(state);
    if (!state.run || state.run.sanity < state.run.refreshCost) {
        return state;
    }
    const nextRun = {
        ...state.run,
        sanity: state.run.sanity - state.run.refreshCost,
        refreshCost: state.run.refreshCost + 25,
    };
    return {
        ...state,
        run: nextRun,
        shopSuggestions: buildShopSuggestions(data, state.connectedConnectionIds, state.retiredConnectionIds, nextRun),
    };
}
export function purchaseLinkedOutTier(state, tier) {
    const data = requireData(state);
    if (!state.run) {
        return state;
    }
    if (tier === "premium") {
        if (state.run.linkedOutTier !== "none" || state.run.sanity < 200) {
            return state;
        }
        const nextRun = {
            ...state.run,
            sanity: state.run.sanity - 200,
            linkedOutTier: "premium",
        };
        return {
            ...state,
            run: nextRun,
            shopSuggestions: extendShopSuggestions(data, state.connectedConnectionIds, state.retiredConnectionIds, state.shopSuggestions, nextRun),
        };
    }
    if (tier === "platinum") {
        if (state.run.linkedOutTier !== "premium" || state.run.sanity < 500) {
            return state;
        }
        const nextRun = {
            ...state.run,
            sanity: state.run.sanity - 500,
            linkedOutTier: "platinum",
        };
        return {
            ...state,
            run: nextRun,
            shopSuggestions: extendShopSuggestions(data, state.connectedConnectionIds, state.retiredConnectionIds, state.shopSuggestions, nextRun),
        };
    }
    return state;
}
export function purchaseBoosterPack(state, boosterPackId) {
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
    const boosterPackCost = getBoosterPackCost(state.run, boosterPack);
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
export function purchaseLeekCodePremium(state) {
    if (!state.run || state.run.hasLeekCodePremium || state.run.sanity < 500) {
        return state;
    }
    return {
        ...state,
        run: {
            ...state.run,
            sanity: state.run.sanity - 500,
            hasLeekCodePremium: true,
        },
    };
}
export function canStartInterview(state) {
    if (!state.data || !state.run) {
        return false;
    }
    return Boolean(chooseNextInterviewer(state.data, state.run, state.defeatedInterviewerIds));
}
export function enterInterviewArena(state) {
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
        isSanityCounterDimmed: false,
        isShieldCounterDimmed: false,
        isTurnResolving: false,
        activeInterviewSlotIndex: null,
        isPlayerDamageFlashActive: false,
        isInterviewerDisabled: nextInterview.skipTurns > 0,
        isInterviewerDamageFlashActive: false,
    };
}
export function markInterviewerDefeated(state) {
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
export function stabilizePlayerForInterviewVictory(state) {
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
export function markPlayerRejected(state) {
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
function buildInterviewVictoryResult(state, rejectionPreventedBy = null) {
    if (!state.data || !state.run || !state.currentInterview) {
        throw new Error("Cannot build interview results without game data, run, and interview state.");
    }
    let bonusPerTurn = 25;
    const timeBonusConnectionIds = [];
    const flatBonusConnectionIds = [];
    if (state.connectedConnectionIds.includes("peppino")) {
        bonusPerTurn += 25;
        timeBonusConnectionIds.push("peppino");
    }
    if (state.connectedConnectionIds.includes("posh")) {
        bonusPerTurn += 50;
        timeBonusConnectionIds.push("posh");
    }
    const rewardScale = getInterviewRewardScale(state.data, state.run);
    const sanityReward = Math.round(200 * rewardScale);
    const turnsLeft = Math.max(0, state.currentInterview.turnsRemaining);
    const bonusTurns = Math.min(turnsLeft, 10);
    const timeBonus = rejectionPreventedBy ? 0 : bonusTurns * bonusPerTurn;
    const subtotal = sanityReward + timeBonus;
    let total = subtotal;
    if (state.connectedConnectionIds.includes("spongebob")) {
        total += 75;
        flatBonusConnectionIds.push("spongebob");
    }
    if (state.connectedConnectionIds.includes("stanley")) {
        total += 75;
        flatBonusConnectionIds.push("stanley");
    }
    if (state.connectedConnectionIds.includes("robin-hood") && state.run.sanity <= 150) {
        total += 125;
        flatBonusConnectionIds.push("robin-hood");
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
        total += 600;
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
function buildInterviewRejectionLetter() {
    return [
        "Thank you for taking the time to interview for the Software Engineer position. We sincerely appreciate your interest in our team and the effort you invested throughout the process.",
        "After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs. This was not an easy decision, as we were fortunate to speak with many talented applicants.",
        "We were especially grateful for the perspective you brought to the conversation and for the thoughtfulness you showed during the interview. Your background is clearly promising, and this outcome should not be taken as a reflection of your long-term potential.",
        "The hiring market is highly competitive, and small differences in timing, fit, and team priorities often influence decisions in ways that are difficult to capture in a single conversation. We encourage you to continue building, learning, and applying with confidence.",
        "We wish you the very best in your search and hope you will consider reapplying for future Software Engineer opportunities."
    ];
}
export function disconnectInterviewRejected(state) {
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
function getRejectionPreventionConnection(state) {
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
export function preventInterviewRejection(state) {
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
    const nextInterview = {
        ...state.currentInterview,
        isInterviewerDefeated: true,
        isPlayerRejected: false,
        rejectionLetter: null,
    };
    const nextStateBase = {
        ...state,
        run: {
            ...state.run,
            gihunInterviewsSurvived: state.connectedConnectionIds.includes("gihun")
                ? state.run.gihunInterviewsSurvived + 1
                : state.run.gihunInterviewsSurvived,
            hp: Math.max(1, Math.ceil(state.run.maxHP * 0.5)),
            roundsPassed: state.run.roundsPassed + 1,
        },
        connectedConnectionIds: nextConnectedConnectionIds,
        retiredConnectionIds: nextRetiredConnectionIds,
        defeatedInterviewerIds: nextDefeatedInterviewerIds,
        currentInterview: nextInterview,
    };
    return {
        ...nextStateBase,
        currentInterview: {
            ...nextInterview,
            victoryResult: buildInterviewVictoryResult(nextStateBase, savingConnection.name),
        },
    };
}
export function disconnectInterviewVictory(state) {
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
    const nextStateBase = {
        ...state,
        run: {
            ...state.run,
            gihunInterviewsSurvived: state.connectedConnectionIds.includes("gihun")
                ? state.run.gihunInterviewsSurvived + 1
                : state.run.gihunInterviewsSurvived,
            roundsPassed: state.run.roundsPassed + 1,
        },
        defeatedInterviewerIds: nextDefeatedInterviewerIds,
        currentInterview: {
            ...state.currentInterview,
        },
    };
    return {
        ...nextStateBase,
        currentInterview: {
            ...state.currentInterview,
            victoryResult: buildInterviewVictoryResult(nextStateBase),
        },
    };
}
export function returnToShopAfterInterviewVictory(state) {
    const data = requireData(state);
    if (!state.run || !state.currentInterview?.victoryResult) {
        return state;
    }
    const nextRun = {
        ...state.run,
        sanity: state.run.sanity + state.currentInterview.victoryResult.totalSanityGain,
        energy: state.run.maxEnergy,
        refreshCost: 50,
        bufferRerollCost: 25,
        usedBrainCapacity: 0,
    };
    const shouldRetireGihun = state.connectedConnectionIds.includes("gihun") && state.run.gihunInterviewsSurvived >= 2;
    const nextConnectedConnectionIds = shouldRetireGihun
        ? state.connectedConnectionIds.filter((connectionId) => connectionId !== "gihun")
        : state.connectedConnectionIds;
    const nextRetiredConnectionIds = shouldRetireGihun && !state.retiredConnectionIds.includes("gihun")
        ? [...state.retiredConnectionIds, "gihun"]
        : state.retiredConnectionIds;
    return {
        ...state,
        screen: "shop",
        run: nextRun,
        connectedConnectionIds: nextConnectedConnectionIds,
        retiredConnectionIds: nextRetiredConnectionIds,
        shopSuggestions: buildShopSuggestions(data, nextConnectedConnectionIds, nextRetiredConnectionIds, nextRun),
        currentInterview: null,
        isDeckOpen: false,
        isNetworkOpen: false,
        isDiscardPileOpen: false,
        isSanityCounterDimmed: false,
        isShieldCounterDimmed: false,
        isTurnResolving: false,
        activeInterviewSlotIndex: null,
        isPlayerDamageFlashActive: false,
        isInterviewerDisabled: false,
        isInterviewerDamageFlashActive: false,
    };
}
export function reapplyAfterInterviewRejection(state) {
    const data = requireData(state);
    return initializeState(data);
}
export function appendInterviewMessage(state, message) {
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
export function goToPreviousInterviewHandPage(state) {
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
export function goToNextInterviewHandPage(state) {
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
export function placeHandCardInSlot(state, handIndex) {
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
export function returnSlottedCardToHand(state, slotIndex) {
    if (!state.currentInterview || !state.run || state.screen !== "interview") {
        return state;
    }
    const { slots } = state.currentInterview;
    if (slotIndex < 0 || slotIndex >= slots.length || !slots[slotIndex]) {
        return state;
    }
    const card = slots[slotIndex];
    const nextFilledSlots = slots.filter((slottedCard, index) => index !== slotIndex && slottedCard !== null);
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
export function addBufferCardToDeck(state, bufferIndex) {
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
export function rerollBufferCard(state, bufferIndex) {
    const data = requireData(state);
    if (!state.run || bufferIndex < 0 || bufferIndex >= state.buffer.length || state.run.sanity < state.run.bufferRerollCost) {
        return state;
    }
    const currentCard = state.buffer[bufferIndex];
    const matchingCards = data.cards.filter((card) => card.rarity === currentCard.rarity && card.type === currentCard.type);
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
            bufferRerollCost: state.run.bufferRerollCost + 25,
        },
        buffer: nextBuffer,
    };
}
export function removeDeckCard(state, deckIndex) {
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
export function selectCharacter(state, characterId) {
    const data = requireData(state);
    const nextState = {
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
export function selectDifficulty(state, difficultyId) {
    const data = requireData(state);
    const nextState = {
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
