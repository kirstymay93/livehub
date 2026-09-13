export function normalizeCreatorCategories(categories?: string[]) {
  return Array.from(
    new Set(
      (categories || [])
        .map((category) => category.trim())
        .filter(Boolean)
    )
  ).slice(0, 5);
}
