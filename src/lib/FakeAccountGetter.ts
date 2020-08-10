import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import { isAccountLiquidatable } from '../helper/contractsHelper';
import axios from 'axios';
export class FakeAccountGetter extends TaskExecutor {

    accounts: string[];
    updateFreqSec: number;
    liquidatableAccounts: string[];
    owner: string;

    constructor(accounts: string[]) {
        super();
        this.accounts = accounts;
        this.owner = accounts[0];
        this.updateFreqSec = Number(process.env.ACCOUNTS_UPDATE_FREQUENCY_SEC) * 1000;
        this.liquidatableAccounts = [];
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
                    const liquidatableStatus = isAccountLiquidatable(account, this.owner);
                    if (liquidatableStatus) {
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