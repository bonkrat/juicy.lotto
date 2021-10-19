import { useEthers, useContractFunction } from "@usedapp/core";
import React, { useState } from "react";
import ConnectWalletButton from "./components/ConnectWalletButton";
import Row from "./components/Row";
import CurrencyContainer from "./containers/Currency";
import {
  useDrawNumbers,
  useEntries,
  useGetStake,
  useGetWinningNumbers,
  useJackpot,
  useLottoSettings,
  useWithdrawStake,
} from "./hooks/JuicyLotto";
import { useJuicyLottoContract } from "./hooks";
import CurrencySwitcher from "./components/CurrencySwitcher";
import calculateOdds from "./utils/calculateOdds";
import { BigNumber } from "ethers";
import CountUp from "react-countup";
import { NETWORK, NETWORK_TO_CHAIN_ID, SYMBOLS, UNITS } from "./constants";
import numberWithCommas from "./utils/numberWithCommas";
import BuyEntriesModal from "./components/BuyEntriesModal";
import EntriesModal from "./components/EntriesModal";
import logo from "./assets/orange.png";
import InfoModal from "./components/InfoModal";
import formatAddress from "./utils/formatAddress";
import Network from "./components/Network";

function App() {
  const winningNumbers = useGetWinningNumbers();
  const { currency, formatCurrency, convertCurrency } = CurrencyContainer.useContainer();
  const { entries, entryFee, numOfEntries } = useEntries();
  const { jackpot, minJackpot } = useJackpot();
  const stake = useGetStake();
  const { account, chainId } = useEthers();
  const { maxNum, state } = useLottoSettings();
  const odds = maxNum && calculateOdds(maxNum.toNumber(), 3);
  const { drawNumbers } = useDrawNumbers();
  const { withdrawStake } = useWithdrawStake();
  const [showEntriesModal, setShowEntriesModal] = useState(false);

  const poolLeft = minJackpot.sub(jackpot);
  const entriesLeft = poolLeft.div(entryFee || BigNumber.from(1));
  const percentLeft =
    minJackpot > 0 && jackpot > 0
      ? Math.floor((100 / minJackpot.mul(100).div(jackpot).toNumber()) * 100)
      : 0;
  const matchedNetwork = account && NETWORK_TO_CHAIN_ID[NETWORK] === chainId;

  // TODO refactor this
  const juicyLottoContract = useJuicyLottoContract();
  const { send: sendWithdrawEntries } = useContractFunction(juicyLottoContract, "withdrawEntries");

  const withdrawEntries = async () => {
    account && sendWithdrawEntries(account);
  };

  const LotteryState = {
    OPEN: 0,
    DRAWING: 1,
    CLOSED: 2,
  };

  const getStake = () => {
    const val = stake || 0;
    return formatCurrency(val);
  };

  return (
    <div className="container mx-auto pt-4 px-8 sm:px-8 md:px-8 lg:px-36 xl:px-72 2xl:px-96 mb-8">
      <div className="w-full flex justify-between items-center">
        <CurrencySwitcher />
        <Network />
        <InfoModal />
      </div>
      <div className="flex flex-col justify-center space-y-4">
        <div className="mx-8 sm:mx-36 md:mx-48 flex justify-center items-center">
          <div className="text-6xl sm:text-7xl md:text-8xl italic absolute px-2 mt-8 md:mt-16 bg-gradient-to-r from-primary to-primary-focus">
            juicy lotto
          </div>
          <img className="-ml-4 sm:-ml-8" src={logo} />
        </div>

        <div>
          <div className="text-center">
            <div
              className={`badge ${
                state === LotteryState.OPEN
                  ? "badge-primary"
                  : state === LotteryState.DRAWING
                  ? "badge-accent"
                  : "badge-error"
              } uppercase leading-none font-black`}
            >
              {state === LotteryState.OPEN && "Open"}
              {state === LotteryState.DRAWING && "Drawing Numbers"}
              {state === LotteryState.CLOSED && "Closed"}
            </div>
          </div>

          <div className="bg-base-200 bg-opacity-50 p-4 rounded flex flex-col justify-center space-y-4 -mt-2">
            <div className="text-center text-5xl font-black">
              <div>
                {currency === UNITS.USD && SYMBOLS.USD}
                <CountUp
                  end={convertCurrency(jackpot)}
                  duration={2}
                  decimals={currency === UNITS.USD ? 2 : 5}
                  useEasing
                  formattingFn={currency === UNITS.USD && numberWithCommas}
                />
                {currency === UNITS.ETH && SYMBOLS.ETH}
              </div>
            </div>
            <div className="flex content-center items-center space-x-4">
              <progress
                className="progress progress-secondary flex-shrink"
                value={percentLeft}
                max="100"
              ></progress>
              <span className="flex-grow w-4/5 sm:w-1/4 badge p-4">{percentLeft}% funded</span>
            </div>
          </div>
        </div>
        <div className="bg-base-200 bg-opacity-80 p-2 sm:p-8 rounded">
          <Row label="Total Entries" value={numOfEntries && numOfEntries.toString()} />
          <Row label="Entries Needed" value={entriesLeft > 0 ? entriesLeft.toString() : "0"} />
          <Row label="Entry Fee" value={entryFee && formatCurrency(entryFee)} />
          <Row
            label="Last Winning Numbers"
            value={
              winningNumbers.length
                ? winningNumbers.map((num, i) => (
                    <span>
                      {num.toString()}
                      {(i === 0 || i === 1) && "-"}
                    </span>
                  ))
                : "N/A"
            }
          />
          <Row label="Odds of Winning" value={odds && `1 in ${numberWithCommas(odds)}`} />
        </div>

        {account ? (
          <>
            <div>
              <div className="text-center">
                <div className="badge bg-base-100 p-4 text-content max-w-full sm:hidden">
                  {formatAddress(account)}
                </div>
                <div className="badge bg-base-100 p-4 text-content max-w-full hidden sm:inline-flex">
                  {account}
                </div>
              </div>

              <div className="bg-base-200 p-2 sm:p-8 rounded -mt-4 z-100">
                <Row
                  label="Entries"
                  value={entries?.length || 0}
                  onClick={() => {
                    setShowEntriesModal(true);
                  }}
                />
                <EntriesModal
                  open={showEntriesModal}
                  onClose={() => {
                    setShowEntriesModal(false);
                  }}
                />
                <Row label="Winnings" value={getStake()} />
              </div>
            </div>

            <div className="flex flex-col space-y-8 md:space-y-0 md:flex-row md:justify-between items-center">
              <div className="bg-base-200 p-4 w-full md:w-auto rounded flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between w-auto">
                <button
                  className="btn btn-outline btn-neutral w-full sm:w-auto"
                  disabled={
                    entries?.length === 0 || state === LotteryState.DRAWING || !matchedNetwork
                  }
                  onClick={withdrawEntries}
                >
                  Withdraw Entries
                </button>
                <BuyEntriesModal />
              </div>

              <div className="px-4 w-full md:w-auto flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between w-auto">
                <button
                  className="btn btn-accent w-full md:w-auto"
                  disabled={percentLeft < 100 || state === 1 || !matchedNetwork}
                  onClick={() => {
                    drawNumbers();
                  }}
                >
                  Draw Numbers
                </button>

                <button
                  className="btn btn-secondary w-full md:w-auto"
                  disabled={stake.toString() === "0" || !matchedNetwork}
                  onClick={() => {
                    withdrawStake();
                  }}
                >
                  Collect Winnings
                </button>
              </div>
            </div>

            <div className="flex justify-between mb-24 sm:m-0"></div>
          </>
        ) : (
          <ConnectWalletButton />
        )}
      </div>
    </div>
  );
}

export default App;
