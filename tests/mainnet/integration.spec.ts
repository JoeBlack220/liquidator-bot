import '../../src/helper/env'
import { expect } from 'chai';
import { GasPriceExecutor } from '../../src/lib/GasPriceExecutor';
import { Web3Wrapper } from '../../src/helper/web3';
import Web3 from 'web3';
import { App } from '../../src/app/app';
import { addressGetter } from '../../src/helper/addressGetter';
import { isAccountLiquidatable, getBorrowPower } from '../../src/helper/contractsHelper';
import { LiquidateAccountsExecutor } from '../../src/lib/LiquidateAccountsExecutor';
import { BackendAccountGetter } from '../../src/lib/BackendAccountGetter';
import { add } from 'winston';

const { BN } = require("@openzeppelin/test-helpers");

describe('LiquidateAccountsExecutor', async function () {
    this.timeout(0)
    let web3: Web3;
    let web3Wrapper: Web3Wrapper;
    let user: string;
    let gasPriceExecutor: GasPriceExecutor;
    let accounts: string[];
    let address: any;
    let accountGetter: BackendAccountGetter;
    let app: App;

    before(async function () {
        app = new App();
        accountGetter = app.accountGetter;
        web3Wrapper = app.web3Wrapper;
        gasPriceExecutor = app.gasGetter;
        web3 = web3Wrapper.getWeb3();
        accounts = await web3.eth.getAccounts();
        address = app.address;
    });

    it("Should test accountGetter from app", async () => {
        await accountGetter.runUpdateAccounts();
        const targetAccount = accountGetter.getAllAccounts()[0];
        const borrowPower = (new BN(await getBorrowPower(targetAccount, user, web3, address))).toString();
        expect(borrowPower).to.not.equal("0");
        console.log(borrowPower);
    });

    it("Should test gasGetter from app", async () => {
        await gasPriceExecutor.updateGasPrice();
        const price = gasPriceExecutor.getLatestPrice();
        console.log("The updated price is: ", price);
    });

    after(async function () {
        const provider = web3Wrapper.getWeb3().currentProvider;
        if (provider &&
            (provider instanceof Web3.providers.HttpProvider)
        ) {
            provider.disconnect();
        }
    });

});