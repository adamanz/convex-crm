// Search and Filtering Components
// ================================

// Global Search - Main search modal with Cmd+K activation
export {
  GlobalSearch,
  GlobalSearchProvider,
  useGlobalSearch,
} from "./GlobalSearch";

// Filter Bar - Filter dropdowns and chips for list views
export {
  FilterBar,
  useFilterBar,
  contactFilterDefinitions,
  companyFilterDefinitions,
  dealFilterDefinitions,
  type FilterDefinition,
  type FilterOption,
  type FilterValue,
  type ActiveFilter,
  type FilterBarProps,
  type UseFilterBarOptions,
} from "./FilterBar";

// Saved Filters - Saved filter presets
export {
  SavedFilters,
  useSavedFilters,
  type SavedFilter,
  type SavedFiltersProps,
} from "./SavedFilters";

// Search Result - Individual search result item
export {
  SearchResultItem,
  type SearchResult,
  type SearchResultType,
  type SearchResultProps,
  type ContactSearchResult,
  type CompanySearchResult,
  type DealSearchResult,
} from "./SearchResult";
