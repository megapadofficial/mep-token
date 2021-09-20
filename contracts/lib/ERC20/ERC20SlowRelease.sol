//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./ERC20.sol";


abstract contract ERC20SlowRelease is ERC20, Ownable{
    using SafeMath for uint256;

    struct LockInfo{
        uint256 amount;
        uint256 endTimestamp;
        uint256 lastClaimTimestamp;
    }

    mapping(address => uint256) internal _balancesLock;
    mapping(address => LockInfo) internal _lockInfo;
    mapping(address => bool) public pools;
    address[] public pools_array;
    uint256 public lockTime;
    
    modifier onlyPools {
        require(pools[msg.sender], "Not in pools member.");
        _;
    }
    
    event PoolAdded(address indexed pool);
    event PoolRemoved(address indexed pool);

    constructor(uint256 _lockTime) Ownable(){
        lockTime = _lockTime;
    }

    /*
     *  Parameter-Getters
     */

    /**
     * @dev get unlocked amount that could be claim
     *  NOTE: if user do a manual-claim the remaining lock time will 
     *      reset to `lockTime` again.
     */
    function getUnlockedToClaim(address account) public view returns (uint256) {
        if(block.timestamp > _lockInfo[account].endTimestamp){
            return _balancesLock[account];
        }
        else{
            uint256 progressTime = block.timestamp.sub(_lockInfo[account].lastClaimTimestamp);
            return _lockInfo[account].amount.mul(progressTime).div(lockTime);
        }
    }
    
    /**
     * @dev get amount that locked in pool.
     */
    function balanceLockOf(address account) public view returns (uint256) {
        return _balancesLock[account];
    }
    
    /**
     * @dev get latest claim action that happen for both manual-claim and auto-claim.
     */
    function getLastClaimTimestamp(address account) public view returns (uint256) {
        return _lockInfo[account].lastClaimTimestamp;
    }
    
    /**
     * @dev get full release timestamp for user account.
     */
    function getEndTimestamp(address account) public view returns (uint256) {
        return _lockInfo[account].endTimestamp;
    }

    /*
     *  Parameter-Setters
     */

    function setLockTime(uint256 _lockTime) public onlyOwner {
        lockTime = _lockTime;
    }
    
    /**
     * @dev Pool transfer slow-release to user with `lockTime`.
     *      NOTE: If you want to do the partial lock
     *        using both transfer and transferWithLock 
     *        to the specified amount.
     */
    function transferWithLock(address recipient, uint256 amount) public onlyPools returns (bool) {
        require(amount > 0, "amount: invalid amount");
        _transferWithLock(_msgSender(), recipient, amount);
        return true;
    }

    /**
     * @dev User manual claim
     */
    function claimUnlocked() public {
        _claimUnlocked(_msgSender());
    }

    /*
     *  Internal function
     */

    /**
     * @dev Transfer from sender balance to locking balance. 
     * and compute slow-release with `lockTime`.
     */
    function _transferWithLock (address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), 'ERC20: transfer from the zero address');
        require(recipient != address(0), 'ERC20: transfer to the zero address');
        
        // claim for receiver
        _claimUnlocked(recipient);
        if(lockTime == 0){
            // If there's no locktime do normal transfer
            _transfer(sender, recipient, amount);
            return;
        }

        _balances[sender] = _balances[sender].sub(amount, 'ERC20: transfer amount exceeds balance');
        // update lock balance
        _balancesLock[recipient] = _balancesLock[recipient].add(amount);
        _lockInfo[recipient].amount = _lockInfo[recipient].amount.add(amount);
        _lockInfo[recipient].endTimestamp = block.timestamp.add(lockTime);
        _lockInfo[recipient].lastClaimTimestamp = block.timestamp;
        emit Transfer(sender, recipient, amount);
    }
    
    /**
     * @dev Compute unlocked from slow-release transfer to normal-pool balance
     *  Average and reset end time to + `lockTime` again.
     */
    function _claimUnlocked(address account) internal {
        uint256 unlockAmount = getUnlockedToClaim(account);
        if (unlockAmount > 0 && unlockAmount <= _balancesLock[account]) {
            uint256 lockAmount = _balancesLock[account].sub(unlockAmount);
            if (_lockInfo[account].endTimestamp < block.timestamp) {
                // Full-Released
                _balances[account] = _balances[account].add(_balancesLock[account]);
                _balancesLock[account] = 0;
                _lockInfo[account].amount = 0;
                _lockInfo[account].endTimestamp = 0;
            } else {
                // Partial-Released
                _balances[account] = _balances[account].add(unlockAmount);
                _balancesLock[account] = lockAmount;

                // Extend time and reset lock
                _lockInfo[account].amount = lockAmount;
                _lockInfo[account].endTimestamp = block.timestamp.add(lockTime);
            }
            // set last claim block
            _lockInfo[account].lastClaimTimestamp = block.timestamp;
        }
    }
    

    
    // Add new Pool
    function addPool(address pool_address) public onlyOwner {
        require(pools[pool_address] == false, "poolExisted");
        pools[pool_address] = true;
        pools_array.push(pool_address);
        emit PoolAdded(pool_address);
    }

    // Remove a pool
    function removePool(address pool_address) public onlyOwner {
        require(pools[pool_address] == true, "!pool");
        // Delete from the mapping
        delete pools[pool_address];
        // 'Delete' from the array by setting the address to 0x0
        for (uint256 i = 0; i < pools_array.length; i++) {
            if (pools_array[i] == pool_address) {
                pools_array[i] = address(0); // This will leave a null in the array and keep the indices the same
                break;
            }
        }
        emit PoolRemoved(pool_address);
    }
}
