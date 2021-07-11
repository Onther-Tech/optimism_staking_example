const ethers = require('ethers')
const { Watcher } = require('@eth-optimism/watcher')
const { getContractFactory } = require('@eth-optimism/contracts')

const {
  time,
} = require('@openzeppelin/test-helpers');

const chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
// var assert = require('assert');

// Set up some contract factories. You can ignore this stuff.
const factory = (name, ovm = false) => {
  const artifact = require(`../artifacts${ovm ? '-ovm' : ''}/contracts/${name}.sol/${name}.json`)
  return new ethers.ContractFactory(artifact.abi, artifact.bytecode)
}
const factory__L1_ERC20 = factory('ERC20')
const factory__L2_ERC20 = factory('L2DepositedERC20', true)
const factory__L1_ERC20Gateway = getContractFactory('OVM_L1ERC20Gateway')
const factory__L2_Staking = factory('L2StakingERC20', true)

const l1RpcProvider = new ethers.providers.JsonRpcProvider('http://localhost:9545')
const l2RpcProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

// Set up our wallets (using a default private key with 10k ETH allocated to it).
// Need two wallets objects, one for interacting with L1 and one for interacting with L2.
// Both will use the same private key.
const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const l1Wallet = new ethers.Wallet(key, l1RpcProvider)
const l2Wallet = new ethers.Wallet(key, l2RpcProvider)

const key2 = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
// const l1Wallet2 = new ethers.Wallet(key2, l1RpcProvider)
const l2Wallet2 = new ethers.Wallet(key2, l2RpcProvider)

const key3 = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'
// const l1Waalet3 = new ethers.Wallet(key3, l1RpcProvider)
const l2Wallet3 = new ethers.Wallet(key3, l2RpcProvider)

// L1 messenger address depends on the deployment, this is default for our local deployment.
const l1MessengerAddress = '0x59b670e9fA9D0A427751Af201D676719a970857b'
// L2 messenger address is always the same.
const l2MessengerAddress = '0x4200000000000000000000000000000000000007'

// tokenPerBlock = 10
const tokenPerBlock = 10

// Tool that helps watches and waits for messages to be relayed between L1 and L2.
const watcher = new Watcher({
  l1: {
    provider: l1RpcProvider,
    messengerAddress: l1MessengerAddress
  },
  l2: {
    provider: l2RpcProvider,
    messengerAddress: l2MessengerAddress
  }
})

function sleep(ms) {
  const wakeUpTime = Date.now() + ms;
  while (Date.now() < wakeUpTime) {}
}

describe("Layer2 Staking", function () {
  describe("staking test1", function() {
    before(async function() {
      this.timeout(50000);

      this.l1_erc20 = await factory__L1_ERC20.connect(l1Wallet).deploy(
        50000, //initialSupply
        'L1 ERC20', //name
      )
      console.log("deploy the l1_erc20")

      this.l2_erc20 = await factory__L2_ERC20.connect(l2Wallet).deploy(
        l2MessengerAddress,
        'L2 ERC20', //name
        {
          gasPrice: 0
        }
      )
      console.log("deploy the l2_erc20")


      this.l2_staking = await factory__L2_Staking.connect(l2Wallet).deploy(
        this.l2_erc20.address,
        10,
        {
          gasPrice: 0    
        }
      )
      console.log("deploy the l2_staking")
    
      this.l1_erc20gateway = await factory__L1_ERC20Gateway.connect(l1Wallet).deploy(
        this.l1_erc20.address,
        this.l2_erc20.address,
        l1MessengerAddress
      )
      console.log("deploy the l1_erc20gateway")

      const tx0 = await this.l2_erc20.init(
        this.l1_erc20gateway.address,      
        {
          gasPrice: 0
        }
      )
      await tx0.wait()
      
      const tx1 = await this.l1_erc20.approve(this.l1_erc20gateway.address, 50000)
      await tx1.wait()
      
      const tx2 = await this.l1_erc20gateway.deposit(49000)
      await tx2.wait()
      
      const [ msgHash1 ] = await watcher.getMessageHashesFromL1Tx(tx2.hash)
      await watcher.getL2TransactionReceipt(msgHash1)
  
      const l2_transfer = await this.l2_erc20.transfer(
        l2Wallet2.address,
        3000,
        {
          gasPrice: 0
        }
      )
      await l2_transfer.wait()
        
      const l2_transfer2 = await this.l2_erc20.transfer(
        this.l2_staking.address,
        40000,
        {
          gasPrice: 0
        }
      )
      await l2_transfer2.wait()
  
      const l2_transfer3 = await this.l2_erc20.transfer(
        l2Wallet3.address,
        3000,
        {
          gasPrice: 0
        }
      )
      await l2_transfer3.wait()
  
      console.log('--------------------------------')
      console.log('basic setting on Layer2')
      console.log(`Balance on L2: ${await this.l2_erc20.balanceOf(l2Wallet.address)}`) // 3000 
      console.log(`Balance on L2_2: ${await this.l2_erc20.balanceOf(l2Wallet2.address)}`) // 3000
      console.log(`Balance on L2_3: ${await this.l2_erc20.balanceOf(l2Wallet3.address)}`) // 3000
      console.log(`Balance on L2_staking: ${await this.l2_erc20.balanceOf(this.l2_staking.address)}`) // 40000 
      console.log('--------------------------------')
    })

    it("approve ton to stakingContract", async function () {
      const l2_stakeApprove = await this.l2_erc20.connect(l2Wallet).approve(
        this.l2_staking.address, 
        100,
        {
          gasPrice: 0
        }
      )
      await l2_stakeApprove.wait()

      const l2_allowance = await this.l2_erc20.connect(l2Wallet).allowance(
        l2Wallet.address,
        this.l2_staking.address,
        {
          gasPrice: 0
        }
      )
      await expect(l2_allowance.toString()).to.be.equal('100');
    })

    it("approve and deposit test", async function () {
      const l2_stakeApprove = await this.l2_erc20.connect(l2Wallet).approve(
        this.l2_staking.address, 
        100,
        {
          gasPrice: 0
        }
      )
      await l2_stakeApprove.wait()
 
      const l2_staking = await this.l2_staking.connect(l2Wallet).deposit(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_staking.wait()

      const inputBlock1 = await this.l2_staking.getBlocknumber()
      let numberInput1 = Number(inputBlock1.toString())
      console.log("inputBlock : ",numberInput1)

      let stakingBalance = await this.l2_erc20.balanceOf(this.l2_staking.address)
      expect(stakingBalance.toString()).to.be.equal('40100')
    })

    it("calculate pendingAmount", async function () {
      this.timeout(50000);
      const inputBlock = await this.l2_staking.getBlocknumber()
      let numberInput = Number(inputBlock.toString())
      // console.log("inputBlock : ",numberInput)
      sleep(30000)
      const nowBlock = await this.l2_staking.getNowBlock()
      let numberNow = Number(nowBlock.toString())
      // console.log("nowBlock : ", numberNow)
      let calPendingAmount = ((numberNow-numberInput) * tokenPerBlock)
      // console.log("calPendingAmount :", calPendingAmount)
      const pendingAmount = await this.l2_staking.pendingTon(
        l2Wallet.address,
        {
          gasPrice: 0
        }
      )
      const numberAmount = Number(pendingAmount.toString())
      // console.log("numberAmount :", numberAmount)
      expect(numberAmount).to.be.equal(calPendingAmount)
    })

    it("one user deposit and withdraw", async function () {
      this.timeout(50000);
      const l2_stakeApprove = await this.l2_erc20.connect(l2Wallet2).approve(
        this.l2_staking.address, 
        100,
        {
          gasPrice: 0
        }
      )
      await l2_stakeApprove.wait()
 
      const l2_deposit = await this.l2_staking.connect(l2Wallet2).deposit(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_deposit.wait()
      const inputBlock = await this.l2_staking.getBlocknumber()
      let inputNumber = Number(inputBlock.toString())
      console.log("inputBlock : ", inputNumber)
      
      sleep(30000)

      const l2_withdraw = await this.l2_staking.connect(l2Wallet2).withdraw(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_withdraw.wait()
      // const inputBlock3 = await this.l2_staking.getBlocknumber()
      // console.log("inputBlock3 : ",inputBlock3.toString())

      const nowBlock = await this.l2_staking.getNowBlock()
      let nowNumber = Number(nowBlock.toString())
      console.log("nowBlock : ", nowNumber)

      const calculReward = (nowNumber - inputNumber) * tokenPerBlock * (1/2)
      // console.log("calculReward : ", calculReward)

      const pendingAmount = await this.l2_staking.pendingTon(
        l2Wallet.address,
        {
          gasPrice: 0
        }
      )
      const numberAmount = Number(pendingAmount.toString())
      console.log("numberAmount from Wallet1:", numberAmount)

      
      let l2wallet2Balance = await this.l2_erc20.balanceOf(l2Wallet2.address)
      let l2Wallet2Number = Number(l2wallet2Balance.toString())
      console.log("l2wallet2Balance : ", (l2Wallet2Number-3000))
      
      expect(calculReward).to.be.equal((l2Wallet2Number-3000))
      
      const l2_withdraw2 = await this.l2_staking.connect(l2Wallet).withdraw(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_withdraw2.wait()
        
      let l2walletBalance = await this.l2_erc20.balanceOf(l2Wallet.address)
      let l2WalletNumber = Number(l2walletBalance.toString())
      console.log("l2walletBalance : ", (l2WalletNumber-3000))

      expect(numberAmount).to.be.equal((l2WalletNumber-3000))
    })
  })

  describe("staking test2", function() {
    before(async function() {
      this.timeout(50000);

      this.l1_erc20 = await factory__L1_ERC20.connect(l1Wallet).deploy(
        50000, //initialSupply
        'L1 ERC20', //name
      )
      console.log("deploy the l1_erc20")

      this.l2_erc20 = await factory__L2_ERC20.connect(l2Wallet).deploy(
        l2MessengerAddress,
        'L2 ERC20', //name
        {
          gasPrice: 0
        }
      )
      console.log("deploy the l2_erc20")


      this.l2_staking = await factory__L2_Staking.connect(l2Wallet).deploy(
        this.l2_erc20.address,
        10,
        {
          gasPrice: 0    
        }
      )
      console.log("deploy the l2_staking")
    
      this.l1_erc20gateway = await factory__L1_ERC20Gateway.connect(l1Wallet).deploy(
        this.l1_erc20.address,
        this.l2_erc20.address,
        l1MessengerAddress
      )
      console.log("deploy the l1_erc20gateway")

      const tx0 = await this.l2_erc20.init(
        this.l1_erc20gateway.address,      
        {
          gasPrice: 0
        }
      )
      await tx0.wait()
      
      const tx1 = await this.l1_erc20.approve(this.l1_erc20gateway.address, 50000)
      await tx1.wait()
      
      const tx2 = await this.l1_erc20gateway.deposit(49000)
      await tx2.wait()
      
      const [ msgHash1 ] = await watcher.getMessageHashesFromL1Tx(tx2.hash)
      await watcher.getL2TransactionReceipt(msgHash1)
  
      const l2_transfer = await this.l2_erc20.transfer(
        l2Wallet2.address,
        3000,
        {
          gasPrice: 0
        }
      )
      await l2_transfer.wait()
        
      const l2_transfer2 = await this.l2_erc20.transfer(
        this.l2_staking.address,
        40000,
        {
          gasPrice: 0
        }
      )
      await l2_transfer2.wait()
  
      const l2_transfer3 = await this.l2_erc20.transfer(
        l2Wallet3.address,
        3000,
        {
          gasPrice: 0
        }
      )
      await l2_transfer3.wait()
  
      console.log('--------------------------------')
      console.log('basic setting on Layer2')
      console.log(`Balance on L2: ${await this.l2_erc20.balanceOf(l2Wallet.address)}`) // 3000 
      console.log(`Balance on L2_2: ${await this.l2_erc20.balanceOf(l2Wallet2.address)}`) // 3000
      console.log(`Balance on L2_3: ${await this.l2_erc20.balanceOf(l2Wallet3.address)}`) // 3000
      console.log(`Balance on L2_staking: ${await this.l2_erc20.balanceOf(this.l2_staking.address)}`) // 40000 
      console.log('--------------------------------')
    })

    it("wallet1, wallet2 Deposit and withdraw", async function() {
      this.timeout(100000);
      const l2_stakeApprove = await this.l2_erc20.connect(l2Wallet).approve(
        this.l2_staking.address, 
        100,
        {
          gasPrice: 0
        }
      )
      await l2_stakeApprove.wait()
 
      const l2_deposit = await this.l2_staking.connect(l2Wallet).deposit(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_deposit.wait()

      const inputBlock1 = await this.l2_staking.getBlocknumber()
      let numberInput1 = Number(inputBlock1.toString())
      console.log("deposit wallet1 blockNumber : ",numberInput1)

      let stakingBalance = await this.l2_erc20.balanceOf(this.l2_staking.address)
      expect(stakingBalance.toString()).to.be.equal('40100')

      sleep(30000)

      const l2_stakeApprove2 = await this.l2_erc20.connect(l2Wallet2).approve(
        this.l2_staking.address, 
        100,
        {
          gasPrice: 0
        }
      )
      await l2_stakeApprove2.wait()
 
      const l2_deposit2 = await this.l2_staking.connect(l2Wallet2).deposit(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_deposit2.wait()
      
      const inputBlock2 = await this.l2_staking.getBlocknumber()
      let numberInput2 = Number(inputBlock2.toString())
      console.log("deposit wallet2 blockNumber : ",numberInput2)

      let stakingBalance2 = await this.l2_erc20.balanceOf(this.l2_staking.address)
      expect(stakingBalance2.toString()).to.be.equal('40200')

      sleep(20000)

      const l2_withdraw = await this.l2_staking.connect(l2Wallet).withdraw(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_withdraw.wait()

      const outputBlock1 = await this.l2_staking.getBlocknumber()
      let numberOutput1 = Number(outputBlock1.toString())
      console.log("withdraw wallet1 blockNumber : ",numberOutput1)

      let diffblock1_1 = numberOutput1 - numberInput2
      let diffblock1_2 = numberInput2 - numberInput1
      let calculReward1_1 = diffblock1_1 * tokenPerBlock * (1/2)
      let calculReward1_2 = diffblock1_2 * tokenPerBlock
      let calculReward = calculReward1_1 + calculReward1_2
      console.log("calculReward :", calculReward)

      let walletBalance1 = await this.l2_erc20.balanceOf(l2Wallet.address)
      let walletNumber1 = Number(walletBalance1.toString())

      expect(calculReward).to.be.equal((walletNumber1-3000))

      sleep(30000)

      const l2_withdraw2 = await this.l2_staking.connect(l2Wallet2).withdraw(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_withdraw2.wait()

      const outputBlock2 = await this.l2_staking.getBlocknumber()
      let numberOutput2 = Number(outputBlock2.toString())
      console.log("withdraw wallet2 blockNumber : ",numberOutput2)

      let diffblock2_1 = numberOutput2 - numberOutput1
      let diffblock2_2 = numberOutput1 - numberInput2
      let calculReward2_1 = diffblock2_1 * tokenPerBlock
      let calculReward2_2 = diffblock2_2 * tokenPerBlock * (1/2)
      let calculReward2 = calculReward2_1 + calculReward2_2
      console.log("calculReward2 :", calculReward2)

      let walletBalance2 = await this.l2_erc20.balanceOf(l2Wallet2.address)
      let walletNumber2 = Number(walletBalance2.toString())

      expect(calculReward2).to.be.equal((walletNumber2-3000))
    })

  })

  // describe("staking test3", function() { 
  //   it("wallet1, wallet2, wallet3 Deposit and withdrawand claim", async function() {
  //     this.timeout(100000);
  //     const l2_stakeApprove = await this.l2_erc20.connect(l2Wallet).approve(
  //       this.l2_staking.address, 
  //       100,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await l2_stakeApprove.wait()
 
  //     const l2_deposit = await this.l2_staking.connect(l2Wallet).deposit(
  //       100,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await l2_deposit.wait()

  //     const inputBlock1 = await this.l2_staking.getBlocknumber()
  //     let numberInput1 = Number(inputBlock1.toString())
  //     console.log("deposit wallet1 blockNumber : ",numberInput1)

  //     let stakingBalance = await this.l2_erc20.balanceOf(this.l2_staking.address)
  //     expect(stakingBalance.toString()).to.be.equal('40100')

  //     sleep(30000)

  //     const l2_stakeApprove = await this.l2_erc20.connect(l2Wallet2).approve(
  //       this.l2_staking.address, 
  //       100,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await l2_stakeApprove.wait()
 
  //     const l2_deposit = await this.l2_staking.connect(l2Wallet2).deposit(
  //       100,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await l2_deposit.wait()
      
  //     const inputBlock2 = await this.l2_staking.getBlocknumber()
  //     let numberInput2 = Number(inputBlock2.toString())
  //     console.log("deposit wallet2 blockNumber : ",numberInput2)

  //     let stakingBalance2 = await this.l2_erc20.balanceOf(this.l2_staking.address)
  //     expect(stakingBalance2.toString()).to.be.equal('40200')

  //     sleep(20000)

  //     const l2_withdraw = await this.l2_staking.connect(l2Wallet).withdraw(
  //       100,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await l2_withdraw.wait()

  //     const outputBlock1 = await this.l2_staking.getBlocknumber()
  //     let numberOutput1 = Number(outputBlock1.toString())
  //     console.log("withdraw wallet1 blockNumber : ",numberOutput1)

  //     let diffblock = numberOutput1 - numberInput1

  //   })

  // })

})