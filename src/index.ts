import { logger } from './lib/logger';
import './lib/env';
import { web3 } from './helper/web3';
import { getInstance } from './helper/getContractInstance'
import { borrow, deposit, isAccountLiquidatable, liquidate, updatePrice, getPrice, tokenBalance, mint } from './helper/contractsHelper';
import { FakeAccountGetter } from './lib/FakeAccountGetter';
import { LiquidateAccountsExecutor } from './lib/LiquidateAccountsExecutor';
import { GasPriceExecutor } from './lib/GasPriceExecutor';
const { BN } = require("@openzeppelin/test-helpers");

const address = require('../build/addresses.json');

(async () => {
    const accounts = await web3.eth.getAccounts();

    const accountsGetter = new FakeAccountGetter(accounts);
    const gasPriceGetter = new GasPriceExecutor();
    const liquidator = new LiquidateAccountsExecutor(accountsGetter, gasPriceGetter);
    const ONE_DAI = new BN(10).pow(new BN(18));
    const ONE_USDC = new BN(10).pow(new BN(6));
    const TWO_USDC = new BN(10).pow(new BN(6)).mul(new BN(2));
    const TEN_USDC = new BN(10).pow(new BN(6)).mul(new BN(2));
    const borrowAmt = ONE_USDC.mul(new BN(6)).div(new BN(10));

    const gasPrice = gasPriceGetter.getLatestPrice();
    await mint(accounts[1], "DAI", ONE_DAI, accounts[0], gasPrice);
    await mint(accounts[2], "USDC", TWO_USDC, accounts[0], gasPrice);
    await mint(accounts[0], "USDC", TEN_USDC, accounts[0], gasPrice);

    await deposit(accounts[1], "DAI", ONE_DAI, accounts[0], gasPrice);
    await deposit(accounts[2], "USDC", TWO_USDC, accounts[0], gasPrice);
    await deposit(accounts[0], "USDC", TEN_USDC, accounts[0], gasPrice);

    await borrow(accounts[1], "USDC", borrowAmt, gasPrice);

    const price = new BN(await getPrice("DAI", accounts[0]));
    const updatedPrice = price.mul(new BN(70)).div(new BN(100));
    await updatePrice("DAI", updatedPrice, accounts[0], gasPrice);


    accountsGetter.start();
    gasPriceGetter.start();
    liquidator.start();


})().then(e => console.log(e))



