const ethers = require('ethers')
const { Watcher } = require('@eth-optimism/watcher')
const { getContractFactory } = require('@eth-optimism/contracts')

// Set up some contract factories. You can ignore this stuff.
const factory = (name, ovm = false) => {
  const artifact = require(`./artifacts${ovm ? '-ovm' : ''}/contracts/${name}.sol/${name}.json`)
  return new ethers.ContractFactory(artifact.abi, artifact.bytecode)
}
const factory__L1_ERC721 = factory('ERC721')
const factory__L2_ERC721 = factory('L2DepositedERC721', true)
const factory__L1_ERC721Gateway = getContractFactory('OVM_L1ERC20Gateway')
//const factory__L1_ERC721Gateway = getContractFactory('OVM_L1ERC721Gateway')
//const factory__L1_ERC721Gateway = factory('OVM_L1ERC721Gateway')

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

  // Deploy an ERC721 token on L1.
  console.log('Deploying L1 ERC721...')
  const L1_ERC721 = await factory__L1_ERC721.connect(l1Wallet).deploy(
    0, //initial Id
    'L1 ERC721', //name
  )
  await L1_ERC721.deployTransaction.wait()

  // Deploy the paired ERC721 token to L2.
  console.log('Deploying L2 ERC721...')
  const L2_ERC721 = await factory__L2_ERC721.connect(l2Wallet).deploy(
    l2MessengerAddress,
    'L2 ERC721', //name
    {
      gasPrice: 0
    }
  )
  await L2_ERC721.deployTransaction.wait()

  // Create a gateway that connects the two contracts.
  console.log('Deploying L1 ERC721 Gateway...')
  const L1_ERC721Gateway = await factory__L1_ERC721Gateway.connect(l1Wallet).deploy(
    L1_ERC721.address,
    L2_ERC721.address,
    l1MessengerAddress
  )
  await L1_ERC721Gateway.deployTransaction.wait()

  // mint
  const txMint = await L1_ERC721.mint(l1Wallet.address, 1234)
  await txMint.wait()

  // Make the L2 ERC721 aware of the gateway contract.
  console.log('Initializing L2 ERC721...')
  const tx0 = await L2_ERC721.init(
    L1_ERC721Gateway.address,
    {
      gasPrice: 0
    }
  )
  await tx0.wait()

  // Initial balances.
  console.log(`Balance on L1: ${await L1_ERC721.balanceOf(l1Wallet.address)}`) // 1
  console.log(`Balance on L2: ${await L2_ERC721.balanceOf(l1Wallet.address)}`) // 0

  // Allow the gateway to lock up some of our tokens.
  console.log('Approving tokens for ERC721 gateway...')
  const tx1 = await L1_ERC721.approve(L1_ERC721Gateway.address, 1234)
  await tx1.wait()

  // Lock the tokens up inside the gateway and ask the L2 contract to mint new ones.
  console.log('Depositing tokens into L2 ERC721...')
  const tx2 = await L1_ERC721Gateway.deposit(1234)
  await tx2.wait()

  // Wait for the message to be relayed to L2.
  console.log('Waiting for deposit to be relayed to L2...')
  const [ msgHash1 ] = await watcher.getMessageHashesFromL1Tx(tx2.hash)
  await watcher.getL2TransactionReceipt(msgHash1)

  // Log some balances to see that it worked!
  console.log(`Balance on L1: ${await L1_ERC721.balanceOf(l1Wallet.address)}`) // 0
  console.log(`Balance on L2: ${await L2_ERC721.balanceOf(l1Wallet.address)}`) // 1

  // Burn the tokens on L2 and ask the L1 contract to unlock on our behalf.
  console.log(`Withdrawing tokens back to L1 ERC721...`)
  const tx3 = await L2_ERC721.withdraw(
    1234,
    {
      gasPrice: 0
    }
  )
  await tx3.wait()

  // Wait for the message to be relayed to L1.
  console.log(`Waiting for withdrawal to be relayed to L1...`)
  const [ msgHash2 ] = await watcher.getMessageHashesFromL2Tx(tx3.hash)
  await watcher.getL1TransactionReceipt(msgHash2)

  // Log balances again!
  console.log(`Balance on L1: ${await L1_ERC721.balanceOf(l1Wallet.address)}`) // 1
  console.log(`Balance on L2: ${await L2_ERC721.balanceOf(l1Wallet.address)}`) // 0
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
