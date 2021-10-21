import { useContractFunction, useEthers } from "@usedapp/core";
import { BigNumber } from "ethers";
import React, { useState } from "react";
import { FundingProgress, Jackpot, Logo, LotteryStateBadge } from "./components";
import BuyEntriesModal from "./components/BuyEntriesModal";
import ConnectWalletButton from "./components/ConnectWalletButton";
import CurrencySwitcher from "./components/CurrencySwitcher";
import EntriesModal from "./components/EntriesModal";
import InfoModal from "./components/InfoModal";
import Network from "./components/Network";
import { LoadingWrapper, Row } from "./components/shared";
import { NETWORK, NETWORK_TO_CHAIN_ID, LotteryState } from "./constants";
import CurrencyContainer from "./containers/Currency";
import { useJuicyLottoContract } from "./hooks";
import {
  useDrawNumbers,
  useEntries,
  useGetStake,
  useGetWinningNumbers,
  useJackpot,
  useLottoSettings,
  usePickWinners,
  useWithdrawStake,
} from "./hooks/JuicyLotto";
import calculateOdds from "./utils/calculateOdds";
import formatAddress from "./utils/formatAddress";
import numberWithCommas from "./utils/numberWithCommas";

function App() {
  const winningNumbers = useGetWinningNumbers();
  const { formatCurrency } = CurrencyContainer.useContainer();
  const { entries, entryFee, numOfEntries } = useEntries();
  const { jackpot, minJackpot } = useJackpot();
  const stake = useGetStake();
  const { account, chainId } = useEthers();
  const { maxNum, state } = useLottoSettings();
  const odds = maxNum && calculateOdds(maxNum.toNumber(), 3);
  const { drawNumbers } = useDrawNumbers();
  const { pickWinners } = usePickWinners();
  const { withdrawStake } = useWithdrawStake();
  const [showEntriesModal, setShowEntriesModal] = useState(false);

  const poolLeft = jackpot ? minJackpot.sub(jackpot) : BigNumber.from(0);
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

  const getStake = () => {
    const val = stake || 0;
    return formatCurrency(val);
  };

  const showLottoData =
      numOfEntries && numOfEntries.toString() && Number.parseInt(entriesLeft) && odds,
    showAccountData = entries && !Number.isNaN(stake);

  return (
    <div className="container mx-auto pt-4 px-8 sm:px-8 md:px-8 lg:px-36 xl:px-72 2xl:px-96 mb-8">
      <div className="w-full flex justify-between items-center">
        <CurrencySwitcher />
        <Network />
        <InfoModal />
      </div>
      <div className="flex flex-col justify-center space-y-4">
        <Logo />
        <div>
          <LotteryStateBadge />

          <div className="bg-base-200 bg-opacity-50 p-4 rounded flex flex-col justify-center items-center space-y-4 -mt-2">
            <Jackpot />
            <FundingProgress />
          </div>
        </div>
        <div className="bg-base-200 bg-opacity-80 p-2 sm:p-4 rounded">
          <Row
            label="Total Entries"
            value={numOfEntries && numOfEntries.toString()}
            showRow={showLottoData}
          />
          <Row
            label="Entries Needed"
            value={entriesLeft > 0 ? entriesLeft.toString() : "0"}
            showRow={showLottoData}
          />
          <Row
            label="Entry Fee"
            value={entryFee && formatCurrency(entryFee)}
            showRow={showLottoData}
          />
          <Row
            label="Last Winning Numbers"
            showRow={showLottoData}
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
            showRow={showLottoData}
          />
          <Row
            label="Odds of Winning"
            value={odds && `1 in ${numberWithCommas(odds)}`}
            showRow={showLottoData}
          />
        </div>
        {account && (
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

              <div className="bg-base-200 p-2 sm:p-4 rounded -mt-4 z-100">
                <LoadingWrapper showComponent={account}>
                  <Row
                    label="Entries"
                    value={entries?.length || 0}
                    onClick={() => {
                      setShowEntriesModal(true);
                    }}
                    showRow={showAccountData}
                  />
                  <EntriesModal
                    open={showEntriesModal}
                    onClose={() => {
                      setShowEntriesModal(false);
                    }}
                  />
                  <Row label="Winnings" value={getStake()} showRow={showAccountData} />
                </LoadingWrapper>
              </div>
            </div>

            <div className="flex flex-col space-y-8 md:space-y-0 md:flex-row md:justify-between items-center">
              <LoadingWrapper showComponent={showAccountData}>
                <div className="bg-base-200 p-4 w-full md:w-auto rounded flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between w-auto">
                  <button
                    className="btn btn-outline btn-neutral w-full sm:w-auto"
                    disabled={
                      entries?.length === 0 || state === LotteryState.PICKING || !matchedNetwork
                    }
                    onClick={withdrawEntries}
                  >
                    Withdraw Entries
                  </button>
                  <BuyEntriesModal />
                </div>

                <div className="px-4 w-full md:w-auto flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between w-auto">
                  {state === LotteryState.PICKING || state === LotteryState.Fetching ? (
                    <button
                      className="btn btn-accent w-full md:w-auto"
                      onClick={() => {
                        pickWinners();
                      }}
                      disabled={state === LotteryState.FETCHING}
                    >
                      Pick Winners
                    </button>
                  ) : (
                    <button
                      className={`btn btn-accent w-full md:w-auto ${
                        state === LotteryState.FETCHING ? "loading" : ""
                      }`}
                      disabled={
                        percentLeft < 100 || state === LotteryState.FETCHING || !matchedNetwork
                      }
                      onClick={() => {
                        drawNumbers();
                      }}
                    >
                      {state === LotteryState.FETCHING ? "Drawing Numbers.." : "Draw Numbers"}
                    </button>
                  )}

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
              </LoadingWrapper>
            </div>

            <div className="flex justify-between mb-24 sm:m-0"></div>
          </>
        )}
        {account === null && <ConnectWalletButton />}
      </div>
    </div>
  );
}

export default App;
