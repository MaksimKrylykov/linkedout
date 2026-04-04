import { buildInterviewSlotEnergyRefills, INTERVIEW_HAND_PAGE_SIZE, INTERVIEW_PAID_DRAW_ENERGY_COST, getCharacter, getDifficulty, getInterviewer, getScaledInterviewerHP, requireSelection, } from "../state/appState.js";
import { renderCardDetails, renderExtraEffects } from "../ui/markup.js";
function renderTierBadge(tier) {
    if (tier === "premium") {
        return `<span class="membership-badge membership-badge--premium" aria-label="LinkedOut Premium">LO</span>`;
    }
    if (tier === "platinum") {
        return `<span class="membership-badge membership-badge--platinum" aria-label="LinkedOut Platinum">LO</span>`;
    }
    return "";
}
function renderLeekCodeAvatarBadge(hasLeekCodePremium) {
    if (!hasLeekCodePremium) {
        return "";
    }
    return `
    <span class="leetcode-badge" aria-label="LeekCode Premium">
      <span class="leetcode-badge__star" aria-hidden="true">★</span>
    </span>
  `;
}
function renderDelayBar(turnsUntilAttack, delay) {
    return `
    <div class="interview-delay" style="--delay-count: ${delay};" aria-label="Turns until attack">
      ${Array.from({ length: delay }, (_, index) => {
        const isActive = index < turnsUntilAttack;
        return `<span class="interview-delay__chunk${isActive ? " interview-delay__chunk--active" : ""}"></span>`;
    }).join("")}
    </div>
  `;
}
function renderChatMessages(messages, interviewerName, interviewerImage) {
    if (!messages.length) {
        return `<div class="interview-chat__empty"></div>`;
    }
    return messages
        .map((message) => `
        <div class="interview-chat__row">
          <img class="interview-chat__avatar" src="${interviewerImage}" alt="${interviewerName}" />
          <div class="interview-chat__bubble">
            ${message}
          </div>
        </div>
      `)
        .join("");
}
function renderInterviewerDescriptions(descriptions) {
    if (!descriptions.length) {
        return "";
    }
    return `
    <div class="interviewer-card__description">
      ${descriptions
        .map((description) => `
            <p class="interviewer-card__description-line">${description}</p>
          `)
        .join("")}
    </div>
  `;
}
function getPhaseLabel(currentPhase) {
    if (currentPhase === 0) {
        return "Main Problem";
    }
    return `Follow-up #${currentPhase}`;
}
function renderInterviewCard(card, variant, actionMarkup, ariaLabel, isDisabled = false) {
    return `
    <button
      class="interview-play-card__button${isDisabled ? " interview-play-card__button--disabled" : ""}"
      type="button"
      ${actionMarkup}
      aria-label="${ariaLabel}"
      ${isDisabled ? "disabled" : ""}
    >
      <article class="deck-card interview-play-card interview-play-card--${variant}">
        <div class="deck-card__body interview-play-card__body">
          <div class="interview-play-card__top">
            <img class="interview-play-card__thumb" src="${card.image}" alt="${card.name} card art" />
            <span class="status-pill interview-play-card__type-badge deck-card__type-badge--${card.type.toLowerCase()}">${card.type}</span>
          </div>
          <div class="deck-card__header interview-play-card__header">
            <strong class="deck-card__name rarity rarity--${card.rarity}">${card.name}</strong>
          </div>
          ${renderCardDetails(card)}
          ${renderExtraEffects(card)}
        </div>
      </article>
    </button>
  `;
}
function renderInterviewResults(state) {
    if (!state.currentInterview) {
        return "";
    }
    if (state.currentInterview.rejectionLetter) {
        return `
      <section class="card interview-results-card">
        <div class="summary-card__header">
          <div>
            <p class="eyebrow">Interview Results</p>
            <h2>Application Update</h2>
          </div>
        </div>
        <div class="interview-results-card__letter">
          ${state.currentInterview.rejectionLetter.map((paragraph) => `<p>${paragraph}</p>`).join("")}
        </div>
        <button class="cta-button interview-results-card__button" type="button" data-action="reapply">
          Reapply
        </button>
      </section>
    `;
    }
    if (!state.currentInterview.victoryResult) {
        return "";
    }
    const { sanityReward, turnsLeft, timeBonus, connectionsBonus, totalSanityGain, rejectionPreventedBy } = state.currentInterview.victoryResult;
    return `
    <section class="card interview-results-card">
      <div class="summary-card__header">
        <div>
          <p class="eyebrow">Interview Results</p>
          <h2>Call Wrapped</h2>
        </div>
      </div>
      ${rejectionPreventedBy
        ? `<p class="interview-results-card__note">Rejection prevented by <strong>${rejectionPreventedBy}</strong></p>`
        : ""}
      <div class="summary-stats">
        <div class="summary-stat">
          <span>Sanity Reward</span>
          <strong>🧠 ${sanityReward}</strong>
        </div>
        <div class="summary-stat">
          <span>Turns Left</span>
          <strong>${turnsLeft}</strong>
        </div>
        <div class="summary-stat">
          <span>Time Bonus</span>
          <strong>🧠 ${timeBonus}</strong>
        </div>
        <div class="summary-stat">
          <span>Connections Bonus</span>
          <strong>🧠 ${connectionsBonus}</strong>
        </div>
        <div class="summary-stat">
          <span>Total Sanity Gain</span>
          <strong>🧠 ${totalSanityGain}</strong>
        </div>
      </div>
      <button class="cta-button interview-results-card__button" type="button" data-action="back-to-grind">
        Back to the grind
      </button>
    </section>
  `;
}
function renderStageSlots(slots, slotEnergyRefills, activeSlotIndex, isInteractionLocked) {
    return `
    <div class="interview-stage__slots">
      ${slots
        .map((card, index) => {
        const slotEnergyRefill = slotEnergyRefills[index] ?? 1;
        const slotMarkup = !card
            ? `
              <div class="interview-slot interview-slot--empty${activeSlotIndex === index ? " interview-slot--active" : ""}">
                <span class="interview-slot__bonus">⚡ +${slotEnergyRefill}</span>
              </div>
            `
            : `
              <div class="interview-slot interview-slot--filled${activeSlotIndex === index ? " interview-slot--active" : ""}">
                ${renderInterviewCard(card, "slot", `data-action="remove-slotted-card" data-slot-index="${index}"`, `Return ${card.name} to hand`, isInteractionLocked)}
              </div>
            `;
        const arrowMarkup = index < slots.length - 1
            ? `
              <div class="interview-stage__arrow" aria-hidden="true">↓</div>
            `
            : "";
        return `
            <div class="interview-stage__slot-group">
              ${slotMarkup}
              ${arrowMarkup}
            </div>
          `;
    })
        .join("")}
    </div>
  `;
}
function renderHandCards(hand, handPage, availableEnergy, hasFreeSlot, isInteractionLocked) {
    const totalPages = Math.max(1, Math.ceil(hand.length / INTERVIEW_HAND_PAGE_SIZE));
    const pageStart = handPage * INTERVIEW_HAND_PAGE_SIZE;
    const visibleCards = hand.slice(pageStart, pageStart + INTERVIEW_HAND_PAGE_SIZE);
    const placeholders = Math.max(0, INTERVIEW_HAND_PAGE_SIZE - visibleCards.length);
    const cardsMarkup = visibleCards
        .map((card, index) => {
        const isDisabled = card.energyCost > availableEnergy || !hasFreeSlot || isInteractionLocked;
        return renderInterviewCard(card, "hand", `data-action="play-hand-card" data-hand-index="${pageStart + index}"`, `Place ${card.name} in the next free slot`, isDisabled);
    })
        .join("");
    return {
        cardsMarkup: cardsMarkup +
            Array.from({ length: placeholders }, () => `<div class="interview-hand__placeholder" aria-hidden="true"></div>`).join(""),
        totalPages,
    };
}
export function renderInterviewView(state) {
    if (!state.data || !state.run || !state.currentInterview) {
        throw new Error("Cannot render interview view without game data, run, and interview state.");
    }
    const { characterId, difficultyId } = requireSelection(state);
    const selectedCharacter = getCharacter(state.data, characterId);
    const selectedDifficulty = getDifficulty(state.data, difficultyId);
    const interviewer = getInterviewer(state.data, state.currentInterview.interviewer);
    const currentPhase = state.currentInterview.currentPhase;
    const currentPhaseHP = getScaledInterviewerHP(state.data, state.run, interviewer, currentPhase);
    const currentPhaseDelay = interviewer.delays[currentPhase];
    const hasFreeSlot = state.currentInterview.slots.some((slot) => slot === null);
    const hasVictoryResults = Boolean(state.currentInterview.victoryResult);
    const hasRejectionResults = Boolean(state.currentInterview.rejectionLetter);
    const hasResolvedResults = hasVictoryResults || hasRejectionResults;
    const hasChrisSkip = state.connectedConnectionIds.includes("chris");
    const isChrisSkipDisabled = state.isTurnResolving ||
        state.currentInterview.isInterviewerDefeated ||
        state.currentInterview.isPlayerRejected ||
        hasResolvedResults;
    const isInteractionLocked = state.isTurnResolving ||
        state.currentInterview.isInterviewerDefeated ||
        state.currentInterview.isPlayerRejected ||
        hasResolvedResults;
    const isPaidDraw = state.currentInterview.pendingDrawCount < 1 && state.run.energy >= INTERVIEW_PAID_DRAW_ENERGY_COST;
    const canDrawCard = !isInteractionLocked &&
        (state.currentInterview.pendingDrawCount > 0 || state.run.energy >= INTERVIEW_PAID_DRAW_ENERGY_COST);
    const slotEnergyRefills = buildInterviewSlotEnergyRefills(state.run);
    const { cardsMarkup: handCardsMarkup, totalPages } = renderHandCards(state.currentInterview.hand, state.currentInterview.handPage, state.run.energy, hasFreeSlot, isInteractionLocked);
    return `
    <main class="layout layout--setup">
      <aside class="rail rail--profile">
        <section class="card summary-card${state.isPlayerDamageFlashActive ? " summary-card--damage-flash" : ""}">
          ${renderTierBadge(state.run.linkedOutTier)}
          <div class="summary-card__header">
            <p class="eyebrow">Run Info</p>
          </div>
          <div class="summary-card__identity">
            <div class="summary-card__avatar">
              <img src="${selectedCharacter.image}" alt="${selectedCharacter.name}" />
              ${renderLeekCodeAvatarBadge(state.run.hasLeekCodePremium)}
            </div>
            <div>
              <h2>${selectedCharacter.name}</h2>
              <p class="muted">${selectedCharacter.tagline}</p>
            </div>
          </div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span>❤️ HP</span>
              <strong>${state.run.hp} / ${state.run.maxHP}</strong>
            </div>
            <div class="summary-stat">
              <span>⚡ Energy</span>
              <strong>${state.run.energy} / ${state.run.maxEnergy}</strong>
            </div>
            <div class="summary-stat">
              <span>🗡️ Atk</span>
              <strong>${state.run.baseAtk}</strong>
            </div>
            <div class="summary-stat">
              <span>🧠 Sanity</span>
              <strong>${state.run.sanity}</strong>
            </div>
            <div class="summary-stat">
              <span>Difficulty</span>
              <strong>${selectedDifficulty.name}</strong>
            </div>
            <div class="summary-stat">
              <span>Rounds Passed</span>
              <strong>${state.run.roundsPassed}</strong>
            </div>
          </div>
        </section>

        <section class="card side-card">
          <div class="summary-card__header">
            <p class="eyebrow">Interview Status</p>
          </div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span>Time Left</span>
              <strong class="${state.currentInterview.turnsRemaining === 0 ? "summary-stat__danger" : ""}">${state.currentInterview.turnsRemaining} turns</strong>
            </div>
            <div class="summary-stat">
              <span>Phase</span>
              <strong>${getPhaseLabel(currentPhase)}</strong>
            </div>
            ${hasChrisSkip
        ? `
                  <div class="summary-stat interview-status__skip-row">
                    <button
                      class="interview-status__skip-button"
                      type="button"
                      data-action="skip-phase-with-chris"
                      aria-label="Skip current phase with Impossible Chris"
                      ${isChrisSkipDisabled ? "disabled" : ""}
                    >
                      <img src="/img/misc/skip.webp" alt="" aria-hidden="true" />
                    </button>
                  </div>
                `
        : ""}
          </div>
        </section>
      </aside>

      <section class="feed">
        ${hasResolvedResults
        ? renderInterviewResults(state)
        : `
              <section class="card interview-stage" aria-label="Interview arena">
                <div class="interview-stage__header">
                  <div class="interview-stage__copy">
                    <p class="eyebrow">Arena</p>
                  </div>
                  <div class="interview-stage__controls">
                    <button
                      class="cta-button cta-button--secondary interview-stage__play-button"
                      type="button"
                      data-action="play-turn"
                      ${isInteractionLocked ? "disabled" : ""}
                    >
                      ${state.isTurnResolving ? "Resolving..." : "Play"}
                    </button>
                  </div>
                </div>
                ${renderStageSlots(state.currentInterview.slots, slotEnergyRefills, state.activeInterviewSlotIndex, isInteractionLocked)}
              </section>
            `}
      </section>

      <aside class="rail rail--news">
        <section class="card interviewer-card${state.isInterviewerDisabled ? " interviewer-card--disabled" : ""}${state.isInterviewerDamageFlashActive ? " interviewer-card--damage-flash" : ""}">
          <div class="interviewer-card__identity">
            <div>
              <p class="eyebrow">Interviewer</p>
              <h2>${interviewer.name}</h2>
              <p class="muted">${interviewer.tagline}</p>
            </div>
            <img class="interviewer-card__image" src="${interviewer.image}" alt="${interviewer.name}" />
          </div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span>❤️ HP</span>
              <strong>${state.currentInterview.currentHP} / ${currentPhaseHP}</strong>
            </div>
            <div class="summary-stat">
              <span>🗡️ Atk</span>
              <strong class="${state.currentInterview.turnsRemaining === 0 ? "summary-stat__danger" : ""}">
                ${state.currentInterview.currentInterviewerAtk}
              </strong>
            </div>
            <div class="summary-stat summary-stat--stacked">
              <span>Turns Until Attack</span>
              <div class="interview-delay-wrap">
                ${renderDelayBar(state.currentInterview.turnsUntilAttack, currentPhaseDelay)}
              </div>
            </div>
          </div>
          ${renderInterviewerDescriptions(interviewer.descriptions)}
        </section>

        <section class="card interview-chat-card">
          <div class="summary-card__header">
            <div>
              <p class="eyebrow">Chat</p>
            </div>
          </div>
          <div class="interview-chat">
            ${renderChatMessages(state.currentInterview.chatMessages, interviewer.name, interviewer.image)}
          </div>
        </section>

        <section class="card side-card">
          <div class="summary-card__header">
            <p class="eyebrow">Call</p>
          </div>
          <button
            class="interview-disconnect-button"
            type="button"
            data-action="disconnect-interview"
            ${(state.currentInterview.isInterviewerDefeated || state.currentInterview.isPlayerRejected) && !hasResolvedResults
        ? ""
        : "disabled"}
          >
            ${hasResolvedResults ? "Disconnected" : "Disconnect"}
          </button>
        </section>
      </aside>

      ${hasResolvedResults
        ? ""
        : `
            <section class="card interview-hand-card interview-hand-card--wide">
              <div class="interview-hand-card__header">
                <div>
                  <p class="eyebrow">Hand</p>
                  <h2>${state.currentInterview.hand.length} Cards Ready</h2>
                </div>
                <div class="interview-hand-card__status">
                  <span class="stat-pill">⚡ ${state.run.energy} / ${state.run.maxEnergy}</span>
                  <span class="stat-pill">Draw pile: ${state.currentInterview.drawPile.length}</span>
                  <button
                    class="cta-button cta-button--secondary interview-hand-card__draw-button${isPaidDraw ? " hold-button" : ""}"
                    type="button"
                    data-action="draw-card"
                    data-draw-mode="${isPaidDraw ? "paid" : "queued"}"
                    ${canDrawCard ? "" : "disabled"}
                  >
                    <span>
                      Draw Card${state.currentInterview.pendingDrawCount > 0
            ? ` (${state.currentInterview.pendingDrawCount})`
            : ` (-${INTERVIEW_PAID_DRAW_ENERGY_COST}⚡)`}
                    </span>
                  </button>
                </div>
              </div>
              <div class="interview-hand__grid">
                ${handCardsMarkup || `<div class="interview-hand__empty">No cards in hand.</div>`}
              </div>
              <div class="interview-hand__footer">
                <button
                  class="interview-hand__nav"
                  type="button"
                  data-action="interview-hand-prev"
                  aria-label="Previous hand page"
                  ${state.currentInterview.handPage <= 0 || isInteractionLocked ? "disabled" : ""}
                >
                  ←
                </button>
                <p class="muted">Page ${state.currentInterview.handPage + 1} / ${totalPages}</p>
                <button
                  class="interview-hand__nav"
                  type="button"
                  data-action="interview-hand-next"
                  aria-label="Next hand page"
                  ${state.currentInterview.handPage >= totalPages - 1 || isInteractionLocked ? "disabled" : ""}
                >
                  →
                </button>
              </div>
            </section>
          `}
    </main>
  `;
}
