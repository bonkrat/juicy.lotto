# Juicy Lotto 🧃💰

Juicy Lotto is a pick three lottery game driven by a Juicebox DAO. On the lottery side anyone can participate by picking three numbers and buying them as entries to the lottery.  Once the minimum jackpot is reached any user can trigger winning numbers to be drawn. If no one wins the lottery all entries and the jackpot are rolled over.

On the DAO side anyone can invest in the lottery game itself through funding cycles. Anytime a winner takes their winning stake out of the lottery a percentage is cut and paid back to the Juicebox DAO treasury. Investors can pay out their DAO stake at any time to take your share of the treasury's earnings.

## Local environment setup

1.  Clone the respository:
    ```
    git clone https://github.com/bonkrat/juicy.lotto
    cd juicy.lotto
    ```
1.  Create `.env` files in `packages/backend`, `./packages/frontend` and `./packages/hardhat` which mirror the `.sample.env` files in the same directories.

1.  Install dependencies:

    ```
    yarn install
    ```

1.  Start a local chain and deploy the contract(s):

    ```
    yarn chain && yarn deploy-local
    ```

1.  Start the API server:

    ```
    yarn backend:dev
    ```

1.  Start the frontend:
    ```
    yarn frontend:start
    ```

## Deploy

### Networks

#### Local

- `yarn deploy-local` -> deploys to local chain

#### Testnet

- Kovan `yarn deploy-kovan`

#### Mainnet

- `yarn deploy-mainnet` (not yet deployed)

NOTE: Once contracts are deployed, new artifacts will be generated for the frontend. These should be commited and pushed to the `main` branch so that the changes are reflected in the live site(s).

### Verification

To verify any of the contracts on Etherscan, do the following:

1.  `cd packages/hardhat`
1.  `npx hardhat verify --network $network $contract_address $constructor_args`

An example, verifying the `JuicyLotto.sol` contract on Rinkeby may look like:

```
npx hardhat verify --network rinkeby \
  0x5f1F7c1E9830a46E00E21e204c7628b629B213d8 \
  "https://api.wikitoken.org/api/token/" \
  "true" \
  "0x02" \
  "0x5d03dA1Ec58cf319c4fDbf2E3fE3DDcd887ef9aD"
```

Verification allows for users on Etherscan to read the contract code and debug errors more easily.
