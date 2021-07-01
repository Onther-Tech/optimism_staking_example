// SPDX-License-Identifier: MIT LICENSE
pragma solidity >0.5.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Contract Imports */
import { ERC721 } from "./ERC721.sol";

/* Library Imports */
import {
    Abs_L2DepositedToken
} from "@eth-optimism/contracts/OVM/bridge/tokens/Abs_L2DepositedToken.sol";

/**
 * @title L2DepositedERC721
 * @dev An L2 Deposited ERC721 is an ERC721 implementation which represents L1 assets deposited into L2, minting and burning on
 * deposits and withdrawals.
 *
 * `L2DepositedERC721` uses the Abs_L2DepositedToken class provided by optimism to link into a standard L1 deposit contract
 * while using the `ERC721`implementation I as a developer want to use.
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
contract L2DepositedERC721 is Abs_L2DepositedToken, ERC721 {

    /**
     * @param _l2CrossDomainMessenger Address of the L2 cross domain messenger.
     * @param _name Name for the ERC721 token.
     */
    constructor(
        address _l2CrossDomainMessenger,
        string memory _name
    )
        Abs_L2DepositedToken(_l2CrossDomainMessenger)
        ERC721(0, _name)
    {}

    /**
     * Handler that gets called when a withdrawal is initiated.
     * @param _to Address triggering the withdrawal.
     * @param _amount Amount being withdrawn.
     */
    function _handleInitiateWithdrawal(
        address _to,
        uint256 _amount
    )
        internal
        override
    {
        _burn(msg.sender, _amount);
    }

    /**
     * Handler that gets called when a deposit is received.
     * @param _to Address receiving the deposit.
     * @param _amount Amount being deposited. 
     */
    function _handleFinalizeDeposit(
        address _to,
        uint256 _amount
    )
        internal
        override
    {
        _mint(_to, _amount);
    }
}
