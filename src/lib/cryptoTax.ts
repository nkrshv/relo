import { DESTINATIONS } from "./countries";
import { normalizeName } from "./countryFacts";
import {
  CRYPTO_TAX_DATASET_URL,
  CRYPTO_TAX_REGIMES,
  CRYPTO_TAX_UPDATED_AT,
  type CryptoTaxRegime,
} from "./cryptoTax.generated";

const CODE_BY_NAME: Record<string, string> = Object.fromEntries([
  ...Object.values(CRYPTO_TAX_REGIMES).map((regime) => [
    normalizeName(regime.countryName),
    regime.countryCode,
  ]),
  ...DESTINATIONS.map((destination) => [
    normalizeName(destination.name),
    destination.countryCode,
  ]),
]);

export function cryptoTaxForCountry(country: string): CryptoTaxRegime | null {
  const code = CODE_BY_NAME[normalizeName(country)];
  return code ? CRYPTO_TAX_REGIMES[code] ?? null : null;
}

export function formatCryptoRate(rate: number | null): string {
  if (rate === null) return "—";
  const percentage = rate * 100;
  return `${Number.isInteger(percentage) ? percentage : percentage.toFixed(1)}%`;
}

export function capitalGainsLabel(regime: CryptoTaxRegime): string {
  const short = formatCryptoRate(regime.shortTermRate);
  const long = formatCryptoRate(regime.longTermRate);
  if (short === long) return short;
  if (regime.holdingPeriodMonths && regime.longTermRate !== null) {
    return `${short} under ${regime.holdingPeriodMonths}mo · ${long} after`;
  }
  return `${short} short · ${long} long`;
}

export function cryptoStatusLabel(regime: CryptoTaxRegime): string {
  if (regime.legalStatus === "banned") return "Crypto banned";
  if (regime.legalStatus === "restricted") return "Crypto restricted";
  if (regime.shortTermRate === 0 && regime.longTermRate === 0) return "Tax-free gains";
  if (regime.longTermRate === 0) return "Long-term gains tax-free";
  if (regime.cryptoFriendly) return "Crypto-friendly";
  return regime.legalStatus === "legal" ? "Crypto legal" : "Rules unclear";
}

// One-word status straight from the source, for tight spaces (snapshot cell,
// comparison column). Avoids cramming rate breakdowns into a label.
export function cryptoShortStatus(regime: CryptoTaxRegime): string {
  if (regime.legalStatus === "banned") return "Banned";
  if (regime.legalStatus === "restricted") return "Restricted";
  if (regime.legalStatus === "unclear") return "Rules unclear";
  if (regime.cryptoFriendly) return "Crypto-friendly";
  if (regime.taxFreeStatus) return "Tax-free";
  return "Legal";
}

// Capital-gains rates split by holding period, for a two-cell layout.
// `after` is null when there is no distinct long-term rate to show.
export function cryptoGainsBreakdown(regime: CryptoTaxRegime): {
  underLabel: string;
  under: string;
  afterLabel: string | null;
  after: string | null;
} {
  const short = formatCryptoRate(regime.shortTermRate);
  const long = formatCryptoRate(regime.longTermRate);
  const hasSplit =
    regime.holdingPeriodMonths != null &&
    regime.longTermRate !== null &&
    short !== long;
  if (hasSplit) {
    return {
      underLabel: `Gains under ${regime.holdingPeriodMonths}mo`,
      under: short,
      afterLabel: `Gains after ${regime.holdingPeriodMonths}mo`,
      after: long,
    };
  }
  return { underLabel: "Capital gains", under: short, afterLabel: null, after: null };
}

export function cryptoTaxTone(regime: CryptoTaxRegime): string {
  if (regime.legalStatus === "banned" || regime.legalStatus === "restricted") {
    return "text-red-700";
  }
  if (regime.taxFreeStatus || regime.cryptoFriendly) return "text-emerald-700";
  const rate = regime.longTermRate ?? regime.shortTermRate;
  return rate !== null && rate >= 0.3 ? "text-red-700" : "text-amber-700";
}

export function cryptoCompareLabel(regime: CryptoTaxRegime): string {
  const income = [
    regime.stakingRate === null
      ? null
      : `staking ${formatCryptoRate(regime.stakingRate)}`,
    regime.miningRate === null ? null : `mining ${formatCryptoRate(regime.miningRate)}`,
  ].filter(Boolean);
  return `${cryptoStatusLabel(regime)} · CG ${capitalGainsLabel(regime)}${
    income.length ? ` · ${income.join(" · ")}` : ""
  }`;
}

export {
  CRYPTO_TAX_DATASET_URL,
  CRYPTO_TAX_UPDATED_AT,
  type CryptoTaxRegime,
};
