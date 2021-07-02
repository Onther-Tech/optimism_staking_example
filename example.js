const ethers = require('ethers')
const { Watcher } = require('@eth-optimism/watcher')
const { getContractFactory } = require('@eth-optimism/contracts')

// Set up some contract factories. You can ignore this stuff.
const factory = (name, ovm = false) => {
  const artifact = require(`./artifacts${ovm ? '-ovm' : ''}/contracts/${name}.sol/${name}.json`)
  return new ethers.ContractFactory(artifact.abi, artifact.bytecode)
}
const factory__L1_ERC20 = factory('ERC20')
const factory__L2_ERC20 = factory('L2DepositedERC20', true)
const factory__L1_ERC20Gateway = getContractFactory('OVM_L1ERC20Gateway')

async function main() {
  // Set up our RPC provider connections.
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

  // Deploy an ERC20 token on L1.
  console.log('Deploying L1 ERC20...')
  const L1_ERC20 = await factory__L1_ERC20.connect(l1Wallet).deploy(
    5000, //initialSupply
    'L1 ERC20', //name
  )
  await L1_ERC20.deployTransaction.wait()

  // Deploy the paired ERC20 token to L2.
  console.log('Deploying L2 ERC20...')
  const L2_ERC20 = await factory__L2_ERC20.connect(l2Wallet).deploy(
    l2MessengerAddress,
    'L2 ERC20', //name
    {
      gasPrice: 0
    }
  )
  await L2_ERC20.deployTransaction.wait()

  // Create a gateway that connects the two contracts.
  console.log('Deploying L1 ERC20 Gateway...')
  const L1_ERC20Gateway = await factory__L1_ERC20Gateway.connect(l1Wallet).deploy(
    L1_ERC20.address,
    L2_ERC20.address,
    l1MessengerAddress
  )
  await L1_ERC20Gateway.deployTransaction.wait()

  // Make the L2 ERC20 aware of the gateway contract.
  console.log('Initializing L2 ERC20...')
  const tx0 = await L2_ERC20.init(
    L1_ERC20Gateway.address,
    {
      gasPrice: 0
    }
  )
  await tx0.wait()

  //basic setting
  // console.log('l1wallet :', l1Wallet.address)
  // console.log('l1wallet2 :', l1Wallet2.address)
  // console.log('l2wallet :', l2Wallet.address)
  // console.log('l2wallet2 :', l2Wallet2.address)
  // console.log('L1_ERC20 address : ', L1_ERC20.address)
  // console.log('L1_L2_gateway address : ', L1_ERC20Gateway.address)
  console.log('L2_ERC20 address : ', L2_ERC20.address)

  // Initial balances.
  console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 5000
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l2Wallet.address)}`) // 0
  console.log(`Balance on L1_2: ${await L1_ERC20.balanceOf(l1Wallet2.address)}`) // 0
  console.log(`Balance on L2_2: ${await L2_ERC20.balanceOf(l1Wallet2.address)}`) // 0

  console.log('transfer tokens for L1wallet2')
  const l1Tol1_2 = await L1_ERC20.connect(l1Wallet).transfer(l1Wallet2.address,2000)
  await l1Tol1_2.wait()
  
  console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 3000 -> (5000-2000)
  console.log(`Balance on L1_2: ${await L1_ERC20.balanceOf(l1Wallet2.address)}`) // 2000

  // Allow the gateway to lock up some of our tokens.
  console.log('Approving tokens for ERC20 gateway...(L1wallet1)')
  const tx1 = await L1_ERC20.approve(L1_ERC20Gateway.address, 3000)
  // console.log('approve1 from address :', tx1.from)
  await tx1.wait()

  console.log('Approving tokens for ERC20 gateway...(L1wallet2)')
  const tx1_2 = await L1_ERC20.connect(l1Wallet2).approve(L1_ERC20Gateway.address, 2000)
  // console.log('approve2 from address :', tx1_2.from)
  await tx1_2.wait()

  // Lock the tokens up inside the gateway and ask the L2 contract to mint new ones.
  console.log('Depositing tokens into L2 ERC20...(l1wallet1)')
  const tx2 = await L1_ERC20Gateway.deposit(3000)
  // console.log("from address : ",tx2.from)
  await tx2.wait()

  console.log('Depositing tokens into L2 ERC20...(l1wallet2)')
  const tx2_2 = await L1_ERC20Gateway.connect(l1Wallet2).deposit(2000)
  // console.log(tx2_2.from)
  await tx2_2.wait()

  // Wait for the message to be relayed to L2.
  console.log('Waiting for deposit to be relayed to L2...')
  const [ msgHash1 ] = await watcher.getMessageHashesFromL1Tx(tx2.hash)
  await watcher.getL2TransactionReceipt(msgHash1)

  const [ msgHash1_2 ] = await watcher.getMessageHashesFromL1Tx(tx2_2.hash)
  await watcher.getL2TransactionReceipt(msgHash1_2)

  // Log some balances to see that it worked!
  console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 0 (3000-3000)
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l2Wallet.address)}`) // 3000 (0 + 3000)
  console.log(`Balance on L1_2: ${await L1_ERC20.balanceOf(l1Wallet2.address)}`) // 0 (2000 - 2000)
  console.log(`Balance on L2_2: ${await L2_ERC20.balanceOf(l2Wallet2.address)}`) // 2000 (0 + 2000)
  //l2_ERC20에서 A는 3000원 B는 2000원 있음

  const balance1 = await l1Wallet.getBalance()
  console.log("eth balance l1Wallet",balance1.toString())
  const balance2 = await l2Wallet.getBalance()
  console.log("eth balance l2Wallet",balance2.toString())
  // const l2_ethtransfer = await l2Wallet.sendTransaction({ 
  //   to: L2_ERC20.address, 
  //   value: ethers.utils.parseEther("1.0"),
  //   gasPrice: 0
  // })
  // // 9383544933940000004
  // // 1000000000000000000
  // await l2_ethtransfer.wait()

  const balance3 = await l1Wallet2.getBalance()
  console.log("eth balance l1Wallet2",balance3.toString())
  const balance4 = await l2Wallet2.getBalance()
  console.log("eth balance l2Wallet2",balance4.toString())
  // const balance5 = await L2_ERC20.getBalance()
  // console.log("eth balance5 L2_ERC20",balance5.toString())


  // L2_ERC20 transfer test
  console.log('transfer token Layer2')
  const l2_transfer = await L2_ERC20.transfer(
    l2Wallet2.address,
    1000,
    {
      gasPrice: 0
    }
  )
  await l2_transfer.wait()
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l2Wallet.address)}`) // 2000 (3000 - 1000)
  console.log(`Balance on L2_2: ${await L2_ERC20.balanceOf(l2Wallet2.address)}`) // 3000 (2000 + 1000)

  //stake test
  // console.log('--------------------------------')
  // console.log('approve staking token Layer2')
  // const l2_stakeApprove = await L2_ERC20.connect(l2Wallet).approve(
  //   L2_ERC20.address, 
  //   1000,
  //   {
  //     gasPrice: 0
  //   }
  // )
  // await l2_stakeApprove.wait()
  console.log('--------------------------------')
  console.log('staking token Layer2')
  console.log('--------------------------------')
  const l2_staking = await L2_ERC20.connect(l2Wallet).stake(
    1000,
    {
      gasPrice: 0
    }
  )
  await l2_staking.wait()
  console.log('--------------------------------')
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l2Wallet.address)}`) // 1000
  console.log(`Balance on L2_2: ${await L2_ERC20.balanceOf(l2Wallet2.address)}`) // 3000 
  console.log(`Balance on L2_2: ${await L2_ERC20.balanceOf(L2_ERC20.address)}`) // 1000
  console.log('--------------------------------')

  //unstake test
  console.log('--------------------------------')
  console.log('unstaking token Layer2')
  console.log('--------------------------------')
  const l2_unstaking = await L2_ERC20.connect(l2Wallet).unstake(
    1000,
    {
      gasPrice: 0
    }
  )
  await l2_unstaking.wait()

  console.log('--------------------------------')
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l2Wallet.address)}`) // 1000
  console.log(`Balance on L2_2: ${await L2_ERC20.balanceOf(l2Wallet2.address)}`) // 3000 
  console.log(`Balance on L2_2: ${await L2_ERC20.balanceOf(L2_ERC20.address)}`) // 1000
  console.log('--------------------------------')

  // // Burn the tokens on L2 and ask the L1 contract to unlock on our behalf.
  // console.log(`Withdrawing tokens back to L1 ERC20...`)
  // const tx3 = await L2_ERC20.withdraw(
  //   2000,
  //   {
  //     gasPrice: 0
  //   }
  // )
  // await tx3.wait()
  
  // console.log(`Withdrawing2 tokens back to L1 ERC20...`)
  // const tx4 = await L2_ERC20.connect(l2Wallet2).withdraw(
  //   2000,
  //   {
  //     gasPrice: 0
  //   }
  // )
  // await tx4.wait()

  // // Wait for the message to be relayed to L1.
  // console.log(`Waiting for withdrawal to be relayed to L1...`)
  // const [ msgHash2 ] = await watcher.getMessageHashesFromL2Tx(tx3.hash)
  // await watcher.getL1TransactionReceipt(msgHash2)

  // console.log(`Waiting for withdrawal2 to be relayed to L1...`)
  // const [ msgHash2_2 ] = await watcher.getMessageHashesFromL2Tx(tx4.hash)
  // await watcher.getL1TransactionReceipt(msgHash2_2)

  // // Log balances again!
  // console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 2000
  // console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l1Wallet.address)}`) // 0
  // console.log(`Balance on L1_2: ${await L1_ERC20.balanceOf(l1Wallet2.address)}`) // 2000
  // console.log(`Balance on L2_2: ${await L2_ERC20.balanceOf(l1Wallet2.address)}`) // 1000
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
