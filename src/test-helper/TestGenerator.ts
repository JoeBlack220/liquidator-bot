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
import { Web3Wrapper } from '../helper/web3'
import Web3 from 'web3';
const { BN } = require("@openzeppelin/test-helpers");

export class TestGenerator extends TaskExecutor {

    tokenNames: string[];
    resetFreqSec: number;
    generateFreqSec: number;
    initialPrice: number[] = [];
    accounts: string[];
    owner: string;
    gasPriceGetter: GasPriceExecutor;
    sixPrecision: any = new BN(10).pow(new BN(6));
    eighteenPrecision: any = new BN(10).pow(new BN(8));
    eightPrecision: any = new BN(10).pow(new BN(18));
    savingAccountAddress: string = address["SavingAccount"];
    debtAccounts: string[] = [];
    web3Wrapper: Web3Wrapper;


    constructor(accounts: string[], gasPriceGetter: GasPriceExecutor, resetFreqSec: number, generateFreqSec: number, web3Wrapper: Web3Wrapper) {
        super();
        this.tokenNames = ["DAI", "USDC", "USDT", "TUSD", "MKR", "BAT", "ZRX", "REP", "WBTC"];
        this.resetFreqSec = resetFreqSec;
        this.generateFreqSec = generateFreqSec;
        this.owner = accounts[0];
        this.accounts = accounts.slice(1);
        this.gasPriceGetter = gasPriceGetter;
        this.web3Wrapper = web3Wrapper;
    }

    // Should be called before start.
    init = async () => {
        for (let i = 0; i < this.tokenNames.length; ++i) {
            const tokenName = this.tokenNames[i];
            const tokenPrice = 5309685000000000;
            this.initialPrice.push(tokenPrice);
        }

        await mint(
            this.owner,
            "USDC",
            this.sixPrecision.mul(new BN(100)),
            this.owner, this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3()
        );
        await mint(
            this.owner,
            "DAI", this.eighteenPrecision.mul(new BN(100)),
            this.owner, this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3()
        );

        for (let account of this.accounts) {
            await mint(
                account,
                "USDC",
                this.sixPrecision.mul(new BN(100)),
                this.owner,
                this.gasPriceGetter.getLatestPrice(),
                this.web3Wrapper.getWeb3()
            );
            await mint(
                account,
                "DAI",
                this.eighteenPrecision.mul(new BN(100)),
                this.owner,
                this.gasPriceGetter.getLatestPrice(),
                this.web3Wrapper.getWeb3()
            );
        }
        await deposit(
            this.owner,
            "USDC",
            this.sixPrecision.mul(new BN(100)),
            this.owner, this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3()
        );
    }

    resetAllPrice = async () => {
        for (let i = 0; i < 2; ++i) {
            const tokenName = this.tokenNames[i];
            await updatePrice(
                tokenName,
                this.initialPrice[i],
                this.owner,
                this.gasPriceGetter.getLatestPrice(),
                this.web3Wrapper.getWeb3()
            );
            const price = await getPrice(tokenName, this.owner, this.web3Wrapper.getWeb3());
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
            this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3()
        );
    }

    clearDebt = async (account: string) => {
        await repay(
            account,
            "USDC",
            this.sixPrecision.mul(new BN(2)),
            this.gasPriceGetter.getLatestPrice(),
            this.owner,
            this.web3Wrapper.getWeb3()
        );
    }

    clearAllDebt = async () => {
        for (let i = 0; i < this.accounts.length; ++i) {
            try {
                const borrowAmt = await borrowBalance(
                    "USDC",
                    this.accounts[i],
                    this.owner,
                    this.web3Wrapper.getWeb3()
                );
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

        await deposit(
            account,
            "DAI",
            this.eighteenPrecision,
            this.owner,
            this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3()
        );

        await borrow(
            account,
            "USDC",
            this.sixPrecision.mul(new BN(60)).div(new BN(100)),
            this.gasPriceGetter.getLatestPrice(),
            this.owner,
            this.web3Wrapper.getWeb3()
        );

        this.debtAccounts.push(account);
    }

    withdrawDeposit = async (account: string) => {
        await withdrawAll(
            account,
            "DAI",
            this.gasPriceGetter.getLatestPrice(),
            this.owner,
            this.web3Wrapper.getWeb3()
        );
    }

    withdrawAllDeposit = async () => {
        for (let i = 0; i < this.accounts.length; ++i) {
            try {
                const depositBalanceAmt = await depositBalance(
                    "DAI",
                    this.accounts[i],
                    this.owner,
                    this.web3Wrapper.getWeb3()
                );
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
            if (this.killed) return;
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
            if (this.killed) return;
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

            let borrowDAIAmt = await borrowBalance(
                "DAI",
                account,
                this.owner,
                this.web3Wrapper.getWeb3()
            );
            let depositDAIAmt = await depositBalance(
                "DAI",
                account,
                this.owner,
                this.web3Wrapper.getWeb3()
            );
            let borrowUSDCAmt = await borrowBalance(
                "USDC",
                account,
                this.owner,
                this.web3Wrapper.getWeb3()
            );
            let depositUSDCAmt = await depositBalance(
                "USDC",
                account,
                this.owner,
                this.web3Wrapper.getWeb3()
            );
            logger.info({
                at: "TestGenerator#printStatus",
                message1: `DAI Token balance of ${account} is ${borrowDAIAmt} and ${depositDAIAmt}`,
                message2: `USDC Token balance of ${account} is ${borrowUSDCAmt} and ${depositUSDCAmt}`
            });
        };
    }

}