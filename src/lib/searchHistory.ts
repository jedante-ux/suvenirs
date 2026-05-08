const SEARCH_HISTORY_KEY = 'suvenirs_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  term: string;
  timestamp: number;
  category?: string;
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Add a search term to history
 */
export function addSearchToHistory(term: string, category?: string): void {
  if (typeof window === 'undefined' || !term.trim()) return;

  try {
    const history = getSearchHistory();

    // Remove duplicate if exists
    const filteredHistory = history.filter(
      item => item.term.toLowerCase() !== term.toLowerCase()
    );

    // Add new item at the beginning
    const newItem: SearchHistoryItem = {
      term: term.trim(),
      timestamp: Date.now(),
      category,
    };

    const newHistory = [newItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}

/**
 * Get recent search terms for product recommendations
 * Returns unique terms from recent searches
 */
export function getRecentSearchTerms(limit: number = 5): string[] {
  const history = getSearchHistory();

  // Get unique terms ordered by most recent
  const uniqueTerms = history
    .map(item => item.term.toLowerCase())
    .filter((term, index, self) => self.indexOf(term) === index)
    .slice(0, limit);

  return uniqueTerms;
}

/**
 * Check if there's any search history
 */
export function hasSearchHistory(): boolean {
  return getSearchHistory().length > 0;
}

/**
 * Build a search query from recent history for product recommendations
 */
export function buildRecommendationQuery(): string | null {
  const recentTerms = getRecentSearchTerms(3);

  if (recentTerms.length === 0) return null;

  // Join terms with OR-like search (the API will search for any match)
  return recentTerms.join(' ');
}
