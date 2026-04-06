import { buildRun, getCharacter, getDifficulty, requireSelection } from "../state/appState.js";
import { renderCharacterStats, renderSelectedMark, renderTraitList } from "../ui/markup.js";
import type { AppState } from "../types.js";

export function renderSetupView(state: AppState): string {
  if (!state.data) {
    throw new Error("Cannot render setup view without game data.");
  }

  const { characterId, difficultyId } = requireSelection(state);
  const selectedCharacter = getCharacter(state.data, characterId);
  const selectedDifficulty = getDifficulty(state.data, difficultyId);
  const run = state.run ?? buildRun(state.data, characterId, difficultyId);

  return `
    <main class="layout layout--setup">
      <aside class="rail rail--profile">
        <section class="card summary-card">
          <div class="summary-card__header">
            <p class="eyebrow">Run Info</p>
          </div>
          <div class="summary-card__identity">
            <img src="${selectedCharacter.image}" alt="${selectedCharacter.name}" />
            <div>
              <h2>${selectedCharacter.name}</h2>
              <p class="muted">${selectedCharacter.tagline}</p>
            </div>
          </div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span>❤️ HP</span>
              <strong>${run.hp} / ${run.maxHP}</strong>
            </div>
            <div class="summary-stat">
              <span>⚡ Energy</span>
              <strong>${run.energy} / ${run.maxEnergy}</strong>
            </div>
            <div class="summary-stat">
              <span>🗡️ Atk</span>
              <strong>${run.baseAtk}</strong>
            </div>
            <div class="summary-stat">
              <span>🛡️ Shield</span>
              <strong>${run.baseShield}</strong>
            </div>
            <div class="summary-stat">
              <span>🧠 Sanity</span>
              <strong>${run.sanity}</strong>
            </div>
            <div class="summary-stat">
              <span>Difficulty</span>
              <strong>${selectedDifficulty.name}</strong>
            </div>
            <div class="summary-stat">
              <span>Rounds Passed</span>
              <strong>${run.roundsPassed}</strong>
            </div>
          </div>
        </section>
      </aside>

      <section class="feed">
        <section class="card hero-card hero-card--setup">
          <p class="eyebrow">Title card</p>
          <h1>Don't get rejected.</h1>
          <p class="hero-card__body"></p>
          <div class="hero-card__actions">
            <button class="cta-button cta-button--secondary" type="button" data-action="new-run">New Run</button>
            <button class="cta-button" type="button" data-action="begin-run">BEGIN!</button>
          </div>
        </section>

        <section class="card selection-card">
          <div class="selection-card__header">
            <div>
              <p class="eyebrow">Interviewee</p>
              <h3>Character Select</h3>
            </div>
          </div>
          <div class="selection-grid">
            ${state.data.characters
              .map((character) => {
                const isSelected = character.id === characterId;

                return `
                  <button
                    class="option-card${isSelected ? " option-card--selected" : ""}"
                    type="button"
                    data-character="${character.id}"
                    aria-pressed="${isSelected}"
                  >
                    <img class="option-card__image" src="${character.image}" alt="${character.name}" />
                    <div class="option-card__body">
                      <div class="option-card__head">
                        <strong>${character.name}</strong>
                        ${renderSelectedMark(isSelected)}
                      </div>
                      <p class="muted">${character.tagline}</p>
                      <div class="inline-stats">${renderCharacterStats(character)}</div>
                      ${renderTraitList(character.traits)}
                    </div>
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>

        <section class="card selection-card">
          <div class="selection-card__header">
            <div>
              <p class="eyebrow">Difficulty</p>
              <h3>Choose Difficulty</h3>
            </div>
          </div>
          <div class="difficulty-grid">
            ${state.data.difficulties
              .map((difficulty) => {
                const isSelected = difficulty.id === difficultyId;

                return `
                  <button
                    class="difficulty-card${isSelected ? " difficulty-card--selected" : ""}"
                    type="button"
                    data-difficulty="${difficulty.id}"
                    aria-pressed="${isSelected}"
                  >
                    <div class="difficulty-card__head">
                      <strong>${difficulty.name}</strong>
                      ${renderSelectedMark(isSelected)}
                    </div>
                    ${renderTraitList(difficulty.traits)}
                  </button>
                `;
              })
              .join("")}
          </div>
        </section>
      </section>
    </main>
  `;
}
