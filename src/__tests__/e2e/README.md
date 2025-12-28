# E2E/Integration Tests for Dashboard and Navigation

This directory contains comprehensive end-to-end and integration tests for the CRM dashboard and navigation system using Vitest and React Testing Library.

## Test Files

### 1. `dashboard.test.tsx`
Complete testing of the dashboard page including:
- Page load and rendering
- Stats cards display and functionality
- Pipeline value visualization
- Recent activity feed
- Recent deals list
- Upcoming tasks section
- Quick actions
- Responsive layout
- Accessibility features
- Data integration with Convex queries

### 2. `navigation.test.tsx`
Comprehensive navigation system tests covering:
- Sidebar navigation structure
- Mobile navigation drawer
- Navigation section expansion/collapse
- User profile display
- Settings navigation
- Dashboard header
- Command palette (Cmd+K)
- Search functionality
- Keyboard shortcuts
- Active route highlighting
- Dark mode support

### 3. `dashboard-integration.test.tsx`
Integration tests combining dashboard and navigation:
- Complete layout rendering
- Navigation flows between pages
- Command palette search integration
- Mobile navigation workflows
- User profile dropdown
- Settings navigation paths
- Search integration
- Responsive behavior
- Keyboard shortcuts integration
- Data loading states
- Error handling
- Performance optimization

## Running Tests

### Run all E2E/integration tests:
```bash
npm run test:e2e
```

### Run tests once (CI mode):
```bash
npm run test:e2e:run
```

### Run with coverage:
```bash
npm run test:e2e:coverage
```

### Run with UI (interactive mode):
```bash
npm run test:e2e:ui
```

### Watch mode for development:
```bash
npm run test:e2e
```

## Test Coverage

These tests provide comprehensive coverage for:

1. **Dashboard Features** (11 test suites, 60+ tests)
2. **Navigation System** (13 test suites, 80+ tests)
3. **Integration Workflows** (15 test suites, 70+ tests)

Total: **39 test suites with 210+ individual test cases**

## Testing Approach

### Mocking Strategy
- Convex hooks (`useQuery`, `useMutation`) are mocked
- Next.js router hooks (`useRouter`, `usePathname`) are mocked
- Toast notifications are mocked
- Shortcuts provider is mocked

### Test Utilities
Located in `/src/test/test-utils.tsx`

## Best Practices

1. Use semantic queries: `getByRole`, `getByLabelText`
2. Test user behavior, not implementation
3. Use waitFor for async operations
4. Clear mocks in beforeEach
5. Descriptive test names using "should..." pattern

## Accessibility Testing

All tests include:
- Proper heading hierarchy
- Keyboard navigation
- ARIA labels
- Focus management
- Screen reader support

## Debugging

```bash
# Run specific file
npm run test:e2e -- dashboard.test.tsx

# Run specific test
npm run test:e2e -- -t "should display welcome message"

# Debug mode
npm run test:e2e -- --inspect-brk
```
