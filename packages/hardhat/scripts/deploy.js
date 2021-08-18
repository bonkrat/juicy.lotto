/* eslint no-use-before-define: "warn" */
const dotenv = require("dotenv");
const chalk = require("chalk");
const fs = require("fs");
const { publish, publishContractAddress, BASE_PUBLISH_DIR } = require("./publish");
const R = require("ramda");
const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const { MultiCall } = require("@usedapp/core");

dotenv.config();

const NETWORK_LOCALHOST = "localhost";
const NETWORK_KOVAN = "kovan";
const NETWORK_RINKEBY = "rinkeby";
const NETWORK_MAINNET = "mainnet";

// const wikiTokenBaseURI = process.env.WIKI_TOKEN_BASE_URI || "http://localhost:5000/api/token/";
const network = process.env.HARDHAT_NETWORK || "localhost";
const artifactsDir = `artifacts`;

const getJuiceProjectId = () => {
  if (network === NETWORK_LOCALHOST) {
    return "0x01"; // Juice is disabled in local dev anyway.
  }
  // if (network === NETWORK_KOVAN) {
  //   return "0x01";
  // }
  // if (network === NETWORK_RINKEBY) {
  //   return "0x0c";
  // }
  // if (network === NETWORK_MAINNET) {
  //   return "0x0a";
  // }
  throw error(`Network ${network} does not have a Juice project configured`);
};

const getJuiceTerminalDirectory = () => {
  if (network === NETWORK_LOCALHOST) {
    return "0x0000000000000000000000000000000000000000"; // Juice is disabled in local dev anyway.
  }
  if (network === NETWORK_KOVAN) {
    return "0x71BA69044CbD951AC87124cBEdbC0334AB21F26D";
  }
  if (network === NETWORK_RINKEBY) {
    return "0x5d03dA1Ec58cf319c4fDbf2E3fE3DDcd887ef9aD";
  }
  if (network === NETWORK_MAINNET) {
    return "0x46C9999A2EDCD5aA177ed7E8af90c68b7d75Ba46";
  }
  throw error(`Network ${network} does not have a Juice terminal directory configured`);
};

const getLinkTokenAddress = async () => {
  if (network === NETWORK_LOCALHOST) {
    console.log(`🛰  Deploying LinkToken mock\n`, `\n`);
    const LinkToken = await ethers.getContractFactory("LinkToken");
    const linkToken = await LinkToken.deploy();

    return linkToken.address; // Locally deployed mock VRF Coordinator
  }
  if (network === NETWORK_KOVAN) {
    return "0xa36085F69e2889c224210F603D836748e7dC0088";
  }
  if (network === NETWORK_RINKEBY) {
    return "0x01BE23585060835E02B77ef475b0Cc51aA1e0709";
  }
  if (network === NETWORK_MAINNET) {
    return "0x514910771AF9Ca656af840dff83E8264EcF986CA";
  }
  throw error(`Failed to get LinkToken address for ${network}`);
};

const getLinkKeyHash = () => {
  if (network === NETWORK_LOCALHOST) {
    return "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
  }
  if (network === NETWORK_KOVAN) {
    return "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";
  }
  if (network === NETWORK_RINKEBY) {
    return "0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311";
  }
  if (network === NETWORK_MAINNET) {
    return "0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445";
  }
  throw error(`Failed to get LINK Key Hash address for ${network}`);
};

const getLinkFee = () => {
  if (network === NETWORK_LOCALHOST) {
    return BigNumber.from(1).mul(BigNumber.from(10).pow(17)); // 0.1 LINK
  }
  if (network === NETWORK_KOVAN) {
    return BigNumber.from(1).mul(BigNumber.from(10).pow(17)); // 0.1 LINK
  }
  if (network === NETWORK_RINKEBY) {
    return BigNumber.from(1).mul(BigNumber.from(10).pow(17)); // 0.1 LINK
  }
  if (network === NETWORK_MAINNET) {
    return BigNumber.from(2).mul(BigNumber.from(10).pow(18)); // 2 LINK
  }
  throw error(`Failed to get LINK fee for ${network}`);
};

const getVRFCoordinatorAddress = async linkTokenAddress => {
  if (network === NETWORK_LOCALHOST) {
    console.log(`🛰  Deploying VRFCoordinator mock\n`, `\n`);
    const VRFCoordinator = await ethers.getContractFactory("VRFCoordinatorMock"),
      vrfCoordinator = await VRFCoordinator.deploy(linkTokenAddress);

    console.log(
      `🛰  Deploying V3Aggregator with the following parameters:\n`,
      chalk.green(` - decimals`),
      `=`,
      chalk.cyan(2),
      `\n`,
      chalk.green(` - initialAnswer`),
      `=`,
      chalk.cyan(300050),
      `\n`,
    );

    return vrfCoordinator.address; // Locally deployed mock VRF Coordinator
  }
  if (network === NETWORK_KOVAN) {
    return "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952";
  }
  if (network === NETWORK_RINKEBY) {
    return "0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B";
  }
  if (network === NETWORK_MAINNET) {
    return "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952";
  }
  throw error(`Failed to get VRFCoordinator address for ${network}`);
};

const getV3AggregatorAddress = async () => {
  if (network === NETWORK_LOCALHOST) {
    const V3Aggregator = await ethers.getContractFactory("MockV3Aggregator"),
      v3aggregator = await V3Aggregator.deploy(2, 300000);
    return v3aggregator.address;
  }
  if (network === NETWORK_KOVAN) {
    return "0x9326BFA02ADD2366b30bacB125260Af641031331";
  }
  if (network === NETWORK_RINKEBY) {
    return "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e";
  }
  if (network === NETWORK_MAINNET) {
    return "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
  }
  throw error(`Failed to get LINK fee for ${network}`);
};

// ABI encodes contract arguments.
// This is useful when you want to manually verify the contracts, for example, on Etherscan.
const abiEncodeArgs = (deployed, contractArgs) => {
  // Don't write ABI encoded args if this does not pass.
  if (!contractArgs || !deployed || !R.hasPath(["interface", "deploy"], deployed)) {
    return "";
  }
  const encoded = utils.defaultAbiCoder.encode(deployed.interface.deploy.inputs, contractArgs);
  return encoded;
};

const deploy = async (contractName, _args = [], overrides = {}, libraries = {}) => {
  const contractArgs = _args || [];
  const contractArtifacts = await ethers.getContractFactory(contractName, {
    libraries: libraries,
  });
  const deployed = await contractArtifacts.deploy(...contractArgs, overrides);
  const encoded = abiEncodeArgs(deployed, contractArgs);
  fs.writeFileSync(`${artifactsDir}/${contractName}.address`, deployed.address);

  console.log("📄", chalk.cyan(contractName), "deployed to:", chalk.magenta(deployed.address));

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`${artifactsDir}/${contractName}.args`, encoded.slice(2));

  return deployed;
};

const main = async () => {
  if (!process.env.INFURA_ID) {
    throw "❌ INFURA_ID is not set";
  }

  if (network === NETWORK_LOCALHOST) {
    console.log(`🛰  Deploying MultiCall contract for useDapp useContractCall hooks \n`);
    const multiCall = new ethers.ContractFactory(MultiCall.abi, MultiCall.bytecode);
    const [owner] = await ethers.getSigners();
    const deployed = await multiCall.connect(owner).deploy();
    publishContractAddress(`${BASE_PUBLISH_DIR}/${network}`, "MultiCall", deployed.address);
  }

  const maxNum = 25;
  const entryFee = 0.0005 * 10 ** 18;
  const minJackpot = "1000000000000000000";
  const juiceboxFee = 5;
  const linkAddress = await getLinkTokenAddress();
  const vrfCoordinatorAddress = await getVRFCoordinatorAddress(linkAddress);
  const keyHash = getLinkKeyHash();
  const fee = getLinkFee();
  const isJuiceEnabled = network !== NETWORK_LOCALHOST;
  const juiceProjectId = getJuiceProjectId();
  const juiceTerminalDirectory = getJuiceTerminalDirectory();
  const v3AggregatorAddress = await getV3AggregatorAddress();

  console.log(
    `🛰  Deploying JuicyLotto with the following parameters:\n`,
    chalk.green(` - maxNum`),
    `=`,
    chalk.cyan(maxNum),
    `\n`,
    chalk.green(` - entryFee`),
    `=`,
    chalk.cyan(entryFee),
    `\n`,
    chalk.green(` - minJackpot`),
    `=`,
    chalk.cyan(minJackpot),
    `\n`,
    chalk.green(` - juiceboxFee`),
    `=`,
    chalk.magenta(juiceboxFee),
    `\n`,
    chalk.green(` - vrfCoordinatorAddress`),
    `=`,
    chalk.magenta(vrfCoordinatorAddress),
    `\n`,
    chalk.green(` - linkTokenAddress`),
    `=`,
    chalk.magenta(linkAddress),
    `\n`,
    chalk.green(` - keyHash`),
    `=`,
    chalk.magenta(keyHash),
    `\n`,
    chalk.green(` - fee`),
    `=`,
    chalk.magenta(fee),
    `\n`,
    chalk.green(` - juiceboxEnabled`),
    `=`,
    chalk.magenta(isJuiceEnabled),
    `\n`,
    chalk.green(` - juiceProjectId`),
    `=`,
    chalk.magenta(juiceProjectId),
    `\n`,
    chalk.green(` - juiceTerminalDirectory`),
    `=`,
    chalk.magenta(juiceTerminalDirectory),
  );

  console.log("\n");

  const juicyLotto = await deploy(
    "JuicyLotto",
    [
      maxNum,
      entryFee,
      minJackpot,
      juiceboxFee,
      vrfCoordinatorAddress,
      linkAddress,
      keyHash,
      fee,
      isJuiceEnabled,
      juiceProjectId,
      juiceTerminalDirectory,
      v3AggregatorAddress,
    ],
    {
      gasLimit: 9000000,
    },
  );

  console.log("\n");

  const fundAmount = BigNumber.from(minJackpot);
  console.log(`Funding JuicyLotto contract with ${fundAmount.toString()} wei...\n`);

  // const fundAmount = BigNumber.from(minJackpot).sub(BigNumber.from(entryFee).mul(500));

  [owner, ...addrs] = await ethers.getSigners();
  await juicyLotto.connect(owner).fund({ value: fundAmount });

  if (network === NETWORK_LOCALHOST) {
    const LinkToken = await ethers.getContractFactory("LinkToken");
    const linkToken = new ethers.Contract(linkAddress, LinkToken.interface, owner);
    const transferTransaction = await linkToken.transfer(
      juicyLotto.address,
      "500000000000000000000",
    );

    console.log(
      "Contract " +
        juicyLotto.address +
        " funded with " +
        500000000000000000000 / Math.pow(10, 18) +
        " LINK. Transaction Hash: " +
        transferTransaction.hash,
    );
  }

  console.log(
    "⚡️ All contract artifacts saved to:",
    chalk.yellow(`packages/hardhat/${artifactsDir}/`),
    "\n",
  );

  console.log(chalk.green("✔ Deployed for network:"), network, "\n");

  await publish(network);
};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
