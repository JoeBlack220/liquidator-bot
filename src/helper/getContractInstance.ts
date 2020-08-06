import Web3 from 'web3';
export const getInstance = async (name: string, web3: Web3, address: string) => {
    const path = "../../../build/contracts/" + name + ".json";
    const abi = require(path)['abi'];
    const contract = await new web3.eth.Contract(abi, address);
    return contract;
}