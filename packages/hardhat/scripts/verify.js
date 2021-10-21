const hre = require("hardhat");

async function verify(address, constructorArguments) {
  console.log("verifying....");
  await hre.run("verify:verify", {
    address,
    constructorArguments,
  });
}

module.exports = {
  verify: (address, constructorArguments) =>
    verify(address, constructorArguments)
      .then(() => {
        console.log(`Contract verified on ${process.env.HARDHAT_NETWORK} Etherscan`);
      })
      .catch(error => {
        console.error(error);
        process.exit(1);
      }),
};
