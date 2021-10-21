import React from "react";
import { LotteryState } from "../constants";
import { useLottoSettings } from "../hooks/JuicyLotto";

function LotteryStateBadge() {
  const { state } = useLottoSettings();

  return (
    <div className="text-center">
      <div
        className={`badge ${
          [LotteryState.OPEN, LotteryState.FETCHING].includes(state)
            ? "badge-primary"
            : state === LotteryState.PICKING
            ? "badge-accent"
            : "badge-error"
        }
        ${state === undefined ? "animate-pulse" : ""} uppercase leading-none font-black`}
      >
        {[LotteryState.OPEN, LotteryState.FETCHING].includes(state) && "Open"}
        {state === LotteryState.PICKING && "Pending Winners"}
        {state === LotteryState.CLOSED && "Closed"}
      </div>
    </div>
  );
}

export default LotteryStateBadge;
