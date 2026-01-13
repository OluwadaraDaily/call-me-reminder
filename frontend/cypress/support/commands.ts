/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom commands here
      // Example: login(email: string, password: string): Chainable<void>
    }
  }
}

// Prevent TypeScript from reading file as legacy script
export {};
