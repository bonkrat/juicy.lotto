//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

import "@jbox/sol/contracts/abstract/JuiceboxProject.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/dev/VRFConsumerBase.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

/**
     _____            __                            __                  __      __               
    |     \          |  \                          |  \                |  \    |  \              
     \$$$$$ __    __  \$$  _______  __    __       | $$       ______  _| $$_  _| $$_     ______  
       | $$|  \  |  \|  \ /       \|  \  |  \      | $$      /      \|   $$ \|   $$ \   /      \ 
  __   | $$| $$  | $$| $$|  $$$$$$$| $$  | $$      | $$     |  $$$$$$\\$$$$$$ \$$$$$$  |  $$$$$$\
 |  \  | $$| $$  | $$| $$| $$      | $$  | $$      | $$     | $$  | $$ | $$ __ | $$ __ | $$  | $$
 | $$__| $$| $$__/ $$| $$| $$_____ | $$__/ $$      | $$_____| $$__/ $$ | $$|  \| $$|  \| $$__/ $$
  \$$    $$ \$$    $$| $$ \$$     \ \$$    $$      | $$     \\$$    $$  \$$  $$ \$$  $$ \$$    $$
   \$$$$$$   \$$$$$$  \$$  \$$$$$$$ _\$$$$$$$       \$$$$$$$$ \$$$$$$    \$$$$   \$$$$   \$$$$$$ 
                                   |  \__| $$                                                    
                                    \$$    $$                                                    
                                     \$$$$$$                                                     
 @title JuicyLotto
*/
contract JuicyLotto is VRFConsumerBase, Ownable, JuiceboxProject {
  AggregatorV3Interface internal priceFeed;

  // STORAGE VARS
  // Stores users entries for picking jackpot winners.
  mapping(uint256 => mapping(uint256 => mapping(uint256 => address[]))) jackpotNumbers;
  // Stores entries for easy retrieval.
  mapping(address => uint256[3][]) entries;
  // Array of all the addresses that have bought tickets. Used to iterate through `entries`.
  address[] entrants;
  // Number of entries
  uint256 public numOfEntries;
  // The staked amount of winnings for each entrant address.
  mapping(address => uint256) stake;
  // The address that request the current number drawing.
  address numberDrawer;

  // CHAINLINK VRF
  bytes32 internal keyHash;
  uint256 internal fee;

  // LOTTO CONFIGURATION
  // The maximum number per pick a user can enter. The higher the max number the lower the odds of winning.
  uint256 public maxNum;
  // The price per entry.
  uint256 public entryFee;
  // The current jackpot pool.
  uint256 public jackpot;
  // The percentage Juicebox takes.
  uint256 public juiceboxFee;
  // The last winning numbers.
  uint256[] public winningNumbers;
  // Controls whether to pay out the Juicebox project (false for testing locally).
  bool private juiceboxEnabled;
  // Minimum jackpot before a drawing can occur.
  uint256 public minJackpot;

  // State of the lottery.
  enum LotteryState {
    Open,
    DrawingNumbers,
    Closed
  }

  // The current state of the lottery.
  LotteryState public state;

  // Function modifier for restricting when functions can be executed based on Lottery state.
  modifier isState(LotteryState _state) {
    require(state == _state, "JuicyLotto::isState INVALID_LOTTERY_STATE");
    _;
  }

  // EVENTS
  // Event fired when VRF number is drawn, with the VRF request id.
  event DrawNumbers(bytes32 requestId);
  // Event fired with the winning numbers determined from the VRF results.
  event WinningNumbers(uint256[] winningNumbers);
  // Winner and amount they won
  event Winner(address winner, uint256 amount);
  // Lottery state changed.
  event LotteryStateChanged(LotteryState newState);

  /**
  Creates a contract instance of a JuicyLotto and opens the lottery.
 */
  constructor(
    // The maximum number per pick a user can enter. The higher the max number the lower the odds of winning.
    uint256 _maxNum,
    // The price per entry.
    uint256 _entryFee,
    // The minimum jackpot before a drawing can occur.
    uint256 _minJackpot,
    // The percentage juicebox takes.
    uint256 _juiceboxFee,
    // The address of the Chainlink VRF coordinator.
    address _vrfCoordinator,
    // The contract address of Chainlink LINK token.
    address _link,
    // The keyhash to use for Chainlink VRF.
    bytes32 _keyHash,
    // The Chainlink VRF fee.
    uint256 _fee,
    // Controls whether to pay out to a Juicebox project (false for testing).
    bool _juiceboxEnabled,
    // The Juicebox project ID.
    uint256 _projectId,
    // The Juicebox terminal directory address.
    ITerminalDirectory _terminalDirectory,
    // Aggregator address
    address _aggregatorAddress
  ) VRFConsumerBase(_vrfCoordinator, _link) JuiceboxProject(_projectId, _terminalDirectory) {
    require(_maxNum > 0, "Maximum number must be greater than 0");
    require(_entryFee > 0, "Entry fee must be greater than 0");
    if (_juiceboxEnabled) {
      require(_juiceboxFee > 0 && _juiceboxFee < 100, "Invalid Juicebox Fee");
    }
    maxNum = _maxNum;
    entryFee = _entryFee;
    minJackpot = _minJackpot;
    juiceboxFee = _juiceboxFee;
    jackpot = 0;
    keyHash = _keyHash;
    fee = _fee;
    juiceboxEnabled = _juiceboxEnabled;
    priceFeed = AggregatorV3Interface(_aggregatorAddress);
    _changeState(LotteryState.Open);
  }

  /**
    Takes funds to supply and adds them to the current jackpot, but does not grant entries. 
    @dev Used for funding the lotto from the Juicebox DAO.
   */
  function fund() public payable isState(LotteryState.Open) {
    jackpot += msg.value;
  }

  /**
  Buys an entry to the lottery for the _entry fee.
  @param _entries an array of entries, each an array of three number values. (e.g. [[1,2,3], [4,5,6]])
 */
  function buyEntries(uint256[3][] calldata _entries) public payable isState(LotteryState.Open) {
    require(_entries.length > 0, "JuicyLotto::buyEntries INSUFFICIENT_ENTRIES");
    require(msg.value == entryFee * _entries.length, "JuicyLotto::buyEntries INVALID_MSG_VALUE");

    for (uint256 i = 0; i < _entries.length; i++) {
      require(_entries[i].length == 3, "JuicyLotto::buyEntries BAD_ENTRY_LENGTH");
      _addEntry(_entries[i][0], _entries[i][1], _entries[i][2]);
    }
  }

  /**
    Adds an entry for the msg.sender and increases the jackpot pool.
    @param _num0 the first number of the entry.
    @param _num1 the second number of the entry.
    @param _num2 the third number of the entry.
  */
  function _addEntry(
    uint256 _num0,
    uint256 _num1,
    uint256 _num2
  ) private {
    require(
      (_num0 >= 0 && _num0 < maxNum) &&
        (_num1 >= 0 && _num1 < maxNum) &&
        (_num2 >= 0 && _num2 < maxNum),
      "JuicyLotto::buyEntry ENTRY_OUT_OF_BOUNDS"
    );
    jackpotNumbers[_num0][_num1][_num2].push(msg.sender);
    jackpot += entryFee;
    entries[msg.sender].push([_num0, _num1, _num2]);
    entrants.push(msg.sender);
    numOfEntries++;
  }

  /**
    Draws 3 winning numbers for the lottery, using Chainlink VRF for a random value.
    @dev requests randomness from the Chainlink VRF contract.
    @return requestId the Chainlink VRF requestId.
 */
  function drawNumbers() public isState(LotteryState.Open) returns (bytes32 requestId) {
    require(jackpot >= minJackpot, "JuicyLotto::drawNumbers INSUFFICIENT_JACKPOT_PRIZE");
    require(LINK.balanceOf(address(this)) >= fee, "JuicyLotto::drawNumbers INSUFFICIENT_LINK");

    _changeState(LotteryState.DrawingNumbers);

    requestId = requestRandomness(keyHash, fee);
    numberDrawer = msg.sender;
    emit DrawNumbers(requestId);
    return requestId;
  }

  /**
    Callback function used by VRF Coordinator. Selects winners and sets winning stakes for correct guesses. Pays the address who drew numbers if there is a winner.
    @dev clears out entries and jackpot only if there is a winner.
    @param _requestId the Chainlink VRF request ID.
    @param _randomness the random value returned from the VRF.
   */
  function fulfillRandomness(bytes32 _requestId, uint256 _randomness)
    internal
    override
    isState(LotteryState.DrawingNumbers)
  {
    winningNumbers = _expand(
      _randomness + 1, /* +1 to force above 0 */
      3,
      maxNum
    );

    address[] memory winners = jackpotNumbers[winningNumbers[0]][winningNumbers[1]][
      winningNumbers[2]
    ];

    emit WinningNumbers(winningNumbers);

    if (winners.length > 0) {
      // Payout the address that called drawNumbers (5%).
      uint256 drawerStake = (jackpot * 5) / 100;
      uint256 availableJackpot = jackpot - drawerStake;
      stake[numberDrawer] = drawerStake;
      delete numberDrawer;

      uint256 winningStake = availableJackpot / winners.length;

      for (uint256 i = 0; i < winners.length; i++) {
        if (winningStake > 0) {
          stake[winners[i]] = winningStake;
          availableJackpot -= winningStake;
          emit Winner(winners[i], winningStake);
        }
      }

      delete jackpotNumbers[winningNumbers[0]][winningNumbers[1]][winningNumbers[2]];

      // Clear out entries
      for (uint256 i = 0; i < entrants.length; i++) {
        if (entries[entrants[i]].length > 0) {
          delete entries[entrants[i]];
        }
      }

      delete entrants;
      jackpot = 0;
      numOfEntries = 0;
    }

    _changeState(LotteryState.Open);
  }

  /**
    Returns the senders current entries.
    @param account the address of the account to look up.
    @return the message sender's entries.
  */
  function getEntries(address account) public view returns (uint256[3][] memory) {
    require(account == msg.sender, "JuicyLotto::getEntries INVALID_ACCOUNT_ADDRESS");
    return entries[account];
  }

  /**
    Returns the stake that the sender has accrued. 
    @param account the address of the account to get stake for.
    @return the message sender's accrued stake.
  */
  function getStake(address account) public view returns (uint256) {
    require(account == msg.sender, "JuicyLotto::getStake INVALID_ACCOUNT_ADDRESS");
    return stake[account];
  }

  /**
  Returns the array of the last winning numbers.
  @return an array of winning numbers.
 */
  function getWinningNumbers() public view returns (uint256[] memory) {
    return winningNumbers;
  }

  /**
    Withdraw any winnings you have staked. 
   */
  function withdrawStake(address account) public {
    require(account == msg.sender, "JuicyLotto::withdrawStake INVALID_ACCOUNT_ADDRESS");
    require(stake[msg.sender] > 0, "JuicyLotto::withdrawStake INSUFFICIENT_ENTRANT_STAKE");
    uint256 _total = stake[msg.sender];
    stake[msg.sender] = 0;

    if (juiceboxEnabled) {
      uint256 juiceboxStake = (_total * juiceboxFee) / 100;
      uint256 _collectable = _total - juiceboxStake;
      _takeFee(_total - _collectable, msg.sender, "Fee from JuicyLotto", false);
      payable(msg.sender).transfer(_collectable);
    } else {
      payable(msg.sender).transfer(_total);
    }
  }

  /**
    Withdraw entries and receive a refund.
   */
  function withdrawEntries(address account) public isState(LotteryState.Open) {
    require(account == msg.sender, "JuicyLotto::withdrawEntries INVALID_ACCOUNT_ADDRESS");
    require(
      entries[msg.sender].length > 0,
      "JuicyLotto::withdrawEntries INSUFFICIENT_ENTRANT_COUNT"
    );

    payable(msg.sender).transfer(entries[msg.sender].length * entryFee);
    jackpot -= entries[msg.sender].length * entryFee;
    numOfEntries -= entries[msg.sender].length;

    delete entries[msg.sender];
    for (uint256 i; i < entrants.length; i++) {
      if (entrants[i] == msg.sender) {
        delete entrants[i];
      }
    }
  }

  /**
    Liquidate the current jackpot pool.
    @dev If there are entrants, pay them refunds and send the rest to the Juicebox treasury (or the receipient address). Sets jackpot to zero and close the lottery.
   */
  function liquidate(address _receipient) public onlyOwner {
    require(jackpot > 0, "JuicyLotto::liquidate INSUFFICIENT_JACKPOT_FUNDS");
    if (state == LotteryState.Open) {
      // Remove all current entries.
      if (entrants.length > 0) {
        for (uint256 i = 0; i < entrants.length; i++) {
          if (entries[entrants[i]].length > 0) {
            uint256 _collectable = entries[entrants[i]].length * entryFee;
            payable(entrants[i]).transfer(_collectable);
            jackpot -= _collectable;
          }

          delete entries[entrants[i]];
        }
      }
    }

    delete entrants;

    if (juiceboxEnabled) {
      _takeFee(jackpot, msg.sender, "Liquidated Juicy Lotto jackpot", false);
    } else {
      payable(_receipient).transfer(jackpot);
    }

    jackpot = 0;
    _changeState(LotteryState.Closed);
  }

  /**
    Opens the lottery to allow entries to be bought.
   */
  function openLottery() public onlyOwner isState(LotteryState.Closed) {
    _changeState(LotteryState.Open);
  }

  /**
    Close the lottery. 
   */
  function closeLottery()
    public
    onlyOwner
    isState(LotteryState.Open)
    isState(LotteryState.DrawingNumbers)
  {
    _changeState(LotteryState.Closed);
  }

  function setEntryFee(uint256 _fee) public onlyOwner {
    require(_fee > 0, "JuicyLotto::setEntryFee INSUFFICIENT_ENTRY_FEE");

    // Payout any current entrants.
    if (entrants.length > 0 && state == LotteryState.Open) {
      for (uint256 i = 0; i < entrants.length; i++) {
        if (entries[entrants[i]].length > 0) {
          uint256 _collectable = entries[entrants[i]].length * entryFee;
          payable(entrants[i]).transfer(_collectable);
          jackpot -= _collectable;
        }

        delete entries[entrants[i]];
      }
    }

    entryFee = _fee;
  }

  function setMinJackpot(uint256 _minJackpot) public onlyOwner {
    require(_minJackpot > 0, "JuicyLotto::setMinJackpot INSUFFICIENT_MIN_JACKPOT");
    minJackpot = _minJackpot;
  }

  function setJuiceboxFee(uint256 _juiceboxFee) public onlyOwner {
    require(minJackpot > 0, "JuicyLotto::setJuiceboxFee INSUFFICIENT_JUICEBOX_FEE");
    juiceboxFee = _juiceboxFee;
  }

  /**
    Withdraw LINK token. 
   */
  function withdrawLink() public onlyOwner {
    require(LINK.balanceOf(address(this)) > 0, "JuicyLotto:withdrawLink INSUFFICIENT_LINK");
    LINK.transfer(msg.sender, LINK.balanceOf(address(this)));
  }

  /**
    Returns the latest USD/ETH price
  */
  function getLatestUSDEthPrice() public view returns (int256) {
    (
      uint80 roundID,
      int256 price,
      uint256 startedAt,
      uint256 timeStamp,
      uint80 answeredInRound
    ) = priceFeed.latestRoundData();
    return price;
  }

  /**
    Expand a single number into n number values within a range.
    @param randomValue the random value to expand.
    @param n the number of values to return.
    @param max the maximum random number that can be chosen.
   */
  function _expand(
    uint256 randomValue,
    uint256 n,
    uint256 max
  ) private pure returns (uint256[] memory expandedValues) {
    expandedValues = new uint256[](n);
    for (uint256 i = 0; i < n; i++) {
      expandedValues[i] = (uint256(keccak256(abi.encode(randomValue, i))) % max);
    }
    return expandedValues;
  }

  /**
    Change the lottery state.
    @param _state the state to change the lottery to.
 */
  function _changeState(LotteryState _state) private {
    state = _state;
    emit LotteryStateChanged(_state);
  }
}
