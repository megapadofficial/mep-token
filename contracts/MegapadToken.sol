//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./lib/ERC20/ERC20.sol";
import "./lib/ERC20/ERC20SlowRelease.sol";
import "./lib/ERC20/ERC20Capped.sol";

contract MegapadToken is ERC20, ERC20SlowRelease, ERC20Capped{
    using SafeMath for uint256;
    using Address for address;

    uint256 public constant maxSupply  = 1e8 * 1e18;

    /***********************************************************
     *  Constructor
     ***********************************************************/
    constructor () 
        ERC20Capped(maxSupply)
        ERC20SlowRelease(30 days)
        ERC20("Megapad", "MEP"){
        // Using ERC20 to mint maxSupply
        ERC20._mint(owner(), maxSupply);
    }

    function _mint(address account, uint256 amount) internal virtual override(ERC20, ERC20Capped){
        ERC20Capped._mint(account, amount);
    }
}
