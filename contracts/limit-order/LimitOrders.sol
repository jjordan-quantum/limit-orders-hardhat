pragma solidity ^0.6.6;

import './OrderManager.sol';
import "./LimitOrderOracle.sol";
import "./interfaces/ISwapRouter.sol";
import '../uniswap-periphery/interfaces/IWETH.sol';
import "../uniswap-periphery/interfaces/IERC20.sol";
import "../uniswap-periphery/interfaces/IUniswapV2Pair.sol";
import "../uniswap-periphery/interfaces/IUniswapV2Router02.sol";


contract LimitOrders is
    OrderManager,
    LimitOrderOracle {

    // TODO Payment functions
    // TODO Swap functions (use LimitOrderRouter)
    // TODO Oracle functions -> create / update / delete jobs
    // TODO Chainlink node functions -> checking for liquidation / liquidation

    address public routerAddress;
    IUniswapV2Router02 router;
    bool public routerSet;

    address public wethAddress;
    IWETH WETH;

    address public swapRouterAddress;
    ISwapRouter swapRouter;
    bool public swapRouterSet;

    address public paymentToken;
    bool public paymentTokenSet;

    address public stableToken;
    bool public stableTokenSet;

    bool public contractSet;

    bool public refundsEnabled;
    bool public protocolFeeEnabled;
    uint public protocolFeeAmount;

    uint public MAX_DEADLINE;
    uint public averageGasConsumedPerLiquidation;

    mapping(address => bool) _isAuthorizedOracle;

    modifier set() {

        require(contractSet, "LIMITORDERS: CONTRACT MUST BE SET");
        _;
    }

    modifier refundGas(address user, address beneficiary) {

        uint initialGasAmount = gasleft();

        _;

        if(refundsEnabled) {
            transferPaymentToken(
                user,
                beneficiary,
                initialGasAmount.sub(gasleft()).add(30000).mul(tx.gasprice)
            );
        }
    }

    modifier onlyOracle() {

        require(isAuthorizedOracle(msg.sender), "LIMITORDERS: ONLY CALLABLE BY AUTHORIZED ORACLE");
        _;
    }

    constructor() public OrderManager() {

        owner = msg.sender;
        MAX_DEADLINE = 2592000;
        averageGasConsumedPerLiquidation = 204040;

        _isAuthorizedOracle[msg.sender] = true;
    }

    //==================================================================================================================
    //
    //  ADMIN / OWNER FUNCTIONS
    //
    //==================================================================================================================

    function setRouter(address _routerAddress_) external payable onlyOwner {

        require(!routerSet, "LIMITORDERS: ROUTER ALREADY SET");
        routerAddress = _routerAddress_;
        router = IUniswapV2Router02(routerAddress);
        wethAddress = router.WETH();
        WETH = IWETH(wethAddress);
        routerSet = true;
        if(stableTokenSet && paymentTokenSet && swapRouterSet) {
            contractSet = true;
        }
    }

    function setSwapRouter(address _swapRouterAddress_) external payable onlyOwner {

        require(!swapRouterSet, "LIMITORDERS: SWAPROUTER ALREADY SET");
        swapRouterAddress = _swapRouterAddress_;
        swapRouter = ISwapRouter(swapRouterAddress);
        swapRouterSet = true;
        if(routerSet && stableTokenSet && paymentTokenSet) {
            contractSet = true;
        }
    }

    function setPaymentToken(address _paymentToken_) external payable onlyOwner {

        paymentToken = _paymentToken_;
        paymentTokenSet = true;
        if(stableTokenSet && routerSet && swapRouterSet) {
            contractSet = true;
        }
    }

    function setStableToken(address _stableToken_) external payable onlyOwner {

        stableToken = _stableToken_;
        stableTokenSet = true;
        if(paymentTokenSet && routerSet && swapRouterSet) {
            contractSet = true;
        }
    }

    function authorizeOracle(address oracle) external payable onlyOwner {

        _isAuthorizedOracle[oracle] = true;
    }

    function enableRefunds() external payable onlyOwner {

        refundsEnabled = true;
    }

    function updateMaxDeadline(uint newMaxDeadline) external payable onlyOwner {

        MAX_DEADLINE = newMaxDeadline;
    }

    function updateAverageGasConsumedPerLiquidation(uint newAverageGasConsumedPerLiquidation) external payable onlyOwner {

        averageGasConsumedPerLiquidation = newAverageGasConsumedPerLiquidation;
    }

    /*
     *  @dev setProtocolFee
     *
     *  @newFee - new protocol fee in us dollars with precision of 2 decimal places: $1.00 USD == 100
     */
    function setProtocolFee(uint newFee) external payable onlyOwner {

        require(stableTokenSet, "LIMITORDERS: STABLE TOKEN MUST BE SET BEFORE SETTING PROTOCOL FEE");
        if(newFee > 0) {
            protocolFeeEnabled = true;
            protocolFeeAmount = newFee * 10 ** (uint256(IERC20(stableToken).decimals()).sub(2));
        } else {
            protocolFeeEnabled = false;
            protocolFeeAmount = 0;
        }
    }

    function isAuthorizedOracle(address oracle) public view returns(bool) {
        return _isAuthorizedOracle[oracle];
    }

    //==================================================================================================================
    //
    //  CRUD OPERATIONS
    //
    //==================================================================================================================

    /*
     *  @dev createOrder (CREATE OP)
     *
     *  @selector - 1's digit represents ZeroForOne, and selector.div(10) represents router function number
     *
    */
    function createOrder(
        uint8 selector,
        address pair,
        uint inputAmount,
        uint minOutputAmount,
        uint deadline
    ) public payable set {

        require(selector > 99 && selector < 152, "LIMITORDERS: INVALID FUNCTION SELECTOR");
        require(checkPaymentTokenBalanceForUser(msg.sender), "LIMITORDERS: INSUFFICIENT PAYMENT TOKEN BALANCE FOR USER");
        require(deadline <= block.timestamp + MAX_DEADLINE, "LIMITORDERS: DEADLINE TOO LONG. MAX 30 DAYS");
        require(deadline > block.timestamp, "LIMITORDERS: DEADLINE IN THE PAST");

        if (selector < 112)  // from eth
        {
            require(isInputTokenWETH(selector, pair), "LIMITORDERS: INPUT ADDRESS MUST BE WETH FOR SWAPS FROM ETHER");  // TODO - get from pair
            require(msg.value >= inputAmount, "LIMITORDERS: INSUFFICIENT TX VALUE FOR ORDER");
            depositAndTransferWETH(msg.sender, inputAmount);
        } else {
            require(
                IERC20(getInputToken(selector, pair)).balanceOf(msg.sender) >= inputAmount,
                "LIMITORDERS: INSUFFICIENT TOKEN BALANCE FOR USER"
            );
        }

        _createOrder(
            msg.sender,
            selector,
            pair,
            inputAmount,
            minOutputAmount,
            deadline
        );

        //_createJob(msg.sender, _nextOrderID[msg.sender], _deadline[msg.sender][_orderCount[msg.sender]]); // TODO - update this (oracle)
    }


    /*
     *  @dev viewOrder (READ OP)
     *
     *  @orderNum - must be lower than current orderCount for user from getActiveOrderCount()
     *
    */
    function viewOrder(uint256 orderNum) public view returns (
        uint8 selector,
        address pair,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline,
        bool isOrderActive
    ) {
        return _viewOrder(msg.sender, orderNum);
    }

    /*
     *  @dev getOrderCount (READ OP)
    */
    function getOrderCount() public view returns (uint) {
        return getActiveOrderCount(msg.sender);
    }

    /*
     *  @dev updateOrder (UPDATE OP)
     *
     *  @dev update function to use for modifying amounts and deadline
     *
    */
    function updateOrder(
        uint orderNum,
        uint inputAmount,
        uint minOutputAmount,
        uint deadline
    ) external payable {

        require(deadline <= block.timestamp + MAX_DEADLINE, "LIMITORDERS: DEADLINE TOO LONG. MAX 30 DAYS");
        require(deadline > block.timestamp, "LIMITORDERS: DEADLINE IN THE PAST");

        uint8 selector;
        address pair;
        uint previousInputAmount;
        (selector, pair, previousInputAmount, , , ) = _viewOrder(
            msg.sender,
            orderNum
        );

        if(inputAmount > previousInputAmount) {
            if (selector < 112)
            {
                require(
                    msg.value >= (inputAmount.sub(previousInputAmount)),
                    "LIMITORDERS: INSUFFICIENT TX VALUE FOR UPDATING ORDER"
                );
                depositAndTransferWETH(msg.sender, (inputAmount.sub(previousInputAmount)));
            } else {
                require(
                    IERC20(getInputToken(selector, pair)).balanceOf(msg.sender) >= inputAmount,
                    "LIMITORDERS: INSUFFICIENT TOKEN BALANCE FOR USER"
                );
            }
        }

        _updateOrder(msg.sender, orderNum, inputAmount, minOutputAmount, deadline);
        //_updateJob(userAddress, _orderID[msg.sender][orderNum], block.timestamp + deadline);  // TODO - update this (oracle)
    }

    /*
     *  @dev updateOrderAmounts (UPDATE OP)
     *
     *  @dev update function to use for modifying only the amounts (not changing deadline)
     *
    */
    function updateOrderAmounts(
        uint orderNum,
        uint inputAmount,
        uint minOutputAmount
    ) external payable {

        uint8 selector;
        address pair;
        uint previousInputAmount;
        (selector, pair, previousInputAmount, , , ) = _viewOrder(
            msg.sender,
            orderNum
        );

        if(inputAmount > previousInputAmount) {
            if (selector < 112)
            {
                require(
                    msg.value >= (inputAmount.sub(previousInputAmount)),
                    "LIMITORDERS: INSUFFICIENT TX VALUE FOR UPDATING ORDER"
                );
                depositAndTransferWETH(msg.sender, (inputAmount.sub(previousInputAmount)));
            } else {
                require(
                    IERC20(getInputToken(selector, pair)).balanceOf(msg.sender) >= inputAmount,
                    "LIMITORDERS: INSUFFICIENT TOKEN BALANCE FOR USER"
                );
            }
        }

        _updateOrderAmounts(msg.sender, orderNum, inputAmount, minOutputAmount);
        //_updateJob(userAddress, _orderID[msg.sender][orderNum], 0);  // TODO - update this (oracle)
    }

    /*
     *  @dev updateOrderMinOutputAmount (UPDATE OP)
     *
     *  @dev update function to use for modifying only the minOutputAmount -> implicitly updates trigger level
     *  @dev does not change deadline or input amount
     *
    */
    function updateOrderMinOutputAmount(
        uint orderNum,
        uint minOutputAmount
    ) external payable {

        _updateOrderMinOutputAmount(msg.sender, orderNum, minOutputAmount);
        //_updateJob(userAddress, _orderID[msg.sender][orderNum], 0);  // TODO - update this (oracle)
    }

    /*
     *  @dev updateOrderDeadline (UPDATE OP)
     *
     *  @dev update function to use for only modifying deadline (not changing input / output amounts)
     *
    */
    function updateOrderDeadline(
        uint orderNum,
        uint deadline
    ) external payable {

        require(deadline <= block.timestamp + MAX_DEADLINE, "LIMITORDERS: DEADLINE TOO LONG. MAX 30 DAYS");
        require(deadline > block.timestamp, "LIMITORDERS: DEADLINE IN THE PAST");
        _updateOrderDeadline(msg.sender, orderNum, deadline);
        //_updateJob(userAddress, _orderID[msg.sender][orderNum], deadline);  // TODO - update this (oracle)
    }

    /*
     *  @dev deleteOrder (DELETE OP)
     *
     *  @dev external write function for a user to cancel own order
     *
    */
    function deleteOrder(uint orderNum) external payable {
        _deleteOrderForUser(msg.sender, orderNum);
    }

    function _deleteOrderForUser(address user, uint orderNum) internal
    {
        _deleteOrder(user, orderNum);
        //_removeJob(userAddress, jobIndex);  // TODO - update this (oracle)
    }

    //==================================================================================================================
    //
    //  UTILITY FUNCTIONS
    //
    //==================================================================================================================

    function checkPaymentTokenBalanceForUser(address user) internal view returns (bool) {

        return IERC20(paymentToken).balanceOf(user) >= getPaymentAmount(
            averageGasConsumedPerLiquidation.mul(tx.gasprice)
        );
    }

    function isInputTokenWETH(uint8 selector, address pair) public view returns (bool) {

        return getInputToken(selector, pair) == wethAddress;
    }

    function getInputToken(uint8 selector, address pair) public view returns (address) {

        if(selector % 2 == 1) {
            return IUniswapV2Pair(pair).token0();
        } else {
            return IUniswapV2Pair(pair).token1();
        }
    }

    function getTokenPath(uint8 selector, address pair) public view returns (address[] memory) {
        address[] memory path = new address[](2);
        if(selector % 2 == 1) {
            path[0] = IUniswapV2Pair(pair).token0();
            path[1]  = IUniswapV2Pair(pair).token1();
        } else {
            path[0] = IUniswapV2Pair(pair).token1();
            path[1]  = IUniswapV2Pair(pair).token0();
        }
        return path;
    }

    function depositAndTransferWETH(address user, uint amount) internal {
        WETH.deposit{ value: amount }();
        WETH.transfer(user, amount);
    }

    function transferPaymentToken(address user, address beneficiary, uint gasFees) internal {
        IERC20(paymentToken).transferFrom(user, beneficiary, getPaymentAmount(gasFees));
    }

    function getPaymentAmount(uint gasFees) public view returns (uint) {
        return getPaymentTokenAmount(gasFees).add(getProtocolFeePaymentAmount());
    }

    function getPaymentTokenAmount(uint weiValue) public view returns (uint) {

        address[] memory path = new address[](2);
        path[0] = paymentToken;
        path[1] = wethAddress;
        uint256[] memory amountsIn = router.getAmountsIn(weiValue, path);
        return amountsIn[0];
    }

    function getProtocolFeePaymentAmount() public view returns (uint) {

        if(protocolFeeEnabled) {
            address[] memory path = new address[](2);
            path[0] = paymentToken;
            path[1] = stableToken;
            uint256[] memory amountsIn = router.getAmountsIn(protocolFeeAmount, path);
            return amountsIn[0];
        }
        return 0;
    }

    //==================================================================================================================
    //
    //  LIQUIDATION FUNCTIONS
    //
    //==================================================================================================================

    // CHECK FOR LIQUIDATION

    function checkForLiquidation(address user, uint orderNum) public view returns(bool) {
        //require(orderNum < orderCount[user], "LIMITORDERS: ORDERNUM TOO HIGH");
        require(isActive[user][orderNum], "ORDER MANAGER: ORDER NOT ACTIVE");
        uint256[] memory amountsOut = router.getAmountsOut(
            orders[user][orderNum].inputAmount,
            getTokenPath(
                orders[user][orderNum].selector,
                orders[user][orderNum].pair
            )
        );
        return amountsOut[1] >= orders[user][orderNum].minOutputAmount;
    }

    // LIQUIDATE

    function liquidate(address user, uint orderNum)
        external
        payable
        onlyOracle
        refundGas(user, msg.sender)
    {

        IERC20(getInputToken(orders[user][orderNum].selector, orders[user][orderNum].pair)).transferFrom(
            user,
            swapRouterAddress,
            orders[user][orderNum].inputAmount
        );
        swapRouter.swap(
            orders[user][orderNum].selector,
            orders[user][orderNum].pair,
            orders[user][orderNum].inputAmount,
            orders[user][orderNum].minOutputAmount,
            user,
            orders[user][orderNum].deadline
        );
        _deleteOrderForUser(user, orderNum);
    }
}