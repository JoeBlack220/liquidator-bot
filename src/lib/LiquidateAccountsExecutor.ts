import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import { FakeAccountGetter } from './FakeAccountGetter';
import { liquidate, isAccountLiquidatable } from '../helper/contractsHelper';
import { GasPriceExecutor } from './GasPriceExecutor';
import Web3 from 'web3';

export class LiquidateAccountsExecutor extends TaskExecutor {
    accountsGetter: FakeAccountGetter;
    updateFreqSec: number;
    liquidatorToken: string;
    gasPriceGetter: GasPriceExecutor;
    user: string;
    web3: Web3;

    constructor(accountGetter: FakeAccountGetter, gasPriceGetter: GasPriceExecutor, updateFreqSec: number, liquidatorToken: string, user: string, web3: Web3) {
        super();
        this.accountsGetter = accountGetter;
        this.gasPriceGetter = gasPriceGetter;
        this.updateFreqSec = updateFreqSec;
        this.liquidatorToken = liquidatorToken;
        this.web3 = web3;
        this.user = user;
    }

    start = () => {
        logger.info({
            at: 'LiquidateAccountsExecutor#start',
            message: 'Starting LiquidateAccountsExecutor'
        });
        this.runLiquidateAccounts();
    }

    runLiquidateAccounts = async () => {
        for (; ;) {
            if (this.killed) return;
            try {
                const accounts: string[] = this.accountsGetter.getAllAccounts();
                for (const account of accounts) {
                    let status = await isAccountLiquidatable(account, this.user, this.web3);
                    const price = this.gasPriceGetter.getLatestPrice();

                    if (status) {
                        logger.info({
                            at: 'LiquidateAccountsExecutor#runLiquidateAccounts',
                            message: `Found liquidatable account ${account}, start to liquidate`
                        });
                        await liquidate(account, this.user, this.liquidatorToken, price, this.web3);
                        status = await isAccountLiquidatable(account, this.user, this.web3);

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