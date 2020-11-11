import '../../src/lib/env'
import { expect } from 'chai';
import { getPrice } from '../../src/helper/contractsHelper';
import { web3 } from '../../src/helper/web3';
describe('Lotter Contract', () => {
    it("Get the price from a contract", async () => {
        const accounts = await web3.eth.getAccounts();
        const price = await getPrice("USDC", accounts[0]);
        console.log(price);
    });
});