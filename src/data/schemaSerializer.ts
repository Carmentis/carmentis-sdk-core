import {DATA, SCHEMAS} from "../constants/constants";
import {ReadStream, WriteStream} from "./byteStreams";
import {TypeChecker, TypeManager} from "./types";
import {Utils} from "../utils/utils";
import {CarmentisError, SerializationError} from "../errors/carmentis-error";

export class SchemaSerializer<T = any> {
    schema: SCHEMAS.Schema;
    stream: any;

    /**
     Constructor
     */
    constructor(schema: SCHEMAS.Schema) {
        this.schema = schema;
    }

    /**
     Serializes the given object.
     */
    serialize(object: T): Uint8Array {
        // we raise a technical exception if the schema is not defined, mostly due to a distinct, incompatible
        // SDK version
        if (this.schema === undefined) throw new SerializationError("Provided schema is undefined: this should not happen")


        this.stream = new WriteStream;
        this.serializeObject(this.schema.definition, object);

        return this.stream.getByteStream();
    }

    /**
     Serializes any sub-object of the full structure.
     */
    private serializeObject(schemaDefinition: SCHEMAS.SchemaItem[], object: any, path = "") {
        for (const schemaItem of schemaDefinition) {
            const fieldPath = path + (path && ".") + schemaItem.name;
            const value = object[schemaItem.name];

            if (value === undefined) {
                throw new SerializationError(`field '${fieldPath}' is missing`);
            }

            if (schemaItem.type & DATA.TYPE_ARRAY_OF) {
                if (TypeManager.getType(value) != DATA.TYPE_ARRAY) {
                    throw new SerializationError(`'${fieldPath}' is not an array`);
                }

                if (schemaItem.size !== undefined) {
                    if (value.length != schemaItem.size) {
                        throw new SerializationError(`invalid size for '${fieldPath}' (expecting ${schemaItem.size} entries, got ${value.length})`);
                    }
                } else {
                    this.stream.writeVarUint(value.length);
                }

                for (const index in value) {
                    this.serializeItem(schemaItem, value[index], fieldPath + `[${index}]`);
                }
            } else {
                this.serializeItem(schemaItem, value, fieldPath);
            }
        }
    }

    /**
     Serializes an item.
     */
    serializeItem(schemaItem: SCHEMAS.SchemaItem, value: any, fieldPath: any) {
        const mainType = schemaItem.type & DATA.TYPE_MAIN;

        if (mainType == DATA.TYPE_OBJECT) {
            if (TypeManager.getType(value) != DATA.TYPE_OBJECT) {
                throw new SerializationError(`'${fieldPath}' is not an object`);
            }
            if (schemaItem.definition) {
                this.serializeObject(schemaItem.definition, value, fieldPath);
            } else if (schemaItem.schema) {
                this.serializeObject(schemaItem.schema.definition, value, fieldPath);
            } else {
                throw new SerializationError(`missing definition in schema`);
            }
        } else {
            const typeChecker = new TypeChecker(schemaItem, value);

            try {
                typeChecker.check();
            } catch (error) {
                throw new SerializationError(`Error on field '${fieldPath}': ${error}`);
            }

            this.stream.writeSchemaValue(mainType, value, schemaItem.size);
        }
    }
}

export class SchemaUnserializer<T = object> {
    schema: any;
    stream: any;

    /**
     Constructor
     @param {Array} schema - Top-level schema
     */
    constructor(schema: SCHEMAS.Schema) {
        this.schema = schema;
    }

    /**
     Unserializes the given byte stream.
     */
    unserialize(stream: Uint8Array): T {
        this.stream = new ReadStream(stream);

        const object = this.unserializeObject(this.schema.definition);
        const pointer = this.stream.getPointer();
        const size = stream.length;

        if (pointer != size) {
            console.error(Utils.binaryToHexa(stream));
            throw new CarmentisError(`Invalid stream length (decoded ${pointer} bytes, actual length is ${size} bytes)`);
        }

        return object as T;
    }

    /**
     Unserializes any sub-object of the full structure.
     */
    protected unserializeObject(schemaDefinition: SCHEMAS.SchemaItem[]): object {
        const object = {};

        for (const schemaItem of schemaDefinition) {
            let item;

            if (schemaItem.type & DATA.TYPE_ARRAY_OF) {
                let size = schemaItem.size !== undefined ? schemaItem.size : this.stream.readVarUint();

                item = [];

                while (size--) {
                    item.push(this.unserializeItem(schemaItem));
                }
            } else {
                item = this.unserializeItem(schemaItem);
            }

            // @ts-ignore
            object[schemaItem.name] = item;
        }
        return object;
    }

    /**
     Unserializes an item.
     @param {object} schemaItem
     */
    unserializeItem(schemaItem: SCHEMAS.SchemaItem) {
        const mainType = schemaItem.type & DATA.TYPE_MAIN;

        if (mainType == DATA.TYPE_OBJECT) {
            if (schemaItem.definition) {
                return this.unserializeObject(schemaItem.definition);
            }
            if (schemaItem.schema) {
                return this.unserializeObject(schemaItem.schema.definition);
            }
            throw `missing definition in schema`;
        }

        return this.stream.readSchemaValue(mainType, schemaItem.size)
    }
}
