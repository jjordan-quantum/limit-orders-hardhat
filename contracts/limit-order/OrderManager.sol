pragma solidity ^0.6.6;

import '../uniswap-periphery/libraries/SafeMath.sol';
import './interfaces/IOrderManager.sol';

contract OrderManager is IOrderManager {
    using SafeMath for uint;

    mapping(address => mapping(uint256 => Order)) orders;
    mapping(address => uint256) orderCount;

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

    function lockOrderCreation() external payable override onlyOwner() {
        locked = true;
    }

    function unlockOrderCreation() external payable override onlyOwner() {
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
        uint8 selector,
        address pair,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    ) external payable override onlyOwner lock {
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

    function viewOrder(address user, uint256 orderNum) public view override returns (
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

    function removeOrder(address user, uint256 orderNum) external payable override onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum] = orders[user][orderCount[user].sub(1)];
        orderCount[user] = orderCount[user].sub(1);
        // TODO - emit event
    }

    function modifyOrder(
        address user,
        uint256 orderNum,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    ) external payable override {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        //require(deadline <= MAX_DEADLINE, "ORDER MANAGER: DEADLINE TOO LONG. MAX 30 DAYS");
        orders[user][orderNum].inputAmount = inputAmount;
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        if(locked) {
            require(deadline == 0, "ORDER MANAGER: ORDER EXPIRY MODIFICATION LOCKED");
        } else if(deadline != 0) {
            orders[user][orderNum].deadline = deadline; 
        }
        // TODO - emit event
    }

    function modifyOrderInputAmount(address user, uint256 orderNum, uint256 inputAmount) external payable override onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum].inputAmount = inputAmount;
        // TODO - emit event
    }

    function modifyOrderMinOutputAmount(address user, uint256 orderNum, uint256 minOutputAmount) external payable override onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        // TODO - emit event
    }

    function modifyOrderAmounts(
        address user, 
        uint256 orderNum, 
        uint256 inputAmount, 
        uint256 minOutputAmount
    ) external payable override onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        orders[user][orderNum].inputAmount = inputAmount;
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        // TODO - emit event
    }

    function modifyOrderDeadline(address user, uint256 orderNum, uint256 deadline) external payable override onlyOwner {
        require(orderNum < orderCount[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        require(!locked, "ORDER MANAGER: ORDER EXPIRY MODIFICATION LOCKED");
        require(deadline != 0, "ORDER MANAGER: NO DEADLINE PROVIDED");
        orders[user][orderNum].deadline = deadline;
        // TODO - emit event
    }

    function getActiveOrderCount(address user) public view override returns(uint256) {
        return orderCount[user];
    }

}