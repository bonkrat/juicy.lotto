import { utils } from "ethers";
import { useState } from "react";
import { createContainer } from "unstated-next";
import { SYMBOLS, UNITS } from "../constants";
import { useLatestUSDEthPrice } from "../hooks/JuicyLotto";
import numberWithCommas from "../utils/numberWithCommas";

function useCurrency(initialState = UNITS.USD) {
  const { price } = useLatestUSDEthPrice(),
    [currency, setCurrency] = useState(initialState),
    toggleCurrency = () => {
      setCurrency(currency === UNITS.USD ? UNITS.ETH : UNITS.USD);
    },
    convertCurrency = val => {
      return currency === UNITS.USD
        ? Math.floor(utils.formatEther(val) * price * 100) / 100
        : utils.formatEther(val);
    },
    formatCurrency = val => {
      const number = convertCurrency(val);
      return currency === UNITS.USD
        ? `${SYMBOLS.USD}${numberWithCommas(number)}`
        : `${number}${SYMBOLS.ETH}`;
    };

  return { currency, setCurrency, toggleCurrency, convertCurrency, formatCurrency };
}

export default createContainer(useCurrency);
