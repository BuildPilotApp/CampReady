import type { ChecklistTemplate } from "@/types";
import { createCategory, createGearItem } from "@/lib/storage";

function buildCategories(
  groups: { name: string; items: string[] }[],
): ChecklistTemplate["categories"] {
  return groups.map((group) => {
    const category = createCategory({ name: group.name });
    return {
      ...category,
      items: group.items.map((name) =>
        createGearItem({ name, category: category.id }),
      ),
    };
  });
}

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: "weekend-car-camping",
    name: "Weekend Car Camping",
    description: "Shelter, kitchen, and camp comfort essentials.",
    categories: buildCategories([
      {
        name: "Shelter",
        items: ["Tent", "Rain fly", "Sleeping bags", "Sleeping pads", "Pillows"],
      },
      {
        name: "Kitchen",
        items: [
          "Camp stove",
          "Fuel canister",
          "Cookset",
          "Cooler",
          "Water jug",
          "Utensils",
        ],
      },
      {
        name: "Tools",
        items: ["Headlamps", "Multi-tool", "Duct tape", "First aid kit"],
      },
    ]),
  },
  {
    id: "backpacking-lite",
    name: "Backpacking Lite",
    description: "Ultralight shelter, food, and safety basics.",
    categories: buildCategories([
      {
        name: "Shelter",
        items: ["Backpacking tent", "Trekking poles", "Bivy sack"],
      },
      {
        name: "Kitchen",
        items: ["Canister stove", "Spork", "Water filter", "Meal bags"],
      },
      {
        name: "Tools",
        items: ["Headlamp", "Fire starter", "Map & compass", "Whistle"],
      },
    ]),
  },
  {
    id: "family-basecamp",
    name: "Family Basecamp",
    description: "Roomy setup with extra comfort and kid-friendly gear.",
    categories: buildCategories([
      {
        name: "Shelter",
        items: [
          "Large tent",
          "Tent footprint",
          "Camp chairs",
          "Lantern",
          "Screen house",
        ],
      },
      {
        name: "Kitchen",
        items: [
          "Two-burner stove",
          "Propane",
          "Dutch oven",
          "Coffee kit",
          "Trash bags",
        ],
      },
      {
        name: "Tools",
        items: [
          "Axe / hatchet",
          "Rope & carabiners",
          "Bug spray",
          "Sunscreen",
          "First aid kit",
        ],
      },
    ]),
  },
];

export function getTemplateById(id: string): ChecklistTemplate | undefined {
  return CHECKLIST_TEMPLATES.find((template) => template.id === id);
}
