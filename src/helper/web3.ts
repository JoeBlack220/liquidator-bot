import Web3 from 'web3';
const HDWalletProvider = require('truffle-hdwallet-provider');
const PrivateKeyProvider = require("truffle-privatekey-provider");

export class Web3Wrapper {
    private static instance: Web3Wrapper;

    private mnemonic = process.env.USER_MNEMONIC || "";
    private privatekey = process.env.PRIVATE_KEY || "";
    private accessnode = process.env.ACCESS_NODE_URL || "";
    private web3Type: string;
    private web3: Web3;

    private constructor() {

        if (process.env.NETWORK == "development") {
            this.web3Type = 'ganache';
        } else if (process.env.PROVIDER_TYPE == "mnemonic") {
            this.web3Type = 'mnemonic';
        } else {
            this.web3Type = 'privatekey';
        }

        this.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }

    /**
     * Get a singleton instance of Web3
     */
    public static getInstance = (): Web3Wrapper => {

        if (!Web3Wrapper.instance) {
            Web3Wrapper.instance = new Web3Wrapper();
        }

        return Web3Wrapper.instance;
    }

    /**
     * Get the web3 client.
     * 
     * @param type - The environment we are using in the liquidator: ganache/HDWalletProvider.
     * @param menmonic - The mnemoic of the user.
     * @param privateKey - The private key of the user.
     * @param accessNode - The url of the access node.
     * @returns The web3 client to interact with the chain.
     */
    public setWeb3 = (type: string, mnemonic: string, privateKey: string, accessNode: string) => {
        if (type === 'ganache') {
            this.web3.setProvider(new Web3.providers.HttpProvider("http://localhost:8545"));
        }
        else if (type == 'mnemonic') {
            const provider = new HDWalletProvider(
                /* your mnemonic */mnemonic,
                /* your infura access node*/accessNode
            )
            this.web3.setProvider(provider);
        } else {
            const provider = new PrivateKeyProvider(
                privateKey,
                accessNode
            );
            this.web3.setProvider(provider);
        }
    }

    /**
     * Getter of the web3.
     */
    public getWeb3 = (): Web3 => {
        return this.web3;
    }

}
