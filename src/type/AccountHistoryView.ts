import {AccountHistoryEntry} from "./valibot/account/Account";
import {IllegalParameterError} from "../errors/carmentis-error";
import {Transaction} from "./Transaction";
import {Height} from "./Height";

export class AccountHistoryView {
    private transactionByHeight: Map<number, AccountHistoryEntry>;

    constructor() {
        this.transactionByHeight = new Map();
    }

    setTransactionAtHeight(height: number, transaction: AccountHistoryEntry) {
        this.transactionByHeight.set(height, transaction);
    }

    /**
     * Determines whether there are any transactions available.
     *
     * @return {boolean} Returns true if transactions are present, otherwise false.
     */
    containsTransactions(): boolean {
        return this.transactionByHeight.size > 0;
    }

    /**
     * Retrieves the heights of all transactions currently stored.
     *
     * @return {number[]} An array of transaction heights, derived from the keys of the transaction mapping.
     */
    getTransactionHeights(): number[] {
        return Array.from(this.transactionByHeight.keys());
    }

    /**
     * Retrieves all the transactions stored in the view.
     *
     * @return {Transaction[]} An array containing all the Transaction objects.
     */
    getAllTransactions(): Transaction[] {
        return Array.from(this.transactionByHeight.values()).map(transaction => new Transaction(transaction));
    }

    /**
     * Retrieves the total number of transactions.
     *
     * @return {number} The count of transactions.
     */
    getNumberOfTransactions(): number { return this.transactionByHeight.size }

    /**
     * Checks if there is a transaction at the specified block height.
     *
     * @param {number} height - The block height to check for a transaction.
     * @return {boolean} True if a transaction exists at the specified height, false otherwise.
     */
    containsTransactionAtHeight(height: number): boolean { return this.transactionByHeight.has(height) }

    getTransactionAtHeight(height: Height): Transaction {
        const transaction = this.transactionByHeight.get(height);
        if (transaction === undefined) {
            throw new IllegalParameterError(`No transaction found at height ${height}`);
        }
        return new Transaction(transaction);
    }



}