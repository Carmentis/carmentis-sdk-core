import {SCHEMAS} from "../constants/constants";
import {SchemaSerializer, SchemaUnserializer} from "./schemaSerializer";

export class MessageSerializer<T = any> {
  collection: any;
  /**
    Constructor
    @param {Array} collection - Message collection
  */
  constructor(collection: SCHEMAS.Schema[]) {
    this.collection = collection;
  }

  /**
    Serializes the given message.
    @param {number} type - Message type
    @param {object} object - The message object to be serialized
  */
  serialize(type: number, object: T) {
    const schema = this.collection[type];
    const serializer = new SchemaSerializer(schema);
    const data = serializer.serialize(object);

    return new Uint8Array([ type, ...data ]);
  }
}

export class MessageUnserializer<T = object> {
  collection: any;
  /**
    Constructor
    @param {Array} collection - Message collection
  */
  constructor(collection: SCHEMAS.Schema[]) {
    this.collection = collection;
  }

  /**
    Unserializes the given message byte stream.
    @param {Uint8Array} stream - The serialized byte stream
  */
  unserialize(stream: Uint8Array) {
    const type = stream[0];
    const schema = this.collection[type]; // TODO: check if type is in collections (otherwise raise an exception)
    if (!schema) {
      throw new Error(`Unknown message type ${type}: I do not know how to unserialize this message.`);
    }
    const unserializer = new SchemaUnserializer(schema);
    const object = unserializer.unserialize(stream.slice(1));

    return { type, object: object as T };
  }
}
