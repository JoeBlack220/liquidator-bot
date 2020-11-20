import { addressGetter } from '../helper/addressGetter';
import { Web3Wrapper } from '../helper/Web3Wrapper';
import { getEnvVarStr, getEnvVarNumber } from '../helper/getEnv';
import { AccountGetter } from '../lib/AccountGetter';
import TaskExecutor from '../lib/TaskExecutor';
import { GasPriceExecutor } from '../lib/GasPriceExecutor';
import { BackendAccountGetter, BackendAccountGetterBuilder } from '../lib/BackendAccountGetter';
import { LiquidateAccountsExecutor, LiquidateAccountsExecutorBuilder } from '../lib/LiquidateAccountsExecutor';
import { Logger } from '../lib/Logger';

const logger = Logger.getInstance().logger;

export class App extends TaskExecutor {

    public accountBuilder: BackendAccountGetterBuilder;
    public accountGetter: BackendAccountGetter;
    public gasGetter: GasPriceExecutor;
    public liquidateExecutorBuilder: LiquidateAccountsExecutorBuilder;
    public liquidateExecutor: LiquidateAccountsExecutor;
    public web3Wrapper: Web3Wrapper;
    public address: any;
    public liquidateFreq: number;

    constructor() {
        super();

        const liquidatorToken = getEnvVarStr("LIQUIDATOR_TOKEN");
        const gasStationUrl = getEnvVarStr("GAS_STATION_URL");
        const gasUpdateFreq = getEnvVarNumber("GAS_PRICE_UPDATE_FREQUENCY_MILLI_SEC");
        const initialGasPrice = getEnvVarNumber("GAS_INITIAL_PRICE");
        const accountUpdateFreq = getEnvVarNumber("ACCOUNTS_UPDATE_FREQUENCY_MILLI_SEC");
        const liquidateFreq = getEnvVarNumber("LIQUIDATE_INTERVAL_MILLI_SEC");
        const providerType = getEnvVarStr("PROVIDER_TYPE");
        const privateKey = getEnvVarStr("PRIVATE_KEY");
        const publicKey = getEnvVarStr("PUBLIC_KEY");
        const accountNum = getEnvVarNumber("ACCOUNT_NUM");
        const mnemonic = getEnvVarStr("USER_MNEMONIC");
        const accessNodeUrl = getEnvVarStr("ACCESS_NODE_URL");
        const gasPriceMultiplier = getEnvVarNumber("GAS_PRICE_MULTIPLIER");
        const network = "mainnet";

        this.liquidateFreq = liquidateFreq;
        this.web3Wrapper = Web3Wrapper.getInstance();

        this.web3Wrapper.setWeb3(
            providerType,
            mnemonic,
            privateKey,
            accessNodeUrl
        );

        this.address = addressGetter(network);

        this.gasGetter = new GasPriceExecutor(
            gasStationUrl,
            initialGasPrice,
            gasUpdateFreq,
            gasPriceMultiplier,
        );

        this.accountBuilder = new BackendAccountGetterBuilder();

        this.accountGetter = this.accountBuilder
            .setAccountNum(accountNum)
            .setAddress(this.address)
            .setLimitPerReq(100)
            .setLiquidatorToken(liquidatorToken)
            .setUpdateFreqSec(10000)
            .setUser(publicKey)
            .build();

        this.liquidateExecutorBuilder = new LiquidateAccountsExecutorBuilder();

        this.liquidateExecutor = this.liquidateExecutorBuilder
            .setAccountGetter(this.accountGetter)
            .setAddress(this.address)
            .setGasPriceGetter(this.gasGetter)
            .setLiquidatorToken(liquidatorToken)
            .setUpdateFreqSec(10000)
            .setUser(publicKey)
            .build()
    }

    /**
     * Start the process of liquidator bot
     * 
     * @remark - 1. Get all the accounts from account list API
     *           2. Only retain the liquidatable accounts.
     *           3. Liquidate the accounts get from step 2
     */
    start = async () => {
        this.gasGetter.runUpdatePrice();
        for (; ;) {

            await this.accountGetter.runUpdateAccounts();
            await this.accountGetter.updateLiquidatableAccounts();
            await this.liquidateExecutor.liquidateAccounts();


            logger.info({
                at: 'App#start',
                message: "Finish one round of liquidation."
            });

            this.wait(this.liquidateFreq);
        }
    }
}


