import { utils } from "ethers";
import { useState, useEffect } from "react";
import { createContainer } from "unstated-next";
import { SYMBOLS, UNITS } from "../constants";
import { useJuicyLottoContract } from "../hooks";
import numberWithCommas from "../utils/numberWithCommas";

function useCurrency(initialState = UNITS.USD) {
  const juicyLottoContract = useJuicyLottoContract();
  const [usdEthPrice, setUSDEthPrice] = useState();
  const [currency, setCurrency] = useState(initialState),
    toggleCurrency = () => {
      setCurrency(currency === UNITS.USD ? UNITS.ETH : UNITS.USD);
    },
    convertCurrency = val => {
      return currency === UNITS.USD
        ? Math.floor(utils.formatEther(val) * usdEthPrice * 100) / 100
        : utils.formatEther(val);
    },
    formatCurrency = val => {
      const number = convertCurrency(val);
      return currency === UNITS.USD
        ? `${SYMBOLS.USD}${numberWithCommas(number)}`
        : `${number}${SYMBOLS.ETH}`;
    };

  useEffect(() => {
    juicyLottoContract
      .getLatestUSDEthPrice()
      .then(res => setUSDEthPrice(res / 100))
      .catch(e => console.log(e));
  }, []);

  return { currency, setCurrency, toggleCurrency, convertCurrency, formatCurrency };
}

export default createContainer(useCurrency);
