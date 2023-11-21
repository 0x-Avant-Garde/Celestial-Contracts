const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const raw = fs.readFileSync("protocol.json");
const contract = JSON.parse(raw);

async function main() {
  for (let i = 0; i < contract.length; i++) {
    if (contract[i].implementation !== null) {
      await run("verify:verify", {
        address: contract[i].implementation,
        constructorArguments: [],
      });
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
