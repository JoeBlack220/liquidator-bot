import { web3 } from './web3';
import { getInstance } from './getContractInstance';
const { BN } = require("@openzeppelin/test-helpers");
const address = require('../../build/addresses.json');

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

export const borrow = async (account: string, tokenName: string, amount: any) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const tokenAddress = address['address' + tokenName];

    await savingAccount.methods.borrow(tokenAddress, amount).send({ from: account, gas: 1000000, gasPrice: 10000 });
}

export const deposit = async (account: string, tokenName: string, amount: any, owner: string) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);
    const tokenAddress = address['address' + tokenName];
    const mockERC20 = await getInstance("MockERC20", web3, tokenAddress);

    await mockERC20.methods.transfer(account, amount).send({ from: owner });
    await mockERC20.methods.approve(address['savingAccount'], amount).send({ from: account });
    await savingAccount.methods.deposit(tokenAddress, amount).send({ from: account, gas: 1000000, gasPrice: 10000 });

}

export const updatePrice = async (tokenName: string, updatedPrice: number, owner: string) => {
    const mockChainLinkForDAI = await getInstance("MockChainLinkAggregator", web3, address['mockChainlinkAggregatorfor' + tokenName + 'Address']);
    await mockChainLinkForDAI.methods.updateAnswer(updatedPrice).send({ from: owner });
}

export const getPrice = async (tokenName: string, owner: string) => {
    const mockChainLinkForDAI = await getInstance("MockChainLinkAggregator", web3, address['mockChainlinkAggregatorfor' + tokenName + 'Address']);
    return await mockChainLinkForDAI.methods.latestAnswer().call({ from: owner });
}

export const tokenBalance = async (account: string) => {
    const savingAccount = await getInstance("SavingAccount", web3, address['savingAccount']);

    return await savingAccount.methods.totalBalance(account).call({ from: account });
}