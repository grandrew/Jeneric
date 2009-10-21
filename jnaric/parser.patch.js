// fast, use with regexp.lastIndex

var opRegExp2 = new RegExp(opRegExp.source.substr(1), 'g');
var fpRegExp2 = /(?:\d+\.\d*(?:[eE][-+]?\d+)?|\d+(?:\.\d*)?[eE][-+]?\d+|\.\d+(?:[eE][-+]?\d+)?)/g;
var qrNumber2 = /(?:0[xX][\da-fA-F]+|0[0-7]*|\d+)/g;
var qrString2 = /(?:'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*")/g;
var qrRegExp2 = /\/((?:\\.|[^\/])+)\/([gimy]*)/g;
var qrComment2 = /\/(?:\*(?:.|\n|\r)*?\*\/|\/.*)/g;   // <- need check \r, in binary read from windows file system.
var qrIdentifier2 = /[$\w]+/g;

/* changed by aimingoo
  1. input.charCodeAt(0) -> input.charCodeAt(this.cursor)
  2. input.charAt(op.length) -> input.charAt(match.lastIndex)
  3. fix all RegExp, use RegExp.lastIndex
*/
Tokenizer.prototype = {
  ...

  get: function () {
    var token;
    while (this.lookahead) {
      --this.lookahead;
      this.tokenIndex = (this.tokenIndex + 1) & 3;
      token = this.tokens[this.tokenIndex];
      if (token.type != NEWLINE || this.scanNewlines)
        return token.type;
    }

    var input = this.source;
    var match, r, r1 = /[ \t]+/g, r2 = /\s+/g;
    for (;;) {
      var firstChar = input.charCodeAt(this.cursor);
      if ((firstChar == 32 || (firstChar >= 9 && firstChar <= 13)) &&
          (match = ((r=(this.scanNewlines ? r1 : r2)).lastIndex=this.cursor, r.exec(input)))) {
        var spaces = match[0];
        this.cursor = r.lastIndex;
        var newlines = spaces.match(/\n/g);
        if (newlines)
          this.lineno += newlines.length;
      }
      if ((input.charCodeAt(this.cursor) == 47) &&
          (match = (qrComment2.lastIndex=this.cursor, qrComment2.exec(input))) &&
          (match.index == this.cursor)) {
        var comment = match[0];
        this.cursor = qrComment2.lastIndex;
        newlines = comment.match(/\n/g);
        if (newlines)
          this.lineno += newlines.length
      }
      else break;
    }

    this.tokenIndex = (this.tokenIndex + 1) & 3;
    token = this.tokens[this.tokenIndex];
    if (!token) {
      myChecker[ctToken]++;
      this.tokens[this.tokenIndex] = token = new this.Token();
    }

    if (this.cursor >= input.length)
      return token.type = END;

    var pt = this.cursor;
    var firstChar = input.charCodeAt(pt);
    try {
        if ((firstChar == 46 || (firstChar > 47 && firstChar < 58)) &&
            (match = (fpRegExp2.lastIndex=pt, fpRegExp2.exec(input))) &&
            (match.index == pt)){
          token.type = NUMBER;
          token.value = parseFloat(match[0]);
        } else if ((firstChar > 47 && firstChar < 58) &&
                   (match = (qrNumber2.lastIndex=pt, qrNumber2.exec(input))) &&
                   (match.index == pt)){
          token.type = NUMBER;
          token.value = parseInt(match[0]);
        } else if (((firstChar > 47 && firstChar < 58)  ||
                    (firstChar > 64 && firstChar < 91)  ||
                    (firstChar > 96 && firstChar < 123) ||
                    (firstChar == 36 || firstChar == 95)) &&
                   (match = (qrIdentifier2.lastIndex=pt, qrIdentifier2.exec(input))) &&
                   (match.index == pt)) {
          var id = match[0];
          token.type = typeof(keywords[id]) == "number" ? keywords[id] : IDENTIFIER;
          token.value = id;
        } else if ((firstChar == 34 || firstChar == 39) &&
                   (match = (qrString2.lastIndex=pt, qrString2.exec(input))) &&
                   (match.index == pt)){
          token.type = STRING;
          token.value = eval(match[0]);
        } else if (this.scanOperand && firstChar == 47 &&
                  (match = (qrRegExp2.lastIndex=pt, qrRegExp2.exec(input))) &&
                  (match.index == pt)){
          token.type = REGEXP;
          token.value = new RegExp(match[1], match[2]);
        } else if ((match = (opRegExp2.lastIndex=pt, opRegExp2.exec(input))) &&
                   (match.index == pt)){
          var op = match[0];
          if (assignOps[op] && input.charAt(opRegExp2.lastIndex) == '=') {
            token.type = ASSIGN;
            token.assignOp = op;
            match[0] += '=';
          } else {
            token.type = opTypeOrder.table[op];  // <- global token name.
            if (this.scanOperand &&
              (token.type == PLUS || token.type == MINUS)) {
              token.type += UNARY_PLUS - PLUS;
            }
            token.assignOp = null;
          }
          token.value = op;
          // EDIT: add another if from original...
        } else if (this.scanNewlines && (match = /^\n/(input))) {
            token.type = NEWLINE;
        } else {
    		// EDIT
            throw this.newSyntaxError("JNARIC PARSER: Illegal token");
        }
     } catch (e) {
        if (e instanceof SyntaxError) {
            e.message = "JNARIC PARSER: "+e.message;
            throw e;
        } else {
            throw e;
        }
    }
    token.start = pt;
    this.cursor += match[0].length;
    token.end = this.cursor;
    token.lineno = this.lineno;
    return token.type;
  }, 
  
  
  
  
  sorry, a little bug, pls fix:
-------
var opRegExp2 = new RegExp(opRegExpSrc.source.substr(1), 'g');
  -- to ---
var opRegExp2 = new RegExp(opRegExp.source.substr(1), 'g');

and, you need fix a Narcissus's bug in your Strands project:
-------
/* need check value <null>, because, for a array [a,,b], in:
  function Expression(t, x, stop) {
      ...
      case LEFT_BRACKET:
            ...
            n.push(null);
*/
Np.push = function (kid) {
  if (kid !== null) {
    if (kid.start < this.start)
      this.start = kid.start;
    if (this.end < kid.end)
      this.end = kid.end;
  }

  this[this.length] = kid;

} 
