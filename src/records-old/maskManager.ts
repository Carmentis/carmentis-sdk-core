export const MaskManager = {
  getListFromRegex,
  applyMask,
  getVisibleText,
  getFullText
};

function getListFromRegex(str: any, regex: any, substitution: any) {
  const stringParts = (regex.exec(str) || []).slice(1);

  if(stringParts.join("") != str) {
    throw `the regular expression ${regex} does not capture all string parts`;
  }

  const substitutionParts =
    substitution.split(/(\$\d+)/)
    .map((s: any, i: any) => [ i & 1, s ])
    .filter((a: any) => a[1]);

  if(
    substitutionParts.length != stringParts.length ||
    // @ts-expect-error TS(7031): Binding element 'shown' implicitly has an 'any' ty... Remove this comment to see the full error message
    substitutionParts.some(([ shown, s ], i: any) => shown && s != "$" + (i + 1))
  ) {
    throw `invalid substitution string "${substitution}"`;
  }

  const list: any = [];
  let ptr = 0;

  // @ts-expect-error TS(7031): Binding element 'shown' implicitly has an 'any' ty... Remove this comment to see the full error message
  substitutionParts.forEach(([ shown, s ], i: any) => {
    const newPtr = ptr + stringParts[i].length;

    if(!shown) {
      list.push([ ptr, newPtr, s ]);
    }
    ptr = newPtr;
  });

  return list;
}

function applyMask(str: any, list: any) {
  const visible: any = [],
        hidden: any = [];

  list.sort((a: any, b: any) => a[0] - b[0]);

  // @ts-expect-error TS(7031): Binding element 'start' implicitly has an 'any' ty... Remove this comment to see the full error message
  list.forEach(([ start, end, maskString ], i: any) => {
    const [ prevStart, prevEnd ] = i ? list[i - 1] : [ 0, 0 ];

    if(start < 0 || start >= str.length || end <= start) {
      throw `invalid interval [${[start, end]}]`;
    }
    if(start < prevEnd) {
      throw `overlapping intervals [${[prevStart, prevEnd]}] / [${[start, end]}]`;
    }

    const hiddenPart = str.slice(start, end);

    if(i && start == prevEnd) {
      visible[visible.length - 1] += maskString;
      hidden[hidden.length - 1] += hiddenPart;
    }
    else {
      visible.push(str.slice(prevEnd, start), maskString);
      hidden.push(hiddenPart);
    }
    if(i == list.length - 1 && end < str.length) {
      visible.push(str.slice(end));
    }
  });

  return { visible, hidden };
}

function getVisibleText(visible: any) {
  return visible.join("");
}

function getFullText(visible: any, hidden: any) {
  return visible.map((s: any, i: any) => i & 1 ? hidden[i >> 1] : s).join("");
}
