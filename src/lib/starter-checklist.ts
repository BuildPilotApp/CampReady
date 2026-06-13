import { createCategory, createGearItem } from "@/lib/storage/defaults";
import type { Category } from "@/types";

export const STARTER_TRIP_NAME = "Weekend camping trip";
export const STARTER_CHECKLIST_NAME = "Weekend camping starter";

const STARTER_SECTIONS: ReadonlyArray<{ name: string; items: readonly string[] }> = [
  {
    name: "Shelter",
    items: ["Tent", "Sleeping bag", "Sleeping pad", "Pillow"],
  },
  {
    name: "Kitchen",
    items: ["Camp stove", "Fuel", "Cookset", "Utensils", "Cooler", "Water jugs"],
  },
  {
    name: "Clothing",
    items: ["Rain jacket", "Warm layers", "Hiking boots", "Extra socks"],
  },
  {
    name: "Safety",
    items: ["First aid kit", "Headlamp", "Extra batteries", "Fire starter", "Knife"],
  },
  {
    name: "Camp",
    items: ["Camp chairs", "Lantern", "Trash bags", "Sunscreen", "Insect repellent"],
  },
];

/** Builds a fresh starter checklist (new ids each call). */
export function buildStarterCategories(): Category[] {
  return STARTER_SECTIONS.map(({ name, items }) => {
    const category = createCategory({ name });
    category.items = items.map((itemName) =>
      createGearItem({
        name: itemName,
        category: category.id,
      }),
    );
    return category;
  });
}
