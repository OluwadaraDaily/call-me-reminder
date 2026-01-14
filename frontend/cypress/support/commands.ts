/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      login(email: string, password: string, rememberMe?: boolean): Chainable<void>;
      loginViaAPI(email: string, password: string, rememberMe?: boolean): Chainable<void>;
      logout(): Chainable<void>;
      checkAuthenticated(): Chainable<void>;

      // Reminder commands
      createReminderAPI(data: ReminderCreate): Chainable<number>;
      seedReminders(reminders: ReminderCreate[]): Chainable<number[]>;
      cleanupReminders(userId: number): Chainable<void>;
      updateReminderStatus(id: number, status: 'scheduled' | 'completed' | 'failed'): Chainable<void>;

      // Utility commands
      waitForStats(): Chainable<void>;
      waitForRemindersTable(): Chainable<void>;
      getReminderRow(title: string): Chainable<JQuery<HTMLElement>>;
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
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('email');
  });
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
    body: data,
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

// Prevent TypeScript from reading file as legacy script
export {};
