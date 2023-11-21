const { ethers, upgrades } = require("hardhat");

async function main() {
  const FarmV2 = await ethers.getContractFactory("Farm");
  console.log("Upgrading Farm...");
  await upgrades.upgradeProxy(
    "0x72679796F8baB1f011137cE3A9B74D528811285d",
    FarmV2
  );
  console.log("Farm upgraded");
}

main();
