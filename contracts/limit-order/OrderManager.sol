pragma solidity ^0.6.6;

import '../uniswap-periphery/libraries/SafeMath.sol';
import './interfaces/IOrderManager.sol';

contract OrderManager {
    using SafeMath for uint;

    struct Order {
        uint8 selector; // includes swap function selector plus direction of swap
        address pair;
        uint256 inputAmount;
        uint256 minOutputAmount;
        uint256 deadline;
    }

    event CreateOrder(
        address indexed user,
        uint256 indexed orderNum,
        uint256 indexed deadline
    );

    event UpdateOrder(
        address indexed user,
        uint256 indexed orderNum,
        uint256 indexed deadline
    );

    event DeleteOrder(
        address indexed user,
        uint256 indexed orderNum
    );

    mapping(address => mapping(uint256 => Order)) orders;
    mapping(address => mapping(uint256 => bool)) isActive;
    mapping(address => uint256) orderCount;
    mapping(address => uint256) nextOrderNum;

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
        orders[user][nextOrderNum[user]] = Order(
            selector,
            pair,
            inputAmount,
            minOutputAmount,
            deadline
        );
        // alternative method would be creating an 'active' field in the Orders struct
        isActive[user][nextOrderNum[user]] = true;
        emit CreateOrder(user, nextOrderNum[user], deadline);
        orderCount[user]++;
        nextOrderNum[user]++;
    }

    function _viewOrder(address user, uint256 orderNum) public view returns (
        uint8 selector,
        address pair,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline,
        bool isOrderActive
    ) {
        require(orderNum < nextOrderNum[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        selector = orders[user][orderNum].selector;
        pair = orders[user][orderNum].pair;
        inputAmount = orders[user][orderNum].inputAmount;
        minOutputAmount = orders[user][orderNum].minOutputAmount;
        deadline = orders[user][orderNum].deadline;
        isOrderActive = isActive[user][orderNum];
    }

    function isOrderActive(address user, uint256 orderNum) public view returns (bool) {
        require(orderNum < nextOrderNum[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        return isActive[user][orderNum];
    }

    function _deleteOrder(address user, uint256 orderNum) internal {
        require(isActive[user][orderNum], "ORDER MANAGER: ORDER NOT ACTIVE");
        isActive[user][orderNum] = false;
        orderCount[user] = orderCount[user].sub(1);
        emit DeleteOrder(user, orderNum);
    }

    function _updateOrder(
        address user,
        uint256 orderNum,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    ) internal {
        //require(orderNum < nextOrderNum[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        require(isActive[user][orderNum], "ORDER MANAGER: ORDER NOT ACTIVE");
        //require(deadline <= MAX_DEADLINE, "ORDER MANAGER: DEADLINE TOO LONG. MAX 30 DAYS");
        orders[user][orderNum].inputAmount = inputAmount;
        orders[user][orderNum].minOutputAmount = minOutputAmount;
        if(locked) {
            require(deadline == 0, "ORDER MANAGER: ORDER EXPIRY MODIFICATION LOCKED");
        } else if(deadline != 0) {
            orders[user][orderNum].deadline = deadline;
            emit UpdateOrder(user, orderNum, deadline);
        }
    }

    function _updateOrderInputAmount(address user, uint256 orderNum, uint256 inputAmount) internal {
        //require(orderNum < nextOrderNum[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        require(isActive[user][orderNum], "ORDER MANAGER: ORDER NOT ACTIVE");
        orders[user][orderNum].inputAmount = inputAmount;
    }

    function _updateOrderMinOutputAmount(address user, uint256 orderNum, uint256 minOutputAmount) internal {
        //require(orderNum < nextOrderNum[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        require(isActive[user][orderNum], "ORDER MANAGER: ORDER NOT ACTIVE");
        orders[user][orderNum].minOutputAmount = minOutputAmount;
    }

    function _updateOrderAmounts(
        address user, 
        uint256 orderNum, 
        uint256 inputAmount, 
        uint256 minOutputAmount
    ) internal{
        //require(orderNum < nextOrderNum[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        require(isActive[user][orderNum], "ORDER MANAGER: ORDER NOT ACTIVE");
        orders[user][orderNum].inputAmount = inputAmount;
        orders[user][orderNum].minOutputAmount = minOutputAmount;
    }

    function _updateOrderDeadline(address user, uint256 orderNum, uint256 deadline) internal{
        //require(orderNum < nextOrderNum[user], "ORDER MANAGER: ORDERNUM TOO HIGH");
        require(isActive[user][orderNum], "ORDER MANAGER: ORDER NOT ACTIVE");
        require(!locked, "ORDER MANAGER: ORDER EXPIRY MODIFICATION LOCKED");
        require(deadline != 0, "ORDER MANAGER: NO DEADLINE PROVIDED");
        orders[user][orderNum].deadline = deadline;
        emit UpdateOrder(user, orderNum, deadline);
    }

    function getActiveOrderCount(address user) public view returns(uint256) {
        return orderCount[user];
    }

}