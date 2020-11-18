import TaskExecutor from './TaskExecutor';
import { Logger } from './Logger';
import { isAccountLiquidatable, borrowBalance } from '../helper/contractsHelper';
import axios from 'axios';
import { AccountGetter } from './AccountGetter';
import { Web3Wrapper } from '../helper/Web3Wrapper';

const logger = Logger.getInstance().logger;

export class BackendAccountGetterBuilder {

    private accountGetter?: BackendAccountGetter;
    private updateFreqSec: number = 1000;
    private liquidatorToken: string = "ETH";
    private accountNum: number = 100;
    private limitPerReq: number = 100;
    private user: string = "";
    private web3Wrapper: Web3Wrapper = Web3Wrapper.getInstance();
    private address: any = {};

    public constructor() {

    }

    /**
     * Setter for updateFreqSec
     * @param updateFreqSec - How many time delay after one update.
     */
    public setUpdateFreqSec(updateFreqSec: number) {
        this.updateFreqSec = updateFreqSec;
        return this;
    }

    /**
     * Setter for liquidatorToken
     * @param liquidatorToken - The token that the liquidator will use.
     */
    public setLiquidatorToken(liquidatorToken: string) {
        this.liquidatorToken = liquidatorToken;
        return this;
    }

    /**
     * Setter for accountNum.
     * @param accountNum - How many accounts to get for one round.
     */
    public setAccountNum(accountNum: number) {
        this.accountNum = accountNum;
        return this;

    }

    /**
     * Setter for limitPerReq
     * @param limitPerReq - How many accounts to get for one query.
     */
    public setLimitPerReq(limitPerReq: number) {
        this.limitPerReq = limitPerReq;
        return this;
    }

    /**
     * Setter for user
     * @param user - The liquidator's address
     */
    public setUser(user: string) {
        this.user = user;
        return this;
    }

    /**
     * Setter for address
     * @param address - The addresses of DeFiner protocol
     */
    public setAddress(address: any) {
        this.address = address;
        return this;
    }

    /**
     * Reset the accountGetter
     */
    public reset() {
        this.accountGetter = undefined;
        return this;
    }

    /**
     * Build a new accountGetter.
     */
    public build() {

        this.accountGetter = new BackendAccountGetter(
            this.updateFreqSec,
            this.liquidatorToken,
            this.accountNum,
            this.limitPerReq,
            this.user,
            this.web3Wrapper,
            this.address
        )

        return this.accountGetter;
    }

    /**
     * Getter for accountGetter.
     */
    public getAccountGetter() {
        return this.accountGetter;
    }

}

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
            at: 'BackendAccountGetter#start',
            message: 'Starting BackendAccountGetter'
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
                // If it returns error Num for three times, just return.
                errorNum++;
            } else {
                const newAccounts = res.data.data;
                for (let info of newAccounts) {
                    this.accounts.push(info['eth_address']);
                    if (Number(info['ltv']) >= 0.85) {
                        this.liquidatableAccounts.push(info['eth_address']);
                    }
                }
                curAccNum += newAccounts.length;
                if (newAccounts.length < this.limitPerReq) {
                    this.pageNum = 1;
                    return;
                } else {
                    this.pageNum++;
                }
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
                    at: 'BackendAccountGetter#updateLiquidatableAccounts',
                    message: `The account ${account} has ${this.liquidatorToken} token borrow balance ${balance}, liquidatable status is ${liquidatableStatus}`
                });

                // Should have borrowed some tokens in liquidatorToken for the borrower.
                if (liquidatableStatus && balance != "0") {
                    newLiquidatableAccounts.push(account);
                }
            }
        } catch (err) {
            logger.error({
                at: 'BackendAccountGetter#updateLiquidatableAccounts',
                message: err.message
            });
        }

        logger.info({
            at: 'BackendAccountGetter#updateAccounts',
            message: "Finish one round of runUpdateAccounts"
        });

        this.liquidatableAccounts = newLiquidatableAccounts;
    }
}