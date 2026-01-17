import { setupAuthTest } from '../../support/setup/auth-setup';

describe('Authentication Flow', () => {
  beforeEach(() => {
    setupAuthTest();
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', () => {
      cy.visit('/login');

      // Fill in credentials
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPass123!');
      cy.get('[data-testid="login-submit-btn"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // User email should appear in navbar
      cy.get('[data-testid="user-email-display"]').should('contain', 'test@example.com');

      // Verify authenticated via API
      cy.checkAuthenticated();
    });

    it('should show validation errors for invalid credentials', () => {
      cy.visit('/login');

      // Test invalid email format
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="email-input"]').blur();
      cy.contains('Invalid email address').should('be.visible');

      // Clear and test short password
      cy.get('[data-testid="email-input"]').clear().type('test@example.com');
      cy.get('[data-testid="password-input"]').type('short');
      cy.get('[data-testid="password-input"]').blur();
      cy.contains(/password.*at least 8 characters/i).should('be.visible');
    });

    it('should show error for wrong credentials', () => {
      cy.visit('/login');

      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('WrongPassword123!');
      cy.get('[data-testid="login-submit-btn"]').click();

      // Should show error message in toast
      cy.expectToast(/invalid.*email.*password/i);

      // Should stay on login page
      cy.url().should('include', '/login');
    });

    it('should handle remember me checkbox', () => {
      cy.visit('/login');

      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPass123!');
      cy.get('[data-testid="remember-me-checkbox"]').click();
      cy.get('[data-testid="login-submit-btn"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // Verify cookie exists (Cypress sets cookies automatically)
      cy.getCookies().should('have.length.greaterThan', 0);
    });

    it('should redirect authenticated users away from login page', () => {
      // Login via API first
      cy.loginViaAPI('test@example.com', 'TestPass123!');

      // Try to visit login page
      cy.visit('/login');

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
    });
  });
});
