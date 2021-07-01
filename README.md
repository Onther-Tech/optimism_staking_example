# L1/L2 ERC20 Deposit + Staking Example

## Introduction

Staking 기능을 넣기 위해서 L2DepositedERC20.sol에 기능을 추가하였습니다.

1.Deposit
```
// Lock the tokens up inside the gateway and ask the L2 contract to mint new ones.
console.log('Depositing tokens into L2 ERC20...(l1wallet1)')
const tx2 = await L1_ERC20Gateway.deposit(3000)
// console.log("from address : ",tx2.from)
await tx2.wait()

console.log('Depositing tokens into L2 ERC20...(l1wallet2)')
const tx2_2 = await L1_ERC20Gateway.connect(l1Wallet2).deposit(2000)
// console.log(tx2_2.from)
await tx2_2.wait()
```
<br>

2.Staking

```
  //stake test
  console.log('--------------------------------')
  console.log('approve staking token Layer2')
  const l2_stakeApprove = await L2_ERC20.connect(l2Wallet).approve(
    L2_ERC20.address, 
    1000,
    {
      gasPrice: 0
    }
  )
  await l2_stakeApprove.wait()
  console.log('--------------------------------')
  console.log('staking token Layer2')
  console.log('--------------------------------')
  const l2_staking = await L2_ERC20.connect(l2Wallet).stake(
    1000,
    {
      gasLimit: 6100000,
      gasPrice: 15000000
    }
  )
  await l2_staking.wait()
```

순으로 실행할려고합니다.

실행하면 다음과같은 에러가 납니다.
```text
Error: transaction failed (transactionHash="0x434d139f997dc49dfdca0b81c73ddfb8a97cec2dd7d4153ba94714ca3c0e8f82", transaction={"nonce":144,"gasPrice":{"type":"BigNumber","hex":"0xe4e1c0"},"gasLimit":{"type":"BigNumber","hex":"0x5d1420"},"to":"0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1","value":{"type":"BigNumber","hex":"0x00"},"data":"0xa694fc3a00000000000000000000000000000000000000000000000000000000000003e8","chainId":420,"v":875,"r":"0x726e6510731f2b2c82be14c2e1fdcce6a91b4ceeb1cb3c70450f9a2b6754846c","s":"0x4345036e66dc3666a2519fc348aa635e27a5a94b142be21ef7d113b81884990a","from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","hash":"0x434d139f997dc49dfdca0b81c73ddfb8a97cec2dd7d4153ba94714ca3c0e8f82","type":null}, receipt={"to":"0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1","from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","contractAddress":null,"transactionIndex":0,"gasUsed":{"type":"BigNumber","hex":"0x0adf3c"},"logsBloom":"0x00000000000000000000000000000000000000000000000000040000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000008000000000000000010000000000000000000000400000000000000000000000100008000000000000000000000000010000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000200000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","blockHash":"0x9802f7e1abb31f68a6dc0fb49db95ecccf6fcdcbd3c47d8587a461c9065fe45f","transactionHash":"0x434d139f997dc49dfdca0b81c73ddfb8a97cec2dd7d4153ba94714ca3c0e8f82","logs":[{"transactionIndex":0,"blockNumber":221,"transactionHash":"0x434d139f997dc49dfdca0b81c73ddfb8a97cec2dd7d4153ba94714ca3c0e8f82","address":"0x4200000000000000000000000000000000000006","topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266","0x0000000000000000000000004200000000000000000000000000000000000005"],"data":"0x0000000000000000000000000000000000000000000000000000533800ff3800","logIndex":0,"blockHash":"0x9802f7e1abb31f68a6dc0fb49db95ecccf6fcdcbd3c47d8587a461c9065fe45f"}],"blockNumber":221,"confirmations":1,"cumulativeGasUsed":{"type":"BigNumber","hex":"0x0adf3c"},"status":0,"byzantium":true}, code=CALL_EXCEPTION, version=providers/5.1.0)
    at Logger.makeError (/Users/harvey/Desktop/onther/abc/staking_test/l1-l2-deposit-withdrawal/node_modules/@ethersproject/logger/src.ts/index.ts:205:28)
    at Logger.throwError (/Users/harvey/Desktop/onther/abc/staking_test/l1-l2-deposit-withdrawal/node_modules/@ethersproject/logger/src.ts/index.ts:217:20)
    at JsonRpcProvider.<anonymous> (/Users/harvey/Desktop/onther/abc/staking_test/l1-l2-deposit-withdrawal/node_modules/@ethersproject/providers/src.ts/base-provider.ts:1084:24)
    at step (/Users/harvey/Desktop/onther/abc/staking_test/l1-l2-deposit-withdrawal/node_modules/@ethersproject/providers/lib/base-provider.js:48:23)
    at Object.next (/Users/harvey/Desktop/onther/abc/staking_test/l1-l2-deposit-withdrawal/node_modules/@ethersproject/providers/lib/base-provider.js:29:53)
    at fulfilled (/Users/harvey/Desktop/onther/abc/staking_test/l1-l2-deposit-withdrawal/node_modules/@ethersproject/providers/lib/base-provider.js:20:58)
    at processTicksAndRejections (internal/process/task_queues.js:97:5) {
  reason: 'transaction failed',
  code: 'CALL_EXCEPTION',
  transactionHash: '0x434d139f997dc49dfdca0b81c73ddfb8a97cec2dd7d4153ba94714ca3c0e8f82',
  transaction: {
    nonce: 144,
    gasPrice: BigNumber { _hex: '0xe4e1c0', _isBigNumber: true },
    gasLimit: BigNumber { _hex: '0x5d1420', _isBigNumber: true },
    to: '0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1',
    value: BigNumber { _hex: '0x00', _isBigNumber: true },
    data: '0xa694fc3a00000000000000000000000000000000000000000000000000000000000003e8',
    chainId: 420,
    v: 875,
    r: '0x726e6510731f2b2c82be14c2e1fdcce6a91b4ceeb1cb3c70450f9a2b6754846c',
    s: '0x4345036e66dc3666a2519fc348aa635e27a5a94b142be21ef7d113b81884990a',
    from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    hash: '0x434d139f997dc49dfdca0b81c73ddfb8a97cec2dd7d4153ba94714ca3c0e8f82',
    type: null,
    wait: [Function]
  },
  receipt: {
    to: '0x976fcd02f7C4773dd89C309fBF55D5923B4c98a1',
    from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    contractAddress: null,
    transactionIndex: 0,
    gasUsed: BigNumber { _hex: '0x0adf3c', _isBigNumber: true },
    logsBloom: '0x00000000000000000000000000000000000000000000000000040000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000008000000000000000010000000000000000000000400000000000000000000000100008000000000000000000000000010000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000200000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    blockHash: '0x9802f7e1abb31f68a6dc0fb49db95ecccf6fcdcbd3c47d8587a461c9065fe45f',
    transactionHash: '0x434d139f997dc49dfdca0b81c73ddfb8a97cec2dd7d4153ba94714ca3c0e8f82',
    logs: [ [Object] ],
    blockNumber: 221,
    confirmations: 1,
    cumulativeGasUsed: BigNumber { _hex: '0x0adf3c', _isBigNumber: true },
    status: 0,
    byzantium: true
  }
```

## Prerequisite Software

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install#mac-stable)
- [Docker](https://docs.docker.com/engine/install/)

## Message Passing in this Example

In this repository, on [line 97](https://github.com/ethereum-optimism/l1-l2-deposit-withdrawal/blob/main/example.js#L97), we wait for the message to relayed by the `L2CrossDomainMessenger` and use the [`@eth-optimism/watcher`](https://www.npmjs.com/package/@eth-optimism/watcher) to retrieve the hash of message of the previous transaction, a deposit of an ERC20 on L1.

Likewise, on [line 115](https://github.com/ethereum-optimism/l1-l2-deposit-withdrawal/blob/main/example.js#L115), we wait for a second message to be relayed, but this time by the `L1CrossDomainMessenger` so that we can retrieve the message of `tx3`, a withdraw of an ERC20 on L2.

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
node ./example.js
```

If everything goes well, you should see the following:

```text
Deploying L1 ERC20...
Deploying L2 ERC20...
Deploying L1 ERC20 Gateway...
Initializing L2 ERC20...
Balance on L1: 1234
Balance on L2: 0
Approving tokens for ERC20 gateway...
Depositing tokens into L2 ERC20...
Waiting for deposit to be relayed to L2...
Balance on L1: 0
Balance on L2: 1234
Withdrawing tokens back to L1 ERC20...
Waiting for withdrawal to be relayed to L1...
Balance on L1: 1234
Balance on L2: 0
```
