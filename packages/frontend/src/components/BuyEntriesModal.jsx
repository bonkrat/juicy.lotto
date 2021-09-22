import React, { useEffect, useState } from "react";
import CurrencyContainer from "../containers/Currency";
import { useEntries, useLottoSettings } from "../hooks/JuicyLotto";
import Row from "./Row";
import { BigNumber } from "ethers";

function times(num, cb) {
  let result = [];

  for (var i = 0; i < num; i++) {
    result.push(cb(i));
  }

  return result;
}

function randomID() {
  return Math.floor(Math.random() * 100000000000000);
}

function randomNum(maxNum) {
  return () => Math.floor(Math.random() * maxNum);
}

function NumberSelect({ onChange, val }) {
  const { maxNum } = useLottoSettings();

  return (
    <select class="select select-bordered w-4 sm:w-24" onChange={onChange}>
      <option disabled="disabled" selected={val === undefined}>
        Number
      </option>
      {times(maxNum, num => (
        <option selected={val == num}>{num}</option>
      ))}
    </select>
  );
}

function BuyEntriesModal() {
  const { maxNum, entryFee } = useLottoSettings();
  const { buyEntries } = useEntries();
  const { formatCurrency } = CurrencyContainer.useContainer();
  const pickNum = () => [0, 1, 2].map(randomNum(maxNum));
  const randomEntries = () =>
    times(8, () => ({
      numbers: pickNum(),
      id: randomID(),
    }));
  const [entries, setEntries] = useState([]);
  const [number, setNumber] = useState(pickNum);
  const { state } = useLottoSettings();
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    setNumber(pickNum());
    setEntries(randomEntries());
  }, [maxNum]);

  return (
    <>
      <button
        className="btn btn-primary w-full sm:w-auto"
        onClick={() => setShowBuyModal(true)}
        disabled={state === 1}
      >
        Buy Entries
      </button>
      <div id="buy-entries-modal" className={`modal ${showBuyModal ? "modal-open" : ""}`}>
        <div class="modal-box">
          <div className="flex flex-wrap flex-row content-start justify-start h-64 mb-4 overflow-y-scroll">
            {entries?.map(entry => {
              return (
                <div className="flex justify-between items-center w-1/2 p-2">
                  {entry.numbers.map(num => (
                    <div className="flex items-center justify-center font-bold border-primary border-2 rounded-full w-6 h-6 text-sm sm:text-lg sm:w-12 sm:h-12">
                      {num}
                    </div>
                  ))}
                  <button
                    className="btn btn-neutral"
                    onClick={() => {
                      setEntries(entries.filter(e => e.id !== entry.id));
                    }}
                  >
                    X
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-neutral p-4 rounded mb-4">
            <Row label="Number of Entries" value={entries?.length} className="p-2" size="sm" />
            <Row
              label="Entry Fee"
              value={entryFee && formatCurrency(entryFee)}
              className="p-2"
              size="sm"
            />
            <Row
              label="Total"
              value={entryFee && formatCurrency(entryFee.mul(entries?.length))}
              className="p-2"
            />
          </div>

          <div className="flex justify-between bg-base-300 p-4 rounded">
            {[0, 1, 2].map((num, i) => (
              <NumberSelect
                onChange={({ target: { value } }) => {
                  const numberCopy = [...number];
                  numberCopy[num] = value;
                  setNumber(numberCopy);
                }}
                val={number[i]}
              />
            ))}
            <button
              className="btn btn-secondary text-center text-3xl h-8 w-12"
              onClick={() => {
                setEntries([{ numbers: number, id: randomID() }, ...entries]);
                setNumber(pickNum);
              }}
            >
              +
            </button>
          </div>

          <div class="modal-action">
            <button
              class="btn"
              onClick={() => {
                setEntries(randomEntries());
                setShowBuyModal(false);
              }}
            >
              Cancel
            </button>
            <button
              class="btn btn-primary"
              onClick={() => {
                buyEntries(entries.map(entry => [...entry.numbers]));
                setShowBuyModal(false);
              }}
              disabled={!entries.length}
            >
              Buy {entries?.length} Entries
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default BuyEntriesModal;
