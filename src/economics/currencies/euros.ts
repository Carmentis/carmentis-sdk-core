import {Currency} from "./currency";

export class Euros implements Currency {
    private constructor(private amount: number) {

    }

    static create(amount: number) {
        return new Euros(amount);
    }

    getAmount(): number {
        return this.amount;
    }

    toString() {
        return `${this.amount} €`
    }
}