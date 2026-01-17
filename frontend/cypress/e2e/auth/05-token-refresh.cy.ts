import { setupAuthTest } from '../../support/setup/auth-setup';

describe('Authentication Flow', () => {
  beforeEach(() => {
    setupAuthTest();
  });

  describe('Token Refresh', () => {
    it('should handle token refresh automatically', () => {
      cy.loginViaAPI('test@example.com', 'TestPass123!');
      cy.visit('/dashboard');

      let requestCount = 0;
      cy.intercept('GET', '/api/v1/reminders/stats', (req) => {
        requestCount++;
        if (requestCount === 1) {
          req.reply({
            statusCode: 401,
            body: { detail: 'Token expired' },
          });
        } else {
          // Second request succeeds (after refresh)
          req.continue();
        }
      }).as('getStats');

      // The app should automatically refresh token and retry
      cy.wait('@getStats');

      // Dashboard should still load successfully
      cy.get('[data-testid="stats-card-total"]').should('be.visible');
    });
  });
});
