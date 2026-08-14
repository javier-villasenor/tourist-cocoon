describe('Prueba de Boton Salir', () => {
    it('deberia pulsar el boton salir y volver al inicio', () => {

        cy.visit('http://localhost:3000/login');
        cy.get(':nth-child(1) > .relative > .w-full').type('12345678B');
        cy.get('.space-y-6 > :nth-child(2) > .relative > .w-full').type('1234');
        cy.contains('button', 'Acceder').click();

        cy.url().should('not.include', '/login');

        cy.contains('button', 'Salir').click();

        cy.url().should('include', '/login');
    });
});