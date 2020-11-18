import TaskExecutor from './TaskExecutor';
import { Logger } from './Logger';
import { AccountGetter } from './AccountGetter';
import { liquidate, isAccountLiquidatable } from '../helper/contractsHelper';
import { GasPriceExecutor } from './GasPriceExecutor';
import { Web3Wrapper } from '../helper/Web3Wrapper';
import { add } from 'winston';

const logger = Logger.getInstance().logger;

export class LiquidateAccountsExecutorBuilder {

    private liquidateAccountsExecutor?: LiquidateAccountsExecutor;
    private accountGetter?: AccountGetter;
    private gasPriceGetter?: GasPriceExecutor;
    private updateFreqSec: number = 10000;
    private liquidatorToken: string = "ETH";
    private user: string = "";
    private web3Wrapper: Web3Wrapper = Web3Wrapper.getInstance();
    private address: any

    /**
     * Setter for accountGetter
     * @param accountGetter - Account getter
     */
    public setAccountGetter(accountGetter: AccountGetter) {
        this.accountGetter = accountGetter;
        return this;
    }

    /**
     * Setter for gasPriceGetter
     * @param gasPriceGetter - gas price getter
     */
    public setGasPriceGetter(gasPriceGetter: GasPriceExecutor) {
        this.gasPriceGetter = gasPriceGetter;
        return this;
    }

    /**
     * Setter for updateFreaSec
     * @param updateFreqSec - After one liquidate process, how much time to sleep before the next round.
     */
    public setUpdateFreqSec(updateFreqSec: number) {
        this.updateFreqSec = updateFreqSec;
        return this;
    }

    /**
     * Setter for liquidatorToken
     * @param liquidatorToken - The kind of token that the liquidator will use.
     */
    public setLiquidatorToken(liquidatorToken: string) {
        this.liquidatorToken = liquidatorToken;
        return this;
    }

    /**
     * Setter for user
     * @param user - The public key of the liquidator.
     */
    public setUser(user: string) {
        this.user = user;
        return this;
    }

    /**
     * Setter for address
     * @param address - The addresses of DeFiner's protocols
     */
    public setAddress(address: any) {
        this.address = address;
        return this;
    }

    /**
     * Reset the liquidateAccountsExecutor
     */
    public reset() {
        this.liquidateAccountsExecutor = undefined;
    }

    /**
     * Build a new instance of liquidateAccountsExecutor
     */
    public build() {
        if (!this.accountGetter || !this.gasPriceGetter) {
            throw new Error("You have to set accountGetter and gasPriceGetter first");
        }

        this.liquidateAccountsExecutor = new LiquidateAccountsExecutor(
            this.accountGetter,
            this.gasPriceGetter,
            this.updateFreqSec,
            this.liquidatorToken,
            this.user,
            this.web3Wrapper,
            this.address
        )

        return this.liquidateAccountsExecutor;
    }

    /**
     * Return the current instance of liquidateAccountsExecutor
     */
    public getLiquidatableAccounts() {
        return this.liquidateAccountsExecutor;
    }

}

export class LiquidateAccountsExecutor extends TaskExecutor {

    accountsGetter: AccountGetter;
    updateFreqSec: number;
    liquidatorToken: string;
    gasPriceGetter: GasPriceExecutor;
    user: string;
    web3Wrapper: Web3Wrapper;
    address: any;

    constructor(accountGetter: AccountGetter, gasPriceGetter: GasPriceExecutor, updateFreqSec: number, liquidatorToken: string, user: string, web3Wrapper: Web3Wrapper, address: any) {
        super();
        this.accountsGetter = accountGetter;
        this.gasPriceGetter = gasPriceGetter;
        this.updateFreqSec = updateFreqSec;
        this.liquidatorToken = liquidatorToken;
        this.web3Wrapper = web3Wrapper;
        this.user = user;
        this.address = address;
    }

    /**
     * Call runLiquidateAccounts
     */
    start = () => {
        logger.info({
            at: 'LiquidateAccountsExecutor#start',
            message: 'Starting LiquidateAccountsExecutor'
        });
        this.runLiquidateAccounts();
    }

    /**
     * Liquidate the liquidatable accounts get from accounts getter one by one.
     */
    liquidateAccounts = async () => {
        const liquidatableAccounts = this.accountsGetter.getLiquidatableAccounts();
        logger.info({
            at: 'LiquidateAccountsExecutor#liquidateAccounts',
            message: `Found liquidatable ${liquidatableAccounts.length} accounts, start to liquidate`
        });
        for (let account of liquidatableAccounts) {
            try {
                await this.liquidateOne(account);
            } catch (err) {
                logger.error({
                    at: 'LiquidateAccountsExecutor#liquidateAccounts',
                    message: `Fail to liquidate account ${account}`,
                    err: err
                });
            }
        }
    }

    /**
     * 
     * Liquidate one given account.
     * 
     * @remark - Before liquidation, call isAccountLiquidatable to check again
     * 
     * @param account - The account to be liquidated
     */
    liquidateOne = async (account: string) => {
        let status = await isAccountLiquidatable(account, this.user, this.web3Wrapper.getWeb3(), this.address);
        const price = this.gasPriceGetter.getLatestPrice();

        if (status) {
            logger.info({
                at: 'LiquidateAccountsExecutor#liquidateOne',
                message: `Start to liquidate, ${account},`
            });

            await liquidate(account, this.user, this.liquidatorToken, price, this.web3Wrapper.getWeb3(), this.address);
            status = await isAccountLiquidatable(account, this.user, this.web3Wrapper.getWeb3(), this.address);

            logger.info({
                at: 'LiquidateAccountsExecutor#liquidateOne',
                message: `Successfully liquidated ${account}, now the liquidatable status is ${status}.`
            });
        }
    }

    /**
     * Start an infinite loop to liquidate accounts.
     */
    runLiquidateAccounts = async () => {
        for (; ;) {
            if (this.killed) return;
            try {
                const accounts: string[] = this.accountsGetter.getLiquidatableAccounts();
                for (const account of accounts) {
                    let status = await isAccountLiquidatable(account, this.user, this.web3Wrapper.getWeb3(), this.address);
                    const price = this.gasPriceGetter.getLatestPrice();

                    if (status) {
                        logger.info({
                            at: 'LiquidateAccountsExecutor#runLiquidateAccounts',
                            message: `Found liquidatable account ${account}, start to liquidate`
                        });
                        await liquidate(account, this.user, this.liquidatorToken, price, this.web3Wrapper.getWeb3(), this.address);
                        status = await isAccountLiquidatable(account, this.user, this.web3Wrapper.getWeb3(), this.address);

                        logger.info({
                            at: 'LiquidateAccountsExecutor#runLiquidateAccounts',
                            message: `Successfully liquidated ${account}, now the liquidatable status is ${status}.`
                        });
                    }
                }

            } catch (err) {
                logger.error({
                    at: 'LiquidateAccountsExecutor#runLiquidateAccounts',
                    message: "Failed to liquidate account.",
                    error: err.message
                });
            }

            logger.info({
                at: 'LiquidateAccountsExecutor#runLiquidateAccounts',
                message: "Finish one round of runLiquidateAccounts"
            });

            await this.wait(this.updateFreqSec);
        }
    }
}