import '../../src/lib/env'
import { expect } from 'chai';
import { getPrice, isAccountLiquidatable } from '../../src/helper/contractsHelper';
import { getWeb3 } from '../../src/helper/web3';
import { AccountGetter } from '../../src/lib/AccountGetter';
import { assert } from 'console';
import Web3 from 'web3';

describe('Account getter', async function () {
    this.timeout(0)
    let web3: Web3;
    let user: string;

    before(async function () {
        this.timeout(0);
        web3 = getWeb3(
            "privatekey",
            "",
            "850bdc51011cbc33bd72592e494b0127d7755d468a501f50161d96c9a7f4c640",
            "https://mainnet.infura.io/v3/ea620a48fe584d2297be56bde9d5b451"
        );
        const accounts = await web3.eth.getAccounts();
        user = accounts[0]
        console.log(user);
    });

    it("Get account from API, then call contract to check its liquidatability status", async () => {
        const accountGetter = new AccountGetter(1000, "USDC", 100, 20, user, web3);
        await accountGetter.runUpdateAccounts();
        const targetAccount = accountGetter.getAllAccounts()[0];
        const status = await isAccountLiquidatable(targetAccount, user, web3);
        expect(status).to.equal(false);
        console.log("get here");
    });

    it("Get account from API, then call contract to check its liquidatability status", async () => {
        const accountGetter = new AccountGetter(1000, "USDC", 100, 20, user, web3);
        await accountGetter.runUpdateAccounts();
        const targetAccount = accountGetter.getAllAccounts()[0];
        const status = await isAccountLiquidatable(targetAccount, user, web3);
        expect(status).to.equal(false);
        console.log("get here");
    });

    after(async function () {
        const provider = web3.currentProvider;
        if (provider &&
            (provider instanceof Web3.providers.HttpProvider)
        ) {
            provider.disconnect();
        }
    });

});