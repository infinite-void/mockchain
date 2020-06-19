const Wallet = require('./index');
const Transaction = require('./transaction');
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

    describe('createTransaction()', () => {
        describe('amount exceeds the balance', () => {
            it('throws error', () => {
                expect(() => wallet.createTransaction({ amount: 1e7, recipient: 'foo-bar' }))
                .toThrow('Amount exceeds balance');
            });
        });

        describe('amount is valid', () => {
            let transaction, amount, recipient;

            beforeEach(() => {
                amount = 50;
                recipient = 'foo-bar';
                transaction = wallet.createTransaction({ amount, recipient });
            });

            it('create instances of `Transaction`', () => {
                expect(transaction instanceof Transaction).toBe(true);
            });

            it('matched with the transaction input with the wallet', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });

            it('outputs the amount to the recipient', () => {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            });
        });
    });
});