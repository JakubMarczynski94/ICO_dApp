// Import required modules
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ICO", function () {
  let ico;
  let owner;
  let addr1;

  // Deploy the contract before each test
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const ICO = await ethers.getContractFactory("ICO");
    ico = await ICO.deploy(
      "My Token",
      "MTK",
      ethers.utils.parseEther("0.1"), // minPurchase
      ethers.utils.parseEther("10"), // maxPurchase
      1000, // rate
      ethers.utils.parseEther("100"), // softCap
      ethers.utils.parseEther("1000"), // hardCap
      Math.floor(Date.now() / 1000) + 60 * 60, // start time (1 hour from now)
      Math.floor(Date.now() / 1000) + 24 * 60 * 60 // end time (24 hours from now)
    );

    await ico.deployed();
  });

  it("should have correct initial values", async function () {
    expect(await ico.name()).to.equal("My Token");
    expect(await ico.symbol()).to.equal("MTK");
    expect(await ico.minPurchase()).to.equal(ethers.utils.parseEther("0.1"));
    expect(await ico.maxPurchase()).to.equal(ethers.utils.parseEther("10"));
    expect(await ico.rate()).to.equal(1000);
    expect(await ico.softCap()).to.equal(ethers.utils.parseEther("100"));
    expect(await ico.hardCap()).to.equal(ethers.utils.parseEther("1000"));
    expect(await ico.startTime()).to.be.above(Math.floor(Date.now() / 1000) - 1);
    expect(await ico.endTime()).to.be.above(Math.floor(Date.now() / 1000) + 59);
    expect(await ico.active()).to.equal(true);
  });

  it("should allow deposits during ICO", async function () {
    const purchaseAmount = ethers.utils.parseEther("0.5");
    await expect(() => owner.sendTransaction({ to: ico.address, value: purchaseAmount }))
      .to.changeTokenBalance(ico, purchaseAmount.mul(1000));

    expect(await ico.balanceOf(owner.address)).to.equal(purchaseAmount.mul(1000));
  });

  it("should not allow deposits before ICO starts", async function () {
    await expect(addr1.sendTransaction({ to: ico.address, value: ethers.utils.parseEther("1") }))
      .to.be.revertedWith("ICO has not started yet");
  });

  it("should not allow deposits after ICO ends", async function () {
    await ethers.provider.send("evm_setNextBlockTimestamp", [await ico.endTime()]);
    await expect(owner.sendTransaction({ to: ico.address, value: ethers.utils.parseEther("1") }))
      .to.be.revertedWith("ICO has ended");
  });

  it("should not allow deposits below minimum purchase", async function () {
    await expect(owner.sendTransaction({ to: ico.address, value: ethers.utils.parseEther("0.05") }))
      .to.be.revertedWith("Amount is below minimum purchase limit");
  });

  it("should not allow deposits above maximum purchase", async function () {
    await expect(owner.sendTransaction({ to: ico.address, value: ethers.utils.parseEther("11") }))
      .to.be.revertedWith("Amount is above maximum purchase limit");
  });

  it("should allow owner to stop ICO", async function () {
    await ico.stopICO();
    expect(await ico.active()).to.equal(false);
  });

  it("should not allow non-owner to stop ICO", async function () {
    await expect(ico.connect(addr1).stopICO()).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should not allow withdrawals while ICO is active", async function () {
    await expect(ico.withdraw()).to.be.revertedWith("Cannot withdraw while ICO is active");
  });

  it("should not allow withdrawal if soft cap is not reached", async function () {
    await expect(ico.connect(addr1).claim()).to.be.revertedWith("Soft cap not reached");
  });

  it("should not allow claiming if user has no tokens", async function () {
    await expect(ico.claim()).to.be.revertedWith("No tokens to claim");
  });

  it("should allow users to claim after ICO ends", async function () {
    const purchaseAmount = ethers.utils.parseEther("0.5");
    await owner.sendTransaction({ to: ico.address,
    value: purchaseAmount
    });
    
    await ethers.provider.send("evm_setNextBlockTimestamp", [await ico.endTime() + 1]);
    
    const balanceBefore = await owner.getBalance();
    const amountToClaim = purchaseAmount.mul(1000).div(2); // Claim half of purchased tokens
    
    // Use the `connect()` method to create a new instance of the contract with the specified account as the signer
    await expect(() => ico.connect(owner).claim())
      .to.changeEtherBalance(owner, amountToClaim.div(1000));
    
    expect(await ico.balanceOf(owner.address)).to.equal(purchaseAmount.mul(1000).sub(amountToClaim));
    expect(await owner.getBalance()).to.be.above(balanceBefore);
    });
    
    it("should allow owner to withdraw after ICO ends and soft cap is reached", async function () {
    const purchaseAmount = ethers.utils.parseEther("5");
    await owner.sendTransaction({ to: ico.address, value: purchaseAmount });
    
    await ethers.provider.send("evm_setNextBlockTimestamp", [await ico.endTime() + 1]);
    
    const balanceBefore = await owner.getBalance();
    
    // Use the `connect()` method to create a new instance of the contract with the specified account as the signer
    await expect(() => ico.connect(owner).withdraw())
      .to.changeEtherBalance(owner, purchaseAmount);
    
    expect(await ico.active()).to.equal(false);
    expect(await ico.balanceOf(owner.address)).to.equal(0);
    expect(await owner.getBalance()).to.be.above(balanceBefore);
    });
    
    it("should not allow owner to withdraw after ICO ends and soft cap is not reached", async function () {
    await ethers.provider.send("evm_setNextBlockTimestamp", [await ico.endTime() + 1]);
    await expect(ico.withdraw()).to.be.revertedWith("Soft cap not reached");
    });
    });