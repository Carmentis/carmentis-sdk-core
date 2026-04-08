import {SchemaSerializer, SchemaUnserializer} from "../../../data/schemaSerializer";
import {TYPE_BINARY} from "../../../constants/data";

type MlKemCiphertextType = {
    encryptedSharedSecret: Uint8Array,
    encryptedMessage: Uint8Array
}

export class MlKemCiphertextEncoder {

    private static schema = {

        label: "PKE_ML_KEM_CIPHERTEXT",
        definition: [
            {
                name: "encryptedSharedSecret",
                type: TYPE_BINARY
            },
            {
                name: "encryptedMessage",
                type: TYPE_BINARY
            }
        ],
    }

    private serializer = new SchemaSerializer<MlKemCiphertextType>(MlKemCiphertextEncoder.schema)
    private deserializer = new SchemaUnserializer<MlKemCiphertextType>(MlKemCiphertextEncoder.schema)

    encode(encryptedSharedSecret: Uint8Array, encryptedMessage: Uint8Array): Uint8Array {
        return this.serializer.serialize({encryptedSharedSecret, encryptedMessage});
    }

    decode(ciphertext: Uint8Array) : MlKemCiphertextType {
        return this.deserializer.unserialize(ciphertext);
    }
}