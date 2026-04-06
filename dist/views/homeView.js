export function renderHomeView(_state) {
    return `
    <main class="layout layout--home">
      <aside class="rail rail--profile">
        <section class="card identity-card">
          <div class="identity-card__cover"></div>
          <div class="identity-card__coin">LO</div>
          <div class="identity-card__body">
            <p class="eyebrow">Welcome to</p>
            <h2>LinkedOut</h2>
          </div>
        </section>
      </aside>

      <section class="feed">
        <section class="card hero-card">
          <p class="eyebrow">Title card</p>
          <h1>Don't get rejected.</h1>
          <p class="hero-card__body"></p>
          <div class="hero-card__actions">
            <button class="cta-button" type="button" data-action="new-run">New Run</button>
          </div>
        </section>
      </section>
    </main>
  `;
}
