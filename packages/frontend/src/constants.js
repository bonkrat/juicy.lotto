import { ChainId } from "@usedapp/core";
import localhostABIs from "./contracts/localhost/JuicyLotto.abi";
import localhostAddresses from "./contracts/localhost/JuicyLotto.address";
import localMulticallAddress from "./contracts/localhost/MultiCall.address";

const JUICY_LOTTO_ABIS = {
  localhost: localhostABIs,
  // kovan: require("./contracts/kovan/JuicyLotto.abi"),
  // rinkeby: require("./contracts/rinkeby/JuicyLotto.abi"),
  // mainnet: require("./contracts/mainnet/JuicyLotto.abi"),
};

const JUICY_LOTTO_ADDRESSES = {
  localhost: localhostAddresses,
  // kovan: require("./contracts/kovan/JuicyLotto.address"),
  // rinkeby: require("./contracts/rinkeby/JuicyLotto.address"),
  // mainnet: "0xD224B0eAf5B5799ca46D9FdB89a2C10941E66109",
};

export const MAINNET = "mainnet";
export const RINKEBY = "rinkeby";
export const KOVAN = "kovan";
export const LOCALHOST = "localhost";

export const NETWORK = process.env.REACT_APP_INFURA_NETWORK || "localhost";

const localhostChainId = 31337;
const rinkebyChainId = ChainId.Rinkeby;
const kovanChainId = ChainId.Kovan;
const mainnetChainId = ChainId.Mainnet;

export const NETWORK_TO_CHAIN_ID = {
  localhost: localhostChainId,
  rinkeby: rinkebyChainId,
  kovan: kovanChainId,
  mainnet: mainnetChainId,
};

export const JUICY_LOTTO_ABI = JUICY_LOTTO_ABIS[NETWORK];
export const JUICY_LOTTO_ADDRESS = JUICY_LOTTO_ADDRESSES[NETWORK];

console.log("NETWORK_TO_CHAIN_ID[ENTWORK]", NETWORK_TO_CHAIN_ID[NETWORK]);

export const networkConfig = {
  readOnlyChainId: NETWORK_TO_CHAIN_ID[NETWORK],
  readOnlyUrls: {
    31337: `http://localhost:8545`,
    [ChainId.Localhost]: `http://localhost:8545`,
    // [ChainId.Kovan]: `https://kovan.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
    // [ChainId.Rinkeby]: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
    // [ChainId.Mainnet]: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
  },
  multicallAddresses: {
    31337: localMulticallAddress,
    [ChainId.Localhost]: localMulticallAddress,
    // [ChainId.Kovan]: `https://kovan.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
    // [ChainId.Rinkeby]: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
    // [ChainId.Mainnet]: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
  },
  // supportedChains: [31337, ChainId.Localhost, ChainId.Kovan, ChainId.Rinkeby, ChainId.Mainnet],
  supportedChains: [31337, ChainId.Localhost],
};

export const UNITS = {
  USD: "USD",
  ETH: "ETH",
};

export const SYMBOLS = {
  [UNITS.USD]: "$",
  [UNITS.ETH]: "Ξ",
};
