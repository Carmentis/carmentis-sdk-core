import {PathManager} from "./pathManager";

export class MessageManager {
  static async encode(msg: any, irLoader: any) {
    const texts = [],
          fields = [],
          parts = msg.split(/(\{\{.+?\}\})/);

    for(const index in parts) {
      const part = parts[index];

      // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
      if(index & 1) {
        const field = part.slice(2, -2).trim(),
              res = PathManager.parsePrefix(field);

        // @ts-expect-error TS(2339): Property 'blockIndex' does not exist on type '{ pr... Remove this comment to see the full error message
        const irObject = await irLoader(res.blockIndex);

        const numericPath = PathManager.toNumericPath(irObject, res.pathString);

        fields.push(numericPath);
      }
      else {
        texts.push(part);
      }
    }

    while(texts[texts.length - 1] == "") {
      texts.pop();
    }

    return {
      texts: texts,
      fields: fields
    };
  }

  static async decode(msg: any, irLoader: any) {
    for(const numericPath of msg.fields) {
      const irObject = await irLoader(0);
      const path = PathManager.fromNumericPath(irObject, numericPath);
      console.log(path);
    }
  }
}
