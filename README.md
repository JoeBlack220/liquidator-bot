# Liquidator Bot
## Overview
This is a liquidator bot for DeFiner. Anyone can use this liquidator bot to automatically liquidate accounts who's debtValue/collateralValue exceeds a certain value. A user can specify what kind of tokens it wants to spend to liquidate other accounts, then the liquidation process will spend that kind of token to repay others debt in the same token, and buy the collateral of the target account at a discount.
### Why Use Liquidtor Bot
Every user can borrow an amount of tokens regarding its collateral value and initial LTV for each token.
<br>
![](http://latex.codecogs.com/gif.latex?BorrowPower=\\sum_{i=0}^{n}(DepositValue_i*InitialLTV_i))
<br>
A user can keep borrowing as long as:
<br>
![](http://latex.codecogs.com/gif.latex?BorrowPower\\geq\\sum_{i=0}^{n}BorrowValue_i)
<br>

But the tokens' prices are fluctuating, when the borrowed token's prices become too high, we may have this condition in borrower:
<br>
![](http://latex.codecogs.com/gif.latex?{BorrowPower}\\lt\\sum_{i=0}^{n}{BorrowValue_i})
<br>
And if the borrowed token's price keeps rising, it may be:
<br>
![](http://latex.codecogs.com/gif.latex?\\frac{\\sum_{i=0}^{n}BorrowValue_i}{\\sum_{i=0}^{n}DepositValue_i}\\geq{LiquidationThreshold})
<br>
So this account is at high risk of not repaying its debt, we allow any one to liquidate this account. As for incentive, the liquidator will be able to buy target account's collateral **at a discount of 5% off**.
### Example
Assume USDT and DAI are both of price 1.
- Before liquidation:
  - User1:
    - Deposits: 100 USDT
    - Loans: 90 DAI
    - LTV: 0.9, liquidatable
  - User2:
    - Deposits: 100 DAI
  
User2 tries to liquidate user1.
- After liquidation:
  - User1:
    - Deposits: 100 - 85.7 = 14.3 USDT
    - Loans: 90 - 85.7*0.95 = 8.6 DAI
    - LTV: 0.6, not liquidatable
  - User2:
    - Deposits: 18.6 DAI, 85.7 USDT

## Useage
### Requirement
- Nodejs.
- An account that has deposited some **target token** in DeFiner, and it has enough ETH to call liqudiate() function.
- An access node.

### Env Variables
You can create a `.env` file and take the template of `.env.example` to make your customized settings.
| Name                           | Description                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------ |
| GAS_STATION_URL                | URL to use api to get the newest gas price                                     |
| GAS_PRICE_UPDATE_FREQUENCY_SEC | How frequently to update the gas                                               |
| GAS_INITIAL_PRICE              | Initial gas price                                                              |
| GAS_PRICE_LEVEL                | Use what level of gas price from the gas station. Example: fast, average, slow |
| LIQUIDATE_INTERVAL             | How frequently to liquidate for one round                                      |
| LIQUIDATOR_TOKEN               | What token liquidator use to liquidate other accounts.                         |
| TEST_RESET_FREQUENCY_SEC       | Test related. Can be ignored                                                   |
| NETWORK                        | Set this to mainnet to enable liquidate process.                               |
| TEST_GENERATE_FREQUENCY_SEC    | Test related. Can be ignored                                                   |
| USER_MNEMONIC                  | Liquidator's mnemonic in order to execute liquidation                          |
| ACCESS_NODE_URL                | Your access node's URL                                                         |
### Steps
- Download this git repo: `git clone https://github.com/DeFinerOrg/Savings.git`
- Install dependencies: `npm i`
- Go inside this directory: `cd liquidator-bot/`
- Create a file called .env in the root directory. You can check the last section on instructions about how to create that file.
- Run the liquidator bot: `ts-node src/index.ts`
- You can find logs inside: `logs/` directory