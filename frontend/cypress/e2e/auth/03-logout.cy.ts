import { setupAuthTest } from '../../support/setup/auth-setup';

describe('Authentication Flow', () => {
  beforeEach(() => {
    setupAuthTest();
  });

  describe('Logout', () => {
    it('should logout successfully', () => {
      cy.loginViaAPI('test@example.com', 'TestPass123!');
      cy.visit('/dashboard');

      cy.url().should('include', '/dashboard');

      cy.logout();

      cy.url().should('eq', Cypress.config().baseUrl + '/');

      cy.getCookie('access_token').should('not.exist');

      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });
});
