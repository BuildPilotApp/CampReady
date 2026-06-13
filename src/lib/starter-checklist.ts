import { createCategory, createGearItem } from "@/lib/storage/defaults";
import type { Category } from "@/types";

export const STARTER_TRIP_NAME = "Weekend Camping";
export const STARTER_TEMPLATE_NAME = "Weekend Car Camping";
export const STARTER_TEMPLATE_DESCRIPTION =
  "Starter gear list for car camping and short road trips.";

const STARTER_SECTIONS: Array<{ name: string; items: Array<{ name: string; weight_lbs?: number }> }> =
  [
    {
      name: "Shelter",
      items: [
        { name: "Tent", weight_lbs: 8 },
        { name: "Sleeping bag", weight_lbs: 3 },
        { name: "Sleeping pad", weight_lbs: 2 },
        { name: "Pillow", weight_lbs: 1 },
      ],
    },
    {
      name: "Kitchen",
      items: [
        { name: "Camp stove", weight_lbs: 2 },
        { name: "Fuel canister", weight_lbs: 1 },
        { name: "Cookset", weight_lbs: 1 },
        { name: "Utensils", weight_lbs: 0.5 },
        { name: "Cooler", weight_lbs: 12 },
        { name: "Water jug", weight_lbs: 8 },
      ],
    },
    {
      name: "Clothing",
      items: [
        { name: "Rain jacket", weight_lbs: 1 },
        { name: "Warm layer", weight_lbs: 1 },
        { name: "Hiking boots", weight_lbs: 3 },
        { name: "Extra socks", weight_lbs: 0.5 },
      ],
    },
    {
      name: "Safety & Tools",
      items: [
        { name: "First aid kit", weight_lbs: 1 },
        { name: "Headlamp", weight_lbs: 0.5 },
        { name: "Multi-tool", weight_lbs: 0.5 },
        { name: "Fire starter", weight_lbs: 0.25 },
        { name: "Trash bags", weight_lbs: 0.25 },
      ],
    },
  ];

export function buildStarterCategories(): Category[] {
  return STARTER_SECTIONS.map((section) => {
    const category = createCategory({ name: section.name });
    category.items = section.items.map((item) =>
      createGearItem({
        name: item.name,
        category: category.id,
        weight_lbs: item.weight_lbs,
      }),
    );
    return category;
  });
}
