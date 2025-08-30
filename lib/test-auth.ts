// Mock authentication for testing mode
export const MOCK_USER = {
  id: 'test-user-123',
  userId: 'test-user-123',
  email: 'test@explosives.local',
  firstName: 'Test',
  lastName: 'Operator',
  username: 'test@explosives.local',
};

export const MOCK_SESSION = {
  userId: 'test-user-123',
  user: MOCK_USER,
};

export function isTestingMode(): boolean {
  return process.env.TESTING_MODE === 'true';
}

export function getMockUser() {
  return isTestingMode() ? MOCK_USER : null;
}

export function getMockSession() {
  return isTestingMode() ? MOCK_SESSION : null;
}

// Mock auth function for tRPC context
export function getMockAuth() {
  if (!isTestingMode()) {
    return null;
  }
  
  return {
    userId: MOCK_USER.id,
    user: MOCK_USER,
    session: MOCK_SESSION,
  };
}