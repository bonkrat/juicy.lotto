import { useEthers } from "@usedapp/core";
import React, { useEffect, useState } from "react";
import { CHAIN_ID_TO_NETWORK, NETWORK, NETWORK_TO_CHAIN_ID } from "../constants";

function Network() {
  const { account, chainId } = useEthers(),
    [showTooltip, setShowTooltip] = useState(false),
    network = (
      <div
        className={`btn btn-neutral font-bold text-lg ${
          NETWORK_TO_CHAIN_ID[NETWORK] !== chainId && "bg-error hover:bg-error"
        }`}
        onClick={() => setShowTooltip(true)}
      >
        {CHAIN_ID_TO_NETWORK[chainId]}
      </div>
    );

  useEffect(() => {
    setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
  }, [showTooltip]);

  return account ? (
    <div
      className={`tooltip tooltip-bottom ${showTooltip ? "tooltip-open" : ""}`}
      data-tip={
        NETWORK_TO_CHAIN_ID[NETWORK] !== chainId
          ? `Please switch your wallet to ${NETWORK}.`
          : `Your wallet is connected to the correct network.`
      }
    >
      {network}
    </div>
  ) : null;
}

export default Network;
