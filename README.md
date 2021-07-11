# L1/L2 ERC20 Deposit + Staking Example

## Introduction

Staking 기능을 넣기 위해서 L2StakingERC20.sol에 컨트랙트를 추가

L2StakingERC20에 staking reward 토큰을 넣어서 보상을 줌

block당 reward를 정하여서 user들이 deposit 하거나 withdraw시 보상이 지급

pendingTon함수를 통해서 얼마받을 수 있는지 확인가능함



## Prerequisite Software

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install#mac-stable)
- [Docker](https://docs.docker.com/engine/install/)


## Running the Example

Run the following commands to get started:

```sh
yarn install
yarn compile
```

Make sure you have the local L1/L2 system running (open a second terminal for this):

```sh
git clone git@github.com:ethereum-optimism/optimism.git
cd optimism
yarn
yarn build
cd ops
docker-compose build
docker-compose up
```

Now run the example file:

```sh
npx hardhat test
```

If everything goes well, you should see the following:

```text
  Layer2 Staking
    staking test1
Deploying L1 ERC20...
Deploying L2 ERC20...
Deploying L2 Staking...
Deploying L1 ERC20 Gateway...
--------------------------------
basic setting on Layer2
Balance on L2: 3000
Balance on L2_2: 3000
Balance on L2_3: 3000
Balance on L2_staking: 40000
--------------------------------
      ✓ approve ton to stakingContract (145ms)
      ✓ approve and deposit test (301ms)
      ✓ calculate pendingAmount (30042ms)
      ✓ one user deposit and withdraw (30855ms)
    staking test2
Deploying L1 ERC20...
Deploying L2 ERC20...
Deploying L2 Staking...
Deploying L1 ERC20 Gateway...
--------------------------------
basic setting on Layer2
Balance on L2: 3000
Balance on L2_2: 3000
Balance on L2_3: 3000
Balance on L2_staking: 40000
--------------------------------
      ✓ wallet1, wallet2 Deposit and withdraw (95149ms)


  5 passing (3m)

```
