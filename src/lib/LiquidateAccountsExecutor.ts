import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import { FakeAccountGetter } from './FakeAccountGetter';
import { liquidate, isAccountLiquidatable } from '../helper/contractsHelper';
import { GasPriceExecutor } from './GasPriceExecutor';

export class LiquidateAccountsExecutor extends TaskExecutor {
    accountsGetter: FakeAccountGetter;
    updateFreqSec: number;
    liquidatorToken: string;
    gasPriceGetter: GasPriceExecutor;

    constructor(accountGetter: FakeAccountGetter, gasPriceGetter: GasPriceExecutor) {
        super();
        this.accountsGetter = accountGetter;
        this.gasPriceGetter = gasPriceGetter;
        this.updateFreqSec = Number(process.env.LIQUIDATE_INTERVAL) * 1000;
        this.liquidatorToken = process.env.LIQUIDATOR_TOKEN || "DAI";

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
            try {
                const accounts: string[] = this.accountsGetter.getAllAccounts();
                for (const account of accounts) {
                    let status = await isAccountLiquidatable(account, accounts[0]);
                    const price = this.gasPriceGetter.getLatestPrice();

                    if (status) {
                        logger.info({
                            at: 'LiquidateAccountsExecutor#runLiquidateAccounts',
                            message: `Found liquidatable account ${account}, start to liquidate`
                        });
                        await liquidate(account, accounts[0], this.liquidatorToken, price);
                        status = await isAccountLiquidatable(account, accounts[0]);

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