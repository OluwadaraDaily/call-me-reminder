/**
 * Shared setup for reminders management tests
 * This function should be called in beforeEach hooks to ensure consistent test environment
 */
export function setupRemindersTest() {
  // Clear ALL cookies and local storage
  cy.clearAllCookies();
  cy.clearLocalStorage();

  // Reset database to clean state
  cy.task('db:reset');

  // Create fresh test user
  cy.task('db:seed:user', {
    email: 'test@example.com',
    password: 'TestPass123!',
  }).as('testUser');

  // Login via API for faster setup
  cy.loginViaAPI('test@example.com', 'TestPass123!');

  // Visit dashboard
  cy.visit('/dashboard');
  cy.waitForStats();
}
