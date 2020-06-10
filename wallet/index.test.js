const Wallet = require('./index');
const { verifySignature } = require('../utils');

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

    describe('signing data', () => {
        const data = 'foo-bar';

        it('verifies a signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: wallet.sign(data)
                })
            ).toBe(true);
        });

        it('does not verify a invalid signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: new Wallet().sign(data)
                })
            ).toBe(false);
        });
    });
});