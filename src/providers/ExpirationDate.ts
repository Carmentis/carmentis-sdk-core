import {Optional} from "../entities/Optional";

export class ExpirationDate {
    private expirationDate: Optional<Date>;
    private endless: boolean;

    private constructor(expirationDate: Optional<Date>, isEndless: boolean) {
        this.expirationDate = expirationDate;
        this.endless = isEndless;
    }


    static endless() {
        return new ExpirationDate(Optional.none(), true);
    }

    static of(expirationDate: Date) {
        return new ExpirationDate(Optional.of(expirationDate), false);
    }
    
    
    static fromDurationInDays(durationInDays: number) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + durationInDays);
        return ExpirationDate.of(expirationDate);
    }

    isEndless() {
        return this.endless;
    }

    getExpirationDate() {
        return this.expirationDate.unwrap();
    }
}