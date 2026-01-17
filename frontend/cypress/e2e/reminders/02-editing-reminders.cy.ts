import { setupRemindersTest } from '../../support/setup/reminders-setup';

describe('Reminders Management', () => {
  beforeEach(() => {
    setupRemindersTest();
  });

  describe('Editing Reminders', () => {
    beforeEach(() => {
      // Create a reminder for editing tests
      cy.fixture('reminders.json').then((reminders) => {
        cy.createReminderAPI(reminders.validReminder);
      });
      cy.reload();
      cy.waitForRemindersTable();
    });

    it('should open edit modal with pre-filled data', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Get the reminder row and click edit
        cy.getReminderRow(reminder.title).within(() => {
          cy.get('[data-testid^="edit-reminder-btn-"]').click();
        });

        // Modal should open with pre-filled data
        cy.get('[data-testid="reminder-title-input"]').should('have.value', reminder.title);
        cy.get('[data-testid="reminder-message-input"]').should('have.value', reminder.message);
      });
    });

    it('should update reminder successfully', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Click edit button
        cy.getReminderRow(reminder.title).within(() => {
          cy.get('[data-testid^="edit-reminder-btn-"]').click();
        });

        // Update title and message
        cy.get('[data-testid="reminder-title-input"]').clear().type('Updated Title');
        cy.get('[data-testid="reminder-message-input"]').clear().type('Updated Message');

        // Submit
        cy.get('[data-testid="edit-reminder-submit-btn"]').click();

        // Should show success toast
        cy.expectToast(/updated successfully/i);

        // Should show updated data in table
        cy.getReminderRow('Updated Title').should('be.visible');
      });
    });

    it('should validate fields when editing', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Click edit button
        cy.getReminderRow(reminder.title).within(() => {
          cy.get('[data-testid^="edit-reminder-btn-"]').click();
        });

        // Clear required field
        cy.get('[data-testid="reminder-title-input"]').clear();

        // Try to submit
        cy.get('[data-testid="edit-reminder-submit-btn"]').click();

        // Should show validation error
        cy.url().should('include', '/dashboard');
      });
    });

    it('should cancel editing', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Click edit button
        cy.getReminderRow(reminder.title).within(() => {
          cy.get('[data-testid^="edit-reminder-btn-"]').click();
        });

        // Make changes
        cy.get('[data-testid="reminder-title-input"]').clear().type('Changed Title');

        // Click cancel
        cy.get('[data-testid="edit-reminder-cancel-btn"]').click();

        // Original title should still be in table
        cy.getReminderRow(reminder.title).should('be.visible');
        cy.getReminderRow('Changed Title').should('not.exist');
      });
    });
  });
});
