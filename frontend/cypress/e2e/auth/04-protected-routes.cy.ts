import { setupAuthTest } from '../../support/setup/auth-setup';

describe('Authentication Flow', () => {
  beforeEach(() => {
    setupAuthTest();
  });

  describe('Protected Routes', () => {
    it('should protect dashboard route when not authenticated', () => {
      cy.clearCookies();

      cy.visit('/dashboard');

      cy.url().should('include', '/login');
      cy.url().should('include', `from=${encodeURIComponent('/dashboard')}`);

    });

    it('should redirect to intended page after login', () => {
      // Clear cookies
      cy.clearCookies();

      // Try to visit dashboard (will redirect to login)
      cy.visit('/dashboard');

      // Should be on login page with return URL
      cy.url().should('include', '/login');
      cy.url().should('include', `from=${encodeURIComponent('/dashboard')}`);

      // Login
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPass123!');
      cy.get('[data-testid="login-submit-btn"]').click();

      // Should redirect back to dashboard (not homepage)
      cy.url().should('include', '/dashboard');
      cy.url().should('not.include', '/login');
    });

    it('should show loading state while checking authentication', () => {
      cy.loginViaAPI('test@example.com', 'TestPass123!');

      // Intercept the /users/me call to add delay
      cy.intercept('GET', '/api/v1/users/me', (req) => {
        req.reply((res) => {
          res.delay = 1000; // 1 second delay
        });
      }).as('checkAuth');

      cy.visit('/dashboard');

      // Should show loading state (spinner or skeleton)
      // This depends on your implementation
      cy.get('[data-testid="dashboard-loading"]', { timeout: 500 }).should('exist');

      // Wait for auth check
      cy.wait('@checkAuth');

      // Loading should disappear
      cy.get('[data-testid="dashboard-loading"]').should('not.exist');
    });
  });
});
