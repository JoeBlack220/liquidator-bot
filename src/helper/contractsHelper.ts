import { web3 } from './web3';
import { getInstance } from './getContractInstance';
const { BN } = require("@openzeppelin/test-helpers");
import { address } from '../lib/address';
export const liquidate = async (targetAccount: string, liquidatorAccount: string, tokenName: string, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const tokenAddress = address['address' + tokenName];

    await savingAccount.methods.liquidate(targetAccount, tokenAddress).send({ from: liquidatorAccount, gas: 1000000, gasPrice });
}

export const isAccountLiquidatable = async (account: string, owner: string) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const status: boolean = await savingAccount.methods.isAccountLiquidatable(account).call({ from: owner });

    return status;
}

export const borrow = async (account: string, tokenName: string, amount: any, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const tokenAddress = address['address' + tokenName];

    await savingAccount.methods.borrow(tokenAddress, amount).send({ from: account, gas: 1000000, gasPrice });
}

export const mint = async (account: string, tokenName: string, amount: any, owner: string, gasPrice: number) => {
    const tokenAddress = address['address' + tokenName];
    const mockERC20 = await getInstance("MockERC20", web3, tokenAddress);
    await mockERC20.methods.transfer(account, amount).send({ from: owner, gasPrice });
    await mockERC20.methods.approve(address['savingAccount'], amount).send({ from: account, gasPrice });
}

export const deposit = async (account: string, tokenName: string, amount: any, owner: string, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const tokenAddress = address['address' + tokenName];
    await savingAccount.methods.deposit(tokenAddress, amount).send({ from: account, gas: 1000000, gasPrice });
}

export const updatePrice = async (tokenName: string, updatedPrice: any, owner: string, gasPrice: number) => {
    const mockChainLinkForDAI = await getInstance("MockChainLinkAggregator", web3, address['mockChainlinkAggregatorfor' + tokenName + 'Address']);
    await mockChainLinkForDAI.methods.updateAnswer(updatedPrice).send({ from: owner, gasPrice });
}

export const getPrice = async (tokenName: string, owner: string) => {
    const mockChainLinkForDAI = await getInstance("MockChainLinkAggregator", web3, address['mockChainlinkAggregatorfor' + tokenName + 'Address']);
    return await mockChainLinkForDAI.methods.latestAnswer().call({ from: owner });
}

export const tokenBalance = async (account: string) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);

    return await savingAccount.methods.totalBalance(account).call({ from: account });
}

export const repay = async (account: string, tokenName: string, amount: any, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const tokenAddress = address['address' + tokenName];

    await savingAccount.methods.repay(tokenAddress, amount).send({ from: account, gas: 1000000, gasPrice });
}

export const withdraw = async (account: string, tokenName: string, amount: any, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const tokenAddress = address['address' + tokenName];

    await savingAccount.methods.wtihdraw(tokenAddress, amount).send({ from: account, gas: 1000000, gasPrice });
}

export const withdrawAll = async (account: string, tokenName: string, gasPrice: number) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const tokenAddress = address['address' + tokenName];
    await savingAccount.methods.withdrawAll(tokenAddress).send({ from: account, gas: 1000000, gasPrice });
}

export const balance = async (account: string, owner: string) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const status = await savingAccount.methods.totalBalance(account).call({ from: owner });
    return status;
}