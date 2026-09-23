import {Record} from "../../src/records/Record";
import { describe, it, expect } from 'vitest'

describe('Offchain data', () => {
    it('Testing offchain data', async () => {
        const data = {
            user: {
                nonRgpdField: "AB12345",
                rgpdData: {
                    __offchain_data__: {
                        firstname: "John",
                        lastname: "Doe",
                        age: 22,
                        socialNetworks: {
                            facebook: "https://www.facebook.com/john.doe",
                            x: "https://x.com/john.doe"
                        }
                    }
                }
            }
        };
        const record = Record.fromObject(data);
        console.log(JSON.stringify(record, null, 2));
    })
})
