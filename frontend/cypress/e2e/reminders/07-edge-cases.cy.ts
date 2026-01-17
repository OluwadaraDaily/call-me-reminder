import { setupRemindersTest } from '../../support/setup/reminders-setup';

describe('Reminders Management', () => {
  beforeEach(() => {
    setupRemindersTest();
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle empty search results', () => {
      cy.fixture('reminders.json').then((reminders) => {
        cy.createReminderAPI(reminders.validReminder);
      });
      cy.reload();
      cy.waitForRemindersTable();

      // Search for non-existent reminder
      cy.get('[data-testid="search-input"]').type('XYZ123NonExistent');
      cy.wait(600);

      // Should show no results message
      cy.get('[data-testid="no-filtered-reminders"]').should('be.visible');
      cy.contains('No reminders match your current filters').should('be.visible');

      // Stats should still show total count
      cy.get('[data-testid="stats-card-total"]').should('contain', '1');
    });

    it('should handle rapid filter changes', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;
        cy.createReminderAPI({ ...reminder, title: 'Scheduled' });
        cy.createReminderAPI({ ...reminder, title: 'Completed' }).then((id) => {
          cy.updateReminderStatus(id, 'completed');
        });
      });
      cy.reload();
      cy.waitForRemindersTable();

      // Rapidly switch filters
      cy.get('[data-testid="filter-tab-scheduled"]').click();
      cy.get('[data-testid="filter-tab-completed"]').click();
      cy.get('[data-testid="filter-tab-all"]').click();

      // Should show all reminders
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 2);
    });

    it('should handle rapid pagination clicks', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;
        for (let i = 0; i < 15; i++) {
          cy.createReminderAPI({ ...reminder, title: `Reminder ${i + 1}` });
        }
      });
      cy.reload();
      cy.waitForRemindersTable();

      // Rapidly click next/previous
      cy.get('[data-testid="pagination-next-btn"]').click();
      cy.get('[data-testid="pagination-prev-btn"]').click();
      cy.get('[data-testid="pagination-next-btn"]').click();

      // Should be on page 2
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 2');
    });

    it('should handle search debouncing correctly', () => {
      cy.fixture('reminders.json').then((reminders) => {
        cy.createReminderAPI({ ...reminders.validReminder, title: 'Test Reminder' });
      });
      cy.reload();
      cy.waitForRemindersTable();

      // Type rapidly
      cy.get('[data-testid="search-input"]').type('T');
      cy.get('[data-testid="search-input"]').type('e');
      cy.get('[data-testid="search-input"]').type('s');
      cy.get('[data-testid="search-input"]').type('t');

      // Wait for debounce
      cy.wait(600);

      // Should show search results
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 1);
    });

    it('should clear search when cleared', () => {
      cy.fixture('reminders.json').then((reminders) => {
        cy.createReminderAPI({ ...reminders.validReminder, title: 'Test 1' });
        cy.createReminderAPI({ ...reminders.validReminder, title: 'Test 2' });
      });
      cy.reload();
      cy.waitForRemindersTable();

      // Search
      cy.get('[data-testid="search-input"]').type('Test 1');
      cy.wait(600);
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 1);

      // Clear search
      cy.get('[data-testid="search-input"]').clear();
      cy.wait(600);

      // Should show all results
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 2);
    });

    it('should maintain filter when creating new reminder', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;
        cy.createReminderAPI({ ...reminder, title: 'Existing Scheduled' });
        cy.createReminderAPI({ ...reminder, title: 'Existing Completed' }).then((id) => {
          cy.updateReminderStatus(id, 'completed');
        });
      });
      cy.reload();
      cy.waitForRemindersTable();

      // Filter by scheduled
      cy.get('[data-testid="filter-tab-scheduled"]').click();
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 1);

      // Create new reminder (will be scheduled by default)
      cy.get('[data-testid="new-reminder-btn"]').click();
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;
        const phoneWithoutPrefix = reminder.phone_number.substring(3);
        cy.get('[data-testid="reminder-title-input"]').type('New Scheduled');
        cy.get('[data-testid="reminder-message-input"]').type(reminder.message);
        cy.get('[data-testid="reminder-phone-input"]').type(phoneWithoutPrefix);
        cy.get('[data-testid="reminder-datetime-input"]').type(reminder.date_time);
        cy.get('[data-testid="reminder-timezone-select"]').click();
        cy.get(`[data-value="${reminder.timezone}"]`).click();
      });
      cy.get('[data-testid="create-reminder-submit-btn"]').click();

      // Wait for success
      cy.expectToast(/created successfully/i);

      // Should still show scheduled filter active
      cy.get('[data-testid="filter-tab-scheduled"]').should('have.attr', 'data-state', 'active');

      // Should now show 2 scheduled reminders
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 2);
    });

    it('should handle viewing last item on a page after deletion', () => {
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;
        // Create exactly 11 reminders (will fill 2 pages with page size 10)
        for (let i = 0; i < 11; i++) {
          cy.createReminderAPI({ ...reminder, title: `Reminder ${i + 1}` });
        }
      });
      cy.reload();
      cy.waitForRemindersTable();

      // Go to page 2 (which has only 1 item)
      cy.get('[data-testid="pagination-next-btn"]').click();
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 2 of 2');
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 1);

      // Delete the only item on page 2
      cy.get('[data-testid^="reminder-row-"]').first().within(() => {
        cy.get('[data-testid^="delete-reminder-btn-"]').click();
      });
      cy.get('[data-testid="delete-reminder-confirm-btn"]').click();

      // Wait for deletion
      cy.expectToast(/deleted successfully/i);

      // Should automatically go back to page 1
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1 of 1');
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 10);
    });
  });
});
