import '../../src/lib/env'
import { expect } from 'chai';
import { getPrice } from '../../src/helper/contractsHelper';
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
        user = accounts[0];
    });

    it("Should get 100 accounts from backend API", async () => {
        const accountGetter = new AccountGetter(1000, "USDC", 100, 20, user, web3);
        await accountGetter.runUpdateAccounts();
        expect(accountGetter.accounts).to.have.lengthOf(100);
    });

    it("Should get all the accounts from backend API", async () => {
        const accountGetter = new AccountGetter(1000, "USDC", 10000, 100, user, web3);
        await accountGetter.runUpdateAccounts();
        const len1 = accountGetter.getAllAccounts().length;
        await accountGetter.runUpdateAccounts();
        const len2 = accountGetter.getAllAccounts().length;
        expect(len1).to.equal(len2);
    });

    // it("Should call backend API very fast in a short time", async () => {
    //     const accountGetter = new AccountGetter(1000, "USDC", 10000, 10, user, web3);
    //     await accountGetter.runUpdateAccounts();
    //     const len1 = accountGetter.getAllAccounts().length;
    //     await accountGetter.runUpdateAccounts();
    //     const len2 = accountGetter.getAllAccounts().length;
    //     expect(len1).to.equal(len2);
    // });

    it("Should call backend API to get all accounts and get all liquidatable accounts", async () => {

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