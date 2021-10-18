import React, { useState } from "react";

function InfoModal() {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button
        className="absolute top-4 right-4 btn btn-neutral font-bold text-lg uppercase"
        onClick={() => setShowModal(true)}
      >
        ?
      </button>
      <div id="info-modal" className={`modal ${showModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <div className="max-h-96 sm:max-h-full overflow-y-scroll">
            <p className="mb-8">
              juicy lotto is a match three lottery game running on Ethereum and powered by a{" "}
              <a className="link" href="juicebox.money/">
                Juicebox DAO
              </a>
              .
            </p>
            <p className="mb-8">
              Users participate in the lottery by buying entries as combinations of three numbers.
              Any user can initiate a drawing when the minimum jackpot is acheived. Any participant
              with all three matching numbers receives an equal payout of the jackpot. All entries
              are cleared and the submitter of the draw transaction receives a 5% payout of the
              jackpot if there is at least one winner. All entries and the jackpot pool rollover to
              the next drawing if no winners are selected.
            </p>
            <p className="mb-8">
              Numbers are chosen at random using a Chainlink VRF, meaning there must be a minimum
              amount of LINK token on the contract to draw numbers.
            </p>
            <p className="mb-8">
              Anyone can participate in the DAO by contributing to the treasury and receving juicy
              lotto tokens in return. Funds raised by funding cycles will be used to purchase LINK
              for the lottery contract's VRF function as well as providing to the jackpot pool. A
              percentage of each succesful drawing is fed back to the treasury, where token holders
              can take their share at any time by redeeming their juicy lotto tokens.
            </p>
          </div>
          <div className="modal-action">
            <button className="btn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default InfoModal;
