import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import axios from 'axios';
import Web3 from 'web3';
export class GasPriceExecutor extends TaskExecutor {

    gasStationUrl: string;
    price: number;
    updateFreqMillisec: number;
    gasPriceMultiplier: number;

    constructor(gasStationUrl: string, price: number, updateFreqMillisec: number, gasPriceMultiplier: number) {
        super();
        this.gasStationUrl = gasStationUrl;
        this.price = price;
        this.updateFreqMillisec = updateFreqMillisec;
        this.gasPriceMultiplier = gasPriceMultiplier;
    }

    start = () => {
        logger.info({
            at: 'GasUpdateExecutor#start',
            message: 'Starting gas update executor'
        });
        this.runUpdatePrice();
    }

    getLatestPrice = () => {
        return Web3.utils.toWei(this.price.toString(), 'gwei');
    }

    runUpdatePrice = async () => {
        if (this.killed) return;
        for (; ;) {
            try {
                await this.updateGasPrice();
            } catch (err) {
                logger.error({
                    at: "GasPriceExecutor#runUpdatePrice",
                    message: `Failed to update gas price from ${this.gasStationUrl}`,
                    error: err.message
                });
            }

            await this.wait(this.updateFreqMillisec);
        }
    }

    updateGasPrice = async () => {
        let newPrice: number;
        try {
            newPrice = await this.getGasPriceFromStation();
        } catch (err) {
            logger.error({
                at: 'GasPriceExecutor#updateGasPrice',
                message: 'Failed to retrieve gas price',
                error: err.message
            });
            return;
        }

        this.price = newPrice / 10 * this.gasPriceMultiplier;
        logger.info({
            at: 'GasPriceExecutor#updateGasPrice',
            message: `Successfully update price to ${this.price} gwei`,
        });

    }

    getGasPriceFromStation = async () => {
        logger.info({
            at: 'GasPriceExecutor#getGasPrice',
            message: `Fetching fast gas prices`
        });
        let res = await axios.get(this.gasStationUrl);

        return res.data.fast;
    }
}