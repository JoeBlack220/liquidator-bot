// import '../../src/helper/env'
// import { expect } from 'chai';
// import { GasPriceExecutor } from '../../src/lib/GasPriceExecutor';
// import { Web3Wrapper } from '../../src/helper/web3';
// import Web3 from 'web3';
// import { TestGenerator } from '../../src/test-helper/TestGenerator';
// import { addressGetter } from '../../src/helper/addressGetter';
// import { isAccountLiquidatable } from '../../src/helper/contractsHelper';
// const { BN } = require("@openzeppelin/test-helpers");

// describe('TestGenerator', async function () {
//     this.timeout(0)
//     let web3: Web3;
//     let web3Wrapper: Web3Wrapper;
//     let user: string;
//     let gasPriceExecutor: GasPriceExecutor;
//     let accounts: string[];
//     let testGenerator: TestGenerator;
//     let address: any;

//     before(async function () {
//         this.timeout(0);

//         web3Wrapper = Web3Wrapper.getInstance();
//         web3Wrapper.setWeb3(
//             "ganache",
//             "",
//             "",
//             ""
//         );
//         web3 = web3Wrapper.getWeb3();
//         accounts = await web3.eth.getAccounts();
//         user = accounts[0];
//         address = addressGetter("development");

//         gasPriceExecutor = new GasPriceExecutor(
//             "http://ethgasstation.info/json/ethgasAPI.json",
//             25,
//             2000,
//             1,
//         );

//         testGenerator = new TestGenerator(
//             accounts,
//             gasPriceExecutor,
//             10000,
//             10000,
//             web3Wrapper,
//             address
//         );

//         await testGenerator.init();
//     });

//     it("Should clear the debt status of each account", async () => {
//         await testGenerator.reset();
//         const status = await testGenerator.checkStatus();
//         expect(status).to.equal(true);
//     });

//     it("Should generate a debt account", async () => {
//         await testGenerator.reset();
//         await testGenerator.generateLiquidatableAccounts(1);
//         expect(testGenerator.debtAccounts).to.have.lengthOf(1);
//     });

//     it("Should generate a debt account then clear its debt status", async () => {
//         await testGenerator.reset();
//         await testGenerator.generateLiquidatableAccounts(1);
//         expect(testGenerator.debtAccounts).to.have.lengthOf(1);

//         var status = await testGenerator.checkStatus();
//         const liquidatble = await isAccountLiquidatable(testGenerator.debtAccounts[0], accounts[0], web3, address);
//         expect(liquidatble).to.equal(true);
//         expect(status).to.equal(false);

//         await testGenerator.reset();
//         expect(testGenerator.debtAccounts).to.have.lengthOf(0);

//         status = await testGenerator.checkStatus();
//         expect(status).to.equal(true);
//     });

//     it("Should generate a debt account then clear its debt status, then generate another debt account", async () => {
//         await testGenerator.reset();
//         await testGenerator.generateLiquidatableAccounts(1);
//         expect(testGenerator.debtAccounts).to.have.lengthOf(1);

//         await testGenerator.reset();
//         expect(testGenerator.debtAccounts).to.have.lengthOf(0);

//         var status = await testGenerator.checkStatus();
//         expect(status).to.equal(true);

//         await testGenerator.generateLiquidatableAccounts(1);
//         expect(testGenerator.debtAccounts).to.have.lengthOf(1);

//         var status = await testGenerator.checkStatus();
//         expect(status).to.equal(false);
//     });

//     it("Should generate three debt accounts then reset their balances to zero", async () => {
//         await testGenerator.reset();
//         await testGenerator.generateLiquidatableAccounts(3);
//         expect(testGenerator.debtAccounts).to.have.lengthOf(3);

//         const liquidatableStatus1 = await isAccountLiquidatable(testGenerator.debtAccounts[0], accounts[0], web3, address);
//         const liquidatableStatus2 = await isAccountLiquidatable(testGenerator.debtAccounts[1], accounts[0], web3, address);
//         const liquidatableStatus3 = await isAccountLiquidatable(testGenerator.debtAccounts[2], accounts[0], web3, address);
//         expect(liquidatableStatus1).to.equal(true);
//         expect(liquidatableStatus2).to.equal(true);
//         expect(liquidatableStatus3).to.equal(true);

//         await testGenerator.reset();
//         const status = await testGenerator.checkStatus();
//         expect(status).to.equal(true);
//     })

//     after(async function () {
//         const provider = web3.currentProvider;
//         if (provider &&
//             (provider instanceof Web3.providers.HttpProvider)
//         ) {
//             provider.disconnect();
//         }
//     });

// });