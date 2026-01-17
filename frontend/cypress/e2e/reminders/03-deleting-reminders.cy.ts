import { setupRemindersTest } from '../../support/setup/reminders-setup';

describe('Reminders Management', () => {
  beforeEach(() => {
    setupRemindersTest();
  });

  describe('Deleting Reminders', () => {
    beforeEach(() => {
      // Create a reminder for deletion tests
      cy.fixture('reminders.json').then((reminders) => {
        cy.createReminderAPI(reminders.validReminder);
      });
      cy.reload();
      cy.waitForRemindersTable();
    });

    it('should show confirmation dialog when deleting', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Click delete button
        cy.getReminderRow(reminder.title).within(() => {
          cy.get('[data-testid^="delete-reminder-btn-"]').click();
        });

        // Confirmation dialog should appear
        cy.contains('Are you absolutely sure?').should('be.visible');
        cy.contains(reminder.title).should('be.visible');
      });
    });

    it('should delete reminder successfully', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Click delete button
        cy.getReminderRow(reminder.title).within(() => {
          cy.get('[data-testid^="delete-reminder-btn-"]').click();
        });

        // Confirm deletion
        cy.get('[data-testid="delete-reminder-confirm-btn"]').click();

        // Should show success toast
        cy.expectToast(/deleted successfully/i);

        // Reminder should be removed from table
        cy.getReminderRow(reminder.title).should('not.exist');

        // Stats should update
        cy.get('[data-testid="stats-card-total"]').should('contain', '0');

        // Empty state should appear
        cy.get('[data-testid="empty-state"]').should('be.visible');
      });
    });

    it('should cancel deletion', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Click delete button
        cy.getReminderRow(reminder.title).within(() => {
          cy.get('[data-testid^="delete-reminder-btn-"]').click();
        });

        // Click cancel
        cy.get('[data-testid="delete-reminder-cancel-btn"]').click();

        // Reminder should still exist
        cy.getReminderRow(reminder.title).should('be.visible');

        // Stats should not change
        cy.get('[data-testid="stats-card-total"]').should('contain', '1');
      });
    });
  });
});
