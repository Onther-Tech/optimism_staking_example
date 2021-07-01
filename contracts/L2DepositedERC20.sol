// SPDX-License-Identifier: MIT LICENSE
pragma solidity >0.5.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Contract Imports */
import { ERC20 } from "./ERC20.sol";

/* Library Imports */
import {
    Abs_L2DepositedToken
} from "@eth-optimism/contracts/OVM/bridge/tokens/Abs_L2DepositedToken.sol";

/**
 * @title L2DepositedERC20
 * @dev An L2 Deposited ERC20 is an ERC20 implementation which represents L1 assets deposited into L2, minting and burning on
 * deposits and withdrawals.
 *
 * `L2DepositedERC20` uses the Abs_L2DepositedToken class provided by optimism to link into a standard L1 deposit contract
 * while using the `ERC20`implementation I as a developer want to use.
 *
 * Compiler used: optimistic-solc
 * Runtime target: OVM
 */
contract L2DepositedERC20 is Abs_L2DepositedToken, ERC20 {

    struct Checkpoint {
        uint256 at;
        uint256 amount;
    }

    Checkpoint[] public stakeHistory;

    mapping (address => Checkpoint[]) public stakesFor;

    /**
     * @param _l2CrossDomainMessenger Address of the L2 cross domain messenger.
     * @param _name Name for the ERC20 token.
     */
    constructor(
        address _l2CrossDomainMessenger,
        string memory _name
    )
        Abs_L2DepositedToken(_l2CrossDomainMessenger)
        ERC20(0, _name)
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

    // function _handleInitiateStaking(
    //     address _user,
    //     uint256 _amount
    // )
    //     internal
    //     override
    // {   
    //     updateCheckpoint(stakesFor[_user], amount, false);
    //     require(transferFrom(_user, address(this), _amount), "transferFrom fail");
    // }

    function stake(
        uint256 _amount
    ) 
        public
    {
        updateCheckpoint(stakesFor[msg.sender], _amount, false);
        updateCheckpoint(stakeHistory, _amount, false);

        // transferFrom(_user, address(this), _amount);
        require(transferFrom(msg.sender, address(this), _amount), "stake transferFrom fail");    
    }


    function updateCheckpoint(
        Checkpoint[] storage history,
        uint256 amount,
        bool isUnstake
    )
        internal
    {
        uint256 length = history.length;
        if(length == 0) {
            history.push(Checkpoint({at: block.number, amount: amount}));
            return;
        }

        if(history[length-1].at < block.number) {
            history.push(Checkpoint({at: block.number, amount: history[length-1].amount}));
        }

        Checkpoint storage checkpoint = history[length];

        if (isUnstake) {
            checkpoint.amount = checkpoint.amount - amount;
        } else {
            checkpoint.amount = checkpoint.amount + amount;
        }

    }

    function unstake(
        uint256 _amount
    )
        public 
    {
        require(totalStakedFor(msg.sender) >= _amount, "lack the staking amount");

        updateCheckpoint(stakesFor[msg.sender], _amount, true);
        updateCheckpoint(stakeHistory, _amount, true);
        
        // transfer(msg.sender, _amount);
        require(transfer(msg.sender, _amount), "unstake transfer fail");
    }

    //addr가 얼만큼 스테이킹했는지 리턴해줌
    function totalStakedFor(
        address _addr
    )
        public 
        view
        returns (
            uint256
        )
    {
        Checkpoint[] storage stakes = stakesFor[_addr];

        if (stakes.length == 0) {
            return 0;
        }

        return stakes[stakes.length-1].amount;
    }   

    //addr가 언제 마지막으로 스테이킹했는지 리턴해줌
    function lastStakedBlock(
        address _addr
    )
        public
        view
        returns (
            uint256
        )
    {
        Checkpoint[] storage stakes = stakesFor[_addr];

        if (stakes.length == 0) {
            return 0;
        }

        return stakes[stakes.length-1].at;
    }


}
