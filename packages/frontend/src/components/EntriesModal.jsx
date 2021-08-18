import React from "react";
import { useEntries } from "../hooks/JuicyLotto";
import { BigNumber } from "ethers";

function EntriesModal() {
  const { entries } = useEntries();
  return (
    <div id="entries-modal" class="modal">
      <div class="modal-box">
        <div className="flex flex-wrap flex-row justify-center sm:justify-start h-64 mb-2 overflow-y-scroll">
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
        <div class="modal-action">
          <a href="/components/modal#" class="btn">
            Close
          </a>
        </div>
      </div>
    </div>
  );
}

export default EntriesModal;
