import '../../src/helper/env'
import { expect } from 'chai';
import { GasPriceExecutor } from '../../src/lib/GasPriceExecutor';
import { Web3Wrapper } from '../../src/helper/Web3Wrapper';
import Web3 from 'web3';
import { TestGenerator } from '../../src/test-helper/TestGenerator';
import { addressGetter } from '../../src/helper/addressGetter';
import { isAccountLiquidatable, getBorrowPower } from '../../src/helper/contractsHelper';
import { LiquidateAccountsExecutor } from '../../src/lib/LiquidateAccountsExecutor';
import { BackendAccountGetter } from '../../src/lib/BackendAccountGetter';

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
    let liquidateExecutor: LiquidateAccountsExecutor;

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
        address = addressGetter("mainnet");

        gasPriceExecutor = new GasPriceExecutor(
            "http://ethgasstation.info/json/ethgasAPI.json",
            25,
            2000,
            1,
        );

        accountGetter = new BackendAccountGetter(
            10000,
            "USDC",
            50,
            50,
            user,
            web3Wrapper,
            address
        );

        liquidateExecutor = new LiquidateAccountsExecutor(
            accountGetter,
            gasPriceExecutor,
            10000,
            "USDC",
            accounts[0],
            web3Wrapper,
            address
        )
    });

    it("Get account from API, then call contract to check its liquidatability status", async () => {
        const accountGetter = new BackendAccountGetter(1000, "USDC", 100, 20, user, web3Wrapper, address);
        await accountGetter.runUpdateAccounts();
        const targetAccount = accountGetter.getAllAccounts()[0];
        const borrowPower = (new BN(await getBorrowPower(targetAccount, user, web3, address))).toString();
        expect(borrowPower).to.not.equal("0");
        console.log(borrowPower);
    });

    it("Get account from API, then call contract to check its liquidatability status", async () => {
        await accountGetter.runUpdateAccounts();
        await accountGetter.updateLiquidatableAccounts();
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