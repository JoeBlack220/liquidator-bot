import { AccountGetter } from './AccountGetter';
import { logger } from './logger';
import { isAccountLiquidatable, borrowBalance } from '../helper/contractsHelper';
import { Web3Wrapper } from '../helper/web3';

export class GanacheAccountGetter extends AccountGetter {

    constructor(accounts: string[], updateFreqSec: number, user: string, liquidatorToken: string, web3Wrapper: Web3Wrapper, address: any) {
        super(updateFreqSec, liquidatorToken, user, web3Wrapper, address);
        this.accounts = accounts;
    }

    async initialize() {
        // Do nothing now.
    }

    start() {
        logger.info({
            at: 'FakeAccountGetter#start',
            message: 'Starting FakeAccountGetter'
        });
        this.runUpdateAccounts();
    }

    getAllAccounts() {
        return this.accounts;
    }

    getLiquidatableAccounts() {
        return this.liquidatableAccounts;
    }

    async runUpdateAccounts() {

    }

    async updateLiquidatableAccounts() {
        this.liquidatableAccounts = [];
        try {
            for (let account of this.accounts) {
                const liquidatableStatus = await isAccountLiquidatable(
                    account,
                    this.user,
                    this.web3Wrapper.getWeb3(),
                    this.address
                );

                const balance = (await borrowBalance(
                    this.liquidatorToken,
                    account,
                    this.user,
                    this.web3Wrapper.getWeb3(),
                    this.address
                )).toString();

                // Should have borrowed some tokens in liquidatorToken for the borrower.
                if (liquidatableStatus && balance != "0") {
                    this.liquidatableAccounts.push(account);
                }
            }
        } catch (err) {
            logger.error({
                at: 'FakeAccountGetter#updateLiquidatableAccounts',
                message: err.message
            });
        }

        logger.info({
            at: 'FakeAccountGetter#updateLiquidatableAccounts',
            message: "Finish one round of runUpdateAccounts"
        });
    }


    async runUpdateLiquidatableAccounts() {
        for (; ;) {
            if (this.killed) return;
            await this.updateLiquidatableAccounts();
            await this.wait(this.updateFreqSec);
        }
    }
}