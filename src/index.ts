import { logger } from './lib/logger';
import { GasPriceExecutor } from './lib/GasPriceExecutor';
import './lib/env';
import { web3 } from './proxy/web3';
// let gasPriceExecutor = new GasPriceExecutor()
// gasPriceExecutor.start();
web3.eth.getAccounts().then((acc) => {
    console.log(acc);
});

console.log();