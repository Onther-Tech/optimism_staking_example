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
const l1Wallet2 = new ethers.Wallet(key2, l1RpcProvider)
const l2Wallet2 = new ethers.Wallet(key2, l2RpcProvider)

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

describe("Layer2 Staking", function () {
  before(async function () {
    this.timeout(50000);

    this.l1_erc20 = await factory__L1_ERC20.connect(l1Wallet).deploy(
      50000, //initialSupply
      'L1 ERC20', //name
    )
    // console.log(this.l1_erc20.address)
    console.log("deploy the l1_erc20")

    this.l2_erc20 = await factory__L2_ERC20.connect(l2Wallet).deploy(
      l2MessengerAddress,
      'L2 ERC20', //name
      {
        gasPrice: 0
      }
    )
    // console.log(this.l2_erc20.address)
    console.log("deploy the l2_erc20")


    this.l2_staking = await factory__L2_Staking.connect(l2Wallet).deploy(
      this.l2_erc20.address,
      10,
      {
        gasPrice: 0    
      }
    )
    // console.log(this.l2_staking.address)
  
    this.l1_erc20gateway = await factory__L1_ERC20Gateway.connect(l1Wallet).deploy(
      this.l1_erc20.address,
      this.l2_erc20.address,
      l1MessengerAddress
    )
    // console.log(this.l1_erc20gateway.address)
    
    const tx0 = await this.l2_erc20.init(
      this.l1_erc20gateway.address,      
      {
        gasPrice: 0
      }
    )
    await tx0.wait()
    
    const tx1 = await this.l1_erc20.approve(this.l1_erc20gateway.address, 50000)
    await tx1.wait()
    
    const tx2 = await this.l1_erc20gateway.deposit(50000)
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

    console.log('--------------------------------')
    console.log('basic setting on Layer2')
    console.log(`Balance on L2: ${await this.l2_erc20.balanceOf(l2Wallet.address)}`) // 7000 
    console.log(`Balance on L2_2: ${await this.l2_erc20.balanceOf(l2Wallet2.address)}`) // 3000
    console.log(`Balance on L2_staking: ${await this.l2_erc20.balanceOf(this.l2_staking.address)}`) // 40000 
    console.log('--------------------------------')
  })

  describe("staking test", function() {
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
      const nowBlock = await this.l2_staking.getNowBlock()
      console.log(nowBlock.toString())

      const l2_staking = await this.l2_staking.connect(l2Wallet).deposit(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_staking.wait()

      let stakingBalance = await this.l2_erc20.balanceOf(this.l2_staking.address)
      expect(stakingBalance.toString()).to.be.equal('40100')
    })

    it("calculate pendingAmount", async function () {
      const inputBlock = await this.l2_staking.getBlocknumber()
      console.log(inputBlock.toString())
      // await time.advanceBlockTo(inputBlock2)
      const nowBlock = await this.l2_staking.getNowBlock()
      console.log(nowBlock.toString())
      let calPendingAmount = Number((nowBlock-inputBlock) * tokenPerBlock)
      const pendingAmount = await this.l2_staking.pendingTon(
        l2Wallet.address,
        {
          gasPrice: 0
        }
      )
      const numberAmount = pendingAmount.toString()
      expect(Number(numberAmount)).to.be.equal(calPendingAmount)
    })

    it("one user withdraw", async function () {
      const pendingAmount = await this.l2_staking.pendingTon(
        l2Wallet.address,
        {
          gasPrice: 0
        }
      )
      console.log(pendingAmount.toString())
      const l2_staking = await this.l2_staking.connect(l2Wallet).withdraw(
        100,
        {
          gasPrice: 0
        }
      )
      await l2_staking.wait()
      const nowBlock = await this.l2_staking.getNowBlock()
      console.log(nowBlock.toString())
      let stakingBalance = await this.l2_erc20.balanceOf(this.l2_staking.address)
      console.log(stakingBalance.toString())
      // expect(pendingAmount.toString()).to.be.equal(calPendingAmount)
    })
  })
  
  // describe("deposit the ton", function() {
  //   it("approve ton to stakingContract", async function () {
  //     const l2_stakeApprove = await this.l2_erc20.connect(l2Wallet).approve(
  //       this.l2_staking.address, 
  //       100,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await l2_stakeApprove.wait()

  //     const l2_allowance = await this.l2_erc20.connect(l2Wallet).allowance(
  //       l2Wallet.address,
  //       this.l2_staking.address,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await expect(l2_allowance.toString()).to.be.equal('100');
  //   })

  //   it("approve and deposit test", async function () {
  //     const l2_stakeApprove = await this.l2_erc20.connect(l2Wallet).approve(
  //       this.l2_staking.address, 
  //       100,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await l2_stakeApprove.wait()
  //     const nowBlock = await this.l2_staking.getNowBlock()
  //     console.log(nowBlock.toString())

  //     const l2_staking = await this.l2_staking.connect(l2Wallet).deposit(
  //       100,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await l2_staking.wait()

  //     let stakingBalance = await this.l2_erc20.balanceOf(this.l2_staking.address)
  //     expect(stakingBalance.toString()).to.be.equal('40100')
  //   })
  // })

  // describe("pendingTon", function() {
  //   it("calculate pendingAmount", async function () {
  //     const inputBlock = await this.l2_staking.getBlocknumber()
  //     // await time.advanceBlockTo(inputBlock2)
  //     const nowBlock = await this.l2_staking.getNowBlock()
  //     let calPendingAmount = Number((nowBlock-inputBlock) * tokenPerBlock)
  //     const pendingAmount = await this.l2_staking.pendingTon(
  //       l2Wallet.address,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     const numberAmount = pendingAmount.toString()
  //     expect(Number(numberAmount)).to.be.equal(calPendingAmount)
  //   })
  // })

  // describe("withdraw", function() {
  //   it("one user withdraw", async function () {
  //     // const pendingAmount = await this.l2_staking.pendingTon(
  //     //   l2Wallet.address,
  //     //   {
  //     //     gasPrice: 0
  //     //   }
  //     // )
  //     // console.log(pendingAmount.toString())
  //     const l2_staking = await this.l2_staking.connect(l2Wallet).withdraw(
  //       100,
  //       {
  //         gasPrice: 0
  //       }
  //     )
  //     await l2_staking.wait()
  //     const nowBlock = await this.l2_staking.getNowBlock()
  //     console.log(nowBlock.toString())
  //     let stakingBalance = await this.l2_erc20.balanceOf(this.l2_staking.address)
  //     console.log(stakingBalance.toString())
  //     // expect(pendingAmount.toString()).to.be.equal(calPendingAmount)
  //   })
  // })
})