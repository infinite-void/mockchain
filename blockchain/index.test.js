const Blockchain = require('./index');
const Block = require('./block');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');
const { cryptoHash } = require('../utils');

describe('Blockchain', () => {
    let blockchain, newChain, originalChain;

    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockchain.chain;
    });

    describe('chain()', () => {
        it('contains a `chain` array', () => {
            expect(blockchain.chain instanceof Array).toBe(true);
        });

        it('starts with `genesis` block', () => {
            expect(blockchain.chain[0]).toEqual(Block.genesis());
        });
    });

    describe('addChain()', () => {
        it('adds a new block to the chain', () => {
            const newData = 'foo-bar';
            blockchain.addBlock({data: newData});

            expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);
        });
    });

    describe('isValidChain()', () => {
        
        describe('when the chain does not start with the genesis block.', () => {  
            it('returns false', () => {
                blockchain.chain[0] = { data: 'fake-genesis' };

                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        });

        describe('when the chain starts with genesis block and has multiple blocks', () => {

            beforeEach(() => {
                blockchain.addBlock({ data: 'foo-bar-1' });
                blockchain.addBlock({ data: 'foo-bar-2' });
                blockchain.addBlock({ data: 'foo-bar-3' });
            });

            describe('when a lastHash reference has changed', () => {   
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'broken-lastHash';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('when the chain contains a block with an invalid field', () => {
                it('returns false', () => {
                    blockchain.chain[2].data = 'tampered-data';

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });

            describe('when the chain contains a block with jumped difficulty', () => {
                it('return false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty - 3;
                    const hash = cryptoHash(timestamp, data, nonce, difficulty, lastHash);
                    const invalidBlock = new Block({ 
                        timestamp, data, hash, lastHash, difficulty, nonce
                    });

                    blockchain.chain.push(invalidBlock);
                    
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false); 
                });
            });
            describe('when the chain is valid', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                });
            });
        });
    });

    describe('replaceChain()', () => {
        let errorMock, logMock;

        beforeEach(() => {
            errorMock = jest.fn();
            logMock = jest.fn();
            global.console.error = errorMock;
            global.console.log = logMock;
        });

        describe('when the new chain is not longer', () => {

            beforeEach(() => {
                newChain.chain[0] = { new: 'chain' };
                blockchain.replaceChain(newChain.chain);
            });

            it('does not replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain);
            });

            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('when the new chain is longer', () => {

            beforeEach(() => {
                newChain.addBlock({ data: ['foo-bar-content'] });
                newChain.addBlock({ data: ['foo_bar_content'] });
                newChain.addBlock({ data: ['foo+bar+content']})
            });

            describe('when the chain is invalid', () => {

                beforeEach(() => {
                    newChain.chain[1].hash = 'tampered-value';
                    blockchain.replaceChain(newChain.chain);

                });

                it('does not replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain);
                });


                it('logs an error', () => {
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('when the chain is valid', () => {

                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain, false);
                });

                it('does replace the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain);
                });

                it('logs the chain replacement', () => {
                    expect(logMock).toHaveBeenCalled();
                });
            });
        });

        describe('validateTransactionData is called', () => {
            it('validTransactionData should be called', () => {
                const validateTransactionDataMock = jest.fn();
                blockchain.validTransactionData = validateTransactionDataMock;
                newChain.addBlock({ data: [ 'foo-bar-content' ]});
                blockchain.replaceChain(newChain.chain, true);
                expect(validateTransactionDataMock).toHaveBeenCalled();
            });
        });
    });

    describe('validTransactionData()', () => {
        let transaction, rewardTransaction, wallet, errorMock;

        beforeEach(() => {
            errorMock = jest.fn();
            global.console.error = errorMock;
            wallet = new Wallet();
            transaction = wallet.createTransaction({ 
                recipient: 'foo-recipient',
                amount: 100
            });
            rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });
        });

        describe('transactionData is valid', () => {
            it('returns true', () => {
                newChain.addBlock({ data: [transaction, rewardTransaction] });
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toEqual(true);
            });
        });

        describe('transactionData is invalid', () => {
            describe('contains multiple rewardTransactions', () => {
                it('returns false', () => {
                    newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction ]});
                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toEqual(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('contains invalid outputMaps', () => {
                describe('transactions have invalid outputMap', () => {
                    it('returns false', () => {
                        transaction.outputMap[wallet.publicKey] = 10000;
                        newChain.addBlock({ data: [transaction, rewardTransaction] });
                        expect(blockchain.validTransactionData({ chain: newChain.chain })).toEqual(false);
                        expect(errorMock).toHaveBeenCalled();
                    });
                });

                describe('rewardTransaction has invalid outputMap', () => {
                    it('returns false', () => {
                        rewardTransaction.outputMap[wallet.publicKey] = 0;
                        newChain.addBlock({ data: [transaction, rewardTransaction] });
                        expect(blockchain.validTransactionData({ chain: newChain.chain })).toEqual(false);
                        expect(errorMock).toHaveBeenCalled();
                    });
                }); 
            });

            describe('contains invalid input', () => {
                it('returns false', () => {
                    wallet.balance = 7830;
                    const foobarOutputMap = {
                        [wallet.publicKey]: 7800,
                        'foo-recipient': 30
                    };
                    const foobarTransaction = {
                        outputMap: foobarOutputMap,
                        input: {
                            timestamp: Date.now(),
                            amount: wallet.balance,
                            address: wallet.publicKey,
                            signature: wallet.sign(foobarOutputMap)
                        }
                    };
                    newChain.addBlock({ data: [ foobarTransaction, rewardTransaction ]});
                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toEqual(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('contains identical transactions', () => {
                it('returns false', () => {
                    newChain.addBlock({ data: [transaction, transaction, rewardTransaction] });
                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toEqual(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });
    });
});