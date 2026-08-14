describe('Prueba del Gestor', () => {
    it('deberia iniciar sesion como admin y ver el panel', () => {

        cy.visit('http://localhost:3000/login');
        cy.get(':nth-child(1) > .relative > .w-full').type('12345678A');
        cy.get('.space-y-6 > :nth-child(2) > .relative > .w-full').type('1234');
        cy.contains('button', 'Acceder').click();

        cy.url().should('not.include', '/login');

        cy.visit('http://localhost:3000/admin/dashboard');

        cy.get('.mt-8 > :nth-child(2)').click();

        cy.contains('Cápsula');
    });
});