import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: [
      // Redirect _generated/api imports to mock for ESM compatibility
      {
        find: /.*\/_generated\/api(\.js|\.ts)?$/,
        replacement: path.resolve(__dirname, "convex/__tests__/mocks/api.ts"),
      },
    ],
  },
  test: {
    // Use edge-runtime environment for convex-test
    environment: "edge-runtime",

    // Inline dependencies for ESM compatibility
    server: {
      deps: {
        inline: ["convex-test", "convex", /convex\/_generated/],
      },
    },

    // Include only convex unit tests (not integration tests that may load api.js)
    include: ["convex/__tests__/**/*.test.ts"],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".next"],

    // Global test timeout (in ms) - longer for integration tests
    testTimeout: 60000,

    // Hook timeout (in ms)
    hookTimeout: 60000,

    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // Pool configuration for better test isolation
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Run tests in a single fork for Convex isolation
      },
    },

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["convex/**/*.ts"],
      exclude: [
        "convex/_generated/**",
        "convex/__tests__/**",
        "src/test/**",
        "**/*.d.ts",
      ],
    },

    // Reporter configuration
    reporters: ["verbose"],
  },
});
