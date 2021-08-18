import { useContractCall, useEthers, useContractFunction } from "@usedapp/core";
import { BigNumber, Contract, providers } from "ethers";
import { networkConfig } from "../constants";
import { JUICY_LOTTO_ABI, JUICY_LOTTO_ADDRESS } from "../constants";
import { Interface } from "ethers/lib/utils";

const logEvent = ({ name, topic, args }) => {
  console.log("%c Event: ", "background: #222; color: #bada55", name);
  console.log("%c Topic: ", "background: #222; color: #cada55", topic);
  console.log("%c args: ", "background: #222; color: #dada55", args);
};

export default function useJuicyLottoContract(readOnly = false) {
  const { library } = useEthers();

  const readNetworkUrl =
    networkConfig.readOnlyChainId &&
    networkConfig.readOnlyUrls &&
    networkConfig.readOnlyUrls[networkConfig.readOnlyChainId];

  if (readOnly) {
    return new Contract(
      JUICY_LOTTO_ADDRESS,
      JUICY_LOTTO_ABI,
      new providers.JsonRpcProvider(readNetworkUrl),
    );
  }

  return new Contract(
    JUICY_LOTTO_ADDRESS,
    JUICY_LOTTO_ABI,
    library?.getSigner() ?? new providers.JsonRpcProvider(readNetworkUrl),
  );
}

function useJuicyCall(method, ...args) {
  return (
    useContractCall({
      abi: new Interface(JUICY_LOTTO_ABI),
      address: JUICY_LOTTO_ADDRESS,
      method,
      args: [...args],
    }) || []
  );
}

export function useDrawNumbers() {
  const juicyLottoContract = useJuicyLottoContract();
  const { send: drawNumbers, events } = useContractFunction(juicyLottoContract, "drawNumbers");
  events?.forEach(logEvent);
  return { drawNumbers };
}

export function useEntries() {
  const { account } = useEthers();
  const [entries] = useJuicyCall("getEntries", account);
  const [entryFee] = useJuicyCall("entryFee"); // TODO Remove this in favor of settings.
  const [numOfEntries] = useJuicyCall("numOfEntries");
  const juicyLottoContract = useJuicyLottoContract();
  const { send: sendBuyEntries } = useContractFunction(juicyLottoContract, "buyEntries");
  const { send: withdrawEntries } = useContractFunction(juicyLottoContract, "withdrawEntries");

  const buyEntries = entries => {
    entryFee && entries?.length && sendBuyEntries(entries, { value: entries.length * entryFee });
  };

  return { entries, entryFee, numOfEntries: numOfEntries || 0, buyEntries, withdrawEntries };
}

export function useLottoSettings() {
  const [maxNum] = useJuicyCall("maxNum");
  const [state] = useJuicyCall("state");
  const [entryFee] = useJuicyCall("entryFee");
  return { maxNum, state, entryFee };
}

export function useJackpot() {
  const [jackpot] = useJuicyCall("jackpot");
  const [minJackpot] = useJuicyCall("minJackpot");
  return { jackpot: jackpot ?? BigNumber.from(0), minJackpot: minJackpot ?? BigNumber.from(0) };
}

export function useGetStake() {
  const { account } = useEthers();
  const [stake] = useJuicyCall("getStake", account);

  return stake ?? BigNumber.from(0);
}

export function useGetWinningNumbers() {
  const [winningNumbers] = useJuicyCall("getWinningNumbers");
  return winningNumbers || [];
}
