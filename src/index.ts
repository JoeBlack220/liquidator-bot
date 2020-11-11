import { logger } from './lib/logger';
import './lib/env';
import { web3 } from './helper/web3';
import { getInstance } from './helper/getContractInstance'
import { borrow, deposit, isAccountLiquidatable, liquidate, updatePrice, getPrice, mint, borrowBalance, depositBalance } from './helper/contractsHelper';
import { FakeAccountGetter } from './lib/FakeAccountGetter';
import { LiquidateAccountsExecutor } from './lib/LiquidateAccountsExecutor';
import { GasPriceExecutor } from './lib/GasPriceExecutor';
import { TestGenerator } from './test-helper/TestGenerator';
const { BN } = require("@openzeppelin/test-helpers");

(async () => {

    const accounts = await web3.eth.getAccounts();

    const accountsGetter = new FakeAccountGetter(accounts);
    const gasPriceGetter = new GasPriceExecutor();
    const liquidator = new LiquidateAccountsExecutor(accountsGetter, gasPriceGetter);
    const testGenerator = new TestGenerator(accounts, gasPriceGetter);
    await testGenerator.init();

    testGenerator.start();
    accountsGetter.start();
    gasPriceGetter.start();
    liquidator.start();

    // for (; ;) {
    //     const accounts = await web3.eth.getAccounts();
    //     console.log(accounts);
    // }
    // const accounts = await web3.eth.getAccounts();
    // console.log("get here1");
    // const borrowDAIAmt = await borrowBalance("DAI", accounts[1]);
    // console.log("get here1");

    // const depositDAIAmt = await depositBalance("DAI", accounts[1]);
    // console.log("get here1");

    // const borrowUSDCAmt = await borrowBalance("USDC", accounts[1]);
    // console.log("get here1");

    // const depositUSDCAmt = await depositBalance("USDC", accounts[1]);
    // console.log("get here1");

    // const DAIprice = await getPrice("DAI", accounts[0]);
    // const USDCprice = await getPrice("USDC", accounts[0]);

    // const ans = await isAccountLiquidatable(accounts[0], accounts[0]);
    // console.log("borrowDAIAmt", borrowDAIAmt);
    // console.log("depositDAIAmt", depositDAIAmt);
    // console.log("borrowUSDCAmt", borrowUSDCAmt);
    // console.log("depositUSDCAmt", depositUSDCAmt);
    // console.log("Dai price", DAIprice);
    // console.log("usdc price", USDCprice);
    // console.log(ans)


})().then(e => console.log(e))



