import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import { isAccountLiquidatable, borrowBalance } from '../helper/contractsHelper';
import axios from 'axios';
import Web3 from 'web3';

export class AccountGetter extends TaskExecutor {

    accounts: string[];
    updateFreqSec: number;
    liquidatableAccounts: string[];
    liquidatorToken: string;
    accountNum: number;
    pageNum: number;
    limitPerReq: number;
    user: string;
    web3: Web3;

    constructor(updateFreqSec: number, liquidatorToken: string, accountNum: number, limitPerReq: number, user: string, web3: Web3) {
        super();
        this.accounts = [];
        this.updateFreqSec = updateFreqSec;
        this.liquidatableAccounts = [];
        this.liquidatorToken = liquidatorToken;
        this.accountNum = accountNum;
        this.pageNum = 1;
        this.limitPerReq = limitPerReq;
        this.user = user;
        this.web3 = web3;
    }

    initialize = async () => {

    }

    start = () => {
        logger.info({
            at: 'FakeAccountGetter#start',
            message: 'Starting FakeAccountGetter'
        });
        this.runUpdateLiquidatableAccounts();
    }

    getAllAccounts = () => {
        return this.accounts;
    }

    getLiquidatableAccounts = () => {
        return this.liquidatableAccounts;
    }

    // At least, this will return 100 accounts.
    runUpdateAccounts = async () => {
        var curAccNum = 0, errorNum = 0;
        this.accounts = [];

        while (curAccNum < this.accountNum && errorNum < 3) {
            const accountListAPI = `https://stat.definer.cn/api_v2/market/address_list?page=${this.pageNum}&limit=${this.limitPerReq}`;
            let res = await axios.get(accountListAPI);
            if (res.data.code != 200) {
                logger.error({
                    at: 'AccountGetter#runUpdateAccounts',
                    message: 'Failed to retrieve accounts from stat API',
                    data: res.data
                });
                errorNum++;
            } else {
                const newAccounts = res.data.data;
                this.accounts = this.accounts.concat(newAccounts);
                if (newAccounts.length < this.limitPerReq) {
                    this.pageNum = 1;
                    return;
                } else {
                    this.pageNum++;
                }
                curAccNum += newAccounts.length
            }
        }
    }

    runUpdateLiquidatableAccounts = async () => {
        for (; ;) {
            if (this.killed) return;
            this.liquidatableAccounts = [];

            try {
                for (let account of this.accounts) {
                    const liquidatableStatus = await isAccountLiquidatable(account, this.user, this.web3);
                    const balance = await borrowBalance(this.liquidatorToken, account, this.user, this.web3);
                    // Should have borrowed some tokens in liquidatorToken for the borrower.
                    if (liquidatableStatus && balance) {
                        this.liquidatableAccounts.push(account);
                    }
                }
            } catch (err) {
                logger.error({
                    at: 'FakeAccountGetter#runUpdateAccounts',
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