exports.Queries = (function() {
    // container for specific queries to updater db

    const { Postgres } = require('./postgres')

    const getAllActiveOrdersInternal = async () => {

        const text = ` SELECT   user_address,
                                order_num,
                                selector,
                                pair,
                                input_amount,
                                min_output_amount,
                                deadline,
                                status
                       FROM limit_order_job
                       WHERE status != 0;`
        return await Postgres.poolQuery(text, []);
    }

    const writeNewOrderInternal = async (
        user,
        orderNum,
        selector,
        pair,
        inputAmount,
        minOutputAmount,
        deadline
    ) => {
        const text = ` INSERT INTO  limit_order_job (
            user_address,
            order_num,
            selector,
            pair,
            input_amount,
            min_output_amount,
            deadline,
            status
        ) VALUES ( $1, $2, $3, $4, $5, $6, $7, $8 );    `;
        await Postgres.poolQuery(text, [
            user,
            orderNum,
            selector,
            pair,
            inputAmount,
            minOutputAmount,
            deadline,
            1
        ]);
    }

    const updateOrderAmountsInternal = async (
        user,
        orderNum,
        newInputAmount,
        newMinOutputAmount
    ) => {
        const text = ` UPDATE  limit_order_job
                        SET input_amount = $1,
                            min_output_amount = $2
                        WHERE user_address = $3
                        AND order_num = $4; `
        await Postgres.poolQuery(text, [
            newInputAmount,
            newMinOutputAmount,
            user,
            orderNum
        ]);
    }

    const updateOrderMinOutputAmountInternal = async (
        user,
        orderNum,
        newMinOutputAmount
    ) => {
        const text = ` UPDATE  limit_order_job
                        SET min_output_amount = $1
                        WHERE user_address = $2
                        AND order_num = $3; `
        await Postgres.poolQuery(text, [
            newMinOutputAmount,
            user,
            orderNum
        ]);
    }

    const updateOrderDeadlineInternal = async (
        user,
        orderNum,
        newDeadline
    ) => {
        const text = ` UPDATE  limit_order_job
                        SET deadline = $1
                        WHERE user_address = $2
                        AND order_num = $3; `
        await Postgres.poolQuery(text, [
            newDeadline,
            user,
            orderNum
        ]);
    }

    const updateOrderInternal = async (
        user,
        orderNum,
        newInputAmount,
        newMinOutputAmount,
        newDeadline
    ) => {
        const text = ` UPDATE  limit_order_job
                        SET input_amount = $1,
                            min_output_amount = $2,
                            deadline = $3
                        WHERE user_address = $4
                        AND order_num = $5; `
        await Postgres.poolQuery(text, [
            newInputAmount,
            newMinOutputAmount,
            newDeadline,
            user,
            orderNum
        ]);
    }

    const updateOrderStatusInternal = async (
        user,
        orderNum,
        newStatus
    ) => {
        const text = ` UPDATE  limit_order_job
                        SET status = $1
                        WHERE user_address = $2
                        AND order_num = $3; `
        await Postgres.poolQuery(text, [
            newStatus,
            user,
            orderNum
        ]);
    }

    /*
     *  order:
     *
     *
     *  user                -   user's account address
     *  order_num           -   order number - will only exist for orders that have not been deleted
     *  selector            -   number representing function number and swap direction
     *  pair                -   pair address for swap
     *  input_token         -   derived from pair address and selector
     *  output_token        -   derived from pair address and selector
     *  input_amount        -   amount of input token for swap
     *  min_output_amount   -   'amountOutMin' value for swap (implicit slippage)
     *  deadline            -   UNIX timestamp after which transaction will revert
     *  status: {
     *      0: deleted, -> will not show up in order count
     *      1: checking,
     *      2: removed_by_oracle, -> will show up in order count (must be accounted for)
     *          reasons:
     *              - expired
     *              - simulation failed with revert reason
     *              - liquidation failed with revert reason
     *              - liquidation tx encountered an error
     *      3: simulating_tx,
     *      4: liquidation_sent
     *  }
     *  message - expired, or revert reasons encountered during simulation, or error/revert message received from liquidation
     *
     */

    return {
        getAllActiveOrders: getAllActiveOrdersInternal,
        writeNewOrder: writeNewOrderInternal,
        updateOrderAmounts: updateOrderAmountsInternal,
        updateOrderMinOutputAmount: updateOrderMinOutputAmountInternal,
        updateOrderDeadline: updateOrderDeadlineInternal,
        updateOrder: updateOrderInternal,
        updateOrderStatus: updateOrderStatusInternal,
    }
})();
