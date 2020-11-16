import '../../src/helper/env'
import { expect } from 'chai';
import { GasPriceExecutor } from '../../src/lib/GasPriceExecutor';
import { Web3Wrapper } from '../../src/helper/web3';
import Web3 from 'web3';
import { TestGenerator } from '../../src/test-helper/TestGenerator';
import { addressGetter } from '../../src/helper/addressGetter';
import { isAccountLiquidatable } from '../../src/helper/contractsHelper';
import { LiquidateAccountsExecutor } from '../../src/lib/LiquidateAccountsExecutor';
import { GanacheAccountGetter } from '../../src/lib/GanacheAccountGetter';

const { BN } = require("@openzeppelin/test-helpers");

describe('LiquidateAccountsExecutor', async function () {
    this.timeout(0)
    let web3: Web3;
    let web3Wrapper: Web3Wrapper;
    let user: string;
    let gasPriceExecutor: GasPriceExecutor;
    let accounts: string[];
    let testGenerator: TestGenerator;
    let address: any;
    let accountGetter: GanacheAccountGetter;
    let liquidateExecutor: LiquidateAccountsExecutor;

    before(async function () {
        this.timeout(0);

        web3Wrapper = Web3Wrapper.getInstance();
        web3Wrapper.setWeb3(
            "ganache",
            "",
            "",
            ""
        );
        web3 = web3Wrapper.getWeb3();
        accounts = await web3.eth.getAccounts();
        user = accounts[0];
        address = addressGetter("development");

        gasPriceExecutor = new GasPriceExecutor(
            "http://ethgasstation.info/json/ethgasAPI.json",
            25,
            2000,
            1,
        );

        testGenerator = new TestGenerator(
            accounts,
            gasPriceExecutor,
            10000,
            10000,
            web3Wrapper,
            address
        );

        await testGenerator.init();

        accountGetter = new GanacheAccountGetter(
            accounts,
            10000,
            accounts[0],
            "USDC",
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

    it("Should generate one liquidatable account and let the liquidator executor to liquidate it.", async () => {
        await testGenerator.reset();
        const status = await testGenerator.checkStatus();
        expect(status).to.equal(true);

        await testGenerator.generateLiquidatableAccounts(1);
        await accountGetter.updateLiquidatableAccounts();
        expect(accountGetter.liquidatableAccounts).to.have.lengthOf(1);

        await liquidateExecutor.liquidateAccounts();
        await accountGetter.updateLiquidatableAccounts();
        expect(accountGetter.liquidatableAccounts).to.have.lengthOf(0);
    });

    it("Should generate three liquidatable account and let the liquidator executor to liquidate it.", async () => {
        await testGenerator.reset();
        const status = await testGenerator.checkStatus();
        expect(status).to.equal(true);

        await testGenerator.generateLiquidatableAccounts(3);
        await accountGetter.updateLiquidatableAccounts();
        expect(accountGetter.liquidatableAccounts).to.have.lengthOf(3);

        await liquidateExecutor.liquidateAccounts();
        await accountGetter.updateLiquidatableAccounts();
        expect(accountGetter.liquidatableAccounts).to.have.lengthOf(0);
    });

    it("Should generate one liquidatable account and let the liquidator executor to liquidate it, then repeat the process", async () => {
        await testGenerator.reset();
        var status = await testGenerator.checkStatus();
        expect(status).to.equal(true);

        await testGenerator.generateLiquidatableAccounts(1);
        await accountGetter.updateLiquidatableAccounts();
        expect(accountGetter.liquidatableAccounts).to.have.lengthOf(1);

        await liquidateExecutor.liquidateAccounts();
        await accountGetter.updateLiquidatableAccounts();
        expect(accountGetter.liquidatableAccounts).to.have.lengthOf(0);
        await testGenerator.reset();

        status = await testGenerator.checkStatus();
        expect(status).to.equal(true);

        await testGenerator.generateLiquidatableAccounts(1);
        await accountGetter.updateLiquidatableAccounts();
        expect(accountGetter.liquidatableAccounts).to.have.lengthOf(1);

        await liquidateExecutor.liquidateAccounts();
        await accountGetter.updateLiquidatableAccounts();
        expect(accountGetter.liquidatableAccounts).to.have.lengthOf(0);
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