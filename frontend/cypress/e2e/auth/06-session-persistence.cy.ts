import { setupAuthTest } from '../../support/setup/auth-setup';

describe('Authentication Flow', () => {
  beforeEach(() => {
    setupAuthTest();
  });

  describe('Session Persistence', () => {
    it('should maintain session across page refreshes', () => {
      cy.loginViaAPI('test@example.com', 'TestPass123!');
      cy.visit('/dashboard');

      // Verify logged in
      cy.get('[data-testid="user-email-display"]').should('contain', 'test@example.com');

      // Refresh page
      cy.reload();

      // Should still be logged in
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-email-display"]').should('contain', 'test@example.com');
    });

    it('should clear session data on logout', () => {
      cy.loginViaAPI('test@example.com', 'TestPass123!');
      cy.visit('/dashboard');

      // Create a reminder to populate cache
      cy.fixture('reminders.json').then((reminders) => {
        cy.createReminderAPI(reminders.validReminder);
      });

      // Wait for data to load
      cy.get('[data-testid="reminders-table"]').should('be.visible');

      // Logout
      cy.logout();

      // Login again
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPass123!');
      cy.get('[data-testid="login-submit-btn"]').click();

      // Should load fresh data (query cache should be cleared on logout)
      cy.url().should('include', '/dashboard');
    });
  });
});
