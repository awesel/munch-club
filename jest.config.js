const nextJest = require("next/jest");

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  preset: "ts-jest",
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured by next/jest)
    "^@/(.*)$": "<rootDir>/$1",
    // Use explicit mocks
    "^@/context/AuthContext$": "<rootDir>/__mocks__/context/AuthContext.tsx",
    "^@/components/AvailabilityGrid$":
      "<rootDir>/__mocks__/components/AvailabilityGrid.tsx",
    "^@/lib/firebase$": "<rootDir>/__mocks__/lib/firebase.ts",
    "^@/lib/api$": "<rootDir>/__mocks__/lib/api.ts",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  // Make sure tests in __mocks__ directories aren't detected as duplicates
  modulePathIgnorePatterns: ["__tests__/__mocks__"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config);
