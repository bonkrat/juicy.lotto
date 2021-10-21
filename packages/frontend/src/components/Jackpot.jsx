import React from "react";
import CountUp from "react-countup";
import { SYMBOLS, UNITS } from "../constants";
import { CurrencyContainer } from "../containers";
import { useJackpot } from "../hooks/JuicyLotto";
import { numberWithCommas } from "../utils";
import LoadWithFadeIn from "./shared/LoadingWrapper";

function JackpotValue() {
  const { jackpot } = useJackpot(),
    { currency, convertCurrency } = CurrencyContainer.useContainer();

  return (
    <div className={`text-center text-5xl font-black`}>
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
  );
}

function Jackpot() {
  const { jackpot } = useJackpot();

  return (
    <LoadWithFadeIn showComponent={jackpot} width={32} height={12}>
      <JackpotValue />
    </LoadWithFadeIn>
  );
}

export default Jackpot;
