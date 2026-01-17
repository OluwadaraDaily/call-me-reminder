import { setupAuthTest } from '../../support/setup/auth-setup';

describe('Authentication Flow', () => {
  beforeEach(() => {
    setupAuthTest();
  });

  describe('Signup', () => {
    it('should signup and auto-login new user', () => {
      // Visit signup page and handle stale auth state
      cy.visitAuthPage('/signup');

      // Wait for page to stabilize (AuthProvider initialization)
      cy.get('[data-testid="signup-form"]').should('be.visible');

      // Fill signup form
      cy.get('[data-testid="signup-email-input"]').type('newuser@example.com');
      cy.get('[data-testid="signup-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-confirm-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-remember-me-checkbox"]').click();
      cy.get('[data-testid="signup-submit-btn"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // User should be authenticated
      cy.get('[data-testid="user-email-display"]').should('contain', 'newuser@example.com');
    });

    it('should show error when passwords do not match', () => {
      cy.visitAuthPage('/signup');

      cy.get('[data-testid="signup-email-input"]').type('newuser@example.com');
      cy.get('[data-testid="signup-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-confirm-password-input"]').type('DifferentPass123!');
      cy.get('[data-testid="signup-confirm-password-input"]').blur();

      // Should show password mismatch error
      cy.contains(/passwords.*don't match|passwords.*must match/i).should('be.visible');
    });

    it('should show error for already registered email', () => {
      cy.visitAuthPage('/signup');

      // Try to signup with existing user email
      cy.get('[data-testid="signup-email-input"]').type('test@example.com');
      cy.get('[data-testid="signup-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-confirm-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-submit-btn"]').click();

      // Should show error in toast
      cy.expectToast(/email.*already.*registered|user.*already.*exists/i);
    });

    it('should validate password strength requirements', () => {
      cy.visitAuthPage('/signup');

      cy.get('[data-testid="signup-email-input"]').type('newuser@example.com');

      // Test password without uppercase
      cy.get('[data-testid="signup-password-input"]').type('weakpass123');
      cy.get('[data-testid="signup-password-input"]').blur();
      cy.contains(/uppercase/i).should('be.visible');

      // Test password without lowercase
      cy.get('[data-testid="signup-password-input"]').clear().type('WEAKPASS123');
      cy.get('[data-testid="signup-password-input"]').blur();
      cy.contains(/lowercase/i).should('be.visible');

      // Test password without number
      cy.get('[data-testid="signup-password-input"]').clear().type('WeakPass');
      cy.get('[data-testid="signup-password-input"]').blur();
      cy.contains(/digit|number/i).should('be.visible');
    });
  });
});
