import {AccountHistoryEntry} from "./valibot/account/Account";
import {Height} from "./Height";
import {Hash} from "../entities/Hash";
import {CMTSToken} from "../economics/currencies/token";
import {
    BK_EARNED_BLOCK_FEES,
    BK_EARNED_TX_FEES,
    BK_PAID_BLOCK_FEES,
    BK_PAID_TX_FEES,
    BK_PLUS,
    BK_PURCHASE,
    BK_RECEIVED_ISSUANCE,
    BK_RECEIVED_PAYMENT,
    BK_SALE,
    BK_SENT_ISSUANCE,
    BK_SENT_PAYMENT
} from "../constants/economics";

export class Transaction {
    constructor(
       private readonly transaction: AccountHistoryEntry
    ) {}

    public getHeight(): Height {
        return this.transaction.height;
    }

    public getPreviousHistoryHash(): Hash {
        return Hash.from(this.transaction.previousHistoryHash);
    }

    public getTimestamp(): number {
        return this.transaction.timestamp;
    }
    
    public transferredAt(): Date {
        return new Date(this.transaction.timestamp * 1000);
    }

    /**
     * Retrieves the linked account associated with the transaction.
     *
     * @return {Hash} The hash object representing the linked account.
     */
    public getLinkedAccount(): Hash {
        return Hash.from(this.transaction.linkedAccount);
    }

    public getAmount(): CMTSToken {
        const multiplier = this.isPositive() ? 1 : -1;
        return CMTSToken.createAtomic(this.transaction.amount * multiplier);
    }

    public getChainReference(): Hash {
        return Hash.from(this.transaction.chainReference);
    }

    /**
     * Determines if the transaction is for a positive (or zero) amount.
     *
     * @return {boolean} True if the transaction amount is positive (or zero), otherwise false.
     */
    public isPositive(): boolean {
        return !!(this.transaction.type & BK_PLUS);
    }

    /**
     * Determines if the transaction is for a negative amount.
     *
     * @return {boolean} True if the transaction amount is negative, otherwise false.
     */
    public isNegative(): boolean {
        return !this.isPositive();
    }

    /**
     * Determines whether the transaction is categorized as earned fees.
     *
     * @return {boolean} Returns true if the transaction is earned fees, otherwise false.
     */
    public isEarnedFees(): boolean {
        return this.isEarnedBlockFees() || this.isEarnedTxFees();
    }

    public isEarnedBlockFees(): boolean {
        return this.transaction.type === BK_EARNED_BLOCK_FEES;
    }

    public isEarnedTxFees(): boolean {
        return this.transaction.type === BK_EARNED_TX_FEES;
    }

    public isPaidBlockFees(): boolean {
        return this.transaction.type === BK_PAID_BLOCK_FEES;
    }

    public isPaidTxFees(): boolean {
        return this.transaction.type === BK_PAID_TX_FEES;
    }

    /**
     * Determines whether the transaction is categorized as issuance receiving.
     *
     * Note: This method is only applicable to the genesis account receiving the initial issuance.
     *
     * @return {boolean} Returns true if the transaction is earned fees, otherwise false.
     */
    public isReceivedIssuance(): boolean {
        return this.transaction.type === BK_RECEIVED_ISSUANCE
    }


    public isSentIssuance(): boolean {
        return this.transaction.type === BK_SENT_ISSUANCE
    }

    /**
     * Determines whether the transaction is categorized as a sale.
     *
     * Note: A transaction categorized as a sale is only applicable to the genesis account sending tokens to an account.
     *
     * @return {boolean} Returns true if the transaction is sale, otherwise false.
     */
    public isSale(): boolean {
        return this.transaction.type == BK_SALE
    }

    /**
     * Determines whether the transaction is categorized as a sent payment.
     *
     * Payments occur between two accounts (distinct from the genesis account).
     *
     * @return {boolean} Returns true if the transaction is a sent payment, otherwise false.
     */
    public isSentPayment(): boolean {
        return this.transaction.type == BK_SENT_PAYMENT;
    }

    public isPaidFees(): boolean {
        return this.isPaidBlockFees() || this.isPaidTxFees();
    }

    /**
     * Determines whether the transaction is categorized as a purchase.
     *
     * Note: A transaction categorized as a purchase is only applicable to an account receiving tokens from the genesis account.
     *
     * @return {boolean} Returns true if the transaction is purchase, otherwise false.
     */
    public isPurchase(): boolean {
        return this.transaction.type == BK_PURCHASE
    }

    /**
     * Determines whether the transaction is categorized as a received payment.
     *
     * Payments occur between two accounts (distinct from the genesis account).
     *
     * @return {boolean} Returns true if the transaction is a received payment, otherwise false.
     */
    public isReceivedPayment(): boolean {
        return this.transaction.type == BK_RECEIVED_PAYMENT;
    }
}