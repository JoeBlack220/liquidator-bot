import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import { isAccountLiquidatable, borrowBalance } from '../helper/contractsHelper';
import axios from 'axios';
import { AccountGetter } from './AccountGetter';
import { Web3Wrapper } from '../helper/web3';

export class BackendAccountGetter extends AccountGetter {

    accountNum: number;
    pageNum: number;
    limitPerReq: number;

    constructor(updateFreqSec: number, liquidatorToken: string, accountNum: number, limitPerReq: number, user: string, web3Wrapper: Web3Wrapper, address: any) {
        super(updateFreqSec, liquidatorToken, user, web3Wrapper, address);
        this.accountNum = accountNum;
        this.pageNum = 1;
        this.limitPerReq = limitPerReq;
    }

    async initialize() {

    }

    /**
     * Start the process of update accounts using backend api.
     */
    async start() {
        logger.info({
            at: 'FakeAccountGetter#start',
            message: 'Starting FakeAccountGetter'
        });
        this.runUpdateLiquidatableAccounts();
    }

    /**
     * Getter of all the accounts.
     */
    getAllAccounts() {
        return this.accounts;
    }

    /**
     * Getter of all the liquidatable accounts.
     */
    getLiquidatableAccounts() {
        return this.liquidatableAccounts;
    }

    /**
     * Update accounts by calling the backend API
     * 
     * @remark
     * At least we will get 100 accounts since the limit of each query is set to 100.
     */
    async runUpdateAccounts() {

        var curAccNum = 0, errorNum = 0;
        this.accounts = [];
        this.liquidatableAccounts = [];

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
                if (newAccounts.length < this.limitPerReq) {
                    this.pageNum = 1;
                    return;
                } else {
                    this.pageNum++;
                }
                for (let info of newAccounts) {
                    this.accounts.push(info['eth_address']);
                    if (Number(info['ltv']) >= 0.85) {
                        this.liquidatableAccounts.push(info['eth_address']);
                    }
                }
                curAccNum += newAccounts.length
            }
        }
    }

    /**
     * Start a infinite loop to upgrade liqudiatable accounts.
     */
    async runUpdateLiquidatableAccounts() {
        for (; ;) {
            if (this.killed) return;
            await this.updateLiquidatableAccounts()
            await this.wait(this.updateFreqSec);
        }

    }

    /**
     * Update liquidatable accounts by checking its liquidatable status and borrow balance in target token.
     */
    async updateLiquidatableAccounts() {
        var newLiquidatableAccounts = [];
        try {
            for (let account of this.liquidatableAccounts) {
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

                logger.info({
                    at: 'FakeAccountGetter#updateLiquidatableAccounts',
                    message: `The account ${account} has ${this.liquidatorToken} token borrow balance ${balance}, liquidatable status is ${liquidatableStatus}`
                });

                // Should have borrowed some tokens in liquidatorToken for the borrower.
                if (liquidatableStatus && balance != "0") {
                    newLiquidatableAccounts.push(account);
                }
            }
        } catch (err) {
            logger.error({
                at: 'FakeAccountGetter#updateLiquidatableAccounts',
                message: err.message
            });
        }

        logger.info({
            at: 'FakeAccountGetter#updateAccounts',
            message: "Finish one round of runUpdateAccounts"
        });

        this.liquidatableAccounts = newLiquidatableAccounts;
    }
}