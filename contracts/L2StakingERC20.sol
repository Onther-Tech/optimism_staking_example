// SPDX-License-Identifier: MIT LICENSE
pragma solidity >0.5.0 <0.8.0;
pragma experimental ABIEncoderV2;

/* Contract Imports */
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title L2StakingERC20
 */
contract L2StakingERC20 {
    using SafeMath for uint256;

    struct Checkpoint {
        uint256 at;
        uint256 amount;
    }

    IERC20 public ton;

    mapping (address => Checkpoint) public stakesFor;

    uint256 totalAmount = 0;

    uint256 public tokenPerBlock;

    constructor(
        address _ton,
        uint256 _tokenPerBlock
    )
       public
    {
        ton = IERC20(_ton);
        tokenPerBlock = _tokenPerBlock;
    }
    
    function stake(
        uint256 _amount
    ) 
        external
    {
        updateCheckpoint(msg.sender, _amount, false);

        require(ton.transferFrom(msg.sender, address(this), _amount), "stake transfer fail");    
    }


    function updateCheckpoint(
        address _user,
        uint256 amount,
        bool isUnstake
    )
        internal
    {
        Checkpoint storage check = stakesFor[_user];
        check.at = block.number;

        if (isUnstake) {
            check.amount = check.amount - amount;
            totalAmount = totalAmount - amount;
        } else {
            check.amount = check.amount + amount;
            totalAmount = totalAmount + amount;
        }

    }

    function unstake(
        uint256 _amount
    )
        external 
    {
        require(totalStakedFor(msg.sender) >= _amount, "lack the staking amount");

        updateCheckpoint(msg.sender, _amount, true);
        
        // transfer(msg.sender, _amount);
        require(ton.transfer(msg.sender, _amount), "unstake transfer fail");
    }

    function claim() external {
        Checkpoint storage check = stakesFor[msg.sender];

        require(totalStakedFor(msg.sender) > 0, "lack the staking amount");
        uint256 reward = ((block.number).sub(check.at)).mul(tokenPerBlock).mul(check.amount).div(totalAmount);       
        check.at = block.number;

        require(ton.transfer(msg.sender, reward), "claim transfer fail");
    }

    //addr가 얼만큼 스테이킹했는지 리턴해줌
    function totalStakedFor(
        address _user
    )
        public 
        view
        returns (
            uint256
        )
    {
        Checkpoint storage stakes = stakesFor[_user];

        return stakes.amount;
    }   

    //addr가 언제 마지막으로 스테이킹했는지 리턴해줌
    function lastStakedBlock(
        address _user
    )
        public
        view
        returns (
            uint256
        )
    {
        Checkpoint storage stakes = stakesFor[_user];

        return stakes.at;
    }

    function safeTonTransfer(
        address _to, 
        uint256 _amount
    ) internal {
        uint256 tonBal = ton.balanceOf(address(this));
        if (_amount > tonBal) {
            ton.transfer(_to, tonBal);
        } else {
            ton.transfer(_to, _amount);
        }
    }

}
