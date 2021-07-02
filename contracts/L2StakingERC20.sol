// SPDX-License-Identifier: MIT LICENSE
pragma solidity >0.5.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Contract Imports */
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/**
 * @title L2StakingERC20
 */
contract L2StakingERC20 {

    struct Checkpoint {
        uint256 at;
        uint256 amount;
    }

    IERC20 public ton;

    Checkpoint[] public stakeHistory;

    mapping (address => Checkpoint[]) public stakesFor;

    constructor(
        address _ton
    )
       public
    {
        ton = IERC20(_ton);
    }
    
    function stake(
        uint256 _amount
    ) 
        external
    {
        updateCheckpoint(stakesFor[msg.sender], _amount, false);
        updateCheckpoint(stakeHistory, _amount, false);

        require(ton.transferFrom(msg.sender, address(this), _amount), "stake transfer fail");    
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
        external 
    {
        require(totalStakedFor(msg.sender) >= _amount, "lack the staking amount");

        updateCheckpoint(stakesFor[msg.sender], _amount, true);
        updateCheckpoint(stakeHistory, _amount, true);
        
        // transfer(msg.sender, _amount);
        require(ton.transfer(msg.sender, _amount), "unstake transfer fail");
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
