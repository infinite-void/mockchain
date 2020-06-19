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

    describe('validTransaction()', () => {
        let errorMock;
        beforeEach(() => {
            errorMock = jest.fn();
            global.console.error = errorMock;
        });

        describe('Transaction is valid', () => {
            it('returns true', () => {
                expect(Transaction.validTransaction(transaction)).toBe(true);
            });
        });

        describe('Transaction is invalid', () => {
            describe('outputMap is invalid', () => {
                it('returns false and logs error', () => {
                    transaction.outputMap[senderWallet.publicKey] = NaN;
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('signature is invalid', () => {
                it('returns false and logs error', () => {
                    transaction.input.signature = new Wallet().sign('foo-bar');
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });
    });

    describe('update()', () => {
        let originalSignature, originalSenderOutput, nextAmount, nextRecipient;

        describe('the transaction is invalid', () => {
            it('throws an error', () => {
                expect(() => {
                    transaction.update({
                        senderWallet,
                        amount: 999999,
                        recipient: 'foo-bar'
                    })
                }).toThrow('Amount exceeds balance');
            });
        });
        describe('the update is valid', () => {
            beforeEach(() => {
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                originalSignature = transaction.input.signature;
                nextAmount = 50;
                nextRecipient = 'next-recipient'

                transaction.update({
                    senderWallet,
                    recipient: nextRecipient,
                    amount: nextAmount
                })
            });

            it('outputs the amount to the next recipient', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });

            it('subtracts the amount for the sender output amount', () => {
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);
            });

            it('maintains the total output amount to match the input', () => {
                expect(
                    Object.values(transaction.outputMap).reduce((total, outputAmount) => total += outputAmount)
                ).toEqual(transaction.input.amount);
            });

            it('re-signs the transaction', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            describe('add transaction where recipient is already present in `outputMap`', () => {
                let addedAmount;
                beforeEach(() => {
                    addedAmount = 80;
                    transaction.update({
                        senderWallet,
                        recipient: nextRecipient,
                        amount: addedAmount
                    });
                });

                it('verify `outputMap` is amount is added to `nextRecipient`', () => {
                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount + addedAmount);
                });

                it('verify `outputMap` is amount is deducted from `senderWallet`', () => {
                    expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount - addedAmount);
                });
            });
        }); 
    });
        
});
