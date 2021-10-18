import React from "react";
import { useEntries } from "../hooks/JuicyLotto";
import { BigNumber } from "ethers";

function EntriesModal({ open, onClose }) {
  const { entries } = useEntries();
  return (
    <div id="entries-modal" className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box">
        <div className="flex flex-wrap flex-row justify-center sm:justify-start mb-2 overflow-y-scroll">
          {!entries?.length && <div>No Entries</div>}
          {entries?.map(entry => {
            return (
              <div className="flex justify-center items-center p-2">
                {entry.map(num => (
                  <div className="flex items-center justify-center text-xl font-bold border-primary border-2 rounded-full m-2 h-12 w-12">
                    {BigNumber.from(num).toNumber()}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="modal-action">
          <a onClick={onClose} className="btn">
            Close
          </a>
        </div>
      </div>
    </div>
  );
}

export default EntriesModal;
