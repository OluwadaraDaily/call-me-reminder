import { setupAuthTest } from '../../support/setup/auth-setup';

describe('Authentication Flow', () => {
  beforeEach(() => {
    setupAuthTest();
  });

  describe('UI Elements', () => {
    it('should have link to signup from login page', () => {
      cy.visit('/login');

      // Should have a link on "Sign up" text
      cy.contains('a', /sign up/i).should('be.visible').and('have.attr', 'href', '/signup');
      cy.contains('a', /sign up/i).click();

      // Should navigate to signup
      cy.url().should('include', '/signup');
    });

    it('should have link to login from signup page', () => {
      cy.visitAuthPage('/signup');

      // Should have a link on "Sign in" text
      cy.contains('a', /sign in/i).should('be.visible').and('have.attr', 'href', '/login');
      cy.contains('a', /sign in/i).click();

      // Should navigate to login
      cy.url().should('include', '/login');
    });

    it('should have link to forgot password', () => {
      cy.visit('/login');

      // Should have forgot password link
      cy.contains(/forgot.*password/i).should('be.visible');
    });
  });
});
