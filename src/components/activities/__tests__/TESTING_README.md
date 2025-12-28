# Activities E2E Testing Documentation

## Overview

This document describes the comprehensive E2E/integration test suite for the Activities functionality in the Convex CRM application.

## Test File Location

`src/components/activities/__tests__/activities-page.test.tsx`

## Test Coverage

The test suite provides comprehensive coverage of all activity management features:

### 1. View Activities List
- Renders activities page without errors
- Displays page header with description
- Renders all activities in the list
- Displays activity metadata correctly (priority, duration, direction)
- Shows loading state when data is not loaded
- Shows empty state when no activities exist

### 2. Filter by Type
- Displays all activity type tabs (All, Tasks, Calls, Emails, Meetings, Notes)
- Filters activities when switching tabs
- Shows empty state with type-specific message
- 'All' tab shows activities without type filter

### 3. Filter by Date
- Displays date filter dropdown
- Has correct date filter options (All time, Today, This week, This month)
- Filters activities by date range
- Defaults to 'All time' filter

### 4. Create New Activity
- Displays 'Add Task' and 'Add Note' buttons
- Opens task creation dialog
- Opens note creation dialog
- Task form has all required fields
- Note form has required fields
- Empty state create button opens task dialog

### 5. View Activity Detail
- Displays activity subject and description
- Displays related entity link (Contact, Company, Deal)
- Displays assigned user
- Displays outcome for calls/meetings
- Displays AI summary when available
- Displays relative timestamp

### 6. Edit Activity
- Displays editable activity data (future feature test)

### 7. Complete/Mark Done Activity
- Displays checkbox for task activities
- Checkbox state reflects completion status
- Calls complete mutation when checkbox is clicked
- Calls reopen mutation when unchecked
- Shows 'Done' badge for completed tasks
- Applies strikethrough style to completed tasks

### 8. Delete Activity
- Delete mutation is available (UI feature pending)

### 9. Link to Contact/Deal/Company
- Displays links to contacts
- Displays links to companies
- Displays links to deals
- Shows correct icons for entity types
- Shows tooltip on related entity hover

### 10. Calendar View (Sidebar)
- Displays upcoming tasks in sidebar
- Shows tasks with due dates
- Highlights overdue tasks
- Displays due dates
- Shows priority badges
- 'View all tasks' button switches to tasks tab

### 11. Timeline View
- Displays activities in chronological order
- Shows timeline connector between activities
- Hides connector for last activity
- Displays activity icons with proper colors
- Shows activity type badges

## Edge Cases and Error Handling

- Handles missing related entity gracefully
- Handles errors when completing tasks
- Indicates when more activities are available (pagination)
- Displays overdue badge for past due tasks
- Does not show overdue for completed tasks
- Handles activities with no description

## Accessibility

- Proper heading hierarchy
- Tab list is keyboard navigable
- Checkboxes have accessible labels
- Links have descriptive text
- Buttons have accessible names

## Responsive Design

- Activity type labels shown on desktop
- Sidebar hidden on mobile (lg: breakpoint)

## Performance

- Renders efficiently with many activities
- Memoizes filtered activities

## Mock Data Factories

The test suite uses mock data factories from `src/test/test-utils.tsx`:

- `createMockActivity()` - Creates mock activity with all required fields
- `createMockContact()` - Creates mock contact
- `createMockCompany()` - Creates mock company
- `createMockDeal()` - Creates mock deal
- `createMockUser()` - Creates mock user

## Running the Tests

```bash
# Run all component tests
npm run test:components

# Run only activities tests
npm run test:components:run -- src/components/activities/__tests__/activities-page.test.tsx

# Run with coverage
npm run test:components:coverage

# Run in watch mode
npm run test:components -- --watch
```

## Test Configuration

Tests use the component test configuration:
- Config file: `vitest.components.config.mts`
- Environment: jsdom
- Setup file: `src/test/setup.ts`
- Test utils: `src/test/test-utils.tsx`

## Mocking Strategy

The tests mock Convex React hooks (useQuery, useMutation) to provide predictable test data:

```typescript
// Mock Convex hooks
vi.mock("convex/react");

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);

// Setup in beforeEach
beforeEach(() => {
  mockUseQuery.mockImplementation(() => {
    // Return mock data based on call count or other criteria
  });

  mockUseMutation.mockImplementation(() => {
    // Return mock mutation functions
  });
});
```

## Known Limitations

1. **Pagination**: Current implementation doesn't have 'Load More' UI, tests verify hasMore flag
2. **Inline Edit**: No inline edit feature yet, tests verify data display
3. **Delete UI**: Delete mutation exists but no UI button, tests verify mutation availability

## Future Enhancements

1. Add tests for activity creation form submission
2. Add tests for activity editing when feature is implemented
3. Add tests for delete confirmation when UI is added
4. Add tests for drag-and-drop file uploads to activities
5. Add tests for activity attachments
6. Add tests for activity reminders/notifications

## Test Patterns

### Testing User Interactions

```typescript
it("calls complete mutation when checkbox is clicked", async () => {
  const { user } = render(<ActivitiesPage />);

  const checkbox = screen.getAllByRole("checkbox")[0];
  await user.click(checkbox);

  await waitFor(() => {
    expect(mockCompleteTask).toHaveBeenCalled();
  });
});
```

### Testing Conditional Rendering

```typescript
it("shows 'Done' badge for completed tasks", () => {
  const completedTask = {
    ...createActivity("task", { completed: true }),
    relatedEntity: mockContact,
  };

  mockUseQuery.mockReturnValue({
    items: [completedTask],
    hasMore: false,
  });

  render(<ActivitiesPage />);
  expect(screen.getByText("Done")).toBeInTheDocument();
});
```

### Testing Accessibility

```typescript
it("checkboxes have accessible labels", () => {
  render(<ActivitiesPage />);
  const checkboxes = screen.getAllByRole("checkbox");
  checkboxes.forEach((checkbox) => {
    expect(checkbox).toBeInTheDocument();
  });
});
```

## Debugging Tips

1. **Use screen.debug()**: Print the current DOM state
   ```typescript
   screen.debug(); // Prints entire document
   screen.debug(element); // Prints specific element
   ```

2. **Check what's rendered**: Use `screen.logTestingPlaygroundURL()` to get interactive playground

3. **Async issues**: Always use `waitFor()` for async updates
   ```typescript
   await waitFor(() => {
     expect(screen.getByText("Expected")).toBeInTheDocument();
   });
   ```

4. **Query debugging**: Use `screen.getByRole()` with options to find specific elements
   ```typescript
   screen.getByRole("button", { name: /add task/i })
   ```

## Contributing

When adding new activity features:

1. Add corresponding test cases to this file
2. Follow existing test patterns
3. Use mock data factories for consistency
4. Test both happy paths and edge cases
5. Include accessibility tests
6. Update this README with new test coverage

## References

- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro)
