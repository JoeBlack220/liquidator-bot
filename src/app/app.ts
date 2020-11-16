import { addressGetter } from '../helper/addressGetter';
import { Web3Wrapper } from '../helper/web3';
import { getEnvVarStr, getEnvVarNumber } from '../helper/getEnv';
import TaskExecutor from '../lib/TaskExecutor';
import { GasPriceExecutor } from '../lib/GasPriceExecutor';
import { BackendAccountGetter } from '../lib/BackendAccountGetter';
import { LiquidateAccountsExecutor } from '../lib/LiquidateAccountsExecutor';
import { logger } from '../lib/logger';

export class App extends TaskExecutor {

    accountGetter: BackendAccountGetter;
    gasGetter: GasPriceExecutor;
    liquidateExecutor: LiquidateAccountsExecutor;
    web3Wrapper: Web3Wrapper;
    address: any;
    liquidateFreq: number;

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

        this.accountGetter = new BackendAccountGetter(
            accountUpdateFreq,
            liquidatorToken,
            accountNum,
            100,
            publicKey,
            this.web3Wrapper,
            this.address
        );

        this.liquidateExecutor = new LiquidateAccountsExecutor(
            this.accountGetter,
            this.gasGetter,
            liquidateFreq,
            liquidatorToken,
            publicKey,
            this.web3Wrapper,
            this.address
        )
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


