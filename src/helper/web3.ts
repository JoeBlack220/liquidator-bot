import Web3 from 'web3';
const HDWalletProvider = require('truffle-hdwallet-provider');
export const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

export const getWeb3 = (type: string) => {
    if (type === 'ganache') {
        return new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    else {
        const provider = new HDWalletProvider(
            /* your mnemonic */process.env.USER_MNEMONIC,
            /* your infura access node*/process.env.ACCESS_NODE_URL
        )
        return new Web3(provider);
    }
}

