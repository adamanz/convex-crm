# Deals E2E/Integration Tests

## Overview

This directory contains comprehensive E2E and integration tests for the deals/pipeline functionality in the CRM application.

## Test Files

### 1. `deals-e2e.test.tsx`
Main E2E test suite covering all deal workflows from creation to close.

**Test Coverage:**
1. **View Deals List** - Display deals in table format with all metadata
2. **View Deals Kanban Board** - Pipeline view with drag-and-drop
3. **Drag Deal Between Stages** - Move deals across pipeline stages
4. **Create New Deal** - Complete deal creation workflow
5. **View Deal Detail** - Full deal information display
6. **Edit Deal** - Update existing deals
7. **Delete Deal** - Remove deals from system
8. **Update Deal Value** - Modify deal amounts and currency
9. **Change Deal Stage** - Move deals through sales pipeline
10. **Win/Lose Deal** - Close deals as won or lost
11. **Add Products to Deal** - Track products/services
12. **Add Activities to Deal** - Log calls, meetings, emails, notes

### 2. `pipeline-board.test.tsx`
Focused tests for the kanban board component.

**Test Coverage:**
- Stage rendering and ordering
- Deal cards in stages
- Stage totals and counts
- Drag and drop functionality
- Multiple deals per stage
- Won/lost status indicators
- Empty state handling

### 3. `deal-form.test.tsx`
Comprehensive form validation and interaction tests.

**Test Coverage:**
- Form rendering in create/edit modes
- Field validation (required fields, positive amounts)
- Default values population
- User interactions (typing, selecting)
- Company and contact selection
- Multi-select contacts
- Currency selection
- Form submission
- Loading states
- Accessibility compliance

## Running Tests

### Run all deal tests:
```bash
npm run test:components -- src/components/deals/__tests__
```

### Run specific test file:
```bash
npm run test:components -- src/components/deals/__tests__/deals-e2e.test.tsx
```

### Run with watch mode:
```bash
npm run test:components -- src/components/deals/__tests__ --watch
```

### Run with coverage:
```bash
npm run test:components:coverage -- src/components/deals/__tests__
```

## Test Utilities

All tests use the custom test utilities defined in `/src/test/test-utils.tsx`:

- `createMockDeal()` - Creates mock deal objects
- `createMockDealWithRelations()` - Creates deals with company, contacts, pipeline
- `createMockPipeline()` - Creates mock pipeline with stages
- `createMockCompany()` - Creates mock company objects
- `createMockContact()` - Creates mock contact objects
- `createMockUser()` - Creates mock user objects

## Testing Strategy

### Unit Tests
Individual component functionality with mocked dependencies.

### Integration Tests
Component interactions with mocked Convex mutations/queries.

### E2E Tests
Complete user workflows from start to finish.

## Key Testing Patterns

### 1. Mocking Convex Hooks
```typescript
vi.mock("convex/react");
const mockUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;

mockUseQuery.mockReturnValue([mockPipeline]);
mockUseMutation.mockReturnValue(mockCreateDeal);
```

### 2. User Interactions
```typescript
const { user } = render(<DealForm ... />);
await user.type(nameInput, "New Deal");
await user.click(submitButton);
```

### 3. Async Testing
```typescript
await waitFor(() => {
  expect(mockOnSubmit).toHaveBeenCalled();
});
```

### 4. Accessibility Testing
```typescript
expect(screen.getByLabelText(/deal name/i)).toBeInTheDocument();
expect(screen.getByRole("button", { name: /create deal/i })).toBeInTheDocument();
```

## Test Statistics

- **Total Tests**: 33+
- **Passing**: 24+ (as of last run)
- **Coverage Areas**:
  - Deal CRUD operations
  - Pipeline/stage management
  - Form validation
  - User interactions
  - Drag and drop
  - Win/loss tracking
  - Accessibility
  - Error handling
  - Loading states

## Common Issues

### 1. Radix UI Select Testing
Radix UI components require special handling for dropdown interactions:
```typescript
const selectButton = screen.getByRole("combobox", { name: /stage/i });
await user.click(selectButton);
// Options will appear in portal
```

### 2. Finding Dropdown Menu Buttons
The MoreHorizontal icon button doesn't have accessible name:
```typescript
const menuButtons = screen.getAllByRole("button");
const menuButton = menuButtons.find((btn) => btn.querySelector("svg"));
await user.click(menuButton);
```

### 3. Async State Updates
Always use `waitFor` for async operations:
```typescript
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

## Future Improvements

1. Add Playwright E2E tests for real browser testing
2. Increase coverage for edge cases
3. Add performance testing for large deal lists
4. Test drag-and-drop with @dnd-kit testing utilities
5. Add visual regression tests
6. Test keyboard navigation thoroughly
7. Add tests for deal products/line items
8. Test deal approvals workflow
9. Test deal comments/collaboration
10. Add tests for deal reports/analytics

## Contributing

When adding new deal features:

1. Write tests first (TDD approach recommended)
2. Follow existing test patterns
3. Use descriptive test names
4. Test happy path and error cases
5. Ensure accessibility compliance
6. Update this README with new test coverage
