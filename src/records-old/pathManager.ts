import {DATA} from "../constants/constants";

export const PathManager = {
  parsePrefix,
  toNumericPath,
  fromNumericPath,
  processCallback,
  fromParents
};

function parsePrefix(pathString: any) {
  const match = /^(this|previous|block(\d+))(?=\.|\[)/.exec(pathString);

  if(!match) {
    throw `invalid prefix for path '${pathString}'`;
  }

  return {
    prefix: match[0],
    pathString: pathString.slice(match[0].length)
  };
}

function toNumericPath(irObject: any, pathString: any) {
  const res = processPathString(irObject, pathString, false);

  return res.numericPath;
}

function fromNumericPath(irObject: any, numericPath: any) {
  let item = irObject[0],
      pathString = "";

  for(const index of numericPath) {
    if(item.type == DATA.TYPE_OBJECT) {
      item = item.properties[index];
      pathString += "." + item.name;
    }
    else if(item.type == DATA.TYPE_ARRAY) {
      item = item.entries[index];
      pathString += `[${item.index}]`;
    }
  }

  return pathString;
}

function fromParents(parents: any) {
  let pathString = "";

  for(let n = 1; n < parents.length; n++) {
    const item = parents[n];

    pathString += parents[n - 1].type == DATA.TYPE_ARRAY ? `[${item.index}]` : "." + item.name;
  }
  return pathString;
}

function processCallback(irObject: any, pathString: any, callback: any) {
  const res = processPathString(irObject, pathString, true);

  if(res.hasWildcard) {
    (function browse(list) {
      for(const item of list) {
        if(item.type == DATA.TYPE_OBJECT) {
          browse(item.properties);
        }
        else if(item.type == DATA.TYPE_ARRAY) {
          browse(item.entries);
        }
        else {
          callback(item);
        }
      }
    })(res.item);
  }
  else {
    callback(res.item);
  }
}

function processPathString(irObject: any, pathString: any, wildcardAllowed: any) {
  const parts = pathString.match(/\[(?:\*|\d+)\]|\.(?:\*|[^.*\[\]]+)/g);

  if(parts.join("") != pathString) {
    throw `invalid syntax for path '${pathString}'`;
  }

  const numericPath = [];

  let item = irObject[0],
      index,
      hasWildcard = false;

  for(let part of parts) {
    if(hasWildcard) {
      throw `a wildcard cannot be followed by anything else`;
    }

    switch(part[0]) {
      case ".": {
        const propertyName = part.slice(1);

        if(item.type != DATA.TYPE_OBJECT) {
          throw `cannot read property '${propertyName}': the parent node is not an object`;
        }

        if(propertyName == "*") {
          if(!wildcardAllowed) {
            throw `a wildcard is not allowed`;
          }
          item = item.properties;
          hasWildcard = true;
        }
        else {
          index = item.properties.findIndex((obj: any) => obj.name == propertyName);

          if(index == -1) {
            throw `cannot find property '${propertyName}'`;
          }
          item = item.properties[index];
        }
        break;
      }

      case "[": {
        if(item.type != DATA.TYPE_ARRAY) {
          throw `cannot read entry '${part}': the parent node is not an array`;
        }

        const arrayIndex = part.slice(1, -1);

        if(arrayIndex == "*") {
          if(!wildcardAllowed) {
            throw `a wildcard is not allowed`;
          }
          item = item.entries;
          hasWildcard = true;
        }
        else {
          index = item.entries.findIndex((obj: any) => obj.index == arrayIndex);

          if(index == -1) {
            throw `cannot find index '${arrayIndex}'`;
          }
          item = item.entries[index];
        }
        break;
      }
    }
    numericPath.push(index);
  }

  if(!hasWildcard) {
    switch(item.type) {
      case DATA.TYPE_OBJECT: {
        throw `the last part of the path must be a primitive type${wildcardAllowed ? " (use .* to access all object properties)" : ""}`;
      }
      case DATA.TYPE_ARRAY: {
        throw `the last part of the path must be a primitive type${wildcardAllowed ? " (use [*] to access all array entries)" : ""}`;
      }
    }
  }

  return {
    item: item,
    numericPath: numericPath,
    hasWildcard: hasWildcard
  };
}
