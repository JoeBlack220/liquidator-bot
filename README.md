# Liquidator Bot
This is a liquidator bot for DeFiner.
You can create a `.env` file and take the template of `.env.example` to make your customized settings.
## Env Variables
| Name                           | Description                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------ |
| GAS_STATION_URL                | URL to use api to get the newest gas price                                     |
| GAS_PRICE_UPDATE_FREQUENCY_SEC | How frequently to update the gas                                               |
| GAS_INITIAL_PRICE              | Initial gas price                                                              |
| GAS_PRICE_LEVEL                | Use what level of gas price from the gas station. Example: fast, average, slow |
| LIQUIDATE_INTERVAL             | How frequently to liquidate for one round                                      |
| LIQUIDATOR_TOKEN               | What token liquidator use to liquidate other accounts                          |
| TEST_RESET_FREQUENCY_SEC       | Test related. Can be ignored                                                   |
| TEST_GENERATE_FREQUENCY_SEC    | Test related. Can be ignored                                                   |
| USER_MNEMONIC                  | Liquidator's mnemonic in order to execute liquidation                          |
| ACCESS_NODE_URL                | Your access node's URL                                                         |
