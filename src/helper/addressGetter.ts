/**
 * Get the addresses from network directory
 * 
 * @param network - The name of the network: development, mainnet
 */
export const addressGetter = (network: string) => {
    return require('../../network/' + network + '.json')
};
