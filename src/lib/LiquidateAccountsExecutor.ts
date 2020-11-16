import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import { AccountGetter } from './AccountGetter';
import { liquidate, isAccountLiquidatable } from '../helper/contractsHelper';
import { GasPriceExecutor } from './GasPriceExecutor';
import { Web3Wrapper } from '../helper/web3';

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

    start = () => {
        logger.info({
            at: 'LiquidateAccountsExecutor#start',
            message: 'Starting LiquidateAccountsExecutor'
        });
        this.runLiquidateAccounts();
    }

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