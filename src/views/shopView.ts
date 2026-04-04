import {
  canStartInterview,
  getCharacter,
  getBrainCapacityUpgradeCost,
  getBoosterPackCost,
  getConnectionCost,
  getDifficulty,
  getEligibleSuggestionCount,
  getSuggestionCount,
  isBrainCapacityFull,
  isBoosterPackLocked,
  requireSelection,
} from "../state/appState.js";
import { renderConnectionDescription } from "../ui/markup.js";
import type { AppState, BoosterPack, LinkedOutTier, Run } from "../types.js";

function renderTouchingGrassUpgradeRow(
  label: string,
  purchases: number,
  stat: "hp" | "energy" | "atk",
  canAfford: boolean,
): string {
  const isMaxed = purchases >= 5;

  return `
    <div class="touching-grass__row">
      <div class="touching-grass__copy">
        <strong>${label}</strong>
      </div>
      <div class="touching-grass__actions">
        <span class="touching-grass__progress">${purchases} / 5</span>
        <button
          class="leekcode-capacity__slot leekcode-capacity__slot--upgrade touching-grass__button touching-grass__button--upgrade"
          type="button"
          data-action="touching-grass-upgrade"
          data-upgrade="${stat}"
          ${!isMaxed && canAfford ? "" : "disabled"}
          aria-label="Upgrade ${label} for 50 sanity"
        >
          <span class="leekcode-capacity__upgrade-plus" aria-hidden="true">+</span>
        </button>
        <span class="touching-grass__price">🧠 50</span>
      </div>
    </div>
  `;
}

function renderTouchingGrassCard(run: Run): string {
  const canAfford = run.sanity >= 50;

  return `
    <section class="card side-card touching-grass-card">
      <div class="summary-card__header">
        <div>
          <p class="eyebrow">Touching Grass</p>
          <p class="muted">Invest in your fundamentals</p>
        </div>
      </div>
      <div class="touching-grass">
        ${renderTouchingGrassUpgradeRow("Max ❤️ +10", run.hpUpgradesPurchased, "hp", canAfford)}
        ${renderTouchingGrassUpgradeRow("Max ⚡️ +1", run.energyUpgradesPurchased, "energy", canAfford)}
        ${renderTouchingGrassUpgradeRow("Base 🗡️ +2", run.atkUpgradesPurchased, "atk", canAfford)}
      </div>
    </section>
  `;
}

function renderShopRows(state: AppState, run: Run): string {
  if (!state.shopSuggestions.length) {
    return "";
  }

  return state.shopSuggestions
    .map(
      (connection) => {
        const isConnected = state.connectedConnectionIds.includes(connection.id);
        const connectionCost = getConnectionCost(run, connection);
        const hasEnoughSanity = run.sanity >= connectionCost;

        return `
        <article class="shop-row">
          <div class="shop-row__identity">
            <img class="shop-row__avatar" src="${connection.image}" alt="${connection.name}" />
            <div class="shop-row__copy">
              <strong class="rarity rarity--${connection.rarity}">${connection.name}</strong>
              <p class="muted">${connection.tagline}</p>
              ${renderConnectionDescription(connection.description)}
            </div>
          </div>
          <div class="shop-row__actions">
            ${
              isConnected
                ? `
                  <button class="connect-button connect-button--message" type="button">
                    <span>✉️ Message</span>
                  </button>
                `
                : `
                  <button
                    class="connect-button"
                    type="button"
                    data-action="connect"
                    data-connection="${connection.id}"
                    ${hasEnoughSanity ? "" : "disabled"}
                  >
                    <span class="connect-button__icon" aria-hidden="true">+</span>
                    <span>Connect</span>
                  </button>
                `
            }
            <span class="shop-row__price">🧠 ${connectionCost}</span>
          </div>
        </article>
      `;
      },
    )
    .join("");
}

function renderTierBadge(tier: LinkedOutTier): string {
  if (tier === "premium") {
    return `<span class="membership-badge membership-badge--premium" aria-label="LinkedOut Premium">LO</span>`;
  }

  if (tier === "platinum") {
    return `<span class="membership-badge membership-badge--platinum" aria-label="LinkedOut Platinum">LO</span>`;
  }

  return "";
}

function renderLeekCodeAvatarBadge(hasLeekCodePremium: boolean): string {
  if (!hasLeekCodePremium) {
    return "";
  }

  return `
    <span class="leetcode-badge" aria-label="LeekCode Premium">
      <span class="leetcode-badge__star" aria-hidden="true">★</span>
    </span>
  `;
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

function renderPromoAside(state: AppState, playerName: string): string {
  if (!state.run || !state.data) {
    return "";
  }

  const playerFirstName = firstName(playerName);

  const firstConnectionId = state.connectedConnectionIds[0];
  const firstConnection = firstConnectionId
    ? state.data.connections.find(({ id }) => id === firstConnectionId)
    : undefined;
  const premiumSubtitle = firstConnection
    ? `${firstConnection.name} and millions of other members use Premium`
    : "Millions of members use Premium.";

  const promoCard =
    state.run.linkedOutTier === "none"
      ? `
        <section class="card side-card subscription-card">
          <p class="eyebrow">LinkedOut Premium</p>
          <h3>${playerFirstName}, job search smarter</h3>
          <p class="muted">${premiumSubtitle}</p>
          <div class="description-lines">
            <p class="shop-row__description">See jobs where you’d be a top applicant</p>
            <p class="shop-row__description">Directly message recruiters with OutMail</p>
            <p class="shop-row__description">Get cover letter and resume tips</p>
            <p class="shop-row__description">Join live talks with career experts</p>
            <p class="shop-row__description">Get more connection suggestions</p>
          </div>
          <div class="subscription-card__actions">
            <button
              class="cta-button"
              type="button"
              data-action="buy-premium"
              ${state.run.sanity >= 300 ? "" : "disabled"}
            >
              Subscribe
            </button>
            <div class="hero-card__meta">🧠 300</div>
          </div>
        </section>
      `
      : state.run.linkedOutTier === "premium"
        ? `
          <section class="card side-card subscription-card subscription-card--platinum">
            <p class="eyebrow">LinkedOut Platinum</p>
            <h3>${playerFirstName}, go beyond Premium</h3>
            <p class="muted">Tens of thousands of members use Platinum</p>
            <div class="description-lines">
              <p class="shop-row__description">Receive AI-generated compliments on your personal brand</p>
              <p class="shop-row__description">Access exclusive articles about the future of networking</p>
              <p class="shop-row__description">Get offer-defining connections</p>
              <p class="shop-row__description">Get even more connection suggestions</p>
            </div>
            <div class="subscription-card__actions">
              <button
                class="cta-button"
                type="button"
                data-action="buy-platinum"
                ${state.run.sanity >= 700 ? "" : "disabled"}
              >
                Subscribe
              </button>
              <div class="hero-card__meta">🧠 700</div>
            </div>
          </section>
        `
        : `
          <section class="card side-card subscription-card subscription-card--thankyou">
            <p class="eyebrow">LinkedOut Platinum</p>
            <h3>Thank you for subscribing</h3>
            <p class="muted">Your account is fully upgraded</p>
          </section>
        `;

  return `
    <aside class="rail rail--news">
      ${promoCard}
      <section class="card side-card next-interview-card">
        <p class="eyebrow">Interview Arena</p>
        <h3>Next Interview</h3>
        <p class="muted">Step into the next hiring round</p>
        <div class="subscription-card__actions">
          <button
            class="cta-button cta-button--secondary"
            type="button"
            data-action="next-interview"
            ${canStartInterview(state) ? "" : "disabled"}
          >
            Proceed
          </button>
        </div>
      </section>
    </aside>
  `;
}

function renderBoosterCount(label: string, rarity: "common" | "rare" | "epic" | "legendary", count: number): string {
  if (count === 0) {
    return "";
  }

  return `<span class="leekcode-pack__count rarity rarity--${rarity}">${count} ${label} ${
    count === 1 ? "card" : "cards"
  }</span>`;
}

function renderBoosterPack(boosterPack: BoosterPack, run: Run): string {
  const boosterPackCost = getBoosterPackCost(run, boosterPack);
  const isLocked = isBoosterPackLocked(run, boosterPack);
  const isCapacityFull = isBrainCapacityFull(run);
  const canBuy = !isLocked && !isCapacityFull && run.sanity >= boosterPackCost;

  return `
    <article class="leekcode-pack${isLocked ? " leekcode-pack--locked" : ""}">
      <div class="leekcode-pack__copy">
        <div class="leekcode-pack__head">
          <p class="eyebrow">Featured Pack</p>
          <span class="status-pill deck-card__type-badge--${boosterPack.type.toLowerCase()}">${boosterPack.type}</span>
        </div>
        <h3>${boosterPack.name}</h3>
        <div class="leekcode-pack__counts">
          ${renderBoosterCount("Common", "common", boosterPack.common)}
          ${renderBoosterCount("Rare", "rare", boosterPack.rare)}
          ${renderBoosterCount("Epic", "epic", boosterPack.epic)}
          ${renderBoosterCount("Legendary", "legendary", boosterPack.legendary)}
        </div>
      </div>
      <div class="leekcode-pack__actions">
        <button
          class="cta-button leekcode-pack__button"
          type="button"
          data-action="buy-booster-pack"
          data-booster-pack="${boosterPack.id}"
          ${canBuy ? "" : "disabled"}
        >
          ${isLocked ? "Locked" : isCapacityFull ? "Full" : "Grind"}
        </button>
        <span class="leekcode-pack__price">🧠 ${boosterPackCost}</span>
      </div>
    </article>
  `;
}

function renderBrainCapacity(run: Run, variant: "hero" | "body" = "body"): string {
  const upgradeCost = getBrainCapacityUpgradeCost(run);
  const canBuyUpgrade = upgradeCost !== null && run.sanity >= upgradeCost;

  return `
    <section class="leekcode-capacity${variant === "hero" ? " leekcode-capacity--hero" : ""}">
      <div class="leekcode-capacity__header">
        <div>
          <p class="eyebrow">Brain Capacity</p>
          ${
            upgradeCost === null
              ? ""
              : `<p class="leekcode-capacity__upgrade-note">Upgrade for 🧠 ${upgradeCost}</p>`
          }
        </div>
        <span class="muted">${run.usedBrainCapacity} / ${run.brainCapacity}</span>
      </div>
      <div class="leekcode-capacity__slots" aria-label="Brain Capacity">
        ${Array.from({ length: Math.max(0, run.brainCapacity) }, (_, index) => {
          const isUsed = index < run.usedBrainCapacity;

          return `
            <span class="leekcode-capacity__slot${isUsed ? " leekcode-capacity__slot--used" : ""}" aria-hidden="true">
              ${isUsed ? "✕" : ""}
            </span>
          `;
        }).join("")}
        ${
          upgradeCost === null
            ? ""
            : `
              <button
                class="leekcode-capacity__slot leekcode-capacity__slot--upgrade"
                type="button"
                data-action="buy-brain-capacity"
                ${canBuyUpgrade ? "" : "disabled"}
                aria-label="Buy 1 brain capacity for ${upgradeCost} sanity"
              >
                <span class="leekcode-capacity__upgrade-plus" aria-hidden="true">+</span>
              </button>
            `
        }
      </div>
    </section>
  `;
}

function renderLeekCodePremium(run: Run): string {
  if (run.hasLeekCodePremium) {
    return `
      <section class="leekcode-premium">
        <div>
          <p class="eyebrow">LeekCode Premium</p>
          <h3>All premium packs are unlocked</h3>
        </div>
      </section>
    `;
  }

  const canBuyPremium = run.sanity >= 500;

  return `
    <section class="leekcode-premium">
      <div>
        <p class="eyebrow">LeekCode Premium</p>
        <h3>Unlock every pack</h3>
        <p class="muted">Premium subscription unlocks all packs with epic and legendary cards</p>
      </div>
      <div class="leekcode-premium__actions">
        <button
          class="cta-button leekcode-pack__button"
          type="button"
          data-action="buy-leekcode-premium"
          ${canBuyPremium ? "" : "disabled"}
        >
          Subscribe
        </button>
        <span class="leekcode-pack__price">🧠 500</span>
      </div>
    </section>
  `;
}

function renderLeekCodeSection(state: AppState, run: Run): string {
  if (!state.data?.boosterPacks.length) {
    return "";
  }

  return `
    <section class="card leekcode-card">
        <div class="leekcode-card__hero">
        <div class="leekcode-card__hero-copy">
          <p class="leekcode-card__welcome">Welcome to LeekCode Explore</p>
          <h2>Featured</h2>
        </div>
        <div class="leekcode-card__hero-art">
          ${renderBrainCapacity(run, "hero")}
        </div>
      </div>
      <div class="leekcode-card__body">
        <div class="leekcode-pack-list">
          ${state.data.boosterPacks.map((boosterPack) => renderBoosterPack(boosterPack, run)).join("")}
        </div>
        ${renderLeekCodePremium(run)}
      </div>
    </section>
  `;
}

export function renderShopView(state: AppState): string {
  if (!state.data || !state.run) {
    throw new Error("Cannot render shop view without loaded data and an active run.");
  }

  const { characterId, difficultyId } = requireSelection(state);
  const selectedCharacter = getCharacter(state.data, characterId);
  const selectedDifficulty = getDifficulty(state.data, difficultyId);
  const eligibleSuggestionCount = getEligibleSuggestionCount(
    state.data,
    state.connectedConnectionIds,
    state.retiredConnectionIds,
    state.run,
  );
  const canRefresh = state.run.sanity >= state.run.refreshCost && eligibleSuggestionCount > 0;
  const suggestionCap = getSuggestionCount(state.run);

  return `
    <main class="layout layout--setup">
      <aside class="rail rail--profile">
        <section class="card summary-card">
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
        ${renderTouchingGrassCard(state.run)}
      </aside>

      <section class="feed">
        <section class="card hero-card hero-card--setup">
          <p class="eyebrow">Shop</p>
          <h1>Grow Your Network!</h1>
          <div class="hero-card__actions">
            <button
              class="cta-button cta-button--secondary"
              type="button"
              data-action="refresh-shop"
              ${canRefresh ? "" : "disabled"}
            >
              Refresh
            </button>
            <div class="hero-card__meta">🧠 ${state.run.refreshCost}</div>
          </div>
        </section>

        <section class="card selection-card">
          <div class="selection-card__header">
            <div>
              <p class="eyebrow">Suggestions</p>
              <h3>People You May Know</h3>
            </div>
          </div>
          <div class="shop-list">
            ${renderShopRows(state, state.run)}
          </div>
        </section>
      </section>

      ${renderPromoAside(state, selectedCharacter.name)}
      ${renderLeekCodeSection(state, state.run)}
    </main>
  `;
}
