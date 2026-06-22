/**
 * Utility functions for product variant handling
 */

/**
 * Sort product variants in a deterministic order.
 * Typically sorts color variants first, then size, then others alphabetically.
 */
export function sortVariants<T extends { name: string }>(variants: T[]): T[] {
  const priority: Record<string, number> = {
    warna: 0,
    color: 1,
    ukuran: 2,
    size: 3,
  };

  return [...variants].sort((a, b) => {
    const aPriority = priority[a.name.toLowerCase()] ?? 99;
    const bPriority = priority[b.name.toLowerCase()] ?? 99;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.name.localeCompare(b.name);
  });
}