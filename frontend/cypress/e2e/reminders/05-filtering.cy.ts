import { setupRemindersTest } from '../../support/setup/reminders-setup';

describe('Reminders Management', () => {
  beforeEach(() => {
    setupRemindersTest();
  });

  describe('Filtering', () => {
    beforeEach(() => {
      // Create reminders with different statuses
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Create 3 scheduled reminders
        for (let i = 0; i < 3; i++) {
          cy.createReminderAPI({
            ...reminder,
            title: `Scheduled ${i + 1}`,
          }).then((id) => {
            // Reminders are scheduled by default
          });
        }

        // Create 2 completed reminders
        for (let i = 0; i < 2; i++) {
          cy.createReminderAPI({
            ...reminder,
            title: `Completed ${i + 1}`,
          }).then((id) => {
            cy.updateReminderStatus(id, 'completed');
          });
        }

        // Create 1 failed reminder
        cy.createReminderAPI({
          ...reminder,
          title: 'Failed 1',
        }).then((id) => {
          cy.updateReminderStatus(id, 'failed');
        });
      });
      cy.reload();
    });

    it('should show all reminders by default', () => {
      // All filter should be active
      cy.get('[data-testid="filter-tab-all"]').should('have.attr', 'data-state', 'active');

      // Should show all 6 reminders
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 6);
    });

    it('should filter by scheduled status', () => {
      // Click scheduled filter
      cy.get('[data-testid="filter-tab-scheduled"]').click();

      // Should show only 3 scheduled reminders
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 3);
      cy.contains('Scheduled 1').should('be.visible');
      cy.contains('Scheduled 2').should('be.visible');
      cy.contains('Scheduled 3').should('be.visible');
    });

    it('should filter by completed status', () => {
      // Click completed filter
      cy.get('[data-testid="filter-tab-completed"]').click();

      // Should show only 2 completed reminders
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 2);
      cy.contains('Completed 1').should('be.visible');
      cy.contains('Completed 2').should('be.visible');
    });

    it('should filter by failed status', () => {
      // Click failed filter
      cy.get('[data-testid="filter-tab-failed"]').click();

      // Should show only 1 failed reminder
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 1);
      cy.contains('Failed 1').should('be.visible');
    });

    it('should search by title', () => {
      // Search for "Completed"
      cy.get('[data-testid="search-input"]').type('Completed');

      // Wait for debounce
      cy.wait(600);

      // Should show only completed reminders
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 2);
      cy.contains('Completed 1').should('be.visible');
      cy.contains('Completed 2').should('be.visible');
    });

    it('should search by partial title', () => {
      // Search for "Sched"
      cy.get('[data-testid="search-input"]').type('Sched');

      // Wait for debounce
      cy.wait(600);

      // Should show scheduled reminders
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 3);
    });

    it('should combine status filter and search', () => {
      // Filter by scheduled status
      cy.get('[data-testid="filter-tab-scheduled"]').click();
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 3);

      // Search for "Scheduled 1"
      cy.get('[data-testid="search-input"]').type('Scheduled 1');

      // Wait for debounce
      cy.wait(600);

      // Should show only 1 result
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 1);
      cy.contains('Scheduled 1').should('be.visible');
    });

    it('should show no results message when filter returns empty', () => {
      // Search for non-existent reminder
      cy.get('[data-testid="search-input"]').type('NonExistent');

      // Wait for debounce
      cy.wait(600);

      // Should show no results message
      cy.get('[data-testid="no-filtered-reminders"]').should('be.visible');
      cy.contains('No reminders match your current filters').should('be.visible');
    });

    it('should reset to page 1 when changing filter', () => {
      // Create enough reminders to have multiple pages
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;
        for (let i = 0; i < 10; i++) {
          cy.createReminderAPI({
            ...reminder,
            title: `Extra Scheduled ${i + 1}`,
          });
        }
      });
      cy.reload();
      cy.waitForRemindersTable();

      // Go to page 2
      cy.get('[data-testid="pagination-next-btn"]').click();
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 2');

      // Change filter
      cy.get('[data-testid="filter-tab-completed"]').click();

      // Should reset to page 1
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1');
    });

    it('should reset to page 1 when searching', () => {
      // Create enough reminders to have multiple pages
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;
        for (let i = 0; i < 10; i++) {
          cy.createReminderAPI({
            ...reminder,
            title: `Search Test ${i + 1}`,
          });
        }
      });
      cy.reload();
      cy.waitForRemindersTable();

      // Go to page 2
      cy.get('[data-testid="pagination-next-btn"]').click();
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 2');

      // Search
      cy.get('[data-testid="search-input"]').type('Search');
      cy.wait(600);

      // Should reset to page 1
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1');
    });
  });
});
