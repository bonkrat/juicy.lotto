const { ethers } = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = require("ethers");

const MAX_NUM = 25,
  ENTRY_FEE = 0.001 * 10 ** 18,
  MIN_JACKPOT = 5,
  JUICEBOX_FEE = 0.1 * 100,
  PROJECT_ID = 1,
  KEY_HASH = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
  FEE = "5",
  FAKE_TERMINAL_DIRECTORY = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
  initialLink = BigNumber.from("1000000000000000000000000000"),
  expected = 777,
  winningNumbers = [5, 10, 16],
  randomInt = () => {
    const num = Math.floor(Math.random() * MAX_NUM);
    return num === 0 ? 1 : num;
  },
  randomEntry = () => [1, 2, 3].map(() => randomInt()),
  LotteryState = {
    Open: 0,
    DrawingNumbers: 1,
    Closed: 2,
  };

describe("JuicyLotto Contract", () => {
  let LinkToken, JuicyLotto, VRFCoordinator, V3Aggregator, owner, addr1, addr2, addrs;

  beforeEach(async () => {
    LinkToken = await ethers.getContractFactory("LinkToken");
    linkToken = await LinkToken.deploy();

    VRFCoordinator = await ethers.getContractFactory("VRFCoordinatorMock");
    vrfCoordinator = await VRFCoordinator.deploy(linkToken.address);

    V3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    v3aggregator = await V3Aggregator.deploy(2, 300050);

    args = [
      MAX_NUM,
      ENTRY_FEE,
      MIN_JACKPOT,
      JUICEBOX_FEE,
      vrfCoordinator.address,
      linkToken.address,
      KEY_HASH,
      FEE,
      false,
      PROJECT_ID,
      FAKE_TERMINAL_DIRECTORY,
      v3aggregator.address,
    ];

    JuicyLotto = await ethers.getContractFactory("JuicyLotto");
    juicyLotto = await JuicyLotto.deploy(...args);
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
  });

  describe("drawNumbers()", async () => {
    const value = BigNumber.from("10000000000000000000"); // 10 ETH

    it("puts the lottery in a drawing numbers state", async () => {
      await linkToken.transfer(juicyLotto.address, FEE);
      await juicyLotto.connect(addr1).fund({ value });

      await juicyLotto.drawNumbers();

      expect(await juicyLotto.state()).to.equal(LotteryState.DrawingNumbers);
    });

    it("requires a minimum amount of LINK token on the contract", async () => {
      await juicyLotto.connect(addr1).fund({ value });
      await linkToken.transfer(juicyLotto.address, BigNumber.from(FEE).sub(5));

      await expect(juicyLotto.drawNumbers()).to.be.revertedWith(
        "JuicyLotto::drawNumbers INSUFFICIENT_LINK",
      );
    });

    it("requires a minimum jackpot prize", async () => {
      await linkToken.transfer(juicyLotto.address, FEE);
      await juicyLotto.connect(addr1).fund({ value: 1 });

      await expect(juicyLotto.drawNumbers()).to.be.revertedWith(
        "JuicyLotto::drawNumbers INSUFFICIENT_JACKPOT_PRIZE",
      );
    });
  });

  describe("fund()", async () => {
    it("should increase the jackpot when funds are received", async () => {
      expect(await juicyLotto.jackpot()).to.equal(0);
      const value = BigNumber.from("10000000000000000000"); // 10 ETH
      await juicyLotto.connect(addr1).fund({ value });
      expect(await juicyLotto.jackpot()).to.equal(value);
    });
  });

  describe("withdrawLink()", () => {
    it("lets the owner withdraw LINK token", async () => {
      await linkToken.transfer(juicyLotto.address, 5);
      expect(await linkToken.balanceOf(juicyLotto.address)).to.equal(5);
      expect(await linkToken.balanceOf(owner.address)).to.equal(initialLink.sub(5));

      await juicyLotto.connect(owner).withdrawLink();
      expect(await linkToken.balanceOf(juicyLotto.address)).to.equal(0);
      expect(await linkToken.balanceOf(owner.address)).to.equal(initialLink);
    });

    it("does not let other addrs withdraw LINK", async () => {
      await linkToken.transfer(juicyLotto.address, 5);
      expect(await linkToken.balanceOf(juicyLotto.address)).to.equal(5);
      expect(await linkToken.balanceOf(owner.address)).to.equal(initialLink.sub(5));
      await expect(juicyLotto.connect(addr1).withdrawLink()).to.be.reverted;
    });
  });

  describe("buyEntries()", () => {
    const entries = [
      [1, 2, 3],
      [4, 5, 6],
    ];

    it("lets users enter by buying multiple entries at once", async () => {
      await juicyLotto.connect(addr1).buyEntries(entries, { value: ENTRY_FEE * 2 });

      const juicyEntries = await juicyLotto.connect(addr1).getEntries(addr1.address);

      entries.map((entry, i) => {
        entry.forEach((num, j) => {
          expect(juicyEntries[i][j]).to.equal(num);
        });
      });
    });

    it("requires an entry fee", async () => {
      await expect(juicyLotto.connect(addr1).buyEntries(entries, { value: ENTRY_FEE })).to.be
        .reverted;
    });

    it("requires entries to be in the right range", async () => {
      await expect(juicyLotto.connect(addr1).buyEntries([[1, 2, 5000]], { value: ENTRY_FEE })).to.be
        .reverted;
      await expect(juicyLotto.connect(addr1).buyEntries([[-1, 2, 3]], { value: ENTRY_FEE })).to.be
        .reverted;
    });

    it("requires at least one entry", async () => {
      await expect(juicyLotto.connect(addr1).buyEntries([], { value: ENTRY_FEE })).to.be.reverted;
    });

    it("increases the jackpot when entries are bought", async () => {
      const originalJackpot = await juicyLotto.jackpot();
      await juicyLotto.connect(addr1).buyEntries(entries, { value: ENTRY_FEE * 2 });
      expect(await juicyLotto.jackpot()).to.equal(originalJackpot + ENTRY_FEE * 2);
    });
  });

  describe("fulfillRandomness()", () => {
    const entries = [[1, 2, 3], [4, 5, 6], winningNumbers];

    beforeEach(async () => {
      await linkToken.transfer(juicyLotto.address, 20);
    });

    it("picks winner of the jackpot and grants their stake", async () => {
      await juicyLotto.connect(addr1).buyEntries(entries, { value: ENTRY_FEE * entries.length });

      const transaction = await juicyLotto.connect(owner).drawNumbers();
      const tx_receipt = await transaction.wait(1);
      const requestId = tx_receipt.events[3].topics[0];
      expect(requestId).to.not.be.null;

      const jackpot = await juicyLotto.jackpot();

      await vrfCoordinator.callBackWithRandomness(requestId, expected, juicyLotto.address);

      const pickedNumbers = await juicyLotto.getWinningNumbers();
      await Promise.all(
        winningNumbers.map(async (num, i) => {
          expect(num).equals(pickedNumbers[i].toNumber());
        }),
      );

      expect(await juicyLotto.connect(owner).getStake(owner.address)).to.equal(jackpot * 0.05);
      expect(await juicyLotto.connect(addr1).getStake(addr1.address)).to.equal(
        jackpot - jackpot * 0.05,
      );
      expect(await juicyLotto.jackpot()).to.equal(0);
    });

    it("divides up winning jackpot over many winners", async () => {
      Promise.all(
        addrs.map(async addr => {
          await juicyLotto.connect(addr).buyEntries(entries, { value: ENTRY_FEE * entries.length });
        }),
      );

      const jackpot = await juicyLotto.jackpot();
      const jackpotMinusDrawerStake = jackpot - jackpot * 0.05;
      const expectedStakes = jackpotMinusDrawerStake / addrs.length;

      // Draw Numbers
      const transaction = await juicyLotto.drawNumbers();
      const tx_receipt = await transaction.wait(1);
      const requestId = tx_receipt.events[3].topics[0];

      await vrfCoordinator.callBackWithRandomness(requestId, expected, juicyLotto.address);

      Promise.all(
        addrs.map(async addr => {
          expect(await juicyLotto.connect(addr).getEntries(addr.address)).deep.to.equal([]);
          expect(await juicyLotto.connect(addr).getStake(addr.address)).to.equal(expectedStakes);
        }),
      );

      expect(await juicyLotto.jackpot()).to.equal(0);
    });

    it("jackpot stays the same, entries roll over and no stakes given out if no winners", async () => {
      await Promise.all(
        addrs.map(async addr => {
          await juicyLotto.connect(addr).buyEntries(
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
            { value: ENTRY_FEE * 2 },
          );
        }),
      );

      const jackpot = await juicyLotto.jackpot();

      const transaction = await juicyLotto.drawNumbers();
      const tx_receipt = await transaction.wait(1);
      const requestId = tx_receipt.events[3].topics[0];

      await vrfCoordinator.callBackWithRandomness(requestId, expected, juicyLotto.address);

      await Promise.all(
        addrs.map(async addr => {
          expect(await juicyLotto.connect(addr).getStake(addr.address)).to.equal(0);
        }),
      );

      await Promise.all(
        addrs.map(async addr => {
          expect(await juicyLotto.connect(addr).getEntries(addr.address)).deep.to.equal([
            [1, 2, 3].map(BigNumber.from),
            [4, 5, 6].map(BigNumber.from),
          ]);
        }),
      );

      expect(await juicyLotto.jackpot()).to.equal(jackpot);
    });

    it("jackpot accumulates between rounds", async () => {
      await Promise.all(
        addrs.map(async addr => {
          await juicyLotto.connect(addr).buyEntries(
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
            { value: ENTRY_FEE * 2 },
          );
        }),
      );

      const jackpot = await juicyLotto.jackpot();

      const transaction = await juicyLotto.drawNumbers();
      const tx_receipt = await transaction.wait(1);
      const requestId = tx_receipt.events[3].topics[0];

      await vrfCoordinator.callBackWithRandomness(requestId, expected, juicyLotto.address);

      await Promise.all(
        addrs.map(async addr => {
          await juicyLotto.connect(addr).buyEntries(
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
            { value: ENTRY_FEE * 2 },
          );
        }),
      );

      expect(await juicyLotto.jackpot()).to.equal(jackpot.mul(2));
    });

    it("chooses a winner after multiple rounds", async () => {
      await Promise.all(
        addrs.map(async addr => {
          await juicyLotto.connect(addr).buyEntries(
            [
              [1, 2, 3],
              [4, 5, 6],
            ],
            { value: ENTRY_FEE * 2 },
          );
        }),
      );

      const transaction = await juicyLotto.drawNumbers();
      const tx_receipt = await transaction.wait(1);
      const requestId = tx_receipt.events[3].topics[0];

      await vrfCoordinator.callBackWithRandomness(requestId, expected, juicyLotto.address);

      expect(await juicyLotto.connect(addr1).getStake(addr1.address)).to.equal(0);

      await juicyLotto.connect(addr1).buyEntries([winningNumbers], { value: ENTRY_FEE });

      const finalJackpot = await juicyLotto.jackpot();
      const drawerStake = finalJackpot.mul(5).div(100);

      const transaction2 = await juicyLotto.drawNumbers();
      const tx_receipt2 = await transaction2.wait(1);
      const requestId2 = tx_receipt2.events[3].topics[0];

      await vrfCoordinator.callBackWithRandomness(requestId2, expected, juicyLotto.address);

      expect(await juicyLotto.jackpot()).to.equal(0);
      expect(await juicyLotto.connect(addr1).getStake(addr1.address)).to.equal(
        finalJackpot.sub(drawerStake),
      );
    });
  });

  describe("withdrawStake()", () => {
    beforeEach(async () => {
      await linkToken.transfer(juicyLotto.address, 5);
      await juicyLotto.connect(owner).fund({ value: BigNumber.from("5000000000000000000") });
    });

    it("requires the user to have some stake", async () => {
      await expect(juicyLotto.connect(addr1).withdrawStake(addr1.address)).to.be.reverted;
    });

    it("lets the user withdraw their stake", async () => {
      const originalWalletAmount = await ethers.provider.getBalance(addr1.address);
      const entryTransaction = await juicyLotto
        .connect(addr1)
        .buyEntries([winningNumbers], { value: ENTRY_FEE });
      const entry_tx_receipt = await entryTransaction.wait(1);
      const entryGas = entry_tx_receipt.gasUsed.mul(entryTransaction.gasPrice);

      expect(await ethers.provider.getBalance(addr1.address)).to.equal(
        originalWalletAmount.sub(ENTRY_FEE).sub(entryGas),
      );

      const jackpot = await juicyLotto.jackpot();

      const drawTransaction = await juicyLotto.connect(owner).drawNumbers();
      const draw_tx_receipt = await drawTransaction.wait(1);
      const requestId = draw_tx_receipt.events[3].topics[0];
      await vrfCoordinator.callBackWithRandomness(requestId, expected, juicyLotto.address);

      const withdrawStakeTransaction = await juicyLotto.connect(addr1).withdrawStake(addr1.address);
      const withdraw_stake_tx_receipt = await withdrawStakeTransaction.wait(1);
      const withdrawGas = withdraw_stake_tx_receipt.gasUsed.mul(withdrawStakeTransaction.gasPrice);

      const drawerJackpotStake = jackpot.mul(5).div(100);
      expect(await ethers.provider.getBalance(addr1.address)).to.equal(
        originalWalletAmount
          .add(jackpot)
          .sub(drawerJackpotStake)
          .sub(ENTRY_FEE)
          .sub(entryGas)
          .sub(withdrawGas),
      );

      expect(await juicyLotto.connect(addr1).getStake(addr1.address)).to.equal(0);
    });
  });

  describe("withdrawEntries()", () => {
    beforeEach(async () => {
      await linkToken.transfer(juicyLotto.address, 5);
      await juicyLotto.connect(owner).fund({ value: BigNumber.from("5000000000000000000") });
    });

    it("requires a lottery to be running", async () => {
      await juicyLotto
        .connect(addr1)
        .buyEntries([winningNumbers, [1, 2, 3]], { value: ENTRY_FEE * 2 });

      await juicyLotto.drawNumbers();
      await expect(juicyLotto.connect(addr1).withdrawEntries()).to.be.reverted;
    });

    it("requires the user to have some entries", async () => {
      await expect(juicyLotto.connect(addr1).withdrawEntries()).to.be.reverted;
    });

    it("lets the user withdraw their entries", async () => {
      await juicyLotto
        .connect(addr1)
        .buyEntries([winningNumbers, [1, 2, 3]], { value: ENTRY_FEE * 2 });

      await juicyLotto.connect(addr1).withdrawEntries(addr1.address);
      expect(await juicyLotto.connect(addr1).getEntries(addr1.address)).deep.to.equal([]);

      const jackpot = await juicyLotto.jackpot();
      expect(jackpot).to.equal("5000000000000000000");
    });
  });

  describe("liquidate()", async () => {
    it("pays out entrants and sends the rest to the designated address", async () => {
      const gasUsed = {},
        originalBalance = {},
        originalOwnerBalance = await ethers.provider.getBalance(owner.address),
        fundTransaction = await juicyLotto
          .connect(owner)
          .fund({ value: BigNumber.from("5000000000000000000") }),
        fundTransactionReceipt = await fundTransaction.wait(1),
        fundGas = fundTransaction.gasPrice.mul(fundTransactionReceipt.gasUsed);

      await Promise.all(
        [addr1, addr2].map(async addr => {
          originalBalance[addr.address] = await ethers.provider.getBalance(addr.address);
          const entries = [1, 2, 3].map(() => randomEntry());
          const tx = await juicyLotto
            .connect(addr)
            .buyEntries(entries, { value: ENTRY_FEE * entries.length });
          const txReceipt = await tx.wait(1);
          gasUsed[addr.address] = txReceipt.gasUsed.mul(tx.gasPrice);
        }),
      );

      const liquidateTx = await juicyLotto.connect(owner).liquidate(owner.address),
        liquidateTxReceipt = await liquidateTx.wait(1),
        liquidateGas = liquidateTx.gasPrice.mul(liquidateTxReceipt.gasUsed);

      await Promise.all(
        [addr1, addr2].map(async addr => {
          expect(await ethers.provider.getBalance(addr.address)).to.equal(
            // Original entrants get their money back
            originalBalance[addr.address].sub(gasUsed[addr.address]),
          );
        }),
      );

      expect(await ethers.provider.getBalance(owner.address)).to.equal(
        originalOwnerBalance.sub(fundGas).sub(liquidateGas),
      );
      expect(await juicyLotto.jackpot()).to.equal(0);
      expect(await ethers.provider.getBalance(juicyLotto.address)).to.equal(0);
      expect(await juicyLotto.state()).to.equal(LotteryState.Closed);
    });
  });

  describe("setEntryFee()", async () => {
    it("resets all entrants and sets the new entry fee", async () => {
      const gasUsed = {},
        originalBalance = {},
        fundTransaction = await juicyLotto
          .connect(owner)
          .fund({ value: BigNumber.from("5000000000000000000") }),
        fundTransactionReceipt = await fundTransaction.wait(1),
        originalJackpot = await juicyLotto.jackpot();

      await Promise.all(
        [addr1, addr2].map(async addr => {
          originalBalance[addr.address] = await ethers.provider.getBalance(addr.address);
          const entries = [1, 2, 3].map(() => randomEntry());
          const tx = await juicyLotto
            .connect(addr)
            .buyEntries(entries, { value: ENTRY_FEE * entries.length });
          const txReceipt = await tx.wait(1);
          gasUsed[addr.address] = txReceipt.gasUsed.mul(tx.gasPrice);
        }),
      );

      const setEntryFeeTx = await juicyLotto.connect(owner).setEntryFee(10);

      await Promise.all(
        [addr1, addr2].map(async addr => {
          expect(await ethers.provider.getBalance(addr.address)).to.equal(
            // Original entrants get their money back
            originalBalance[addr.address].sub(gasUsed[addr.address]),
          );
        }),
      );

      expect(await juicyLotto.jackpot()).to.equal(originalJackpot);
      expect(await juicyLotto.entryFee()).to.equal(10);
    });
  });

  describe("getLatestEthUSDPrice()", () => {
    it("gets latest price", async () => {
      expect(await juicyLotto.getLatestUSDEthPrice()).to.equal(300050);
    });
  });
});
