describe('Prueba de Check-in', () => {
    it('deberia hacer check-in de una reserva', () => {

        cy.visit('http://localhost:3000/login');
        cy.get(':nth-child(1) > .relative > .w-full').type('12345678B');
        cy.get('.space-y-6 > :nth-child(2) > .relative > .w-full').type('1234');
        cy.contains('button', 'Acceder').click();

        cy.url().should('not.include', '/login');

        cy.visit('http://localhost:3000/reservations');

        cy.get('[href="/checkin"] > .bg-white').click();
    });
});