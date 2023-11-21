const { ethers, upgrades } = require("hardhat");

async function main() {
  const RadV2 = await ethers.getContractFactory("Radiance");
  console.log("Upgrading Rad...");
  await upgrades.upgradeProxy(
    "0xceD9E5AB811af5aab9Dd8B61962312d88bfcf687",
    RadV2
  );
  console.log("Marketplace upgraded");
}

main();
