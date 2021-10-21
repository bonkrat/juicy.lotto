import React, { useState, useEffect } from "react";
import { useJackpot } from "../hooks/JuicyLotto";
import { LoadingWrapper, Skeleton } from "./shared";

function FundingProgressSkeleton() {
  return (
    <>
      <Skeleton width="full" height={8} />
      <Skeleton width="1/4" height={8} />
    </>
  );
}

function FundingProgress() {
  const { jackpot, minJackpot } = useJackpot(),
    percentLeft =
      minJackpot > 0 && jackpot > 0
        ? Math.floor((100 / minJackpot.mul(100).div(jackpot).toNumber()) * 100)
        : 0,
    [progress, setProgress] = useState(0),
    updateProgressBar = () => {
      setProgress(prevProgress => {
        if (prevProgress < percentLeft) {
          return prevProgress + 1;
        } else {
          setProgress(percentLeft);
        }
      });
    };

  useEffect(() => {
    requestAnimationFrame(updateProgressBar);
  }, [percentLeft, progress]);

  return (
    <div className="flex content-center items-center space-x-4 w-full">
      <LoadingWrapper
        showComponent={jackpot && minJackpot && percentLeft}
        skeleton={<FundingProgressSkeleton />}
      >
        <progress className="progress progress-secondary" value={progress} max="100"></progress>
        <span className="flex-grow w-4/5 sm:w-1/4 badge p-4">{percentLeft}% funded</span>
      </LoadingWrapper>
    </div>
  );
}

export default FundingProgress;
