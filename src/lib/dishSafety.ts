import Fuse from "fuse.js";

interface DishEntry {
  name: string;
  allergens: string[];
}

const DISH_ALLERGEN_MAP: DishEntry[] = [
  // Pasta & Grains
  { name: "Pasta Salad", allergens: ["gluten", "dairy"] },
  { name: "Mac and Cheese", allergens: ["gluten", "dairy", "eggs"] },
  { name: "Lasagna", allergens: ["gluten", "dairy", "eggs"] },
  { name: "Spaghetti and Meatballs", allergens: ["gluten", "eggs"] },
  { name: "Fried Rice", allergens: ["soy", "eggs"] },
  { name: "Risotto", allergens: ["dairy"] },
  { name: "Quinoa Salad", allergens: [] },
  // Salads
  { name: "Caesar Salad", allergens: ["dairy", "eggs", "fish", "gluten"] },
  { name: "Greek Salad", allergens: ["dairy"] },
  { name: "Coleslaw", allergens: ["eggs"] },
  { name: "Garden Salad", allergens: [] },
  { name: "Fruit Salad", allergens: [] },
  { name: "Caprese Salad", allergens: ["dairy"] },
  // Proteins
  { name: "BBQ Chicken", allergens: ["soy"] },
  { name: "Grilled Chicken", allergens: [] },
  { name: "Pulled Pork", allergens: [] },
  { name: "Meatballs", allergens: ["gluten", "eggs", "dairy"] },
  { name: "Deviled Eggs", allergens: ["eggs"] },
  { name: "Shrimp Cocktail", allergens: ["shellfish"] },
  { name: "Beef Tacos", allergens: ["gluten", "dairy"] },
  { name: "Turkey Meatloaf", allergens: ["gluten", "eggs"] },
  // Dips & Sides
  { name: "Hummus", allergens: ["sesame"] },
  { name: "Guacamole", allergens: [] },
  { name: "Spinach Artichoke Dip", allergens: ["dairy", "eggs"] },
  { name: "Chips and Salsa", allergens: [] },
  { name: "Potato Salad", allergens: ["eggs"] },
  { name: "Roasted Vegetables", allergens: [] },
  { name: "Corn on the Cob", allergens: ["dairy"] },
  { name: "Garlic Bread", allergens: ["gluten", "dairy"] },
  { name: "Stuffed Mushrooms", allergens: ["dairy", "gluten"] },
  // Baked Goods & Desserts
  { name: "Chocolate Cake", allergens: ["gluten", "dairy", "eggs", "tree nuts"] },
  { name: "Brownies", allergens: ["gluten", "dairy", "eggs"] },
  { name: "Cookies", allergens: ["gluten", "dairy", "eggs", "tree nuts"] },
  { name: "Cheesecake", allergens: ["gluten", "dairy", "eggs"] },
  { name: "Apple Pie", allergens: ["gluten", "dairy", "eggs"] },
  { name: "Banana Bread", allergens: ["gluten", "dairy", "eggs", "tree nuts"] },
  { name: "Rice Krispie Treats", allergens: ["dairy"] },
  { name: "Flourless Chocolate Cake", allergens: ["dairy", "eggs", "tree nuts"] },
];

const fuse = new Fuse(DISH_ALLERGEN_MAP, {
  keys: ["name"],
  threshold: 0.35,
});

export interface DishSafetyResult {
  rating: "green" | "yellow" | "red" | "unknown";
  message: string;
  matchedDish: string | null;
  flaggedAllergens: string[];
  affectedGuests: number;
}

export function checkDishSafety(
  dishName: string,
  guestRestrictions: string[][] // per-guest restriction arrays
): DishSafetyResult {
  const results = fuse.search(dishName);

  if (results.length === 0) {
    return {
      rating: "unknown",
      message: "We don't recognize this dish — double-check ingredients with your guests.",
      matchedDish: null,
      flaggedAllergens: [],
      affectedGuests: 0,
    };
  }

  const match = results[0].item;
  const dishAllergens = match.allergens;

  let affectedGuests = 0;
  const flaggedAllergens = new Set<string>();

  for (const guestAllergenList of guestRestrictions) {
    const overlap = guestAllergenList.filter((a) =>
      dishAllergens.includes(a.toLowerCase())
    );
    if (overlap.length > 0) {
      affectedGuests++;
      overlap.forEach((a) => flaggedAllergens.add(a));
    }
  }

  const flagged = [...flaggedAllergens];

  if (affectedGuests >= 2) {
    return {
      rating: "red",
      message: `Not safe — affects ${affectedGuests} guests (${flagged.join(", ")})`,
      matchedDish: match.name,
      flaggedAllergens: flagged,
      affectedGuests,
    };
  } else if (affectedGuests === 1) {
    return {
      rating: "yellow",
      message: `Caution — affects 1 guest (${flagged.join(", ")})`,
      matchedDish: match.name,
      flaggedAllergens: flagged,
      affectedGuests,
    };
  } else {
    return {
      rating: "green",
      message: "Safe for all guests!",
      matchedDish: match.name,
      flaggedAllergens: [],
      affectedGuests: 0,
    };
  }
}

export function getSafeAlternatives(
  guestRestrictions: string[][],
  excludeDish?: string,
  limit = 3
): string[] {
  const allRestrictions = new Set(
    guestRestrictions.flat().map((r) => r.toLowerCase())
  );
  return DISH_ALLERGEN_MAP.filter(
    (d) =>
      d.name !== excludeDish &&
      d.allergens.every((a) => !allRestrictions.has(a))
  )
    .slice(0, limit)
    .map((d) => d.name);
}
