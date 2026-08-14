describe('Prueba de inicio de sesion', () => {
  it('deberia dejar entrar al usuario Admin', () => {
    cy.visit('http://localhost:3000/login');

    cy.get(':nth-child(1) > .relative > .w-full').type('12345678A');

    cy.get('.space-y-6 > :nth-child(2) > .relative > .w-full').type('1234');

    cy.get('.btn-primary').click();

    cy.url().should('not.include', '/login');
  });
});