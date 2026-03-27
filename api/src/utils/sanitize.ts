/**
 * Escape special regex characters in user input to prevent NoSQL injection.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
