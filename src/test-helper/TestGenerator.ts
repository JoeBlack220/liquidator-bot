import TaskExecutor from '../lib/TaskExecutor';
import { Logger } from '../lib/Logger';
import {
    borrow,
    deposit,
    updatePrice,
    getPrice,
    borrowBalance,
    repay,
    withdrawAll,
    mint,
    depositBalance
}
    from '../helper/contractsHelper';
import { GasPriceExecutor } from '../lib/GasPriceExecutor';
import { Web3Wrapper } from '../helper/Web3Wrapper'

const { BN } = require("@openzeppelin/test-helpers");
const logger = Logger.getInstance().logger;

export class TestGenerator extends TaskExecutor {

    tokenNames: string[];
    resetFreqMilliSec: number;
    generateFreqMilliSec: number;
    initialPrice: number[] = [];
    accounts: string[];
    owner: string;
    gasPriceGetter: GasPriceExecutor;
    sixPrecision: any = new BN(10).pow(new BN(6));
    eighteenPrecision: any = new BN(10).pow(new BN(18));
    eightPrecision: any = new BN(10).pow(new BN(8));
    savingAccountAddress: string;
    debtAccounts: string[] = [];
    web3Wrapper: Web3Wrapper;
    address: any;


    constructor(accounts: string[], gasPriceGetter: GasPriceExecutor, resetFreqMilliSec: number, generateFreqMilliSec: number, web3Wrapper: Web3Wrapper, address: any) {
        super();
        this.tokenNames = ["DAI", "USDC", "USDT", "TUSD", "MKR", "BAT", "ZRX", "REP", "WBTC", "ETH"];
        this.resetFreqMilliSec = resetFreqMilliSec;
        this.generateFreqMilliSec = generateFreqMilliSec;
        this.owner = accounts[0];
        this.accounts = accounts.slice(1);
        this.gasPriceGetter = gasPriceGetter;
        this.web3Wrapper = web3Wrapper;
        this.address = address;
        this.savingAccountAddress = address['SavingAccount'];
    }

    /**
     * 
     * Initialize some fields of the class that need to call async function.
     * It prepares each user with funds and save some tokens to the DeFiner for user to borrow.
     * 
     * @remark - Should be called immediately after construction.
     */
    init = async () => {
        for (let i = 0; i < this.tokenNames.length; ++i) {
            const tokenName = this.tokenNames[i];
            const tokenPrice = 5309685000000000;
            this.initialPrice.push(tokenPrice);

            await updatePrice(
                tokenName,
                tokenPrice,
                this.owner,
                this.gasPriceGetter.getLatestPrice(),
                this.web3Wrapper.getWeb3(),
                this.address
            );
        }

        await mint(
            this.owner,
            "USDC",
            this.sixPrecision.mul(new BN(100)),
            this.owner, this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3(),
            this.address
        );

        await mint(
            this.owner,
            "DAI", this.eighteenPrecision.mul(new BN(100)),
            this.owner, this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3(),
            this.address
        );

        for (let account of this.accounts) {
            await mint(
                account,
                "USDC",
                this.sixPrecision.mul(new BN(100)),
                this.owner,
                this.gasPriceGetter.getLatestPrice(),
                this.web3Wrapper.getWeb3(),
                this.address
            );
            await mint(
                account,
                "DAI",
                this.eighteenPrecision.mul(new BN(100)),
                this.owner,
                this.gasPriceGetter.getLatestPrice(),
                this.web3Wrapper.getWeb3(),
                this.address
            );
        }
        await deposit(
            "USDC",
            this.sixPrecision.mul(new BN(100)),
            this.owner,
            this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3(),
            this.address
        );
    }

    /**
     * Reset all the token price to the initial value.
     */
    resetAllPrice = async () => {
        for (let i = 0; i < 2; ++i) {
            const tokenName = this.tokenNames[i];
            await updatePrice(
                tokenName,
                this.initialPrice[i],
                this.owner,
                this.gasPriceGetter.getLatestPrice(),
                this.web3Wrapper.getWeb3(),
                this.address
            );
            const price = await getPrice(
                tokenName,
                this.owner,
                this.web3Wrapper.getWeb3(),
                this.address
            );
            logger.debug({
                at: "TestGenerator#resetAllPrice",
                message: `The price of ${tokenName} now is ${price}`
            });
        }
    }

    /**
     * 
     * Change a token's price to 0.7 of the original price.
     * 
     * @param index - The index of the token we want to change
     */
    discountOneToken = async (index: number) => {
        await updatePrice(
            this.tokenNames[index],
            this.initialPrice[index] * 0.7,
            this.owner,
            this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3(),
            this.address
        );
    }

    /**
     * 
     * Let one user to repay its debt in USDC.
     * 
     * @param account - The account to repay its debt.
     */
    clearDebt = async (account: string) => {
        await repay(
            "USDC",
            this.sixPrecision.mul(new BN(2)),
            this.gasPriceGetter.getLatestPrice(),
            account,
            this.web3Wrapper.getWeb3(),
            this.address
        );
    }

    /**
     * Clear the debt for all the users.
     */
    clearAllDebt = async () => {
        for (let i = 0; i < this.accounts.length; ++i) {
            try {
                const borrowAmt = await borrowBalance(
                    "USDC",
                    this.accounts[i],
                    this.owner,
                    this.web3Wrapper.getWeb3(),
                    this.address
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

    /**
     * Let one user deposit 1 DAI and borrow 0.6 USDC to become a possible liquidatable account.
     */
    generateDebtAccounts = async () => {
        const candidates = this.accounts.filter(x => !this.debtAccounts.includes(x));
        const index = Math.floor(Math.random() * candidates.length);
        const account = candidates[index];

        logger.info({
            at: 'TestGenerator#generateDebtAccounts',
            message: `Start to make account ${index}, ${account}`
        });

        await deposit(
            "DAI",
            this.eighteenPrecision,
            account,
            this.gasPriceGetter.getLatestPrice(),
            this.web3Wrapper.getWeb3(),
            this.address
        );

        await borrow(
            "USDC",
            this.sixPrecision.mul(new BN(60)).div(new BN(100)),
            this.gasPriceGetter.getLatestPrice(),
            account,
            this.web3Wrapper.getWeb3(),
            this.address
        );

        this.debtAccounts.push(account);
    }

    /**
     * 
     * Let one user to withdraw all its deposited DAI.
     * 
     * @param account - The user to withdraw DAI.
     */
    withdrawDeposit = async (account: string) => {
        await withdrawAll(
            "DAI",
            this.gasPriceGetter.getLatestPrice(),
            account,
            this.web3Wrapper.getWeb3(),
            this.address

        );
    }

    /**
     * Let all users to withdraw its deposited DAI.
     */
    withdrawAllDeposit = async () => {
        for (let i = 0; i < this.accounts.length; ++i) {
            try {
                const depositBalanceAmt = await depositBalance(
                    "DAI",
                    this.accounts[i],
                    this.owner,
                    this.web3Wrapper.getWeb3(),
                    this.address
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

    /**
     * Reset the deposit and borrow balance of all the user to zero.
     */
    reset = async () => {
        await this.resetAllPrice();
        await this.clearAllDebt();
        await this.withdrawAllDeposit();

        this.debtAccounts = [];
    }


    /**
     * Call runGenerate and runReset
     */
    start = () => {
        logger.info({
            at: 'TestGenerator#start',
            message: 'Starting TestGenerator'
        });
        this.runGenerate();
        this.runReset();
    }

    /**
     * Start an inifinet loop to generate liquidatable account.
     */
    runGenerate = async () => {
        logger.info({
            at: 'TestGenerator#runGenerate',
            message: 'Starting generating liquidatable accounts'
        });
        for (; ;) {
            if (this.killed) return;
            try {
                await this.generateLiquidatableAccounts(1);
            } catch (err) {
                logger.error({
                    at: "TestGenerator#runGenerate",
                    message: `Failed to generate liquidatable account`,
                    error: err.message
                });
            }
            await this.wait(this.generateFreqMilliSec);
        }
    }

    /**
     * 
     * Generate some liquidatable accounts.
     * 
     * @param num - The number of liquidatable accounts we want to generate.
     */
    generateLiquidatableAccounts = async (num: number) => {
        for (let i = 0; i < num; ++i) {
            await this.generateDebtAccounts();
        }
        await this.discountOneToken(0);
    }

    /**
     * Start an infinite loop to call reset.
     */
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
            await this.wait(this.resetFreqMilliSec);

        }
    }

    /**
     * Check whether for each user, its borrow balance and deposit balance are all zero.
     */
    checkStatus = async () => {
        for (let account of this.accounts) {

            let borrowDAIAmt = (await borrowBalance(
                "DAI",
                account,
                this.owner,
                this.web3Wrapper.getWeb3(),
                this.address
            )).toString();

            let depositDAIAmt = (await depositBalance(
                "DAI",
                account,
                this.owner,
                this.web3Wrapper.getWeb3(),
                this.address
            )).toString();

            let borrowUSDCAmt = (await borrowBalance(
                "USDC",
                account,
                this.owner,
                this.web3Wrapper.getWeb3(),
                this.address
            )).toString();

            let depositUSDCAmt = (await depositBalance(
                "USDC",
                account,
                this.owner,
                this.web3Wrapper.getWeb3(),
                this.address
            )).toString();


            if (borrowDAIAmt != "0" || depositDAIAmt != "0" || borrowUSDCAmt != '0' || depositUSDCAmt != '0') {
                logger.info({
                    at: "TestGenerator#checkStatus",
                    message: `One account doesn't have clear status
                    It's address ${account}. 
                    Its borrowed DAI amt: ${borrowDAIAmt}. 
                    Its deposited DAI amt: ${depositDAIAmt}. 
                    Its borrowed USDC amt: ${borrowUSDCAmt}.
                    Its deposited USDC amt: ${depositUSDCAmt}.`,
                });
                return false;
            }
        }

        logger.info({
            at: "TestGenerator#checkStatus",
            message: `All accounts status are cleared`,
        });
        return true;
    }

}