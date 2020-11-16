/*
 * Just fo enabling env variables predefined in .env file.
 * Notice that the path of starting the process do matter.
 * We should call `ts-node ./src/index.ts` at the same directory as liquidator-bot.
 */
var path = require('path');
var dotEnvPath = path.resolve('./.env');
require('dotenv').config({ path: dotEnvPath });

/**
 * 
 * Get the environment variable from .env file in string type.
 * 
 * @param varName : The name of the env variable.
 */
export const getEnvVarStr = (varName: string): string => {
    switch (varName) {
        case "GAS_STATION_URL":
            return process.env.GAS_STATION_URL || "http://ethgasstation.info/json/ethgasAPI.json";

        case "GAS_PRICE_UPDATE_FREQUENCY_MILLI_SEC":
            return process.env.GAS_PRICE_UPDATE_FREQUENCY_MILLI_SEC || "5000";

        case "GAS_INITIAL_PRICE":
            return process.env.GAS_INITIAL_PRICE || "25";

        case "ACCOUNTS_UPDATE_FREQUENCY_MILLI_SEC":
            return process.env.ACCOUNTS_UPDATE_FREQUENCY_MILLI_SEC || "30000";

        case "LIQUIDATOR_TOKEN":
            return process.env.LIQUIDATOR_TOKEN || "ETH";

        case "PROVIDER_TYPE":
            var providerType = process.env.PROVIDER_TYPE || "privatekey";
            if (providerType == "mnemonic" || providerType == "privatekey") return providerType;
            else return "privatekey";

        case "PRIVATE_KEY":
            return process.env.PRIVATE_KEY || "";

        case "PUBLIC_KEY":
            return process.env.PUBLIC_KEY || "";

        case "ACCOUNT_NUM":
            return process.env.ACCOUNT_NUM || "1000";

        case "USER_MNEMONIC":
            return process.env.USER_MNEMONIC || "";

        case "ACCESS_NODE_URL":
            return process.env.ACCESS_NODE_URL || "";

        case "GAS_PRICE_MULTIPLIER":
            return process.env.GAS_PRICE_MULTIPLIER || "1";

        case "LIQUIDATE_INTERVAL_MILLI_SEC":
            return process.env.LIQUIDATE_INTERVAL_MILLI_SEC || "10000"

        default:
            return "";

    }
}

/**
 * 
 * Get the environment variable from .env file in number type.
 * 
 * @param varName : The name of the env variable.
 */
export const getEnvVarNumber = (varName: string): number => {
    return Number(getEnvVarStr(varName));
}
