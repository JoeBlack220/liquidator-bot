import { web3 } from './web3';
import { getInstance } from './getContractInstance';
const { BN } = require("@openzeppelin/test-helpers");
import { address } from '../lib/address';

export const liquidate = async (targetAccount: string, liquidatorAccount: string, tokenName: string, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['SavingAccount']);
    const tokenAddress = address[tokenName];

    await savingAccount.methods.liquidate(targetAccount, tokenAddress).send({ from: liquidatorAccount, gas: 4000000, gasPrice });
}

export const isAccountLiquidatable = async (account: string, owner: string) => {
    const Accounts = await getInstance("Accounts", web3, address['Accounts']);
    var status = false;

    // Currently, the design of isAccountLiquidatable function will throw errors if 
    // LTV is larger than 0.95. Actually, this should return false so we catch this error
    // and return false.
    try {
        status = await Accounts.methods.isAccountLiquidatable(account).call({ from: account });
    } catch (err) {
        // Do nothing
    }

    return status;
}

export const borrow = async (account: string, tokenName: string, amount: any, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['SavingAccount']);
    const tokenAddress = address[tokenName];
    await savingAccount.methods.borrow(tokenAddress, amount).send({ from: account, gas: 1000000, gasPrice });
}

export const mint = async (account: string, tokenName: string, amount: any, owner: string, gasPrice: number) => {
    const tokenAddress = address[tokenName];
    const mockERC20 = await getInstance("MockERC20", web3, tokenAddress);
    await mockERC20.methods.transfer(account, amount).send({ from: owner, gasPrice });
    await mockERC20.methods.approve(address['SavingAccount'], amount).send({ from: account, gasPrice });
}

export const deposit = async (account: string, tokenName: string, amount: any, owner: string, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['SavingAccount']);
    const tokenAddress = address[tokenName];
    await savingAccount.methods.deposit(tokenAddress, amount).send({ from: account, gas: 1000000, gasPrice });
}

export const updatePrice = async (tokenName: string, updatedPrice: any, owner: string, gasPrice: number) => {
    const mockChainLinkForDAI = await getInstance("MockChainLinkAggregator", web3, address['mockChainlinkAggregatorfor' + tokenName]);
    await mockChainLinkForDAI.methods.updateAnswer(updatedPrice).send({ from: owner, gasPrice });
}

export const getPrice = async (tokenName: string, owner: string) => {
    const MockChainLinkAggregator = await getInstance("MockChainLinkAggregator", web3, address['mockChainlinkAggregatorfor' + tokenName]);
    return await MockChainLinkAggregator.methods.latestAnswer().call({ from: owner });
}

export const borrowBalance = async (tokenName: string, account: string) => {
    const Accounts = await getInstance("Accounts", web3, address['Accounts']);
    const tokenAddress = address[tokenName];
    const res = await Accounts.methods.getBorrowBalanceCurrent(tokenAddress, account).call({ from: account });
    return res;
}

export const repay = async (account: string, tokenName: string, amount: any, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['SavingAccount']);
    const tokenAddress = address[tokenName];
    await savingAccount.methods.repay(tokenAddress, amount).send({ from: account, gas: 2000000, gasPrice });
}

export const withdraw = async (account: string, tokenName: string, amount: any, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['SavingAccount']);
    const tokenAddress = address[tokenName];
    await savingAccount.methods.wtihdraw(tokenAddress, amount).send({ from: account, gas: 2000000, gasPrice });
}

export const withdrawAll = async (account: string, tokenName: string, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['SavingAccount']);
    const tokenAddress = address[tokenName];
    await savingAccount.methods.withdrawAll(tokenAddress).send({ from: account, gas: 2000000, gasPrice });
}

export const depositBalance = async (tokenName: string, account: string) => {
    const Accounts = await getInstance("Accounts", web3, address['Accounts']);
    const tokenAddress = address[tokenName];
    return await Accounts.methods.getDepositBalanceCurrent(tokenAddress, account).call({ from: account });
}