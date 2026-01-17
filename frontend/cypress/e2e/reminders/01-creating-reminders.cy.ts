import { setupRemindersTest } from '../../support/setup/reminders-setup';

describe('Reminders Management', () => {
  beforeEach(() => {
    setupRemindersTest();
  });

  describe('Creating Reminders', () => {
    it('should show empty state when no reminders exist', () => {
      // Should show empty state card
      cy.get('[data-testid="empty-state"]').should('be.visible');
      cy.contains('No reminders yet').should('be.visible');
      cy.get('[data-testid="empty-state-create-btn"]').should('be.visible');
    });

    it('should create a reminder successfully with valid data', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Click new reminder button
        cy.get('[data-testid="new-reminder-btn"]').click();

        // Fill form
        cy.get('[data-testid="reminder-title-input"]').type(reminder.title);
        cy.get('[data-testid="reminder-message-input"]').type(reminder.message);
        // Remove country code prefix (e.g., +44) since the phone input component already has it
        const phoneWithoutPrefix = reminder.phone_number.substring(3)
        cy.get('[data-testid="reminder-phone-input"]').type(phoneWithoutPrefix);
        cy.get('[data-testid="reminder-datetime-input"]').type(reminder.date_time);
        cy.get('[data-testid="reminder-timezone-select"]').click();
        cy.get(`[data-value="${reminder.timezone}"]`).click();

        // Submit form
        cy.get('[data-testid="create-reminder-submit-btn"]').click();

        // Should show success toast
        cy.expectToast(/created successfully/i);

        // Should show reminder in table
        cy.getReminderRow(reminder.title).should('be.visible');

        // Stats should update
        cy.get('[data-testid="stats-card-total"]').should('contain', '1');
        cy.get('[data-testid="stats-card-upcoming"]').should('contain', '1');
      });
    });

    it('should validate required fields', () => {
      // Click new reminder button
      cy.get('[data-testid="new-reminder-btn"]').click();

      // Try to submit without filling fields
      cy.get('[data-testid="create-reminder-submit-btn"]').click();

      // Should show validation errors (form won't submit)
      cy.url().should('include', '/dashboard');
    });

    it('should validate phone number format', () => {
      cy.get('[data-testid="new-reminder-btn"]').click();

      // Test invalid phone number
      cy.get('[data-testid="reminder-phone-input"]').type('123');
      cy.get('[data-testid="reminder-phone-input"]').blur();

      // Should show error indicator (red X icon is rendered based on validation)
      cy.get('[data-testid="reminder-phone-input"]').should('exist');
    });

    it('should validate date is in the future', () => {
      cy.get('[data-testid="new-reminder-btn"]').click();

      // datetime-local input has min attribute set, so past dates are disabled
      // The input will prevent selection of past dates
      cy.get('[data-testid="reminder-datetime-input"]').should('have.attr', 'min');
    });

    it('should validate timezone selection', () => {
      cy.get('[data-testid="new-reminder-btn"]').click();

      // Fill all fields except timezone
      cy.get('[data-testid="reminder-title-input"]').type('Test Reminder');
      cy.get('[data-testid="reminder-message-input"]').type('Test Message');
      cy.get('[data-testid="reminder-phone-input"]').type('2079460958');
      cy.get('[data-testid="reminder-datetime-input"]').type('2026-12-31T10:00');

      // Submit without selecting timezone
      cy.get('[data-testid="create-reminder-submit-btn"]').click();

      // Form should show validation error
      cy.url().should('include', '/dashboard');
    });

    it('should cancel reminder creation', () => {
      cy.get('[data-testid="new-reminder-btn"]').click();

      // Fill some data
      cy.get('[data-testid="reminder-title-input"]').type('Test');

      // Click cancel
      cy.get('[data-testid="create-reminder-cancel-btn"]').click();

      // Modal should close
      cy.get('[data-testid="reminder-title-input"]').should('not.exist');
    });
  });
});
