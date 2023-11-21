const fs = require("fs");
const { ethers, upgrades } = require("hardhat");

let contracts = [];

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log(
    "Account balance:",
    (await deployer.getBalance()).toString() / 1e18
  );

  // CHANGE IN PRODUCTION
  const factoryAddress = "0xbCa3a77803035824E161219e706BB17DF1Aa00F7";
  const router = "0xe0217e34d6deF118Ab84F0BC5F13a9AebB42fAC9";
  const busd = "0xb9Cfd5b0A4b54cD9928aD8ffe74dBe6e8aE6E4FA";
  const cash = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  const printer = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  const bond = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const DAO = deployer.address;
  const teamMember1 = deployer.address;
  const teamMember2 = deployer.address;
  const teamMember3 = deployer.address;
  const teamMember4 = deployer.address;
  const teamMember5 = deployer.address;

  const day = 60 * 60 * 24;
  const rewardPerBlock = ethers.utils.parseEther(".002");
  console.log("Reward Per Block", rewardPerBlock);

  // 1. Deploy Radiance
  const balanceBefore = (await deployer.getBalance()).toString();
  const Radiance = await ethers.getContractFactory("Radiance");
  const radiance = await upgrades.deployProxy(Radiance);

  await radiance.deployed();
  const radianceImplementation =
    await upgrades.erc1967.getImplementationAddress(radiance.address);

  console.log(`Radiance deployed to ${radiance.address}`);
  contracts.push({
    name: "Radiance",
    address: radiance.address,
    implementation: radianceImplementation,
  });

  // 2. Create RAD/BUSD LP
  const RouterInstance = await ethers.getContractAt(
    "IUniswapV2Router02",
    router
  );

  const BusdInstance = await ethers.getContractAt("IBasisAsset", busd);

  const approveRadiance = await radiance.approve(
    router,
    ethers.utils.parseEther("1.0")
  );
  await approveRadiance.wait(1);
  const approved = await radiance.allowance(deployer.address, router);
  console.log("Radiance", approved);

  const approveBusd = await BusdInstance.approve(
    router,
    ethers.utils.parseEther("1.1")
  );
  await approveBusd.wait(1);
  const bapproved = await BusdInstance.allowance(deployer.address, router);
  console.log("BUSD", bapproved);

  console.log("Creating LP");
  const currentBlock = await ethers.provider.getBlock("latest");
  const addLiquidity = await RouterInstance.addLiquidity(
    radiance.address,
    busd,
    ethers.utils.parseEther("1.0"),
    ethers.utils.parseEther("1.1"),
    0,
    0,
    deployer.address,
    currentBlock.timestamp * 2
  );
  await addLiquidity.wait(1);

  const Factory = await ethers.getContractAt("IFactory", factoryAddress);
  const radiancePair = await Factory.getPair(radiance.address, busd);
  console.log(`RAD/BUSD LP pair created at ${radiancePair}`);

  // 3. Deploy Stars
  const Stars = await ethers.getContractFactory("Stars");
  const stars = await upgrades.deployProxy(Stars, [radiance.address]);
  await stars.deployed();
  const starsImplementation = await upgrades.erc1967.getImplementationAddress(
    stars.address
  );
  console.log(`Stars deployed to ${stars.address}`);
  contracts.push({
    name: "Stars",
    address: stars.address,
    implementation: starsImplementation,
  });

  // 4. Create STARS/BUSD LP and STARS/RAD LP

  const approveStars = await stars.approve(
    router,
    ethers.utils.parseEther("1.0")
  );
  await approveStars.wait(1);
  const approvedStars = await stars.allowance(deployer.address, router);
  console.log("Stars", approvedStars);

  const approveBusd2 = await BusdInstance.approve(
    router,
    ethers.utils.parseEther("8")
  );
  await approveBusd2.wait(1);
  const bapproved2 = await BusdInstance.allowance(deployer.address, router);
  console.log("BUSD", bapproved2);

  console.log("Creating LP");
  const currentBlock2 = await ethers.provider.getBlock("latest");
  const addLiquidity2 = await RouterInstance.addLiquidity(
    stars.address,
    busd,
    ethers.utils.parseEther("1"),
    ethers.utils.parseEther("8"),
    0,
    0,
    deployer.address,
    currentBlock2.timestamp * 2
  );
  await addLiquidity2.wait(1);

  const starsPair = await Factory.getPair(stars.address, busd);
  console.log(`STARS/BUSD pair created at ${starsPair}`);

  const approveStars2 = await stars.approve(
    router,
    ethers.utils.parseEther("1")
  );
  await approveStars2.wait(1);
  const approvedStars2 = await stars.allowance(deployer.address, router);
  console.log("Stars", approvedStars2);

  const approveBusd3 = await radiance.approve(
    router,
    ethers.utils.parseEther("7.25")
  );
  await approveBusd3.wait(1);
  const bapproved3 = await radiance.allowance(deployer.address, router);
  console.log("Radiance", bapproved3);

  console.log("Creating LP");
  const currentBlock3 = await ethers.provider.getBlock("latest");
  const addLiquidity3 = await RouterInstance.addLiquidity(
    stars.address,
    radiance.address,
    ethers.utils.parseEther("1"),
    ethers.utils.parseEther("7.25"),
    0,
    0,
    deployer.address,
    currentBlock3.timestamp * 2
  );
  await addLiquidity3.wait(1);

  const starsRadPair = await Factory.getPair(stars.address, radiance.address);
  console.log(`STARS/RAD pair created at ${starsRadPair}`);

  // 5. Deploy Glow
  const Glow = await ethers.getContractFactory("Glow");
  const glow = await upgrades.deployProxy(Glow);
  await glow.deployed();
  const glowImplementation = await upgrades.erc1967.getImplementationAddress(
    glow.address
  );
  console.log(`Glow deployed to ${glow.address}`);
  contracts.push({
    name: "Glow",
    address: glow.address,
    implementation: glowImplementation,
  });

  // 6. Deploy Oracle
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy(radiancePair);
  await oracle.deployed();

  console.log(`Oracle deployed to ${oracle.address}`);
  contracts.push({
    name: "Oracle",
    address: oracle.address,
    implementation: null,
  });

  // 7. Deploy Boardroom for STARS/BUSD
  const LPboardroom = await ethers.getContractFactory("Boardroom");
  const lpBoardroom = await upgrades.deployProxy(LPboardroom, [
    radiance.address,
    starsPair,
  ]);
  await lpBoardroom.deployed();
  const lpBoardroomImplementation =
    await upgrades.erc1967.getImplementationAddress(lpBoardroom.address);
  console.log(`LP Boardroom deployed to ${lpBoardroom.address}`);
  contracts.push({
    name: "LP Boardroom",
    address: lpBoardroom.address,
    implementation: lpBoardroomImplementation,
  });

  // 7a. Deploy Boardroom for STARS SaS
  const SASBoardroom = await ethers.getContractFactory("Boardroom");
  const sasBoardroom = await upgrades.deployProxy(SASBoardroom, [
    radiance.address,
    stars.address,
  ]);
  await sasBoardroom.deployed();
  const sasBoardroomImplementation =
    await upgrades.erc1967.getImplementationAddress(sasBoardroom.address);
  console.log(`SAS Boardroom deployed to ${sasBoardroom.address}`);
  contracts.push({
    name: "SaS Boardroom",
    address: sasBoardroom.address,
    implementation: sasBoardroomImplementation,
  });

  // 8. Deploy Treasury
  const startTime = await ethers.provider.getBlock("latest");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await upgrades.deployProxy(Treasury, [
    radiance.address,
    stars.address,
    glow.address,
    oracle.address,
    lpBoardroom.address,
    sasBoardroom.address,
    DAO,
    startTime.timestamp,
  ]);
  await treasury.deployed();
  const treasuryImplementation =
    await upgrades.erc1967.getImplementationAddress(treasury.address);
  console.log(`Treasury deployed to ${treasury.address}`);
  contracts.push({
    name: "Treasury",
    address: treasury.address,
    implementation: treasuryImplementation,
  });

  // 9. Big Bang Radiance
  await radiance.bigBang(
    treasury.address,
    stars.address,
    busd,
    radiancePair,
    router
  );
  console.log("Big Bang Radiance");

  // 10. Big Bang Glow
  await glow.bigBang(treasury.address);
  console.log("Big Bang Glow");

  // 11. Big Bang Stars
  await stars.bigBang(
    glow.address,
    oracle.address,
    treasury.address,
    starsPair,
    router,
    true
  );
  console.log("Big Bang Stars");

  // 12a. Big Bang Boardroom
  await lpBoardroom.bigBang(treasury.address);
  console.log("Big Bang LP Boardroom");

  // 12b. Big Bang Boardroom
  await sasBoardroom.bigBang(treasury.address);
  console.log("Big Bang SaS Boardroom");

  // 13 Deploy NFT
  const NFT = await ethers.getContractFactory("BoostNft");
  const nft = await upgrades.deployProxy(NFT);
  await nft.deployed();
  const nftImplementation = await upgrades.erc1967.getImplementationAddress(
    nft.address
  );
  console.log(`NFT deployed to ${nft.address}`);
  contracts.push({
    name: "NFT",
    address: nft.address,
    implementation: nftImplementation,
  });

  // 14 Deploy Team Distributor
  const TeamDistributor = await ethers.getContractFactory("TeamDistributor");
  const teamDistributor = await upgrades.deployProxy(TeamDistributor, [
    DAO,
    deployer.address,
    teamMember1,
    teamMember2,
    teamMember3,
    teamMember4,
    teamMember5,
  ]);
  await teamDistributor.deployed();
  const teamDistributorImplementation =
    await upgrades.erc1967.getImplementationAddress(teamDistributor.address);
  console.log(`Team Distributor deployed to ${teamDistributor.address}`);
  contracts.push({
    name: "Team Distributor",
    address: teamDistributor.address,
    implementation: teamDistributorImplementation,
  });

  // 15. Deploy Farm
  const startBlock = await ethers.provider.getBlock("latest");
  const Farm = await ethers.getContractFactory("Farm");
  const farm = await upgrades.deployProxy(Farm, [
    stars.address,
    startBlock.timestamp + 300, // + day, Start Farm after 24hr
    DAO,
    nft.address,
    teamDistributor.address,
  ]);
  await farm.deployed();
  const farmImplementation = await upgrades.erc1967.getImplementationAddress(
    farm.address
  );
  console.log(`Farm deployed to ${farm.address}`);
  contracts.push({
    name: "LP Farm",
    address: farm.address,
    implementation: farmImplementation,
  });

  //15a. Fund Farm
  const initialMint = await stars.mint(DAO, ethers.utils.parseEther("94500"));
  await initialMint.wait(1);

  const approveForFarm = await stars.approve(
    farm.address,
    ethers.utils.parseEther("94500")
  );

  await approveForFarm.wait(1);

  await farm.fund(ethers.utils.parseEther("94500"));

  const bigBangFarm = await nft.bigBang(farm.address, DAO);
  console.log("Big Bang NFT");
  await bigBangFarm.wait(1);
  await nft.setNFT(
    "Genesis",
    ethers.utils.parseEther("1"),
    1,
    100,
    28500,
    true
  );
  console.log("NFT Added");

  // 15b.  Add Stars SaS Pool (in case we ever want to use this it needs to be pid 0)

  await farm.add(0, stars.address, false, 0, 0);
  console.log("STARS SaS placeholder pool created with 0 weight");

  // 13c. add RAD/BUSD pool
  await farm.add(55, radiancePair, false, 0, 0);
  console.log("RAD/BUSD pool created with 55 weight");

  // 13d Add STARS/BUSD pool
  await farm.add(25, starsPair, false, 0, 0);
  console.log("STARS/BUSD pool created with 25 weight");

  // 13e Add RAD/STARS pool
  await farm.add(10, starsRadPair, false, 0, 0);
  console.log("STARS/RAD pool created with 10 weight");

  // 13f Add RAD SaS
  await farm.add(10, radiance.address, false, 0, 0);
  console.log("RAD SaS pool created with 10 weight");

  // Log and store Info

  const balanceAfter = (await deployer.getBalance()).toString();

  console.log("Balance after", balanceAfter / 1e18);
  console.log("Total Gas Actually Spent", balanceBefore - balanceAfter);
  let data = JSON.stringify(contracts);
  fs.writeFileSync("protocol.json", data);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
