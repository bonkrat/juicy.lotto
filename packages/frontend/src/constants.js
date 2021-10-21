import { ChainId } from "@usedapp/core";
import localhostABI from "./contracts/localhost/JuicyLotto.abi";
import localhostAddresses from "./contracts/localhost/JuicyLotto.address";
import localMulticallAddress from "./contracts/localhost/MultiCall.address";
import rinkebyABI from "./contracts/rinkeby/JuicyLotto.abi";
import rinkebyAddresses from "./contracts/rinkeby/JuicyLotto.address";

const JUICY_LOTTO_ABIS = {
  localhost: localhostABI,
  rinkeby: rinkebyABI,
  // mainnet: require("./contracts/mainnet/JuicyLotto.abi"),
};

const JUICY_LOTTO_ADDRESSES = {
  localhost: localhostAddresses,
  rinkeby: rinkebyAddresses,
  // mainnet: "0xD224B0eAf5B5799ca46D9FdB89a2C10941E66109",
};

export const MAINNET = "mainnet";
export const RINKEBY = "rinkeby";
export const LOCALHOST = "localhost";

export const NETWORK = import.meta.env.VITE_INFURA_NETWORK || "localhost";

const localhostChainId = 1337;
const rinkebyChainId = ChainId.Rinkeby;
const mainnetChainId = ChainId.Mainnet;

export const NETWORK_TO_CHAIN_ID = {
  localhost: localhostChainId,
  rinkeby: rinkebyChainId,
  mainnet: mainnetChainId,
};

export const CHAIN_ID_TO_NETWORK = {
  [localhostChainId]: LOCALHOST,
  [rinkebyChainId]: RINKEBY,
  [mainnetChainId]: MAINNET,
};

export const LotteryState = {
  OPEN: 0,
  FETCHING: 1,
  PICKING: 2,
  CLOSED: 3,
};

export const JUICY_LOTTO_ABI = JUICY_LOTTO_ABIS[NETWORK];
export const JUICY_LOTTO_ADDRESS = JUICY_LOTTO_ADDRESSES[NETWORK];

export const networkConfig = {
  readOnlyChainId: NETWORK_TO_CHAIN_ID[NETWORK],
  readOnlyUrls: {
    31337: `http://localhost:8545`,
    [ChainId.Localhost]: `http://localhost:8545`,
    [ChainId.Rinkeby]: `https://rinkeby.infura.io/v3/${import.meta.env.VITE_INFURA_PROJECT_ID}`,
    // [ChainId.Mainnet]: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`,
  },
  multicallAddresses: {
    31337: localMulticallAddress,
    [ChainId.Localhost]: localMulticallAddress,
    [ChainId.Rinkeby]: "0x42Ad527de7d4e9d9d011aC45B31D8551f8Fe9821",
    // [ChaindId.Mainnet]: "0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441",
  },
  supportedChains: [31337, ChainId.Localhost, ChainId.Rinkeby, ChainId.Mainnet],
};

export const UNITS = {
  USD: "USD",
  ETH: "ETH",
};

export const SYMBOLS = {
  [UNITS.USD]: "$",
  [UNITS.ETH]: "Ξ",
};
