An L2 Deposited ERC20 is an ERC20 implementation which represents L1 assets deposited into L2, minting and burning on

deposits and withdrawals.

`L2DepositedERC20` uses the Abs_L2DepositedToken class provided by optimism to link into a standard L1 deposit contract

while using the `ERC20`implementation I as a developer want to use.

Compiler used: optimistic-solc

Runtime target: OVM

# Functions Summary:

- [`constructor(address _l2CrossDomainMessenger, string _name)`](#L2DepositedERC20-constructor-address-string-)

###### *L2DepositedERC20-constructor-address-string-*

# Function `constructor`

**constructor(address _l2CrossDomainMessenger, string _name)**

No description

### Parameters:

- `_l2CrossDomainMessenger`: Address of the L2 cross domain messenger.

- `_name`: Name for the ERC20 token.
