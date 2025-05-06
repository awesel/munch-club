// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock the libraries
jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn().mockReturnValue({
    user: {
      uid: "test-user-id",
      email: "test@stanford.edu",
      displayName: "Test User",
    },
    loading: false,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

jest.mock("@/lib/api", () => ({
  saveUserSurvey: jest.fn().mockResolvedValue(undefined),
  hasCompletedSurvey: jest.fn().mockResolvedValue(false),
  formatDateKey: jest.fn((date) => date.toISOString().split("T")[0]),
}));
