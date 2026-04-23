import { Restaurant } from "@/data/restaurants";

export type CompatTier = "great" | "good" | "limited";

export interface CompatibilityResult {
  score: number; // 0–100
  tier: CompatTier;
  tierColor: "safe" | "caution" | "danger";
  summary: string;
}

/**
 * Compute a restaurant's compatibility against a list of guests' restrictions.
 * @param restaurant Restaurant entry
 * @param guestRestrictions Array of per-guest lowercase restriction arrays
 */
export function getRestaurantCompatibility(
  restaurant: Restaurant,
  guestRestrictions: string[][],
): CompatibilityResult {
  // Build union of all unique restrictions
  const union = new Set<string>();
  guestRestrictions.forEach((rs) => rs.forEach((r) => union.add(r.toLowerCase().trim())));

  if (union.size === 0) {
    // No restrictions → restaurant is fully compatible
    return {
      score: 100,
      tier: "great",
      tierColor: "safe",
      summary: `${restaurant.gfPct}% gluten-free · ${restaurant.veganPct}% vegan · ${restaurant.vegPct}% vegetarian`,
    };
  }

  const contributions: number[] = [];
  union.forEach((r) => {
    if (r === "gluten" || r === "wheat") {
      contributions.push(restaurant.gfPct);
    } else if (r === "vegan") {
      contributions.push(restaurant.veganPct);
    } else if (r === "vegetarian") {
      contributions.push(restaurant.vegPct);
    } else if (
      ["dairy", "eggs", "soy", "peanuts", "tree nuts", "shellfish", "fish", "sesame"].includes(r)
    ) {
      // No per-allergen data — use vegetarian as a rough proxy, capped at 50
      contributions.push(Math.min(restaurant.vegPct, 50));
    } else {
      // Unknown restriction — assume 40% as a conservative middle ground
      contributions.push(40);
    }
  });

  const avg = contributions.reduce((a, b) => a + b, 0) / contributions.length;
  const score = Math.round(avg);
  let tier: CompatTier;
  let tierColor: "safe" | "caution" | "danger";
  if (score >= 70) {
    tier = "great";
    tierColor = "safe";
  } else if (score >= 45) {
    tier = "good";
    tierColor = "caution";
  } else {
    tier = "limited";
    tierColor = "danger";
  }

  // Build a short summary from the highlighted stats
  const parts: string[] = [];
  if (union.has("gluten") || union.has("wheat")) parts.push(`${restaurant.gfPct}% gluten-free`);
  if (union.has("vegan")) parts.push(`${restaurant.veganPct}% vegan`);
  if (union.has("vegetarian") || parts.length === 0) parts.push(`${restaurant.vegPct}% vegetarian`);

  return { score, tier, tierColor, summary: parts.join(" · ") };
}
