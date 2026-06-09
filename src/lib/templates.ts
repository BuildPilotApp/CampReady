import type { ChecklistTemplate } from "@/types";

export const CUSTOM_TEMPLATE_ID = "custom";

/** Legacy built-in id — removed from picker and stripped on database load. */
export const SAMPLE_TEMPLATE_ID = "weekend-car-camping";

export const CUSTOM_CHECKLIST_OPTION = {
  id: CUSTOM_TEMPLATE_ID,
  name: "New",
  description: "Start with a blank gear checklist and add your own categories.",
} as const;

export interface TemplateOption {
  id: string;
  name: string;
  description: string;
}

/** Checklist options when creating or editing a trip: New plus user-saved lists. */
export function getSelectableTemplateOptions(
  savedTemplates: ChecklistTemplate[],
): TemplateOption[] {
  const userSaved = savedTemplates
    .filter((template) => template.id !== SAMPLE_TEMPLATE_ID)
    .map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
    }));

  return [
    {
      id: CUSTOM_CHECKLIST_OPTION.id,
      name: CUSTOM_CHECKLIST_OPTION.name,
      description: CUSTOM_CHECKLIST_OPTION.description,
    },
    ...userSaved,
  ];
}

export function getTemplateOptionLabel(
  templateId: string,
  savedTemplates: ChecklistTemplate[],
): string {
  return (
    getSelectableTemplateOptions(savedTemplates).find(
      (option) => option.id === templateId,
    )?.name ?? CUSTOM_CHECKLIST_OPTION.name
  );
}

/** Remove legacy built-in sample templates from persisted user data. */
export function filterUserSavedTemplates(
  templates: ChecklistTemplate[],
): ChecklistTemplate[] {
  return templates.filter((template) => template.id !== SAMPLE_TEMPLATE_ID);
}

export function getTemplateStats(template: ChecklistTemplate): {
  categoryCount: number;
  itemCount: number;
} {
  const categoryCount = template.categories.length;
  const itemCount = template.categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );
  return { categoryCount, itemCount };
}
