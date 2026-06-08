import type { ChecklistTemplate } from "@/types";
import { createCategory, createGearItem } from "@/lib/storage";

export const CUSTOM_TEMPLATE_ID = "custom";
export const SAMPLE_TEMPLATE_ID = "weekend-car-camping";

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

export const SAMPLE_CHECKLIST_TEMPLATE: ChecklistTemplate = {
  id: SAMPLE_TEMPLATE_ID,
  name: "Weekend Car Camping",
  description: "Suggested starter list with shelter, kitchen, and camp essentials.",
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
};

export const TRIP_CHECKLIST_OPTIONS = [
  {
    id: CUSTOM_TEMPLATE_ID,
    name: "Custom",
    description: "Start with a blank checklist and build your own categories.",
  },
  {
    id: SAMPLE_TEMPLATE_ID,
    name: SAMPLE_CHECKLIST_TEMPLATE.name,
    description: SAMPLE_CHECKLIST_TEMPLATE.description,
  },
] as const;

export type TripChecklistTemplateId =
  (typeof TRIP_CHECKLIST_OPTIONS)[number]["id"];

export interface TemplateOption {
  id: string;
  name: string;
  description: string;
}

/** All checklist options available when creating a trip. */
export function getSelectableTemplateOptions(
  savedTemplates: ChecklistTemplate[],
): TemplateOption[] {
  const builtIn: TemplateOption[] = TRIP_CHECKLIST_OPTIONS.map((option) => ({
    id: option.id,
    name: option.name,
    description: option.description,
  }));

  const customSaved = savedTemplates
    .filter((template) => template.id !== SAMPLE_TEMPLATE_ID)
    .map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
    }));

  return [...builtIn, ...customSaved];
}

export function getTemplateOptionLabel(
  templateId: string,
  savedTemplates: ChecklistTemplate[],
): string {
  return (
    getSelectableTemplateOptions(savedTemplates).find(
      (option) => option.id === templateId,
    )?.name ?? "Custom"
  );
}

/** Built-in templates stored in the database (sample only). */
export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [SAMPLE_CHECKLIST_TEMPLATE];

export function getTemplateById(id: string): ChecklistTemplate | undefined {
  if (id === CUSTOM_TEMPLATE_ID) {
    return undefined;
  }
  return CHECKLIST_TEMPLATES.find((template) => template.id === id);
}
