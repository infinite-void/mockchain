const Wallet = require('./index');
const Transaction = require('./transaction');
const Blockchain = require('../blockchain');
const { verifySignature } = require('../utils');
const { STARTING_BALANCE } = require('../config');
const { rand } = require('elliptic');

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

        describe('chain is passed along', () => {
            it('Wallet.calculateBalance() should have called', () => {
                const calculateBalanceMock = jest.fn();
                const originalCalculateBalance = Wallet.calculateBalance;
                Wallet.calculateBalance = calculateBalanceMock;

                wallet.createTransaction({
                    recipient: 'foo-recipient',
                    amount: 100,
                    chain: new Blockchain().chain
                });
                expect(calculateBalanceMock).toHaveBeenCalled();
                Wallet.calculateBalance = originalCalculateBalance;
            });     
        });
    });

    describe('calculateBalance()', () => {
        let blockchain;

        beforeEach(() => {
            blockchain = new Blockchain();
        });

        describe('when no output exists for the wallet', () => {
            it('balance equals `STARTING_BALANCE`', () => {
                expect(Wallet.calculateBalance({
                    chain: blockchain.chain,
                    address: wallet.publicKey
                })).toEqual(STARTING_BALANCE);
            });
        });

        describe('when output exists for the wallet', () => {
            let transactions = [];
            let expectedBalance = STARTING_BALANCE;

            beforeEach(() => {
                for(let i = 0; i < 10; i++) {
                    let randomAmount = Math.ceil(Math.random() * 100);
                    transactions.push(new Wallet().createTransaction({
                        recipient: wallet.publicKey,
                        amount: randomAmount
                    }));
                    expectedBalance += randomAmount;
                }
                blockchain.addBlock({ data: transactions });
            });

            it('balance must be equal to output balance', () => {
                expect(Wallet.calculateBalance({
                    chain: blockchain.chain,
                    address: wallet.publicKey
                })).toEqual(expectedBalance);
            });

            describe('when wallet makes a transaction', () => {
                let sendingTransaction;
                beforeEach(() => {
                    sendingTransaction = wallet.createTransaction({
                        recipient: 'foo-bar',
                        amount: 50,
                        chain: blockchain.chain
                    });
                    blockchain.addBlock({ data: [sendingTransaction] });
                });

                it('returns output amount of sendingTransaction', () => {
                    expect(Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })).toEqual(sendingTransaction.outputMap[wallet.publicKey]);
                });

                describe('checks for balance after sameBlock and nextBlock transactions', () => {
                    let sameBlockTransaction, nextBlockTransaction;
                    beforeEach(() => {
                        sendingTransaction = wallet.createTransaction({
                            recipient: 'foo-bar',
                            amount: 30
                        });
                        sameBlockTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
                        blockchain.addBlock({ data: [sendingTransaction, sameBlockTransaction] });

                        nextBlockTransaction = new Wallet().createTransaction({
                            recipient: wallet.publicKey,
                            amount: 70
                        });
                        blockchain.addBlock({ data: [nextBlockTransaction] });
                    });

                    it('return sum of outputs', () => {
                        expect(Wallet.calculateBalance({
                            chain: blockchain.chain,
                            address: wallet.publicKey
                        })).toEqual(
                            sendingTransaction.outputMap[wallet.publicKey] +
                            sameBlockTransaction.outputMap[wallet.publicKey] +
                            nextBlockTransaction.outputMap[wallet.publicKey]
                        );       
                    });
                });
            });
        });
    });
});