import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import axios from 'axios';
export class FakeAccountGetter extends TaskExecutor {
    accounts: string[];
    updateFreqSec: number;

    constructor(accounts: string[]) {
        super();
        this.accounts = accounts;
        this.updateFreqSec = Number(process.env.ACCOUNTS_UPDATE_FREQUENCY_SEC) * 1000;
    }

    start = () => {
        logger.info({
            at: 'FakeAccountGetter',
            message: 'Starting FakeAccountGetter'
        });
        this.runUpdateAccounts();
    }

    getAllAccounts = () => {
        return this.accounts;
    }

    runUpdateAccounts = async () => {
        for (; ;) {
            try {
                // do nothing
            } catch (err) {
            }

            await this.wait(this.updateFreqSec);
        }
    }
}