/**
 * Shared setup for authentication tests
 * This function should be called in beforeEach hooks to ensure consistent test environment
 */
export function setupAuthTest() {
  // Clear ALL cookies (including httpOnly) and local storage
  cy.clearAllCookies();
  cy.clearLocalStorage();

  // Reset database to clean state (this also deletes refresh_tokens)
  cy.task('db:reset');

  // Create fresh test user
  cy.task('db:seed:user', {
    email: 'test@example.com',
    password: 'TestPass123!',
  }).as('testUser');
}
