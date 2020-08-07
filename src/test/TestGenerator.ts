import TaskExecutor from '../lib/TaskExecutor';
import { logger } from '../lib/logger';
import {
    borrow,
    deposit,
    isAccountLiquidatable,
    liquidate,
    updatePrice,
    getPrice,
    tokenBalance,
    repay,
    withdraw,
    withdrawAll,
    mint
}
    from '../helper/contractsHelper';
import { GasPriceExecutor } from '../lib/GasPriceExecutor';
import { address } from '../lib/address';
const { BN } = require("@openzeppelin/test-helpers");
export class TestGenerator extends TaskExecutor {
    tokenNames: string[];
    resetFreqSec: number;
    generateFreqSec: number;
    initialPrice: number[];
    accounts: string[];
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
        this.accounts = accounts;
        this.gasPriceGetter = gasPriceGetter;
        this.sixPrecision = new BN(10).pow(new BN(6));
        this.eightPrecision = new BN(10).pow(new BN(8));
        this.eighteenPrecision = new BN(10).pow(new BN(18));
        this.savingAccountAddress = address["SavingAccount"];
        this.debtAccounts = [];
    }

    init = async () => {
        for (let i = 0; i < this.tokenNames.length; ++i) {
            const tokenName = this.tokenNames[i];
            const tokenPrice = await getPrice(tokenName, this.accounts[0]);
            this.initialPrice.push(tokenPrice);
        }
        for (let account of this.accounts) {
            await mint(account, "USDC", this.sixPrecision.mul(new BN(100)), this.accounts[0], this.gasPriceGetter.getLatestPrice());
            await mint(account, "DAI", this.eighteenPrecision.mul(new BN(100)), this.accounts[0], this.gasPriceGetter.getLatestPrice());
        }
        deposit(this.accounts[0], "USDC", this.sixPrecision.mul(new BN(50)), this.accounts[0], this.gasPriceGetter.getLatestPrice());
    }

    resetAllPrice = async () => {
        for (let i = 0; i < this.tokenNames.length; ++i) {
            await updatePrice(
                this.tokenNames[i],
                this.initialPrice[i],
                this.accounts[0],
                this.gasPriceGetter.getLatestPrice()
            );
        }
    }

    discountOneToken = async (index: number) => {
        await updatePrice(
            this.tokenNames[index],
            this.initialPrice[index] * 0.7,
            this.accounts[0],
            this.gasPriceGetter.getLatestPrice()
        );
    }

    clearDebt = async (account: string) => {
        await repay(account, "USDC", this.sixPrecision.mul(new BN(2)), this.gasPriceGetter.getLatestPrice());
    }

    clearAllDebt = async () => {
        for (let i = 1; i < this.debtAccounts.length; ++i) {
            await this.clearDebt(this.debtAccounts[i]);
        }
    }

    generateDebtAccounts = async () => {
        const candidates = this.accounts.filter(x => !this.debtAccounts.includes(x));
        const index = Math.floor(Math.random() * candidates.length);
        const account = candidates[index];
        await deposit(account, "DAI", this.eightPrecision, this.accounts[0], this.gasPriceGetter.getLatestPrice());
        await borrow(account, "USDC", this.sixPrecision.mul(new BN(60)).div(new BN(100)), this.gasPriceGetter.getLatestPrice());
        this.debtAccounts.push(account);
    }

    withdrawDeposit = async (account: string) => {
        await withdrawAll(account, "DAI", this.gasPriceGetter.getLatestPrice());
    }

    withdrawAllDeposit = async () => {
        for (let i = 1; i < this.debtAccounts.length; ++i) {
            await this.withdrawDeposit(this.debtAccounts[i]);
        }
    }

    reset = async () => {
        await this.resetAllPrice();
        await this.clearAllDebt();
        await this.withdrawAllDeposit();
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
                    at: "TestGenerator#runGenerate",
                    message: `Failed to generate liquidatable account`,
                    error: err.message
                });
            }
            await this.wait(this.resetFreqSec);

        }
    }

}