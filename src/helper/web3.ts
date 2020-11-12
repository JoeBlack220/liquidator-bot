import Web3 from 'web3';
const HDWalletProvider = require('truffle-hdwallet-provider');
const PrivateKeyProvider = require("truffle-privatekey-provider");
// TODO: Make this one a singleton

/**
 * Get the web3 client.
 * 
 * @param type - The environment we are using in the liquidator: ganache/HDWalletProvider.
 * @returns The web3 client to interact with the chain.
 */
export const getWeb3 = (type: string, mnemonic: string, privatekey: string, accessnode: string) => {
    if (type === 'ganache') {
        return new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    else if (type == 'mnemonic') {
        const provider = new HDWalletProvider(
            /* your mnemonic */mnemonic,
            /* your infura access node*/accessnode
        )
        return new Web3(provider);
    } else {
        const provider = new PrivateKeyProvider(
            privatekey,
            accessnode
        );
        return new Web3(provider);
    }
}

const mnemonic = process.env.USER_MNEMONIC || "";
const privatekey = process.env.PRIVATE_KEY || "";
const accessnode = process.env.ACCESS_NODE_URL || "";

var web3Type: string;

if (process.env.NETWORK == "development") {
    web3Type = 'ganache';
} else if (process.env.PROVIDER_TYPE == "mnemonic") {
    web3Type = 'mnemonic';
} else {
    web3Type = 'privatekey';
}

export const web3 = getWeb3(web3Type, mnemonic, privatekey, accessnode);
