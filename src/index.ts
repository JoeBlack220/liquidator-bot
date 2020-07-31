import { logger } from './lib/logger';
import { GasPriceExecutor } from './lib/GasPriceExecutor';
import './lib/env';
let gasPriceExecutor = new GasPriceExecutor()
gasPriceExecutor.start();
console.log("Hello world");