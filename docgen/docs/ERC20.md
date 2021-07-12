A super simple ERC20 implementation! Also *very* insecure. Do not use in prod.

# Functions Summary:

- [`constructor(uint256 _initialSupply, string _name)`](#ERC20-constructor-uint256-string-)

- [`balanceOf(address _owner)`](#ERC20-balanceOf-address-)

- [`transfer(address _to, uint256 _amount)`](#ERC20-transfer-address-uint256-)

- [`transferFrom(address _from, address _to, uint256 _amount)`](#ERC20-transferFrom-address-address-uint256-)

- [`approve(address _spender, uint256 _amount)`](#ERC20-approve-address-uint256-)

- [`allowance(address _owner, address _spender)`](#ERC20-allowance-address-address-)

# Events Summary:

- [`Transfer(address _from, address _to, uint256 _value)`](#ERC20-Transfer-address-address-uint256-)

- [`Approval(address _owner, address _spender, uint256 _value)`](#ERC20-Approval-address-address-uint256-)

###### *ERC20-constructor-uint256-string-*

# Function `constructor`

**constructor(uint256 _initialSupply, string _name)**

No description

### Parameters:

- `_initialSupply`: Initial maximum token supply.

- `_name`: A name for our ERC20 (technically optional, but it's fun ok jeez).

###### *ERC20-balanceOf-address-*

# Function `balanceOf`

**balanceOf(address _owner)**

No description

### Parameters:

- `_owner`: Address to check a balance for.

### Return Values:

- Balance of the address.

###### *ERC20-transfer-address-uint256-*

# Function `transfer`

**transfer(address _to, uint256 _amount)**

No description

### Parameters:

- `_to`: Address to transfer a balance to.

- `_amount`: Amount to transfer to the other account.

### Return Values:

- true if the transfer was successful.

###### *ERC20-transferFrom-address-address-uint256-*

# Function `transferFrom`

**transferFrom(address _from, address _to, uint256 _amount)**

No description

### Parameters:

- `_from`: Account to transfer a balance from.

- `_to`: Account to transfer a balance to.

- `_amount`: Amount to transfer to the other account.

### Return Values:

- true if the transfer was successful.

###### *ERC20-approve-address-uint256-*

# Function `approve`

**approve(address _spender, uint256 _amount)**

No description

### Parameters:

- `_spender`: Account to approve a balance for.

- `_amount`: Amount to allow the account to spend from your account.

### Return Values:

- true if the allowance was successful.

###### *ERC20-allowance-address-address-*

# Function `allowance`

**allowance(address _owner, address _spender)**

No description

### Parameters:

- `_owner`: Address of the account to check an allowance from.

- `_spender`: Address of the account trying to spend from the owner.

### Return Values:

- Allowance for the spender from the owner.

###### *ERC20-Transfer-address-address-uint256-*

# Event `Transfer`

**emit Transfer(address _from, address _to, uint256 _value)**

No description

###### *ERC20-Approval-address-address-uint256-*

# Event `Approval`

**emit Approval(address _owner, address _spender, uint256 _value)**

No description
