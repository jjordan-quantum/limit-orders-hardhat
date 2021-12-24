pragma solidity ^0.6.6;

import '../uniswap-periphery/libraries/SafeMath.sol';

contract Orders {
    using SafeMath for uint;

    struct Order {
        address router;
        uint8 selector;
        address inputToken;
        address outputToken;
        uint256 inputAmount;
        uint256 triggerOutputAmount;
        uint256 minOutputAmount;
        address recipient;
        uint256 deadline;
        uint256 orderID;
    }

    mapping(address => mapping(uint256 => Order)) orders;
    mapping(address => uint256) orderCount;
    mapping(address => uint256) nextOrderID;

    address public owner;
    bool ownerSetOnce;
    bool public locked;

    modifier onlyOwner() {
        require(msg.sender == owner, "ORDER MANAGER: ONLY CALLABLE BY OWNER");
        _;
    }

    modifier lock() {
        require(!locked, "ORDER MANAGER: ORDER CREATION LOCKED");
        _;
    }

    constructor() public {
        owner = msg.sender;
        ownerSetOnce = false;
        locked = false;
    }

    function lockOrderCreation() external payable onlyOwner() {
        locked = true;
    }

    function unlockOrderCreation() external payable onlyOwner() {
        locked = false;
    }

    function transferOwnership(address newOwner) external payable onlyOwner {
        require(!ownerSetOnce, "ORDER MANAGER: OWNERSHIP ALREADY TRANSFERRED");
        owner = newOwner;
        ownerSetOnce = true;
        // TODO - emit event
    }

    function createOrder(
        address user,
        address router,
        uint8 selector,
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 triggerOutputAmount,
        uint256 minOutputAmount,
        address recipient,
        uint256 deadline
    ) external payable onlyOwner lock {
        //require(deadline <= MAX_DEADLINE, "ORDER MANAGER: DEADLINE TOO LONG. MAX 30 DAYS");
        orders[user][orderCount[user]] = Order(
            router,
            selector,
            inputToken,
            outputToken,
            inputAmount,
            triggerOutputAmount,
            minOutputAmount,
            recipient,
            deadline,
            nextOrderID[user]
        );
        nextOrderID[user]++;
        orderCount[user]++;
        // TODO - emit event
    }

    function viewOrder(address user, uint256 orderNum) public view returns (
        address router,
        uint8 selector,
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 triggerOutputAmount,
        uint256 minOutputAmount,
        address recipient,
        uint256 deadline,
        uint256 orderID
    ) {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        router = orders[user][orderNum].router;
        selector = orders[user][orderNum].selector;
        inputToken = orders[user][orderNum].inputToken;
        outputToken = orders[user][orderNum].outputToken;
        inputAmount = orders[user][orderNum].inputAmount;
        triggerOutputAmount = orders[user][orderNum].triggerOutputAmount;
        minOutputAmount = orders[user][orderNum].minOutputAmount;
        recipient = orders[user][orderNum].recipient;
        deadline = orders[user][orderNum].deadline;
        orderID = orders[user][orderNum].orderID;
    }

    function removeOrder(address user, uint256 orderNum) external payable onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum] = orders[user][orderCount[user].sub(1)];
        orderCount[user] = orderCount[user].sub(1);
        // TODO - emit event
    }

    function modifyOrder(
        address user,
        uint256 orderNum,
        uint256 inputAmount,
        uint256 triggerOutputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    ) external payable {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        //require(deadline <= MAX_DEADLINE, "ORDER MANAGER: DEADLINE TOO LONG. MAX 30 DAYS");
        orders[user][orderNum].inputAmount = inputAmount;
        orders[user][orderNum].triggerOutputAmount = triggerOutputAmount;
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        if(locked) {
            require(deadline == 0, "ORDER MANAGER: ORDER EXPIRY MODIFICATION LOCKED");
        } else if(deadline != 0) {
            orders[user][orderNum].deadline = deadline; 
        }
        // TODO - emit event
    }

    function modifyOrderInputAmount(address user, uint256 orderNum, uint256 inputAmount) external payable onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum].inputAmount = inputAmount;
        // TODO - emit event
    }

    function modifyOrderTriggerOutputAmount(address user, uint256 orderNum, uint256 triggerOutputAmount) external payable onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum].triggerOutputAmount = triggerOutputAmount;
        // TODO - emit event
    }

    function modifyOrderMinOutputAmount(address user, uint256 orderNum, uint256 minOutputAmount) external payable onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        // TODO - emit event
    }

    function modifyOrderAmounts(
        address user, 
        uint256 orderNum, 
        uint256 inputAmount, 
        uint256 triggerOutputAmount,
        uint256 minOutputAmount
    ) external payable onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum].inputAmount = inputAmount;
        orders[user][orderNum].triggerOutputAmount = triggerOutputAmount;
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        // TODO - emit event
    }

    function modifyOrderDeadline(address user, uint256 orderNum, uint256 deadline) external payable onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        require(deadline == 0, "ORDER MANAGER: ORDER EXPIRY MODIFICATION LOCKED");
        orders[user][orderNum].deadline = deadline;
        // TODO - emit event
    }

    function getActiveOrderCount(address user) public view returns(uint256) {
        return orderCount[user];
    }

    function getCumulativeOrderCount(address user) public view returns(uint256) {
        return nextOrderID[user];
    }
}