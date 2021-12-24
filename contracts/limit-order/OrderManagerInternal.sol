pragma solidity ^0.6.6;

import '../uniswap-periphery/libraries/SafeMath.sol';

contract OrderManagerInternal {
    using SafeMath for uint;

    struct Order {
        uint8 selector; // includes swap function selector plus direction of swap
        address pair;
        uint256 inputAmount;
        uint256 minOutputAmount;
        uint256 deadline;
    }

    mapping(address => mapping(uint256 => Order)) orders;
    mapping(address => uint256) orderCount;

    address public owner;
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
        locked = false;
    }

    function lockOrderCreation() external payable onlyOwner() {
        locked = true;
    }

    function unlockOrderCreation() external payable onlyOwner() {
        locked = false;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function _createOrder(
        address user,
        uint8 selector,
        address pair,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    ) internal lock {
        //require(deadline <= MAX_DEADLINE, "ORDER MANAGER: DEADLINE TOO LONG. MAX 30 DAYS");
        orders[user][orderCount[user]] = Order(
            selector,
            pair,
            inputAmount,
            minOutputAmount,
            deadline
        );
        orderCount[user]++;
        // TODO - emit event
    }

    function _viewOrder(address user, uint256 orderNum) internal view returns (
        uint8 selector,
        address pair,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    ) {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        selector = orders[user][orderNum].selector;
        pair = orders[user][orderNum].pair;
        inputAmount = orders[user][orderNum].inputAmount;
        minOutputAmount = orders[user][orderNum].minOutputAmount;
        deadline = orders[user][orderNum].deadline;
    }

    function _deleteOrder(address user, uint256 orderNum) internal {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum] = orders[user][orderCount[user].sub(1)];
        orderCount[user] = orderCount[user].sub(1);
        // TODO - emit event
    }

    function _updateOrder(
        address user,
        uint256 orderNum,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    ) internal {
        //require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH"); -> should be checked in calling scope
        //require(deadline <= MAX_DEADLINE, "ORDER MANAGER: DEADLINE TOO LONG. MAX 30 DAYS"); -> should be checked in calling scope
        orders[user][orderNum].inputAmount = inputAmount;
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        if(locked) {
            require(deadline == 0, "ORDER MANAGER: ORDER EXPIRY MODIFICATION LOCKED");
        } else if(deadline != 0) {
            orders[user][orderNum].deadline = deadline; 
        }
        // TODO - emit event
    }

    function _updateOrderAmounts(
        address user,
        uint256 orderNum,
        uint256 inputAmount,
        uint256 minOutputAmount
    ) internal {
        //require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH"); -> should be checked in calling scope
        orders[user][orderNum].inputAmount = inputAmount;
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        // TODO - emit event
    }

    function _updateOrderMinOutputAmount(address user, uint256 orderNum, uint256 minOutputAmount) internal {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        // TODO - emit event
    }

    function _updateOrderDeadline(address user, uint256 orderNum, uint256 deadline) internal {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        require(!locked, "ORDER MANAGER: ORDER EXPIRY MODIFICATION LOCKED");
        orders[user][orderNum].deadline = deadline;
        // TODO - emit event
    }

    function getActiveOrderCount(address user) public view returns(uint256) {
        return orderCount[user];
    }

}