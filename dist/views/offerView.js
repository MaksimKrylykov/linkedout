import { getCharacter, getDifficulty, getInterviewer, requireSelection } from "../state/appState.js";
import { renderCardDetails, renderExtraEffects } from "../ui/markup.js";
function formatSalary(amount) {
    return `$${amount.toLocaleString("en-US")}`;
}
function getOfferSalary(difficultyId) {
    if (difficultyId === "impossible") {
        return 950000;
    }
    if (difficultyId === "extreme") {
        return 450000;
    }
    if (difficultyId === "tough") {
        return 260000;
    }
    return 175000;
}
function buildOfferLetter(characterName, difficultyName, salary) {
    return [
        `Dear ${characterName},`,
        "We are pleased to extend to you an offer for the position of Software Engineer at our New York office. Throughout the process, you demonstrated the combination of technical sharpness, composure under pressure, and practical judgment that we value in engineers building systems where latency, reliability, and correctness all matter at once.",
        "This role will place you close to fast-moving production infrastructure and performance-critical engineering work. You will be expected to learn quickly, execute carefully, and collaborate with people who care deeply about detail, ownership, and iteration speed. We believe you can thrive in that environment.",
        `Your starting base salary will be ${formatSalary(salary)} per year. This offer reflects the level at which we believe you can contribute from day one, as well as the competitive demands of hiring strong engineers into a high-performance environment.`,
        "We hope you will accept and join us in New York. Until then, please enjoy the rare sensation of being wanted by the market.",
    ];
}
function renderOfferDeckCard(card) {
    return `
    <article class="deck-card offer-deck-card">
      <div class="deck-card__media">
        <img class="deck-card__image" src="${card.image}" alt="${card.name} card art" />
        <span class="status-pill deck-card__type-badge deck-card__type-badge--${card.type.toLowerCase()}">${card.type}</span>
      </div>
      <div class="deck-card__body">
        <div class="deck-card__header">
          <strong class="deck-card__name rarity rarity--${card.rarity}">${card.name}</strong>
        </div>
        ${renderCardDetails(card)}
        ${renderExtraEffects(card)}
      </div>
    </article>
  `;
}
function renderConnectionCards(connections, retired = false) {
    if (!connections.length) {
        return `<p class="muted">None</p>`;
    }
    return `
    <div class="network-grid">
      ${connections
        .map((connection) => `
            <article class="network-card${retired ? " network-card--retired" : ""}">
              <img class="network-card__image" src="${connection.image}" alt="${connection.name}" />
              <div class="network-card__body">
                <strong class="${retired ? "" : `rarity rarity--${connection.rarity}`}">${connection.name}</strong>
                <p class="muted">${connection.tagline}</p>
              </div>
            </article>
          `)
        .join("")}
    </div>
  `;
}
function renderInterviewHistory(state, history) {
    if (!state.data || !history.length) {
        return `<p class="muted">No interviews logged</p>`;
    }
    return `
    <div class="offer-results__interview-grid">
      ${history
        .map((entry) => {
        const interviewer = getInterviewer(state.data, entry.interviewer);
        const statusLabel = entry.result === "on-time" ? "On Time" : entry.result === "overtime" ? "Overtime" : "DNF";
        return `
            <article class="offer-results__interview-card">
              <img class="offer-results__interview-image" src="${interviewer.image}" alt="${interviewer.name}" />
              <div class="offer-results__interview-body">
                <strong>${interviewer.name}</strong>
                <p class="muted">Round ${entry.round}</p>
              </div>
              <span class="offer-results__interview-status offer-results__interview-status--${entry.result}">${statusLabel}</span>
            </article>
          `;
    })
        .join("")}
    </div>
  `;
}
export function renderOfferView(state) {
    if (!state.data || !state.run) {
        throw new Error("Cannot render offer view without data and an active run.");
    }
    const { characterId, difficultyId } = requireSelection(state);
    const character = getCharacter(state.data, characterId);
    const difficulty = getDifficulty(state.data, difficultyId);
    const salary = getOfferSalary(state.run.difficulty);
    const offerLetter = buildOfferLetter(character.name, difficulty.name, salary);
    const finalConnections = state.connectedConnectionIds
        .map((connectionId) => state.data.connections.find(({ id }) => id === connectionId))
        .filter((connection) => Boolean(connection));
    const retiredConnections = state.retiredConnectionIds
        .map((connectionId) => state.data.connections.find(({ id }) => id === connectionId))
        .filter((connection) => Boolean(connection));
    const onTimeCount = state.run.interviewHistory.filter((entry) => entry.result === "on-time").length;
    const punctuality = state.run.roundsPassed > 0 ? Math.round((onTimeCount / state.run.roundsPassed) * 100) : 0;
    return `
    <main class="layout layout--offer">
      <section class="feed feed--offer">
        <section class="card offer-card">
          <div class="summary-card__header">
            <div>
              <p class="eyebrow">Offer</p>
              <h2>Application Update</h2>
            </div>
          </div>
          <div class="offer-card__letter">
            ${offerLetter.map((paragraph) => `<p>${paragraph}</p>`).join("")}
          </div>
        </section>

        <section class="card offer-results-card">
          <div class="summary-card__header">
            <div>
              <p class="eyebrow">Run Results</p>
              <h2>Final Snapshot</h2>
            </div>
          </div>
          <div class="summary-stats offer-results-card__stats">
            <div class="summary-stat">
              <span>Difficulty</span>
              <strong>${difficulty.name}</strong>
            </div>
            <div class="summary-stat">
              <span>Rounds Cleared</span>
              <strong>${state.run.roundsPassed}</strong>
            </div>
            <div class="summary-stat">
              <span>Punctuality</span>
              <strong>${punctuality}%</strong>
            </div>
            <div class="summary-stat">
              <span>Final Sanity</span>
              <strong>🧠 ${state.run.sanity}</strong>
            </div>
          </div>

          <section class="offer-results__section">
            <div class="selection-card__header">
              <div>
                <p class="eyebrow">Network</p>
                <h3>Final Connections</h3>
              </div>
            </div>
            ${renderConnectionCards(finalConnections)}
          </section>

          <section class="offer-results__section">
            <div class="selection-card__header">
              <div>
                <h3>Retired Connections</h3>
              </div>
            </div>
            ${renderConnectionCards(retiredConnections, true)}
          </section>

          <section class="offer-results__section">
            <div class="selection-card__header">
              <div>
                <p class="eyebrow">Deck</p>
                <h3>Final Deck</h3>
              </div>
            </div>
            <div class="deck-grid offer-deck-grid">
              ${state.deck.map((card) => renderOfferDeckCard(card)).join("")}
            </div>
          </section>

          <section class="offer-results__section">
            <div class="selection-card__header">
              <div>
                <p class="eyebrow">Interview Log</p>
                <h3>Defeated Interviewers</h3>
              </div>
            </div>
            ${renderInterviewHistory(state, state.run.interviewHistory)}
          </section>
        </section>

        <section class="offer-actions">
          <button class="cta-button cta-button--secondary" type="button" data-action="main-menu">Main Menu</button>
        </section>
      </section>
    </main>
  `;
}
