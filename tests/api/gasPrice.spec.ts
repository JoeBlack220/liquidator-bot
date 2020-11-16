import '../../src/helper/env'
import { expect } from 'chai';
import { GasPriceExecutor } from '../../src/lib/GasPriceExecutor';
import { Web3Wrapper } from '../../src/helper/web3';
import Web3 from 'web3';
const { BN } = require("@openzeppelin/test-helpers");

describe('GasPriceGetter', async function () {
    this.timeout(0)
    let web3: Web3;
    let web3Wrapper: Web3Wrapper;
    let user: string;
    let gasPriceExecutor: GasPriceExecutor;
    let accounts: string[];

    before(async function () {
        this.timeout(0);
        web3Wrapper = Web3Wrapper.getInstance();
        web3Wrapper.setWeb3(
            "privatekey",
            "",
            "850bdc51011cbc33bd72592e494b0127d7755d468a501f50161d96c9a7f4c640",
            "https://mainnet.infura.io/v3/ea620a48fe584d2297be56bde9d5b451"
        );

        web3 = web3Wrapper.getWeb3();
        accounts = await web3.eth.getAccounts();
        user = accounts[0];

        gasPriceExecutor = new GasPriceExecutor(
            "http://ethgasstation.info/json/ethgasAPI.json",
            25,
            2000,
            1,
        );
    });

    it("Get the initial price of the gasExecutor", async () => {
        const price = gasPriceExecutor.getLatestPrice();
        const actualPrice = (new BN(10).pow(new BN(9)).mul(new BN(25))).toString();
        expect(price).to.equal(actualPrice);
    });

    it("Update the price and return the new price", async () => {
        await gasPriceExecutor.updateGasPrice();
        const price = gasPriceExecutor.getLatestPrice();
        console.log("The updated price is: ", price);
    });

    after(async function () {
        const provider = web3.currentProvider;
        if (provider &&
            (provider instanceof Web3.providers.HttpProvider)
        ) {
            provider.disconnect();
        }
    });

});