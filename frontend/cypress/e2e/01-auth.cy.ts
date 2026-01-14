describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and local storage
    cy.clearCookies();
    cy.clearLocalStorage();

    // Reset database to clean state
    cy.task('db:reset');

    // Create fresh test user
    cy.task('db:seed:user', {
      email: 'test@example.com',
      password: 'TestPass123!',
    }).as('testUser');
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

      // Should show error message
      cy.contains(/invalid.*credentials|incorrect.*password/i).should('be.visible');

      // Should stay on login page
      cy.url().should('include', '/login');
    });

    it('should handle remember me checkbox', () => {
      cy.visit('/login');

      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('TestPass123!');
      cy.get('[data-testid="remember-me-checkbox"]').check();
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

  describe('Signup', () => {
    it('should signup and auto-login new user', () => {
      cy.visit('/signup');

      // Fill signup form
      cy.get('[data-testid="signup-email-input"]').type('newuser@example.com');
      cy.get('[data-testid="signup-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-confirm-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-remember-me-checkbox"]').check();
      cy.get('[data-testid="signup-submit-btn"]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');

      // User should be authenticated
      cy.get('[data-testid="user-email-display"]').should('contain', 'newuser@example.com');
    });

    it('should show error when passwords do not match', () => {
      cy.visit('/signup');

      cy.get('[data-testid="signup-email-input"]').type('newuser@example.com');
      cy.get('[data-testid="signup-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-confirm-password-input"]').type('DifferentPass123!');
      cy.get('[data-testid="signup-confirm-password-input"]').blur();

      // Should show password mismatch error
      cy.contains(/passwords.*do not match|passwords.*must match/i).should('be.visible');
    });

    it('should show error for already registered email', () => {
      cy.visit('/signup');

      // Try to signup with existing user email
      cy.get('[data-testid="signup-email-input"]').type('test@example.com');
      cy.get('[data-testid="signup-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-confirm-password-input"]').type('NewPass123!');
      cy.get('[data-testid="signup-submit-btn"]').click();

      // Should show error
      cy.contains(/email.*already.*registered|user.*already.*exists/i).should('be.visible');
    });

    it('should validate password strength requirements', () => {
      cy.visit('/signup');

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

  describe('Logout', () => {
    it('should logout successfully', () => {
      // Login first
      cy.loginViaAPI('test@example.com', 'TestPass123!');
      cy.visit('/dashboard');

      // Verify we're on dashboard
      cy.url().should('include', '/dashboard');

      // Logout
      cy.logout();

      // Should redirect to homepage
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Cookies should be cleared
      cy.getCookie('access_token').should('not.exist');

      // Try to access dashboard - should redirect to login
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });

  describe('Protected Routes', () => {
    it('should protect dashboard route when not authenticated', () => {
      // Clear all cookies
      cy.clearCookies();

      // Try to visit dashboard
      cy.visit('/dashboard');

      // Should redirect to login with return URL
      cy.url().should('include', '/login');
      cy.url().should('include', 'from=/dashboard');
    });

    it('should redirect to intended page after login', () => {
      // Clear cookies
      cy.clearCookies();

      // Try to visit dashboard (will redirect to login)
      cy.visit('/dashboard');

      // Should be on login page with return URL
      cy.url().should('include', '/login');
      cy.url().should('include', 'from=/dashboard');

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

  describe('Token Refresh', () => {
    it('should handle token refresh automatically', () => {
      cy.loginViaAPI('test@example.com', 'TestPass123!');
      cy.visit('/dashboard');

      // Simulate 401 error by intercepting API call
      let requestCount = 0;
      cy.intercept('GET', '/api/v1/reminders/stats', (req) => {
        requestCount++;
        if (requestCount === 1) {
          // First request fails with 401
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

  describe('UI Elements', () => {
    it('should have link to signup from login page', () => {
      cy.visit('/login');

      // Should have link to signup
      cy.contains(/don't have an account|sign up/i).should('be.visible');
      cy.contains(/don't have an account|sign up/i).click();

      // Should navigate to signup
      cy.url().should('include', '/signup');
    });

    it('should have link to login from signup page', () => {
      cy.visit('/signup');

      // Should have link to login
      cy.contains(/already have an account|log in|sign in/i).should('be.visible');
      cy.contains(/already have an account|log in|sign in/i).click();

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
