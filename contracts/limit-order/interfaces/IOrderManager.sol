pragma solidity ^0.6.6;


interface IOrderManager {

    struct Order {
        uint8 selector; // includes swap function selector plus direction of swap
        address pair;
        uint256 inputAmount;
        uint256 minOutputAmount;
        uint256 deadline;
    }

    function lockOrderCreation() external payable;
    function unlockOrderCreation() external payable;

    function createOrder(
        address user,
        uint8 selector,
        address pair,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    ) external payable;

    function viewOrder(address user, uint256 orderNum) external view returns (
        uint8 selector,
        address pair,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    );

    function removeOrder(address user, uint256 orderNum) external payable;

    function modifyOrder(
        address user,
        uint256 orderNum,
        uint256 inputAmount,
        uint256 minOutputAmount,
        uint256 deadline
    ) external payable;

    function modifyOrderInputAmount(address user, uint256 orderNum, uint256 inputAmount) external payable;

    function modifyOrderMinOutputAmount(address user, uint256 orderNum, uint256 minOutputAmount) external payable;

    function modifyOrderAmounts(
        address user, 
        uint256 orderNum, 
        uint256 inputAmount, 
        uint256 minOutputAmount
    ) external payable;

    function modifyOrderDeadline(address user, uint256 orderNum, uint256 deadline) external payable;

    function getActiveOrderCount(address user) external view returns(uint256);

}