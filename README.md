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
node example.js
```

If everything goes well, you should see the following:

```text
Deploying L1 ERC20...
Deploying L2 ERC20...
Deploying L2 Staking...
Deploying L1 ERC20 Gateway...
Initializing L2 ERC20...
Approving tokens for ERC20 gateway...(L1wallet1)
Depositing tokens into L2 ERC20...(l1wallet1)
Waiting for deposit to be relayed to L2...
transfer token Layer2
--------------------------------
basic setting on Layer2
Balance on L2: 7000
Balance on L2_2: 3000
Balance on L2_staking: 40000
lastRewardBlockNumber:  0
--------------------------------
--------------------------------
deposit 100 token Layer2 from wallet1
Balance on L2: 6900
Balance on L2_2: 3000
Balance on L2_staking: 40100
lastRewardBlockNumber:  80
--------------------------------
deposit 100 token Layer2 from wallet2
Balance on L2: 6900
Balance on L2_2: 2900
Balance on L2_staking: 40200
lastRewardBlockNumber:  82
--------------------------------
pendingTon Layer2:  20
Balance on L2: 6900
Balance on L2_2: 2900
Balance on L2_staking: 40200
--------------------------------
--------------------------------
withdraw 100 token Layer2 from wallet1
Balance on L2: 7030
Balance on L2_2: 2900
Balance on L2_staking: 40070
--------------------------------
getBlocknumber:  84
now block:  84
```
