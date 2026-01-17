import { setupRemindersTest } from '../../support/setup/reminders-setup';

describe('Reminders Management', () => {
  beforeEach(() => {
    setupRemindersTest();
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Create enough reminders to test pagination (11 reminders for default page size of 10)
      cy.fixture('reminders.json').then((reminders) => {
        const reminder = reminders.validReminder;

        // Create 11 reminders
        for (let i = 0; i < 11; i++) {
          cy.createReminderAPI({
            ...reminder,
            title: `${reminder.title} ${i + 1}`,
          });
        }
      });
      cy.reload();
      cy.waitForRemindersTable();
    });

    it('should show pagination controls when there are more items than page size', () => {
      // Pagination controls should be visible
      cy.get('[data-testid="pagination-prev-btn"]').should('be.visible');
      cy.get('[data-testid="pagination-next-btn"]').should('be.visible');
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1 of 2');
    });

    it('should navigate to next page', () => {
      // Click next page
      cy.get('[data-testid="pagination-next-btn"]').click();

      // Should show page 2
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 2 of 2');

      // Previous button should be enabled
      cy.get('[data-testid="pagination-prev-btn"]').should('not.be.disabled');

      // Next button should be disabled (last page)
      cy.get('[data-testid="pagination-next-btn"]').should('be.disabled');
    });

    it('should navigate to previous page', () => {
      // Go to page 2
      cy.get('[data-testid="pagination-next-btn"]').click();
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 2 of 2');

      // Click previous page
      cy.get('[data-testid="pagination-prev-btn"]').click();

      // Should show page 1
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1 of 2');

      // Previous button should be disabled (first page)
      cy.get('[data-testid="pagination-prev-btn"]').should('be.disabled');
    });

    it('should change page size to 5', () => {
      // Change page size
      cy.get('[data-testid="page-size-select"]').click();
      cy.get('[data-testid="page-size-option-5"]').click();

      // Should show page 1 of 3 (11 items / 5 per page)
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1 of 3');

      // Should show 5 rows
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 5);
    });

    it('should change page size to 20', () => {
      // Change page size
      cy.get('[data-testid="page-size-select"]').click();
      cy.get('[data-testid="page-size-option-20"]').click();

      // Should show page 1 of 1 (11 items fit on one page)
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1 of 1');

      // Should show all 11 rows
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 11);

      // Both navigation buttons should be disabled
      cy.get('[data-testid="pagination-prev-btn"]').should('be.disabled');
      cy.get('[data-testid="pagination-next-btn"]').should('be.disabled');
    });

    it('should change page size to 50', () => {
      // Change page size
      cy.get('[data-testid="page-size-select"]').click();
      cy.get('[data-testid="page-size-option-50"]').click();

      // Should show all items on one page
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1 of 1');
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 11);
    });

    it('should change page size to 100', () => {
      // Change page size
      cy.get('[data-testid="page-size-select"]').click();
      cy.get('[data-testid="page-size-option-100"]').click();

      // Should show all items on one page
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1 of 1');
      cy.get('[data-testid^="reminder-row-"]').should('have.length', 11);
    });

    it('should reset to page 1 when changing page size', () => {
      // Go to page 2
      cy.get('[data-testid="pagination-next-btn"]').click();
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 2 of 2');

      // Change page size
      cy.get('[data-testid="page-size-select"]').click();
      cy.get('[data-testid="page-size-option-5"]').click();

      // Should reset to page 1
      cy.get('[data-testid="pagination-info"]').should('contain', 'Page 1 of 3');
    });
  });
});
