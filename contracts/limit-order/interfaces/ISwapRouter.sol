pragma solidity ^0.6.6;

interface ISwapRouter {

    function swap(
        uint8 selector,
        address pair,
        uint inputAmount,
        uint minOutputAmount,
        address user,
        uint deadline
    ) external payable;
}