const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool')
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');
const Transaction = require('./wallet/transaction');

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool });
const transactionMiner = new TransactionMiner({ wallet, pubsub, transactionPool, blockchain });

const DEFAULT_PORT = 3000;
const ROOT_NONE_ADDRESS = `http://localhost:${DEFAULT_PORT}`; 

app.use(bodyParser.json()); 
app.use(express.static(path.join(__dirname, 'client/dist')));

app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
    const { data } = req.body;
    blockchain.addBlock({ data });
    pubsub.broadcastChain();
    res.redirect('/api/blocks');
});

app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body;
    let transaction = transactionPool.existingTransaction({ inputAddress: wallet.publicKey });

    try{
        if(transaction) {
            transaction.update({ senderWallet: wallet, recipient, amount });
        }
        else {
            transaction = wallet.createTransaction({ amount, recipient, chain: blockchain.chain });
        }
    }
    catch(error) {
        return res.status(400).json({ type: "error", message: error.message });
    }
    
    transactionPool.setTransaction(transaction);
    pubsub.broadcastTransaction(transaction);
    res.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();
    res.redirect('/api/blocks'); 
});

app.get('/api/wallet-info', (req, res) => {
    res.json({
        address: wallet.publicKey,
        balance: Wallet.calculateBalance({
            address: wallet.publicKey,
            chain: blockchain.chain
        })
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});
const syncWithRootState = () => {
    request({ url: `${ROOT_NONE_ADDRESS}/api/blocks` }, (error, response, body) => {
        if(!error && response.statusCode === 200){
            const rootChain = JSON.parse(body);

            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        }
    });

    request({ url: `${ROOT_NONE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootTransactionPool = JSON.parse(body);

            console.log('replace transaction pool on sync with ', rootTransactionPool);
            transactionPool.setMap(rootTransactionPool);
        }
    });
};

const walletFoo = new Wallet();
const walletBar = new Wallet();

const generateTransaction = ({ wallet, recipient, amount }) => {
    const transaction = wallet.createTransaction({
        recipient, amount, chain: blockchain.chain
    });
    transactionPool.setTransaction(transaction);
}

const walletAction = () => generateTransaction({
    wallet, recipient: walletFoo.publicKey, amount: 10
});

const walletFooAction = () => generateTransaction({
    wallet: walletFoo, recipient: walletBar.publicKey, amount: 20
});

const walletBarAction = () => generateTransaction({
    wallet: walletBar, recipient: wallet.publicKey, amount: 30
});

for(let i = 0; i < 10; i++) {
    if(i % 3 === 0) {
        walletAction();
        walletFooAction();
    }
    else if(i % 3 === 1) {
        walletFooAction();
        walletBarAction();
    }
    else {
        walletBarAction();
        walletAction();
    }
    transactionMiner.mineTransactions();
}

let PEER_PORT;

if(process.env.GENERATE_PEER_PORT ==='true') 
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);

const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`Listening at port: ${PORT}`);
    if(PORT !== DEFAULT_PORT) {
        syncWithRootState();
    }
});
