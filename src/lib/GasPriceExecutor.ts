import TaskExecutor from './TaskExecutor';
import { logger } from './logger';
import axios from 'axios';
export class GasPriceExecutor extends TaskExecutor {
    gasStationUrl: string;
    price: number;
    updateFreqSec: number;
    fast: boolean;
    constructor() {
        super();
        this.gasStationUrl = String(process.env.GAS_STATION_URL);
        this.price = Number(process.env.GAS_INITIAL_PRICE || 1000);
        this.updateFreqSec = Number(process.env.GAS_PRICE_UPDATE_FREQUENCY_SEC) * 1000;
        this.fast = process.env.GAS_PRICE_LEVEL ? process.env.GAS_PRICE_LEVEL === 'fast' : false;
    }

    start = () => {
        logger.info({
            at: 'GasUpdateExecutor#start',
            message: 'Starting gas update executor'
        });
        this.runUpdatePrice();
    }

    getLatestPrice = () => {
        return this.price;
    }

    runUpdatePrice = async () => {
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

            await this.wait(this.updateFreqSec);
        }
    }

    updateGasPrice = async () => {
        let newPrice: number;
        try {
            newPrice = await this.getGasPriceFromStation();
            logger.info({
                at: 'GasPriceExecutor#updateGasPrice',
                message: `Successfully update price to ${newPrice}`,
            });
        } catch (err) {
            logger.error({
                at: 'GasPriceExecutor#updateGasPrice',
                message: 'Failed to retrieve gas price',
                error: err.message
            });
            return;
        }

        this.price = newPrice;

    }

    getGasPriceFromStation = async () => {
        logger.info({
            at: 'GasPriceExecutor#getGasPrice',
            message: `Fetching ${this.fast ? "fast" : "average"} gas prices`
        });
        let res = await axios.get(this.gasStationUrl);
        if (this.fast) {
            return res.data.fast;
        } else {
            return res.data.average;
        }
    }
}