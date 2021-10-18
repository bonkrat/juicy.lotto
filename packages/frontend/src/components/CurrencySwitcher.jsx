import React from "react";
import Currency from "../containers/Currency";
import { SYMBOLS } from "../constants";

function CurrencySwitcher() {
  const { currency, toggleCurrency } = Currency.useContainer();

  return (
    <button
      className="relative top-4 left-4 btn btn-neutral font-bold text-lg"
      onClick={toggleCurrency}
    >
      {SYMBOLS[currency]}
    </button>
  );
}

export default CurrencySwitcher;
