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

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    IERC20 public ton;

    mapping (address => UserInfo) public userIn;

    uint256 tonPerShare = 0;
    uint256 lastRewardBlock;

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

    function getBlockPeriod(
        uint256 _from,
        uint256 _to
    ) 
        public
        view
        returns (uint256)
    {
        return _to.sub(_from);
    }

    function updateReward() public {
        if(block.number <= lastRewardBlock) {
            return;
        }
        if (totalAmount == 0) {
            lastRewardBlock = block.number;
            return;
        }
        uint256 blockPriod = getBlockPeriod(lastRewardBlock, block.number);
        uint256 tonReward = blockPriod.mul(tokenPerBlock);
        tonPerShare = tonPerShare.add(tonReward.mul(10000).div(totalAmount));
        lastRewardBlock = block.number;
    }

    function getBlocknumber() 
        external
        view
        returns (uint256)
    {      
        return lastRewardBlock;
    }

    function getNowBlock() external view returns (uint256){
        return block.number;
    }

    function deposit(
        uint256 _amount
    )
        public
    {   
        UserInfo storage user = userIn[msg.sender];
        updateReward();
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(tonPerShare).div(10000).sub(user.rewardDebt);
            safeTonTransfer(msg.sender, pending);
        }
        require(ton.transferFrom(msg.sender, address(this), _amount), "Deposit transferFrom fail");
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(tonPerShare).div(10000);
        totalAmount = totalAmount.add(_amount);
    }

    function withdraw(
        uint256 _amount
    )
        public
    {
        UserInfo storage user = userIn[msg.sender];
        require(user.amount >= _amount, "withdraw: don't have deposit amount");
        updateReward();
        uint256 pending = user.amount.mul(tonPerShare).div(10000).sub(user.rewardDebt);
        safeTonTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(tonPerShare).div(10000);
        totalAmount = totalAmount.sub(_amount);
        require(ton.transfer(msg.sender, _amount), "Withdraw transfer fail");
    }

    function claim() external {
        UserInfo storage user = userIn[msg.sender];
        require(user.amount > 0, "claim: user don't have deposit amount");
        uint256 tonShare = tonPerShare;
        uint256 blockPeriod = getBlockPeriod(lastRewardBlock, block.number);
        uint256 tonReward = blockPeriod.mul(tokenPerBlock);
        tonShare = tonShare.add(tonReward.mul(10000).div(totalAmount));
        uint256 pending = user.amount.mul(tonShare).div(10000).sub(user.rewardDebt);
        user.rewardDebt = user.rewardDebt.add(pending);
        safeTonTransfer(msg.sender, pending);
    }

    function pendingTon(
        address _user
    )
        external
        view
        returns (uint256)
    {
        UserInfo storage user = userIn[_user];
        uint256 perShare = tonPerShare;
        if (block.number > lastRewardBlock && totalAmount != 0) {
            uint256 blockPriod = getBlockPeriod(lastRewardBlock, block.number);
            uint256 tonReward = blockPriod.mul(tokenPerBlock);
            perShare = perShare.add(tonReward.mul(10000).div(totalAmount));
        }
        return user.amount.mul(perShare).div(10000).sub(user.rewardDebt);
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
