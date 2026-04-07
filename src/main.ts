import { loadGameData } from "./data/loadGameData.js";
import {
  addAllBufferCards,
  addBufferCardToDeck,
  advanceInterviewerPhase,
  applyInterviewSlot,
  applyInterviewExtraBuffs,
  applyInterviewPostRoundAtkCap,
  appendInterviewMessage,
  buffInterviewerAtkForOvertime,
  connectToSuggestion,
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
  getInterviewerIntroDialog,
  getInterviewerPhaseDialog,
  getInterviewerPlayerDeathDialog,
  getInterviewerTimeoutDialog,
  goToNextInterviewHandPage,
  goToPreviousInterviewHandPage,
  initializeState,
  placeHandCardInSlot,
  preventInterviewRejection,
  purchaseBoosterPack,
  purchaseBrainCapacityUpgrade,
  purchaseLeekCodePremium,
  purchaseLinkedOutTier,
  purchaseTouchingGrassRemoval,
  purchaseTouchingGrassUpgrade,
  removeDeckCard,
  refreshShopSuggestions,
  reapplyAfterInterviewRejection,
  resolveInterviewShieldReset,
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
  setPlayerDamageFlashActive,
  markInterviewerDefeated,
  markPlayerRejected,
  resetInterviewerMissProbability,
  stabilizePlayerForInterviewVictory,
  startNewRun,
  tickInterviewerDelay,
  tickInterviewerMissProbability,
  tickInterviewShieldReset,
  toggleDeck,
  toggleDiscardPile,
  toggleMusicMuted,
  toggleNetwork,
  toggleSanityCounter,
  toggleShieldCounter,
  useChrisPhaseSkip,
} from "./state/appState.js";
import { renderShell } from "./ui/markup.js";
import { renderHomeView } from "./views/homeView.js";
import { renderInterviewView } from "./views/interviewView.js";
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
const calmMusicAudio = new Audio("/sfx/calm.mp3");
const interviewMusicAudio = new Audio("/sfx/interview.mp3");
const overtimeMusicAudio = new Audio("/sfx/overtime.ogg");
const DELETE_HOLD_DURATION_MS = 500;
const ADD_ALL_HOLD_DURATION_MS = 1000;
const PAID_DRAW_HOLD_DURATION_MS = 500;
const INTERVIEW_INTRO_DELAY_MS = 300;
const INTERVIEW_CARD_APPLY_DELAY_MS = 500;
const INTERVIEW_DAMAGE_FLASH_DURATION_MS = 200;
const BACKGROUND_MUSIC_VOLUME_SPEED = 0.3;
const DECK_ATTENTION_SHIMMER_CYCLE_MS = 2800;

type HoldAction =
  | {
      kind: "remove-card";
      deckIndex: number;
    }
  | {
      kind: "add-all-buffer";
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

type ScrollSnapshot = {
  distanceFromBottom: number;
};

type BackgroundMusicTrackId = "calm" | "interview" | "overtime";

type BackgroundMusicTrack = {
  audio: HTMLAudioElement;
  currentVolume: number;
  targetVolume: number;
};

const backgroundMusicTracks: Record<BackgroundMusicTrackId, BackgroundMusicTrack> = {
  calm: {
    audio: calmMusicAudio,
    currentVolume: 0,
    targetVolume: 0,
  },
  interview: {
    audio: interviewMusicAudio,
    currentVolume: 0,
    targetVolume: 0,
  },
  overtime: {
    audio: overtimeMusicAudio,
    currentVolume: 0,
    targetVolume: 0,
  },
};

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

function configureLoopingMusicTrack(audio: HTMLAudioElement): void {
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
}

for (const track of Object.values(backgroundMusicTracks)) {
  configureLoopingMusicTrack(track.audio);
  track.audio.addEventListener("ended", () => {
    if (track.targetVolume <= 0) {
      return;
    }

    track.audio.loop = true;
    track.audio.currentTime = 0;
    void track.audio.play().catch(() => undefined);
  });
}

function playLoopingMusic(track: BackgroundMusicTrack): void {
  track.audio.loop = true;

  if (track.audio.ended) {
    track.audio.currentTime = 0;
  }

  if (!track.audio.paused) {
    return;
  }

  void track.audio.play().catch(() => undefined);
}

function stopLoopingMusic(track: BackgroundMusicTrack): void {
  track.targetVolume = 0;
  track.currentVolume = 0;
  track.audio.volume = 0;
  track.audio.pause();
  track.audio.currentTime = 0;
}

function stopAllBackgroundMusic(): void {
  if (backgroundMusicAnimationFrameId !== null) {
    cancelAnimationFrame(backgroundMusicAnimationFrameId);
    backgroundMusicAnimationFrameId = null;
  }

  backgroundMusicLastTimestamp = null;

  for (const track of Object.values(backgroundMusicTracks)) {
    stopLoopingMusic(track);
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
      playLoopingMusic(track);
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
    track.audio.volume = safeVolume;

    if (track.targetVolume === 0 && safeVolume === 0) {
      if (!track.audio.paused || track.audio.currentTime !== 0) {
        track.audio.pause();
        track.audio.currentTime = 0;
      }
      continue;
    }

    if (track.targetVolume > 0 && track.audio.paused) {
      playLoopingMusic(track);
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
      playLoopingMusic(track);
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

function render(): void {
  const chatScrollSnapshot = captureInterviewChatScroll();
  app.innerHTML = renderShell(state, renderScreen(state));
  restoreInterviewChatScroll(chatScrollSnapshot);
  syncInterviewTimeoutFrame();
  syncDeckAttentionAnimation();
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

  if (action.kind === "add-all-buffer") {
    const nextState = addAllBufferCards(state);

    if (nextState !== state) {
      loadAudio.currentTime = 0;
      void loadAudio.play().catch(() => undefined);
      setState(nextState);
    }

    return;
  }

  const nextState = drawInterviewCard(state);

  if (nextState !== state) {
    playAudio(drawAudio);
    setState(nextState);
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

function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function appendInterviewMessageWithSound(message: string): void {
  updateState((currentState) => appendInterviewMessage(currentState, message));
  playAudio(notificationAudio);
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
  let shouldSkipInterviewerTurn = false;
  let foundCharmCard = false;
  const currentPhaseDelay = state.data.interviewers.find(({ id }) => id === state.currentInterview?.interviewer)?.delays[
    state.currentInterview.currentPhase
  ] ?? 0;

  setState(setInterviewTurnResolving(state, true));
  updateState((currentState) => tickInterviewShieldReset(currentState));
  updateState((currentState) => decrementInterviewTime(currentState));
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
        foundCharmCard = true;
      }

      updateState((currentState) => setActiveInterviewSlotIndex(currentState, slotIndex));
      playAudio(dingAudio);
      const nextState = applyInterviewSlot(state, state.run, slotIndex);

      if (nextState !== state) {
        setState(nextState);
      }
      
      await sleep(INTERVIEW_CARD_APPLY_DELAY_MS);
      updateState((currentState) => setActiveInterviewSlotIndex(currentState, null));
    }

    updateState((currentState) => applyInterviewExtraBuffs(currentState, foundCharmCard));
    await sleep(INTERVIEW_CARD_APPLY_DELAY_MS);
    updateState((currentState) => roundInterviewCombatStats(currentState));
    updateState((currentState) => applyInterviewPostRoundAtkCap(currentState, foundCharmCard));

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
      appendInterviewMessageWithSound(getInterviewerTimeoutDialog(interviewer));
    }

    if (wasOvertimeTurn && !shouldSkipInterviewerTurn) {
      updateState((currentState) => buffInterviewerAtkForOvertime(currentState));
    }
  } finally {
    updateState((currentState) => setActiveInterviewSlotIndex(currentState, null));
    updateState((currentState) => setInterviewerDisabled(currentState, false));
    updateState((currentState) => setInterviewTurnResolving(currentState, false));
  }
}

function scheduleInterviewIntro(): void {
  clearPendingInterviewIntro();

  pendingInterviewIntroTimeout = window.setTimeout(() => {
    pendingInterviewIntroTimeout = null;

    if (!state.data || state.screen !== "interview" || !state.currentInterview || state.currentInterview.chatMessages.length) {
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
    '[data-action="remove-card"], [data-action="add-all-buffer"], [data-action="draw-card"][data-draw-mode="paid"]',
  );

  if (!holdButton) {
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

  if (holdButton.dataset.action === "add-all-buffer") {
    startPendingHold(
      holdButton,
      {
        kind: "add-all-buffer",
      },
      event.pointerId,
      ADD_ALL_HOLD_DURATION_MS,
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

  if (actionButton?.dataset.action === "play-turn") {
    void resolveInterviewTurn();
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

  if (
    actionButton?.dataset.action === "remove-card" ||
    actionButton?.dataset.action === "add-all-buffer" ||
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
