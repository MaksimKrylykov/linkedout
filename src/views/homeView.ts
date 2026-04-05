import type { AppState } from "../types.js";

export function renderHomeView(_state: AppState): string {
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
      </section>
    </main>
  `;
}
