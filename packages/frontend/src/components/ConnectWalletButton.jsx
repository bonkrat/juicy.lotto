import React from "react";
import { useEthers } from "@usedapp/core";

function ConnectWalletButton() {
  const { activateBrowserWallet, account } = useEthers();

  return (
    !account && (
      <button className="btn btn-primary" onClick={activateBrowserWallet}>
        Connect Wallet
      </button>
    )
  );
}

export default ConnectWalletButton;
