const Blockchain = require('./blockchain');

const blockchain = new Blockchain();

blockchain.addBlock({ data: 'initial' });

let prevTimestamp, nextTimestamp, nextBlock, timeDifference, average;

const times = [];

console.log('first block :', blockchain.chain[blockchain.chain.length - 1]);

for(let i = 0; i < 10000; i++) {
    prevTimestamp = blockchain.chain[blockchain.chain.length - 1].timestamp;

    blockchain.addBlock({ data: `block id: ${i}`});   
    nextBlock = blockchain.chain[blockchain.chain.length - 1];
    nextTimestamp = nextBlock.timestamp;
    timeDifference = nextTimestamp - prevTimestamp;
    times.push(timeDifference);

    average = times.reduce((total, value) => (total + value)) / times.length;
    console.log(`Time to mine block: ${timeDifference}ms. Difficulty: ${nextBlock.difficulty}. Average: ${average}ms.`);
}
