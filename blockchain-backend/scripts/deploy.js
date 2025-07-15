const hre = require("hardhat");

async function main() {
  const P2PLending = await hre.ethers.getContractFactory("P2PLending");
  const p2p = await P2PLending.deploy(); // deploy and wait internally

  // no need to call p2p.deployed() anymore in ethers v6

  console.log(`✅ Contract deployed to: ${p2p.target}`); // .target holds the address in ethers v6
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
