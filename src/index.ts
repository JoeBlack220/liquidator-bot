import { logger } from './lib/logger';
import { GasPriceExecutor } from './lib/GasPriceExecutor';
import './lib/env';
import { web3 } from './proxy/web3';
import { getInstance } from './lib/getContractInstance'
// let gasPriceExecutor = new GasPriceExecutor()
// gasPriceExecutor.start();
// web3.eth.getAccounts().then((acc) => {
//     console.log(acc);
// });

(async () => {
    const savingAccount = await getInstance("SavingAccount", web3, "0x772a1211551D431fa9aC12D56640163495309F5d");
    const blockNum = savingAccount.methods.getBlockNumber().call();
    return blockNum;
})().then(e => console.log(e))


