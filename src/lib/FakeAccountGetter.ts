import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import { isAccountLiquidatable, tokenBalance } from '../helper/contractsHelper';
export class FakeAccountGetter extends TaskExecutor {

    accounts: string[];
    updateFreqSec: number;
    liquidatableAccounts: string[];
    owner: string;
    liquidatorToken: string;

    constructor(accounts: string[]) {
        super();
        this.accounts = accounts;
        this.owner = accounts[0];
        this.updateFreqSec = Number(process.env.ACCOUNTS_UPDATE_FREQUENCY_SEC) * 1000;
        this.liquidatableAccounts = [];
        this.liquidatorToken = process.env.LIQUIDATOR_TOKEN || "ETH";

    }

    start = () => {
        logger.info({
            at: 'FakeAccountGetter#start',
            message: 'Starting FakeAccountGetter'
        });
        this.runUpdateAccounts();
    }

    getAllAccounts = () => {
        return this.accounts;
    }

    getLiquidatableAccounts = () => {
        return this.liquidatableAccounts;
    }

    runUpdateAccounts = async () => {
        for (; ;) {
            this.liquidatableAccounts = [];
            try {
                for (let account of this.accounts) {
                    const liquidatableStatus = await isAccountLiquidatable(account, this.owner);
                    const balance = await tokenBalance(this.liquidatorToken, account);
                    if (liquidatableStatus && balance[1]) {
                        this.liquidatableAccounts.push(account);
                    }
                }
            } catch (err) {
                logger.error({
                    ar: 'FakeAccountGetter#runUpdateAccounts',
                    message: err.message
                });
            }

            logger.info({
                at: 'FakeAccountGetter#runUpdateAccounts',
                message: "Finish one round of runUpdateAccounts"
            });
            await this.wait(this.updateFreqSec);
        }
    }
}