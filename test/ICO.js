const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ICO", function () {
  let ICO;
  let ico;
  let owner;
  let addr1;
  let addr2;
  let investor;

  beforeEach(async function () {
    [owner, addr1, addr2, investor] = await ethers.getSigners();
    ICO = await ethers.getContractFactory("ICO");
    ico = await ICO.deploy(owner.address, "TOKEN_ADDRESS");
    await ico.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await ico.admin()).to.equal(owner.address);
    });

    it("Should set the correct ICO wallet", async function () {
      expect(await ico.ICOWallet()).to.equal(owner.address);
    });
    
    it("Should set the correct token address", async function () {
      expect(await ico.token()).to.equal("TOKEN_ADDRESS");
    });

    it("Should set the correct initial ICO state", async function () {
      expect(await ico.ICOState()).to.equal(0); // State.BEFORE = 0
    });

    it("Should set the correct initial ICO details", async function () {
      expect(await ico.tokenPrice()).to.equal(0.0001);
      expect(await ico.hardCap()).to.equal(500);
      expect(await ico.raisedAmount()).to.equal(0);
      expect(await ico.minInvestment()).to.equal(0.001);
      expect(await ico.maxInvestment()).to.equal(3);
    });
  });

  describe("Transactions", function () {
    it("Should not allow investing before ICO starts", async function () {
      await expect(
        ico.connect(investor).invest({ value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("ICO isn't running");
    });
    
    it("Should allow investing during ICO", async function () {
      await ico.connect(owner).startICO();

      // Send investment below minInvestment, should fail
      await expect(
        ico.connect(investor).invest({ value: ethers.utils.parseEther("0.0005") })
      ).to.be.revertedWith("Check Min and Max Investment");

      // Invest the minimum amount allowed
      await ico.connect(investor).invest({ value: ethers.utils.parseEther("0.001") });

      // Check that the investor's investedAmountOf has been updated correctly
      expect(await ico.investedAmountOf(investor.address)).to.equal(ethers.utils.parseEther("0.001"));

      // Check that raisedAmount has been updated correctly
      expect(await ico.raisedAmount()).to.equal(ethers.utils.parseEther("0.001"));
    });
    
    it("Should not allow investing after ICO ends", async function () {
      await ico.connect(owner).startICO();
      
      // Advance time to icoEndTime
      const icoEndTime = (await ico.icoEndTime()).toNumber();
      await ethers.provider.send("evm_setNextBlockTimestamp", [icoEndTime + 1]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(
        ico.connect(investor).invest({ value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("ICO already Reached Maximum time limit");
    });
  });
});