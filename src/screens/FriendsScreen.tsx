import Fuse from "fuse.js";
import dishData from "@/data/dishes.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DishVariant {
  label: string;
  removes: string[];
}

export interface DishEntry {
  name: string;
  allergens: string[];
  category: string;
  tags: string[];
  variants?: DishVariant[];
}

export interface DishSafetyResult {
  rating: "green" | "yellow" | "red" | "unknown";
  message: string;
  matchedDish: string | null;
  flaggedAllergens: string[];
  affectedGuests: number;
  isVariant: boolean;
  isOverride: boolean;
  effectiveAllergens: string[];
}

export interface ManualOverride {
  removes: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DISHES = dishData as DishEntry[];

interface SearchEntry {
  searchName: string;
  baseName: string;
  allergens: string[];
  isVariant: boolean;
  variantLabel: string | null;
}

const SEARCH_ENTRIES: SearchEntry[] = [];

for (const dish of DISHES) {
  SEARCH_ENTRIES.push({
    searchName: dish.name,
    baseName: dish.name,
    allergens: dish.allergens,
    isVariant: false,
    variantLabel: null,
  });
  if (dish.variants) {
    for (const variant of dish.variants) {
      const effectiveAllergens = dish.allergens.filter((a) => !variant.removes.includes(a));
      SEARCH_ENTRIES.push({
        searchName: variant.label,
        baseName: dish.name,
        allergens: effectiveAllergens,
        isVariant: true,
        variantLabel: variant.label,
      });
    }
  }
}

const fuse = new Fuse(SEARCH_ENTRIES, {
  keys: ["searchName"],
  threshold: 0.35,
  includeScore: true,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Core safety check ────────────────────────────────────────────────────────

export function checkDishSafety(
  dishName: string,
  guestRestrictions: string[][],
  override?: ManualOverride,
): DishSafetyResult {
  const results = fuse.search(dishName);

  if (results.length === 0) {
    return {
      rating: "unknown",
      message: "We don't recognize this dish — double-check ingredients with your guests.",
      matchedDish: null,
      flaggedAllergens: [],
      affectedGuests: 0,
      isVariant: false,
      isOverride: false,
      effectiveAllergens: [],
    };
  }

  const match = results[0].item;
  let effectiveAllergens = match.allergens;
  const isOverride = !!override && override.removes.length > 0;

  if (isOverride) {
    effectiveAllergens = effectiveAllergens.filter(
      (a) => !override!.removes.map((r) => r.toLowerCase()).includes(a.toLowerCase()),
    );
  }

  let affectedGuests = 0;
  const flaggedAllergens = new Set<string>();

  for (const guestAllergenList of guestRestrictions) {
    const overlap = guestAllergenList.filter((a) => effectiveAllergens.includes(a.toLowerCase()));
    if (overlap.length > 0) {
      affectedGuests++;
      overlap.forEach((a) => flaggedAllergens.add(a));
    }
  }

  const flagged = [...flaggedAllergens];
  const displayName = match.isVariant ? match.variantLabel! : match.baseName;
  const overrideSuffix = isOverride ? ` (removed: ${override!.removes.join(", ")})` : "";

  if (affectedGuests >= 2) {
    return {
      rating: "red",
      message: `Not safe — affects ${affectedGuests} guests (${flagged.join(", ")})${overrideSuffix}`,
      matchedDish: displayName,
      flaggedAllergens: flagged,
      affectedGuests,
      isVariant: match.isVariant,
      isOverride,
      effectiveAllergens,
    };
  } else if (affectedGuests === 1) {
    return {
      rating: "yellow",
      message: `Caution — affects 1 guest (${flagged.join(", ")})${overrideSuffix}`,
      matchedDish: displayName,
      flaggedAllergens: flagged,
      affectedGuests,
      isVariant: match.isVariant,
      isOverride,
      effectiveAllergens,
    };
  } else {
    return {
      rating: "green",
      message: `Safe for all guests!${overrideSuffix}`,
      matchedDish: displayName,
      flaggedAllergens: [],
      affectedGuests: 0,
      isVariant: match.isVariant,
      isOverride,
      effectiveAllergens,
    };
  }
}

// ─── Autocomplete ─────────────────────────────────────────────────────────────

export function getDishSuggestions(input: string, limit = 8): string[] {
  if (input.trim().length < 2) return [];
  const results = fuse.search(input, { limit });
  return results.map((r) => (r.item.isVariant ? r.item.variantLabel! : r.item.searchName));
}

// ─── Safe alternatives ────────────────────────────────────────────────────────

export function getSafeAlternatives(guestRestrictions: string[][], excludeDish?: string, limit = 3): string[] {
  const allRestrictions = new Set(guestRestrictions.flat().map((r) => r.toLowerCase()));

  const safeDishes = DISHES.filter((d) => d.name !== excludeDish && d.allergens.every((a) => !allRestrictions.has(a)));

  const usedCategories = new Set<string>();
  const diverse: DishEntry[] = [];
  const remainder: DishEntry[] = [];

  for (const dish of shuffleArray(safeDishes)) {
    if (!usedCategories.has(dish.category) && diverse.length < limit) {
      usedCategories.add(dish.category);
      diverse.push(dish);
    } else {
      remainder.push(dish);
    }
  }

  return [...diverse, ...remainder].slice(0, limit).map((d) => d.name);
}

// ─── Safer variants for a flagged dish ───────────────────────────────────────

export function getSaferVariants(
  dishName: string,
  guestRestrictions: string[][],
): { label: string; rating: "green" | "yellow" | "red" | "unknown" }[] {
  const dish = DISHES.find((d) => d.name.toLowerCase() === dishName.toLowerCase());
  if (!dish?.variants) return [];

  return dish.variants
    .map((v) => {
      const effectiveAllergens = dish.allergens.filter((a) => !v.removes.includes(a));
      const affectedGuests = guestRestrictions.filter((gr) =>
        gr.some((r) => effectiveAllergens.includes(r.toLowerCase())),
      ).length;
      const rating = affectedGuests >= 2 ? "red" : affectedGuests === 1 ? "yellow" : "green";
      return { label: v.label, rating };
    })
    .filter((v) => v.rating !== "red");
}
