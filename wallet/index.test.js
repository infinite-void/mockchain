const Wallet = require('./index');

describe('Wallet', () => {
    let wallet;

    beforeEach(() => {
        wallet = new Wallet();
    });

    describe('Wallet()', () => {
        it('has `balance`', () => {
            expect(wallet).toHaveProperty('balance');
        });

        it('has `publicKey`', () => {
            expect(wallet).toHaveProperty('publicKey'); 
        });
    });
});