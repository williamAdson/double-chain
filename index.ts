import * as crypto from 'crypto';

class Transaction{
    // transfer funds from one user to another
    constructor(
        public amount: number,
        public sender: string,
        public receiver: string,
    ){}
    toString(){
        return JSON.stringify(this);
    }
}

class Block{
    // container of multiple transactions
    public nonce = Math.round(Math.random() * 999999999);
    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ){}
    get hash(){
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}

class Chain{
    public static instance = new Chain();
    chain: Block[];
    constructor(){
        this.chain = [new Block('null', new Transaction(100, 'genesis', 'satoshi'))]
    }
    get lastBlock(){
        return this.chain[this.chain.length - 1];
    }
    mine(nonce: number){
        let solution = 1;
        console.log('⛏ mining...')
        while(true){
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');
            if(attempt.substring(0, 4) === '0000'){
                console.log('Solved: '+solution)
                return solution;
            }

            solution += 1;
        }
    }
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer){
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);
        if(isValid){
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.chain.push(newBlock);
        }
    }
}

class Wallet{
    // wrapper for a public and private key
    public publicKey: string;
    public privateKey: string;

    constructor(){
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, senderPublicKey: string){
        const transaction = new Transaction(amount, this.publicKey, senderPublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}

// blockchain使用者wallets
const william = new Wallet();
const adson = new Wallet();

// blockchain使用者transactions(交易)
william.sendMoney(10, adson.publicKey);



console.log(Chain.instance);