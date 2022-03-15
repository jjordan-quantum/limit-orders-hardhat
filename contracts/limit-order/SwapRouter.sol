pragma solidity ^0.6.6;

import './interfaces/ISwapRouter.sol';
import '../uniswap-periphery/interfaces/IWETH.sol';
import "../uniswap-periphery/interfaces/IERC20.sol";
import "../uniswap-periphery/interfaces/IUniswapV2Pair.sol";
import "../uniswap-periphery/interfaces/IUniswapV2Router02.sol";

contract SwapRouter is ISwapRouter {

    address public routerAddress;
    IUniswapV2Router02 router;
    bool public routerSet;

    address public wethAddress;
    IWETH WETH;

    address limitOrders;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "SWAPROUTER: ONLY CALLABLE BY OWNER");
        _;
    }

    modifier onlyLimitOrders() {
        require(msg.sender == limitOrders, "SWAPROUTER: ONLY CALLABLE BY LIMITORDERS");
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function setLimitOrderContract(address _limitOrders_) external payable onlyOwner {
        limitOrders = _limitOrders_;
    }

    function setRouter(address _routerAddress_) external payable onlyOwner {

        require(!routerSet, "LIMITORDERS: ROUTER ALREADY SET");
        routerAddress = _routerAddress_;
        router = IUniswapV2Router02(routerAddress);
        wethAddress = router.WETH();
        WETH = IWETH(wethAddress);
        routerSet = true;
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

    function swap(
        uint8 selector,
        address pair,
        uint inputAmount,
        uint minOutputAmount,
        address user,
        uint deadline
    ) external payable override onlyLimitOrders {

        IERC20 token = IERC20(getInputToken(selector, pair));   // NEED
        token.approve(routerAddress, inputAmount);

        // determine function from select
        if(selector < 110) {
            // 10 - swapExactETHForTokens (swapExactTokensForTokens - from WETH)
            router.swapExactTokensForTokens(
                inputAmount,
                minOutputAmount,
                getTokenPath(selector, pair),
                user,
                deadline
            );
        } else if(selector < 120) {
            // 11 - swapExactETHForTokensSupportingFeeOnTransferTokens (swapExactTokensForTokensSupportingFeeOnTransferTokens - from WETH)
            router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                inputAmount,
                minOutputAmount,
                getTokenPath(selector, pair),
                user,
                deadline
            );
        } else if(selector < 130) {
            // 12 - swapExactTokensForETH
            router.swapExactTokensForETH(
                inputAmount,
                minOutputAmount,
                getTokenPath(selector, pair),
                user,
                deadline
            );
        } else if(selector < 140) {
            // 13 - swapExactTokensForETHSupportingFeeOnTransferTokens
            router.swapExactTokensForETHSupportingFeeOnTransferTokens(
                inputAmount,
                minOutputAmount,
                getTokenPath(selector, pair),
                user,
                deadline
            );
        } else if(selector < 150) {
            // 14 - swapExactTokensForTokens
            router.swapExactTokensForTokens(

                inputAmount,
                minOutputAmount,
                getTokenPath(selector, pair),
                user,
                deadline
            );
        } else {
            // 15 - swapExactTokensForTokensSupportingFeeOnTransferTokens
            router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                inputAmount,
                minOutputAmount,
                getTokenPath(selector, pair),
                user,
                deadline
            );
        }
    }
}