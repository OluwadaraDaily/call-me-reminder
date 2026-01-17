import { setupRemindersTest } from '../../support/setup/reminders-setup';

describe('Reminders Management', () => {
  beforeEach(() => {
    setupRemindersTest();
  });

  describe('Stats Verification', () => {
    it('should show correct stats for 0 reminders', () => {
      cy.get('[data-testid="stats-card-total"]').should('contain', '0');
      cy.get('[data-testid="stats-card-upcoming"]').should('contain', '0');
      cy.get('[data-testid="stats-card-completed"]').should('contain', '0');
    });

    it('should update stats when creating reminders', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Create first reminder
        cy.createReminderAPI(reminder);
        cy.reload();
        cy.waitForStats();

        cy.get('[data-testid="stats-card-total"]').should('contain', '1');
        cy.get('[data-testid="stats-card-upcoming"]').should('contain', '1');
        cy.get('[data-testid="stats-card-completed"]').should('contain', '0');

        // Create second reminder
        cy.createReminderAPI({ ...reminder, title: 'Second Reminder' });
        cy.reload();
        cy.waitForStats();

        cy.get('[data-testid="stats-card-total"]').should('contain', '2');
        cy.get('[data-testid="stats-card-upcoming"]').should('contain', '2');
      });
    });

    it('should show correct stats for different statuses', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Create 5 scheduled
        for (let i = 0; i < 5; i++) {
          cy.createReminderAPI({ ...reminder, title: `Scheduled ${i + 1}` });
        }

        // Create 3 completed
        for (let i = 0; i < 3; i++) {
          cy.createReminderAPI({ ...reminder, title: `Completed ${i + 1}` }).then((id) => {
            cy.updateReminderStatus(id, 'completed');
          });
        }

        // Create 2 failed
        for (let i = 0; i < 2; i++) {
          cy.createReminderAPI({ ...reminder, title: `Failed ${i + 1}` }).then((id) => {
            cy.updateReminderStatus(id, 'failed');
          });
        }

        cy.reload();
        cy.waitForStats();

        // Total should be 10 (5 + 3 + 2)
        cy.get('[data-testid="stats-card-total"]').should('contain', '10');

        // Upcoming should be 5 (only scheduled)
        cy.get('[data-testid="stats-card-upcoming"]').should('contain', '5');

        // Completed should be 3
        cy.get('[data-testid="stats-card-completed"]').should('contain', '3');
      });
    });

    it('should update stats after deleting reminder', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Create 2 reminders
        cy.createReminderAPI(reminder);
        cy.createReminderAPI({ ...reminder, title: 'Second Reminder' });
        cy.reload();
        cy.waitForRemindersTable();

        // Verify initial stats
        cy.get('[data-testid="stats-card-total"]').should('contain', '2');

        // Delete one reminder
        cy.getReminderRow(reminder.title).within(() => {
          cy.get('[data-testid^="delete-reminder-btn-"]').click();
        });
        cy.get('[data-testid="delete-reminder-confirm-btn"]').click();

        // Wait for deletion
        cy.expectToast(/deleted successfully/i);

        // Stats should update
        cy.get('[data-testid="stats-card-total"]').should('contain', '1');
        cy.get('[data-testid="stats-card-upcoming"]').should('contain', '1');
      });
    });
  });
});
