const Transaction = require('./transaction');
const Wallet = require('./index');
const { verifySignature } = require('../utils');

describe('Transaction', () => {
    let transaction, senderWallet, recipient, amount;

    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key';
        amount = 50;

        transaction = new Transaction({ senderWallet, recipient, amount });
    });

    describe('transaction()', () => {
        it('has an `id`', () => {
            expect(transaction).toHaveProperty('id');
        });
    });

    describe('outputMap', () => {
        it('has outputMap', () => {
            expect(transaction).toHaveProperty('outputMap');
        });

        it('outputs amount to recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });

        it('outputs the remaining balance in `senderWallet`', () => {
            expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
        });
    });

    describe('input', () => {
        it('should have `input`', () => {
            expect(transaction).toHaveProperty('input');
        });

        it('should have `timestamp`', () => {
            expect(transaction.input).toHaveProperty('timestamp');
        });

        it('set `amount` to `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it('set the `address` to the senderWallet `publicKey`', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it('signs the input', () => {
            expect(
                verifySignature({ 
                    publicKey: senderWallet.publicKey, 
                    data: transaction.outputMap, 
                    signature: transaction.input.signature 
                }) 
            ).toBe(true);
        });
    });
});
