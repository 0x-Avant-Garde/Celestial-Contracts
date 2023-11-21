const {
  time,
  loadFixture,
  mine,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  HARDHAT_MEMPOOL_SUPPORTED_ORDERS,
} = require("hardhat/internal/constants");

describe("Celestial Deployment", function () {
  async function deployBaseProtocolFixture() {
    const [deployer, otherAccount] = await ethers.getSigners();

    const feeToSetter = deployer.address;

    const Factory = await hre.ethers.getContractFactory("PancakeFactory");
    const factory = await Factory.deploy(feeToSetter);

    // Deploy Factory
    await factory.deployed();

    const WETH = await hre.ethers.getContractFactory("WETH9");
    const weth = await WETH.deploy();

    await weth.deployed();

    const Router = await hre.ethers.getContractFactory("PancakeRouter");
    const router = await Router.deploy(factory.address, weth.address);
    await router.deployed();

    const Token1 = await hre.ethers.getContractFactory("Token1");
    const token1 = await Token1.deploy();
    await token1.deployed();

    const Token2 = await hre.ethers.getContractFactory("Token2");
    const token2 = await Token2.deploy();
    await token2.deployed();

    // CHANGE IN PRODUCTION
    const DAO = deployer.address;
    const TeamLockup = deployer.address;

    const busd = token2;

    const day = 60 * 60 * 24;
    const rewardPerBlock = ethers.utils.parseEther(".002");

    // 1. Deploy Radiance
    const Radiance = await ethers.getContractFactory("Radiance");
    const radiance = await upgrades.deployProxy(Radiance);

    await radiance.deployed();

    // 2. Create RAD/BUSD LP

    await radiance.approve(router.address, ethers.utils.parseEther("1.0"));

    await busd.approve(router.address, ethers.utils.parseEther("1.1"));

    const currentBlock = await ethers.provider.getBlock("latest");
    await router.addLiquidity(
      radiance.address,
      busd.address,
      ethers.utils.parseEther("1.0"),
      ethers.utils.parseEther("1.1"),
      0,
      0,
      deployer.address,
      currentBlock.timestamp * 2
    );

    const radiancePair = await factory.getPair(radiance.address, busd.address);

    // 3. Deploy Stars
    const Stars = await ethers.getContractFactory("Stars");
    const stars = await upgrades.deployProxy(Stars, [radiance.address]);
    await stars.deployed();

    // 4. Create STARS/BUSD LP and STARS/RAD LP

    await stars.approve(router.address, ethers.utils.parseEther("1.0"));

    await busd.approve(router.address, ethers.utils.parseEther("8"));

    const currentBlock2 = await ethers.provider.getBlock("latest");
    await router.addLiquidity(
      stars.address,
      busd.address,
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("8"),
      0,
      0,
      deployer.address,
      currentBlock2.timestamp * 2
    );

    const starsPair = await factory.getPair(stars.address, busd.address);

    await stars.approve(router.address, ethers.utils.parseEther("1"));

    await radiance.approve(router.address, ethers.utils.parseEther("7.25"));

    const currentBlock3 = await ethers.provider.getBlock("latest");
    await router.addLiquidity(
      stars.address,
      radiance.address,
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("7.25"),
      0,
      0,
      deployer.address,
      currentBlock3.timestamp * 2
    );

    const starsRadPair = await factory.getPair(stars.address, radiance.address);

    // 5. Deploy Glow
    const Glow = await ethers.getContractFactory("Glow");
    const glow = await upgrades.deployProxy(Glow);
    await glow.deployed();

    // 6. Deploy Oracle
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy(radiancePair);
    await oracle.deployed();

    // 7. Deploy Boardroom for STARS/BUSD
    const LPboardroom = await ethers.getContractFactory("Boardroom");
    const lpBoardroom = await upgrades.deployProxy(LPboardroom, [
      radiance.address,
      starsPair,
    ]);
    await lpBoardroom.deployed();

    // 7a. Deploy Boardroom for STARS SaS
    const SASBoardroom = await ethers.getContractFactory("Boardroom");
    const sasBoardroom = await upgrades.deployProxy(SASBoardroom, [
      radiance.address,
      stars.address,
    ]);
    await sasBoardroom.deployed();

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
    console.log("Treasury: ", treasury);
    console.log(treasury.address);

    // 14 Deploy NFT
    const NFT = await ethers.getContractFactory("BoostNft");
    const nft = await upgrades.deployProxy(NFT);
    await nft.deployed();

    // 13. Deploy Farm
    const startBlock = await ethers.provider.getBlock("latest");
    console.log("Farm Start Block", startBlock.number);
    const Farm = await ethers.getContractFactory("Farm");
    const farm = await upgrades.deployProxy(Farm, [
      // stars.address,
      // DAO,
      // rewardPerBlock,
      // startBlock.number, // + day, Start Farm after 24hr
      // DAO,
      // nft.address,
      // TeamLockup,
      stars.address,
      startBlock.timestamp + 120,
      DAO,
      nft.address,
      TeamLockup,
    ]);
    await farm.deployed();

    return {
      deployer,
      otherAccount,
      DAO,
      TeamLockup,
      radiance,
      router,
      busd,
      radiancePair,
      stars,
      starsPair,
      starsRadPair,
      glow,
      oracle,
      lpBoardroom,
      sasBoardroom,
      treasury,
      nft,
      farm,
      startBlock,
    };
  }
  describe("Deployment", function () {
    it("Should deploy all of the contracts", async function () {
      const {
        radiance,
        stars,
        glow,
        lpBoardroom,
        sasBoardroom,
        treasury,
        nft,
        farm,
      } = await loadFixture(deployBaseProtocolFixture);

      expect(radiance.address).to.exist;
      console.log(`Radiance deployed`);
      expect(stars.address).to.exist;
      console.log(`Stars deployed`);
      expect(glow.address).to.exist;
      console.log(`Glow deployed`);
      expect(lpBoardroom.address).to.exist;
      console.log(`Rad/BUSD LP Boardroom deployed`);
      expect(sasBoardroom.address).to.exist;
      console.log(`Stars SaS Boardroom deployed`);
      expect(treasury.address).to.exist;
      console.log(`Treasury deployed `);
      expect(nft.address).to.exist;
      console.log(`NFT deployed`);
      expect(farm.address).to.exist;
      console.log(`Farm deployed`);
    });
  });

  describe("Big Bang", function () {
    it("Should successfully Big Bang all the contracts", async function () {
      const {
        DAO,
        radiance,
        router,
        radiancePair,
        stars,
        starsPair,
        glow,
        busd,
        oracle,
        lpBoardroom,
        sasBoardroom,
        treasury,
        farm,
        nft,
      } = await loadFixture(deployBaseProtocolFixture);

      // 9. Big Bang Radiance
      expect(
        await radiance.bigBang(
          treasury.address,
          stars.address,
          busd.address,
          radiancePair,
          router.address
          // radiance.address,
          // radiance.address
        )
      ).to.be.ok;

      // 10. Big Bang Glow
      expect(await glow.bigBang(treasury.address)).to.be.ok;

      // 11. Big Bang Stars
      expect(
        await stars.bigBang(
          glow.address,
          oracle.address,
          treasury.address,
          starsPair,
          router.address,
          true
        )
      ).to.be.ok;

      // 12a. Big Bang Boardroom
      expect(await lpBoardroom.bigBang(treasury.address)).to.be.ok;

      // 12b. Big Bang Boardroom
      expect(await sasBoardroom.bigBang(treasury.address)).to.be.ok;

      expect(await nft.bigBang(farm.address, DAO)).to.be.ok;
    });
  });

  describe("Mint initial tokens and set up Farm Environment", function () {
    it("Should Mint STARS and fund them to the farm then set up the NFT variables", async function () {
      const {
        deployer,
        otherAccount,
        DAO,
        stars,
        radiance,
        radiancePair,
        starsPair,
        starsRadPair,
        nft,
        farm,
        startBlock,
      } = await loadFixture(deployBaseProtocolFixture);

      //13a. Fund Farm
      await stars.mint(DAO, ethers.utils.parseEther("94500"));
      console.log("94500 STARS Minted");

      await stars.approve(farm.address, ethers.utils.parseEther("94500"));

      expect(await farm.fund(ethers.utils.parseEther("94500"))).to.be.ok;
      console.log("Farm funded with 94500 STARS");

      await farm.add(0, stars.address, false, 0, 0);
      console.log("STARS SaS pool created with 0 weight");

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

      await nft.bigBang(farm.address, DAO);

      expect(
        await nft.setNFT(
          "Genesis",
          ethers.utils.parseEther("1"),
          1,
          100,
          28500,
          true
        )
      ).to.be.ok;
      console.log("Time before increase", startBlock.timestamp);
      await time.increaseTo(startBlock.timestamp + 120);

      await radiance.approve(farm.address, ethers.utils.parseEther("1"));

      await farm.deposit(4, ethers.utils.parseEther("1"));
      // expect(await nft.mint(deployer.address, 1, 3, [])).to.be.ok;
      // await expect(farm.depositNFT(deployer.address, nft.address, 1, 1)).to.be
      //   .reverted;
      // const deposited = await farm.deposited(4, deployer.address);
      // console.log("Deposited", deposited);
      // const depositBlock = await ethers.provider.getBlock("latest");
      // console.log("Deposit block", depositBlock.timestamp);
      // await time.increaseTo(depositBlock.timestamp + 1);
      // const pendingBLock = await ethers.provider.getBlock("latest");
      // console.log("Pending Block", pendingBLock.timestamp);
      // const pending = await farm.pendingShare(4, deployer.address);
      // console.log("Pending", pending);

      // expect(
      //   await nft.safeTransferFrom(
      //     deployer.address,
      //     otherAccount.address,
      //     1,
      //     1,
      //     []
      //   )
      // ).to.be.ok;
      // const betweenBlock = await ethers.provider.getBlock("latest");
      // console.log("Between 1", betweenBlock.timestamp);
      // expect(
      //   await nft.safeTransferFrom(
      //     deployer.address,
      //     otherAccount.address,
      //     1,
      //     1,
      //     []
      //   )
      // ).to.be.ok;
      // await time.increaseTo(betweenBlock.timestamp + 3);
      // const betweenBlock2 = await ethers.provider.getBlock("latest");
      // console.log("Between 2", betweenBlock2.timestamp);
      // expect(
      //   await nft.safeTransferFrom(
      //     deployer.address,
      //     otherAccount.address,
      //     1,
      //     1,
      //     []
      //   )
      // ).to.be.ok;
      await mine(1);
      const orig = await ethers.provider.getBlock("latest");
      console.log(orig.timestamp);
      const pending1 = await farm.pendingShare(4, deployer.address);
      console.log("stated pending", pending1);
      const balanceBefore = await stars.balanceOf(deployer.address);
      console.log("Balance before", balanceBefore);
      const withdraw = await farm.withdraw(4, 0);
      const balanceAfter = await stars.balanceOf(deployer.address);
      console.log("Balance After", balanceAfter);
      console.log("amount received", balanceAfter - balanceBefore);
      // await mine(1);
      // const pending2 = await farm.pendingShare(4, deployer.address);
      // console.log(pending2);
      // await mine(1);
      // const pending3 = await farm.pendingShare(4, deployer.address);
      // console.log(pending3);
      // await farm.withdraw(4, 0);
      // await mine(3600);
      // console.log("Between Time 4");
      // await farm.withdraw(4, 0);
      // await mine(3600);
      // console.log("Between Time 5");
      // await farm.withdraw(4, 0);
      // await mine(3600);

      // const postNftBlock = await ethers.provider.getBlock("latest");
      // console.log("Timestamp after transfer", postNftBlock.timestamp);
      // const pending2 = await farm.pendingShare(4, deployer.address);
      // console.log("Pending After NFT Transfer", pending2);
    });
  });

  //   describe("Test Swaps", function () {
  //     it("Should successfully swap old for new tokens", async function () {
  //       const {
  //         deployer,
  //         otherAccount,
  //         DAO,
  //         stars,
  //         radiance,
  //         treasury,
  //         radiancePair,
  //         starsPair,
  //         starsRadPair,
  //         nft,
  //         farm,
  //       } = await loadFixture(deployBaseProtocolFixture);

  //       const Cash = await ethers.getContractFactory("TestTokens");
  //       const cash = await Cash.deploy("Cash", "CASH");
  //       await cash.deployed();

  //       const Printer = await ethers.getContractFactory("TestTokens");
  //       const printer = await Printer.deploy("Printer", "PRINTER");
  //       await printer.deployed();

  //       const Bond = await ethers.getContractFactory("TestTokens");
  //       const cbond = await Bond.deploy("CBond", "CBOND");
  //       await cbond.deployed();

  //       await radiance.bigBang(
  //         treasury.address,
  //         stars.address,
  //         radiancePair,
  //         cash.address,
  //         cbond.address
  //       );

  //       //   await cash.mint(deployer.address, ethers.utils.parseEther("200"));

  //       await cash.approve(radiance.address, ethers.utils.parseEther("100"));
  //       expect(await cash.balanceOf(deployer.address)).to.equal(
  //         ethers.utils.parseEther("200")
  //       );

  //       await radiance.swapCash(ethers.utils.parseEther("100"));

  //       expect(await radiance.balanceOf(deployer.address)).to.be.greaterThan(
  //         ethers.utils.parseEther("100")
  //       );
  //     });
  //   });

  //   describe("Test Taxes", function () {
  //     it("Should properly take taxes", async function () {
  //       const {
  //         deployer,
  //         otherAccount,
  //         DAO,
  //         TeamLockup,
  //         radiance,
  //         router,
  //         busd,
  //         radiancePair,
  //         stars,
  //         starsPair,
  //         starsRadPair,
  //         glow,
  //         oracle,
  //         lpBoardroom,
  //         sasBoardroom,
  //         treasury,
  //         nft,
  //         farm,
  //       } = await loadFixture(deployBaseProtocolFixture);

  //       await radiance.bigBang(
  //         treasury.address,
  //         stars.address,
  //         radiancePair,
  //         radiance.address,
  //         radiance.address
  //       );

  //       // 10. Big Bang Glow
  //       await glow.bigBang(treasury.address);

  //       // 11. Big Bang Stars

  //       await stars.bigBang(
  //         glow.address,
  //         oracle.address,
  //         treasury.address,
  //         starsPair,
  //         router.address,
  //         true
  //       );

  //       // 12a. Big Bang Boardroom
  //       await lpBoardroom.bigBang(treasury.address);

  //       // 12b. Big Bang Boardroom
  //       await sasBoardroom.bigBang(treasury.address);

  //       await nft.bigBang(farm.address, DAO);

  //       await stars.approve(sasBoardroom.address, ethers.utils.parseEther("1"));

  //       const stake = await sasBoardroom.stake(ethers.utils.parseEther("1"));
  //       await stake.wait(1);

  //       const starsPairToken = await ethers.getContractAt(
  //         "PancakeERC20",
  //         starsPair
  //       );
  //       await starsPairToken.approve(
  //         lpBoardroom.address,
  //         ethers.utils.parseEther("1")
  //       );

  //       const stake2 = await lpBoardroom.stake(ethers.utils.parseEther("1"));
  //       await stake2.wait(1);

  //       await treasury.allocateSeigniorage();

  //       const firstUpdate = await oracle.update();
  //       await firstUpdate.wait(1);

  //       const initialPrice = await oracle.consult(
  //         radiance.address,
  //         ethers.utils.parseEther("1")
  //       );

  //       console.log("Initial Rad Price", initialPrice / 1e18);

  //       await radiance.approve(router.address, ethers.utils.parseEther("0.5"));

  //       const deadline = await ethers.provider.getBlock("latest");
  //       const path = [radiance.address, busd.address];

  //       const sellBelowTwap =
  //         await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
  //           ethers.utils.parseEther("0.5"),
  //           0,
  //           path,
  //           deployer.address,
  //           deadline.timestamp * 2
  //         );

  //       await sellBelowTwap.wait(1);

  //       const update = await oracle.update();
  //       await update.wait(1);

  //       const price = await oracle.consult(
  //         radiance.address,
  //         ethers.utils.parseEther("1")
  //       );
  //       console.log("Price after swap", price / 1e18);
  //     });
  //   });
});
