import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import { isAccountLiquidatable, borrowBalance } from '../helper/contractsHelper';
import axios from 'axios';
import { Web3Wrapper } from '../helper/web3';

export abstract class AccountGetter extends TaskExecutor {

    accounts: string[];
    updateFreqSec: number;
    liquidatableAccounts: string[];
    user: string;
    liquidatorToken: string;
    web3Wrapper: Web3Wrapper;
    address: any;

    constructor(updateFreqSec: number, liquidatorToken: string, user: string, web3Wrapper: Web3Wrapper, address: any) {
        super();
        this.accounts = [];
        this.updateFreqSec = updateFreqSec;
        this.liquidatableAccounts = [];
        this.liquidatorToken = liquidatorToken;
        this.user = user;
        this.web3Wrapper = web3Wrapper;
        this.address = address;
    }

    abstract async initialize(): Promise<void>;

    abstract start(): void;

    abstract getAllAccounts(): string[];

    abstract getLiquidatableAccounts(): string[];

    abstract async runUpdateAccounts(): Promise<void>;

    abstract async runUpdateLiquidatableAccounts(): Promise<void>;

    abstract async updateLiquidatableAccounts(): Promise<void>;
}