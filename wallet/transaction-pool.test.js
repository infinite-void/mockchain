const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain');
const Block = require('../blockchain/block');

describe('TransactionPool()', () => {
    let transactionPool, transaction, senderWallet;

    beforeEach(() => {
        transactionPool = new TransactionPool();
        senderWallet = new Wallet();
        transaction = new Transaction({
            senderWallet,
            recipient: 'foo-recipient',
            amount: 50
        });
    });

    describe('setTransaction()', () => {
        it('set a transaction', () => {
            transactionPool.setTransaction(transaction);
            expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
        });
    });

    describe('existingTransaction()', () => {
        it('returns a transaction if it exists', () => {
            transactionPool.setTransaction(transaction);
            expect(
                transactionPool.existingTransaction({ inputAddress: senderWallet.publicKey })
            ).toBe(transaction);
        });
    });

    describe('validTransactions()', () => {
        let validTransactions, errorMock;

        beforeEach(() => {
            validTransactions = [];
            errorMock = jest.fn();
            global.console.error = errorMock;
            
            for(let i = 0; i < 10; i++) {
                transaction = new Transaction({
                    senderWallet,
                    recipient: 'foobar-recipient',
                    amount: 20
                });

                if(i%3 === 0) {
                    transaction.input.amount = 99999;
                }
                else if(i%3 === 1) {
                    transaction.input.signature = new Wallet().sign('foo-string');
                }
                else { 
                    validTransactions.push(transaction);
                }
                
                transactionPool.setTransaction(transaction);
            }
        });

        it('returns valid transaction', () => {
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
        });

        it('checks for errorMock calls', () => {
            transactionPool.validTransactions();
            expect(errorMock).toHaveBeenCalled();
        });
    });

    describe('clear()', () => {  
        it('clears the map', () => {
            transactionPool.clear();
            expect(transactionPool.transactionMap).toEqual({});
        });
    });

    describe('clearBlockchainTransactions()', () => {
        it('clears the pool off transactions present in the blockchain', () => {
            const blockchain = new Blockchain();
            const expectedTransactionMap = {};
            for(let i = 0; i < 10; i++) {
                const transaction = new Wallet().createTransaction({
                    recipient: 'foo-recipient',
                    amount: 20
                });
                transactionPool.setTransaction(transaction);
                
                if(i % 2) {
                    blockchain.addBlock({ data: [transaction] });
                }
                else {
                    expectedTransactionMap[transaction.id] = transaction;
                }
            }
            transactionPool.clearBlockchainTransactions({ chain: blockchain.chain });
            expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
        });
    });

});