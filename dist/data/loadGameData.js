const cardDefaults = {
    rarity: "common",
    energyCost: 0,
    atkIncrement: 0,
    atkMult: 1,
    hpIncrement: 0,
    shieldIncrement: 0,
    shieldMult: 1,
    sanityIncrement: 0,
    extraEffects: [],
};
const connectionDefaults = {
    tagline: "",
    price: 100,
    description: [],
    rarity: "common",
};
const itemDefaults = {
    sound: "/sfx/ding.mp3",
};
const difficultyDefaults = {
    hpScale: 1,
    atkScale: 1,
    rewardScale: 1,
    timeLimitOffset: 0,
};
function isObject(value) {
    return typeof value === "object" && value !== null;
}
function normalizeCard(card) {
    if (!isObject(card) || typeof card.id !== "string" || typeof card.name !== "string" || typeof card.image !== "string" || (card.type !== "Tech" && card.type !== "Charm")) {
        throw new Error("Each card requires id, name, image, and a valid type.");
    }
    const rawCard = card;
    return {
        id: rawCard.id,
        name: rawCard.name,
        image: rawCard.image,
        type: rawCard.type,
        rarity: rawCard.rarity ?? cardDefaults.rarity,
        energyCost: rawCard.energyCost ?? cardDefaults.energyCost,
        atkIncrement: rawCard.atkIncrement ?? cardDefaults.atkIncrement,
        atkMult: rawCard.atkMult ?? cardDefaults.atkMult,
        hpIncrement: rawCard.hpIncrement ?? cardDefaults.hpIncrement,
        shieldIncrement: rawCard.shieldIncrement ?? cardDefaults.shieldIncrement,
        shieldMult: rawCard.shieldMult ?? cardDefaults.shieldMult,
        sanityIncrement: rawCard.sanityIncrement ?? cardDefaults.sanityIncrement,
        extraEffects: rawCard.extraEffects ?? cardDefaults.extraEffects,
    };
}
function normalizeCharacter(character) {
    if (!isObject(character) ||
        typeof character.id !== "string" ||
        typeof character.name !== "string" ||
        typeof character.tagline !== "string" ||
        typeof character.image !== "string" ||
        typeof character.maxHP !== "number" ||
        typeof character.maxEnergy !== "number" ||
        typeof character.baseAtk !== "number" ||
        typeof character.baseShield !== "number" ||
        typeof character.deckCapacity !== "number" ||
        typeof character.sanity !== "number" ||
        !Array.isArray(character.traits)) {
        throw new Error("Each character requires id, name, tagline, image, maxHP, maxEnergy, baseAtk, baseShield, deckCapacity, sanity, and traits.");
    }
    const rawCharacter = character;
    return {
        id: rawCharacter.id,
        name: rawCharacter.name,
        tagline: rawCharacter.tagline,
        image: rawCharacter.image,
        maxHP: rawCharacter.maxHP,
        maxEnergy: rawCharacter.maxEnergy,
        baseAtk: rawCharacter.baseAtk,
        baseShield: rawCharacter.baseShield,
        deckCapacity: rawCharacter.deckCapacity,
        sanity: rawCharacter.sanity,
        traits: rawCharacter.traits.filter((trait) => typeof trait === "string"),
    };
}
function normalizeDifficulty(difficulty) {
    if (!isObject(difficulty) ||
        typeof difficulty.id !== "string" ||
        typeof difficulty.name !== "string" ||
        !Array.isArray(difficulty.traits) ||
        (difficulty.hpScale !== undefined && typeof difficulty.hpScale !== "number") ||
        (difficulty.atkScale !== undefined && typeof difficulty.atkScale !== "number") ||
        (difficulty.rewardScale !== undefined && typeof difficulty.rewardScale !== "number") ||
        (difficulty.timeLimitOffset !== undefined && typeof difficulty.timeLimitOffset !== "number")) {
        throw new Error("Each difficulty requires id, name, and traits. hpScale, atkScale, rewardScale, and timeLimitOffset are optional.");
    }
    const rawDifficulty = difficulty;
    return {
        id: rawDifficulty.id,
        name: rawDifficulty.name,
        traits: rawDifficulty.traits.filter((trait) => typeof trait === "string"),
        hpScale: rawDifficulty.hpScale ?? difficultyDefaults.hpScale,
        atkScale: rawDifficulty.atkScale ?? difficultyDefaults.atkScale,
        rewardScale: rawDifficulty.rewardScale ?? difficultyDefaults.rewardScale,
        timeLimitOffset: rawDifficulty.timeLimitOffset ?? difficultyDefaults.timeLimitOffset,
    };
}
function normalizeConnection(connection) {
    if (!isObject(connection) ||
        typeof connection.id !== "string" ||
        typeof connection.name !== "string" ||
        typeof connection.image !== "string") {
        throw new Error("Each connection requires id, name, and image.");
    }
    const rawConnection = connection;
    return {
        id: rawConnection.id,
        image: rawConnection.image,
        name: rawConnection.name,
        tagline: rawConnection.tagline ?? connectionDefaults.tagline,
        price: rawConnection.price ?? connectionDefaults.price,
        description: Array.isArray(rawConnection.description)
            ? rawConnection.description.filter((line) => typeof line === "string")
            : connectionDefaults.description,
        rarity: rawConnection.rarity ?? connectionDefaults.rarity,
    };
}
function normalizeItem(item) {
    if (!isObject(item) ||
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        typeof item.image !== "string" ||
        typeof item.price !== "number" ||
        typeof item.description !== "string") {
        throw new Error("Each item requires id, name, image, price, and description.");
    }
    const rawItem = item;
    return {
        id: rawItem.id,
        name: rawItem.name,
        image: rawItem.image,
        sound: rawItem.sound ?? itemDefaults.sound,
        price: rawItem.price,
        description: rawItem.description,
    };
}
function normalizeTrait(trait) {
    if (!isObject(trait) ||
        typeof trait.id !== "string" ||
        typeof trait.name !== "string" ||
        (trait.difficulty !== "simple" &&
            trait.difficulty !== "fair" &&
            trait.difficulty !== "tough" &&
            trait.difficulty !== "extreme" &&
            trait.difficulty !== "impossible") ||
        typeof trait.sanity !== "number" ||
        typeof trait.hp !== "number" ||
        typeof trait.attack !== "number" ||
        typeof trait.energy !== "number" ||
        typeof trait.shield !== "number" ||
        typeof trait.description !== "string") {
        throw new Error("Each trait requires id, name, difficulty, sanity, hp, attack, energy, shield, and description.");
    }
    const rawTrait = trait;
    return {
        id: rawTrait.id,
        name: rawTrait.name,
        difficulty: rawTrait.difficulty,
        sanity: rawTrait.sanity,
        hp: rawTrait.hp,
        attack: rawTrait.attack,
        energy: rawTrait.energy,
        shield: rawTrait.shield,
        description: rawTrait.description,
    };
}
function normalizeBoosterPack(boosterPack) {
    if (!isObject(boosterPack) ||
        typeof boosterPack.id !== "string" ||
        typeof boosterPack.name !== "string" ||
        (boosterPack.type !== "Tech" && boosterPack.type !== "Charm" && boosterPack.type !== "Both") ||
        typeof boosterPack.cost !== "number" ||
        typeof boosterPack.common !== "number" ||
        typeof boosterPack.rare !== "number" ||
        typeof boosterPack.epic !== "number" ||
        typeof boosterPack.legendary !== "number") {
        throw new Error("Each booster pack requires id, name, type, cost, common, rare, epic, and legendary.");
    }
    const rawBoosterPack = boosterPack;
    return {
        id: rawBoosterPack.id,
        name: rawBoosterPack.name,
        type: rawBoosterPack.type,
        cost: rawBoosterPack.cost,
        common: rawBoosterPack.common,
        rare: rawBoosterPack.rare,
        epic: rawBoosterPack.epic,
        legendary: rawBoosterPack.legendary,
    };
}
function normalizeInterviewer(interviewer) {
    if (!isObject(interviewer) ||
        typeof interviewer.id !== "string" ||
        typeof interviewer.name !== "string" ||
        !Number.isInteger(interviewer.debut) ||
        (interviewer.retire !== undefined && !Number.isInteger(interviewer.retire)) ||
        typeof interviewer.tagline !== "string" ||
        typeof interviewer.image !== "string" ||
        !Array.isArray(interviewer.hps) ||
        !Array.isArray(interviewer.atks) ||
        !Array.isArray(interviewer.delays) ||
        !Number.isInteger(interviewer.timeLimit) ||
        !Array.isArray(interviewer.descriptions) ||
        !Array.isArray(interviewer.dialogs)) {
        throw new Error("Each interviewer requires id, name, debut, tagline, image, hps, atks, delays, timeLimit, descriptions, and dialogs. Retire is optional.");
    }
    const rawInterviewer = interviewer;
    const hps = rawInterviewer.hps.filter((value) => typeof value === "number");
    const atks = rawInterviewer.atks.filter((value) => typeof value === "number");
    const shields = Array.isArray(rawInterviewer.shields)
        ? rawInterviewer.shields.filter((value) => typeof value === "number")
        : [];
    const delays = rawInterviewer.delays.filter((value) => typeof value === "number");
    const descriptions = rawInterviewer.descriptions.filter((value) => typeof value === "string");
    const phaseCount = hps.length;
    const [introDialog, phaseDialogsRaw, defeatedDialog, timeoutDialog, playerDeathDialog] = rawInterviewer.dialogs;
    const phaseDialogs = Array.isArray(phaseDialogsRaw)
        ? phaseDialogsRaw.filter((value) => typeof value === "string")
        : [];
    if (!phaseCount ||
        atks.length !== phaseCount ||
        (Array.isArray(rawInterviewer.shields) && shields.length !== phaseCount) ||
        delays.length !== phaseCount ||
        rawInterviewer.dialogs.length !== 5 ||
        typeof introDialog !== "string" ||
        !Array.isArray(phaseDialogsRaw) ||
        phaseDialogs.length < 1 ||
        typeof defeatedDialog !== "string" ||
        typeof timeoutDialog !== "string" ||
        typeof playerDeathDialog !== "string") {
        throw new Error("Each interviewer must have matching hp/atk/delay phase arrays and dialogs shaped as [intro, phaseDialogs, defeated, timeout, playerDeath], with at least one phase dialog.");
    }
    const dialogs = [introDialog, phaseDialogs, defeatedDialog, timeoutDialog, playerDeathDialog];
    return {
        id: rawInterviewer.id,
        name: rawInterviewer.name,
        debut: rawInterviewer.debut,
        retire: rawInterviewer.retire ?? 999,
        tagline: rawInterviewer.tagline,
        image: rawInterviewer.image,
        hps,
        atks,
        shields: shields.length ? shields : Array.from({ length: phaseCount }, () => 0),
        delays,
        timeLimit: rawInterviewer.timeLimit,
        descriptions,
        dialogs,
    };
}
function normalizeRoundScale(roundScale) {
    if (!Array.isArray(roundScale) ||
        (roundScale.length !== 2 && roundScale.length !== 3) ||
        typeof roundScale[0] !== "number" ||
        typeof roundScale[1] !== "number" ||
        (roundScale.length === 3 && typeof roundScale[2] !== "number")) {
        throw new Error("Each round scale entry must be [hpScale, atkScale] or [hpScale, atkScale, rewardScale].");
    }
    const rawRoundScale = roundScale;
    return [rawRoundScale[0], rawRoundScale[1], rawRoundScale[2] ?? 1];
}
function normalizeGameData(rawData) {
    if (!Array.isArray(rawData.characters) ||
        !Array.isArray(rawData.difficulties) ||
        !Array.isArray(rawData.cards) ||
        !Array.isArray(rawData.connections) ||
        !Array.isArray(rawData.items) ||
        !Array.isArray(rawData.traits) ||
        !Array.isArray(rawData.boosterPacks) ||
        !Array.isArray(rawData.interviewers) ||
        !Array.isArray(rawData.roundScales) ||
        !Array.isArray(rawData.startingDeck)) {
        throw new Error("Game data must contain characters, difficulties, cards, connections, items, traits, boosterPacks, interviewers, roundScales, and startingDeck arrays.");
    }
    return {
        characters: rawData.characters.map(normalizeCharacter),
        difficulties: rawData.difficulties.map(normalizeDifficulty),
        cards: rawData.cards.map(normalizeCard),
        connections: rawData.connections.map(normalizeConnection),
        items: rawData.items.map(normalizeItem),
        traits: rawData.traits.map(normalizeTrait),
        boosterPacks: rawData.boosterPacks.map(normalizeBoosterPack),
        interviewers: rawData.interviewers.map(normalizeInterviewer),
        roundScales: rawData.roundScales.map(normalizeRoundScale),
        startingDeck: rawData.startingDeck,
    };
}
function validateGameData(data) {
    if (!Array.isArray(data.characters) ||
        !Array.isArray(data.difficulties) ||
        !Array.isArray(data.cards) ||
        !Array.isArray(data.connections) ||
        !Array.isArray(data.items) ||
        !Array.isArray(data.boosterPacks) ||
        !Array.isArray(data.interviewers) ||
        !Array.isArray(data.roundScales) ||
        !Array.isArray(data.startingDeck)) {
        throw new Error("Game data must contain characters, difficulties, cards, connections, items, boosterPacks, interviewers, roundScales, and startingDeck arrays.");
    }
    if (!data.characters.length || !data.difficulties.length) {
        throw new Error("Game data requires at least one character and one difficulty.");
    }
    if (!data.cards.length || !data.startingDeck.length) {
        throw new Error("Game data requires at least one card and one starting deck entry.");
    }
    if (data.roundScales.length < 20) {
        throw new Error("Game data requires at least 20 round scale entries.");
    }
}
export async function loadGameData() {
    const response = await fetch("/data/game-data.json", { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Failed to load game data: ${response.status}`);
    }
    const rawData = (await response.json());
    const data = normalizeGameData(rawData);
    validateGameData(data);
    return data;
}
