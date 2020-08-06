import { logger } from './lib/logger';
import { GasPriceExecutor } from './lib/GasPriceExecutor';
import './lib/env';
import { web3 } from './helper/web3';
import { getInstance } from './helper/getContractInstance'
import { borrow, deposit, isAccountLiquidatable, liquidate, updatePrice, getPrice, tokenBalance } from './helper/contractsHelper';
const { BN } = require("@openzeppelin/test-helpers");

const address = require('../build/addresses.json');

(async () => {
    const ONE_DAI = new BN(10).pow(new BN(18));
    const ONE_USDC = new BN(10).pow(new BN(6));
    const TWO_USDC = new BN(10).pow(new BN(6)).mul(new BN(2));
    const borrowAmt = ONE_USDC.mul(new BN(6)).div(new BN(10));

    const accounts = await web3.eth.getAccounts();

    await deposit(accounts[1], "DAI", ONE_DAI, accounts[0]);
    await deposit(accounts[2], "USDC", TWO_USDC, accounts[0]);

    await borrow(accounts[1], "USDC", borrowAmt);

    const balance = await tokenBalance(accounts[1]);
    console.log(balance);


})().then(e => console.log(e))


