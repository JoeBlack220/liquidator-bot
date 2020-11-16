import Web3 from 'web3';

/**
 * 
 * Used to get a contract instance.
 * 
 * @param name - The name of the contract.
 * @param web3 - The web3 client.
 * @param address - The contract's address.
 */
export const getInstance = async (name: string, web3: Web3, address: string) => {
    const path = "../../abi/contracts/" + name + ".json";
    const abi = require(path)['abi'];
    const contract = await new web3.eth.Contract(abi, address);
    return contract;
}