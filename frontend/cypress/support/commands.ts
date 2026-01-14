/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      login(email: string, password: string, rememberMe?: boolean): Chainable<void>;
      loginViaAPI(email: string, password: string, rememberMe?: boolean): Chainable<void>;
      logout(): Chainable<void>;
      checkAuthenticated(): Chainable<void>;
      visitAuthPage(url: string): Chainable<void>;

      // Reminder commands
      createReminderAPI(data: ReminderCreate): Chainable<number>;
      seedReminders(reminders: ReminderCreate[]): Chainable<number[]>;
      cleanupReminders(userId: number): Chainable<void>;
      updateReminderStatus(id: number, status: 'scheduled' | 'completed' | 'failed'): Chainable<void>;

      // Utility commands
      waitForStats(): Chainable<void>;
      waitForRemindersTable(): Chainable<void>;
      getReminderRow(title: string): Chainable<JQuery<HTMLElement>>;
      expectToast(message: string | RegExp, type?: 'success' | 'error' | 'warning' | 'info'): Chainable<void>;
    }
  }
}

interface ReminderCreate {
  title: string;
  message: string;
  phone_number: string;
  date_time: string;
  timezone: string;
}

// ============================================
// Authentication Commands
// ============================================

/**
 * Login via UI (for testing auth flow)
 */
Cypress.Commands.add('login', (email: string, password: string, rememberMe: boolean = false) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);

  if (rememberMe) {
    cy.get('[data-testid="remember-me-checkbox"]').check();
  }

  cy.get('[data-testid="login-submit-btn"]').click();
});

/**
 * Login via API (faster for test setup)
 */
Cypress.Commands.add('loginViaAPI', (email: string, password: string, rememberMe: boolean = false) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:8000/api/v1/auth/login',
    headers: {
      'Origin': 'http://localhost:3001',
    },
    body: {
      email,
      password,
      remember_me: rememberMe,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    // Cookies are automatically set by Cypress
  });
});

/**
 * Logout via UI
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-dropdown"]').click();
  cy.get('[data-testid="logout-btn"]').click();
});

/**
 * Check if user is authenticated
 */
Cypress.Commands.add('checkAuthenticated', () => {
  cy.request({
    method: 'GET',
    url: 'http://localhost:8000/api/v1/users/me',
    headers: {
      'Origin': 'http://localhost:3001',
    },
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('email');
  });
});

/**
 * Visit an auth page (login/signup) and ensure no stale auth state causes redirects
 */
Cypress.Commands.add('visitAuthPage', (url: string) => {
  // Ensure all cookies are truly cleared
  cy.clearAllCookies();

  // Track whether initial auth check is complete
  let initialAuthCheckDone = false;

  // Intercept auth endpoints to prevent stale cookie issues - only for initial check
  cy.intercept('GET', '/api/v1/users/me', (req) => {
    if (!initialAuthCheckDone) {
      // Strip cookies only for the initial auth check to ensure clean state
      delete req.headers.cookie;
      delete req.headers.Cookie;
      initialAuthCheckDone = true;
    }
    req.continue();
  }).as('authCheck');

  cy.visit(url);
});

// ============================================
// Reminder Commands
// ============================================

/**
 * Create a reminder via API
 */
Cypress.Commands.add('createReminderAPI', (data: ReminderCreate) => {
  return cy.request({
    method: 'POST',
    url: 'http://localhost:8000/api/v1/reminders',
    headers: {
      'Origin': 'http://localhost:3001',
    },
    body: data,
    withCredentials: true,
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body.id;
  });
});

/**
 * Create multiple reminders via API
 */
Cypress.Commands.add('seedReminders', (reminders: ReminderCreate[]) => {
  const reminderIds: number[] = [];

  reminders.forEach((reminder) => {
    cy.createReminderAPI(reminder).then((id) => {
      reminderIds.push(id);
    });
  });

  return cy.wrap(reminderIds);
});

/**
 * Cleanup reminders for a user via database task
 */
Cypress.Commands.add('cleanupReminders', (userId: number) => {
  cy.task('db:cleanup:reminders', { userId });
});

/**
 * Update reminder status via database task
 */
Cypress.Commands.add('updateReminderStatus', (id: number, status: 'scheduled' | 'completed' | 'failed') => {
  cy.task('db:update:status', { reminderId: id, status });
});

// ============================================
// Utility Commands
// ============================================

/**
 * Wait for stats cards to load
 */
Cypress.Commands.add('waitForStats', () => {
  cy.intercept('GET', '/api/v1/reminders/stats').as('getStats');
  cy.wait('@getStats');
  cy.get('[data-testid="stats-card-total"]').should('be.visible');
});

/**
 * Wait for reminders table to load
 */
Cypress.Commands.add('waitForRemindersTable', () => {
  cy.intercept('GET', '/api/v1/reminders?*').as('getReminders');
  cy.wait('@getReminders');
  cy.get('[data-testid="reminders-table"]').should('be.visible');
});

/**
 * Get a reminder row by title
 */
Cypress.Commands.add('getReminderRow', (title: string) => {
  return cy.contains('[data-testid^="reminder-row-"]', title);
});

/**
 * Wait for and verify a toast message appears
 */
Cypress.Commands.add('expectToast', (message: string | RegExp, _type?: 'success' | 'error' | 'warning' | 'info') => {
  // Sonner renders toasts in an ol element with data-sonner-toaster attribute
  const toastSelector = '[data-sonner-toaster]';

  // Wait for the toast container to exist
  cy.get(toastSelector, { timeout: 10000 }).should('exist');

  // Check for the message in the toast
  if (typeof message === 'string') {
    cy.get(toastSelector).should('contain', message);
  } else {
    cy.get(toastSelector).contains(message).should('exist');
  }
});

// Prevent TypeScript from reading file as legacy script
export {};
