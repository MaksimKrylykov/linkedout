import { predictPlayerDamage } from "../state/appState.js";
import type { AppState, Card, Character, Connection, Item } from "../types.js";

function formatCombatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

export function renderCharacterStats(character: Character): string {
  return `
    <div class="stat-pill">❤️ ${character.maxHP}</div>
    <div class="stat-pill">⚡ ${character.maxEnergy}</div>
    <div class="stat-pill">🗡️ ${character.baseAtk}</div>
    <div class="stat-pill">🛡️ ${character.baseShield}</div>
    <div class="stat-pill">🧠 ${character.sanity}</div>
  `;
}

export function renderTraitList(traits: string[]): string {
  return `
    <ul class="trait-list">
      ${traits.map((trait) => `<li>${trait}</li>`).join("")}
    </ul>
  `;
}

export function renderSelectedMark(isSelected: boolean): string {
  if (!isSelected) {
    return "";
  }

  return `<span class="status-pill status-pill--selected" aria-label="Selected">✓</span>`;
}

export function renderConnectionDescription(description: string[]): string {
  if (!description.length) {
    return "";
  }

  return `
    <div class="description-lines">
      ${description.map((line) => `<p class="shop-row__description">${line}</p>`).join("")}
    </div>
  `;
}

export function renderCardDetails(card: Card): string {
  const lines: string[] = [];

  if (card.energyCost !== 0) {
    lines.push(`<li><strong>⚡ </strong> ${card.energyCost}</li>`);
  }

  if (card.atkIncrement !== 0) {
    lines.push(`<li><strong>🗡️ +</strong> ${card.atkIncrement}</li>`);
  }

  if (card.atkMult !== 1) {
    lines.push(`<li><strong>🗡️ x</strong> ${card.atkMult}</li>`);
  }

  if (card.hpIncrement !== 0) {
    lines.push(`<li><strong>❤️ +</strong> ${card.hpIncrement}</li>`);
  }

  if (card.shieldIncrement !== 0) {
    lines.push(`<li><strong>🛡️ +</strong> ${card.shieldIncrement}</li>`);
  }

  if (card.shieldMult !== 1) {
    lines.push(`<li><strong>🛡️ x</strong> ${card.shieldMult}</li>`);
  }

  if (card.sanityIncrement !== 0) {
    lines.push(`<li><strong>🧠 +</strong> ${card.sanityIncrement}</li>`);
  }

  return `
    <ul class="deck-card__stats">
      ${lines.join("")}
    </ul>
  `;
}

export function renderExtraEffects(card: Card): string {
  if (!card.extraEffects.length) {
    return "";
  }

  return `
    <div class="deck-card__effects">
      <p class="deck-card__label">Effects</p>
      <ul class="trait-list">
        ${card.extraEffects.map((effect) => `<li>${effect}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderCardArticle(
  card: Card,
  controls: string,
  imageAltSuffix: string,
): string {
  const controlsMarkup = controls.trim()
    ? `
      <div class="deck-card__controls">
        ${controls}
      </div>
    `
    : "";

  return `
    <article class="deck-card">
      <div class="deck-card__media">
        <img class="deck-card__image" src="${card.image}" alt="${card.name} ${imageAltSuffix}" />
        <span class="status-pill deck-card__type-badge deck-card__type-badge--${card.type.toLowerCase()}">${card.type}</span>
      </div>
      <div class="deck-card__body">
        <div class="deck-card__header">
          <strong class="deck-card__name rarity rarity--${card.rarity}">${card.name}</strong>
          ${controlsMarkup}
        </div>
        ${renderCardDetails(card)}
        ${renderExtraEffects(card)}
      </div>
    </article>
  `;
}

function renderItemArticle(
  item: Item,
  controls: string,
  imageAltSuffix: string,
): string {
  const controlsMarkup = controls.trim()
    ? `
      <div class="deck-card__controls">
        ${controls}
      </div>
    `
    : "";

  return `
    <article class="deck-card item-card">
      <div class="deck-card__media">
        <img class="deck-card__image item-card__image" src="${item.image}" alt="${item.name} ${imageAltSuffix}" />
      </div>
      <div class="deck-card__body">
        <div class="deck-card__header">
          <strong class="deck-card__name">${item.name}</strong>
          ${controlsMarkup}
        </div>
        <div class="description-lines">
          <p class="shop-row__description">${item.description}</p>
        </div>
      </div>
    </article>
  `;
}

function renderEmptyDeckPanel(title: string, subtitle: string, message: string): string {
  return `
    <section class="deck-panel-wrap">
      <div class="deck-panel">
        <div class="deck-panel__header">
          <div>
            <p class="eyebrow">${title}</p>
            <h2>${subtitle}</h2>
            <p class="muted">${message}</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDeckSection(
  title: string,
  subtitle: string,
  cardsMarkup: string,
  tagMarkup = "",
  actionsMarkup = "",
): string {
  return `
    <section class="deck-panel__section">
      <div class="deck-panel__header">
        <div>
          <p class="eyebrow">${title}</p>
          <h2>${subtitle}</h2>
          ${tagMarkup}
        </div>
        ${actionsMarkup}
      </div>
      <div class="deck-grid">
        ${cardsMarkup}
      </div>
    </section>
  `;
}

function renderDeckPanel(state: AppState): string {
  if (!state.isDeckOpen) {
    return "";
  }

  const availableCardRemovals = state.run?.cardRemovals ?? 0;
  const bufferSection = state.buffer.length
    ? renderDeckSection(
        "Buffer",
        `${state.buffer.length} Pending Cards`,
        state.buffer
          .map((card, index) =>
            renderCardArticle(
              card,
              `
                <div class="deck-card__control-stack">
                  <button
                    class="deck-card__add"
                    type="button"
                    data-action="add-buffer-card"
                    data-buffer-index="${index}"
                    aria-label="Add ${card.name} to Deck"
                  >
                    +
                  </button>
                  <button
                    class="deck-card__reroll hold-button"
                    type="button"
                    data-action="reroll-buffer-card"
                    data-buffer-index="${index}"
                    aria-label="Reroll ${card.name}"
                    ${state.run && state.run.sanity >= state.run.bufferRerollCost ? "" : "disabled"}
                  >
                    <img class="deck-card__reroll-icon" src="/img/misc/reroll.svg" alt="" aria-hidden="true" />
                  </button>
                </div>
              `,
              "buffer card art",
            ),
          )
          .join(""),
        `
        <p class="muted">All cards in the Buffer are lost upon leaving the Shop</p>
        `,
        `
          <div class="deck-panel__meta">Reroll: 🧠 ${state.run?.bufferRerollCost ?? 0}</div>
        `,
      )
    : "";
  const deckSection = renderDeckSection(
    "My Deck",
    `${state.deck.length} Permanent Cards`,
    state.deck
      .map(
        (card, index) =>
          renderCardArticle(
            card,
            availableCardRemovals > 0
              ? `
                <button
                  class="deck-card__delete hold-button"
                  type="button"
                  data-action="remove-card"
                  data-deck-index="${index}"
                  aria-label="Remove ${card.name}"
                >
                  🗑️
                </button>
              `
              : "",
            "card art",
          ),
      )
      .join(""),
    `<p class="muted">Available card removals: ${availableCardRemovals}</p>`,
    "",
  );

  return `
    <section class="deck-panel-wrap">
      <div class="deck-panel">
        ${bufferSection}
        ${deckSection}
      </div>
    </section>
  `;
}

function renderNetworkPanel(state: AppState): string {
  if (!state.isNetworkOpen || !state.data) {
    return "";
  }

  const connections = state.connectedConnectionIds.map((connectionId) =>
    state.data!.connections.find(({ id }) => id === connectionId),
  );

  return `
    <section class="deck-panel-wrap">
      <div class="deck-panel">
        <div class="deck-panel__header">
          <div>
            <p class="eyebrow">My Network</p>
            <h2>${state.connectedConnectionIds.length} Connections</h2>
          </div>
        </div>
        <div class="network-grid">
          ${connections
            .filter((connection): connection is Connection => Boolean(connection))
            .map(
              (connection) => `
                <article class="network-card">
                  <img class="network-card__image" src="${connection.image}" alt="${connection.name}" />
                  <div class="network-card__body">
                    <strong class="rarity rarity--${connection.rarity}">${connection.name}</strong>
                    <p class="muted">${connection.tagline}</p>
                    ${renderConnectionDescription(connection.description)}
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderDiscardPilePanel(state: AppState): string {
  if (!state.isDiscardPileOpen) {
    return "";
  }

  const discardPile = state.currentInterview?.discardPile ?? [];
  const discardPullsLeft = state.currentInterview?.discardPullsLeft ?? 0;
  const hasDiscardPulls = (state.run?.discardPullsPerInterview ?? 0) > 0;
  const canRetrieveFromDiscard =
    state.screen === "interview" &&
    Boolean(state.currentInterview) &&
    discardPullsLeft > 0 &&
    !state.isTurnResolving &&
    !state.currentInterview?.isInterviewerDefeated &&
    !state.currentInterview?.isPlayerRejected &&
    !state.currentInterview?.victoryResult &&
    !state.currentInterview?.rejectionLetter;

  if (!discardPile.length) {
    return renderEmptyDeckPanel("Discard Pile", "0 Cards", "No cards have been discarded");
  }

  let retrievalMeta = "";

  if (hasDiscardPulls) {
    retrievalMeta = `<p class="muted">Available retrieves: ${discardPullsLeft}</p>`;
  }

  return `
    <section class="deck-panel-wrap">
      <div class="deck-panel">
        <div class="deck-panel__header">
          <div>
            <p class="eyebrow">Discard Pile</p>
            <h2>${discardPile.length} Cards</h2>
            ${retrievalMeta}
          </div>
        </div>
        <div class="deck-grid">
          ${discardPile
            .map((card, index) => {
              let controls = "";

              if (discardPullsLeft > 0) {
                let disabledAttribute = "disabled";

                if (canRetrieveFromDiscard) {
                  disabledAttribute = "";
                }

                controls = `
                  <button
                    class="deck-card__add hold-button"
                    type="button"
                    data-action="retrieve-discard-card"
                    data-discard-index="${index}"
                    aria-label="Retrieve ${card.name} from Discard Pile"
                    ${disabledAttribute}
                  >
                    +
                  </button>
                `;
              }

              return renderCardArticle(card, controls, "discarded card art");
            })
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderItemsPanel(state: AppState): string {
  if (!state.isItemsOpen) {
    return "";
  }

  const itemCapacity = state.run?.itemCapacity ?? 0;
  const canUseItems =
    state.screen === "interview" &&
    state.currentInterview !== null &&
    !state.isTurnResolving &&
    !state.currentInterview.isInterviewerDefeated &&
    !state.currentInterview.isPlayerRejected &&
    !state.currentInterview.victoryResult &&
    !state.currentInterview.rejectionLetter;

  if (!state.items.length) {
    return renderEmptyDeckPanel("Items", `0 / ${itemCapacity} Held`, "No consumables in your inventory");
  }

  return `
    <section class="deck-panel-wrap">
      <div class="deck-panel">
        <div class="deck-panel__header">
          <div>
            <p class="eyebrow">Items</p>
            <h2>${state.items.length} / ${itemCapacity} Held</h2>
            <p class="muted">Consumables can only be used during interviews</p>
          </div>
        </div>
        <div class="deck-grid">
          ${state.items
            .map((item, index) =>
              renderItemArticle(
                item,
                state.screen === "shop"
                  ? `
                    <button
                      class="deck-card__delete hold-button"
                      type="button"
                      data-action="remove-item"
                      data-item-index="${index}"
                      aria-label="Discard ${item.name}"
                    >
                      🗑️
                    </button>
                  `
                  : state.screen === "interview"
                    ? `
                      <button
                        class="deck-card__use"
                        type="button"
                        data-action="use-item"
                        data-item-index="${index}"
                        aria-label="Use ${item.name}"
                        ${canUseItems ? "" : "disabled"}
                      >
                        Use
                      </button>
                    `
                    : "",
                "item art",
              ),
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderInterviewShieldOverlay(state: AppState): string {
  if (state.screen !== "interview" || !state.currentInterview) {
    return "";
  }

  const shouldShowPrediction =
    !state.currentInterview.isInterviewerDefeated &&
    !state.currentInterview.isPlayerRejected &&
    !state.currentInterview.victoryResult &&
    !state.currentInterview.rejectionLetter;
  const predictedDamage = shouldShowPrediction ? predictPlayerDamage(state) : null;

  return `
    <button
      class="interview-shield-overlay${state.isShieldCounterDimmed ? " interview-shield-overlay--dimmed" : ""}"
      type="button"
      data-action="toggle-shield-counter"
      aria-label="Toggle shield counter transparency"
    >
      <span class="interview-shield-overlay__row">
        <span class="interview-shield-overlay__value">🗡️ ${formatCombatValue(state.currentInterview.currentAtk)}</span>
      </span>
      ${
        predictedDamage === null
          ? ""
          : `
            <span class="interview-shield-overlay__row">
              <span class="interview-shield-overlay__prediction">⚔️ ${formatCombatValue(predictedDamage)}</span>
            </span>
          `
      }
      <span class="interview-shield-overlay__row">
        <span class="interview-shield-overlay__value">🛡️ ${formatCombatValue(state.currentInterview.currentShield)}</span>
        <span class="interview-shield-overlay__timer">Reset in ${state.currentInterview.turnsUntilShieldReset}</span>
      </span>
    </button>
  `;
}

function renderSanityOverlay(state: AppState): string {
  if (!state.run || state.screen !== "shop") {
    return "";
  }

  return `
    <button
      class="run-sanity-overlay${state.isSanityCounterDimmed ? " run-sanity-overlay--dimmed" : ""}"
      type="button"
      data-action="toggle-sanity-counter"
      aria-label="Toggle sanity counter transparency"
    >
      <span class="run-sanity-overlay__value">🧠 ${state.run.sanity}</span>
    </button>
  `;
}

export function renderShell(state: AppState, content: string): string {
  const showRunNav = state.screen !== "offer";
  const overlayClassName = [
    "run-overlays",
    state.screen === "shop" ? "run-overlays--shop" : "",
    state.screen === "interview" ? "run-overlays--interview" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="shell">
      <header class="topbar">
        <div class="topbar__inner">
          <div class="brand">
            <div class="brand__mark">LO</div>
            <div class="brand__search">Search</div>
            <button
              class="brand__sound-toggle nav-chip nav-chip--button"
              type="button"
              data-action="toggle-music-muted"
              aria-label="${state.isMusicMuted ? "Unmute music" : "Mute music"}"
            >
              ${state.isMusicMuted ? "🔇" : "🔊"}
            </button>
          </div>
          ${
            showRunNav
              ? `
                <nav class="topbar__nav" aria-label="Placeholder">
                  <button class="nav-chip nav-chip--button${state.isDeckOpen ? " nav-chip--active" : ""}${state.buffer.length > 0 ? " nav-chip--attention" : ""}" type="button" data-action="toggle-deck">My Deck</button>
                  <button class="nav-chip nav-chip--button${state.isNetworkOpen ? " nav-chip--active" : ""}" type="button" data-action="toggle-network">My Network</button>
                  <button class="nav-chip nav-chip--button${state.isDiscardPileOpen ? " nav-chip--active" : ""}" type="button" data-action="toggle-discard-pile">Discard Pile</button>
                  <button class="nav-chip nav-chip--button${state.isItemsOpen ? " nav-chip--active" : ""}" type="button" data-action="toggle-items">Items</button>
                </nav>
              `
              : `<div class="topbar__nav" aria-hidden="true"></div>`
          }
        </div>
      </header>
      ${showRunNav ? renderDeckPanel(state) : ""}
      ${showRunNav ? renderNetworkPanel(state) : ""}
      ${showRunNav ? renderDiscardPilePanel(state) : ""}
      ${showRunNav ? renderItemsPanel(state) : ""}
      ${content}
      <div class="${overlayClassName}">
        ${renderSanityOverlay(state)}
        ${renderInterviewShieldOverlay(state)}
      </div>
    </div>
  `;
}
