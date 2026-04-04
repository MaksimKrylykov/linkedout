import { renderCharacterStats } from "../ui/markup.js";
import type { AppState } from "../types.js";

export function renderHomeView(state: AppState): string {
  if (!state.data) {
    throw new Error("Cannot render home view without game data.");
  }

  const { characters, difficulties } = state.data;

  return `
    <main class="layout layout--home">
      <aside class="rail rail--profile">
        <section class="card identity-card">
          <div class="identity-card__cover"></div>
          <div class="identity-card__coin">LO</div>
          <div class="identity-card__body">
            <p class="eyebrow">Placeholder</p>
            <h2>LinkedOut</h2>
            <p class="muted">Placeholder Placeholder</p>
          </div>
        </section>
      </aside>

      <section class="feed">
        <section class="card hero-card">
          <p class="eyebrow">Placeholder</p>
          <h1>Placeholder Placeholder Placeholder</h1>
          <p class="hero-card__body">Placeholder placeholder placeholder placeholder placeholder.</p>
          <div class="hero-card__actions">
            <button class="cta-button" type="button" data-action="new-run">New Run</button>
          </div>
        </section>

        <section class="card teaser-card">
          <div class="teaser-card__header">
            <div>
              <p class="eyebrow">Placeholder</p>
              <h3>Placeholder</h3>
            </div>
          </div>
          <div class="teaser-grid">
            ${characters
              .map(
                (character) => `
                  <article class="teaser-grid__item">
                    <img src="${character.image}" alt="${character.name}" />
                    <div>
                      <strong>${character.name}</strong>
                      <div class="inline-stats">${renderCharacterStats(character)}</div>
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>
      </section>
    </main>
  `;
}
