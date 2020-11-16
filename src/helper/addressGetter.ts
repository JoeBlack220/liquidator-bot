export const addressGetter = (network: string) => {
    return require('../../network/' + network + '.json')
};
