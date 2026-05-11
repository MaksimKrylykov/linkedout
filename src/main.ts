import { loadGameData } from "./data/loadGameData.js";
import {
  addBufferCardToDeck,
  advanceInterviewerPhase,
  applyInterviewSlot,
  applyInterviewExtraBuffs,
  applyInterviewPostRoundAtkCap,
  applyTurnStartBuffs,
  appendInterviewMessage,
  appendNextExtraDialog,
  appendPlayerChatMessage,
  buffInterviewerAtkForOvertime,
  connectToSuggestion,
  consumeItem,
  consumeInterviewerSkipTurn,
  createErrorState,
  createInitialState,
  damageInterviewer,
  damagePlayer,
  decrementInterviewTime,
  disconnectInterviewRejected,
  disconnectInterviewVictory,
  discardInterviewSlotsAndQueueDraw,
  drawInterviewCard,
  enterInterviewArena,
  enterShop,
  getInterviewerDamageAfterMitigation,
  getPlayerDamageAfterMitigation,
  getInterviewerDefeatedDialog,
  getInterviewer,
  getInterviewerDelay,
  getInterviewerIntroDialog,
  getInterviewerPhaseDialog,
  getInterviewerPlayerDeathDialog,
  getInterviewerTimeoutDialog,
  goToNextInterviewHandPage,
  goToPreviousInterviewHandPage,
  initializeState,
  markTimeoutDialogSent,
  placeHandCardInSlot,
  preventInterviewRejection,
  purchaseAwazonPrime,
  purchaseBoosterPack,
  purchaseBrainCapacityUpgrade,
  purchaseItem,
  purchaseLeekCodePremium,
  purchaseLinkedOutTier,
  purchaseTouchingGrassRemoval,
  purchaseTouchingGrassUpgrade,
  removeDeckCard,
  removeItem,
  retrieveDiscardPileCard,
  refreshShopSuggestions,
  reapplyAfterInterviewRejection,
  rerollBufferCard,
  resolveInterviewShieldReset,
  retryInterviewRejection,
  returnToMainMenu,
  returnToShopAfterInterviewVictory,
  resetInterviewCurrentAtk,
  resetInterviewerDelay,
  returnSlottedCardToHand,
  roundInterviewCombatStats,
  selectCharacter,
  selectDifficulty,
  setActiveInterviewSlotIndex,
  setInterviewerDamageFlashActive,
  setInterviewerDisabled,
  setInterviewTurnResolving,
  setInterviewTurnTimer,
  setPlayerDamageFlashActive,
  shufflePlayedCards,
  markInterviewerDefeated,
  markPlayerRejected,
  resetInterviewTurnTimer,
  resetInterviewerMissProbability,
  stabilizePlayerForInterviewVictory,
  startNewRun,
  tickInterviewerDelay,
  tickInterviewerMissProbability,
  tickInterviewShieldReset,
  toggleDeck,
  toggleDiscardPile,
  toggleItems,
  toggleMusicMuted,
  toggleNetwork,
  toggleSanityCounter,
  toggleShieldCounter,
  useChrisPhaseSkip,
} from "./state/appState.js";
import { renderShell } from "./ui/markup.js";
import { renderHomeView } from "./views/homeView.js";
import { renderInterviewView } from "./views/interviewView.js";
import { renderOfferView } from "./views/offerView.js";
import { renderShopView } from "./views/shopView.js";
import { renderSetupView } from "./views/setupView.js";
import { renderErrorView, renderLoadingView } from "./views/statusView.js";
import type { AppState } from "./types.js";

const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("App root not found.");
}

const app: HTMLDivElement = appElement;
let state: AppState = createInitialState();
const linkedinNotificationAudio = new Audio("/sfx/linkedin_notification.mp3");
const gunshotAudio = new Audio("/sfx/gunshot.mp3");
const cashRegisterAudio = new Audio("/sfx/cash_register.mp3");
const rerollAudio = new Audio("/sfx/reroll.mp3");
const packetAudio = new Audio("/sfx/packet.mp3");
const loadAudio = new Audio("/sfx/load.mp3");
const drawAudio = new Audio("/sfx/draw.mp3");
const dingAudio = new Audio("/sfx/ding.mp3");
const notificationAudio = new Audio("/sfx/notification.mp3");
const victoryAudio = new Audio("/sfx/victory.mp3");
const rejectedAudio = new Audio("/sfx/rejected.mp3");
const enemyDamageAudio = new Audio("/sfx/enemy_damage.mp3");
const playerDamageAudio = new Audio("/sfx/player_damage.mp3");
const popAudio = new Audio("/sfx/pop.mp3");
const skippedAudio = new Audio("/sfx/skipped.mp3");
const oneShotAudioCache = new Map<string, HTMLAudioElement>();
const DELETE_HOLD_DURATION_MS = 500;
const BUFFER_REROLL_HOLD_DURATION_MS = 500;
const PAID_DRAW_HOLD_DURATION_MS = 500;
const INTERVIEW_INTRO_DELAY_MS = 300;
const INTERVIEW_CARD_APPLY_DELAY_MS = 500;
const INTERVIEW_DAMAGE_FLASH_DURATION_MS = 200;
const BACKGROUND_MUSIC_VOLUME_SPEED = 0.3;
const DECK_ATTENTION_SHIMMER_CYCLE_MS = 2800;
const OFFER_SHIMMER_CYCLE_MS = 8000;

type HoldAction =
  | {
      kind: "remove-card";
      deckIndex: number;
    }
  | {
      kind: "remove-item";
      itemIndex: number;
    }
  | {
      kind: "reroll-buffer-card";
      bufferIndex: number;
    }
  | {
      kind: "retrieve-discard-card";
      discardIndex: number;
    }
  | {
      kind: "paid-draw";
    };

type PendingHold = {
  button: HTMLButtonElement;
  action: HoldAction;
  pointerId: number;
  startedAt: number;
  durationMs: number;
  rafId: number;
};

let pendingHold: PendingHold | null = null;
let pendingInterviewIntroTimeout: number | null = null;
let hasLoggedHomeConnectionDebug = false;
let timeoutFrameElement: HTMLDivElement | null = null;
let displayedInterviewTurnsRemaining: number | null = null;
let timeoutFrameDisplayedSeverity = 0;
let timeoutFrameTargetSeverity = 0;
let timeoutFrameAnimationFrameId: number | null = null;
let timeoutFrameLastTimestamp: number | null = null;
let backgroundMusicAnimationFrameId: number | null = null;
let backgroundMusicLastTimestamp: number | null = null;
let deckAttentionStartedAt: number | null = null;
let offerShimmerStartedAt: number | null = null;
let interviewTurnTimerIntervalId: number | null = null;
let interviewTurnTimerDeadlineMs: number | null = null;
let interviewTurnTimerLastDisplayedTenths: number | null = null;

type ScrollSnapshot = {
  distanceFromBottom: number;
};

type BackgroundMusicTrackId = "calm" | "interview" | "overtime" | "results";

type BackgroundMusicTrack = {
  urls: string[];
  loops: boolean;
  gainNode: GainNode | null;
  sourceNode: AudioBufferSourceNode | null;
  startPromise: Promise<void> | null;
  currentVolume: number;
  targetVolume: number;
};

const INTERVIEW_TRACK_URLS = ["/sfx/interview_1.mp3", "/sfx/interview_2.mp3"];

const backgroundMusicTracks: Record<BackgroundMusicTrackId, BackgroundMusicTrack> = {
  calm: {
    urls: ["/sfx/calm.mp3"],
    loops: true,
    gainNode: null,
    sourceNode: null,
    startPromise: null,
    currentVolume: 0,
    targetVolume: 0,
  },
  interview: {
    urls: INTERVIEW_TRACK_URLS,
    loops: false,
    gainNode: null,
    sourceNode: null,
    startPromise: null,
    currentVolume: 0,
    targetVolume: 0,
  },
  overtime: {
    urls: ["/sfx/overtime.ogg"],
    loops: true,
    gainNode: null,
    sourceNode: null,
    startPromise: null,
    currentVolume: 0,
    targetVolume: 0,
  },
  results: {
    urls: ["/sfx/results.wav"],
    loops: true,
    gainNode: null,
    sourceNode: null,
    startPromise: null,
    currentVolume: 0,
    targetVolume: 0,
  },
};
const backgroundMusicBuffers = new Map<string, AudioBuffer>();
const backgroundMusicLoadPromises = new Map<string, Promise<AudioBuffer | null>>();

function renderScreen(currentState: AppState): string {
  switch (currentState.screen) {
    case "loading":
      return renderLoadingView();
    case "error":
      return renderErrorView();
    case "setup":
      return renderSetupView(currentState);
    case "shop":
      return renderShopView(currentState);
    case "interview":
      return renderInterviewView(currentState);
    case "offer":
      return renderOfferView(currentState);
    case "home":
    default:
      return renderHomeView(currentState);
  }
}

function captureInterviewChatScroll(): ScrollSnapshot | null {
  const chatElement = app.querySelector<HTMLElement>(".interview-chat");

  if (!chatElement) {
    return null;
  }

  return {
    distanceFromBottom: Math.max(0, chatElement.scrollHeight - chatElement.clientHeight - chatElement.scrollTop),
  };
}

function restoreInterviewChatScroll(snapshot: ScrollSnapshot | null): void {
  if (!snapshot) {
    return;
  }

  const chatElement = app.querySelector<HTMLElement>(".interview-chat");

  if (!chatElement) {
    return;
  }

  chatElement.scrollTop = Math.max(0, chatElement.scrollHeight - chatElement.clientHeight - snapshot.distanceFromBottom);
}

function clearInterviewTurnTimer(): void {
  if (interviewTurnTimerIntervalId !== null) {
    window.clearInterval(interviewTurnTimerIntervalId);
    interviewTurnTimerIntervalId = null;
  }

  interviewTurnTimerDeadlineMs = null;
  interviewTurnTimerLastDisplayedTenths = null;
}

function shouldRunInterviewTurnTimer(currentState: AppState): boolean {
  if (
    currentState.screen !== "interview" ||
    !currentState.currentInterview ||
    currentState.isTurnResolving ||
    currentState.currentInterview.interviewer !== "nameless-guy" ||
    currentState.currentInterview.turnTimerSecondsLeft === null ||
    currentState.currentInterview.isInterviewerDefeated ||
    currentState.currentInterview.isPlayerRejected ||
    Boolean(currentState.currentInterview.victoryResult) ||
    Boolean(currentState.currentInterview.rejectionLetter)
  ) {
    return false;
  }

  return true;
}

function updateInterviewTurnTimerBubble(displayedSeconds: number): void {
  const timerBubble = app.querySelector<HTMLDivElement>(".interview-turn-timer-bubble");

  if (!timerBubble) {
    return;
  }

  timerBubble.textContent = `⏰ ${displayedSeconds.toFixed(1)}s`;
  timerBubble.classList.toggle("interview-turn-timer-bubble--danger", displayedSeconds <= 5);
}

function getVisibleInterviewTurnTimerSeconds(): number | null {
  if (state.screen !== "interview" || !state.currentInterview) {
    return null;
  }

  if (interviewTurnTimerDeadlineMs === null) {
    return state.currentInterview.turnTimerSecondsLeft;
  }

  return Math.max(0, Number(((interviewTurnTimerDeadlineMs - performance.now()) / 1000).toFixed(1)));
}

function tickInterviewTurnTimer(): void {
  if (!shouldRunInterviewTurnTimer(state) || interviewTurnTimerDeadlineMs === null) {
    clearInterviewTurnTimer();
    return;
  }

  const remainingSeconds = Math.max(0, (interviewTurnTimerDeadlineMs - performance.now()) / 1000);
  const displayedSeconds = Number(remainingSeconds.toFixed(1));
  const displayedTenths = Math.round(displayedSeconds * 10);

  if (interviewTurnTimerLastDisplayedTenths !== displayedTenths) {
    interviewTurnTimerLastDisplayedTenths = displayedTenths;
    updateInterviewTurnTimerBubble(displayedSeconds);
  }

  if (remainingSeconds > 0) {
    return;
  }

  updateState((currentState) => setInterviewTurnTimer(currentState, 0));
  clearInterviewTurnTimer();
  void resolveInterviewTurn();
}

function startInterviewTurnTimer(secondsLeft: number): void {
  clearInterviewTurnTimer();
  interviewTurnTimerDeadlineMs = performance.now() + secondsLeft * 1000;
  interviewTurnTimerLastDisplayedTenths = Math.round(secondsLeft * 10);
  updateInterviewTurnTimerBubble(secondsLeft);
  interviewTurnTimerIntervalId = window.setInterval(tickInterviewTurnTimer, 50);
}

function syncInterviewTurnTimer(): void {
  if (!shouldRunInterviewTurnTimer(state)) {
    clearInterviewTurnTimer();
    return;
  }

  if (interviewTurnTimerIntervalId !== null || interviewTurnTimerDeadlineMs !== null) {
    if (interviewTurnTimerDeadlineMs !== null) {
      const displayedSeconds = Math.max(0, Number(((interviewTurnTimerDeadlineMs - performance.now()) / 1000).toFixed(1)));
      updateInterviewTurnTimerBubble(displayedSeconds);
    }

    return;
  }

  const secondsLeft = state.currentInterview?.turnTimerSecondsLeft ?? 0;

  if (secondsLeft <= 0) {
    return;
  }

  startInterviewTurnTimer(secondsLeft);
}

let backgroundMusicContext: AudioContext | null = null;

function getBackgroundMusicContext(): AudioContext {
  if (!backgroundMusicContext) {
    backgroundMusicContext = new AudioContext();
  }

  return backgroundMusicContext;
}

async function ensureBackgroundMusicContextResumed(): Promise<AudioContext> {
  const context = getBackgroundMusicContext();

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return context;
    }
  }

  return context;
}

function getTrackGainNode(track: BackgroundMusicTrack, context: AudioContext): GainNode {
  if (!track.gainNode) {
    track.gainNode = context.createGain();
    track.gainNode.gain.value = track.currentVolume;
    track.gainNode.connect(context.destination);
  }

  return track.gainNode;
}

async function loadBackgroundMusicBuffer(url: string, context: AudioContext): Promise<AudioBuffer | null> {
  const existingBuffer = backgroundMusicBuffers.get(url);

  if (existingBuffer) {
    return existingBuffer;
  }

  let loadPromise = backgroundMusicLoadPromises.get(url);

  if (!loadPromise) {
    loadPromise = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load background music: ${url}`);
        }

        return response.arrayBuffer();
      })
      .then((buffer) => context.decodeAudioData(buffer.slice(0)))
      .then((decodedBuffer) => {
        backgroundMusicBuffers.set(url, decodedBuffer);
        return decodedBuffer;
      })
      .catch((error) => {
        console.error(error);
        return null;
      })
      .finally(() => {
        backgroundMusicLoadPromises.delete(url);
      });

    backgroundMusicLoadPromises.set(url, loadPromise);
  }

  return loadPromise;
}

function pickRandomTrackUrl(track: BackgroundMusicTrack): string {
  return track.urls[Math.floor(Math.random() * track.urls.length)] ?? track.urls[0];
}

async function playBackgroundMusicTrack(track: BackgroundMusicTrack): Promise<void> {
  if (track.sourceNode || track.startPromise) {
    return;
  }

  track.startPromise = (async () => {
    const context = await ensureBackgroundMusicContextResumed();
    const url = pickRandomTrackUrl(track);
    const buffer = await loadBackgroundMusicBuffer(url, context);

    if (!buffer || track.targetVolume <= 0 || track.sourceNode) {
      return;
    }

    const gainNode = getTrackGainNode(track, context);
    gainNode.gain.value = track.currentVolume;

    const sourceNode = context.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = track.loops;
    sourceNode.connect(gainNode);
    sourceNode.onended = () => {
      if (track.sourceNode === sourceNode) {
        track.sourceNode = null;
      }

      if (!track.loops && track.targetVolume > 0 && !state.isMusicMuted) {
        void playBackgroundMusicTrack(track);
      }
    };
    sourceNode.start();
    track.sourceNode = sourceNode;
  })().finally(() => {
    track.startPromise = null;
  });

  await track.startPromise;
}

function stopBackgroundMusicTrack(track: BackgroundMusicTrack): void {
  track.targetVolume = 0;
  track.currentVolume = 0;

  if (track.gainNode) {
    track.gainNode.gain.value = 0;
  }

  if (track.sourceNode) {
    try {
      track.sourceNode.stop();
    } catch {
      // Ignore repeated stop calls during state churn.
    }

    track.sourceNode.disconnect();
    track.sourceNode = null;
  }
}

function stopAllBackgroundMusic(): void {
  if (backgroundMusicAnimationFrameId !== null) {
    cancelAnimationFrame(backgroundMusicAnimationFrameId);
    backgroundMusicAnimationFrameId = null;
  }

  backgroundMusicLastTimestamp = null;

  for (const track of Object.values(backgroundMusicTracks)) {
    stopBackgroundMusicTrack(track);
  }
}

function startBackgroundMusicAnimation(): void {
  if (backgroundMusicAnimationFrameId !== null) {
    return;
  }

  backgroundMusicLastTimestamp = null;
  backgroundMusicAnimationFrameId = window.requestAnimationFrame(stepBackgroundMusic);
}

function stepBackgroundMusic(timestamp: number): void {
  if (backgroundMusicLastTimestamp === null) {
    backgroundMusicLastTimestamp = timestamp;
  }

  const elapsedSeconds = (timestamp - backgroundMusicLastTimestamp) / 1000;
  backgroundMusicLastTimestamp = timestamp;
  let shouldContinue = false;

  for (const track of Object.values(backgroundMusicTracks)) {
    if (track.targetVolume > 0) {
      void playBackgroundMusicTrack(track);
    }

    const difference = track.targetVolume - track.currentVolume;

    if (Math.abs(difference) > 0.0005) {
      const maxStep = elapsedSeconds * BACKGROUND_MUSIC_VOLUME_SPEED;
      const nextStep = Math.min(Math.abs(difference), maxStep);
      track.currentVolume += Math.sign(difference) * nextStep;
      shouldContinue = true;
    } else {
      track.currentVolume = track.targetVolume;
    }

    const safeVolume = Math.max(0, Math.min(1, track.currentVolume));
    track.currentVolume = safeVolume;

    if (track.gainNode) {
      track.gainNode.gain.value = safeVolume;
    }

    if (track.targetVolume === 0 && safeVolume === 0) {
      stopBackgroundMusicTrack(track);
      continue;
    }
  }

  if (!shouldContinue) {
    backgroundMusicAnimationFrameId = null;
    backgroundMusicLastTimestamp = null;
    return;
  }

  backgroundMusicAnimationFrameId = window.requestAnimationFrame(stepBackgroundMusic);
}

function getDisplayedInterviewTurnsRemaining(currentInterview: AppState["currentInterview"]): number | null {
  if (!currentInterview) {
    displayedInterviewTurnsRemaining = null;
    return null;
  }

  if (!state.isTurnResolving) {
    displayedInterviewTurnsRemaining = currentInterview.turnsRemaining;
  } else if (displayedInterviewTurnsRemaining === null) {
    displayedInterviewTurnsRemaining = currentInterview.turnsRemaining;
  }

  return displayedInterviewTurnsRemaining ?? currentInterview.turnsRemaining;
}

function getInterviewMusicTargets(turnsRemaining: number, isInterviewOver: boolean): Record<"interview" | "overtime", number> {
  let interviewVolume = 0;
  let overtimeVolume = 0;

  if (turnsRemaining > 4) {
    interviewVolume = 1;
  } else if (turnsRemaining === 4) {
    interviewVolume = 0.6;
  } else if (turnsRemaining === 3) {
    interviewVolume = 0.3;
  } else if (turnsRemaining === 2) {
    interviewVolume = 0.2;
  } else if (turnsRemaining === 1) {
    overtimeVolume = 0.1;
  } else {
    overtimeVolume = 0.6;
  }

  if (isInterviewOver) {
    interviewVolume = Math.min(interviewVolume, 0.2);
    overtimeVolume = Math.min(overtimeVolume, 0.2);
  }

  return {
    interview: interviewVolume,
    overtime: overtimeVolume,
  };
}

function setBackgroundMusicTargets(targets: Record<BackgroundMusicTrackId, number>): void {
  let shouldAnimate = false;

  for (const [trackId, track] of Object.entries(backgroundMusicTracks) as [BackgroundMusicTrackId, BackgroundMusicTrack][]) {
    const targetVolume = Math.max(0, Math.min(1, targets[trackId]));
    track.targetVolume = targetVolume;

    if (targetVolume > 0) {
      void playBackgroundMusicTrack(track);
    }

    if (Math.abs(track.currentVolume - track.targetVolume) > 0.0005) {
      shouldAnimate = true;
    }
  }

  if (shouldAnimate) {
    startBackgroundMusicAnimation();
  }
}

function syncBackgroundMusic(): void {
  if (state.isMusicMuted) {
    stopAllBackgroundMusic();
    return;
  }

  if (
    state.screen === "loading" ||
    state.screen === "error" ||
    state.screen === "home" ||
    state.screen === "setup"
  ) {
    stopAllBackgroundMusic();
    return;
  }

  if (state.screen === "shop") {
    setBackgroundMusicTargets({
      calm: 0.4,
      interview: 0,
      overtime: 0,
      results: 0,
    });
    return;
  }

  if (state.screen === "offer") {
    setBackgroundMusicTargets({
      calm: 0,
      interview: 0,
      overtime: 0,
      results: 1,
    });
    return;
  }

  if (!state.currentInterview || state.currentInterview.victoryResult || state.currentInterview.rejectionLetter) {
    stopAllBackgroundMusic();
    return;
  }

  const visibleTurnsRemaining = getDisplayedInterviewTurnsRemaining(state.currentInterview);

  if (visibleTurnsRemaining === null) {
    stopAllBackgroundMusic();
    return;
  }

  const interviewMusicTargets = getInterviewMusicTargets(
    Math.max(0, visibleTurnsRemaining),
    state.currentInterview.isInterviewerDefeated || state.currentInterview.isPlayerRejected,
  );

  setBackgroundMusicTargets({
    calm: 0,
    interview: interviewMusicTargets.interview,
    overtime: interviewMusicTargets.overtime,
    results: 0,
  });
}

function setTimeoutFrameSeverity(severity: number): void {
  if (!timeoutFrameElement) {
    return;
  }

  timeoutFrameElement.style.setProperty("--timeout-frame-severity", severity.toFixed(4));
}

function stepTimeoutFrameSeverity(timestamp: number): void {
  if (timeoutFrameLastTimestamp === null) {
    timeoutFrameLastTimestamp = timestamp;
  }

  const elapsedMs = timestamp - timeoutFrameLastTimestamp;
  timeoutFrameLastTimestamp = timestamp;
  const difference = timeoutFrameTargetSeverity - timeoutFrameDisplayedSeverity;

  if (Math.abs(difference) <= 0.0001) {
    timeoutFrameDisplayedSeverity = timeoutFrameTargetSeverity;
    setTimeoutFrameSeverity(timeoutFrameDisplayedSeverity);
    timeoutFrameAnimationFrameId = null;
    timeoutFrameLastTimestamp = null;
    return;
  }

  const maxStep = (elapsedMs / 1000) * 1.45;
  const nextStep = Math.min(Math.abs(difference), maxStep);

  timeoutFrameDisplayedSeverity += Math.sign(difference) * nextStep;
  setTimeoutFrameSeverity(timeoutFrameDisplayedSeverity);
  timeoutFrameAnimationFrameId = window.requestAnimationFrame(stepTimeoutFrameSeverity);
}

function animateTimeoutFrameSeverity(targetSeverity: number): void {
  timeoutFrameTargetSeverity = targetSeverity;

  if (timeoutFrameAnimationFrameId !== null) {
    return;
  }

  timeoutFrameLastTimestamp = null;
  timeoutFrameAnimationFrameId = window.requestAnimationFrame(stepTimeoutFrameSeverity);
}

function syncInterviewTimeoutFrame(): void {
  const currentInterview = state.screen === "interview" ? state.currentInterview : null;
  const visibleTurnsRemaining = getDisplayedInterviewTurnsRemaining(currentInterview);
  const shouldShowTimeoutFrame =
    currentInterview !== null &&
    visibleTurnsRemaining !== null &&
    visibleTurnsRemaining <= 2 &&
    !currentInterview.isInterviewerDefeated &&
    !currentInterview.isPlayerRejected &&
    !currentInterview.victoryResult &&
    !currentInterview.rejectionLetter;

  if (!timeoutFrameElement?.isConnected) {
    timeoutFrameElement = document.createElement("div");
    timeoutFrameElement.className = "interview-timeout-frame";
    timeoutFrameElement.setAttribute("aria-hidden", "true");
    document.body.appendChild(timeoutFrameElement);
    setTimeoutFrameSeverity(timeoutFrameDisplayedSeverity);
  }

  let severity = 0;

  if (shouldShowTimeoutFrame && visibleTurnsRemaining !== null) {
    const turnsRemaining = Math.max(0, visibleTurnsRemaining);

    if (turnsRemaining === 2) {
      severity = 0.5;
    } else if (turnsRemaining === 1) {
      severity = 0.8;
    } else if (turnsRemaining === 0) {
      severity = 1.2;
    }
  }

  animateTimeoutFrameSeverity(severity);
}

function syncDeckAttentionAnimation(): void {
  const deckAttentionButton = app.querySelector<HTMLButtonElement>('[data-action="toggle-deck"].nav-chip--attention');

  if (!deckAttentionButton) {
    deckAttentionStartedAt = null;
    return;
  }

  if (deckAttentionStartedAt === null) {
    deckAttentionStartedAt = performance.now();
  }

  const elapsedMs = Math.max(0, performance.now() - deckAttentionStartedAt);
  const cycleOffsetMs = elapsedMs % DECK_ATTENTION_SHIMMER_CYCLE_MS;

  deckAttentionButton.style.animationDelay = `-${cycleOffsetMs}ms`;
}

function syncOfferShimmerAnimation(): void {
  const offerCard = app.querySelector<HTMLElement>(".offer-card");

  if (!offerCard) {
    offerShimmerStartedAt = null;
    return;
  }

  if (offerShimmerStartedAt === null) {
    offerShimmerStartedAt = performance.now();
  }

  const elapsedMs = Math.max(0, performance.now() - offerShimmerStartedAt);
  const cycleOffsetMs = elapsedMs % OFFER_SHIMMER_CYCLE_MS;

  offerCard.style.setProperty("--offer-shimmer-delay", `-${cycleOffsetMs}ms`);
}

function render(): void {
  const chatScrollSnapshot = captureInterviewChatScroll();
  app.innerHTML = renderShell(state, renderScreen(state));
  restoreInterviewChatScroll(chatScrollSnapshot);
  syncInterviewTurnTimer();
  syncInterviewTimeoutFrame();
  syncDeckAttentionAnimation();
  syncOfferShimmerAnimation();
  syncBackgroundMusic();

  if (state.screen === "home" && state.data) {
    if (!hasLoggedHomeConnectionDebug) {
      const connectionCounts = state.data.connections.reduce(
        (counts, connection) => {
          counts[connection.rarity] += 1;
          return counts;
        },
        {
          common: 0,
          lame: 0,
          rare: 0,
          epic: 0,
          legendary: 0,
        },
      );

      console.log("[info] Connection counts", {
        lame: connectionCounts.lame,
        common: connectionCounts.common,
        rare: connectionCounts.rare,
        epic: connectionCounts.epic,
        legendary: connectionCounts.legendary,
      });
      hasLoggedHomeConnectionDebug = true;
    }
  } else {
    hasLoggedHomeConnectionDebug = false;
  }
}

function setHoldProgress(button: HTMLButtonElement, progress: number): void {
  if (progress <= 0) {
    button.classList.remove("hold-button--holding");
    button.style.removeProperty("--hold-progress");
    return;
  }

  button.classList.add("hold-button--holding");
  button.style.setProperty("--hold-progress", String(progress));
}

function clearPendingHold(): void {
  if (!pendingHold) {
    return;
  }

  cancelAnimationFrame(pendingHold.rafId);
  setHoldProgress(pendingHold.button, 0);
  pendingHold = null;
}

function clearPendingInterviewIntro(): void {
  if (pendingInterviewIntroTimeout === null) {
    return;
  }

  window.clearTimeout(pendingInterviewIntroTimeout);
  pendingInterviewIntroTimeout = null;
}

function completePendingHold(action: HoldAction): void {
  clearPendingHold();

  if (action.kind === "remove-card") {
    const nextState = removeDeckCard(state, action.deckIndex);

    if (nextState !== state) {
      gunshotAudio.currentTime = 0;
      void gunshotAudio.play().catch(() => undefined);
      setState(nextState);
    }

    return;
  }

  if (action.kind === "remove-item") {
    const nextState = removeItem(state, action.itemIndex);

    if (nextState !== state) {
      gunshotAudio.currentTime = 0;
      void gunshotAudio.play().catch(() => undefined);
      setState(nextState);
    }

    return;
  }

  if (action.kind === "reroll-buffer-card") {
    const nextState = rerollBufferCard(state, action.bufferIndex);

    if (nextState !== state) {
      playAudio(drawAudio);
      setState(nextState);
    }

    return;
  }

  if (action.kind === "retrieve-discard-card") {
    const nextState = retrieveDiscardPileCard(state, action.discardIndex);

    if (nextState !== state) {
      playAudio(drawAudio);
      setState(nextState);
    }

    return;
  }

  if (action.kind === "paid-draw") {
    const nextState = drawInterviewCard(state);

    if (nextState !== state) {
      playAudio(drawAudio);
      setState(nextState);
    }
  }
}

function tickPendingHold(timestamp: number): void {
  if (!pendingHold) {
    return;
  }

  const progress = Math.min((timestamp - pendingHold.startedAt) / pendingHold.durationMs, 1);
  setHoldProgress(pendingHold.button, progress);

  if (progress >= 1) {
    completePendingHold(pendingHold.action);
    return;
  }

  pendingHold.rafId = requestAnimationFrame(tickPendingHold);
}

function startPendingHold(button: HTMLButtonElement, action: HoldAction, pointerId: number, durationMs: number): void {
  clearPendingHold();

  pendingHold = {
    button,
    action,
    pointerId,
    startedAt: performance.now(),
    durationMs,
    rafId: 0,
  };
  setHoldProgress(button, 0.001);
  pendingHold.rafId = requestAnimationFrame(tickPendingHold);
}

function normalizeStateTransition(previousState: AppState, nextState: AppState): AppState {
  if (previousState.screen === "shop" && nextState.screen !== "shop" && nextState.buffer.length) {
    return {
      ...nextState,
      buffer: [],
    };
  }

  return nextState;
}

function setState(nextState: AppState): void {
  clearPendingHold();
  if (nextState.screen !== "interview") {
    clearPendingInterviewIntro();
  }
  state = normalizeStateTransition(state, nextState);
  render();
}

function updateState(update: (currentState: AppState) => AppState): void {
  const nextState = update(state);

  if (nextState !== state) {
    setState(nextState);
  }
}

function playAudio(audio: HTMLAudioElement): void {
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}

function playAudioByPath(path: string): void {
  let audio = oneShotAudioCache.get(path);

  if (!audio) {
    audio = new Audio(path);
    oneShotAudioCache.set(path, audio);
  }

  playAudio(audio);
}

function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function appendInterviewMessageWithSound(message: string): void {
  updateState((currentState) => appendInterviewMessage(currentState, message));
  playAudio(notificationAudio);
}

function sendPlayerChatMessage(): void {
  const input = app.querySelector<HTMLInputElement>(".interview-chat-composer__input");

  if (!input) {
    return;
  }

  const nextState = appendPlayerChatMessage(state, input.value);

  if (nextState === state) {
    return;
  }

  setState(nextState);
}

async function flashInterviewerDamage(): Promise<void> {
  updateState((currentState) => setInterviewerDamageFlashActive(currentState, true));
  playAudio(enemyDamageAudio);
  await sleep(INTERVIEW_DAMAGE_FLASH_DURATION_MS);
  updateState((currentState) => setInterviewerDamageFlashActive(currentState, false));
}

async function flashPlayerDamage(): Promise<void> {
  updateState((currentState) => setPlayerDamageFlashActive(currentState, true));
  playAudio(playerDamageAudio);
  await sleep(INTERVIEW_DAMAGE_FLASH_DURATION_MS);
  updateState((currentState) => setPlayerDamageFlashActive(currentState, false));
}

function rejectInterview(interviewerId: string): void {
  if (!state.data) {
    return;
  }

  const interviewer = getInterviewer(state.data, interviewerId);
  updateState((currentState) => markPlayerRejected(currentState));
  appendInterviewMessageWithSound(getInterviewerPlayerDeathDialog(interviewer));
}

async function resolveInterviewTurn(): Promise<void> {
  if (
    !state.data ||
    !state.run ||
    state.screen !== "interview" ||
    !state.currentInterview ||
    state.isTurnResolving ||
    state.currentInterview.isInterviewerDefeated ||
    state.currentInterview.isPlayerRejected ||
    Boolean(state.currentInterview.victoryResult) ||
    Boolean(state.currentInterview.rejectionLetter)
  ) {
    return;
  }

  const wasOvertimeTurn = state.currentInterview.turnsRemaining === 0;
  const turnsRemainingBeforeTick = state.currentInterview.turnsRemaining;
  const slotCount = state.currentInterview.slots.length;
  const messagesBeforeTurn = state.currentInterview.chatMessages.length;
  let shouldSkipInterviewerTurn = false;
  let playedCharmCount = 0;
  const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
  const currentPhaseDelay = getInterviewerDelay(interviewer, state.currentInterview.currentPhase);

  const frozenTurnTimerSeconds = getVisibleInterviewTurnTimerSeconds();
  let nextStateAtTurnStart = state;

  if (frozenTurnTimerSeconds !== null) {
    nextStateAtTurnStart = setInterviewTurnTimer(nextStateAtTurnStart, frozenTurnTimerSeconds);
  }

  clearInterviewTurnTimer();
  setState(setInterviewTurnResolving(nextStateAtTurnStart, true));
  updateState((currentState) => decrementInterviewTime(currentState));
  updateState((currentState) => shufflePlayedCards(currentState));
  const turnStartBuffResult = applyTurnStartBuffs(state);

  if (turnStartBuffResult.changed) {
    setState(turnStartBuffResult.state);
    playAudio(dingAudio);
    await sleep(INTERVIEW_CARD_APPLY_DELAY_MS);
  }

  updateState((currentState) => tickInterviewShieldReset(currentState));
  const timeoutJustTriggered =
    turnsRemainingBeforeTick > 0 &&
    state.screen === "interview" &&
    Boolean(state.currentInterview) &&
    state.currentInterview.turnsRemaining === 0;

  try {
    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      if (state.screen !== "interview" || !state.currentInterview) {
        return;
      }

      const isLastSlot = slotIndex === slotCount - 1;
      const triggeredCard = state.currentInterview.slots[slotIndex];

      if (triggeredCard?.type === "Charm") {
        playedCharmCount += 1;
      }

      updateState((currentState) => setActiveInterviewSlotIndex(currentState, slotIndex));
      playAudio(dingAudio);
      const nextState = applyInterviewSlot(state, state.run, slotIndex, playedCharmCount);

      if (nextState !== state) {
        setState(nextState);
      }
      
      await sleep(INTERVIEW_CARD_APPLY_DELAY_MS);
      updateState((currentState) => setActiveInterviewSlotIndex(currentState, null));
    }

    updateState((currentState) => applyInterviewExtraBuffs(currentState, playedCharmCount > 0));
    await sleep(INTERVIEW_CARD_APPLY_DELAY_MS);
    updateState((currentState) => roundInterviewCombatStats(currentState));
    updateState((currentState) => applyInterviewPostRoundAtkCap(currentState, playedCharmCount));

    if (state.screen !== "interview" || !state.currentInterview) {
      return;
    }

    if (state.currentInterview.currentAtk >= 1) {
      const damageToInterviewer = getInterviewerDamageAfterMitigation(
        state,
        state.currentInterview.currentAtk,
      );

      if (damageToInterviewer > 0) {
        updateState((currentState) => damageInterviewer(currentState, currentState.currentInterview?.currentAtk ?? 0));
        await flashInterviewerDamage();
      }
    }

    if (state.screen !== "interview" || !state.currentInterview || !state.data) {
      return;
    }

    await sleep(INTERVIEW_CARD_APPLY_DELAY_MS);

    if (state.currentInterview.currentHP < 1) {
      const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
      const defeatedPhaseIndex = state.currentInterview.currentPhase;
      updateState((currentState) => advanceInterviewerPhase(currentState));

      if (state.screen === "interview" && state.currentInterview && state.currentInterview.currentPhase > defeatedPhaseIndex) {
        appendInterviewMessageWithSound(getInterviewerPhaseDialog(interviewer, defeatedPhaseIndex));
      } else {
        updateState((currentState) => stabilizePlayerForInterviewVictory(currentState));
        updateState((currentState) => markInterviewerDefeated(currentState));
        appendInterviewMessageWithSound(getInterviewerDefeatedDialog(interviewer));
        return;
      }

      shouldSkipInterviewerTurn = true;
    }

    if (state.screen === "interview" && state.currentInterview && state.run.hp < 1) {
      rejectInterview(state.currentInterview.interviewer);
      return;
    }

    if (state.screen === "interview" && state.currentInterview && state.currentInterview.skipTurns > 0) {
      shouldSkipInterviewerTurn = true;
      updateState((currentState) => consumeInterviewerSkipTurn(currentState));
    }

    if (!shouldSkipInterviewerTurn && state.screen === "interview" && state.currentInterview) {
      if (currentPhaseDelay < 0) {
        updateState((currentState) => tickInterviewerMissProbability(currentState, wasOvertimeTurn));
        const shouldAttack =
          state.currentInterview.interviewerMissProbability <= 0 ||
          Math.random() > state.currentInterview.interviewerMissProbability;

        if (shouldAttack) {
          updateState((currentState) => resetInterviewerMissProbability(currentState));
          await sleep(INTERVIEW_CARD_APPLY_DELAY_MS);
          const damageToPlayer = getPlayerDamageAfterMitigation(
            state,
            state.currentInterview.currentInterviewerAtk,
          );

          if (damageToPlayer > 0) {
            updateState((currentState) => damagePlayer(currentState, currentState.currentInterview?.currentInterviewerAtk ?? 0));
            await flashPlayerDamage();
          }
        }
      } else {
        const shouldPlayPop = wasOvertimeTurn || state.currentInterview.turnsUntilAttack > 0;

        updateState((currentState) => tickInterviewerDelay(currentState, wasOvertimeTurn));

        if (shouldPlayPop) {
          playAudio(popAudio);
        }

        if (state.screen === "interview" && state.currentInterview && state.currentInterview.turnsUntilAttack === 0) {
          await sleep(INTERVIEW_CARD_APPLY_DELAY_MS);
          const damageToPlayer = getPlayerDamageAfterMitigation(
            state,
            state.currentInterview.currentInterviewerAtk,
          );

          if (damageToPlayer > 0) {
            updateState((currentState) => damagePlayer(currentState, currentState.currentInterview?.currentInterviewerAtk ?? 0));
            await flashPlayerDamage();
          }

          updateState((currentState) => resetInterviewerDelay(currentState));
        }
      }
    }

    if (state.screen === "interview" && state.currentInterview && state.run.hp < 1) {
      rejectInterview(state.currentInterview.interviewer);
      return;
    }

    updateState((currentState) => resetInterviewCurrentAtk(currentState));
    updateState((currentState) => resolveInterviewShieldReset(currentState));

    updateState((currentState) => discardInterviewSlotsAndQueueDraw(currentState));

    if (
      timeoutJustTriggered &&
      state.screen === "interview" &&
      state.currentInterview &&
      state.data &&
      state.run.hp > 0 &&
      state.currentInterview.currentHP > 0
    ) {
      const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
      updateState((currentState) => markTimeoutDialogSent(currentState));
      appendInterviewMessageWithSound(getInterviewerTimeoutDialog(interviewer));
    }

    if (wasOvertimeTurn && !shouldSkipInterviewerTurn) {
      updateState((currentState) => buffInterviewerAtkForOvertime(currentState));
    }

    if (
      state.screen === "interview" &&
      state.currentInterview &&
      state.run.hp > 0 &&
      state.currentInterview.currentHP > 0 &&
      state.currentInterview.chatMessages.length === messagesBeforeTurn &&
      messagesBeforeTurn > 0
    ) {
      const nextState = appendNextExtraDialog(state);

      if (nextState !== state) {
        playAudio(notificationAudio);
        setState(nextState);
      }
    }

  } finally {
    updateState((currentState) => {
      let nextState = setActiveInterviewSlotIndex(currentState, null);

      nextState = setInterviewerDisabled(nextState, false);
      nextState = resetInterviewTurnTimer(nextState);
      nextState = setInterviewTurnResolving(nextState, false);

      return nextState;
    });
  }
}

function scheduleInterviewIntro(): void {
  clearPendingInterviewIntro();

  pendingInterviewIntroTimeout = window.setTimeout(() => {
    pendingInterviewIntroTimeout = null;

    const hasInterviewerMessage =
      state.currentInterview?.chatMessages.some((message) => message.sender === "interviewer") ?? false;

    if (!state.data || state.screen !== "interview" || !state.currentInterview || hasInterviewerMessage) {
      return;
    }

    const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
    const nextState = appendInterviewMessage(state, getInterviewerIntroDialog(interviewer));

    if (nextState !== state) {
      playAudio(notificationAudio);
      setState(nextState);
    }
  }, INTERVIEW_INTRO_DELAY_MS);
}

async function bootstrap(): Promise<void> {
  render();

  try {
    const data = await loadGameData();
    setState(initializeState(data));
  } catch (error) {
    console.error(error);
    setState(createErrorState(state));
  }
}

app.addEventListener("pointerdown", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement) || !state.data || event.button !== 0) {
    return;
  }

  const holdButton = target.closest<HTMLButtonElement>(
    '[data-action="remove-card"], [data-action="remove-item"], [data-action="reroll-buffer-card"], [data-action="retrieve-discard-card"], [data-action="draw-card"][data-draw-mode="paid"]',
  );

  if (!holdButton) {
    return;
  }

  if (holdButton.disabled) {
    return;
  }

  event.preventDefault();

  if (holdButton.dataset.action === "remove-card" && holdButton.dataset.deckIndex) {
    startPendingHold(
      holdButton,
      {
        kind: "remove-card",
        deckIndex: Number(holdButton.dataset.deckIndex),
      },
      event.pointerId,
      DELETE_HOLD_DURATION_MS,
    );
    return;
  }

  if (holdButton.dataset.action === "remove-item" && holdButton.dataset.itemIndex) {
    startPendingHold(
      holdButton,
      {
        kind: "remove-item",
        itemIndex: Number(holdButton.dataset.itemIndex),
      },
      event.pointerId,
      DELETE_HOLD_DURATION_MS,
    );
    return;
  }

  if (holdButton.dataset.action === "reroll-buffer-card" && holdButton.dataset.bufferIndex) {
    startPendingHold(
      holdButton,
      {
        kind: "reroll-buffer-card",
        bufferIndex: Number(holdButton.dataset.bufferIndex),
      },
      event.pointerId,
      BUFFER_REROLL_HOLD_DURATION_MS,
    );
    return;
  }

  if (holdButton.dataset.action === "retrieve-discard-card" && holdButton.dataset.discardIndex) {
    startPendingHold(
      holdButton,
      {
        kind: "retrieve-discard-card",
        discardIndex: Number(holdButton.dataset.discardIndex),
      },
      event.pointerId,
      DELETE_HOLD_DURATION_MS,
    );
    return;
  }

  if (holdButton.dataset.action === "draw-card" && holdButton.dataset.drawMode === "paid") {
    startPendingHold(
      holdButton,
      {
        kind: "paid-draw",
      },
      event.pointerId,
      PAID_DRAW_HOLD_DURATION_MS,
    );
  }
});

window.addEventListener("pointermove", (event) => {
  if (!pendingHold || event.pointerId !== pendingHold.pointerId) {
    return;
  }

  const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);

  if (!hoveredElement || !pendingHold.button.contains(hoveredElement)) {
    clearPendingHold();
  }
});

window.addEventListener("pointerup", (event) => {
  if (!pendingHold || event.pointerId !== pendingHold.pointerId) {
    return;
  }

  clearPendingHold();
});

window.addEventListener("pointercancel", (event) => {
  if (!pendingHold || event.pointerId !== pendingHold.pointerId) {
    return;
  }

  clearPendingHold();
});

app.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }

  if (!(event.target instanceof HTMLInputElement)) {
    return;
  }

  if (!event.target.classList.contains("interview-chat-composer__input")) {
    return;
  }

  event.preventDefault();
  sendPlayerChatMessage();
});

app.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement) || !state.data) {
    return;
  }

  const actionButton = target.closest<HTMLElement>("[data-action]");

  if (actionButton?.dataset.action === "new-run") {
    setState(startNewRun(state));
    return;
  }

  if (actionButton?.dataset.action === "toggle-deck") {
    setState(toggleDeck(state));
    return;
  }

  if (actionButton?.dataset.action === "toggle-network") {
    setState(toggleNetwork(state));
    return;
  }

  if (actionButton?.dataset.action === "toggle-discard-pile") {
    setState(toggleDiscardPile(state));
    return;
  }

  if (actionButton?.dataset.action === "toggle-items") {
    setState(toggleItems(state));
    return;
  }

  if (actionButton?.dataset.action === "toggle-music-muted") {
    setState(toggleMusicMuted(state));
    return;
  }

  if (actionButton?.dataset.action === "toggle-shield-counter") {
    setState(toggleShieldCounter(state));
    return;
  }

  if (actionButton?.dataset.action === "toggle-sanity-counter") {
    setState(toggleSanityCounter(state));
    return;
  }

  if (actionButton?.dataset.action === "begin-run") {
    setState(enterShop(state));
    return;
  }

  if (actionButton?.dataset.action === "next-interview") {
    const nextState = enterInterviewArena(state);

    if (nextState !== state) {
      setState(nextState);
      scheduleInterviewIntro();
    }

    return;
  }

  if (actionButton?.dataset.action === "disconnect-interview") {
    if (state.screen === "interview" && state.currentInterview?.isPlayerRejected) {
      const preventedRejectionState = preventInterviewRejection(state);

      if (preventedRejectionState !== state) {
        playAudio(victoryAudio);
        setState(preventedRejectionState);
        return;
      }

      const nextState = disconnectInterviewRejected(state);

      if (nextState !== state) {
        playAudio(rejectedAudio);
        setState(nextState);
      }

      return;
    }

    const nextState = disconnectInterviewVictory(state);

    if (nextState !== state) {
      playAudio(victoryAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "back-to-grind") {
    setState(returnToShopAfterInterviewVictory(state));
    return;
  }

  if (actionButton?.dataset.action === "reapply") {
    setState(reapplyAfterInterviewRejection(state));
    return;
  }

  if (actionButton?.dataset.action === "retry-interview") {
    const nextState = retryInterviewRejection(state);

    if (nextState !== state) {
      setState(nextState);
      scheduleInterviewIntro();
    }

    return;
  }

  if (actionButton?.dataset.action === "main-menu") {
    setState(returnToMainMenu(state));
    return;
  }

  if (actionButton?.dataset.action === "play-turn") {
    void resolveInterviewTurn();
    return;
  }

  if (actionButton?.dataset.action === "send-chat-message") {
    sendPlayerChatMessage();
    return;
  }

  if (actionButton?.dataset.action === "skip-phase-with-chris") {
    if (!state.data || state.screen !== "interview" || !state.currentInterview) {
      return;
    }

    const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
    const skippedPhaseIndex = state.currentInterview.currentPhase;
    const isLastSkippedPhase = skippedPhaseIndex >= interviewer.hps.length - 1;
    const nextState = useChrisPhaseSkip(state);

    if (nextState !== state) {
      const message = isLastSkippedPhase
        ? getInterviewerDefeatedDialog(interviewer)
        : getInterviewerPhaseDialog(interviewer, skippedPhaseIndex);

      playAudio(skippedAudio);
      setState(appendInterviewMessage(nextState, message));
    }

    return;
  }

  if (actionButton?.dataset.action === "refresh-shop") {
    const nextState = refreshShopSuggestions(state);

    if (nextState !== state) {
      playAudio(rerollAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "buy-premium") {
    const nextState = purchaseLinkedOutTier(state, "premium");

    if (nextState !== state) {
      playAudio(cashRegisterAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "buy-booster-pack" && actionButton.dataset.boosterPack) {
    const nextState = purchaseBoosterPack(state, actionButton.dataset.boosterPack);

    if (nextState !== state) {
      playAudio(packetAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "buy-item" && actionButton.dataset.itemIndex) {
    const nextState = purchaseItem(state, Number(actionButton.dataset.itemIndex));

    if (nextState !== state) {
      playAudio(cashRegisterAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "touching-grass-upgrade" && actionButton.dataset.upgrade) {
    const upgrade = actionButton.dataset.upgrade;

    if (upgrade === "hp" || upgrade === "energy" || upgrade === "atk" || upgrade === "shield") {
      const nextState = purchaseTouchingGrassUpgrade(state, upgrade);

      if (nextState !== state) {
        playAudio(cashRegisterAudio);
        setState(nextState);
      }
    }

    return;
  }

  if (actionButton?.dataset.action === "buy-brain-capacity") {
    const nextState = purchaseBrainCapacityUpgrade(state);

    if (nextState !== state) {
      playAudio(cashRegisterAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "buy-touching-grass-removal") {
    const nextState = purchaseTouchingGrassRemoval(state);

    if (nextState !== state) {
      playAudio(cashRegisterAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "buy-leekcode-premium") {
    const nextState = purchaseLeekCodePremium(state);

    if (nextState !== state) {
      playAudio(cashRegisterAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "buy-awazon-prime") {
    const nextState = purchaseAwazonPrime(state);

    if (nextState !== state) {
      playAudio(cashRegisterAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "buy-platinum") {
    const nextState = purchaseLinkedOutTier(state, "platinum");

    if (nextState !== state) {
      playAudio(cashRegisterAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "interview-hand-prev") {
    setState(goToPreviousInterviewHandPage(state));
    return;
  }

  if (actionButton?.dataset.action === "interview-hand-next") {
    setState(goToNextInterviewHandPage(state));
    return;
  }

  if (actionButton?.dataset.action === "draw-card") {
    if (actionButton.dataset.drawMode === "paid") {
      return;
    }

    const nextState = drawInterviewCard(state);

    if (nextState !== state) {
      playAudio(drawAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "play-hand-card" && actionButton.dataset.handIndex) {
    setState(placeHandCardInSlot(state, Number(actionButton.dataset.handIndex)));
    return;
  }

  if (actionButton?.dataset.action === "remove-slotted-card" && actionButton.dataset.slotIndex) {
    setState(returnSlottedCardToHand(state, Number(actionButton.dataset.slotIndex)));
    return;
  }

  if (actionButton?.dataset.action === "add-buffer-card" && actionButton.dataset.bufferIndex) {
    const nextState = addBufferCardToDeck(state, Number(actionButton.dataset.bufferIndex));

    if (nextState !== state) {
      playAudio(loadAudio);
      setState(nextState);
    }

    return;
  }

  if (actionButton?.dataset.action === "use-item" && actionButton.dataset.itemIndex) {
    const itemIndex = Number(actionButton.dataset.itemIndex);
    const item = state.items[itemIndex];
    const nextState = consumeItem(state, itemIndex);

    if (nextState !== state && item) {
      playAudioByPath(item.sound);
      setState(nextState);
    }

    return;
  }

  if (
    actionButton?.dataset.action === "remove-card" ||
    actionButton?.dataset.action === "remove-item" ||
    actionButton?.dataset.action === "reroll-buffer-card" ||
    (actionButton?.dataset.action === "draw-card" && actionButton.dataset.drawMode === "paid")
  ) {
    return;
  }

  if (actionButton?.dataset.action === "connect" && actionButton.dataset.connection) {
    const nextState = connectToSuggestion(state, actionButton.dataset.connection);

    if (nextState !== state) {
      playAudio(linkedinNotificationAudio);
      setState(nextState);
    }

    return;
  }

  const characterButton = target.closest<HTMLElement>("[data-character]");

  if (characterButton?.dataset.character) {
    setState(selectCharacter(state, characterButton.dataset.character));
    return;
  }

  const difficultyButton = target.closest<HTMLElement>("[data-difficulty]");

  if (difficultyButton?.dataset.difficulty) {
    setState(selectDifficulty(state, difficultyButton.dataset.difficulty));
  }
});

void bootstrap();
