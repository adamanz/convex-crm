import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component testing
    environment: "jsdom",

    // Setup files for React Testing Library
    setupFiles: ["./src/test/setup.ts"],

    // Include component test files
    include: ["src/components/**/__tests__/**/*.test.{ts,tsx}"],

    // Exclude patterns
    exclude: ["node_modules", "dist", ".next", "convex/**"],

    // Global test timeout (in ms)
    testTimeout: 30000,

    // Hook timeout (in ms)
    hookTimeout: 30000,

    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // CSS handling - don't try to transform CSS
    css: false,

    // Coverage configuration for components
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/components/**/*.{ts,tsx}"],
      exclude: [
        "src/components/**/__tests__/**",
        "src/test/**",
        "**/*.d.ts",
      ],
    },

    // Reporter configuration
    reporters: ["verbose"],

    // Deps configuration
    deps: {
      // Inline certain dependencies that need transformation
      inline: [/@radix-ui/, /class-variance-authority/],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
