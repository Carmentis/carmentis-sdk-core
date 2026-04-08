import {DATA, SCHEMAS} from "../constants/constants";
import {TypeChecker, TypeManager} from "./types";
import {CarmentisError} from "../errors/carmentis-error";

export class SchemaValidator {
  schema: SCHEMAS.Schema;
  /**
    Constructor
    @param {Array} schema - Top-level schema
  */
  constructor(schema: SCHEMAS.Schema) {
    this.schema = schema;
  }

  /**
    Checks whether the given object matches the schema.
    @param {object} object - The object to be tested.
  */
  validate(object: any) {
      // we raise a technical exception if the schema is not defined, mostly due to a distinct, incompatible
      // SDK version
      if (this.schema === undefined) throw new CarmentisError("Provided schema is undefined: this should not happen")


      this.validateObject(this.schema.definition, object);
  }

  /**
    Validates any sub-object of the full structure.
    @param {Array} schemaDefinition - The (sub)schema of the object.
    @param {object} object - The object to be serialized.
  */
  private validateObject(schemaDefinition: SCHEMAS.SchemaItem[], object: any, path = "") {
    for(const schemaItem of schemaDefinition) {
      const fieldPath = path + (path && ".") + schemaItem.name,
            value = object[schemaItem.name];

      if(value === undefined) {
        if(schemaItem.optional) {
          continue;
        }
        //console.log(`Validation failed: Field ${fieldPath} missing for schema ${schema} in obtained object`, object)
        throw new Error(`field '${fieldPath}' is missing`);
      }

      if(schemaItem.type & DATA.TYPE_ARRAY_OF) {
        if(TypeManager.getType(value) != DATA.TYPE_ARRAY) {
          throw `'${fieldPath}' is not an array`;
        }

        for(const index in value) {
          this.validateItem(schemaItem, value[index], fieldPath + `[${index}]`);
        }
      }
      else {
        this.validateItem(schemaItem, value, fieldPath);
      }
    }
  }

  /**
    Validates an item.
    @param {object} schemaItem - The definition of the item.
    @param {} value - The value of the item.
  */
  private validateItem(schemaItem: SCHEMAS.SchemaItem, value: any, fieldPath: string) {
    const mainType = schemaItem.type & DATA.TYPE_MAIN;

    if(mainType == DATA.TYPE_OBJECT) {
      if(TypeManager.getType(value) != DATA.TYPE_OBJECT) {
        throw `'${fieldPath}' is not an object`;
      }
      if(!schemaItem.unspecifiedSchema) {
        if(!schemaItem.schema) {
          throw `missing definition in schema`;
        }
        this.validateObject(schemaItem.schema.definition, value, fieldPath);
      }
    }
    else {
      const typeChecker = new TypeChecker(schemaItem, value);

      try {
        typeChecker.check();
      }
      catch(error) {
        throw `Error on field '${fieldPath}': ${error}`;
      }
    }
  }
}
