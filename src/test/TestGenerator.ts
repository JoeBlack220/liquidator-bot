import TaskExecutor from '../lib/TaskExecutor';
import { logger } from '../lib/logger';
import {
    borrow,
    deposit,
    isAccountLiquidatable,
    liquidate,
    updatePrice,
    getPrice,
    borrowBalance,
    repay,
    withdraw,
    withdrawAll,
    mint,
    depositBalance
}
    from '../helper/contractsHelper';
import { GasPriceExecutor } from '../lib/GasPriceExecutor';
import { address } from '../lib/address';
import { copySync } from 'fs-extra';
const { BN } = require("@openzeppelin/test-helpers");

export class TestGenerator extends TaskExecutor {
    tokenNames: string[];
    resetFreqSec: number;
    generateFreqSec: number;
    initialPrice: number[];
    accounts: string[];
    owner: string;
    gasPriceGetter: GasPriceExecutor;
    sixPrecision: any;
    eighteenPrecision: any;
    eightPrecision: any;
    savingAccountAddress: string;
    debtAccounts: string[];


    constructor(accounts: string[], gasPriceGetter: GasPriceExecutor) {
        super();
        this.tokenNames = ["DAI", "USDC", "USDT", "TUSD", "MKR", "BAT", "ZRX", "REP", "WBTC"];
        this.resetFreqSec = Number(process.env.TEST_RESET_FREQUENCY_SEC) * 1000;
        this.generateFreqSec = Number(process.env.TEST_GENERATE_FREQUENCY_SEC) * 1000;
        this.initialPrice = [];
        this.owner = accounts[0];
        this.accounts = accounts.slice(1);
        this.gasPriceGetter = gasPriceGetter;
        this.sixPrecision = new BN(10).pow(new BN(6));
        this.eightPrecision = new BN(10).pow(new BN(8));
        this.eighteenPrecision = new BN(10).pow(new BN(18));
        this.savingAccountAddress = address["SavingAccount"];
        this.debtAccounts = [];
    }

    // Should be called before start.
    init = async () => {

        for (let i = 0; i < this.tokenNames.length; ++i) {
            const tokenName = this.tokenNames[i];
            const tokenPrice = 5309685000000000;
            this.initialPrice.push(tokenPrice);
        }

        await mint(this.owner, "USDC", this.sixPrecision.mul(new BN(100)), this.owner, this.gasPriceGetter.getLatestPrice());
        await mint(this.owner, "DAI", this.eighteenPrecision.mul(new BN(100)), this.owner, this.gasPriceGetter.getLatestPrice());

        for (let account of this.accounts) {
            await mint(account, "USDC", this.sixPrecision.mul(new BN(100)), this.owner, this.gasPriceGetter.getLatestPrice());
            await mint(account, "DAI", this.eighteenPrecision.mul(new BN(100)), this.owner, this.gasPriceGetter.getLatestPrice());
        }
        deposit(this.owner, "USDC", this.sixPrecision.mul(new BN(100)), this.owner, this.gasPriceGetter.getLatestPrice());
    }

    resetAllPrice = async () => {
        for (let i = 0; i < 2; ++i) {
            const tokenName = this.tokenNames[i];
            await updatePrice(
                tokenName,
                this.initialPrice[i],
                this.owner,
                this.gasPriceGetter.getLatestPrice()
            );
            const price = await getPrice(tokenName, this.owner);
            logger.debug({
                at: "TestGenerator#resetAllPrice",
                message: `The price of ${tokenName} now is ${price}`
            });
        }
    }

    discountOneToken = async (index: number) => {
        await updatePrice(
            this.tokenNames[index],
            this.initialPrice[index] * 0.7,
            this.owner,
            this.gasPriceGetter.getLatestPrice()
        );
    }

    clearDebt = async (account: string) => {
        await repay(account, "USDC", this.sixPrecision.mul(new BN(2)), this.gasPriceGetter.getLatestPrice());
    }

    clearAllDebt = async () => {
        for (let i = 0; i < this.accounts.length; ++i) {
            try {
                const borrowAmt = await borrowBalance("USDC", this.accounts[i]);
                if (borrowAmt > 0) {
                    await this.clearDebt(this.accounts[i]);
                }
            } catch (err) {
                logger.error({
                    at: "TestGenerator#clearAllDebt",
                    message: "Trying to clear debt of a clean account",
                    err: err
                });
            }
        }
    }

    generateDebtAccounts = async () => {
        const candidates = this.accounts.filter(x => !this.debtAccounts.includes(x));
        const index = Math.floor(Math.random() * candidates.length);
        const account = candidates[index];
        logger.info({
            at: 'TestGenerator#generateDebtAccounts',
            message: `Start to make account ${index}, ${account}`
        });

        await deposit(account, "DAI", this.eighteenPrecision, this.owner, this.gasPriceGetter.getLatestPrice());
        await borrow(account, "USDC", this.sixPrecision.mul(new BN(60)).div(new BN(100)), this.gasPriceGetter.getLatestPrice());

        this.debtAccounts.push(account);
    }

    withdrawDeposit = async (account: string) => {
        await withdrawAll(account, "DAI", this.gasPriceGetter.getLatestPrice());
    }

    withdrawAllDeposit = async () => {
        for (let i = 0; i < this.accounts.length; ++i) {
            try {
                const depositBalanceAmt = await depositBalance("DAI", this.accounts[i]);
                if (depositBalanceAmt > 0) {
                    await this.withdrawDeposit(this.accounts[i]);
                }
            } catch (err) {
                logger.error({
                    at: "TestGenerator#withdrawAllDeposit",
                    message: "Try to withdraw from a clean account",
                    err: err
                });
            }
        }
    }

    reset = async () => {
        await this.resetAllPrice();

        await this.clearAllDebt();

        await this.withdrawAllDeposit();

        await this.printStatus();

        this.debtAccounts = [];
    }

    start = () => {
        logger.info({
            at: 'TestGenerator#start',
            message: 'Starting TestGenerator'
        });
        this.runGenerate();
        this.runReset();
    }

    runGenerate = async () => {
        logger.info({
            at: 'TestGenerator#runGenerate',
            message: 'Starting generating liquidatable accounts'
        });
        for (; ;) {
            try {
                await this.generateDebtAccounts();
                await this.discountOneToken(0);
            } catch (err) {
                logger.error({
                    at: "TestGenerator#runGenerate",
                    message: `Failed to generate liquidatable account`,
                    error: err.message
                });
            }
            await this.wait(this.generateFreqSec);
        }
    }

    runReset = async () => {
        logger.info({
            at: 'TestGenerator#runRest',
            message: 'Starting reseting the accounts status'
        });
        for (; ;) {
            try {
                await this.reset();
            } catch (err) {
                logger.error({
                    at: "TestGenerator#runReset",
                    message: `Failed to reset liquidatable account`,
                    error: err.message
                });
            }
            await this.wait(this.resetFreqSec);

        }
    }

    printStatus = async () => {
        for (let account of this.accounts) {

            let borrowDAIAmt = await borrowBalance("DAI", account);
            let depositDAIAmt = await depositBalance("DAI", account);
            let borrowUSDCAmt = await borrowBalance("USDC", account);
            let depositUSDCAmt = await depositBalance("USDC", account);
            logger.info({
                at: "TestGenerator#printStatus",
                message1: `DAI Token balance of ${account} is ${borrowDAIAmt} and ${depositDAIAmt}`,
                message2: `USDC Token balance of ${account} is ${borrowUSDCAmt} and ${depositUSDCAmt}`
            });
        };
    }

}