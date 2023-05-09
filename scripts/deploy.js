const hre = require("hardhat");

async function main() {
  const name = "My Token";
  const symbol = "MTK";
  const minPurchase = hre.ethers.utils.parseEther("0.1");
  const maxPurchase = hre.ethers.utils.parseEther("10");
  const rate = 1000;
  const softCap = hre.ethers.utils.parseEther("1000");
  const hardCap = hre.ethers.utils.parseEther("10000");
  const startTime = Math.floor(Date.now() / 1000) + 60; // Start in 1 minute
  const endTime = Math.floor(Date.now() / 1000) + 86400; // End in 1 day

  const ICO = await hre.ethers.getContractFactory("ICO");
  const ico = await ICO.deploy(
    name,
    symbol,
    minPurchase,
    maxPurchase,
    rate,
    softCap,
    hardCap,
    startTime,
    endTime
  );

  await ico.deployed();
  console.log("ICO deployed to:", ico.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });