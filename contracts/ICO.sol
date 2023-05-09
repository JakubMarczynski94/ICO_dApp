// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ICO is ERC20, Ownable {
    uint256 public minPurchase;
    uint256 public maxPurchase;
    uint256 public rate;
    uint256 public softCap;
    uint256 public hardCap;
    uint256 public startTime;
    uint256 public endTime;
    bool public active;

    constructor(
        string memory name,
        string memory symbol,
        uint256 _minPurchase,
        uint256 _maxPurchase,
        uint256 _rate,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _startTime,
        uint256 _endTime
    ) ERC20(name, symbol) {
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;
        rate = _rate;
        softCap = _softCap;
        hardCap = _hardCap;
        startTime = _startTime;
        endTime = _endTime;
        active = true;
        transferOwnership(msg.sender);
    }

    function deposit() external payable {
        require(active, "ICO not active");
        require(block.timestamp >= startTime, "ICO has not started yet");
        require(block.timestamp <= endTime, "ICO has ended");

        uint256 amount = msg.value * rate;
        require(amount >= minPurchase, "Amount is below minimum purchase limit");
        require(amount <= maxPurchase, "Amount is above maximum purchase limit");

        _mint(msg.sender, amount);
    }

    function stopICO() external onlyOwner {
        active = false;
    }

    function withdraw() external {
        require(!active, "Cannot withdraw while ICO is active");
        require(address(this).balance >= softCap, "Soft cap not reached");

        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    function claim() external {
        require(!active, "Cannot claim while ICO is active");
        require(address(this).balance >= softCap, "Soft cap not reached");

        uint256 amount = balanceOf(msg.sender);
        require(amount > 0, "No tokens to claim");

        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount / rate);
    }
}