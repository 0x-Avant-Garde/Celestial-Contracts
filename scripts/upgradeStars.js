const { ethers, upgrades } = require("hardhat");

async function main() {
  const StarsV2 = await ethers.getContractFactory("Stars");
  console.log("Upgrading Stars...");
  await upgrades.upgradeProxy(
    "0x3b3edab64a95C48B086302107D33b1B58A44f631",
    StarsV2
  );
  console.log("Marketplace upgraded");
}

main();
