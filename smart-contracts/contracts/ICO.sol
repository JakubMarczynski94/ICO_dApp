// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ICO is ERC20 {
    constructor() ERC20("ICO", "ICO") {
        _mint(msg.sender, 500000 * 1e18);
    }
}
