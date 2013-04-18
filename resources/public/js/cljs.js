var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4583__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4583 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4583__delegate.call(this, array, i, idxs)
    };
    G__4583.cljs$lang$maxFixedArity = 2;
    G__4583.cljs$lang$applyTo = function(arglist__4584) {
      var array = cljs.core.first(arglist__4584);
      var i = cljs.core.first(cljs.core.next(arglist__4584));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4584));
      return G__4583__delegate(array, i, idxs)
    };
    G__4583.cljs$lang$arity$variadic = G__4583__delegate;
    return G__4583
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3546__auto____4585 = this$;
      if(and__3546__auto____4585) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3546__auto____4585
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3548__auto____4586 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4586) {
          return or__3548__auto____4586
        }else {
          var or__3548__auto____4587 = cljs.core._invoke["_"];
          if(or__3548__auto____4587) {
            return or__3548__auto____4587
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3546__auto____4588 = this$;
      if(and__3546__auto____4588) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3546__auto____4588
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3548__auto____4589 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4589) {
          return or__3548__auto____4589
        }else {
          var or__3548__auto____4590 = cljs.core._invoke["_"];
          if(or__3548__auto____4590) {
            return or__3548__auto____4590
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3546__auto____4591 = this$;
      if(and__3546__auto____4591) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3546__auto____4591
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____4592 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4592) {
          return or__3548__auto____4592
        }else {
          var or__3548__auto____4593 = cljs.core._invoke["_"];
          if(or__3548__auto____4593) {
            return or__3548__auto____4593
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3546__auto____4594 = this$;
      if(and__3546__auto____4594) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3546__auto____4594
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____4595 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4595) {
          return or__3548__auto____4595
        }else {
          var or__3548__auto____4596 = cljs.core._invoke["_"];
          if(or__3548__auto____4596) {
            return or__3548__auto____4596
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3546__auto____4597 = this$;
      if(and__3546__auto____4597) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3546__auto____4597
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____4598 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4598) {
          return or__3548__auto____4598
        }else {
          var or__3548__auto____4599 = cljs.core._invoke["_"];
          if(or__3548__auto____4599) {
            return or__3548__auto____4599
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3546__auto____4600 = this$;
      if(and__3546__auto____4600) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3546__auto____4600
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____4601 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4601) {
          return or__3548__auto____4601
        }else {
          var or__3548__auto____4602 = cljs.core._invoke["_"];
          if(or__3548__auto____4602) {
            return or__3548__auto____4602
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3546__auto____4603 = this$;
      if(and__3546__auto____4603) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3546__auto____4603
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____4604 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4604) {
          return or__3548__auto____4604
        }else {
          var or__3548__auto____4605 = cljs.core._invoke["_"];
          if(or__3548__auto____4605) {
            return or__3548__auto____4605
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3546__auto____4606 = this$;
      if(and__3546__auto____4606) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3546__auto____4606
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____4607 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4607) {
          return or__3548__auto____4607
        }else {
          var or__3548__auto____4608 = cljs.core._invoke["_"];
          if(or__3548__auto____4608) {
            return or__3548__auto____4608
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3546__auto____4609 = this$;
      if(and__3546__auto____4609) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3546__auto____4609
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____4610 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4610) {
          return or__3548__auto____4610
        }else {
          var or__3548__auto____4611 = cljs.core._invoke["_"];
          if(or__3548__auto____4611) {
            return or__3548__auto____4611
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3546__auto____4612 = this$;
      if(and__3546__auto____4612) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3546__auto____4612
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____4613 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4613) {
          return or__3548__auto____4613
        }else {
          var or__3548__auto____4614 = cljs.core._invoke["_"];
          if(or__3548__auto____4614) {
            return or__3548__auto____4614
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3546__auto____4615 = this$;
      if(and__3546__auto____4615) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3546__auto____4615
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____4616 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4616) {
          return or__3548__auto____4616
        }else {
          var or__3548__auto____4617 = cljs.core._invoke["_"];
          if(or__3548__auto____4617) {
            return or__3548__auto____4617
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3546__auto____4618 = this$;
      if(and__3546__auto____4618) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3546__auto____4618
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____4619 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4619) {
          return or__3548__auto____4619
        }else {
          var or__3548__auto____4620 = cljs.core._invoke["_"];
          if(or__3548__auto____4620) {
            return or__3548__auto____4620
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3546__auto____4621 = this$;
      if(and__3546__auto____4621) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3546__auto____4621
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____4622 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4622) {
          return or__3548__auto____4622
        }else {
          var or__3548__auto____4623 = cljs.core._invoke["_"];
          if(or__3548__auto____4623) {
            return or__3548__auto____4623
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3546__auto____4624 = this$;
      if(and__3546__auto____4624) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3546__auto____4624
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____4625 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4625) {
          return or__3548__auto____4625
        }else {
          var or__3548__auto____4626 = cljs.core._invoke["_"];
          if(or__3548__auto____4626) {
            return or__3548__auto____4626
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3546__auto____4627 = this$;
      if(and__3546__auto____4627) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3546__auto____4627
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____4628 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4628) {
          return or__3548__auto____4628
        }else {
          var or__3548__auto____4629 = cljs.core._invoke["_"];
          if(or__3548__auto____4629) {
            return or__3548__auto____4629
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3546__auto____4630 = this$;
      if(and__3546__auto____4630) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3546__auto____4630
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____4631 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4631) {
          return or__3548__auto____4631
        }else {
          var or__3548__auto____4632 = cljs.core._invoke["_"];
          if(or__3548__auto____4632) {
            return or__3548__auto____4632
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3546__auto____4633 = this$;
      if(and__3546__auto____4633) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3546__auto____4633
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____4634 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4634) {
          return or__3548__auto____4634
        }else {
          var or__3548__auto____4635 = cljs.core._invoke["_"];
          if(or__3548__auto____4635) {
            return or__3548__auto____4635
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3546__auto____4636 = this$;
      if(and__3546__auto____4636) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3546__auto____4636
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____4637 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4637) {
          return or__3548__auto____4637
        }else {
          var or__3548__auto____4638 = cljs.core._invoke["_"];
          if(or__3548__auto____4638) {
            return or__3548__auto____4638
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3546__auto____4639 = this$;
      if(and__3546__auto____4639) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3546__auto____4639
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____4640 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4640) {
          return or__3548__auto____4640
        }else {
          var or__3548__auto____4641 = cljs.core._invoke["_"];
          if(or__3548__auto____4641) {
            return or__3548__auto____4641
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3546__auto____4642 = this$;
      if(and__3546__auto____4642) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3546__auto____4642
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____4643 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4643) {
          return or__3548__auto____4643
        }else {
          var or__3548__auto____4644 = cljs.core._invoke["_"];
          if(or__3548__auto____4644) {
            return or__3548__auto____4644
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3546__auto____4645 = this$;
      if(and__3546__auto____4645) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3546__auto____4645
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____4646 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____4646) {
          return or__3548__auto____4646
        }else {
          var or__3548__auto____4647 = cljs.core._invoke["_"];
          if(or__3548__auto____4647) {
            return or__3548__auto____4647
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3546__auto____4648 = coll;
    if(and__3546__auto____4648) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3546__auto____4648
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4649 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4649) {
        return or__3548__auto____4649
      }else {
        var or__3548__auto____4650 = cljs.core._count["_"];
        if(or__3548__auto____4650) {
          return or__3548__auto____4650
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3546__auto____4651 = coll;
    if(and__3546__auto____4651) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3546__auto____4651
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4652 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4652) {
        return or__3548__auto____4652
      }else {
        var or__3548__auto____4653 = cljs.core._empty["_"];
        if(or__3548__auto____4653) {
          return or__3548__auto____4653
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3546__auto____4654 = coll;
    if(and__3546__auto____4654) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3546__auto____4654
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3548__auto____4655 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4655) {
        return or__3548__auto____4655
      }else {
        var or__3548__auto____4656 = cljs.core._conj["_"];
        if(or__3548__auto____4656) {
          return or__3548__auto____4656
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3546__auto____4657 = coll;
      if(and__3546__auto____4657) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3546__auto____4657
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3548__auto____4658 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4658) {
          return or__3548__auto____4658
        }else {
          var or__3548__auto____4659 = cljs.core._nth["_"];
          if(or__3548__auto____4659) {
            return or__3548__auto____4659
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3546__auto____4660 = coll;
      if(and__3546__auto____4660) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3546__auto____4660
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____4661 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4661) {
          return or__3548__auto____4661
        }else {
          var or__3548__auto____4662 = cljs.core._nth["_"];
          if(or__3548__auto____4662) {
            return or__3548__auto____4662
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3546__auto____4663 = coll;
    if(and__3546__auto____4663) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3546__auto____4663
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4664 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4664) {
        return or__3548__auto____4664
      }else {
        var or__3548__auto____4665 = cljs.core._first["_"];
        if(or__3548__auto____4665) {
          return or__3548__auto____4665
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3546__auto____4666 = coll;
    if(and__3546__auto____4666) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3546__auto____4666
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4667 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4667) {
        return or__3548__auto____4667
      }else {
        var or__3548__auto____4668 = cljs.core._rest["_"];
        if(or__3548__auto____4668) {
          return or__3548__auto____4668
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3546__auto____4669 = o;
      if(and__3546__auto____4669) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3546__auto____4669
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3548__auto____4670 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4670) {
          return or__3548__auto____4670
        }else {
          var or__3548__auto____4671 = cljs.core._lookup["_"];
          if(or__3548__auto____4671) {
            return or__3548__auto____4671
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3546__auto____4672 = o;
      if(and__3546__auto____4672) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3546__auto____4672
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____4673 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____4673) {
          return or__3548__auto____4673
        }else {
          var or__3548__auto____4674 = cljs.core._lookup["_"];
          if(or__3548__auto____4674) {
            return or__3548__auto____4674
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3546__auto____4675 = coll;
    if(and__3546__auto____4675) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3546__auto____4675
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4676 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4676) {
        return or__3548__auto____4676
      }else {
        var or__3548__auto____4677 = cljs.core._contains_key_QMARK_["_"];
        if(or__3548__auto____4677) {
          return or__3548__auto____4677
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3546__auto____4678 = coll;
    if(and__3546__auto____4678) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3546__auto____4678
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____4679 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4679) {
        return or__3548__auto____4679
      }else {
        var or__3548__auto____4680 = cljs.core._assoc["_"];
        if(or__3548__auto____4680) {
          return or__3548__auto____4680
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3546__auto____4681 = coll;
    if(and__3546__auto____4681) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3546__auto____4681
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____4682 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4682) {
        return or__3548__auto____4682
      }else {
        var or__3548__auto____4683 = cljs.core._dissoc["_"];
        if(or__3548__auto____4683) {
          return or__3548__auto____4683
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3546__auto____4684 = coll;
    if(and__3546__auto____4684) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3546__auto____4684
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4685 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4685) {
        return or__3548__auto____4685
      }else {
        var or__3548__auto____4686 = cljs.core._key["_"];
        if(or__3548__auto____4686) {
          return or__3548__auto____4686
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3546__auto____4687 = coll;
    if(and__3546__auto____4687) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3546__auto____4687
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4688 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4688) {
        return or__3548__auto____4688
      }else {
        var or__3548__auto____4689 = cljs.core._val["_"];
        if(or__3548__auto____4689) {
          return or__3548__auto____4689
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3546__auto____4690 = coll;
    if(and__3546__auto____4690) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3546__auto____4690
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3548__auto____4691 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4691) {
        return or__3548__auto____4691
      }else {
        var or__3548__auto____4692 = cljs.core._disjoin["_"];
        if(or__3548__auto____4692) {
          return or__3548__auto____4692
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3546__auto____4693 = coll;
    if(and__3546__auto____4693) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3546__auto____4693
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4694 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4694) {
        return or__3548__auto____4694
      }else {
        var or__3548__auto____4695 = cljs.core._peek["_"];
        if(or__3548__auto____4695) {
          return or__3548__auto____4695
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3546__auto____4696 = coll;
    if(and__3546__auto____4696) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3546__auto____4696
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4697 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4697) {
        return or__3548__auto____4697
      }else {
        var or__3548__auto____4698 = cljs.core._pop["_"];
        if(or__3548__auto____4698) {
          return or__3548__auto____4698
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3546__auto____4699 = coll;
    if(and__3546__auto____4699) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3546__auto____4699
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____4700 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4700) {
        return or__3548__auto____4700
      }else {
        var or__3548__auto____4701 = cljs.core._assoc_n["_"];
        if(or__3548__auto____4701) {
          return or__3548__auto____4701
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3546__auto____4702 = o;
    if(and__3546__auto____4702) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3546__auto____4702
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4703 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3548__auto____4703) {
        return or__3548__auto____4703
      }else {
        var or__3548__auto____4704 = cljs.core._deref["_"];
        if(or__3548__auto____4704) {
          return or__3548__auto____4704
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3546__auto____4705 = o;
    if(and__3546__auto____4705) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3546__auto____4705
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____4706 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3548__auto____4706) {
        return or__3548__auto____4706
      }else {
        var or__3548__auto____4707 = cljs.core._deref_with_timeout["_"];
        if(or__3548__auto____4707) {
          return or__3548__auto____4707
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3546__auto____4708 = o;
    if(and__3546__auto____4708) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3546__auto____4708
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4709 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4709) {
        return or__3548__auto____4709
      }else {
        var or__3548__auto____4710 = cljs.core._meta["_"];
        if(or__3548__auto____4710) {
          return or__3548__auto____4710
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3546__auto____4711 = o;
    if(and__3546__auto____4711) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3546__auto____4711
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3548__auto____4712 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____4712) {
        return or__3548__auto____4712
      }else {
        var or__3548__auto____4713 = cljs.core._with_meta["_"];
        if(or__3548__auto____4713) {
          return or__3548__auto____4713
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3546__auto____4714 = coll;
      if(and__3546__auto____4714) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3546__auto____4714
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3548__auto____4715 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4715) {
          return or__3548__auto____4715
        }else {
          var or__3548__auto____4716 = cljs.core._reduce["_"];
          if(or__3548__auto____4716) {
            return or__3548__auto____4716
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3546__auto____4717 = coll;
      if(and__3546__auto____4717) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3546__auto____4717
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____4718 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____4718) {
          return or__3548__auto____4718
        }else {
          var or__3548__auto____4719 = cljs.core._reduce["_"];
          if(or__3548__auto____4719) {
            return or__3548__auto____4719
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3546__auto____4720 = coll;
    if(and__3546__auto____4720) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3546__auto____4720
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3548__auto____4721 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4721) {
        return or__3548__auto____4721
      }else {
        var or__3548__auto____4722 = cljs.core._kv_reduce["_"];
        if(or__3548__auto____4722) {
          return or__3548__auto____4722
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3546__auto____4723 = o;
    if(and__3546__auto____4723) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3546__auto____4723
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3548__auto____4724 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3548__auto____4724) {
        return or__3548__auto____4724
      }else {
        var or__3548__auto____4725 = cljs.core._equiv["_"];
        if(or__3548__auto____4725) {
          return or__3548__auto____4725
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3546__auto____4726 = o;
    if(and__3546__auto____4726) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3546__auto____4726
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4727 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3548__auto____4727) {
        return or__3548__auto____4727
      }else {
        var or__3548__auto____4728 = cljs.core._hash["_"];
        if(or__3548__auto____4728) {
          return or__3548__auto____4728
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3546__auto____4729 = o;
    if(and__3546__auto____4729) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3546__auto____4729
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____4730 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4730) {
        return or__3548__auto____4730
      }else {
        var or__3548__auto____4731 = cljs.core._seq["_"];
        if(or__3548__auto____4731) {
          return or__3548__auto____4731
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3546__auto____4732 = coll;
    if(and__3546__auto____4732) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3546__auto____4732
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4733 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4733) {
        return or__3548__auto____4733
      }else {
        var or__3548__auto____4734 = cljs.core._rseq["_"];
        if(or__3548__auto____4734) {
          return or__3548__auto____4734
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4735 = coll;
    if(and__3546__auto____4735) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3546__auto____4735
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4736 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4736) {
        return or__3548__auto____4736
      }else {
        var or__3548__auto____4737 = cljs.core._sorted_seq["_"];
        if(or__3548__auto____4737) {
          return or__3548__auto____4737
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____4738 = coll;
    if(and__3546__auto____4738) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3546__auto____4738
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____4739 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4739) {
        return or__3548__auto____4739
      }else {
        var or__3548__auto____4740 = cljs.core._sorted_seq_from["_"];
        if(or__3548__auto____4740) {
          return or__3548__auto____4740
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3546__auto____4741 = coll;
    if(and__3546__auto____4741) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3546__auto____4741
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3548__auto____4742 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4742) {
        return or__3548__auto____4742
      }else {
        var or__3548__auto____4743 = cljs.core._entry_key["_"];
        if(or__3548__auto____4743) {
          return or__3548__auto____4743
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3546__auto____4744 = coll;
    if(and__3546__auto____4744) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3546__auto____4744
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4745 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4745) {
        return or__3548__auto____4745
      }else {
        var or__3548__auto____4746 = cljs.core._comparator["_"];
        if(or__3548__auto____4746) {
          return or__3548__auto____4746
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3546__auto____4747 = o;
    if(and__3546__auto____4747) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3546__auto____4747
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3548__auto____4748 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____4748) {
        return or__3548__auto____4748
      }else {
        var or__3548__auto____4749 = cljs.core._pr_seq["_"];
        if(or__3548__auto____4749) {
          return or__3548__auto____4749
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3546__auto____4750 = d;
    if(and__3546__auto____4750) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3546__auto____4750
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3548__auto____4751 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3548__auto____4751) {
        return or__3548__auto____4751
      }else {
        var or__3548__auto____4752 = cljs.core._realized_QMARK_["_"];
        if(or__3548__auto____4752) {
          return or__3548__auto____4752
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3546__auto____4753 = this$;
    if(and__3546__auto____4753) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3546__auto____4753
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____4754 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4754) {
        return or__3548__auto____4754
      }else {
        var or__3548__auto____4755 = cljs.core._notify_watches["_"];
        if(or__3548__auto____4755) {
          return or__3548__auto____4755
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3546__auto____4756 = this$;
    if(and__3546__auto____4756) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3546__auto____4756
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____4757 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4757) {
        return or__3548__auto____4757
      }else {
        var or__3548__auto____4758 = cljs.core._add_watch["_"];
        if(or__3548__auto____4758) {
          return or__3548__auto____4758
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3546__auto____4759 = this$;
    if(and__3546__auto____4759) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3546__auto____4759
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3548__auto____4760 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____4760) {
        return or__3548__auto____4760
      }else {
        var or__3548__auto____4761 = cljs.core._remove_watch["_"];
        if(or__3548__auto____4761) {
          return or__3548__auto____4761
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3546__auto____4762 = coll;
    if(and__3546__auto____4762) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3546__auto____4762
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____4763 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3548__auto____4763) {
        return or__3548__auto____4763
      }else {
        var or__3548__auto____4764 = cljs.core._as_transient["_"];
        if(or__3548__auto____4764) {
          return or__3548__auto____4764
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3546__auto____4765 = tcoll;
    if(and__3546__auto____4765) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3546__auto____4765
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3548__auto____4766 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4766) {
        return or__3548__auto____4766
      }else {
        var or__3548__auto____4767 = cljs.core._conj_BANG_["_"];
        if(or__3548__auto____4767) {
          return or__3548__auto____4767
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4768 = tcoll;
    if(and__3546__auto____4768) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3546__auto____4768
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4769 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4769) {
        return or__3548__auto____4769
      }else {
        var or__3548__auto____4770 = cljs.core._persistent_BANG_["_"];
        if(or__3548__auto____4770) {
          return or__3548__auto____4770
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3546__auto____4771 = tcoll;
    if(and__3546__auto____4771) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3546__auto____4771
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3548__auto____4772 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4772) {
        return or__3548__auto____4772
      }else {
        var or__3548__auto____4773 = cljs.core._assoc_BANG_["_"];
        if(or__3548__auto____4773) {
          return or__3548__auto____4773
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3546__auto____4774 = tcoll;
    if(and__3546__auto____4774) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3546__auto____4774
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3548__auto____4775 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4775) {
        return or__3548__auto____4775
      }else {
        var or__3548__auto____4776 = cljs.core._dissoc_BANG_["_"];
        if(or__3548__auto____4776) {
          return or__3548__auto____4776
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3546__auto____4777 = tcoll;
    if(and__3546__auto____4777) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3546__auto____4777
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3548__auto____4778 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4778) {
        return or__3548__auto____4778
      }else {
        var or__3548__auto____4779 = cljs.core._assoc_n_BANG_["_"];
        if(or__3548__auto____4779) {
          return or__3548__auto____4779
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____4780 = tcoll;
    if(and__3546__auto____4780) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3546__auto____4780
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____4781 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4781) {
        return or__3548__auto____4781
      }else {
        var or__3548__auto____4782 = cljs.core._pop_BANG_["_"];
        if(or__3548__auto____4782) {
          return or__3548__auto____4782
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3546__auto____4783 = tcoll;
    if(and__3546__auto____4783) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3546__auto____4783
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3548__auto____4784 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____4784) {
        return or__3548__auto____4784
      }else {
        var or__3548__auto____4785 = cljs.core._disjoin_BANG_["_"];
        if(or__3548__auto____4785) {
          return or__3548__auto____4785
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3548__auto____4786 = x === y;
    if(or__3548__auto____4786) {
      return or__3548__auto____4786
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4787__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4788 = y;
            var G__4789 = cljs.core.first.call(null, more);
            var G__4790 = cljs.core.next.call(null, more);
            x = G__4788;
            y = G__4789;
            more = G__4790;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4787 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4787__delegate.call(this, x, y, more)
    };
    G__4787.cljs$lang$maxFixedArity = 2;
    G__4787.cljs$lang$applyTo = function(arglist__4791) {
      var x = cljs.core.first(arglist__4791);
      var y = cljs.core.first(cljs.core.next(arglist__4791));
      var more = cljs.core.rest(cljs.core.next(arglist__4791));
      return G__4787__delegate(x, y, more)
    };
    G__4787.cljs$lang$arity$variadic = G__4787__delegate;
    return G__4787
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3548__auto____4792 = x == null;
    if(or__3548__auto____4792) {
      return or__3548__auto____4792
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__4793 = null;
  var G__4793__2 = function(o, k) {
    return null
  };
  var G__4793__3 = function(o, k, not_found) {
    return not_found
  };
  G__4793 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4793__2.call(this, o, k);
      case 3:
        return G__4793__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4793
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__4794 = null;
  var G__4794__2 = function(_, f) {
    return f.call(null)
  };
  var G__4794__3 = function(_, f, start) {
    return start
  };
  G__4794 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4794__2.call(this, _, f);
      case 3:
        return G__4794__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4794
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__4795 = null;
  var G__4795__2 = function(_, n) {
    return null
  };
  var G__4795__3 = function(_, n, not_found) {
    return not_found
  };
  G__4795 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4795__2.call(this, _, n);
      case 3:
        return G__4795__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4795
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__4796 = cljs.core._nth.call(null, cicoll, 0);
      var n__4797 = 1;
      while(true) {
        if(n__4797 < cljs.core._count.call(null, cicoll)) {
          var nval__4798 = f.call(null, val__4796, cljs.core._nth.call(null, cicoll, n__4797));
          if(cljs.core.reduced_QMARK_.call(null, nval__4798)) {
            return cljs.core.deref.call(null, nval__4798)
          }else {
            var G__4805 = nval__4798;
            var G__4806 = n__4797 + 1;
            val__4796 = G__4805;
            n__4797 = G__4806;
            continue
          }
        }else {
          return val__4796
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4799 = val;
    var n__4800 = 0;
    while(true) {
      if(n__4800 < cljs.core._count.call(null, cicoll)) {
        var nval__4801 = f.call(null, val__4799, cljs.core._nth.call(null, cicoll, n__4800));
        if(cljs.core.reduced_QMARK_.call(null, nval__4801)) {
          return cljs.core.deref.call(null, nval__4801)
        }else {
          var G__4807 = nval__4801;
          var G__4808 = n__4800 + 1;
          val__4799 = G__4807;
          n__4800 = G__4808;
          continue
        }
      }else {
        return val__4799
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4802 = val;
    var n__4803 = idx;
    while(true) {
      if(n__4803 < cljs.core._count.call(null, cicoll)) {
        var nval__4804 = f.call(null, val__4802, cljs.core._nth.call(null, cicoll, n__4803));
        if(cljs.core.reduced_QMARK_.call(null, nval__4804)) {
          return cljs.core.deref.call(null, nval__4804)
        }else {
          var G__4809 = nval__4804;
          var G__4810 = n__4803 + 1;
          val__4802 = G__4809;
          n__4803 = G__4810;
          continue
        }
      }else {
        return val__4802
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4811 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4812 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4813 = this;
  var this$__4814 = this;
  return cljs.core.pr_str.call(null, this$__4814)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__4815 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4815.a)) {
    return cljs.core.ci_reduce.call(null, this__4815.a, f, this__4815.a[this__4815.i], this__4815.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__4815.a[this__4815.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__4816 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4816.a)) {
    return cljs.core.ci_reduce.call(null, this__4816.a, f, start, this__4816.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4817 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4818 = this;
  return this__4818.a.length - this__4818.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4819 = this;
  return this__4819.a[this__4819.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4820 = this;
  if(this__4820.i + 1 < this__4820.a.length) {
    return new cljs.core.IndexedSeq(this__4820.a, this__4820.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4821 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4822 = this;
  var i__4823 = n + this__4822.i;
  if(i__4823 < this__4822.a.length) {
    return this__4822.a[i__4823]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4824 = this;
  var i__4825 = n + this__4824.i;
  if(i__4825 < this__4824.a.length) {
    return this__4824.a[i__4825]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__4826 = null;
  var G__4826__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4826__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4826 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4826__2.call(this, array, f);
      case 3:
        return G__4826__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4826
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4827 = null;
  var G__4827__2 = function(array, k) {
    return array[k]
  };
  var G__4827__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4827 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4827__2.call(this, array, k);
      case 3:
        return G__4827__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4827
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4828 = null;
  var G__4828__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4828__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4828 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4828__2.call(this, array, n);
      case 3:
        return G__4828__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4828
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__4829__4830 = coll;
      if(G__4829__4830 != null) {
        if(function() {
          var or__3548__auto____4831 = G__4829__4830.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3548__auto____4831) {
            return or__3548__auto____4831
          }else {
            return G__4829__4830.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__4829__4830.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4829__4830)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4829__4830)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__4832__4833 = coll;
      if(G__4832__4833 != null) {
        if(function() {
          var or__3548__auto____4834 = G__4832__4833.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4834) {
            return or__3548__auto____4834
          }else {
            return G__4832__4833.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4832__4833.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4832__4833)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4832__4833)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__4835 = cljs.core.seq.call(null, coll);
      if(s__4835 != null) {
        return cljs.core._first.call(null, s__4835)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__4836__4837 = coll;
      if(G__4836__4837 != null) {
        if(function() {
          var or__3548__auto____4838 = G__4836__4837.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4838) {
            return or__3548__auto____4838
          }else {
            return G__4836__4837.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4836__4837.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4836__4837)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4836__4837)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__4839 = cljs.core.seq.call(null, coll);
      if(s__4839 != null) {
        return cljs.core._rest.call(null, s__4839)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__4840__4841 = coll;
      if(G__4840__4841 != null) {
        if(function() {
          var or__3548__auto____4842 = G__4840__4841.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____4842) {
            return or__3548__auto____4842
          }else {
            return G__4840__4841.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4840__4841.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4840__4841)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4840__4841)
      }
    }()) {
      var coll__4843 = cljs.core._rest.call(null, coll);
      if(coll__4843 != null) {
        if(function() {
          var G__4844__4845 = coll__4843;
          if(G__4844__4845 != null) {
            if(function() {
              var or__3548__auto____4846 = G__4844__4845.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3548__auto____4846) {
                return or__3548__auto____4846
              }else {
                return G__4844__4845.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__4844__4845.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4844__4845)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4844__4845)
          }
        }()) {
          return coll__4843
        }else {
          return cljs.core._seq.call(null, coll__4843)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__4847 = cljs.core.next.call(null, s);
      s = G__4847;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__4848__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4849 = conj.call(null, coll, x);
          var G__4850 = cljs.core.first.call(null, xs);
          var G__4851 = cljs.core.next.call(null, xs);
          coll = G__4849;
          x = G__4850;
          xs = G__4851;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4848 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4848__delegate.call(this, coll, x, xs)
    };
    G__4848.cljs$lang$maxFixedArity = 2;
    G__4848.cljs$lang$applyTo = function(arglist__4852) {
      var coll = cljs.core.first(arglist__4852);
      var x = cljs.core.first(cljs.core.next(arglist__4852));
      var xs = cljs.core.rest(cljs.core.next(arglist__4852));
      return G__4848__delegate(coll, x, xs)
    };
    G__4848.cljs$lang$arity$variadic = G__4848__delegate;
    return G__4848
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__4853 = cljs.core.seq.call(null, coll);
  var acc__4854 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__4853)) {
      return acc__4854 + cljs.core._count.call(null, s__4853)
    }else {
      var G__4855 = cljs.core.next.call(null, s__4853);
      var G__4856 = acc__4854 + 1;
      s__4853 = G__4855;
      acc__4854 = G__4856;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll != null) {
      if(function() {
        var G__4857__4858 = coll;
        if(G__4857__4858 != null) {
          if(function() {
            var or__3548__auto____4859 = G__4857__4858.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____4859) {
              return or__3548__auto____4859
            }else {
              return G__4857__4858.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4857__4858.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4857__4858)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4857__4858)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__4860__4861 = coll;
        if(G__4860__4861 != null) {
          if(function() {
            var or__3548__auto____4862 = G__4860__4861.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____4862) {
              return or__3548__auto____4862
            }else {
              return G__4860__4861.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4860__4861.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4860__4861)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4860__4861)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__4864__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__4863 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4865 = ret__4863;
          var G__4866 = cljs.core.first.call(null, kvs);
          var G__4867 = cljs.core.second.call(null, kvs);
          var G__4868 = cljs.core.nnext.call(null, kvs);
          coll = G__4865;
          k = G__4866;
          v = G__4867;
          kvs = G__4868;
          continue
        }else {
          return ret__4863
        }
        break
      }
    };
    var G__4864 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4864__delegate.call(this, coll, k, v, kvs)
    };
    G__4864.cljs$lang$maxFixedArity = 3;
    G__4864.cljs$lang$applyTo = function(arglist__4869) {
      var coll = cljs.core.first(arglist__4869);
      var k = cljs.core.first(cljs.core.next(arglist__4869));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4869)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4869)));
      return G__4864__delegate(coll, k, v, kvs)
    };
    G__4864.cljs$lang$arity$variadic = G__4864__delegate;
    return G__4864
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__4871__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4870 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4872 = ret__4870;
          var G__4873 = cljs.core.first.call(null, ks);
          var G__4874 = cljs.core.next.call(null, ks);
          coll = G__4872;
          k = G__4873;
          ks = G__4874;
          continue
        }else {
          return ret__4870
        }
        break
      }
    };
    var G__4871 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4871__delegate.call(this, coll, k, ks)
    };
    G__4871.cljs$lang$maxFixedArity = 2;
    G__4871.cljs$lang$applyTo = function(arglist__4875) {
      var coll = cljs.core.first(arglist__4875);
      var k = cljs.core.first(cljs.core.next(arglist__4875));
      var ks = cljs.core.rest(cljs.core.next(arglist__4875));
      return G__4871__delegate(coll, k, ks)
    };
    G__4871.cljs$lang$arity$variadic = G__4871__delegate;
    return G__4871
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4876__4877 = o;
    if(G__4876__4877 != null) {
      if(function() {
        var or__3548__auto____4878 = G__4876__4877.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3548__auto____4878) {
          return or__3548__auto____4878
        }else {
          return G__4876__4877.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4876__4877.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4876__4877)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4876__4877)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__4880__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4879 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4881 = ret__4879;
          var G__4882 = cljs.core.first.call(null, ks);
          var G__4883 = cljs.core.next.call(null, ks);
          coll = G__4881;
          k = G__4882;
          ks = G__4883;
          continue
        }else {
          return ret__4879
        }
        break
      }
    };
    var G__4880 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4880__delegate.call(this, coll, k, ks)
    };
    G__4880.cljs$lang$maxFixedArity = 2;
    G__4880.cljs$lang$applyTo = function(arglist__4884) {
      var coll = cljs.core.first(arglist__4884);
      var k = cljs.core.first(cljs.core.next(arglist__4884));
      var ks = cljs.core.rest(cljs.core.next(arglist__4884));
      return G__4880__delegate(coll, k, ks)
    };
    G__4880.cljs$lang$arity$variadic = G__4880__delegate;
    return G__4880
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4885__4886 = x;
    if(G__4885__4886 != null) {
      if(function() {
        var or__3548__auto____4887 = G__4885__4886.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3548__auto____4887) {
          return or__3548__auto____4887
        }else {
          return G__4885__4886.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4885__4886.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4885__4886)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4885__4886)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4888__4889 = x;
    if(G__4888__4889 != null) {
      if(function() {
        var or__3548__auto____4890 = G__4888__4889.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3548__auto____4890) {
          return or__3548__auto____4890
        }else {
          return G__4888__4889.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4888__4889.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4888__4889)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4888__4889)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4891__4892 = x;
  if(G__4891__4892 != null) {
    if(function() {
      var or__3548__auto____4893 = G__4891__4892.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3548__auto____4893) {
        return or__3548__auto____4893
      }else {
        return G__4891__4892.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4891__4892.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4891__4892)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4891__4892)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4894__4895 = x;
  if(G__4894__4895 != null) {
    if(function() {
      var or__3548__auto____4896 = G__4894__4895.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3548__auto____4896) {
        return or__3548__auto____4896
      }else {
        return G__4894__4895.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4894__4895.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4894__4895)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4894__4895)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4897__4898 = x;
  if(G__4897__4898 != null) {
    if(function() {
      var or__3548__auto____4899 = G__4897__4898.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3548__auto____4899) {
        return or__3548__auto____4899
      }else {
        return G__4897__4898.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4897__4898.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4897__4898)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4897__4898)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4900__4901 = x;
  if(G__4900__4901 != null) {
    if(function() {
      var or__3548__auto____4902 = G__4900__4901.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3548__auto____4902) {
        return or__3548__auto____4902
      }else {
        return G__4900__4901.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4900__4901.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4900__4901)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4900__4901)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4903__4904 = x;
  if(G__4903__4904 != null) {
    if(function() {
      var or__3548__auto____4905 = G__4903__4904.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3548__auto____4905) {
        return or__3548__auto____4905
      }else {
        return G__4903__4904.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4903__4904.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4903__4904)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4903__4904)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4906__4907 = x;
    if(G__4906__4907 != null) {
      if(function() {
        var or__3548__auto____4908 = G__4906__4907.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3548__auto____4908) {
          return or__3548__auto____4908
        }else {
          return G__4906__4907.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4906__4907.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4906__4907)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4906__4907)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4909__4910 = x;
  if(G__4909__4910 != null) {
    if(function() {
      var or__3548__auto____4911 = G__4909__4910.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3548__auto____4911) {
        return or__3548__auto____4911
      }else {
        return G__4909__4910.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4909__4910.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4909__4910)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4909__4910)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4912__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4912 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4912__delegate.call(this, keyvals)
    };
    G__4912.cljs$lang$maxFixedArity = 0;
    G__4912.cljs$lang$applyTo = function(arglist__4913) {
      var keyvals = cljs.core.seq(arglist__4913);
      return G__4912__delegate(keyvals)
    };
    G__4912.cljs$lang$arity$variadic = G__4912__delegate;
    return G__4912
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__4914 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__4914.push(key)
  });
  return keys__4914
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__4915 = i;
  var j__4916 = j;
  var len__4917 = len;
  while(true) {
    if(len__4917 === 0) {
      return to
    }else {
      to[j__4916] = from[i__4915];
      var G__4918 = i__4915 + 1;
      var G__4919 = j__4916 + 1;
      var G__4920 = len__4917 - 1;
      i__4915 = G__4918;
      j__4916 = G__4919;
      len__4917 = G__4920;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__4921 = i + (len - 1);
  var j__4922 = j + (len - 1);
  var len__4923 = len;
  while(true) {
    if(len__4923 === 0) {
      return to
    }else {
      to[j__4922] = from[i__4921];
      var G__4924 = i__4921 - 1;
      var G__4925 = j__4922 - 1;
      var G__4926 = len__4923 - 1;
      i__4921 = G__4924;
      j__4922 = G__4925;
      len__4923 = G__4926;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4927__4928 = s;
    if(G__4927__4928 != null) {
      if(function() {
        var or__3548__auto____4929 = G__4927__4928.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3548__auto____4929) {
          return or__3548__auto____4929
        }else {
          return G__4927__4928.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4927__4928.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4927__4928)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4927__4928)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4930__4931 = s;
  if(G__4930__4931 != null) {
    if(function() {
      var or__3548__auto____4932 = G__4930__4931.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3548__auto____4932) {
        return or__3548__auto____4932
      }else {
        return G__4930__4931.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4930__4931.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4930__4931)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4930__4931)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____4933 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4933)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____4934 = x.charAt(0) === "\ufdd0";
      if(or__3548__auto____4934) {
        return or__3548__auto____4934
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3546__auto____4933
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____4935 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4935)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3546__auto____4935
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____4936 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____4936)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3546__auto____4936
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3548__auto____4937 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3548__auto____4937) {
    return or__3548__auto____4937
  }else {
    var G__4938__4939 = f;
    if(G__4938__4939 != null) {
      if(function() {
        var or__3548__auto____4940 = G__4938__4939.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3548__auto____4940) {
          return or__3548__auto____4940
        }else {
          return G__4938__4939.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4938__4939.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4938__4939)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4938__4939)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____4941 = cljs.core.number_QMARK_.call(null, n);
  if(and__3546__auto____4941) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____4941
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____4942 = coll;
    if(cljs.core.truth_(and__3546__auto____4942)) {
      var and__3546__auto____4943 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3546__auto____4943) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____4943
      }
    }else {
      return and__3546__auto____4942
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__4948__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__4944 = cljs.core.set([y, x]);
        var xs__4945 = more;
        while(true) {
          var x__4946 = cljs.core.first.call(null, xs__4945);
          var etc__4947 = cljs.core.next.call(null, xs__4945);
          if(cljs.core.truth_(xs__4945)) {
            if(cljs.core.contains_QMARK_.call(null, s__4944, x__4946)) {
              return false
            }else {
              var G__4949 = cljs.core.conj.call(null, s__4944, x__4946);
              var G__4950 = etc__4947;
              s__4944 = G__4949;
              xs__4945 = G__4950;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__4948 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4948__delegate.call(this, x, y, more)
    };
    G__4948.cljs$lang$maxFixedArity = 2;
    G__4948.cljs$lang$applyTo = function(arglist__4951) {
      var x = cljs.core.first(arglist__4951);
      var y = cljs.core.first(cljs.core.next(arglist__4951));
      var more = cljs.core.rest(cljs.core.next(arglist__4951));
      return G__4948__delegate(x, y, more)
    };
    G__4948.cljs$lang$arity$variadic = G__4948__delegate;
    return G__4948
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__4952 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__4952)) {
        return r__4952
      }else {
        if(cljs.core.truth_(r__4952)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__4953 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__4953, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__4953)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3695__auto____4954 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____4954)) {
      var s__4955 = temp__3695__auto____4954;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__4955), cljs.core.next.call(null, s__4955))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__4956 = val;
    var coll__4957 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__4957)) {
        var nval__4958 = f.call(null, val__4956, cljs.core.first.call(null, coll__4957));
        if(cljs.core.reduced_QMARK_.call(null, nval__4958)) {
          return cljs.core.deref.call(null, nval__4958)
        }else {
          var G__4959 = nval__4958;
          var G__4960 = cljs.core.next.call(null, coll__4957);
          val__4956 = G__4959;
          coll__4957 = G__4960;
          continue
        }
      }else {
        return val__4956
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4961__4962 = coll;
      if(G__4961__4962 != null) {
        if(function() {
          var or__3548__auto____4963 = G__4961__4962.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____4963) {
            return or__3548__auto____4963
          }else {
            return G__4961__4962.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4961__4962.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4961__4962)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4961__4962)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4964__4965 = coll;
      if(G__4964__4965 != null) {
        if(function() {
          var or__3548__auto____4966 = G__4964__4965.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____4966) {
            return or__3548__auto____4966
          }else {
            return G__4964__4965.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4964__4965.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4964__4965)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4964__4965)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__4967 = this;
  return this__4967.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4968__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4968 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4968__delegate.call(this, x, y, more)
    };
    G__4968.cljs$lang$maxFixedArity = 2;
    G__4968.cljs$lang$applyTo = function(arglist__4969) {
      var x = cljs.core.first(arglist__4969);
      var y = cljs.core.first(cljs.core.next(arglist__4969));
      var more = cljs.core.rest(cljs.core.next(arglist__4969));
      return G__4968__delegate(x, y, more)
    };
    G__4968.cljs$lang$arity$variadic = G__4968__delegate;
    return G__4968
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4970__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4970 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4970__delegate.call(this, x, y, more)
    };
    G__4970.cljs$lang$maxFixedArity = 2;
    G__4970.cljs$lang$applyTo = function(arglist__4971) {
      var x = cljs.core.first(arglist__4971);
      var y = cljs.core.first(cljs.core.next(arglist__4971));
      var more = cljs.core.rest(cljs.core.next(arglist__4971));
      return G__4970__delegate(x, y, more)
    };
    G__4970.cljs$lang$arity$variadic = G__4970__delegate;
    return G__4970
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4972__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4972 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4972__delegate.call(this, x, y, more)
    };
    G__4972.cljs$lang$maxFixedArity = 2;
    G__4972.cljs$lang$applyTo = function(arglist__4973) {
      var x = cljs.core.first(arglist__4973);
      var y = cljs.core.first(cljs.core.next(arglist__4973));
      var more = cljs.core.rest(cljs.core.next(arglist__4973));
      return G__4972__delegate(x, y, more)
    };
    G__4972.cljs$lang$arity$variadic = G__4972__delegate;
    return G__4972
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4974__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4974 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4974__delegate.call(this, x, y, more)
    };
    G__4974.cljs$lang$maxFixedArity = 2;
    G__4974.cljs$lang$applyTo = function(arglist__4975) {
      var x = cljs.core.first(arglist__4975);
      var y = cljs.core.first(cljs.core.next(arglist__4975));
      var more = cljs.core.rest(cljs.core.next(arglist__4975));
      return G__4974__delegate(x, y, more)
    };
    G__4974.cljs$lang$arity$variadic = G__4974__delegate;
    return G__4974
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4976__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4977 = y;
            var G__4978 = cljs.core.first.call(null, more);
            var G__4979 = cljs.core.next.call(null, more);
            x = G__4977;
            y = G__4978;
            more = G__4979;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4976 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4976__delegate.call(this, x, y, more)
    };
    G__4976.cljs$lang$maxFixedArity = 2;
    G__4976.cljs$lang$applyTo = function(arglist__4980) {
      var x = cljs.core.first(arglist__4980);
      var y = cljs.core.first(cljs.core.next(arglist__4980));
      var more = cljs.core.rest(cljs.core.next(arglist__4980));
      return G__4976__delegate(x, y, more)
    };
    G__4976.cljs$lang$arity$variadic = G__4976__delegate;
    return G__4976
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4981__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4982 = y;
            var G__4983 = cljs.core.first.call(null, more);
            var G__4984 = cljs.core.next.call(null, more);
            x = G__4982;
            y = G__4983;
            more = G__4984;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4981 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4981__delegate.call(this, x, y, more)
    };
    G__4981.cljs$lang$maxFixedArity = 2;
    G__4981.cljs$lang$applyTo = function(arglist__4985) {
      var x = cljs.core.first(arglist__4985);
      var y = cljs.core.first(cljs.core.next(arglist__4985));
      var more = cljs.core.rest(cljs.core.next(arglist__4985));
      return G__4981__delegate(x, y, more)
    };
    G__4981.cljs$lang$arity$variadic = G__4981__delegate;
    return G__4981
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4986__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4987 = y;
            var G__4988 = cljs.core.first.call(null, more);
            var G__4989 = cljs.core.next.call(null, more);
            x = G__4987;
            y = G__4988;
            more = G__4989;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4986 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4986__delegate.call(this, x, y, more)
    };
    G__4986.cljs$lang$maxFixedArity = 2;
    G__4986.cljs$lang$applyTo = function(arglist__4990) {
      var x = cljs.core.first(arglist__4990);
      var y = cljs.core.first(cljs.core.next(arglist__4990));
      var more = cljs.core.rest(cljs.core.next(arglist__4990));
      return G__4986__delegate(x, y, more)
    };
    G__4986.cljs$lang$arity$variadic = G__4986__delegate;
    return G__4986
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__4991__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4992 = y;
            var G__4993 = cljs.core.first.call(null, more);
            var G__4994 = cljs.core.next.call(null, more);
            x = G__4992;
            y = G__4993;
            more = G__4994;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4991 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4991__delegate.call(this, x, y, more)
    };
    G__4991.cljs$lang$maxFixedArity = 2;
    G__4991.cljs$lang$applyTo = function(arglist__4995) {
      var x = cljs.core.first(arglist__4995);
      var y = cljs.core.first(cljs.core.next(arglist__4995));
      var more = cljs.core.rest(cljs.core.next(arglist__4995));
      return G__4991__delegate(x, y, more)
    };
    G__4991.cljs$lang$arity$variadic = G__4991__delegate;
    return G__4991
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__4996__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__4996 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4996__delegate.call(this, x, y, more)
    };
    G__4996.cljs$lang$maxFixedArity = 2;
    G__4996.cljs$lang$applyTo = function(arglist__4997) {
      var x = cljs.core.first(arglist__4997);
      var y = cljs.core.first(cljs.core.next(arglist__4997));
      var more = cljs.core.rest(cljs.core.next(arglist__4997));
      return G__4996__delegate(x, y, more)
    };
    G__4996.cljs$lang$arity$variadic = G__4996__delegate;
    return G__4996
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__4998__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__4998 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4998__delegate.call(this, x, y, more)
    };
    G__4998.cljs$lang$maxFixedArity = 2;
    G__4998.cljs$lang$applyTo = function(arglist__4999) {
      var x = cljs.core.first(arglist__4999);
      var y = cljs.core.first(cljs.core.next(arglist__4999));
      var more = cljs.core.rest(cljs.core.next(arglist__4999));
      return G__4998__delegate(x, y, more)
    };
    G__4998.cljs$lang$arity$variadic = G__4998__delegate;
    return G__4998
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__5000 = n % d;
  return cljs.core.fix.call(null, (n - rem__5000) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__5001 = cljs.core.quot.call(null, n, d);
  return n - d * q__5001
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__5002 = 0;
  var n__5003 = n;
  while(true) {
    if(n__5003 === 0) {
      return c__5002
    }else {
      var G__5004 = c__5002 + 1;
      var G__5005 = n__5003 & n__5003 - 1;
      c__5002 = G__5004;
      n__5003 = G__5005;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__5006__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__5007 = y;
            var G__5008 = cljs.core.first.call(null, more);
            var G__5009 = cljs.core.next.call(null, more);
            x = G__5007;
            y = G__5008;
            more = G__5009;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__5006 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5006__delegate.call(this, x, y, more)
    };
    G__5006.cljs$lang$maxFixedArity = 2;
    G__5006.cljs$lang$applyTo = function(arglist__5010) {
      var x = cljs.core.first(arglist__5010);
      var y = cljs.core.first(cljs.core.next(arglist__5010));
      var more = cljs.core.rest(cljs.core.next(arglist__5010));
      return G__5006__delegate(x, y, more)
    };
    G__5006.cljs$lang$arity$variadic = G__5006__delegate;
    return G__5006
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__5011 = n;
  var xs__5012 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5013 = xs__5012;
      if(cljs.core.truth_(and__3546__auto____5013)) {
        return n__5011 > 0
      }else {
        return and__3546__auto____5013
      }
    }())) {
      var G__5014 = n__5011 - 1;
      var G__5015 = cljs.core.next.call(null, xs__5012);
      n__5011 = G__5014;
      xs__5012 = G__5015;
      continue
    }else {
      return xs__5012
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__5016__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5017 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__5018 = cljs.core.next.call(null, more);
            sb = G__5017;
            more = G__5018;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__5016 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5016__delegate.call(this, x, ys)
    };
    G__5016.cljs$lang$maxFixedArity = 1;
    G__5016.cljs$lang$applyTo = function(arglist__5019) {
      var x = cljs.core.first(arglist__5019);
      var ys = cljs.core.rest(arglist__5019);
      return G__5016__delegate(x, ys)
    };
    G__5016.cljs$lang$arity$variadic = G__5016__delegate;
    return G__5016
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__5020__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5021 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__5022 = cljs.core.next.call(null, more);
            sb = G__5021;
            more = G__5022;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__5020 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5020__delegate.call(this, x, ys)
    };
    G__5020.cljs$lang$maxFixedArity = 1;
    G__5020.cljs$lang$applyTo = function(arglist__5023) {
      var x = cljs.core.first(arglist__5023);
      var ys = cljs.core.rest(arglist__5023);
      return G__5020__delegate(x, ys)
    };
    G__5020.cljs$lang$arity$variadic = G__5020__delegate;
    return G__5020
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__5024 = cljs.core.seq.call(null, x);
    var ys__5025 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__5024 == null) {
        return ys__5025 == null
      }else {
        if(ys__5025 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__5024), cljs.core.first.call(null, ys__5025))) {
            var G__5026 = cljs.core.next.call(null, xs__5024);
            var G__5027 = cljs.core.next.call(null, ys__5025);
            xs__5024 = G__5026;
            ys__5025 = G__5027;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__5028_SHARP_, p2__5029_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__5028_SHARP_, cljs.core.hash.call(null, p2__5029_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__5030 = 0;
  var s__5031 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__5031)) {
      var e__5032 = cljs.core.first.call(null, s__5031);
      var G__5033 = (h__5030 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__5032)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__5032)))) % 4503599627370496;
      var G__5034 = cljs.core.next.call(null, s__5031);
      h__5030 = G__5033;
      s__5031 = G__5034;
      continue
    }else {
      return h__5030
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__5035 = 0;
  var s__5036 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__5036)) {
      var e__5037 = cljs.core.first.call(null, s__5036);
      var G__5038 = (h__5035 + cljs.core.hash.call(null, e__5037)) % 4503599627370496;
      var G__5039 = cljs.core.next.call(null, s__5036);
      h__5035 = G__5038;
      s__5036 = G__5039;
      continue
    }else {
      return h__5035
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__5040__5041 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__5040__5041)) {
    var G__5043__5045 = cljs.core.first.call(null, G__5040__5041);
    var vec__5044__5046 = G__5043__5045;
    var key_name__5047 = cljs.core.nth.call(null, vec__5044__5046, 0, null);
    var f__5048 = cljs.core.nth.call(null, vec__5044__5046, 1, null);
    var G__5040__5049 = G__5040__5041;
    var G__5043__5050 = G__5043__5045;
    var G__5040__5051 = G__5040__5049;
    while(true) {
      var vec__5052__5053 = G__5043__5050;
      var key_name__5054 = cljs.core.nth.call(null, vec__5052__5053, 0, null);
      var f__5055 = cljs.core.nth.call(null, vec__5052__5053, 1, null);
      var G__5040__5056 = G__5040__5051;
      var str_name__5057 = cljs.core.name.call(null, key_name__5054);
      obj[str_name__5057] = f__5055;
      var temp__3698__auto____5058 = cljs.core.next.call(null, G__5040__5056);
      if(cljs.core.truth_(temp__3698__auto____5058)) {
        var G__5040__5059 = temp__3698__auto____5058;
        var G__5060 = cljs.core.first.call(null, G__5040__5059);
        var G__5061 = G__5040__5059;
        G__5043__5050 = G__5060;
        G__5040__5051 = G__5061;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5062 = this;
  var h__364__auto____5063 = this__5062.__hash;
  if(h__364__auto____5063 != null) {
    return h__364__auto____5063
  }else {
    var h__364__auto____5064 = cljs.core.hash_coll.call(null, coll);
    this__5062.__hash = h__364__auto____5064;
    return h__364__auto____5064
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5065 = this;
  return new cljs.core.List(this__5065.meta, o, coll, this__5065.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__5066 = this;
  var this$__5067 = this;
  return cljs.core.pr_str.call(null, this$__5067)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5068 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5069 = this;
  return this__5069.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5070 = this;
  return this__5070.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5071 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5072 = this;
  return this__5072.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5073 = this;
  return this__5073.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5074 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5075 = this;
  return new cljs.core.List(meta, this__5075.first, this__5075.rest, this__5075.count, this__5075.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5076 = this;
  return this__5076.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5077 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5078 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5079 = this;
  return new cljs.core.List(this__5079.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__5080 = this;
  var this$__5081 = this;
  return cljs.core.pr_str.call(null, this$__5081)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5082 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5083 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5084 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5085 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5086 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5087 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5088 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5089 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5090 = this;
  return this__5090.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5091 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__5092__5093 = coll;
  if(G__5092__5093 != null) {
    if(function() {
      var or__3548__auto____5094 = G__5092__5093.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3548__auto____5094) {
        return or__3548__auto____5094
      }else {
        return G__5092__5093.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__5092__5093.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5092__5093)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5092__5093)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__5095) {
    var items = cljs.core.seq(arglist__5095);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5096 = this;
  var h__364__auto____5097 = this__5096.__hash;
  if(h__364__auto____5097 != null) {
    return h__364__auto____5097
  }else {
    var h__364__auto____5098 = cljs.core.hash_coll.call(null, coll);
    this__5096.__hash = h__364__auto____5098;
    return h__364__auto____5098
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5099 = this;
  return new cljs.core.Cons(null, o, coll, this__5099.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__5100 = this;
  var this$__5101 = this;
  return cljs.core.pr_str.call(null, this$__5101)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5102 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5103 = this;
  return this__5103.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5104 = this;
  if(this__5104.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__5104.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5105 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5106 = this;
  return new cljs.core.Cons(meta, this__5106.first, this__5106.rest, this__5106.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5107 = this;
  return this__5107.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5108 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5108.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3548__auto____5109 = coll == null;
    if(or__3548__auto____5109) {
      return or__3548__auto____5109
    }else {
      var G__5110__5111 = coll;
      if(G__5110__5111 != null) {
        if(function() {
          var or__3548__auto____5112 = G__5110__5111.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____5112) {
            return or__3548__auto____5112
          }else {
            return G__5110__5111.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5110__5111.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5110__5111)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5110__5111)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__5113__5114 = x;
  if(G__5113__5114 != null) {
    if(function() {
      var or__3548__auto____5115 = G__5113__5114.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3548__auto____5115) {
        return or__3548__auto____5115
      }else {
        return G__5113__5114.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__5113__5114.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5113__5114)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5113__5114)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__5116 = null;
  var G__5116__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__5116__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__5116 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__5116__2.call(this, string, f);
      case 3:
        return G__5116__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5116
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__5117 = null;
  var G__5117__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__5117__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__5117 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5117__2.call(this, string, k);
      case 3:
        return G__5117__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5117
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__5118 = null;
  var G__5118__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__5118__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__5118 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5118__2.call(this, string, n);
      case 3:
        return G__5118__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5118
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__5127 = null;
  var G__5127__2 = function(tsym5121, coll) {
    var tsym5121__5123 = this;
    var this$__5124 = tsym5121__5123;
    return cljs.core.get.call(null, coll, this$__5124.toString())
  };
  var G__5127__3 = function(tsym5122, coll, not_found) {
    var tsym5122__5125 = this;
    var this$__5126 = tsym5122__5125;
    return cljs.core.get.call(null, coll, this$__5126.toString(), not_found)
  };
  G__5127 = function(tsym5122, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5127__2.call(this, tsym5122, coll);
      case 3:
        return G__5127__3.call(this, tsym5122, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5127
}();
String.prototype.apply = function(tsym5119, args5120) {
  return tsym5119.call.apply(tsym5119, [tsym5119].concat(cljs.core.aclone.call(null, args5120)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__5128 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__5128
  }else {
    lazy_seq.x = x__5128.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5129 = this;
  var h__364__auto____5130 = this__5129.__hash;
  if(h__364__auto____5130 != null) {
    return h__364__auto____5130
  }else {
    var h__364__auto____5131 = cljs.core.hash_coll.call(null, coll);
    this__5129.__hash = h__364__auto____5131;
    return h__364__auto____5131
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5132 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5133 = this;
  var this$__5134 = this;
  return cljs.core.pr_str.call(null, this$__5134)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5135 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5136 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5137 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5138 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5139 = this;
  return new cljs.core.LazySeq(meta, this__5139.realized, this__5139.x, this__5139.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5140 = this;
  return this__5140.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5141 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5141.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__5142 = [];
  var s__5143 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__5143))) {
      ary__5142.push(cljs.core.first.call(null, s__5143));
      var G__5144 = cljs.core.next.call(null, s__5143);
      s__5143 = G__5144;
      continue
    }else {
      return ary__5142
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5145 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5146 = 0;
  var xs__5147 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__5147)) {
      ret__5145[i__5146] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5147));
      var G__5148 = i__5146 + 1;
      var G__5149 = cljs.core.next.call(null, xs__5147);
      i__5146 = G__5148;
      xs__5147 = G__5149;
      continue
    }else {
    }
    break
  }
  return ret__5145
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__5150 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5151 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5152 = 0;
      var s__5153 = s__5151;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5154 = s__5153;
          if(cljs.core.truth_(and__3546__auto____5154)) {
            return i__5152 < size
          }else {
            return and__3546__auto____5154
          }
        }())) {
          a__5150[i__5152] = cljs.core.first.call(null, s__5153);
          var G__5157 = i__5152 + 1;
          var G__5158 = cljs.core.next.call(null, s__5153);
          i__5152 = G__5157;
          s__5153 = G__5158;
          continue
        }else {
          return a__5150
        }
        break
      }
    }else {
      var n__685__auto____5155 = size;
      var i__5156 = 0;
      while(true) {
        if(i__5156 < n__685__auto____5155) {
          a__5150[i__5156] = init_val_or_seq;
          var G__5159 = i__5156 + 1;
          i__5156 = G__5159;
          continue
        }else {
        }
        break
      }
      return a__5150
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__5160 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5161 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5162 = 0;
      var s__5163 = s__5161;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5164 = s__5163;
          if(cljs.core.truth_(and__3546__auto____5164)) {
            return i__5162 < size
          }else {
            return and__3546__auto____5164
          }
        }())) {
          a__5160[i__5162] = cljs.core.first.call(null, s__5163);
          var G__5167 = i__5162 + 1;
          var G__5168 = cljs.core.next.call(null, s__5163);
          i__5162 = G__5167;
          s__5163 = G__5168;
          continue
        }else {
          return a__5160
        }
        break
      }
    }else {
      var n__685__auto____5165 = size;
      var i__5166 = 0;
      while(true) {
        if(i__5166 < n__685__auto____5165) {
          a__5160[i__5166] = init_val_or_seq;
          var G__5169 = i__5166 + 1;
          i__5166 = G__5169;
          continue
        }else {
        }
        break
      }
      return a__5160
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__5170 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5171 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5172 = 0;
      var s__5173 = s__5171;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____5174 = s__5173;
          if(cljs.core.truth_(and__3546__auto____5174)) {
            return i__5172 < size
          }else {
            return and__3546__auto____5174
          }
        }())) {
          a__5170[i__5172] = cljs.core.first.call(null, s__5173);
          var G__5177 = i__5172 + 1;
          var G__5178 = cljs.core.next.call(null, s__5173);
          i__5172 = G__5177;
          s__5173 = G__5178;
          continue
        }else {
          return a__5170
        }
        break
      }
    }else {
      var n__685__auto____5175 = size;
      var i__5176 = 0;
      while(true) {
        if(i__5176 < n__685__auto____5175) {
          a__5170[i__5176] = init_val_or_seq;
          var G__5179 = i__5176 + 1;
          i__5176 = G__5179;
          continue
        }else {
        }
        break
      }
      return a__5170
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__5180 = s;
    var i__5181 = n;
    var sum__5182 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____5183 = i__5181 > 0;
        if(and__3546__auto____5183) {
          return cljs.core.seq.call(null, s__5180)
        }else {
          return and__3546__auto____5183
        }
      }())) {
        var G__5184 = cljs.core.next.call(null, s__5180);
        var G__5185 = i__5181 - 1;
        var G__5186 = sum__5182 + 1;
        s__5180 = G__5184;
        i__5181 = G__5185;
        sum__5182 = G__5186;
        continue
      }else {
        return sum__5182
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__5187 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5187)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5187), concat.call(null, cljs.core.rest.call(null, s__5187), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5190__delegate = function(x, y, zs) {
      var cat__5189 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5188 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5188)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5188), cat.call(null, cljs.core.rest.call(null, xys__5188), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5189.call(null, concat.call(null, x, y), zs)
    };
    var G__5190 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5190__delegate.call(this, x, y, zs)
    };
    G__5190.cljs$lang$maxFixedArity = 2;
    G__5190.cljs$lang$applyTo = function(arglist__5191) {
      var x = cljs.core.first(arglist__5191);
      var y = cljs.core.first(cljs.core.next(arglist__5191));
      var zs = cljs.core.rest(cljs.core.next(arglist__5191));
      return G__5190__delegate(x, y, zs)
    };
    G__5190.cljs$lang$arity$variadic = G__5190__delegate;
    return G__5190
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__5192__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5192 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5192__delegate.call(this, a, b, c, d, more)
    };
    G__5192.cljs$lang$maxFixedArity = 4;
    G__5192.cljs$lang$applyTo = function(arglist__5193) {
      var a = cljs.core.first(arglist__5193);
      var b = cljs.core.first(cljs.core.next(arglist__5193));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5193)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5193))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5193))));
      return G__5192__delegate(a, b, c, d, more)
    };
    G__5192.cljs$lang$arity$variadic = G__5192__delegate;
    return G__5192
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__5194 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5195 = cljs.core._first.call(null, args__5194);
    var args__5196 = cljs.core._rest.call(null, args__5194);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5195)
      }else {
        return f.call(null, a__5195)
      }
    }else {
      var b__5197 = cljs.core._first.call(null, args__5196);
      var args__5198 = cljs.core._rest.call(null, args__5196);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5195, b__5197)
        }else {
          return f.call(null, a__5195, b__5197)
        }
      }else {
        var c__5199 = cljs.core._first.call(null, args__5198);
        var args__5200 = cljs.core._rest.call(null, args__5198);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5195, b__5197, c__5199)
          }else {
            return f.call(null, a__5195, b__5197, c__5199)
          }
        }else {
          var d__5201 = cljs.core._first.call(null, args__5200);
          var args__5202 = cljs.core._rest.call(null, args__5200);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5195, b__5197, c__5199, d__5201)
            }else {
              return f.call(null, a__5195, b__5197, c__5199, d__5201)
            }
          }else {
            var e__5203 = cljs.core._first.call(null, args__5202);
            var args__5204 = cljs.core._rest.call(null, args__5202);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5195, b__5197, c__5199, d__5201, e__5203)
              }else {
                return f.call(null, a__5195, b__5197, c__5199, d__5201, e__5203)
              }
            }else {
              var f__5205 = cljs.core._first.call(null, args__5204);
              var args__5206 = cljs.core._rest.call(null, args__5204);
              if(argc === 6) {
                if(f__5205.cljs$lang$arity$6) {
                  return f__5205.cljs$lang$arity$6(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205)
                }else {
                  return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205)
                }
              }else {
                var g__5207 = cljs.core._first.call(null, args__5206);
                var args__5208 = cljs.core._rest.call(null, args__5206);
                if(argc === 7) {
                  if(f__5205.cljs$lang$arity$7) {
                    return f__5205.cljs$lang$arity$7(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207)
                  }else {
                    return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207)
                  }
                }else {
                  var h__5209 = cljs.core._first.call(null, args__5208);
                  var args__5210 = cljs.core._rest.call(null, args__5208);
                  if(argc === 8) {
                    if(f__5205.cljs$lang$arity$8) {
                      return f__5205.cljs$lang$arity$8(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209)
                    }else {
                      return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209)
                    }
                  }else {
                    var i__5211 = cljs.core._first.call(null, args__5210);
                    var args__5212 = cljs.core._rest.call(null, args__5210);
                    if(argc === 9) {
                      if(f__5205.cljs$lang$arity$9) {
                        return f__5205.cljs$lang$arity$9(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211)
                      }else {
                        return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211)
                      }
                    }else {
                      var j__5213 = cljs.core._first.call(null, args__5212);
                      var args__5214 = cljs.core._rest.call(null, args__5212);
                      if(argc === 10) {
                        if(f__5205.cljs$lang$arity$10) {
                          return f__5205.cljs$lang$arity$10(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213)
                        }else {
                          return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213)
                        }
                      }else {
                        var k__5215 = cljs.core._first.call(null, args__5214);
                        var args__5216 = cljs.core._rest.call(null, args__5214);
                        if(argc === 11) {
                          if(f__5205.cljs$lang$arity$11) {
                            return f__5205.cljs$lang$arity$11(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215)
                          }else {
                            return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215)
                          }
                        }else {
                          var l__5217 = cljs.core._first.call(null, args__5216);
                          var args__5218 = cljs.core._rest.call(null, args__5216);
                          if(argc === 12) {
                            if(f__5205.cljs$lang$arity$12) {
                              return f__5205.cljs$lang$arity$12(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217)
                            }else {
                              return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217)
                            }
                          }else {
                            var m__5219 = cljs.core._first.call(null, args__5218);
                            var args__5220 = cljs.core._rest.call(null, args__5218);
                            if(argc === 13) {
                              if(f__5205.cljs$lang$arity$13) {
                                return f__5205.cljs$lang$arity$13(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219)
                              }else {
                                return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219)
                              }
                            }else {
                              var n__5221 = cljs.core._first.call(null, args__5220);
                              var args__5222 = cljs.core._rest.call(null, args__5220);
                              if(argc === 14) {
                                if(f__5205.cljs$lang$arity$14) {
                                  return f__5205.cljs$lang$arity$14(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221)
                                }else {
                                  return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221)
                                }
                              }else {
                                var o__5223 = cljs.core._first.call(null, args__5222);
                                var args__5224 = cljs.core._rest.call(null, args__5222);
                                if(argc === 15) {
                                  if(f__5205.cljs$lang$arity$15) {
                                    return f__5205.cljs$lang$arity$15(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223)
                                  }else {
                                    return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223)
                                  }
                                }else {
                                  var p__5225 = cljs.core._first.call(null, args__5224);
                                  var args__5226 = cljs.core._rest.call(null, args__5224);
                                  if(argc === 16) {
                                    if(f__5205.cljs$lang$arity$16) {
                                      return f__5205.cljs$lang$arity$16(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225)
                                    }else {
                                      return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225)
                                    }
                                  }else {
                                    var q__5227 = cljs.core._first.call(null, args__5226);
                                    var args__5228 = cljs.core._rest.call(null, args__5226);
                                    if(argc === 17) {
                                      if(f__5205.cljs$lang$arity$17) {
                                        return f__5205.cljs$lang$arity$17(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225, q__5227)
                                      }else {
                                        return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225, q__5227)
                                      }
                                    }else {
                                      var r__5229 = cljs.core._first.call(null, args__5228);
                                      var args__5230 = cljs.core._rest.call(null, args__5228);
                                      if(argc === 18) {
                                        if(f__5205.cljs$lang$arity$18) {
                                          return f__5205.cljs$lang$arity$18(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225, q__5227, r__5229)
                                        }else {
                                          return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225, q__5227, r__5229)
                                        }
                                      }else {
                                        var s__5231 = cljs.core._first.call(null, args__5230);
                                        var args__5232 = cljs.core._rest.call(null, args__5230);
                                        if(argc === 19) {
                                          if(f__5205.cljs$lang$arity$19) {
                                            return f__5205.cljs$lang$arity$19(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225, q__5227, r__5229, s__5231)
                                          }else {
                                            return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225, q__5227, r__5229, s__5231)
                                          }
                                        }else {
                                          var t__5233 = cljs.core._first.call(null, args__5232);
                                          var args__5234 = cljs.core._rest.call(null, args__5232);
                                          if(argc === 20) {
                                            if(f__5205.cljs$lang$arity$20) {
                                              return f__5205.cljs$lang$arity$20(a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225, q__5227, r__5229, s__5231, t__5233)
                                            }else {
                                              return f__5205.call(null, a__5195, b__5197, c__5199, d__5201, e__5203, f__5205, g__5207, h__5209, i__5211, j__5213, k__5215, l__5217, m__5219, n__5221, o__5223, p__5225, q__5227, r__5229, s__5231, t__5233)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__5235 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5236 = cljs.core.bounded_count.call(null, args, fixed_arity__5235 + 1);
      if(bc__5236 <= fixed_arity__5235) {
        return cljs.core.apply_to.call(null, f, bc__5236, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5237 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5238 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5239 = cljs.core.bounded_count.call(null, arglist__5237, fixed_arity__5238 + 1);
      if(bc__5239 <= fixed_arity__5238) {
        return cljs.core.apply_to.call(null, f, bc__5239, arglist__5237)
      }else {
        return f.cljs$lang$applyTo(arglist__5237)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5237))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5240 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5241 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5242 = cljs.core.bounded_count.call(null, arglist__5240, fixed_arity__5241 + 1);
      if(bc__5242 <= fixed_arity__5241) {
        return cljs.core.apply_to.call(null, f, bc__5242, arglist__5240)
      }else {
        return f.cljs$lang$applyTo(arglist__5240)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5240))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5243 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5244 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5245 = cljs.core.bounded_count.call(null, arglist__5243, fixed_arity__5244 + 1);
      if(bc__5245 <= fixed_arity__5244) {
        return cljs.core.apply_to.call(null, f, bc__5245, arglist__5243)
      }else {
        return f.cljs$lang$applyTo(arglist__5243)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5243))
    }
  };
  var apply__6 = function() {
    var G__5249__delegate = function(f, a, b, c, d, args) {
      var arglist__5246 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5247 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5248 = cljs.core.bounded_count.call(null, arglist__5246, fixed_arity__5247 + 1);
        if(bc__5248 <= fixed_arity__5247) {
          return cljs.core.apply_to.call(null, f, bc__5248, arglist__5246)
        }else {
          return f.cljs$lang$applyTo(arglist__5246)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5246))
      }
    };
    var G__5249 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5249__delegate.call(this, f, a, b, c, d, args)
    };
    G__5249.cljs$lang$maxFixedArity = 5;
    G__5249.cljs$lang$applyTo = function(arglist__5250) {
      var f = cljs.core.first(arglist__5250);
      var a = cljs.core.first(cljs.core.next(arglist__5250));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5250)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5250))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5250)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5250)))));
      return G__5249__delegate(f, a, b, c, d, args)
    };
    G__5249.cljs$lang$arity$variadic = G__5249__delegate;
    return G__5249
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__5251) {
    var obj = cljs.core.first(arglist__5251);
    var f = cljs.core.first(cljs.core.next(arglist__5251));
    var args = cljs.core.rest(cljs.core.next(arglist__5251));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__5252__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5252 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5252__delegate.call(this, x, y, more)
    };
    G__5252.cljs$lang$maxFixedArity = 2;
    G__5252.cljs$lang$applyTo = function(arglist__5253) {
      var x = cljs.core.first(arglist__5253);
      var y = cljs.core.first(cljs.core.next(arglist__5253));
      var more = cljs.core.rest(cljs.core.next(arglist__5253));
      return G__5252__delegate(x, y, more)
    };
    G__5252.cljs$lang$arity$variadic = G__5252__delegate;
    return G__5252
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__5254 = pred;
        var G__5255 = cljs.core.next.call(null, coll);
        pred = G__5254;
        coll = G__5255;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____5256 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____5256)) {
        return or__3548__auto____5256
      }else {
        var G__5257 = pred;
        var G__5258 = cljs.core.next.call(null, coll);
        pred = G__5257;
        coll = G__5258;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__5259 = null;
    var G__5259__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5259__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5259__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5259__3 = function() {
      var G__5260__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5260 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5260__delegate.call(this, x, y, zs)
      };
      G__5260.cljs$lang$maxFixedArity = 2;
      G__5260.cljs$lang$applyTo = function(arglist__5261) {
        var x = cljs.core.first(arglist__5261);
        var y = cljs.core.first(cljs.core.next(arglist__5261));
        var zs = cljs.core.rest(cljs.core.next(arglist__5261));
        return G__5260__delegate(x, y, zs)
      };
      G__5260.cljs$lang$arity$variadic = G__5260__delegate;
      return G__5260
    }();
    G__5259 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5259__0.call(this);
        case 1:
          return G__5259__1.call(this, x);
        case 2:
          return G__5259__2.call(this, x, y);
        default:
          return G__5259__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5259.cljs$lang$maxFixedArity = 2;
    G__5259.cljs$lang$applyTo = G__5259__3.cljs$lang$applyTo;
    return G__5259
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5262__delegate = function(args) {
      return x
    };
    var G__5262 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5262__delegate.call(this, args)
    };
    G__5262.cljs$lang$maxFixedArity = 0;
    G__5262.cljs$lang$applyTo = function(arglist__5263) {
      var args = cljs.core.seq(arglist__5263);
      return G__5262__delegate(args)
    };
    G__5262.cljs$lang$arity$variadic = G__5262__delegate;
    return G__5262
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__5267 = null;
      var G__5267__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5267__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5267__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5267__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5267__4 = function() {
        var G__5268__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5268 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5268__delegate.call(this, x, y, z, args)
        };
        G__5268.cljs$lang$maxFixedArity = 3;
        G__5268.cljs$lang$applyTo = function(arglist__5269) {
          var x = cljs.core.first(arglist__5269);
          var y = cljs.core.first(cljs.core.next(arglist__5269));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5269)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5269)));
          return G__5268__delegate(x, y, z, args)
        };
        G__5268.cljs$lang$arity$variadic = G__5268__delegate;
        return G__5268
      }();
      G__5267 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5267__0.call(this);
          case 1:
            return G__5267__1.call(this, x);
          case 2:
            return G__5267__2.call(this, x, y);
          case 3:
            return G__5267__3.call(this, x, y, z);
          default:
            return G__5267__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5267.cljs$lang$maxFixedArity = 3;
      G__5267.cljs$lang$applyTo = G__5267__4.cljs$lang$applyTo;
      return G__5267
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5270 = null;
      var G__5270__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5270__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5270__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5270__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5270__4 = function() {
        var G__5271__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5271 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5271__delegate.call(this, x, y, z, args)
        };
        G__5271.cljs$lang$maxFixedArity = 3;
        G__5271.cljs$lang$applyTo = function(arglist__5272) {
          var x = cljs.core.first(arglist__5272);
          var y = cljs.core.first(cljs.core.next(arglist__5272));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5272)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5272)));
          return G__5271__delegate(x, y, z, args)
        };
        G__5271.cljs$lang$arity$variadic = G__5271__delegate;
        return G__5271
      }();
      G__5270 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5270__0.call(this);
          case 1:
            return G__5270__1.call(this, x);
          case 2:
            return G__5270__2.call(this, x, y);
          case 3:
            return G__5270__3.call(this, x, y, z);
          default:
            return G__5270__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5270.cljs$lang$maxFixedArity = 3;
      G__5270.cljs$lang$applyTo = G__5270__4.cljs$lang$applyTo;
      return G__5270
    }()
  };
  var comp__4 = function() {
    var G__5273__delegate = function(f1, f2, f3, fs) {
      var fs__5264 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5274__delegate = function(args) {
          var ret__5265 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5264), args);
          var fs__5266 = cljs.core.next.call(null, fs__5264);
          while(true) {
            if(cljs.core.truth_(fs__5266)) {
              var G__5275 = cljs.core.first.call(null, fs__5266).call(null, ret__5265);
              var G__5276 = cljs.core.next.call(null, fs__5266);
              ret__5265 = G__5275;
              fs__5266 = G__5276;
              continue
            }else {
              return ret__5265
            }
            break
          }
        };
        var G__5274 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5274__delegate.call(this, args)
        };
        G__5274.cljs$lang$maxFixedArity = 0;
        G__5274.cljs$lang$applyTo = function(arglist__5277) {
          var args = cljs.core.seq(arglist__5277);
          return G__5274__delegate(args)
        };
        G__5274.cljs$lang$arity$variadic = G__5274__delegate;
        return G__5274
      }()
    };
    var G__5273 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5273__delegate.call(this, f1, f2, f3, fs)
    };
    G__5273.cljs$lang$maxFixedArity = 3;
    G__5273.cljs$lang$applyTo = function(arglist__5278) {
      var f1 = cljs.core.first(arglist__5278);
      var f2 = cljs.core.first(cljs.core.next(arglist__5278));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5278)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5278)));
      return G__5273__delegate(f1, f2, f3, fs)
    };
    G__5273.cljs$lang$arity$variadic = G__5273__delegate;
    return G__5273
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__5279__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5279 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5279__delegate.call(this, args)
      };
      G__5279.cljs$lang$maxFixedArity = 0;
      G__5279.cljs$lang$applyTo = function(arglist__5280) {
        var args = cljs.core.seq(arglist__5280);
        return G__5279__delegate(args)
      };
      G__5279.cljs$lang$arity$variadic = G__5279__delegate;
      return G__5279
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5281__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5281 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5281__delegate.call(this, args)
      };
      G__5281.cljs$lang$maxFixedArity = 0;
      G__5281.cljs$lang$applyTo = function(arglist__5282) {
        var args = cljs.core.seq(arglist__5282);
        return G__5281__delegate(args)
      };
      G__5281.cljs$lang$arity$variadic = G__5281__delegate;
      return G__5281
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5283__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5283 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5283__delegate.call(this, args)
      };
      G__5283.cljs$lang$maxFixedArity = 0;
      G__5283.cljs$lang$applyTo = function(arglist__5284) {
        var args = cljs.core.seq(arglist__5284);
        return G__5283__delegate(args)
      };
      G__5283.cljs$lang$arity$variadic = G__5283__delegate;
      return G__5283
    }()
  };
  var partial__5 = function() {
    var G__5285__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5286__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5286 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5286__delegate.call(this, args)
        };
        G__5286.cljs$lang$maxFixedArity = 0;
        G__5286.cljs$lang$applyTo = function(arglist__5287) {
          var args = cljs.core.seq(arglist__5287);
          return G__5286__delegate(args)
        };
        G__5286.cljs$lang$arity$variadic = G__5286__delegate;
        return G__5286
      }()
    };
    var G__5285 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5285__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5285.cljs$lang$maxFixedArity = 4;
    G__5285.cljs$lang$applyTo = function(arglist__5288) {
      var f = cljs.core.first(arglist__5288);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5288));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5288)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5288))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5288))));
      return G__5285__delegate(f, arg1, arg2, arg3, more)
    };
    G__5285.cljs$lang$arity$variadic = G__5285__delegate;
    return G__5285
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__5289 = null;
      var G__5289__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5289__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5289__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5289__4 = function() {
        var G__5290__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5290 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5290__delegate.call(this, a, b, c, ds)
        };
        G__5290.cljs$lang$maxFixedArity = 3;
        G__5290.cljs$lang$applyTo = function(arglist__5291) {
          var a = cljs.core.first(arglist__5291);
          var b = cljs.core.first(cljs.core.next(arglist__5291));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5291)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5291)));
          return G__5290__delegate(a, b, c, ds)
        };
        G__5290.cljs$lang$arity$variadic = G__5290__delegate;
        return G__5290
      }();
      G__5289 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5289__1.call(this, a);
          case 2:
            return G__5289__2.call(this, a, b);
          case 3:
            return G__5289__3.call(this, a, b, c);
          default:
            return G__5289__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5289.cljs$lang$maxFixedArity = 3;
      G__5289.cljs$lang$applyTo = G__5289__4.cljs$lang$applyTo;
      return G__5289
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5292 = null;
      var G__5292__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5292__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5292__4 = function() {
        var G__5293__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5293 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5293__delegate.call(this, a, b, c, ds)
        };
        G__5293.cljs$lang$maxFixedArity = 3;
        G__5293.cljs$lang$applyTo = function(arglist__5294) {
          var a = cljs.core.first(arglist__5294);
          var b = cljs.core.first(cljs.core.next(arglist__5294));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5294)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5294)));
          return G__5293__delegate(a, b, c, ds)
        };
        G__5293.cljs$lang$arity$variadic = G__5293__delegate;
        return G__5293
      }();
      G__5292 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5292__2.call(this, a, b);
          case 3:
            return G__5292__3.call(this, a, b, c);
          default:
            return G__5292__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5292.cljs$lang$maxFixedArity = 3;
      G__5292.cljs$lang$applyTo = G__5292__4.cljs$lang$applyTo;
      return G__5292
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5295 = null;
      var G__5295__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5295__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5295__4 = function() {
        var G__5296__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5296 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5296__delegate.call(this, a, b, c, ds)
        };
        G__5296.cljs$lang$maxFixedArity = 3;
        G__5296.cljs$lang$applyTo = function(arglist__5297) {
          var a = cljs.core.first(arglist__5297);
          var b = cljs.core.first(cljs.core.next(arglist__5297));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5297)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5297)));
          return G__5296__delegate(a, b, c, ds)
        };
        G__5296.cljs$lang$arity$variadic = G__5296__delegate;
        return G__5296
      }();
      G__5295 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5295__2.call(this, a, b);
          case 3:
            return G__5295__3.call(this, a, b, c);
          default:
            return G__5295__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5295.cljs$lang$maxFixedArity = 3;
      G__5295.cljs$lang$applyTo = G__5295__4.cljs$lang$applyTo;
      return G__5295
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__5300 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5298 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5298)) {
        var s__5299 = temp__3698__auto____5298;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5299)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5299)))
      }else {
        return null
      }
    })
  };
  return mapi__5300.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5301 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5301)) {
      var s__5302 = temp__3698__auto____5301;
      var x__5303 = f.call(null, cljs.core.first.call(null, s__5302));
      if(x__5303 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5302))
      }else {
        return cljs.core.cons.call(null, x__5303, keep.call(null, f, cljs.core.rest.call(null, s__5302)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5313 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5310 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5310)) {
        var s__5311 = temp__3698__auto____5310;
        var x__5312 = f.call(null, idx, cljs.core.first.call(null, s__5311));
        if(x__5312 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5311))
        }else {
          return cljs.core.cons.call(null, x__5312, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5311)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5313.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5320 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5320)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____5320
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5321 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5321)) {
            var and__3546__auto____5322 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5322)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____5322
            }
          }else {
            return and__3546__auto____5321
          }
        }())
      };
      var ep1__4 = function() {
        var G__5358__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5323 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5323)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____5323
            }
          }())
        };
        var G__5358 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5358__delegate.call(this, x, y, z, args)
        };
        G__5358.cljs$lang$maxFixedArity = 3;
        G__5358.cljs$lang$applyTo = function(arglist__5359) {
          var x = cljs.core.first(arglist__5359);
          var y = cljs.core.first(cljs.core.next(arglist__5359));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5359)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5359)));
          return G__5358__delegate(x, y, z, args)
        };
        G__5358.cljs$lang$arity$variadic = G__5358__delegate;
        return G__5358
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5324 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5324)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____5324
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5325 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5325)) {
            var and__3546__auto____5326 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5326)) {
              var and__3546__auto____5327 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5327)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____5327
              }
            }else {
              return and__3546__auto____5326
            }
          }else {
            return and__3546__auto____5325
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5328 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5328)) {
            var and__3546__auto____5329 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____5329)) {
              var and__3546__auto____5330 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____5330)) {
                var and__3546__auto____5331 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____5331)) {
                  var and__3546__auto____5332 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5332)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____5332
                  }
                }else {
                  return and__3546__auto____5331
                }
              }else {
                return and__3546__auto____5330
              }
            }else {
              return and__3546__auto____5329
            }
          }else {
            return and__3546__auto____5328
          }
        }())
      };
      var ep2__4 = function() {
        var G__5360__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5333 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5333)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5304_SHARP_) {
                var and__3546__auto____5334 = p1.call(null, p1__5304_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5334)) {
                  return p2.call(null, p1__5304_SHARP_)
                }else {
                  return and__3546__auto____5334
                }
              }, args)
            }else {
              return and__3546__auto____5333
            }
          }())
        };
        var G__5360 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5360__delegate.call(this, x, y, z, args)
        };
        G__5360.cljs$lang$maxFixedArity = 3;
        G__5360.cljs$lang$applyTo = function(arglist__5361) {
          var x = cljs.core.first(arglist__5361);
          var y = cljs.core.first(cljs.core.next(arglist__5361));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5361)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5361)));
          return G__5360__delegate(x, y, z, args)
        };
        G__5360.cljs$lang$arity$variadic = G__5360__delegate;
        return G__5360
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5335 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5335)) {
            var and__3546__auto____5336 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5336)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____5336
            }
          }else {
            return and__3546__auto____5335
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5337 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5337)) {
            var and__3546__auto____5338 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5338)) {
              var and__3546__auto____5339 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5339)) {
                var and__3546__auto____5340 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5340)) {
                  var and__3546__auto____5341 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5341)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____5341
                  }
                }else {
                  return and__3546__auto____5340
                }
              }else {
                return and__3546__auto____5339
              }
            }else {
              return and__3546__auto____5338
            }
          }else {
            return and__3546__auto____5337
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____5342 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____5342)) {
            var and__3546__auto____5343 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5343)) {
              var and__3546__auto____5344 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____5344)) {
                var and__3546__auto____5345 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____5345)) {
                  var and__3546__auto____5346 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____5346)) {
                    var and__3546__auto____5347 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____5347)) {
                      var and__3546__auto____5348 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____5348)) {
                        var and__3546__auto____5349 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____5349)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____5349
                        }
                      }else {
                        return and__3546__auto____5348
                      }
                    }else {
                      return and__3546__auto____5347
                    }
                  }else {
                    return and__3546__auto____5346
                  }
                }else {
                  return and__3546__auto____5345
                }
              }else {
                return and__3546__auto____5344
              }
            }else {
              return and__3546__auto____5343
            }
          }else {
            return and__3546__auto____5342
          }
        }())
      };
      var ep3__4 = function() {
        var G__5362__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____5350 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____5350)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5305_SHARP_) {
                var and__3546__auto____5351 = p1.call(null, p1__5305_SHARP_);
                if(cljs.core.truth_(and__3546__auto____5351)) {
                  var and__3546__auto____5352 = p2.call(null, p1__5305_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____5352)) {
                    return p3.call(null, p1__5305_SHARP_)
                  }else {
                    return and__3546__auto____5352
                  }
                }else {
                  return and__3546__auto____5351
                }
              }, args)
            }else {
              return and__3546__auto____5350
            }
          }())
        };
        var G__5362 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5362__delegate.call(this, x, y, z, args)
        };
        G__5362.cljs$lang$maxFixedArity = 3;
        G__5362.cljs$lang$applyTo = function(arglist__5363) {
          var x = cljs.core.first(arglist__5363);
          var y = cljs.core.first(cljs.core.next(arglist__5363));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5363)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5363)));
          return G__5362__delegate(x, y, z, args)
        };
        G__5362.cljs$lang$arity$variadic = G__5362__delegate;
        return G__5362
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__5364__delegate = function(p1, p2, p3, ps) {
      var ps__5353 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5306_SHARP_) {
            return p1__5306_SHARP_.call(null, x)
          }, ps__5353)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5307_SHARP_) {
            var and__3546__auto____5354 = p1__5307_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5354)) {
              return p1__5307_SHARP_.call(null, y)
            }else {
              return and__3546__auto____5354
            }
          }, ps__5353)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5308_SHARP_) {
            var and__3546__auto____5355 = p1__5308_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____5355)) {
              var and__3546__auto____5356 = p1__5308_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____5356)) {
                return p1__5308_SHARP_.call(null, z)
              }else {
                return and__3546__auto____5356
              }
            }else {
              return and__3546__auto____5355
            }
          }, ps__5353)
        };
        var epn__4 = function() {
          var G__5365__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____5357 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____5357)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5309_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5309_SHARP_, args)
                }, ps__5353)
              }else {
                return and__3546__auto____5357
              }
            }())
          };
          var G__5365 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5365__delegate.call(this, x, y, z, args)
          };
          G__5365.cljs$lang$maxFixedArity = 3;
          G__5365.cljs$lang$applyTo = function(arglist__5366) {
            var x = cljs.core.first(arglist__5366);
            var y = cljs.core.first(cljs.core.next(arglist__5366));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5366)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5366)));
            return G__5365__delegate(x, y, z, args)
          };
          G__5365.cljs$lang$arity$variadic = G__5365__delegate;
          return G__5365
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__5364 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5364__delegate.call(this, p1, p2, p3, ps)
    };
    G__5364.cljs$lang$maxFixedArity = 3;
    G__5364.cljs$lang$applyTo = function(arglist__5367) {
      var p1 = cljs.core.first(arglist__5367);
      var p2 = cljs.core.first(cljs.core.next(arglist__5367));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5367)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5367)));
      return G__5364__delegate(p1, p2, p3, ps)
    };
    G__5364.cljs$lang$arity$variadic = G__5364__delegate;
    return G__5364
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3548__auto____5369 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5369)) {
          return or__3548__auto____5369
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3548__auto____5370 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5370)) {
          return or__3548__auto____5370
        }else {
          var or__3548__auto____5371 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5371)) {
            return or__3548__auto____5371
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5407__delegate = function(x, y, z, args) {
          var or__3548__auto____5372 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5372)) {
            return or__3548__auto____5372
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5407 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5407__delegate.call(this, x, y, z, args)
        };
        G__5407.cljs$lang$maxFixedArity = 3;
        G__5407.cljs$lang$applyTo = function(arglist__5408) {
          var x = cljs.core.first(arglist__5408);
          var y = cljs.core.first(cljs.core.next(arglist__5408));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5408)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5408)));
          return G__5407__delegate(x, y, z, args)
        };
        G__5407.cljs$lang$arity$variadic = G__5407__delegate;
        return G__5407
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3548__auto____5373 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5373)) {
          return or__3548__auto____5373
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3548__auto____5374 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5374)) {
          return or__3548__auto____5374
        }else {
          var or__3548__auto____5375 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5375)) {
            return or__3548__auto____5375
          }else {
            var or__3548__auto____5376 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5376)) {
              return or__3548__auto____5376
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3548__auto____5377 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5377)) {
          return or__3548__auto____5377
        }else {
          var or__3548__auto____5378 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____5378)) {
            return or__3548__auto____5378
          }else {
            var or__3548__auto____5379 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____5379)) {
              return or__3548__auto____5379
            }else {
              var or__3548__auto____5380 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____5380)) {
                return or__3548__auto____5380
              }else {
                var or__3548__auto____5381 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5381)) {
                  return or__3548__auto____5381
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5409__delegate = function(x, y, z, args) {
          var or__3548__auto____5382 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5382)) {
            return or__3548__auto____5382
          }else {
            return cljs.core.some.call(null, function(p1__5314_SHARP_) {
              var or__3548__auto____5383 = p1.call(null, p1__5314_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5383)) {
                return or__3548__auto____5383
              }else {
                return p2.call(null, p1__5314_SHARP_)
              }
            }, args)
          }
        };
        var G__5409 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5409__delegate.call(this, x, y, z, args)
        };
        G__5409.cljs$lang$maxFixedArity = 3;
        G__5409.cljs$lang$applyTo = function(arglist__5410) {
          var x = cljs.core.first(arglist__5410);
          var y = cljs.core.first(cljs.core.next(arglist__5410));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5410)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5410)));
          return G__5409__delegate(x, y, z, args)
        };
        G__5409.cljs$lang$arity$variadic = G__5409__delegate;
        return G__5409
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3548__auto____5384 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5384)) {
          return or__3548__auto____5384
        }else {
          var or__3548__auto____5385 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5385)) {
            return or__3548__auto____5385
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3548__auto____5386 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5386)) {
          return or__3548__auto____5386
        }else {
          var or__3548__auto____5387 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5387)) {
            return or__3548__auto____5387
          }else {
            var or__3548__auto____5388 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5388)) {
              return or__3548__auto____5388
            }else {
              var or__3548__auto____5389 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5389)) {
                return or__3548__auto____5389
              }else {
                var or__3548__auto____5390 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5390)) {
                  return or__3548__auto____5390
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3548__auto____5391 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____5391)) {
          return or__3548__auto____5391
        }else {
          var or__3548__auto____5392 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____5392)) {
            return or__3548__auto____5392
          }else {
            var or__3548__auto____5393 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5393)) {
              return or__3548__auto____5393
            }else {
              var or__3548__auto____5394 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5394)) {
                return or__3548__auto____5394
              }else {
                var or__3548__auto____5395 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____5395)) {
                  return or__3548__auto____5395
                }else {
                  var or__3548__auto____5396 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____5396)) {
                    return or__3548__auto____5396
                  }else {
                    var or__3548__auto____5397 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____5397)) {
                      return or__3548__auto____5397
                    }else {
                      var or__3548__auto____5398 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____5398)) {
                        return or__3548__auto____5398
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__5411__delegate = function(x, y, z, args) {
          var or__3548__auto____5399 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____5399)) {
            return or__3548__auto____5399
          }else {
            return cljs.core.some.call(null, function(p1__5315_SHARP_) {
              var or__3548__auto____5400 = p1.call(null, p1__5315_SHARP_);
              if(cljs.core.truth_(or__3548__auto____5400)) {
                return or__3548__auto____5400
              }else {
                var or__3548__auto____5401 = p2.call(null, p1__5315_SHARP_);
                if(cljs.core.truth_(or__3548__auto____5401)) {
                  return or__3548__auto____5401
                }else {
                  return p3.call(null, p1__5315_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5411 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5411__delegate.call(this, x, y, z, args)
        };
        G__5411.cljs$lang$maxFixedArity = 3;
        G__5411.cljs$lang$applyTo = function(arglist__5412) {
          var x = cljs.core.first(arglist__5412);
          var y = cljs.core.first(cljs.core.next(arglist__5412));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5412)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5412)));
          return G__5411__delegate(x, y, z, args)
        };
        G__5411.cljs$lang$arity$variadic = G__5411__delegate;
        return G__5411
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__5413__delegate = function(p1, p2, p3, ps) {
      var ps__5402 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5316_SHARP_) {
            return p1__5316_SHARP_.call(null, x)
          }, ps__5402)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5317_SHARP_) {
            var or__3548__auto____5403 = p1__5317_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5403)) {
              return or__3548__auto____5403
            }else {
              return p1__5317_SHARP_.call(null, y)
            }
          }, ps__5402)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5318_SHARP_) {
            var or__3548__auto____5404 = p1__5318_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____5404)) {
              return or__3548__auto____5404
            }else {
              var or__3548__auto____5405 = p1__5318_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____5405)) {
                return or__3548__auto____5405
              }else {
                return p1__5318_SHARP_.call(null, z)
              }
            }
          }, ps__5402)
        };
        var spn__4 = function() {
          var G__5414__delegate = function(x, y, z, args) {
            var or__3548__auto____5406 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____5406)) {
              return or__3548__auto____5406
            }else {
              return cljs.core.some.call(null, function(p1__5319_SHARP_) {
                return cljs.core.some.call(null, p1__5319_SHARP_, args)
              }, ps__5402)
            }
          };
          var G__5414 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5414__delegate.call(this, x, y, z, args)
          };
          G__5414.cljs$lang$maxFixedArity = 3;
          G__5414.cljs$lang$applyTo = function(arglist__5415) {
            var x = cljs.core.first(arglist__5415);
            var y = cljs.core.first(cljs.core.next(arglist__5415));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5415)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5415)));
            return G__5414__delegate(x, y, z, args)
          };
          G__5414.cljs$lang$arity$variadic = G__5414__delegate;
          return G__5414
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__5413 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5413__delegate.call(this, p1, p2, p3, ps)
    };
    G__5413.cljs$lang$maxFixedArity = 3;
    G__5413.cljs$lang$applyTo = function(arglist__5416) {
      var p1 = cljs.core.first(arglist__5416);
      var p2 = cljs.core.first(cljs.core.next(arglist__5416));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5416)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5416)));
      return G__5413__delegate(p1, p2, p3, ps)
    };
    G__5413.cljs$lang$arity$variadic = G__5413__delegate;
    return G__5413
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5417 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5417)) {
        var s__5418 = temp__3698__auto____5417;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5418)), map.call(null, f, cljs.core.rest.call(null, s__5418)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5419 = cljs.core.seq.call(null, c1);
      var s2__5420 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5421 = s1__5419;
        if(cljs.core.truth_(and__3546__auto____5421)) {
          return s2__5420
        }else {
          return and__3546__auto____5421
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5419), cljs.core.first.call(null, s2__5420)), map.call(null, f, cljs.core.rest.call(null, s1__5419), cljs.core.rest.call(null, s2__5420)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5422 = cljs.core.seq.call(null, c1);
      var s2__5423 = cljs.core.seq.call(null, c2);
      var s3__5424 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5425 = s1__5422;
        if(cljs.core.truth_(and__3546__auto____5425)) {
          var and__3546__auto____5426 = s2__5423;
          if(cljs.core.truth_(and__3546__auto____5426)) {
            return s3__5424
          }else {
            return and__3546__auto____5426
          }
        }else {
          return and__3546__auto____5425
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5422), cljs.core.first.call(null, s2__5423), cljs.core.first.call(null, s3__5424)), map.call(null, f, cljs.core.rest.call(null, s1__5422), cljs.core.rest.call(null, s2__5423), cljs.core.rest.call(null, s3__5424)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5429__delegate = function(f, c1, c2, c3, colls) {
      var step__5428 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5427 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5427)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5427), step.call(null, map.call(null, cljs.core.rest, ss__5427)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5368_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5368_SHARP_)
      }, step__5428.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5429 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5429__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5429.cljs$lang$maxFixedArity = 4;
    G__5429.cljs$lang$applyTo = function(arglist__5430) {
      var f = cljs.core.first(arglist__5430);
      var c1 = cljs.core.first(cljs.core.next(arglist__5430));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5430)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5430))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5430))));
      return G__5429__delegate(f, c1, c2, c3, colls)
    };
    G__5429.cljs$lang$arity$variadic = G__5429__delegate;
    return G__5429
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3698__auto____5431 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5431)) {
        var s__5432 = temp__3698__auto____5431;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5432), take.call(null, n - 1, cljs.core.rest.call(null, s__5432)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5435 = function(n, coll) {
    while(true) {
      var s__5433 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5434 = n > 0;
        if(and__3546__auto____5434) {
          return s__5433
        }else {
          return and__3546__auto____5434
        }
      }())) {
        var G__5436 = n - 1;
        var G__5437 = cljs.core.rest.call(null, s__5433);
        n = G__5436;
        coll = G__5437;
        continue
      }else {
        return s__5433
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5435.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__5438 = cljs.core.seq.call(null, coll);
  var lead__5439 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5439)) {
      var G__5440 = cljs.core.next.call(null, s__5438);
      var G__5441 = cljs.core.next.call(null, lead__5439);
      s__5438 = G__5440;
      lead__5439 = G__5441;
      continue
    }else {
      return s__5438
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5444 = function(pred, coll) {
    while(true) {
      var s__5442 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5443 = s__5442;
        if(cljs.core.truth_(and__3546__auto____5443)) {
          return pred.call(null, cljs.core.first.call(null, s__5442))
        }else {
          return and__3546__auto____5443
        }
      }())) {
        var G__5445 = pred;
        var G__5446 = cljs.core.rest.call(null, s__5442);
        pred = G__5445;
        coll = G__5446;
        continue
      }else {
        return s__5442
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5444.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5447 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5447)) {
      var s__5448 = temp__3698__auto____5447;
      return cljs.core.concat.call(null, s__5448, cycle.call(null, s__5448))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5449 = cljs.core.seq.call(null, c1);
      var s2__5450 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____5451 = s1__5449;
        if(cljs.core.truth_(and__3546__auto____5451)) {
          return s2__5450
        }else {
          return and__3546__auto____5451
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5449), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5450), interleave.call(null, cljs.core.rest.call(null, s1__5449), cljs.core.rest.call(null, s2__5450))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5453__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5452 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5452)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5452), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5452)))
        }else {
          return null
        }
      })
    };
    var G__5453 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5453__delegate.call(this, c1, c2, colls)
    };
    G__5453.cljs$lang$maxFixedArity = 2;
    G__5453.cljs$lang$applyTo = function(arglist__5454) {
      var c1 = cljs.core.first(arglist__5454);
      var c2 = cljs.core.first(cljs.core.next(arglist__5454));
      var colls = cljs.core.rest(cljs.core.next(arglist__5454));
      return G__5453__delegate(c1, c2, colls)
    };
    G__5453.cljs$lang$arity$variadic = G__5453__delegate;
    return G__5453
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__5457 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____5455 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____5455)) {
        var coll__5456 = temp__3695__auto____5455;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5456), cat.call(null, cljs.core.rest.call(null, coll__5456), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5457.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5458__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5458 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5458__delegate.call(this, f, coll, colls)
    };
    G__5458.cljs$lang$maxFixedArity = 2;
    G__5458.cljs$lang$applyTo = function(arglist__5459) {
      var f = cljs.core.first(arglist__5459);
      var coll = cljs.core.first(cljs.core.next(arglist__5459));
      var colls = cljs.core.rest(cljs.core.next(arglist__5459));
      return G__5458__delegate(f, coll, colls)
    };
    G__5458.cljs$lang$arity$variadic = G__5458__delegate;
    return G__5458
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____5460 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____5460)) {
      var s__5461 = temp__3698__auto____5460;
      var f__5462 = cljs.core.first.call(null, s__5461);
      var r__5463 = cljs.core.rest.call(null, s__5461);
      if(cljs.core.truth_(pred.call(null, f__5462))) {
        return cljs.core.cons.call(null, f__5462, filter.call(null, pred, r__5463))
      }else {
        return filter.call(null, pred, r__5463)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__5465 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5465.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5464_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5464_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5466__5467 = to;
    if(G__5466__5467 != null) {
      if(function() {
        var or__3548__auto____5468 = G__5466__5467.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3548__auto____5468) {
          return or__3548__auto____5468
        }else {
          return G__5466__5467.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5466__5467.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5466__5467)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5466__5467)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__5469__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5469 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5469__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5469.cljs$lang$maxFixedArity = 4;
    G__5469.cljs$lang$applyTo = function(arglist__5470) {
      var f = cljs.core.first(arglist__5470);
      var c1 = cljs.core.first(cljs.core.next(arglist__5470));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5470)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5470))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5470))));
      return G__5469__delegate(f, c1, c2, c3, colls)
    };
    G__5469.cljs$lang$arity$variadic = G__5469__delegate;
    return G__5469
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5471 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5471)) {
        var s__5472 = temp__3698__auto____5471;
        var p__5473 = cljs.core.take.call(null, n, s__5472);
        if(n === cljs.core.count.call(null, p__5473)) {
          return cljs.core.cons.call(null, p__5473, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5472)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____5474 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____5474)) {
        var s__5475 = temp__3698__auto____5474;
        var p__5476 = cljs.core.take.call(null, n, s__5475);
        if(n === cljs.core.count.call(null, p__5476)) {
          return cljs.core.cons.call(null, p__5476, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5475)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5476, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__5477 = cljs.core.lookup_sentinel;
    var m__5478 = m;
    var ks__5479 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5479)) {
        var m__5480 = cljs.core.get.call(null, m__5478, cljs.core.first.call(null, ks__5479), sentinel__5477);
        if(sentinel__5477 === m__5480) {
          return not_found
        }else {
          var G__5481 = sentinel__5477;
          var G__5482 = m__5480;
          var G__5483 = cljs.core.next.call(null, ks__5479);
          sentinel__5477 = G__5481;
          m__5478 = G__5482;
          ks__5479 = G__5483;
          continue
        }
      }else {
        return m__5478
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__5484, v) {
  var vec__5485__5486 = p__5484;
  var k__5487 = cljs.core.nth.call(null, vec__5485__5486, 0, null);
  var ks__5488 = cljs.core.nthnext.call(null, vec__5485__5486, 1);
  if(cljs.core.truth_(ks__5488)) {
    return cljs.core.assoc.call(null, m, k__5487, assoc_in.call(null, cljs.core.get.call(null, m, k__5487), ks__5488, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5487, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5489, f, args) {
    var vec__5490__5491 = p__5489;
    var k__5492 = cljs.core.nth.call(null, vec__5490__5491, 0, null);
    var ks__5493 = cljs.core.nthnext.call(null, vec__5490__5491, 1);
    if(cljs.core.truth_(ks__5493)) {
      return cljs.core.assoc.call(null, m, k__5492, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5492), ks__5493, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5492, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5492), args))
    }
  };
  var update_in = function(m, p__5489, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5489, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5494) {
    var m = cljs.core.first(arglist__5494);
    var p__5489 = cljs.core.first(cljs.core.next(arglist__5494));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5494)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5494)));
    return update_in__delegate(m, p__5489, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5499 = this;
  var h__364__auto____5500 = this__5499.__hash;
  if(h__364__auto____5500 != null) {
    return h__364__auto____5500
  }else {
    var h__364__auto____5501 = cljs.core.hash_coll.call(null, coll);
    this__5499.__hash = h__364__auto____5501;
    return h__364__auto____5501
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5502 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5503 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5504 = this;
  var new_array__5505 = cljs.core.aclone.call(null, this__5504.array);
  new_array__5505[k] = v;
  return new cljs.core.Vector(this__5504.meta, new_array__5505, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5534 = null;
  var G__5534__2 = function(tsym5497, k) {
    var this__5506 = this;
    var tsym5497__5507 = this;
    var coll__5508 = tsym5497__5507;
    return cljs.core._lookup.call(null, coll__5508, k)
  };
  var G__5534__3 = function(tsym5498, k, not_found) {
    var this__5509 = this;
    var tsym5498__5510 = this;
    var coll__5511 = tsym5498__5510;
    return cljs.core._lookup.call(null, coll__5511, k, not_found)
  };
  G__5534 = function(tsym5498, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5534__2.call(this, tsym5498, k);
      case 3:
        return G__5534__3.call(this, tsym5498, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5534
}();
cljs.core.Vector.prototype.apply = function(tsym5495, args5496) {
  return tsym5495.call.apply(tsym5495, [tsym5495].concat(cljs.core.aclone.call(null, args5496)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5512 = this;
  var new_array__5513 = cljs.core.aclone.call(null, this__5512.array);
  new_array__5513.push(o);
  return new cljs.core.Vector(this__5512.meta, new_array__5513, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5514 = this;
  var this$__5515 = this;
  return cljs.core.pr_str.call(null, this$__5515)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5516 = this;
  return cljs.core.ci_reduce.call(null, this__5516.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5517 = this;
  return cljs.core.ci_reduce.call(null, this__5517.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5518 = this;
  if(this__5518.array.length > 0) {
    var vector_seq__5519 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5518.array.length) {
          return cljs.core.cons.call(null, this__5518.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5519.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5520 = this;
  return this__5520.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5521 = this;
  var count__5522 = this__5521.array.length;
  if(count__5522 > 0) {
    return this__5521.array[count__5522 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5523 = this;
  if(this__5523.array.length > 0) {
    var new_array__5524 = cljs.core.aclone.call(null, this__5523.array);
    new_array__5524.pop();
    return new cljs.core.Vector(this__5523.meta, new_array__5524, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5525 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5526 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5527 = this;
  return new cljs.core.Vector(meta, this__5527.array, this__5527.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5528 = this;
  return this__5528.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5530 = this;
  if(function() {
    var and__3546__auto____5531 = 0 <= n;
    if(and__3546__auto____5531) {
      return n < this__5530.array.length
    }else {
      return and__3546__auto____5531
    }
  }()) {
    return this__5530.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5532 = this;
  if(function() {
    var and__3546__auto____5533 = 0 <= n;
    if(and__3546__auto____5533) {
      return n < this__5532.array.length
    }else {
      return and__3546__auto____5533
    }
  }()) {
    return this__5532.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5529 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5529.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__5535 = pv.cnt;
  if(cnt__5535 < 32) {
    return 0
  }else {
    return cnt__5535 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5536 = level;
  var ret__5537 = node;
  while(true) {
    if(ll__5536 === 0) {
      return ret__5537
    }else {
      var embed__5538 = ret__5537;
      var r__5539 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5540 = cljs.core.pv_aset.call(null, r__5539, 0, embed__5538);
      var G__5541 = ll__5536 - 5;
      var G__5542 = r__5539;
      ll__5536 = G__5541;
      ret__5537 = G__5542;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5543 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5544 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5543, subidx__5544, tailnode);
    return ret__5543
  }else {
    var temp__3695__auto____5545 = cljs.core.pv_aget.call(null, parent, subidx__5544);
    if(cljs.core.truth_(temp__3695__auto____5545)) {
      var child__5546 = temp__3695__auto____5545;
      var node_to_insert__5547 = push_tail.call(null, pv, level - 5, child__5546, tailnode);
      cljs.core.pv_aset.call(null, ret__5543, subidx__5544, node_to_insert__5547);
      return ret__5543
    }else {
      var node_to_insert__5548 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5543, subidx__5544, node_to_insert__5548);
      return ret__5543
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3546__auto____5549 = 0 <= i;
    if(and__3546__auto____5549) {
      return i < pv.cnt
    }else {
      return and__3546__auto____5549
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5550 = pv.root;
      var level__5551 = pv.shift;
      while(true) {
        if(level__5551 > 0) {
          var G__5552 = cljs.core.pv_aget.call(null, node__5550, i >>> level__5551 & 31);
          var G__5553 = level__5551 - 5;
          node__5550 = G__5552;
          level__5551 = G__5553;
          continue
        }else {
          return node__5550.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5554 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5554, i & 31, val);
    return ret__5554
  }else {
    var subidx__5555 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5554, subidx__5555, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5555), i, val));
    return ret__5554
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5556 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5557 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5556));
    if(function() {
      var and__3546__auto____5558 = new_child__5557 == null;
      if(and__3546__auto____5558) {
        return subidx__5556 === 0
      }else {
        return and__3546__auto____5558
      }
    }()) {
      return null
    }else {
      var ret__5559 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5559, subidx__5556, new_child__5557);
      return ret__5559
    }
  }else {
    if(subidx__5556 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5560 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5560, subidx__5556, null);
        return ret__5560
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__5561 = cljs.core._count.call(null, v);
  if(c__5561 > 0) {
    if(void 0 === cljs.core.t5562) {
      cljs.core.t5562 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5562.cljs$lang$type = true;
      cljs.core.t5562.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5562")
      };
      cljs.core.t5562.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5562.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5563 = this;
        return vseq
      };
      cljs.core.t5562.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5562.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5564 = this;
        return cljs.core._nth.call(null, this__5564.v, this__5564.offset)
      };
      cljs.core.t5562.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5565 = this;
        var offset__5566 = this__5565.offset + 1;
        if(offset__5566 < this__5565.c) {
          return this__5565.vector_seq.call(null, this__5565.v, offset__5566)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5562.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5562.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5562.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5567 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5562.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5562.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5562.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5568 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5562.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5562.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__5569 = this;
        return this__5569.__meta__389__auto__
      };
      cljs.core.t5562.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5562.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__5570 = this;
        return new cljs.core.t5562(this__5570.c, this__5570.offset, this__5570.v, this__5570.vector_seq, __meta__389__auto__)
      };
      cljs.core.t5562
    }else {
    }
    return new cljs.core.t5562(c__5561, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5575 = this;
  return new cljs.core.TransientVector(this__5575.cnt, this__5575.shift, cljs.core.tv_editable_root.call(null, this__5575.root), cljs.core.tv_editable_tail.call(null, this__5575.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5576 = this;
  var h__364__auto____5577 = this__5576.__hash;
  if(h__364__auto____5577 != null) {
    return h__364__auto____5577
  }else {
    var h__364__auto____5578 = cljs.core.hash_coll.call(null, coll);
    this__5576.__hash = h__364__auto____5578;
    return h__364__auto____5578
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5579 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5580 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5581 = this;
  if(function() {
    var and__3546__auto____5582 = 0 <= k;
    if(and__3546__auto____5582) {
      return k < this__5581.cnt
    }else {
      return and__3546__auto____5582
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5583 = cljs.core.aclone.call(null, this__5581.tail);
      new_tail__5583[k & 31] = v;
      return new cljs.core.PersistentVector(this__5581.meta, this__5581.cnt, this__5581.shift, this__5581.root, new_tail__5583, null)
    }else {
      return new cljs.core.PersistentVector(this__5581.meta, this__5581.cnt, this__5581.shift, cljs.core.do_assoc.call(null, coll, this__5581.shift, this__5581.root, k, v), this__5581.tail, null)
    }
  }else {
    if(k === this__5581.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5581.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5628 = null;
  var G__5628__2 = function(tsym5573, k) {
    var this__5584 = this;
    var tsym5573__5585 = this;
    var coll__5586 = tsym5573__5585;
    return cljs.core._lookup.call(null, coll__5586, k)
  };
  var G__5628__3 = function(tsym5574, k, not_found) {
    var this__5587 = this;
    var tsym5574__5588 = this;
    var coll__5589 = tsym5574__5588;
    return cljs.core._lookup.call(null, coll__5589, k, not_found)
  };
  G__5628 = function(tsym5574, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5628__2.call(this, tsym5574, k);
      case 3:
        return G__5628__3.call(this, tsym5574, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5628
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5571, args5572) {
  return tsym5571.call.apply(tsym5571, [tsym5571].concat(cljs.core.aclone.call(null, args5572)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5590 = this;
  var step_init__5591 = [0, init];
  var i__5592 = 0;
  while(true) {
    if(i__5592 < this__5590.cnt) {
      var arr__5593 = cljs.core.array_for.call(null, v, i__5592);
      var len__5594 = arr__5593.length;
      var init__5598 = function() {
        var j__5595 = 0;
        var init__5596 = step_init__5591[1];
        while(true) {
          if(j__5595 < len__5594) {
            var init__5597 = f.call(null, init__5596, j__5595 + i__5592, arr__5593[j__5595]);
            if(cljs.core.reduced_QMARK_.call(null, init__5597)) {
              return init__5597
            }else {
              var G__5629 = j__5595 + 1;
              var G__5630 = init__5597;
              j__5595 = G__5629;
              init__5596 = G__5630;
              continue
            }
          }else {
            step_init__5591[0] = len__5594;
            step_init__5591[1] = init__5596;
            return init__5596
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5598)) {
        return cljs.core.deref.call(null, init__5598)
      }else {
        var G__5631 = i__5592 + step_init__5591[0];
        i__5592 = G__5631;
        continue
      }
    }else {
      return step_init__5591[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5599 = this;
  if(this__5599.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5600 = cljs.core.aclone.call(null, this__5599.tail);
    new_tail__5600.push(o);
    return new cljs.core.PersistentVector(this__5599.meta, this__5599.cnt + 1, this__5599.shift, this__5599.root, new_tail__5600, null)
  }else {
    var root_overflow_QMARK___5601 = this__5599.cnt >>> 5 > 1 << this__5599.shift;
    var new_shift__5602 = root_overflow_QMARK___5601 ? this__5599.shift + 5 : this__5599.shift;
    var new_root__5604 = root_overflow_QMARK___5601 ? function() {
      var n_r__5603 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5603, 0, this__5599.root);
      cljs.core.pv_aset.call(null, n_r__5603, 1, cljs.core.new_path.call(null, null, this__5599.shift, new cljs.core.VectorNode(null, this__5599.tail)));
      return n_r__5603
    }() : cljs.core.push_tail.call(null, coll, this__5599.shift, this__5599.root, new cljs.core.VectorNode(null, this__5599.tail));
    return new cljs.core.PersistentVector(this__5599.meta, this__5599.cnt + 1, new_shift__5602, new_root__5604, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5605 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5606 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5607 = this;
  var this$__5608 = this;
  return cljs.core.pr_str.call(null, this$__5608)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5609 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5610 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5611 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5612 = this;
  return this__5612.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5613 = this;
  if(this__5613.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5613.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5614 = this;
  if(this__5614.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5614.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5614.meta)
    }else {
      if(1 < this__5614.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5614.meta, this__5614.cnt - 1, this__5614.shift, this__5614.root, this__5614.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5615 = cljs.core.array_for.call(null, coll, this__5614.cnt - 2);
          var nr__5616 = cljs.core.pop_tail.call(null, coll, this__5614.shift, this__5614.root);
          var new_root__5617 = nr__5616 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5616;
          var cnt_1__5618 = this__5614.cnt - 1;
          if(function() {
            var and__3546__auto____5619 = 5 < this__5614.shift;
            if(and__3546__auto____5619) {
              return cljs.core.pv_aget.call(null, new_root__5617, 1) == null
            }else {
              return and__3546__auto____5619
            }
          }()) {
            return new cljs.core.PersistentVector(this__5614.meta, cnt_1__5618, this__5614.shift - 5, cljs.core.pv_aget.call(null, new_root__5617, 0), new_tail__5615, null)
          }else {
            return new cljs.core.PersistentVector(this__5614.meta, cnt_1__5618, this__5614.shift, new_root__5617, new_tail__5615, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5621 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5622 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5623 = this;
  return new cljs.core.PersistentVector(meta, this__5623.cnt, this__5623.shift, this__5623.root, this__5623.tail, this__5623.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5624 = this;
  return this__5624.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5625 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5626 = this;
  if(function() {
    var and__3546__auto____5627 = 0 <= n;
    if(and__3546__auto____5627) {
      return n < this__5626.cnt
    }else {
      return and__3546__auto____5627
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5620 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5620.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5632 = cljs.core.seq.call(null, xs);
  var out__5633 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5632)) {
      var G__5634 = cljs.core.next.call(null, xs__5632);
      var G__5635 = cljs.core.conj_BANG_.call(null, out__5633, cljs.core.first.call(null, xs__5632));
      xs__5632 = G__5634;
      out__5633 = G__5635;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5633)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__5636) {
    var args = cljs.core.seq(arglist__5636);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5641 = this;
  var h__364__auto____5642 = this__5641.__hash;
  if(h__364__auto____5642 != null) {
    return h__364__auto____5642
  }else {
    var h__364__auto____5643 = cljs.core.hash_coll.call(null, coll);
    this__5641.__hash = h__364__auto____5643;
    return h__364__auto____5643
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5644 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5645 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5646 = this;
  var v_pos__5647 = this__5646.start + key;
  return new cljs.core.Subvec(this__5646.meta, cljs.core._assoc.call(null, this__5646.v, v_pos__5647, val), this__5646.start, this__5646.end > v_pos__5647 + 1 ? this__5646.end : v_pos__5647 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5671 = null;
  var G__5671__2 = function(tsym5639, k) {
    var this__5648 = this;
    var tsym5639__5649 = this;
    var coll__5650 = tsym5639__5649;
    return cljs.core._lookup.call(null, coll__5650, k)
  };
  var G__5671__3 = function(tsym5640, k, not_found) {
    var this__5651 = this;
    var tsym5640__5652 = this;
    var coll__5653 = tsym5640__5652;
    return cljs.core._lookup.call(null, coll__5653, k, not_found)
  };
  G__5671 = function(tsym5640, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5671__2.call(this, tsym5640, k);
      case 3:
        return G__5671__3.call(this, tsym5640, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5671
}();
cljs.core.Subvec.prototype.apply = function(tsym5637, args5638) {
  return tsym5637.call.apply(tsym5637, [tsym5637].concat(cljs.core.aclone.call(null, args5638)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5654 = this;
  return new cljs.core.Subvec(this__5654.meta, cljs.core._assoc_n.call(null, this__5654.v, this__5654.end, o), this__5654.start, this__5654.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5655 = this;
  var this$__5656 = this;
  return cljs.core.pr_str.call(null, this$__5656)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5657 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5658 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5659 = this;
  var subvec_seq__5660 = function subvec_seq(i) {
    if(i === this__5659.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5659.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5660.call(null, this__5659.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5661 = this;
  return this__5661.end - this__5661.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5662 = this;
  return cljs.core._nth.call(null, this__5662.v, this__5662.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5663 = this;
  if(this__5663.start === this__5663.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5663.meta, this__5663.v, this__5663.start, this__5663.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5664 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5665 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5666 = this;
  return new cljs.core.Subvec(meta, this__5666.v, this__5666.start, this__5666.end, this__5666.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5667 = this;
  return this__5667.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5669 = this;
  return cljs.core._nth.call(null, this__5669.v, this__5669.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5670 = this;
  return cljs.core._nth.call(null, this__5670.v, this__5670.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5668 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5668.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__5672 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5672, 0, tl.length);
  return ret__5672
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5673 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5674 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5673, subidx__5674, level === 5 ? tail_node : function() {
    var child__5675 = cljs.core.pv_aget.call(null, ret__5673, subidx__5674);
    if(child__5675 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5675, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5673
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5676 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5677 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5678 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5676, subidx__5677));
    if(function() {
      var and__3546__auto____5679 = new_child__5678 == null;
      if(and__3546__auto____5679) {
        return subidx__5677 === 0
      }else {
        return and__3546__auto____5679
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5676, subidx__5677, new_child__5678);
      return node__5676
    }
  }else {
    if(subidx__5677 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5676, subidx__5677, null);
        return node__5676
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3546__auto____5680 = 0 <= i;
    if(and__3546__auto____5680) {
      return i < tv.cnt
    }else {
      return and__3546__auto____5680
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5681 = tv.root;
      var node__5682 = root__5681;
      var level__5683 = tv.shift;
      while(true) {
        if(level__5683 > 0) {
          var G__5684 = cljs.core.tv_ensure_editable.call(null, root__5681.edit, cljs.core.pv_aget.call(null, node__5682, i >>> level__5683 & 31));
          var G__5685 = level__5683 - 5;
          node__5682 = G__5684;
          level__5683 = G__5685;
          continue
        }else {
          return node__5682.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5723 = null;
  var G__5723__2 = function(tsym5688, k) {
    var this__5690 = this;
    var tsym5688__5691 = this;
    var coll__5692 = tsym5688__5691;
    return cljs.core._lookup.call(null, coll__5692, k)
  };
  var G__5723__3 = function(tsym5689, k, not_found) {
    var this__5693 = this;
    var tsym5689__5694 = this;
    var coll__5695 = tsym5689__5694;
    return cljs.core._lookup.call(null, coll__5695, k, not_found)
  };
  G__5723 = function(tsym5689, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5723__2.call(this, tsym5689, k);
      case 3:
        return G__5723__3.call(this, tsym5689, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5723
}();
cljs.core.TransientVector.prototype.apply = function(tsym5686, args5687) {
  return tsym5686.call.apply(tsym5686, [tsym5686].concat(cljs.core.aclone.call(null, args5687)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5696 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5697 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5698 = this;
  if(cljs.core.truth_(this__5698.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5699 = this;
  if(function() {
    var and__3546__auto____5700 = 0 <= n;
    if(and__3546__auto____5700) {
      return n < this__5699.cnt
    }else {
      return and__3546__auto____5700
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5701 = this;
  if(cljs.core.truth_(this__5701.root.edit)) {
    return this__5701.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5702 = this;
  if(cljs.core.truth_(this__5702.root.edit)) {
    if(function() {
      var and__3546__auto____5703 = 0 <= n;
      if(and__3546__auto____5703) {
        return n < this__5702.cnt
      }else {
        return and__3546__auto____5703
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5702.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5706 = function go(level, node) {
          var node__5704 = cljs.core.tv_ensure_editable.call(null, this__5702.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5704, n & 31, val);
            return node__5704
          }else {
            var subidx__5705 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5704, subidx__5705, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5704, subidx__5705)));
            return node__5704
          }
        }.call(null, this__5702.shift, this__5702.root);
        this__5702.root = new_root__5706;
        return tcoll
      }
    }else {
      if(n === this__5702.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5702.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__5707 = this;
  if(cljs.core.truth_(this__5707.root.edit)) {
    if(this__5707.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5707.cnt) {
        this__5707.cnt = 0;
        return tcoll
      }else {
        if((this__5707.cnt - 1 & 31) > 0) {
          this__5707.cnt = this__5707.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5708 = cljs.core.editable_array_for.call(null, tcoll, this__5707.cnt - 2);
            var new_root__5710 = function() {
              var nr__5709 = cljs.core.tv_pop_tail.call(null, tcoll, this__5707.shift, this__5707.root);
              if(nr__5709 != null) {
                return nr__5709
              }else {
                return new cljs.core.VectorNode(this__5707.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3546__auto____5711 = 5 < this__5707.shift;
              if(and__3546__auto____5711) {
                return cljs.core.pv_aget.call(null, new_root__5710, 1) == null
              }else {
                return and__3546__auto____5711
              }
            }()) {
              var new_root__5712 = cljs.core.tv_ensure_editable.call(null, this__5707.root.edit, cljs.core.pv_aget.call(null, new_root__5710, 0));
              this__5707.root = new_root__5712;
              this__5707.shift = this__5707.shift - 5;
              this__5707.cnt = this__5707.cnt - 1;
              this__5707.tail = new_tail__5708;
              return tcoll
            }else {
              this__5707.root = new_root__5710;
              this__5707.cnt = this__5707.cnt - 1;
              this__5707.tail = new_tail__5708;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5713 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5714 = this;
  if(cljs.core.truth_(this__5714.root.edit)) {
    if(this__5714.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5714.tail[this__5714.cnt & 31] = o;
      this__5714.cnt = this__5714.cnt + 1;
      return tcoll
    }else {
      var tail_node__5715 = new cljs.core.VectorNode(this__5714.root.edit, this__5714.tail);
      var new_tail__5716 = cljs.core.make_array.call(null, 32);
      new_tail__5716[0] = o;
      this__5714.tail = new_tail__5716;
      if(this__5714.cnt >>> 5 > 1 << this__5714.shift) {
        var new_root_array__5717 = cljs.core.make_array.call(null, 32);
        var new_shift__5718 = this__5714.shift + 5;
        new_root_array__5717[0] = this__5714.root;
        new_root_array__5717[1] = cljs.core.new_path.call(null, this__5714.root.edit, this__5714.shift, tail_node__5715);
        this__5714.root = new cljs.core.VectorNode(this__5714.root.edit, new_root_array__5717);
        this__5714.shift = new_shift__5718;
        this__5714.cnt = this__5714.cnt + 1;
        return tcoll
      }else {
        var new_root__5719 = cljs.core.tv_push_tail.call(null, tcoll, this__5714.shift, this__5714.root, tail_node__5715);
        this__5714.root = new_root__5719;
        this__5714.cnt = this__5714.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5720 = this;
  if(cljs.core.truth_(this__5720.root.edit)) {
    this__5720.root.edit = null;
    var len__5721 = this__5720.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5722 = cljs.core.make_array.call(null, len__5721);
    cljs.core.array_copy.call(null, this__5720.tail, 0, trimmed_tail__5722, 0, len__5721);
    return new cljs.core.PersistentVector(null, this__5720.cnt, this__5720.shift, this__5720.root, trimmed_tail__5722, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5724 = this;
  var h__364__auto____5725 = this__5724.__hash;
  if(h__364__auto____5725 != null) {
    return h__364__auto____5725
  }else {
    var h__364__auto____5726 = cljs.core.hash_coll.call(null, coll);
    this__5724.__hash = h__364__auto____5726;
    return h__364__auto____5726
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5727 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5728 = this;
  var this$__5729 = this;
  return cljs.core.pr_str.call(null, this$__5729)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5730 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5731 = this;
  return cljs.core._first.call(null, this__5731.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5732 = this;
  var temp__3695__auto____5733 = cljs.core.next.call(null, this__5732.front);
  if(cljs.core.truth_(temp__3695__auto____5733)) {
    var f1__5734 = temp__3695__auto____5733;
    return new cljs.core.PersistentQueueSeq(this__5732.meta, f1__5734, this__5732.rear, null)
  }else {
    if(this__5732.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5732.meta, this__5732.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5735 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5736 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5736.front, this__5736.rear, this__5736.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5737 = this;
  return this__5737.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5738 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5738.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5739 = this;
  var h__364__auto____5740 = this__5739.__hash;
  if(h__364__auto____5740 != null) {
    return h__364__auto____5740
  }else {
    var h__364__auto____5741 = cljs.core.hash_coll.call(null, coll);
    this__5739.__hash = h__364__auto____5741;
    return h__364__auto____5741
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5742 = this;
  if(cljs.core.truth_(this__5742.front)) {
    return new cljs.core.PersistentQueue(this__5742.meta, this__5742.count + 1, this__5742.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____5743 = this__5742.rear;
      if(cljs.core.truth_(or__3548__auto____5743)) {
        return or__3548__auto____5743
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5742.meta, this__5742.count + 1, cljs.core.conj.call(null, this__5742.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5744 = this;
  var this$__5745 = this;
  return cljs.core.pr_str.call(null, this$__5745)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5746 = this;
  var rear__5747 = cljs.core.seq.call(null, this__5746.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____5748 = this__5746.front;
    if(cljs.core.truth_(or__3548__auto____5748)) {
      return or__3548__auto____5748
    }else {
      return rear__5747
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5746.front, cljs.core.seq.call(null, rear__5747), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5749 = this;
  return this__5749.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5750 = this;
  return cljs.core._first.call(null, this__5750.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5751 = this;
  if(cljs.core.truth_(this__5751.front)) {
    var temp__3695__auto____5752 = cljs.core.next.call(null, this__5751.front);
    if(cljs.core.truth_(temp__3695__auto____5752)) {
      var f1__5753 = temp__3695__auto____5752;
      return new cljs.core.PersistentQueue(this__5751.meta, this__5751.count - 1, f1__5753, this__5751.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5751.meta, this__5751.count - 1, cljs.core.seq.call(null, this__5751.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5754 = this;
  return cljs.core.first.call(null, this__5754.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5755 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5756 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5757 = this;
  return new cljs.core.PersistentQueue(meta, this__5757.count, this__5757.front, this__5757.rear, this__5757.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5758 = this;
  return this__5758.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5759 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5760 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__5761 = array.length;
  var i__5762 = 0;
  while(true) {
    if(i__5762 < len__5761) {
      if(cljs.core._EQ_.call(null, k, array[i__5762])) {
        return i__5762
      }else {
        var G__5763 = i__5762 + incr;
        i__5762 = G__5763;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____5764 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____5764)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____5764
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__5765 = cljs.core.hash.call(null, a);
  var b__5766 = cljs.core.hash.call(null, b);
  if(a__5765 < b__5766) {
    return-1
  }else {
    if(a__5765 > b__5766) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__5768 = m.keys;
  var len__5769 = ks__5768.length;
  var so__5770 = m.strobj;
  var out__5771 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5772 = 0;
  var out__5773 = cljs.core.transient$.call(null, out__5771);
  while(true) {
    if(i__5772 < len__5769) {
      var k__5774 = ks__5768[i__5772];
      var G__5775 = i__5772 + 1;
      var G__5776 = cljs.core.assoc_BANG_.call(null, out__5773, k__5774, so__5770[k__5774]);
      i__5772 = G__5775;
      out__5773 = G__5776;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5773, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5781 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5782 = this;
  var h__364__auto____5783 = this__5782.__hash;
  if(h__364__auto____5783 != null) {
    return h__364__auto____5783
  }else {
    var h__364__auto____5784 = cljs.core.hash_imap.call(null, coll);
    this__5782.__hash = h__364__auto____5784;
    return h__364__auto____5784
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5785 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5786 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5786.strobj, this__5786.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5787 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5788 = this__5787.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5788)) {
      var new_strobj__5789 = goog.object.clone.call(null, this__5787.strobj);
      new_strobj__5789[k] = v;
      return new cljs.core.ObjMap(this__5787.meta, this__5787.keys, new_strobj__5789, this__5787.update_count + 1, null)
    }else {
      if(this__5787.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5790 = goog.object.clone.call(null, this__5787.strobj);
        var new_keys__5791 = cljs.core.aclone.call(null, this__5787.keys);
        new_strobj__5790[k] = v;
        new_keys__5791.push(k);
        return new cljs.core.ObjMap(this__5787.meta, new_keys__5791, new_strobj__5790, this__5787.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5792 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5792.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5812 = null;
  var G__5812__2 = function(tsym5779, k) {
    var this__5793 = this;
    var tsym5779__5794 = this;
    var coll__5795 = tsym5779__5794;
    return cljs.core._lookup.call(null, coll__5795, k)
  };
  var G__5812__3 = function(tsym5780, k, not_found) {
    var this__5796 = this;
    var tsym5780__5797 = this;
    var coll__5798 = tsym5780__5797;
    return cljs.core._lookup.call(null, coll__5798, k, not_found)
  };
  G__5812 = function(tsym5780, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5812__2.call(this, tsym5780, k);
      case 3:
        return G__5812__3.call(this, tsym5780, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5812
}();
cljs.core.ObjMap.prototype.apply = function(tsym5777, args5778) {
  return tsym5777.call.apply(tsym5777, [tsym5777].concat(cljs.core.aclone.call(null, args5778)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5799 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5800 = this;
  var this$__5801 = this;
  return cljs.core.pr_str.call(null, this$__5801)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5802 = this;
  if(this__5802.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5767_SHARP_) {
      return cljs.core.vector.call(null, p1__5767_SHARP_, this__5802.strobj[p1__5767_SHARP_])
    }, this__5802.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5803 = this;
  return this__5803.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5804 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5805 = this;
  return new cljs.core.ObjMap(meta, this__5805.keys, this__5805.strobj, this__5805.update_count, this__5805.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5806 = this;
  return this__5806.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5807 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5807.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5808 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____5809 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____5809)) {
      return this__5808.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____5809
    }
  }())) {
    var new_keys__5810 = cljs.core.aclone.call(null, this__5808.keys);
    var new_strobj__5811 = goog.object.clone.call(null, this__5808.strobj);
    new_keys__5810.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5810), 1);
    cljs.core.js_delete.call(null, new_strobj__5811, k);
    return new cljs.core.ObjMap(this__5808.meta, new_keys__5810, new_strobj__5811, this__5808.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5818 = this;
  var h__364__auto____5819 = this__5818.__hash;
  if(h__364__auto____5819 != null) {
    return h__364__auto____5819
  }else {
    var h__364__auto____5820 = cljs.core.hash_imap.call(null, coll);
    this__5818.__hash = h__364__auto____5820;
    return h__364__auto____5820
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5821 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5822 = this;
  var bucket__5823 = this__5822.hashobj[cljs.core.hash.call(null, k)];
  var i__5824 = cljs.core.truth_(bucket__5823) ? cljs.core.scan_array.call(null, 2, k, bucket__5823) : null;
  if(cljs.core.truth_(i__5824)) {
    return bucket__5823[i__5824 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5825 = this;
  var h__5826 = cljs.core.hash.call(null, k);
  var bucket__5827 = this__5825.hashobj[h__5826];
  if(cljs.core.truth_(bucket__5827)) {
    var new_bucket__5828 = cljs.core.aclone.call(null, bucket__5827);
    var new_hashobj__5829 = goog.object.clone.call(null, this__5825.hashobj);
    new_hashobj__5829[h__5826] = new_bucket__5828;
    var temp__3695__auto____5830 = cljs.core.scan_array.call(null, 2, k, new_bucket__5828);
    if(cljs.core.truth_(temp__3695__auto____5830)) {
      var i__5831 = temp__3695__auto____5830;
      new_bucket__5828[i__5831 + 1] = v;
      return new cljs.core.HashMap(this__5825.meta, this__5825.count, new_hashobj__5829, null)
    }else {
      new_bucket__5828.push(k, v);
      return new cljs.core.HashMap(this__5825.meta, this__5825.count + 1, new_hashobj__5829, null)
    }
  }else {
    var new_hashobj__5832 = goog.object.clone.call(null, this__5825.hashobj);
    new_hashobj__5832[h__5826] = [k, v];
    return new cljs.core.HashMap(this__5825.meta, this__5825.count + 1, new_hashobj__5832, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5833 = this;
  var bucket__5834 = this__5833.hashobj[cljs.core.hash.call(null, k)];
  var i__5835 = cljs.core.truth_(bucket__5834) ? cljs.core.scan_array.call(null, 2, k, bucket__5834) : null;
  if(cljs.core.truth_(i__5835)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__5858 = null;
  var G__5858__2 = function(tsym5816, k) {
    var this__5836 = this;
    var tsym5816__5837 = this;
    var coll__5838 = tsym5816__5837;
    return cljs.core._lookup.call(null, coll__5838, k)
  };
  var G__5858__3 = function(tsym5817, k, not_found) {
    var this__5839 = this;
    var tsym5817__5840 = this;
    var coll__5841 = tsym5817__5840;
    return cljs.core._lookup.call(null, coll__5841, k, not_found)
  };
  G__5858 = function(tsym5817, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5858__2.call(this, tsym5817, k);
      case 3:
        return G__5858__3.call(this, tsym5817, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5858
}();
cljs.core.HashMap.prototype.apply = function(tsym5814, args5815) {
  return tsym5814.call.apply(tsym5814, [tsym5814].concat(cljs.core.aclone.call(null, args5815)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5842 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__5843 = this;
  var this$__5844 = this;
  return cljs.core.pr_str.call(null, this$__5844)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5845 = this;
  if(this__5845.count > 0) {
    var hashes__5846 = cljs.core.js_keys.call(null, this__5845.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5813_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__5845.hashobj[p1__5813_SHARP_]))
    }, hashes__5846)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5847 = this;
  return this__5847.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5848 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5849 = this;
  return new cljs.core.HashMap(meta, this__5849.count, this__5849.hashobj, this__5849.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5850 = this;
  return this__5850.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5851 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__5851.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5852 = this;
  var h__5853 = cljs.core.hash.call(null, k);
  var bucket__5854 = this__5852.hashobj[h__5853];
  var i__5855 = cljs.core.truth_(bucket__5854) ? cljs.core.scan_array.call(null, 2, k, bucket__5854) : null;
  if(cljs.core.not.call(null, i__5855)) {
    return coll
  }else {
    var new_hashobj__5856 = goog.object.clone.call(null, this__5852.hashobj);
    if(3 > bucket__5854.length) {
      cljs.core.js_delete.call(null, new_hashobj__5856, h__5853)
    }else {
      var new_bucket__5857 = cljs.core.aclone.call(null, bucket__5854);
      new_bucket__5857.splice(i__5855, 2);
      new_hashobj__5856[h__5853] = new_bucket__5857
    }
    return new cljs.core.HashMap(this__5852.meta, this__5852.count - 1, new_hashobj__5856, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__5859 = ks.length;
  var i__5860 = 0;
  var out__5861 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__5860 < len__5859) {
      var G__5862 = i__5860 + 1;
      var G__5863 = cljs.core.assoc.call(null, out__5861, ks[i__5860], vs[i__5860]);
      i__5860 = G__5862;
      out__5861 = G__5863;
      continue
    }else {
      return out__5861
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__5864 = m.arr;
  var len__5865 = arr__5864.length;
  var i__5866 = 0;
  while(true) {
    if(len__5865 <= i__5866) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__5864[i__5866], k)) {
        return i__5866
      }else {
        if("\ufdd0'else") {
          var G__5867 = i__5866 + 2;
          i__5866 = G__5867;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5872 = this;
  return new cljs.core.TransientArrayMap({}, this__5872.arr.length, cljs.core.aclone.call(null, this__5872.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5873 = this;
  var h__364__auto____5874 = this__5873.__hash;
  if(h__364__auto____5874 != null) {
    return h__364__auto____5874
  }else {
    var h__364__auto____5875 = cljs.core.hash_imap.call(null, coll);
    this__5873.__hash = h__364__auto____5875;
    return h__364__auto____5875
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5876 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5877 = this;
  var idx__5878 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5878 === -1) {
    return not_found
  }else {
    return this__5877.arr[idx__5878 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5879 = this;
  var idx__5880 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5880 === -1) {
    if(this__5879.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__5879.meta, this__5879.cnt + 1, function() {
        var G__5881__5882 = cljs.core.aclone.call(null, this__5879.arr);
        G__5881__5882.push(k);
        G__5881__5882.push(v);
        return G__5881__5882
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__5879.arr[idx__5880 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__5879.meta, this__5879.cnt, function() {
          var G__5883__5884 = cljs.core.aclone.call(null, this__5879.arr);
          G__5883__5884[idx__5880 + 1] = v;
          return G__5883__5884
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5885 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5915 = null;
  var G__5915__2 = function(tsym5870, k) {
    var this__5886 = this;
    var tsym5870__5887 = this;
    var coll__5888 = tsym5870__5887;
    return cljs.core._lookup.call(null, coll__5888, k)
  };
  var G__5915__3 = function(tsym5871, k, not_found) {
    var this__5889 = this;
    var tsym5871__5890 = this;
    var coll__5891 = tsym5871__5890;
    return cljs.core._lookup.call(null, coll__5891, k, not_found)
  };
  G__5915 = function(tsym5871, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5915__2.call(this, tsym5871, k);
      case 3:
        return G__5915__3.call(this, tsym5871, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5915
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym5868, args5869) {
  return tsym5868.call.apply(tsym5868, [tsym5868].concat(cljs.core.aclone.call(null, args5869)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5892 = this;
  var len__5893 = this__5892.arr.length;
  var i__5894 = 0;
  var init__5895 = init;
  while(true) {
    if(i__5894 < len__5893) {
      var init__5896 = f.call(null, init__5895, this__5892.arr[i__5894], this__5892.arr[i__5894 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__5896)) {
        return cljs.core.deref.call(null, init__5896)
      }else {
        var G__5916 = i__5894 + 2;
        var G__5917 = init__5896;
        i__5894 = G__5916;
        init__5895 = G__5917;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5897 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__5898 = this;
  var this$__5899 = this;
  return cljs.core.pr_str.call(null, this$__5899)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5900 = this;
  if(this__5900.cnt > 0) {
    var len__5901 = this__5900.arr.length;
    var array_map_seq__5902 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__5901) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__5900.arr[i], this__5900.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__5902.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5903 = this;
  return this__5903.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5904 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5905 = this;
  return new cljs.core.PersistentArrayMap(meta, this__5905.cnt, this__5905.arr, this__5905.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5906 = this;
  return this__5906.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5907 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__5907.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5908 = this;
  var idx__5909 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5909 >= 0) {
    var len__5910 = this__5908.arr.length;
    var new_len__5911 = len__5910 - 2;
    if(new_len__5911 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__5912 = cljs.core.make_array.call(null, new_len__5911);
      var s__5913 = 0;
      var d__5914 = 0;
      while(true) {
        if(s__5913 >= len__5910) {
          return new cljs.core.PersistentArrayMap(this__5908.meta, this__5908.cnt - 1, new_arr__5912, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__5908.arr[s__5913])) {
            var G__5918 = s__5913 + 2;
            var G__5919 = d__5914;
            s__5913 = G__5918;
            d__5914 = G__5919;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__5912[d__5914] = this__5908.arr[s__5913];
              new_arr__5912[d__5914 + 1] = this__5908.arr[s__5913 + 1];
              var G__5920 = s__5913 + 2;
              var G__5921 = d__5914 + 2;
              s__5913 = G__5920;
              d__5914 = G__5921;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__5922 = cljs.core.count.call(null, ks);
  var i__5923 = 0;
  var out__5924 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__5923 < len__5922) {
      var G__5925 = i__5923 + 1;
      var G__5926 = cljs.core.assoc_BANG_.call(null, out__5924, ks[i__5923], vs[i__5923]);
      i__5923 = G__5925;
      out__5924 = G__5926;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5924)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5927 = this;
  if(cljs.core.truth_(this__5927.editable_QMARK_)) {
    var idx__5928 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5928 >= 0) {
      this__5927.arr[idx__5928] = this__5927.arr[this__5927.len - 2];
      this__5927.arr[idx__5928 + 1] = this__5927.arr[this__5927.len - 1];
      var G__5929__5930 = this__5927.arr;
      G__5929__5930.pop();
      G__5929__5930.pop();
      G__5929__5930;
      this__5927.len = this__5927.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5931 = this;
  if(cljs.core.truth_(this__5931.editable_QMARK_)) {
    var idx__5932 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5932 === -1) {
      if(this__5931.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__5931.len = this__5931.len + 2;
        this__5931.arr.push(key);
        this__5931.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__5931.len, this__5931.arr), key, val)
      }
    }else {
      if(val === this__5931.arr[idx__5932 + 1]) {
        return tcoll
      }else {
        this__5931.arr[idx__5932 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5933 = this;
  if(cljs.core.truth_(this__5933.editable_QMARK_)) {
    if(function() {
      var G__5934__5935 = o;
      if(G__5934__5935 != null) {
        if(function() {
          var or__3548__auto____5936 = G__5934__5935.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____5936) {
            return or__3548__auto____5936
          }else {
            return G__5934__5935.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5934__5935.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5934__5935)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5934__5935)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5937 = cljs.core.seq.call(null, o);
      var tcoll__5938 = tcoll;
      while(true) {
        var temp__3695__auto____5939 = cljs.core.first.call(null, es__5937);
        if(cljs.core.truth_(temp__3695__auto____5939)) {
          var e__5940 = temp__3695__auto____5939;
          var G__5946 = cljs.core.next.call(null, es__5937);
          var G__5947 = cljs.core._assoc_BANG_.call(null, tcoll__5938, cljs.core.key.call(null, e__5940), cljs.core.val.call(null, e__5940));
          es__5937 = G__5946;
          tcoll__5938 = G__5947;
          continue
        }else {
          return tcoll__5938
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5941 = this;
  if(cljs.core.truth_(this__5941.editable_QMARK_)) {
    this__5941.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__5941.len, 2), this__5941.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5942 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5943 = this;
  if(cljs.core.truth_(this__5943.editable_QMARK_)) {
    var idx__5944 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__5944 === -1) {
      return not_found
    }else {
      return this__5943.arr[idx__5944 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__5945 = this;
  if(cljs.core.truth_(this__5945.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__5945.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__5948 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__5949 = 0;
  while(true) {
    if(i__5949 < len) {
      var G__5950 = cljs.core.assoc_BANG_.call(null, out__5948, arr[i__5949], arr[i__5949 + 1]);
      var G__5951 = i__5949 + 2;
      out__5948 = G__5950;
      i__5949 = G__5951;
      continue
    }else {
      return out__5948
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5952__5953 = cljs.core.aclone.call(null, arr);
    G__5952__5953[i] = a;
    return G__5952__5953
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5954__5955 = cljs.core.aclone.call(null, arr);
    G__5954__5955[i] = a;
    G__5954__5955[j] = b;
    return G__5954__5955
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__5956 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__5956, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__5956, 2 * i, new_arr__5956.length - 2 * i);
  return new_arr__5956
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__5957 = inode.ensure_editable(edit);
    editable__5957.arr[i] = a;
    return editable__5957
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__5958 = inode.ensure_editable(edit);
    editable__5958.arr[i] = a;
    editable__5958.arr[j] = b;
    return editable__5958
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__5959 = arr.length;
  var i__5960 = 0;
  var init__5961 = init;
  while(true) {
    if(i__5960 < len__5959) {
      var init__5964 = function() {
        var k__5962 = arr[i__5960];
        if(k__5962 != null) {
          return f.call(null, init__5961, k__5962, arr[i__5960 + 1])
        }else {
          var node__5963 = arr[i__5960 + 1];
          if(node__5963 != null) {
            return node__5963.kv_reduce(f, init__5961)
          }else {
            return init__5961
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5964)) {
        return cljs.core.deref.call(null, init__5964)
      }else {
        var G__5965 = i__5960 + 2;
        var G__5966 = init__5964;
        i__5960 = G__5965;
        init__5961 = G__5966;
        continue
      }
    }else {
      return init__5961
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__5967 = this;
  var inode__5968 = this;
  if(this__5967.bitmap === bit) {
    return null
  }else {
    var editable__5969 = inode__5968.ensure_editable(e);
    var earr__5970 = editable__5969.arr;
    var len__5971 = earr__5970.length;
    editable__5969.bitmap = bit ^ editable__5969.bitmap;
    cljs.core.array_copy.call(null, earr__5970, 2 * (i + 1), earr__5970, 2 * i, len__5971 - 2 * (i + 1));
    earr__5970[len__5971 - 2] = null;
    earr__5970[len__5971 - 1] = null;
    return editable__5969
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5972 = this;
  var inode__5973 = this;
  var bit__5974 = 1 << (hash >>> shift & 31);
  var idx__5975 = cljs.core.bitmap_indexed_node_index.call(null, this__5972.bitmap, bit__5974);
  if((this__5972.bitmap & bit__5974) === 0) {
    var n__5976 = cljs.core.bit_count.call(null, this__5972.bitmap);
    if(2 * n__5976 < this__5972.arr.length) {
      var editable__5977 = inode__5973.ensure_editable(edit);
      var earr__5978 = editable__5977.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__5978, 2 * idx__5975, earr__5978, 2 * (idx__5975 + 1), 2 * (n__5976 - idx__5975));
      earr__5978[2 * idx__5975] = key;
      earr__5978[2 * idx__5975 + 1] = val;
      editable__5977.bitmap = editable__5977.bitmap | bit__5974;
      return editable__5977
    }else {
      if(n__5976 >= 16) {
        var nodes__5979 = cljs.core.make_array.call(null, 32);
        var jdx__5980 = hash >>> shift & 31;
        nodes__5979[jdx__5980] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__5981 = 0;
        var j__5982 = 0;
        while(true) {
          if(i__5981 < 32) {
            if((this__5972.bitmap >>> i__5981 & 1) === 0) {
              var G__6035 = i__5981 + 1;
              var G__6036 = j__5982;
              i__5981 = G__6035;
              j__5982 = G__6036;
              continue
            }else {
              nodes__5979[i__5981] = null != this__5972.arr[j__5982] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__5972.arr[j__5982]), this__5972.arr[j__5982], this__5972.arr[j__5982 + 1], added_leaf_QMARK_) : this__5972.arr[j__5982 + 1];
              var G__6037 = i__5981 + 1;
              var G__6038 = j__5982 + 2;
              i__5981 = G__6037;
              j__5982 = G__6038;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__5976 + 1, nodes__5979)
      }else {
        if("\ufdd0'else") {
          var new_arr__5983 = cljs.core.make_array.call(null, 2 * (n__5976 + 4));
          cljs.core.array_copy.call(null, this__5972.arr, 0, new_arr__5983, 0, 2 * idx__5975);
          new_arr__5983[2 * idx__5975] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__5983[2 * idx__5975 + 1] = val;
          cljs.core.array_copy.call(null, this__5972.arr, 2 * idx__5975, new_arr__5983, 2 * (idx__5975 + 1), 2 * (n__5976 - idx__5975));
          var editable__5984 = inode__5973.ensure_editable(edit);
          editable__5984.arr = new_arr__5983;
          editable__5984.bitmap = editable__5984.bitmap | bit__5974;
          return editable__5984
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__5985 = this__5972.arr[2 * idx__5975];
    var val_or_node__5986 = this__5972.arr[2 * idx__5975 + 1];
    if(null == key_or_nil__5985) {
      var n__5987 = val_or_node__5986.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5987 === val_or_node__5986) {
        return inode__5973
      }else {
        return cljs.core.edit_and_set.call(null, inode__5973, edit, 2 * idx__5975 + 1, n__5987)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5985)) {
        if(val === val_or_node__5986) {
          return inode__5973
        }else {
          return cljs.core.edit_and_set.call(null, inode__5973, edit, 2 * idx__5975 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__5973, edit, 2 * idx__5975, null, 2 * idx__5975 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__5985, val_or_node__5986, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__5988 = this;
  var inode__5989 = this;
  return cljs.core.create_inode_seq.call(null, this__5988.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5990 = this;
  var inode__5991 = this;
  var bit__5992 = 1 << (hash >>> shift & 31);
  if((this__5990.bitmap & bit__5992) === 0) {
    return inode__5991
  }else {
    var idx__5993 = cljs.core.bitmap_indexed_node_index.call(null, this__5990.bitmap, bit__5992);
    var key_or_nil__5994 = this__5990.arr[2 * idx__5993];
    var val_or_node__5995 = this__5990.arr[2 * idx__5993 + 1];
    if(null == key_or_nil__5994) {
      var n__5996 = val_or_node__5995.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__5996 === val_or_node__5995) {
        return inode__5991
      }else {
        if(null != n__5996) {
          return cljs.core.edit_and_set.call(null, inode__5991, edit, 2 * idx__5993 + 1, n__5996)
        }else {
          if(this__5990.bitmap === bit__5992) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__5991.edit_and_remove_pair(edit, bit__5992, idx__5993)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5994)) {
        removed_leaf_QMARK_[0] = true;
        return inode__5991.edit_and_remove_pair(edit, bit__5992, idx__5993)
      }else {
        if("\ufdd0'else") {
          return inode__5991
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__5997 = this;
  var inode__5998 = this;
  if(e === this__5997.edit) {
    return inode__5998
  }else {
    var n__5999 = cljs.core.bit_count.call(null, this__5997.bitmap);
    var new_arr__6000 = cljs.core.make_array.call(null, n__5999 < 0 ? 4 : 2 * (n__5999 + 1));
    cljs.core.array_copy.call(null, this__5997.arr, 0, new_arr__6000, 0, 2 * n__5999);
    return new cljs.core.BitmapIndexedNode(e, this__5997.bitmap, new_arr__6000)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__6001 = this;
  var inode__6002 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6001.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__6039 = null;
  var G__6039__3 = function(shift, hash, key) {
    var this__6003 = this;
    var inode__6004 = this;
    var bit__6005 = 1 << (hash >>> shift & 31);
    if((this__6003.bitmap & bit__6005) === 0) {
      return null
    }else {
      var idx__6006 = cljs.core.bitmap_indexed_node_index.call(null, this__6003.bitmap, bit__6005);
      var key_or_nil__6007 = this__6003.arr[2 * idx__6006];
      var val_or_node__6008 = this__6003.arr[2 * idx__6006 + 1];
      if(null == key_or_nil__6007) {
        return val_or_node__6008.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__6007)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__6007, val_or_node__6008])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__6039__4 = function(shift, hash, key, not_found) {
    var this__6009 = this;
    var inode__6010 = this;
    var bit__6011 = 1 << (hash >>> shift & 31);
    if((this__6009.bitmap & bit__6011) === 0) {
      return not_found
    }else {
      var idx__6012 = cljs.core.bitmap_indexed_node_index.call(null, this__6009.bitmap, bit__6011);
      var key_or_nil__6013 = this__6009.arr[2 * idx__6012];
      var val_or_node__6014 = this__6009.arr[2 * idx__6012 + 1];
      if(null == key_or_nil__6013) {
        return val_or_node__6014.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__6013)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__6013, val_or_node__6014])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__6039 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6039__3.call(this, shift, hash, key);
      case 4:
        return G__6039__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6039
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__6015 = this;
  var inode__6016 = this;
  var bit__6017 = 1 << (hash >>> shift & 31);
  if((this__6015.bitmap & bit__6017) === 0) {
    return inode__6016
  }else {
    var idx__6018 = cljs.core.bitmap_indexed_node_index.call(null, this__6015.bitmap, bit__6017);
    var key_or_nil__6019 = this__6015.arr[2 * idx__6018];
    var val_or_node__6020 = this__6015.arr[2 * idx__6018 + 1];
    if(null == key_or_nil__6019) {
      var n__6021 = val_or_node__6020.inode_without(shift + 5, hash, key);
      if(n__6021 === val_or_node__6020) {
        return inode__6016
      }else {
        if(null != n__6021) {
          return new cljs.core.BitmapIndexedNode(null, this__6015.bitmap, cljs.core.clone_and_set.call(null, this__6015.arr, 2 * idx__6018 + 1, n__6021))
        }else {
          if(this__6015.bitmap === bit__6017) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__6015.bitmap ^ bit__6017, cljs.core.remove_pair.call(null, this__6015.arr, idx__6018))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6019)) {
        return new cljs.core.BitmapIndexedNode(null, this__6015.bitmap ^ bit__6017, cljs.core.remove_pair.call(null, this__6015.arr, idx__6018))
      }else {
        if("\ufdd0'else") {
          return inode__6016
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6022 = this;
  var inode__6023 = this;
  var bit__6024 = 1 << (hash >>> shift & 31);
  var idx__6025 = cljs.core.bitmap_indexed_node_index.call(null, this__6022.bitmap, bit__6024);
  if((this__6022.bitmap & bit__6024) === 0) {
    var n__6026 = cljs.core.bit_count.call(null, this__6022.bitmap);
    if(n__6026 >= 16) {
      var nodes__6027 = cljs.core.make_array.call(null, 32);
      var jdx__6028 = hash >>> shift & 31;
      nodes__6027[jdx__6028] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__6029 = 0;
      var j__6030 = 0;
      while(true) {
        if(i__6029 < 32) {
          if((this__6022.bitmap >>> i__6029 & 1) === 0) {
            var G__6040 = i__6029 + 1;
            var G__6041 = j__6030;
            i__6029 = G__6040;
            j__6030 = G__6041;
            continue
          }else {
            nodes__6027[i__6029] = null != this__6022.arr[j__6030] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__6022.arr[j__6030]), this__6022.arr[j__6030], this__6022.arr[j__6030 + 1], added_leaf_QMARK_) : this__6022.arr[j__6030 + 1];
            var G__6042 = i__6029 + 1;
            var G__6043 = j__6030 + 2;
            i__6029 = G__6042;
            j__6030 = G__6043;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__6026 + 1, nodes__6027)
    }else {
      var new_arr__6031 = cljs.core.make_array.call(null, 2 * (n__6026 + 1));
      cljs.core.array_copy.call(null, this__6022.arr, 0, new_arr__6031, 0, 2 * idx__6025);
      new_arr__6031[2 * idx__6025] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__6031[2 * idx__6025 + 1] = val;
      cljs.core.array_copy.call(null, this__6022.arr, 2 * idx__6025, new_arr__6031, 2 * (idx__6025 + 1), 2 * (n__6026 - idx__6025));
      return new cljs.core.BitmapIndexedNode(null, this__6022.bitmap | bit__6024, new_arr__6031)
    }
  }else {
    var key_or_nil__6032 = this__6022.arr[2 * idx__6025];
    var val_or_node__6033 = this__6022.arr[2 * idx__6025 + 1];
    if(null == key_or_nil__6032) {
      var n__6034 = val_or_node__6033.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__6034 === val_or_node__6033) {
        return inode__6023
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__6022.bitmap, cljs.core.clone_and_set.call(null, this__6022.arr, 2 * idx__6025 + 1, n__6034))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__6032)) {
        if(val === val_or_node__6033) {
          return inode__6023
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__6022.bitmap, cljs.core.clone_and_set.call(null, this__6022.arr, 2 * idx__6025 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__6022.bitmap, cljs.core.clone_and_set.call(null, this__6022.arr, 2 * idx__6025, null, 2 * idx__6025 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__6032, val_or_node__6033, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__6044 = array_node.arr;
  var len__6045 = 2 * (array_node.cnt - 1);
  var new_arr__6046 = cljs.core.make_array.call(null, len__6045);
  var i__6047 = 0;
  var j__6048 = 1;
  var bitmap__6049 = 0;
  while(true) {
    if(i__6047 < len__6045) {
      if(function() {
        var and__3546__auto____6050 = i__6047 != idx;
        if(and__3546__auto____6050) {
          return null != arr__6044[i__6047]
        }else {
          return and__3546__auto____6050
        }
      }()) {
        new_arr__6046[j__6048] = arr__6044[i__6047];
        var G__6051 = i__6047 + 1;
        var G__6052 = j__6048 + 2;
        var G__6053 = bitmap__6049 | 1 << i__6047;
        i__6047 = G__6051;
        j__6048 = G__6052;
        bitmap__6049 = G__6053;
        continue
      }else {
        var G__6054 = i__6047 + 1;
        var G__6055 = j__6048;
        var G__6056 = bitmap__6049;
        i__6047 = G__6054;
        j__6048 = G__6055;
        bitmap__6049 = G__6056;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__6049, new_arr__6046)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6057 = this;
  var inode__6058 = this;
  var idx__6059 = hash >>> shift & 31;
  var node__6060 = this__6057.arr[idx__6059];
  if(null == node__6060) {
    return new cljs.core.ArrayNode(null, this__6057.cnt + 1, cljs.core.clone_and_set.call(null, this__6057.arr, idx__6059, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__6061 = node__6060.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6061 === node__6060) {
      return inode__6058
    }else {
      return new cljs.core.ArrayNode(null, this__6057.cnt, cljs.core.clone_and_set.call(null, this__6057.arr, idx__6059, n__6061))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__6062 = this;
  var inode__6063 = this;
  var idx__6064 = hash >>> shift & 31;
  var node__6065 = this__6062.arr[idx__6064];
  if(null != node__6065) {
    var n__6066 = node__6065.inode_without(shift + 5, hash, key);
    if(n__6066 === node__6065) {
      return inode__6063
    }else {
      if(n__6066 == null) {
        if(this__6062.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6063, null, idx__6064)
        }else {
          return new cljs.core.ArrayNode(null, this__6062.cnt - 1, cljs.core.clone_and_set.call(null, this__6062.arr, idx__6064, n__6066))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__6062.cnt, cljs.core.clone_and_set.call(null, this__6062.arr, idx__6064, n__6066))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__6063
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__6098 = null;
  var G__6098__3 = function(shift, hash, key) {
    var this__6067 = this;
    var inode__6068 = this;
    var idx__6069 = hash >>> shift & 31;
    var node__6070 = this__6067.arr[idx__6069];
    if(null != node__6070) {
      return node__6070.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__6098__4 = function(shift, hash, key, not_found) {
    var this__6071 = this;
    var inode__6072 = this;
    var idx__6073 = hash >>> shift & 31;
    var node__6074 = this__6071.arr[idx__6073];
    if(null != node__6074) {
      return node__6074.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__6098 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6098__3.call(this, shift, hash, key);
      case 4:
        return G__6098__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6098
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__6075 = this;
  var inode__6076 = this;
  return cljs.core.create_array_node_seq.call(null, this__6075.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__6077 = this;
  var inode__6078 = this;
  if(e === this__6077.edit) {
    return inode__6078
  }else {
    return new cljs.core.ArrayNode(e, this__6077.cnt, cljs.core.aclone.call(null, this__6077.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6079 = this;
  var inode__6080 = this;
  var idx__6081 = hash >>> shift & 31;
  var node__6082 = this__6079.arr[idx__6081];
  if(null == node__6082) {
    var editable__6083 = cljs.core.edit_and_set.call(null, inode__6080, edit, idx__6081, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__6083.cnt = editable__6083.cnt + 1;
    return editable__6083
  }else {
    var n__6084 = node__6082.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6084 === node__6082) {
      return inode__6080
    }else {
      return cljs.core.edit_and_set.call(null, inode__6080, edit, idx__6081, n__6084)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6085 = this;
  var inode__6086 = this;
  var idx__6087 = hash >>> shift & 31;
  var node__6088 = this__6085.arr[idx__6087];
  if(null == node__6088) {
    return inode__6086
  }else {
    var n__6089 = node__6088.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__6089 === node__6088) {
      return inode__6086
    }else {
      if(null == n__6089) {
        if(this__6085.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6086, edit, idx__6087)
        }else {
          var editable__6090 = cljs.core.edit_and_set.call(null, inode__6086, edit, idx__6087, n__6089);
          editable__6090.cnt = editable__6090.cnt - 1;
          return editable__6090
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__6086, edit, idx__6087, n__6089)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__6091 = this;
  var inode__6092 = this;
  var len__6093 = this__6091.arr.length;
  var i__6094 = 0;
  var init__6095 = init;
  while(true) {
    if(i__6094 < len__6093) {
      var node__6096 = this__6091.arr[i__6094];
      if(node__6096 != null) {
        var init__6097 = node__6096.kv_reduce(f, init__6095);
        if(cljs.core.reduced_QMARK_.call(null, init__6097)) {
          return cljs.core.deref.call(null, init__6097)
        }else {
          var G__6099 = i__6094 + 1;
          var G__6100 = init__6097;
          i__6094 = G__6099;
          init__6095 = G__6100;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__6095
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__6101 = 2 * cnt;
  var i__6102 = 0;
  while(true) {
    if(i__6102 < lim__6101) {
      if(cljs.core._EQ_.call(null, key, arr[i__6102])) {
        return i__6102
      }else {
        var G__6103 = i__6102 + 2;
        i__6102 = G__6103;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6104 = this;
  var inode__6105 = this;
  if(hash === this__6104.collision_hash) {
    var idx__6106 = cljs.core.hash_collision_node_find_index.call(null, this__6104.arr, this__6104.cnt, key);
    if(idx__6106 === -1) {
      var len__6107 = this__6104.arr.length;
      var new_arr__6108 = cljs.core.make_array.call(null, len__6107 + 2);
      cljs.core.array_copy.call(null, this__6104.arr, 0, new_arr__6108, 0, len__6107);
      new_arr__6108[len__6107] = key;
      new_arr__6108[len__6107 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__6104.collision_hash, this__6104.cnt + 1, new_arr__6108)
    }else {
      if(cljs.core._EQ_.call(null, this__6104.arr[idx__6106], val)) {
        return inode__6105
      }else {
        return new cljs.core.HashCollisionNode(null, this__6104.collision_hash, this__6104.cnt, cljs.core.clone_and_set.call(null, this__6104.arr, idx__6106 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__6104.collision_hash >>> shift & 31), [null, inode__6105])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__6109 = this;
  var inode__6110 = this;
  var idx__6111 = cljs.core.hash_collision_node_find_index.call(null, this__6109.arr, this__6109.cnt, key);
  if(idx__6111 === -1) {
    return inode__6110
  }else {
    if(this__6109.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__6109.collision_hash, this__6109.cnt - 1, cljs.core.remove_pair.call(null, this__6109.arr, cljs.core.quot.call(null, idx__6111, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__6138 = null;
  var G__6138__3 = function(shift, hash, key) {
    var this__6112 = this;
    var inode__6113 = this;
    var idx__6114 = cljs.core.hash_collision_node_find_index.call(null, this__6112.arr, this__6112.cnt, key);
    if(idx__6114 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__6112.arr[idx__6114])) {
        return cljs.core.PersistentVector.fromArray([this__6112.arr[idx__6114], this__6112.arr[idx__6114 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__6138__4 = function(shift, hash, key, not_found) {
    var this__6115 = this;
    var inode__6116 = this;
    var idx__6117 = cljs.core.hash_collision_node_find_index.call(null, this__6115.arr, this__6115.cnt, key);
    if(idx__6117 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__6115.arr[idx__6117])) {
        return cljs.core.PersistentVector.fromArray([this__6115.arr[idx__6117], this__6115.arr[idx__6117 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__6138 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6138__3.call(this, shift, hash, key);
      case 4:
        return G__6138__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6138
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__6118 = this;
  var inode__6119 = this;
  return cljs.core.create_inode_seq.call(null, this__6118.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__6139 = null;
  var G__6139__1 = function(e) {
    var this__6120 = this;
    var inode__6121 = this;
    if(e === this__6120.edit) {
      return inode__6121
    }else {
      var new_arr__6122 = cljs.core.make_array.call(null, 2 * (this__6120.cnt + 1));
      cljs.core.array_copy.call(null, this__6120.arr, 0, new_arr__6122, 0, 2 * this__6120.cnt);
      return new cljs.core.HashCollisionNode(e, this__6120.collision_hash, this__6120.cnt, new_arr__6122)
    }
  };
  var G__6139__3 = function(e, count, array) {
    var this__6123 = this;
    var inode__6124 = this;
    if(e === this__6123.edit) {
      this__6123.arr = array;
      this__6123.cnt = count;
      return inode__6124
    }else {
      return new cljs.core.HashCollisionNode(this__6123.edit, this__6123.collision_hash, count, array)
    }
  };
  G__6139 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__6139__1.call(this, e);
      case 3:
        return G__6139__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6139
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6125 = this;
  var inode__6126 = this;
  if(hash === this__6125.collision_hash) {
    var idx__6127 = cljs.core.hash_collision_node_find_index.call(null, this__6125.arr, this__6125.cnt, key);
    if(idx__6127 === -1) {
      if(this__6125.arr.length > 2 * this__6125.cnt) {
        var editable__6128 = cljs.core.edit_and_set.call(null, inode__6126, edit, 2 * this__6125.cnt, key, 2 * this__6125.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__6128.cnt = editable__6128.cnt + 1;
        return editable__6128
      }else {
        var len__6129 = this__6125.arr.length;
        var new_arr__6130 = cljs.core.make_array.call(null, len__6129 + 2);
        cljs.core.array_copy.call(null, this__6125.arr, 0, new_arr__6130, 0, len__6129);
        new_arr__6130[len__6129] = key;
        new_arr__6130[len__6129 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__6126.ensure_editable(edit, this__6125.cnt + 1, new_arr__6130)
      }
    }else {
      if(this__6125.arr[idx__6127 + 1] === val) {
        return inode__6126
      }else {
        return cljs.core.edit_and_set.call(null, inode__6126, edit, idx__6127 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__6125.collision_hash >>> shift & 31), [null, inode__6126, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6131 = this;
  var inode__6132 = this;
  var idx__6133 = cljs.core.hash_collision_node_find_index.call(null, this__6131.arr, this__6131.cnt, key);
  if(idx__6133 === -1) {
    return inode__6132
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__6131.cnt === 1) {
      return null
    }else {
      var editable__6134 = inode__6132.ensure_editable(edit);
      var earr__6135 = editable__6134.arr;
      earr__6135[idx__6133] = earr__6135[2 * this__6131.cnt - 2];
      earr__6135[idx__6133 + 1] = earr__6135[2 * this__6131.cnt - 1];
      earr__6135[2 * this__6131.cnt - 1] = null;
      earr__6135[2 * this__6131.cnt - 2] = null;
      editable__6134.cnt = editable__6134.cnt - 1;
      return editable__6134
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__6136 = this;
  var inode__6137 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6136.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6140 = cljs.core.hash.call(null, key1);
    if(key1hash__6140 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6140, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6141 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__6140, key1, val1, added_leaf_QMARK___6141).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___6141)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6142 = cljs.core.hash.call(null, key1);
    if(key1hash__6142 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6142, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6143 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__6142, key1, val1, added_leaf_QMARK___6143).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___6143)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6144 = this;
  var h__364__auto____6145 = this__6144.__hash;
  if(h__364__auto____6145 != null) {
    return h__364__auto____6145
  }else {
    var h__364__auto____6146 = cljs.core.hash_coll.call(null, coll);
    this__6144.__hash = h__364__auto____6146;
    return h__364__auto____6146
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6147 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__6148 = this;
  var this$__6149 = this;
  return cljs.core.pr_str.call(null, this$__6149)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6150 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6151 = this;
  if(this__6151.s == null) {
    return cljs.core.PersistentVector.fromArray([this__6151.nodes[this__6151.i], this__6151.nodes[this__6151.i + 1]])
  }else {
    return cljs.core.first.call(null, this__6151.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6152 = this;
  if(this__6152.s == null) {
    return cljs.core.create_inode_seq.call(null, this__6152.nodes, this__6152.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__6152.nodes, this__6152.i, cljs.core.next.call(null, this__6152.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6153 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6154 = this;
  return new cljs.core.NodeSeq(meta, this__6154.nodes, this__6154.i, this__6154.s, this__6154.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6155 = this;
  return this__6155.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6156 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6156.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__6157 = nodes.length;
      var j__6158 = i;
      while(true) {
        if(j__6158 < len__6157) {
          if(null != nodes[j__6158]) {
            return new cljs.core.NodeSeq(null, nodes, j__6158, null, null)
          }else {
            var temp__3695__auto____6159 = nodes[j__6158 + 1];
            if(cljs.core.truth_(temp__3695__auto____6159)) {
              var node__6160 = temp__3695__auto____6159;
              var temp__3695__auto____6161 = node__6160.inode_seq();
              if(cljs.core.truth_(temp__3695__auto____6161)) {
                var node_seq__6162 = temp__3695__auto____6161;
                return new cljs.core.NodeSeq(null, nodes, j__6158 + 2, node_seq__6162, null)
              }else {
                var G__6163 = j__6158 + 2;
                j__6158 = G__6163;
                continue
              }
            }else {
              var G__6164 = j__6158 + 2;
              j__6158 = G__6164;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6165 = this;
  var h__364__auto____6166 = this__6165.__hash;
  if(h__364__auto____6166 != null) {
    return h__364__auto____6166
  }else {
    var h__364__auto____6167 = cljs.core.hash_coll.call(null, coll);
    this__6165.__hash = h__364__auto____6167;
    return h__364__auto____6167
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6168 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6169 = this;
  var this$__6170 = this;
  return cljs.core.pr_str.call(null, this$__6170)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6171 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6172 = this;
  return cljs.core.first.call(null, this__6172.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6173 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6173.nodes, this__6173.i, cljs.core.next.call(null, this__6173.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6174 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6175 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6175.nodes, this__6175.i, this__6175.s, this__6175.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6176 = this;
  return this__6176.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6177 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6177.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6178 = nodes.length;
      var j__6179 = i;
      while(true) {
        if(j__6179 < len__6178) {
          var temp__3695__auto____6180 = nodes[j__6179];
          if(cljs.core.truth_(temp__3695__auto____6180)) {
            var nj__6181 = temp__3695__auto____6180;
            var temp__3695__auto____6182 = nj__6181.inode_seq();
            if(cljs.core.truth_(temp__3695__auto____6182)) {
              var ns__6183 = temp__3695__auto____6182;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6179 + 1, ns__6183, null)
            }else {
              var G__6184 = j__6179 + 1;
              j__6179 = G__6184;
              continue
            }
          }else {
            var G__6185 = j__6179 + 1;
            j__6179 = G__6185;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6190 = this;
  return new cljs.core.TransientHashMap({}, this__6190.root, this__6190.cnt, this__6190.has_nil_QMARK_, this__6190.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6191 = this;
  var h__364__auto____6192 = this__6191.__hash;
  if(h__364__auto____6192 != null) {
    return h__364__auto____6192
  }else {
    var h__364__auto____6193 = cljs.core.hash_imap.call(null, coll);
    this__6191.__hash = h__364__auto____6193;
    return h__364__auto____6193
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6194 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6195 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6195.has_nil_QMARK_)) {
      return this__6195.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6195.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6195.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6196 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6197 = this__6196.has_nil_QMARK_;
      if(cljs.core.truth_(and__3546__auto____6197)) {
        return v === this__6196.nil_val
      }else {
        return and__3546__auto____6197
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6196.meta, cljs.core.truth_(this__6196.has_nil_QMARK_) ? this__6196.cnt : this__6196.cnt + 1, this__6196.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6198 = [false];
    var new_root__6199 = (this__6196.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6196.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6198);
    if(new_root__6199 === this__6196.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6196.meta, cljs.core.truth_(added_leaf_QMARK___6198[0]) ? this__6196.cnt + 1 : this__6196.cnt, new_root__6199, this__6196.has_nil_QMARK_, this__6196.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6200 = this;
  if(k == null) {
    return this__6200.has_nil_QMARK_
  }else {
    if(this__6200.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6200.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6221 = null;
  var G__6221__2 = function(tsym6188, k) {
    var this__6201 = this;
    var tsym6188__6202 = this;
    var coll__6203 = tsym6188__6202;
    return cljs.core._lookup.call(null, coll__6203, k)
  };
  var G__6221__3 = function(tsym6189, k, not_found) {
    var this__6204 = this;
    var tsym6189__6205 = this;
    var coll__6206 = tsym6189__6205;
    return cljs.core._lookup.call(null, coll__6206, k, not_found)
  };
  G__6221 = function(tsym6189, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6221__2.call(this, tsym6189, k);
      case 3:
        return G__6221__3.call(this, tsym6189, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6221
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6186, args6187) {
  return tsym6186.call.apply(tsym6186, [tsym6186].concat(cljs.core.aclone.call(null, args6187)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6207 = this;
  var init__6208 = cljs.core.truth_(this__6207.has_nil_QMARK_) ? f.call(null, init, null, this__6207.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6208)) {
    return cljs.core.deref.call(null, init__6208)
  }else {
    if(null != this__6207.root) {
      return this__6207.root.kv_reduce(f, init__6208)
    }else {
      if("\ufdd0'else") {
        return init__6208
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6209 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6210 = this;
  var this$__6211 = this;
  return cljs.core.pr_str.call(null, this$__6211)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6212 = this;
  if(this__6212.cnt > 0) {
    var s__6213 = null != this__6212.root ? this__6212.root.inode_seq() : null;
    if(cljs.core.truth_(this__6212.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6212.nil_val]), s__6213)
    }else {
      return s__6213
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6214 = this;
  return this__6214.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6215 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6216 = this;
  return new cljs.core.PersistentHashMap(meta, this__6216.cnt, this__6216.root, this__6216.has_nil_QMARK_, this__6216.nil_val, this__6216.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6217 = this;
  return this__6217.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6218 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6218.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6219 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6219.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6219.meta, this__6219.cnt - 1, this__6219.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6219.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6220 = this__6219.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6220 === this__6219.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6219.meta, this__6219.cnt - 1, new_root__6220, this__6219.has_nil_QMARK_, this__6219.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__6222 = ks.length;
  var i__6223 = 0;
  var out__6224 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6223 < len__6222) {
      var G__6225 = i__6223 + 1;
      var G__6226 = cljs.core.assoc_BANG_.call(null, out__6224, ks[i__6223], vs[i__6223]);
      i__6223 = G__6225;
      out__6224 = G__6226;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6224)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6227 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6228 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6229 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6230 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6231 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6231.has_nil_QMARK_)) {
      return this__6231.nil_val
    }else {
      return null
    }
  }else {
    if(this__6231.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6231.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6232 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6232.has_nil_QMARK_)) {
      return this__6232.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6232.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6232.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6233 = this;
  if(cljs.core.truth_(this__6233.edit)) {
    return this__6233.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6234 = this;
  var tcoll__6235 = this;
  if(cljs.core.truth_(this__6234.edit)) {
    if(function() {
      var G__6236__6237 = o;
      if(G__6236__6237 != null) {
        if(function() {
          var or__3548__auto____6238 = G__6236__6237.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____6238) {
            return or__3548__auto____6238
          }else {
            return G__6236__6237.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6236__6237.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6236__6237)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6236__6237)
      }
    }()) {
      return tcoll__6235.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6239 = cljs.core.seq.call(null, o);
      var tcoll__6240 = tcoll__6235;
      while(true) {
        var temp__3695__auto____6241 = cljs.core.first.call(null, es__6239);
        if(cljs.core.truth_(temp__3695__auto____6241)) {
          var e__6242 = temp__3695__auto____6241;
          var G__6253 = cljs.core.next.call(null, es__6239);
          var G__6254 = tcoll__6240.assoc_BANG_(cljs.core.key.call(null, e__6242), cljs.core.val.call(null, e__6242));
          es__6239 = G__6253;
          tcoll__6240 = G__6254;
          continue
        }else {
          return tcoll__6240
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6243 = this;
  var tcoll__6244 = this;
  if(cljs.core.truth_(this__6243.edit)) {
    if(k == null) {
      if(this__6243.nil_val === v) {
      }else {
        this__6243.nil_val = v
      }
      if(cljs.core.truth_(this__6243.has_nil_QMARK_)) {
      }else {
        this__6243.count = this__6243.count + 1;
        this__6243.has_nil_QMARK_ = true
      }
      return tcoll__6244
    }else {
      var added_leaf_QMARK___6245 = [false];
      var node__6246 = (this__6243.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6243.root).inode_assoc_BANG_(this__6243.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6245);
      if(node__6246 === this__6243.root) {
      }else {
        this__6243.root = node__6246
      }
      if(cljs.core.truth_(added_leaf_QMARK___6245[0])) {
        this__6243.count = this__6243.count + 1
      }else {
      }
      return tcoll__6244
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6247 = this;
  var tcoll__6248 = this;
  if(cljs.core.truth_(this__6247.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6247.has_nil_QMARK_)) {
        this__6247.has_nil_QMARK_ = false;
        this__6247.nil_val = null;
        this__6247.count = this__6247.count - 1;
        return tcoll__6248
      }else {
        return tcoll__6248
      }
    }else {
      if(this__6247.root == null) {
        return tcoll__6248
      }else {
        var removed_leaf_QMARK___6249 = [false];
        var node__6250 = this__6247.root.inode_without_BANG_(this__6247.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6249);
        if(node__6250 === this__6247.root) {
        }else {
          this__6247.root = node__6250
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6249[0])) {
          this__6247.count = this__6247.count - 1
        }else {
        }
        return tcoll__6248
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6251 = this;
  var tcoll__6252 = this;
  if(cljs.core.truth_(this__6251.edit)) {
    this__6251.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6251.count, this__6251.root, this__6251.has_nil_QMARK_, this__6251.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6255 = node;
  var stack__6256 = stack;
  while(true) {
    if(t__6255 != null) {
      var G__6257 = cljs.core.truth_(ascending_QMARK_) ? t__6255.left : t__6255.right;
      var G__6258 = cljs.core.conj.call(null, stack__6256, t__6255);
      t__6255 = G__6257;
      stack__6256 = G__6258;
      continue
    }else {
      return stack__6256
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6259 = this;
  var h__364__auto____6260 = this__6259.__hash;
  if(h__364__auto____6260 != null) {
    return h__364__auto____6260
  }else {
    var h__364__auto____6261 = cljs.core.hash_coll.call(null, coll);
    this__6259.__hash = h__364__auto____6261;
    return h__364__auto____6261
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6262 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6263 = this;
  var this$__6264 = this;
  return cljs.core.pr_str.call(null, this$__6264)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6265 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6266 = this;
  if(this__6266.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6266.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6267 = this;
  return cljs.core.peek.call(null, this__6267.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6268 = this;
  var t__6269 = cljs.core.peek.call(null, this__6268.stack);
  var next_stack__6270 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6268.ascending_QMARK_) ? t__6269.right : t__6269.left, cljs.core.pop.call(null, this__6268.stack), this__6268.ascending_QMARK_);
  if(next_stack__6270 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6270, this__6268.ascending_QMARK_, this__6268.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6271 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6272 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6272.stack, this__6272.ascending_QMARK_, this__6272.cnt, this__6272.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6273 = this;
  return this__6273.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3546__auto____6274 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3546__auto____6274) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3546__auto____6274
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3546__auto____6275 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3546__auto____6275) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3546__auto____6275
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__6276 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6276)) {
    return cljs.core.deref.call(null, init__6276)
  }else {
    var init__6277 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6276) : init__6276;
    if(cljs.core.reduced_QMARK_.call(null, init__6277)) {
      return cljs.core.deref.call(null, init__6277)
    }else {
      var init__6278 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6277) : init__6277;
      if(cljs.core.reduced_QMARK_.call(null, init__6278)) {
        return cljs.core.deref.call(null, init__6278)
      }else {
        return init__6278
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6283 = this;
  var h__364__auto____6284 = this__6283.__hash;
  if(h__364__auto____6284 != null) {
    return h__364__auto____6284
  }else {
    var h__364__auto____6285 = cljs.core.hash_coll.call(null, coll);
    this__6283.__hash = h__364__auto____6285;
    return h__364__auto____6285
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6286 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6287 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6288 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6288.key, this__6288.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6335 = null;
  var G__6335__2 = function(tsym6281, k) {
    var this__6289 = this;
    var tsym6281__6290 = this;
    var node__6291 = tsym6281__6290;
    return cljs.core._lookup.call(null, node__6291, k)
  };
  var G__6335__3 = function(tsym6282, k, not_found) {
    var this__6292 = this;
    var tsym6282__6293 = this;
    var node__6294 = tsym6282__6293;
    return cljs.core._lookup.call(null, node__6294, k, not_found)
  };
  G__6335 = function(tsym6282, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6335__2.call(this, tsym6282, k);
      case 3:
        return G__6335__3.call(this, tsym6282, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6335
}();
cljs.core.BlackNode.prototype.apply = function(tsym6279, args6280) {
  return tsym6279.call.apply(tsym6279, [tsym6279].concat(cljs.core.aclone.call(null, args6280)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6295 = this;
  return cljs.core.PersistentVector.fromArray([this__6295.key, this__6295.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6296 = this;
  return this__6296.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6297 = this;
  return this__6297.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6298 = this;
  var node__6299 = this;
  return ins.balance_right(node__6299)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6300 = this;
  var node__6301 = this;
  return new cljs.core.RedNode(this__6300.key, this__6300.val, this__6300.left, this__6300.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6302 = this;
  var node__6303 = this;
  return cljs.core.balance_right_del.call(null, this__6302.key, this__6302.val, this__6302.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6304 = this;
  var node__6305 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6306 = this;
  var node__6307 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6307, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6308 = this;
  var node__6309 = this;
  return cljs.core.balance_left_del.call(null, this__6308.key, this__6308.val, del, this__6308.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6310 = this;
  var node__6311 = this;
  return ins.balance_left(node__6311)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6312 = this;
  var node__6313 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6313, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6336 = null;
  var G__6336__0 = function() {
    var this__6316 = this;
    var this$__6317 = this;
    return cljs.core.pr_str.call(null, this$__6317)
  };
  G__6336 = function() {
    switch(arguments.length) {
      case 0:
        return G__6336__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6336
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6318 = this;
  var node__6319 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6319, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6320 = this;
  var node__6321 = this;
  return node__6321
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6322 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6323 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6324 = this;
  return cljs.core.list.call(null, this__6324.key, this__6324.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6326 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6327 = this;
  return this__6327.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6328 = this;
  return cljs.core.PersistentVector.fromArray([this__6328.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6329 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6329.key, this__6329.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6330 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6331 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6331.key, this__6331.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6332 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6333 = this;
  if(n === 0) {
    return this__6333.key
  }else {
    if(n === 1) {
      return this__6333.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6334 = this;
  if(n === 0) {
    return this__6334.key
  }else {
    if(n === 1) {
      return this__6334.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6325 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6341 = this;
  var h__364__auto____6342 = this__6341.__hash;
  if(h__364__auto____6342 != null) {
    return h__364__auto____6342
  }else {
    var h__364__auto____6343 = cljs.core.hash_coll.call(null, coll);
    this__6341.__hash = h__364__auto____6343;
    return h__364__auto____6343
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6344 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6345 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6346 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6346.key, this__6346.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6393 = null;
  var G__6393__2 = function(tsym6339, k) {
    var this__6347 = this;
    var tsym6339__6348 = this;
    var node__6349 = tsym6339__6348;
    return cljs.core._lookup.call(null, node__6349, k)
  };
  var G__6393__3 = function(tsym6340, k, not_found) {
    var this__6350 = this;
    var tsym6340__6351 = this;
    var node__6352 = tsym6340__6351;
    return cljs.core._lookup.call(null, node__6352, k, not_found)
  };
  G__6393 = function(tsym6340, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6393__2.call(this, tsym6340, k);
      case 3:
        return G__6393__3.call(this, tsym6340, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6393
}();
cljs.core.RedNode.prototype.apply = function(tsym6337, args6338) {
  return tsym6337.call.apply(tsym6337, [tsym6337].concat(cljs.core.aclone.call(null, args6338)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6353 = this;
  return cljs.core.PersistentVector.fromArray([this__6353.key, this__6353.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6354 = this;
  return this__6354.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6355 = this;
  return this__6355.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6356 = this;
  var node__6357 = this;
  return new cljs.core.RedNode(this__6356.key, this__6356.val, this__6356.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6358 = this;
  var node__6359 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6360 = this;
  var node__6361 = this;
  return new cljs.core.RedNode(this__6360.key, this__6360.val, this__6360.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6362 = this;
  var node__6363 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6364 = this;
  var node__6365 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6365, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6366 = this;
  var node__6367 = this;
  return new cljs.core.RedNode(this__6366.key, this__6366.val, del, this__6366.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6368 = this;
  var node__6369 = this;
  return new cljs.core.RedNode(this__6368.key, this__6368.val, ins, this__6368.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6370 = this;
  var node__6371 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6370.left)) {
    return new cljs.core.RedNode(this__6370.key, this__6370.val, this__6370.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6370.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6370.right)) {
      return new cljs.core.RedNode(this__6370.right.key, this__6370.right.val, new cljs.core.BlackNode(this__6370.key, this__6370.val, this__6370.left, this__6370.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6370.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6371, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6394 = null;
  var G__6394__0 = function() {
    var this__6374 = this;
    var this$__6375 = this;
    return cljs.core.pr_str.call(null, this$__6375)
  };
  G__6394 = function() {
    switch(arguments.length) {
      case 0:
        return G__6394__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6394
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6376 = this;
  var node__6377 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6376.right)) {
    return new cljs.core.RedNode(this__6376.key, this__6376.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6376.left, null), this__6376.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6376.left)) {
      return new cljs.core.RedNode(this__6376.left.key, this__6376.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6376.left.left, null), new cljs.core.BlackNode(this__6376.key, this__6376.val, this__6376.left.right, this__6376.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6377, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6378 = this;
  var node__6379 = this;
  return new cljs.core.BlackNode(this__6378.key, this__6378.val, this__6378.left, this__6378.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6380 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6381 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6382 = this;
  return cljs.core.list.call(null, this__6382.key, this__6382.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6384 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6385 = this;
  return this__6385.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6386 = this;
  return cljs.core.PersistentVector.fromArray([this__6386.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6387 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6387.key, this__6387.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6388 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6389 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6389.key, this__6389.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6390 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6391 = this;
  if(n === 0) {
    return this__6391.key
  }else {
    if(n === 1) {
      return this__6391.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6392 = this;
  if(n === 0) {
    return this__6392.key
  }else {
    if(n === 1) {
      return this__6392.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6383 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6395 = comp.call(null, k, tree.key);
    if(c__6395 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6395 < 0) {
        var ins__6396 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6396 != null) {
          return tree.add_left(ins__6396)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6397 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6397 != null) {
            return tree.add_right(ins__6397)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__6398 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6398)) {
            return new cljs.core.RedNode(app__6398.key, app__6398.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6398.left), new cljs.core.RedNode(right.key, right.val, app__6398.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6398, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6399 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6399)) {
              return new cljs.core.RedNode(app__6399.key, app__6399.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6399.left, null), new cljs.core.BlackNode(right.key, right.val, app__6399.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6399, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__6400 = comp.call(null, k, tree.key);
    if(c__6400 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6400 < 0) {
        var del__6401 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3548__auto____6402 = del__6401 != null;
          if(or__3548__auto____6402) {
            return or__3548__auto____6402
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6401, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6401, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6403 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3548__auto____6404 = del__6403 != null;
            if(or__3548__auto____6404) {
              return or__3548__auto____6404
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6403)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6403, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__6405 = tree.key;
  var c__6406 = comp.call(null, k, tk__6405);
  if(c__6406 === 0) {
    return tree.replace(tk__6405, v, tree.left, tree.right)
  }else {
    if(c__6406 < 0) {
      return tree.replace(tk__6405, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6405, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6411 = this;
  var h__364__auto____6412 = this__6411.__hash;
  if(h__364__auto____6412 != null) {
    return h__364__auto____6412
  }else {
    var h__364__auto____6413 = cljs.core.hash_imap.call(null, coll);
    this__6411.__hash = h__364__auto____6413;
    return h__364__auto____6413
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6414 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6415 = this;
  var n__6416 = coll.entry_at(k);
  if(n__6416 != null) {
    return n__6416.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6417 = this;
  var found__6418 = [null];
  var t__6419 = cljs.core.tree_map_add.call(null, this__6417.comp, this__6417.tree, k, v, found__6418);
  if(t__6419 == null) {
    var found_node__6420 = cljs.core.nth.call(null, found__6418, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6420.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6417.comp, cljs.core.tree_map_replace.call(null, this__6417.comp, this__6417.tree, k, v), this__6417.cnt, this__6417.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6417.comp, t__6419.blacken(), this__6417.cnt + 1, this__6417.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6421 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6453 = null;
  var G__6453__2 = function(tsym6409, k) {
    var this__6422 = this;
    var tsym6409__6423 = this;
    var coll__6424 = tsym6409__6423;
    return cljs.core._lookup.call(null, coll__6424, k)
  };
  var G__6453__3 = function(tsym6410, k, not_found) {
    var this__6425 = this;
    var tsym6410__6426 = this;
    var coll__6427 = tsym6410__6426;
    return cljs.core._lookup.call(null, coll__6427, k, not_found)
  };
  G__6453 = function(tsym6410, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6453__2.call(this, tsym6410, k);
      case 3:
        return G__6453__3.call(this, tsym6410, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6453
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6407, args6408) {
  return tsym6407.call.apply(tsym6407, [tsym6407].concat(cljs.core.aclone.call(null, args6408)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6428 = this;
  if(this__6428.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6428.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6429 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6430 = this;
  if(this__6430.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6430.tree, false, this__6430.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6431 = this;
  var this$__6432 = this;
  return cljs.core.pr_str.call(null, this$__6432)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6433 = this;
  var coll__6434 = this;
  var t__6435 = this__6433.tree;
  while(true) {
    if(t__6435 != null) {
      var c__6436 = this__6433.comp.call(null, k, t__6435.key);
      if(c__6436 === 0) {
        return t__6435
      }else {
        if(c__6436 < 0) {
          var G__6454 = t__6435.left;
          t__6435 = G__6454;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6455 = t__6435.right;
            t__6435 = G__6455;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6437 = this;
  if(this__6437.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6437.tree, ascending_QMARK_, this__6437.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6438 = this;
  if(this__6438.cnt > 0) {
    var stack__6439 = null;
    var t__6440 = this__6438.tree;
    while(true) {
      if(t__6440 != null) {
        var c__6441 = this__6438.comp.call(null, k, t__6440.key);
        if(c__6441 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6439, t__6440), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6441 < 0) {
              var G__6456 = cljs.core.conj.call(null, stack__6439, t__6440);
              var G__6457 = t__6440.left;
              stack__6439 = G__6456;
              t__6440 = G__6457;
              continue
            }else {
              var G__6458 = stack__6439;
              var G__6459 = t__6440.right;
              stack__6439 = G__6458;
              t__6440 = G__6459;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6441 > 0) {
                var G__6460 = cljs.core.conj.call(null, stack__6439, t__6440);
                var G__6461 = t__6440.right;
                stack__6439 = G__6460;
                t__6440 = G__6461;
                continue
              }else {
                var G__6462 = stack__6439;
                var G__6463 = t__6440.left;
                stack__6439 = G__6462;
                t__6440 = G__6463;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6439 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6439, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6442 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6443 = this;
  return this__6443.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6444 = this;
  if(this__6444.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6444.tree, true, this__6444.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6445 = this;
  return this__6445.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6446 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6447 = this;
  return new cljs.core.PersistentTreeMap(this__6447.comp, this__6447.tree, this__6447.cnt, meta, this__6447.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6451 = this;
  return this__6451.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6452 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6452.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6448 = this;
  var found__6449 = [null];
  var t__6450 = cljs.core.tree_map_remove.call(null, this__6448.comp, this__6448.tree, k, found__6449);
  if(t__6450 == null) {
    if(cljs.core.nth.call(null, found__6449, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6448.comp, null, 0, this__6448.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6448.comp, t__6450.blacken(), this__6448.cnt - 1, this__6448.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6464 = cljs.core.seq.call(null, keyvals);
    var out__6465 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6464)) {
        var G__6466 = cljs.core.nnext.call(null, in$__6464);
        var G__6467 = cljs.core.assoc_BANG_.call(null, out__6465, cljs.core.first.call(null, in$__6464), cljs.core.second.call(null, in$__6464));
        in$__6464 = G__6466;
        out__6465 = G__6467;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6465)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__6468) {
    var keyvals = cljs.core.seq(arglist__6468);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6469) {
    var keyvals = cljs.core.seq(arglist__6469);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6470 = cljs.core.seq.call(null, keyvals);
    var out__6471 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6470)) {
        var G__6472 = cljs.core.nnext.call(null, in$__6470);
        var G__6473 = cljs.core.assoc.call(null, out__6471, cljs.core.first.call(null, in$__6470), cljs.core.second.call(null, in$__6470));
        in$__6470 = G__6472;
        out__6471 = G__6473;
        continue
      }else {
        return out__6471
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6474) {
    var keyvals = cljs.core.seq(arglist__6474);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6475 = cljs.core.seq.call(null, keyvals);
    var out__6476 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6475)) {
        var G__6477 = cljs.core.nnext.call(null, in$__6475);
        var G__6478 = cljs.core.assoc.call(null, out__6476, cljs.core.first.call(null, in$__6475), cljs.core.second.call(null, in$__6475));
        in$__6475 = G__6477;
        out__6476 = G__6478;
        continue
      }else {
        return out__6476
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6479) {
    var comparator = cljs.core.first(arglist__6479);
    var keyvals = cljs.core.rest(arglist__6479);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6480_SHARP_, p2__6481_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____6482 = p1__6480_SHARP_;
          if(cljs.core.truth_(or__3548__auto____6482)) {
            return or__3548__auto____6482
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6481_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__6483) {
    var maps = cljs.core.seq(arglist__6483);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6486 = function(m, e) {
        var k__6484 = cljs.core.first.call(null, e);
        var v__6485 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6484)) {
          return cljs.core.assoc.call(null, m, k__6484, f.call(null, cljs.core.get.call(null, m, k__6484), v__6485))
        }else {
          return cljs.core.assoc.call(null, m, k__6484, v__6485)
        }
      };
      var merge2__6488 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6486, function() {
          var or__3548__auto____6487 = m1;
          if(cljs.core.truth_(or__3548__auto____6487)) {
            return or__3548__auto____6487
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6488, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__6489) {
    var f = cljs.core.first(arglist__6489);
    var maps = cljs.core.rest(arglist__6489);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6490 = cljs.core.ObjMap.fromObject([], {});
  var keys__6491 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6491)) {
      var key__6492 = cljs.core.first.call(null, keys__6491);
      var entry__6493 = cljs.core.get.call(null, map, key__6492, "\ufdd0'user/not-found");
      var G__6494 = cljs.core.not_EQ_.call(null, entry__6493, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6490, key__6492, entry__6493) : ret__6490;
      var G__6495 = cljs.core.next.call(null, keys__6491);
      ret__6490 = G__6494;
      keys__6491 = G__6495;
      continue
    }else {
      return ret__6490
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6501 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6501.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6502 = this;
  var h__364__auto____6503 = this__6502.__hash;
  if(h__364__auto____6503 != null) {
    return h__364__auto____6503
  }else {
    var h__364__auto____6504 = cljs.core.hash_iset.call(null, coll);
    this__6502.__hash = h__364__auto____6504;
    return h__364__auto____6504
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6505 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6506 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6506.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6525 = null;
  var G__6525__2 = function(tsym6499, k) {
    var this__6507 = this;
    var tsym6499__6508 = this;
    var coll__6509 = tsym6499__6508;
    return cljs.core._lookup.call(null, coll__6509, k)
  };
  var G__6525__3 = function(tsym6500, k, not_found) {
    var this__6510 = this;
    var tsym6500__6511 = this;
    var coll__6512 = tsym6500__6511;
    return cljs.core._lookup.call(null, coll__6512, k, not_found)
  };
  G__6525 = function(tsym6500, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6525__2.call(this, tsym6500, k);
      case 3:
        return G__6525__3.call(this, tsym6500, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6525
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6497, args6498) {
  return tsym6497.call.apply(tsym6497, [tsym6497].concat(cljs.core.aclone.call(null, args6498)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6513 = this;
  return new cljs.core.PersistentHashSet(this__6513.meta, cljs.core.assoc.call(null, this__6513.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6514 = this;
  var this$__6515 = this;
  return cljs.core.pr_str.call(null, this$__6515)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6516 = this;
  return cljs.core.keys.call(null, this__6516.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6517 = this;
  return new cljs.core.PersistentHashSet(this__6517.meta, cljs.core.dissoc.call(null, this__6517.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6518 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6519 = this;
  var and__3546__auto____6520 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6520) {
    var and__3546__auto____6521 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6521) {
      return cljs.core.every_QMARK_.call(null, function(p1__6496_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6496_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6521
    }
  }else {
    return and__3546__auto____6520
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6522 = this;
  return new cljs.core.PersistentHashSet(meta, this__6522.hash_map, this__6522.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6523 = this;
  return this__6523.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6524 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6524.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6543 = null;
  var G__6543__2 = function(tsym6529, k) {
    var this__6531 = this;
    var tsym6529__6532 = this;
    var tcoll__6533 = tsym6529__6532;
    if(cljs.core._lookup.call(null, this__6531.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6543__3 = function(tsym6530, k, not_found) {
    var this__6534 = this;
    var tsym6530__6535 = this;
    var tcoll__6536 = tsym6530__6535;
    if(cljs.core._lookup.call(null, this__6534.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6543 = function(tsym6530, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6543__2.call(this, tsym6530, k);
      case 3:
        return G__6543__3.call(this, tsym6530, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6543
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6527, args6528) {
  return tsym6527.call.apply(tsym6527, [tsym6527].concat(cljs.core.aclone.call(null, args6528)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6537 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6538 = this;
  if(cljs.core._lookup.call(null, this__6538.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6539 = this;
  return cljs.core.count.call(null, this__6539.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6540 = this;
  this__6540.transient_map = cljs.core.dissoc_BANG_.call(null, this__6540.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6541 = this;
  this__6541.transient_map = cljs.core.assoc_BANG_.call(null, this__6541.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6542 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6542.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6548 = this;
  var h__364__auto____6549 = this__6548.__hash;
  if(h__364__auto____6549 != null) {
    return h__364__auto____6549
  }else {
    var h__364__auto____6550 = cljs.core.hash_iset.call(null, coll);
    this__6548.__hash = h__364__auto____6550;
    return h__364__auto____6550
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6551 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6552 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6552.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6576 = null;
  var G__6576__2 = function(tsym6546, k) {
    var this__6553 = this;
    var tsym6546__6554 = this;
    var coll__6555 = tsym6546__6554;
    return cljs.core._lookup.call(null, coll__6555, k)
  };
  var G__6576__3 = function(tsym6547, k, not_found) {
    var this__6556 = this;
    var tsym6547__6557 = this;
    var coll__6558 = tsym6547__6557;
    return cljs.core._lookup.call(null, coll__6558, k, not_found)
  };
  G__6576 = function(tsym6547, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6576__2.call(this, tsym6547, k);
      case 3:
        return G__6576__3.call(this, tsym6547, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6576
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6544, args6545) {
  return tsym6544.call.apply(tsym6544, [tsym6544].concat(cljs.core.aclone.call(null, args6545)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6559 = this;
  return new cljs.core.PersistentTreeSet(this__6559.meta, cljs.core.assoc.call(null, this__6559.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6560 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6560.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6561 = this;
  var this$__6562 = this;
  return cljs.core.pr_str.call(null, this$__6562)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6563 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6563.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6564 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6564.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6565 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6566 = this;
  return cljs.core._comparator.call(null, this__6566.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6567 = this;
  return cljs.core.keys.call(null, this__6567.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6568 = this;
  return new cljs.core.PersistentTreeSet(this__6568.meta, cljs.core.dissoc.call(null, this__6568.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6569 = this;
  return cljs.core.count.call(null, this__6569.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6570 = this;
  var and__3546__auto____6571 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____6571) {
    var and__3546__auto____6572 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____6572) {
      return cljs.core.every_QMARK_.call(null, function(p1__6526_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6526_SHARP_)
      }, other)
    }else {
      return and__3546__auto____6572
    }
  }else {
    return and__3546__auto____6571
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6573 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6573.tree_map, this__6573.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6574 = this;
  return this__6574.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6575 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6575.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6577 = cljs.core.seq.call(null, coll);
  var out__6578 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6577))) {
      var G__6579 = cljs.core.next.call(null, in$__6577);
      var G__6580 = cljs.core.conj_BANG_.call(null, out__6578, cljs.core.first.call(null, in$__6577));
      in$__6577 = G__6579;
      out__6578 = G__6580;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6578)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6581) {
    var keys = cljs.core.seq(arglist__6581);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6583) {
    var comparator = cljs.core.first(arglist__6583);
    var keys = cljs.core.rest(arglist__6583);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6584 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____6585 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____6585)) {
        var e__6586 = temp__3695__auto____6585;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6586))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6584, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6582_SHARP_) {
      var temp__3695__auto____6587 = cljs.core.find.call(null, smap, p1__6582_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____6587)) {
        var e__6588 = temp__3695__auto____6587;
        return cljs.core.second.call(null, e__6588)
      }else {
        return p1__6582_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6596 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6589, seen) {
        while(true) {
          var vec__6590__6591 = p__6589;
          var f__6592 = cljs.core.nth.call(null, vec__6590__6591, 0, null);
          var xs__6593 = vec__6590__6591;
          var temp__3698__auto____6594 = cljs.core.seq.call(null, xs__6593);
          if(cljs.core.truth_(temp__3698__auto____6594)) {
            var s__6595 = temp__3698__auto____6594;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6592)) {
              var G__6597 = cljs.core.rest.call(null, s__6595);
              var G__6598 = seen;
              p__6589 = G__6597;
              seen = G__6598;
              continue
            }else {
              return cljs.core.cons.call(null, f__6592, step.call(null, cljs.core.rest.call(null, s__6595), cljs.core.conj.call(null, seen, f__6592)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6596.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6599 = cljs.core.PersistentVector.fromArray([]);
  var s__6600 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6600))) {
      var G__6601 = cljs.core.conj.call(null, ret__6599, cljs.core.first.call(null, s__6600));
      var G__6602 = cljs.core.next.call(null, s__6600);
      ret__6599 = G__6601;
      s__6600 = G__6602;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6599)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3548__auto____6603 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3548__auto____6603) {
        return or__3548__auto____6603
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6604 = x.lastIndexOf("/");
      if(i__6604 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6604 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3548__auto____6605 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3548__auto____6605) {
      return or__3548__auto____6605
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6606 = x.lastIndexOf("/");
    if(i__6606 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6606)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6609 = cljs.core.ObjMap.fromObject([], {});
  var ks__6610 = cljs.core.seq.call(null, keys);
  var vs__6611 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6612 = ks__6610;
      if(cljs.core.truth_(and__3546__auto____6612)) {
        return vs__6611
      }else {
        return and__3546__auto____6612
      }
    }())) {
      var G__6613 = cljs.core.assoc.call(null, map__6609, cljs.core.first.call(null, ks__6610), cljs.core.first.call(null, vs__6611));
      var G__6614 = cljs.core.next.call(null, ks__6610);
      var G__6615 = cljs.core.next.call(null, vs__6611);
      map__6609 = G__6613;
      ks__6610 = G__6614;
      vs__6611 = G__6615;
      continue
    }else {
      return map__6609
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6618__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6607_SHARP_, p2__6608_SHARP_) {
        return max_key.call(null, k, p1__6607_SHARP_, p2__6608_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6618 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6618__delegate.call(this, k, x, y, more)
    };
    G__6618.cljs$lang$maxFixedArity = 3;
    G__6618.cljs$lang$applyTo = function(arglist__6619) {
      var k = cljs.core.first(arglist__6619);
      var x = cljs.core.first(cljs.core.next(arglist__6619));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6619)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6619)));
      return G__6618__delegate(k, x, y, more)
    };
    G__6618.cljs$lang$arity$variadic = G__6618__delegate;
    return G__6618
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6620__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6616_SHARP_, p2__6617_SHARP_) {
        return min_key.call(null, k, p1__6616_SHARP_, p2__6617_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6620 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6620__delegate.call(this, k, x, y, more)
    };
    G__6620.cljs$lang$maxFixedArity = 3;
    G__6620.cljs$lang$applyTo = function(arglist__6621) {
      var k = cljs.core.first(arglist__6621);
      var x = cljs.core.first(cljs.core.next(arglist__6621));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6621)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6621)));
      return G__6620__delegate(k, x, y, more)
    };
    G__6620.cljs$lang$arity$variadic = G__6620__delegate;
    return G__6620
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6622 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6622)) {
        var s__6623 = temp__3698__auto____6622;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6623), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6623)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6624 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6624)) {
      var s__6625 = temp__3698__auto____6624;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6625)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6625), take_while.call(null, pred, cljs.core.rest.call(null, s__6625)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__6626 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6626.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6627 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3698__auto____6628 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3698__auto____6628)) {
        var vec__6629__6630 = temp__3698__auto____6628;
        var e__6631 = cljs.core.nth.call(null, vec__6629__6630, 0, null);
        var s__6632 = vec__6629__6630;
        if(cljs.core.truth_(include__6627.call(null, e__6631))) {
          return s__6632
        }else {
          return cljs.core.next.call(null, s__6632)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6627, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6633 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3698__auto____6633)) {
      var vec__6634__6635 = temp__3698__auto____6633;
      var e__6636 = cljs.core.nth.call(null, vec__6634__6635, 0, null);
      var s__6637 = vec__6634__6635;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6636)) ? s__6637 : cljs.core.next.call(null, s__6637))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__6638 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3698__auto____6639 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3698__auto____6639)) {
        var vec__6640__6641 = temp__3698__auto____6639;
        var e__6642 = cljs.core.nth.call(null, vec__6640__6641, 0, null);
        var s__6643 = vec__6640__6641;
        if(cljs.core.truth_(include__6638.call(null, e__6642))) {
          return s__6643
        }else {
          return cljs.core.next.call(null, s__6643)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6638, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____6644 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3698__auto____6644)) {
      var vec__6645__6646 = temp__3698__auto____6644;
      var e__6647 = cljs.core.nth.call(null, vec__6645__6646, 0, null);
      var s__6648 = vec__6645__6646;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6647)) ? s__6648 : cljs.core.next.call(null, s__6648))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6649 = this;
  var h__364__auto____6650 = this__6649.__hash;
  if(h__364__auto____6650 != null) {
    return h__364__auto____6650
  }else {
    var h__364__auto____6651 = cljs.core.hash_coll.call(null, rng);
    this__6649.__hash = h__364__auto____6651;
    return h__364__auto____6651
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6652 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6653 = this;
  var this$__6654 = this;
  return cljs.core.pr_str.call(null, this$__6654)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6655 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6656 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6657 = this;
  var comp__6658 = this__6657.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6658.call(null, this__6657.start, this__6657.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6659 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6659.end - this__6659.start) / this__6659.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6660 = this;
  return this__6660.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6661 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6661.meta, this__6661.start + this__6661.step, this__6661.end, this__6661.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6662 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6663 = this;
  return new cljs.core.Range(meta, this__6663.start, this__6663.end, this__6663.step, this__6663.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6664 = this;
  return this__6664.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6665 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6665.start + n * this__6665.step
  }else {
    if(function() {
      var and__3546__auto____6666 = this__6665.start > this__6665.end;
      if(and__3546__auto____6666) {
        return this__6665.step === 0
      }else {
        return and__3546__auto____6666
      }
    }()) {
      return this__6665.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6667 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6667.start + n * this__6667.step
  }else {
    if(function() {
      var and__3546__auto____6668 = this__6667.start > this__6667.end;
      if(and__3546__auto____6668) {
        return this__6667.step === 0
      }else {
        return and__3546__auto____6668
      }
    }()) {
      return this__6667.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6669 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6669.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6670 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6670)) {
      var s__6671 = temp__3698__auto____6670;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6671), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6671)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____6673 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____6673)) {
      var s__6674 = temp__3698__auto____6673;
      var fst__6675 = cljs.core.first.call(null, s__6674);
      var fv__6676 = f.call(null, fst__6675);
      var run__6677 = cljs.core.cons.call(null, fst__6675, cljs.core.take_while.call(null, function(p1__6672_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6676, f.call(null, p1__6672_SHARP_))
      }, cljs.core.next.call(null, s__6674)));
      return cljs.core.cons.call(null, run__6677, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6677), s__6674))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____6688 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____6688)) {
        var s__6689 = temp__3695__auto____6688;
        return reductions.call(null, f, cljs.core.first.call(null, s__6689), cljs.core.rest.call(null, s__6689))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____6690 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____6690)) {
        var s__6691 = temp__3698__auto____6690;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6691)), cljs.core.rest.call(null, s__6691))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6693 = null;
      var G__6693__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6693__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6693__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6693__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6693__4 = function() {
        var G__6694__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6694 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6694__delegate.call(this, x, y, z, args)
        };
        G__6694.cljs$lang$maxFixedArity = 3;
        G__6694.cljs$lang$applyTo = function(arglist__6695) {
          var x = cljs.core.first(arglist__6695);
          var y = cljs.core.first(cljs.core.next(arglist__6695));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6695)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6695)));
          return G__6694__delegate(x, y, z, args)
        };
        G__6694.cljs$lang$arity$variadic = G__6694__delegate;
        return G__6694
      }();
      G__6693 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6693__0.call(this);
          case 1:
            return G__6693__1.call(this, x);
          case 2:
            return G__6693__2.call(this, x, y);
          case 3:
            return G__6693__3.call(this, x, y, z);
          default:
            return G__6693__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6693.cljs$lang$maxFixedArity = 3;
      G__6693.cljs$lang$applyTo = G__6693__4.cljs$lang$applyTo;
      return G__6693
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6696 = null;
      var G__6696__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6696__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6696__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6696__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6696__4 = function() {
        var G__6697__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6697 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6697__delegate.call(this, x, y, z, args)
        };
        G__6697.cljs$lang$maxFixedArity = 3;
        G__6697.cljs$lang$applyTo = function(arglist__6698) {
          var x = cljs.core.first(arglist__6698);
          var y = cljs.core.first(cljs.core.next(arglist__6698));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6698)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6698)));
          return G__6697__delegate(x, y, z, args)
        };
        G__6697.cljs$lang$arity$variadic = G__6697__delegate;
        return G__6697
      }();
      G__6696 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6696__0.call(this);
          case 1:
            return G__6696__1.call(this, x);
          case 2:
            return G__6696__2.call(this, x, y);
          case 3:
            return G__6696__3.call(this, x, y, z);
          default:
            return G__6696__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6696.cljs$lang$maxFixedArity = 3;
      G__6696.cljs$lang$applyTo = G__6696__4.cljs$lang$applyTo;
      return G__6696
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6699 = null;
      var G__6699__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6699__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6699__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6699__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6699__4 = function() {
        var G__6700__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6700 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6700__delegate.call(this, x, y, z, args)
        };
        G__6700.cljs$lang$maxFixedArity = 3;
        G__6700.cljs$lang$applyTo = function(arglist__6701) {
          var x = cljs.core.first(arglist__6701);
          var y = cljs.core.first(cljs.core.next(arglist__6701));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6701)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6701)));
          return G__6700__delegate(x, y, z, args)
        };
        G__6700.cljs$lang$arity$variadic = G__6700__delegate;
        return G__6700
      }();
      G__6699 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6699__0.call(this);
          case 1:
            return G__6699__1.call(this, x);
          case 2:
            return G__6699__2.call(this, x, y);
          case 3:
            return G__6699__3.call(this, x, y, z);
          default:
            return G__6699__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6699.cljs$lang$maxFixedArity = 3;
      G__6699.cljs$lang$applyTo = G__6699__4.cljs$lang$applyTo;
      return G__6699
    }()
  };
  var juxt__4 = function() {
    var G__6702__delegate = function(f, g, h, fs) {
      var fs__6692 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6703 = null;
        var G__6703__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6678_SHARP_, p2__6679_SHARP_) {
            return cljs.core.conj.call(null, p1__6678_SHARP_, p2__6679_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6692)
        };
        var G__6703__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6680_SHARP_, p2__6681_SHARP_) {
            return cljs.core.conj.call(null, p1__6680_SHARP_, p2__6681_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6692)
        };
        var G__6703__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6682_SHARP_, p2__6683_SHARP_) {
            return cljs.core.conj.call(null, p1__6682_SHARP_, p2__6683_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6692)
        };
        var G__6703__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6684_SHARP_, p2__6685_SHARP_) {
            return cljs.core.conj.call(null, p1__6684_SHARP_, p2__6685_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6692)
        };
        var G__6703__4 = function() {
          var G__6704__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6686_SHARP_, p2__6687_SHARP_) {
              return cljs.core.conj.call(null, p1__6686_SHARP_, cljs.core.apply.call(null, p2__6687_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6692)
          };
          var G__6704 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6704__delegate.call(this, x, y, z, args)
          };
          G__6704.cljs$lang$maxFixedArity = 3;
          G__6704.cljs$lang$applyTo = function(arglist__6705) {
            var x = cljs.core.first(arglist__6705);
            var y = cljs.core.first(cljs.core.next(arglist__6705));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6705)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6705)));
            return G__6704__delegate(x, y, z, args)
          };
          G__6704.cljs$lang$arity$variadic = G__6704__delegate;
          return G__6704
        }();
        G__6703 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6703__0.call(this);
            case 1:
              return G__6703__1.call(this, x);
            case 2:
              return G__6703__2.call(this, x, y);
            case 3:
              return G__6703__3.call(this, x, y, z);
            default:
              return G__6703__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6703.cljs$lang$maxFixedArity = 3;
        G__6703.cljs$lang$applyTo = G__6703__4.cljs$lang$applyTo;
        return G__6703
      }()
    };
    var G__6702 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6702__delegate.call(this, f, g, h, fs)
    };
    G__6702.cljs$lang$maxFixedArity = 3;
    G__6702.cljs$lang$applyTo = function(arglist__6706) {
      var f = cljs.core.first(arglist__6706);
      var g = cljs.core.first(cljs.core.next(arglist__6706));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6706)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6706)));
      return G__6702__delegate(f, g, h, fs)
    };
    G__6702.cljs$lang$arity$variadic = G__6702__delegate;
    return G__6702
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__6708 = cljs.core.next.call(null, coll);
        coll = G__6708;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____6707 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____6707)) {
          return n > 0
        }else {
          return and__3546__auto____6707
        }
      }())) {
        var G__6709 = n - 1;
        var G__6710 = cljs.core.next.call(null, coll);
        n = G__6709;
        coll = G__6710;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__6711 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6711), s)) {
    if(cljs.core.count.call(null, matches__6711) === 1) {
      return cljs.core.first.call(null, matches__6711)
    }else {
      return cljs.core.vec.call(null, matches__6711)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6712 = re.exec(s);
  if(matches__6712 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6712) === 1) {
      return cljs.core.first.call(null, matches__6712)
    }else {
      return cljs.core.vec.call(null, matches__6712)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6713 = cljs.core.re_find.call(null, re, s);
  var match_idx__6714 = s.search(re);
  var match_str__6715 = cljs.core.coll_QMARK_.call(null, match_data__6713) ? cljs.core.first.call(null, match_data__6713) : match_data__6713;
  var post_match__6716 = cljs.core.subs.call(null, s, match_idx__6714 + cljs.core.count.call(null, match_str__6715));
  if(cljs.core.truth_(match_data__6713)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6713, re_seq.call(null, re, post_match__6716))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6718__6719 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6720 = cljs.core.nth.call(null, vec__6718__6719, 0, null);
  var flags__6721 = cljs.core.nth.call(null, vec__6718__6719, 1, null);
  var pattern__6722 = cljs.core.nth.call(null, vec__6718__6719, 2, null);
  return new RegExp(pattern__6722, flags__6721)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6717_SHARP_) {
    return print_one.call(null, p1__6717_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____6723 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____6723)) {
            var and__3546__auto____6727 = function() {
              var G__6724__6725 = obj;
              if(G__6724__6725 != null) {
                if(function() {
                  var or__3548__auto____6726 = G__6724__6725.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3548__auto____6726) {
                    return or__3548__auto____6726
                  }else {
                    return G__6724__6725.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6724__6725.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6724__6725)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6724__6725)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____6727)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____6727
            }
          }else {
            return and__3546__auto____6723
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3546__auto____6728 = obj != null;
          if(and__3546__auto____6728) {
            return obj.cljs$lang$type
          }else {
            return and__3546__auto____6728
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6729__6730 = obj;
          if(G__6729__6730 != null) {
            if(function() {
              var or__3548__auto____6731 = G__6729__6730.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3548__auto____6731) {
                return or__3548__auto____6731
              }else {
                return G__6729__6730.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6729__6730.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6729__6730)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6729__6730)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6732 = cljs.core.first.call(null, objs);
  var sb__6733 = new goog.string.StringBuffer;
  var G__6734__6735 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6734__6735)) {
    var obj__6736 = cljs.core.first.call(null, G__6734__6735);
    var G__6734__6737 = G__6734__6735;
    while(true) {
      if(obj__6736 === first_obj__6732) {
      }else {
        sb__6733.append(" ")
      }
      var G__6738__6739 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6736, opts));
      if(cljs.core.truth_(G__6738__6739)) {
        var string__6740 = cljs.core.first.call(null, G__6738__6739);
        var G__6738__6741 = G__6738__6739;
        while(true) {
          sb__6733.append(string__6740);
          var temp__3698__auto____6742 = cljs.core.next.call(null, G__6738__6741);
          if(cljs.core.truth_(temp__3698__auto____6742)) {
            var G__6738__6743 = temp__3698__auto____6742;
            var G__6746 = cljs.core.first.call(null, G__6738__6743);
            var G__6747 = G__6738__6743;
            string__6740 = G__6746;
            G__6738__6741 = G__6747;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6744 = cljs.core.next.call(null, G__6734__6737);
      if(cljs.core.truth_(temp__3698__auto____6744)) {
        var G__6734__6745 = temp__3698__auto____6744;
        var G__6748 = cljs.core.first.call(null, G__6734__6745);
        var G__6749 = G__6734__6745;
        obj__6736 = G__6748;
        G__6734__6737 = G__6749;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6733
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6750 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6750.append("\n");
  return[cljs.core.str(sb__6750)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6751 = cljs.core.first.call(null, objs);
  var G__6752__6753 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6752__6753)) {
    var obj__6754 = cljs.core.first.call(null, G__6752__6753);
    var G__6752__6755 = G__6752__6753;
    while(true) {
      if(obj__6754 === first_obj__6751) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6756__6757 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6754, opts));
      if(cljs.core.truth_(G__6756__6757)) {
        var string__6758 = cljs.core.first.call(null, G__6756__6757);
        var G__6756__6759 = G__6756__6757;
        while(true) {
          cljs.core.string_print.call(null, string__6758);
          var temp__3698__auto____6760 = cljs.core.next.call(null, G__6756__6759);
          if(cljs.core.truth_(temp__3698__auto____6760)) {
            var G__6756__6761 = temp__3698__auto____6760;
            var G__6764 = cljs.core.first.call(null, G__6756__6761);
            var G__6765 = G__6756__6761;
            string__6758 = G__6764;
            G__6756__6759 = G__6765;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____6762 = cljs.core.next.call(null, G__6752__6755);
      if(cljs.core.truth_(temp__3698__auto____6762)) {
        var G__6752__6763 = temp__3698__auto____6762;
        var G__6766 = cljs.core.first.call(null, G__6752__6763);
        var G__6767 = G__6752__6763;
        obj__6754 = G__6766;
        G__6752__6755 = G__6767;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__6768) {
    var objs = cljs.core.seq(arglist__6768);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__6769) {
    var objs = cljs.core.seq(arglist__6769);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__6770) {
    var objs = cljs.core.seq(arglist__6770);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__6771) {
    var objs = cljs.core.seq(arglist__6771);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__6772) {
    var objs = cljs.core.seq(arglist__6772);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__6773) {
    var objs = cljs.core.seq(arglist__6773);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__6774) {
    var objs = cljs.core.seq(arglist__6774);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__6775) {
    var objs = cljs.core.seq(arglist__6775);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6776 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6776, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6777 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6777, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6778 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6778, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3698__auto____6779 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____6779)) {
        var nspc__6780 = temp__3698__auto____6779;
        return[cljs.core.str(nspc__6780), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3698__auto____6781 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____6781)) {
          var nspc__6782 = temp__3698__auto____6781;
          return[cljs.core.str(nspc__6782), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6783 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6783, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6784 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6784, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6785 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6786 = this;
  var G__6787__6788 = cljs.core.seq.call(null, this__6786.watches);
  if(cljs.core.truth_(G__6787__6788)) {
    var G__6790__6792 = cljs.core.first.call(null, G__6787__6788);
    var vec__6791__6793 = G__6790__6792;
    var key__6794 = cljs.core.nth.call(null, vec__6791__6793, 0, null);
    var f__6795 = cljs.core.nth.call(null, vec__6791__6793, 1, null);
    var G__6787__6796 = G__6787__6788;
    var G__6790__6797 = G__6790__6792;
    var G__6787__6798 = G__6787__6796;
    while(true) {
      var vec__6799__6800 = G__6790__6797;
      var key__6801 = cljs.core.nth.call(null, vec__6799__6800, 0, null);
      var f__6802 = cljs.core.nth.call(null, vec__6799__6800, 1, null);
      var G__6787__6803 = G__6787__6798;
      f__6802.call(null, key__6801, this$, oldval, newval);
      var temp__3698__auto____6804 = cljs.core.next.call(null, G__6787__6803);
      if(cljs.core.truth_(temp__3698__auto____6804)) {
        var G__6787__6805 = temp__3698__auto____6804;
        var G__6812 = cljs.core.first.call(null, G__6787__6805);
        var G__6813 = G__6787__6805;
        G__6790__6797 = G__6812;
        G__6787__6798 = G__6813;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__6806 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6806.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6807 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6807.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6808 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6808.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6809 = this;
  return this__6809.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6810 = this;
  return this__6810.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6811 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6820__delegate = function(x, p__6814) {
      var map__6815__6816 = p__6814;
      var map__6815__6817 = cljs.core.seq_QMARK_.call(null, map__6815__6816) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6815__6816) : map__6815__6816;
      var validator__6818 = cljs.core.get.call(null, map__6815__6817, "\ufdd0'validator");
      var meta__6819 = cljs.core.get.call(null, map__6815__6817, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6819, validator__6818, null)
    };
    var G__6820 = function(x, var_args) {
      var p__6814 = null;
      if(goog.isDef(var_args)) {
        p__6814 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6820__delegate.call(this, x, p__6814)
    };
    G__6820.cljs$lang$maxFixedArity = 1;
    G__6820.cljs$lang$applyTo = function(arglist__6821) {
      var x = cljs.core.first(arglist__6821);
      var p__6814 = cljs.core.rest(arglist__6821);
      return G__6820__delegate(x, p__6814)
    };
    G__6820.cljs$lang$arity$variadic = G__6820__delegate;
    return G__6820
  }();
  atom = function(x, var_args) {
    var p__6814 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____6822 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____6822)) {
    var validate__6823 = temp__3698__auto____6822;
    if(cljs.core.truth_(validate__6823.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__6824 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6824, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6825__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6825 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6825__delegate.call(this, a, f, x, y, z, more)
    };
    G__6825.cljs$lang$maxFixedArity = 5;
    G__6825.cljs$lang$applyTo = function(arglist__6826) {
      var a = cljs.core.first(arglist__6826);
      var f = cljs.core.first(cljs.core.next(arglist__6826));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6826)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6826))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6826)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6826)))));
      return G__6825__delegate(a, f, x, y, z, more)
    };
    G__6825.cljs$lang$arity$variadic = G__6825__delegate;
    return G__6825
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6827) {
    var iref = cljs.core.first(arglist__6827);
    var f = cljs.core.first(cljs.core.next(arglist__6827));
    var args = cljs.core.rest(cljs.core.next(arglist__6827));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__6828 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6828.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6829 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6829.state, function(p__6830) {
    var curr_state__6831 = p__6830;
    var curr_state__6832 = cljs.core.seq_QMARK_.call(null, curr_state__6831) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6831) : curr_state__6831;
    var done__6833 = cljs.core.get.call(null, curr_state__6832, "\ufdd0'done");
    if(cljs.core.truth_(done__6833)) {
      return curr_state__6832
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6829.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__6834__6835 = options;
    var map__6834__6836 = cljs.core.seq_QMARK_.call(null, map__6834__6835) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6834__6835) : map__6834__6835;
    var keywordize_keys__6837 = cljs.core.get.call(null, map__6834__6836, "\ufdd0'keywordize-keys");
    var keyfn__6838 = cljs.core.truth_(keywordize_keys__6837) ? cljs.core.keyword : cljs.core.str;
    var f__6844 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____6843 = function iter__6839(s__6840) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__6840__6841 = s__6840;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__6840__6841))) {
                        var k__6842 = cljs.core.first.call(null, s__6840__6841);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__6838.call(null, k__6842), thisfn.call(null, x[k__6842])]), iter__6839.call(null, cljs.core.rest.call(null, s__6840__6841)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____6843.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__6844.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__6845) {
    var x = cljs.core.first(arglist__6845);
    var options = cljs.core.rest(arglist__6845);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__6846 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__6850__delegate = function(args) {
      var temp__3695__auto____6847 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__6846), args);
      if(cljs.core.truth_(temp__3695__auto____6847)) {
        var v__6848 = temp__3695__auto____6847;
        return v__6848
      }else {
        var ret__6849 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__6846, cljs.core.assoc, args, ret__6849);
        return ret__6849
      }
    };
    var G__6850 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6850__delegate.call(this, args)
    };
    G__6850.cljs$lang$maxFixedArity = 0;
    G__6850.cljs$lang$applyTo = function(arglist__6851) {
      var args = cljs.core.seq(arglist__6851);
      return G__6850__delegate(args)
    };
    G__6850.cljs$lang$arity$variadic = G__6850__delegate;
    return G__6850
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__6852 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__6852)) {
        var G__6853 = ret__6852;
        f = G__6853;
        continue
      }else {
        return ret__6852
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6854__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6854 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6854__delegate.call(this, f, args)
    };
    G__6854.cljs$lang$maxFixedArity = 1;
    G__6854.cljs$lang$applyTo = function(arglist__6855) {
      var f = cljs.core.first(arglist__6855);
      var args = cljs.core.rest(arglist__6855);
      return G__6854__delegate(f, args)
    };
    G__6854.cljs$lang$arity$variadic = G__6854__delegate;
    return G__6854
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__6856 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__6856, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__6856, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3548__auto____6857 = cljs.core._EQ_.call(null, child, parent);
    if(or__3548__auto____6857) {
      return or__3548__auto____6857
    }else {
      var or__3548__auto____6858 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3548__auto____6858) {
        return or__3548__auto____6858
      }else {
        var and__3546__auto____6859 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3546__auto____6859) {
          var and__3546__auto____6860 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3546__auto____6860) {
            var and__3546__auto____6861 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3546__auto____6861) {
              var ret__6862 = true;
              var i__6863 = 0;
              while(true) {
                if(function() {
                  var or__3548__auto____6864 = cljs.core.not.call(null, ret__6862);
                  if(or__3548__auto____6864) {
                    return or__3548__auto____6864
                  }else {
                    return i__6863 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__6862
                }else {
                  var G__6865 = isa_QMARK_.call(null, h, child.call(null, i__6863), parent.call(null, i__6863));
                  var G__6866 = i__6863 + 1;
                  ret__6862 = G__6865;
                  i__6863 = G__6866;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____6861
            }
          }else {
            return and__3546__auto____6860
          }
        }else {
          return and__3546__auto____6859
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__6870 = "\ufdd0'parents".call(null, h);
    var td__6871 = "\ufdd0'descendants".call(null, h);
    var ta__6872 = "\ufdd0'ancestors".call(null, h);
    var tf__6873 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____6874 = cljs.core.contains_QMARK_.call(null, tp__6870.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__6872.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__6872.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__6870, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__6873.call(null, "\ufdd0'ancestors".call(null, h), tag, td__6871, parent, ta__6872), "\ufdd0'descendants":tf__6873.call(null, "\ufdd0'descendants".call(null, h), parent, ta__6872, tag, td__6871)})
    }();
    if(cljs.core.truth_(or__3548__auto____6874)) {
      return or__3548__auto____6874
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__6875 = "\ufdd0'parents".call(null, h);
    var childsParents__6876 = cljs.core.truth_(parentMap__6875.call(null, tag)) ? cljs.core.disj.call(null, parentMap__6875.call(null, tag), parent) : cljs.core.set([]);
    var newParents__6877 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__6876)) ? cljs.core.assoc.call(null, parentMap__6875, tag, childsParents__6876) : cljs.core.dissoc.call(null, parentMap__6875, tag);
    var deriv_seq__6878 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__6867_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6867_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6867_SHARP_), cljs.core.second.call(null, p1__6867_SHARP_)))
    }, cljs.core.seq.call(null, newParents__6877)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__6875.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6868_SHARP_, p2__6869_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6868_SHARP_, p2__6869_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__6878))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__6879 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____6881 = cljs.core.truth_(function() {
    var and__3546__auto____6880 = xprefs__6879;
    if(cljs.core.truth_(and__3546__auto____6880)) {
      return xprefs__6879.call(null, y)
    }else {
      return and__3546__auto____6880
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____6881)) {
    return or__3548__auto____6881
  }else {
    var or__3548__auto____6883 = function() {
      var ps__6882 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__6882) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__6882), prefer_table))) {
          }else {
          }
          var G__6886 = cljs.core.rest.call(null, ps__6882);
          ps__6882 = G__6886;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____6883)) {
      return or__3548__auto____6883
    }else {
      var or__3548__auto____6885 = function() {
        var ps__6884 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__6884) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__6884), y, prefer_table))) {
            }else {
            }
            var G__6887 = cljs.core.rest.call(null, ps__6884);
            ps__6884 = G__6887;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____6885)) {
        return or__3548__auto____6885
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____6888 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____6888)) {
    return or__3548__auto____6888
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__6897 = cljs.core.reduce.call(null, function(be, p__6889) {
    var vec__6890__6891 = p__6889;
    var k__6892 = cljs.core.nth.call(null, vec__6890__6891, 0, null);
    var ___6893 = cljs.core.nth.call(null, vec__6890__6891, 1, null);
    var e__6894 = vec__6890__6891;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__6892)) {
      var be2__6896 = cljs.core.truth_(function() {
        var or__3548__auto____6895 = be == null;
        if(or__3548__auto____6895) {
          return or__3548__auto____6895
        }else {
          return cljs.core.dominates.call(null, k__6892, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__6894 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__6896), k__6892, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__6892), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__6896)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__6896
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__6897)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__6897));
      return cljs.core.second.call(null, best_entry__6897)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3546__auto____6898 = mf;
    if(and__3546__auto____6898) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3546__auto____6898
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6899 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6899) {
        return or__3548__auto____6899
      }else {
        var or__3548__auto____6900 = cljs.core._reset["_"];
        if(or__3548__auto____6900) {
          return or__3548__auto____6900
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3546__auto____6901 = mf;
    if(and__3546__auto____6901) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3546__auto____6901
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____6902 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6902) {
        return or__3548__auto____6902
      }else {
        var or__3548__auto____6903 = cljs.core._add_method["_"];
        if(or__3548__auto____6903) {
          return or__3548__auto____6903
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____6904 = mf;
    if(and__3546__auto____6904) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3546__auto____6904
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____6905 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6905) {
        return or__3548__auto____6905
      }else {
        var or__3548__auto____6906 = cljs.core._remove_method["_"];
        if(or__3548__auto____6906) {
          return or__3548__auto____6906
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3546__auto____6907 = mf;
    if(and__3546__auto____6907) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3546__auto____6907
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____6908 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6908) {
        return or__3548__auto____6908
      }else {
        var or__3548__auto____6909 = cljs.core._prefer_method["_"];
        if(or__3548__auto____6909) {
          return or__3548__auto____6909
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____6910 = mf;
    if(and__3546__auto____6910) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3546__auto____6910
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____6911 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6911) {
        return or__3548__auto____6911
      }else {
        var or__3548__auto____6912 = cljs.core._get_method["_"];
        if(or__3548__auto____6912) {
          return or__3548__auto____6912
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3546__auto____6913 = mf;
    if(and__3546__auto____6913) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3546__auto____6913
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6914 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6914) {
        return or__3548__auto____6914
      }else {
        var or__3548__auto____6915 = cljs.core._methods["_"];
        if(or__3548__auto____6915) {
          return or__3548__auto____6915
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3546__auto____6916 = mf;
    if(and__3546__auto____6916) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3546__auto____6916
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____6917 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6917) {
        return or__3548__auto____6917
      }else {
        var or__3548__auto____6918 = cljs.core._prefers["_"];
        if(or__3548__auto____6918) {
          return or__3548__auto____6918
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3546__auto____6919 = mf;
    if(and__3546__auto____6919) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3546__auto____6919
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3548__auto____6920 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3548__auto____6920) {
        return or__3548__auto____6920
      }else {
        var or__3548__auto____6921 = cljs.core._dispatch["_"];
        if(or__3548__auto____6921) {
          return or__3548__auto____6921
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__6922 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__6923 = cljs.core._get_method.call(null, mf, dispatch_val__6922);
  if(cljs.core.truth_(target_fn__6923)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__6922)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__6923, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6924 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__6925 = this;
  cljs.core.swap_BANG_.call(null, this__6925.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6925.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6925.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6925.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__6926 = this;
  cljs.core.swap_BANG_.call(null, this__6926.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__6926.method_cache, this__6926.method_table, this__6926.cached_hierarchy, this__6926.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__6927 = this;
  cljs.core.swap_BANG_.call(null, this__6927.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__6927.method_cache, this__6927.method_table, this__6927.cached_hierarchy, this__6927.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__6928 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__6928.cached_hierarchy), cljs.core.deref.call(null, this__6928.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__6928.method_cache, this__6928.method_table, this__6928.cached_hierarchy, this__6928.hierarchy)
  }
  var temp__3695__auto____6929 = cljs.core.deref.call(null, this__6928.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____6929)) {
    var target_fn__6930 = temp__3695__auto____6929;
    return target_fn__6930
  }else {
    var temp__3695__auto____6931 = cljs.core.find_and_cache_best_method.call(null, this__6928.name, dispatch_val, this__6928.hierarchy, this__6928.method_table, this__6928.prefer_table, this__6928.method_cache, this__6928.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____6931)) {
      var target_fn__6932 = temp__3695__auto____6931;
      return target_fn__6932
    }else {
      return cljs.core.deref.call(null, this__6928.method_table).call(null, this__6928.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__6933 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__6933.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__6933.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__6933.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__6933.method_cache, this__6933.method_table, this__6933.cached_hierarchy, this__6933.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__6934 = this;
  return cljs.core.deref.call(null, this__6934.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__6935 = this;
  return cljs.core.deref.call(null, this__6935.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__6936 = this;
  return cljs.core.do_dispatch.call(null, mf, this__6936.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__6937__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__6937 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6937__delegate.call(this, _, args)
  };
  G__6937.cljs$lang$maxFixedArity = 1;
  G__6937.cljs$lang$applyTo = function(arglist__6938) {
    var _ = cljs.core.first(arglist__6938);
    var args = cljs.core.rest(arglist__6938);
    return G__6937__delegate(_, args)
  };
  G__6937.cljs$lang$arity$variadic = G__6937__delegate;
  return G__6937
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("grunner.core");
goog.require("cljs.core");
grunner.core.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__4423) {
          var vec__4424__4425 = p__4423;
          var k__4426 = cljs.core.nth.call(null, vec__4424__4425, 0, null);
          var v__4427 = cljs.core.nth.call(null, vec__4424__4425, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__4426), clj__GT_js.call(null, v__4427))
        }, cljs.core.ObjMap.fromObject([], {}), x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
grunner.core.data = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'player", "\ufdd0'view", "\ufdd0'score", "\ufdd0'dead?"], {"\ufdd0'player":cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y", "\ufdd0'vx", "\ufdd0'vy", "\ufdd0'jumping"], {"\ufdd0'x":500, "\ufdd0'y":200, "\ufdd0'vx":100, "\ufdd0'vy":0, "\ufdd0'jumping":0}), "\ufdd0'view":cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y"], {"\ufdd0'x":0, "\ufdd0'y":0}), "\ufdd0'score":0, "\ufdd0'dead?":false}));
grunner.core.gee = cljs.core.atom.call(null, null);
grunner.core.ctx = cljs.core.atom.call(null, null);
grunner.core.circle = function circle(x, y, radx, rady) {
  cljs.core.deref.call(null, grunner.core.ctx).save();
  cljs.core.deref.call(null, grunner.core.ctx).scale(1, rady / radx);
  cljs.core.deref.call(null, grunner.core.ctx).beginPath();
  cljs.core.deref.call(null, grunner.core.ctx).arc(x, y * radx / rady, radx, 0, 2 * Math.PI, true);
  cljs.core.deref.call(null, grunner.core.ctx).closePath();
  cljs.core.deref.call(null, grunner.core.ctx).fill();
  return cljs.core.deref.call(null, grunner.core.ctx).restore()
};
grunner.core.line = function line(x1, y1, x2, y2) {
  cljs.core.deref.call(null, grunner.core.ctx).beginPath();
  cljs.core.deref.call(null, grunner.core.ctx).moveTo(x1, y1);
  cljs.core.deref.call(null, grunner.core.ctx).lineTo(x2, y2);
  cljs.core.deref.call(null, grunner.core.ctx).closePath();
  return cljs.core.deref.call(null, grunner.core.ctx).stroke()
};
grunner.core.line2 = function line2(x1, y1, x2, y2) {
  cljs.core.deref.call(null, grunner.core.ctx).moveTo(x1, y1);
  return cljs.core.deref.call(null, grunner.core.ctx).lineTo(x2, y2)
};
grunner.core.rectangle2 = function rectangle2(x1, y1, x2, y2) {
  cljs.core.deref.call(null, grunner.core.ctx).moveTo(x1, y1);
  cljs.core.deref.call(null, grunner.core.ctx).lineTo(x2, y1);
  cljs.core.deref.call(null, grunner.core.ctx).lineTo(x2, y2);
  return cljs.core.deref.call(null, grunner.core.ctx).lineTo(x1, y2)
};
grunner.core.on_screen_QMARK_ = function on_screen_QMARK_(p__4428) {
  var map__4429__4430 = p__4428;
  var map__4429__4431 = cljs.core.seq_QMARK_.call(null, map__4429__4430) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4429__4430) : map__4429__4430;
  var x__4432 = cljs.core.get.call(null, map__4429__4431, "\ufdd0'x");
  var y__4433 = cljs.core.get.call(null, map__4429__4431, "\ufdd0'y");
  var width__4434 = cljs.core.deref.call(null, grunner.core.gee).width;
  var height__4435 = cljs.core.deref.call(null, grunner.core.gee).height;
  var and__3546__auto____4436 = 0 < x__4432 + 1;
  if(and__3546__auto____4436) {
    var and__3546__auto____4437 = x__4432 < width__4434 + 1;
    if(and__3546__auto____4437) {
      var and__3546__auto____4438 = 0 < y__4433 + 1;
      if(and__3546__auto____4438) {
        return y__4433 < height__4435 + 1
      }else {
        return and__3546__auto____4438
      }
    }else {
      return and__3546__auto____4437
    }
  }else {
    return and__3546__auto____4436
  }
};
grunner.core.seeded_rand_int = function seeded_rand_int(x, n) {
  var alea__4439 = new Alea(x);
  var int_generator__4440 = alea__4439.uint32;
  return int_generator__4440.call(null) % n
};
grunner.core.width_stream = function width_stream(p__4441) {
  var vec__4442__4443 = p__4441;
  var previous_x__4444 = cljs.core.nth.call(null, vec__4442__4443, 0, null);
  var previous_width__4445 = cljs.core.nth.call(null, vec__4442__4443, 1, null);
  var previous_height__4446 = cljs.core.nth.call(null, vec__4442__4443, 2, null);
  return 20 * (grunner.core.seeded_rand_int.call(null, previous_x__4444, 8) + 1)
};
grunner.core.height_stream = function height_stream(p__4447) {
  var vec__4448__4449 = p__4447;
  var previous_x__4450 = cljs.core.nth.call(null, vec__4448__4449, 0, null);
  var previous_width__4451 = cljs.core.nth.call(null, vec__4448__4449, 1, null);
  var previous_height__4452 = cljs.core.nth.call(null, vec__4448__4449, 2, null);
  var new_height__4453 = previous_height__4452 + (10 * grunner.core.seeded_rand_int.call(null, previous_x__4450, 10) - 50);
  if(new_height__4453 < 0) {
    return 0
  }else {
    return new_height__4453
  }
};
grunner.core.level_stream = function level_stream(previous) {
  var x__4454 = cljs.core.first.call(null, previous);
  var width__4455 = grunner.core.width_stream.call(null, previous);
  var height__4456 = grunner.core.height_stream.call(null, previous);
  return new cljs.core.LazySeq(null, false, function() {
    return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([x__4454, width__4455, height__4456]), level_stream.call(null, cljs.core.PersistentVector.fromArray([x__4454 + width__4455, width__4455, height__4456])))
  })
};
grunner.core.level_data = cljs.core.take.call(null, 1E3, grunner.core.level_stream.call(null, cljs.core.PersistentVector.fromArray([0, 100, 100])));
grunner.core.test = function test() {
  return console.log([cljs.core.str(grunner.core.level_data)].join(""))
};
grunner.core.get_level_data = function get_level_data(x, w) {
  var x__4457 = x;
  var w__4458 = w;
  var lx__4459 = 0;
  var cw__4460 = 0;
  var datas__4461 = grunner.core.level_data;
  var return$__4462 = cljs.core.PersistentVector.fromArray([]);
  while(true) {
    var vec__4463__4464 = cljs.core.first.call(null, datas__4461);
    var cx__4465 = cljs.core.nth.call(null, vec__4463__4464, 0, null);
    var width__4466 = cljs.core.nth.call(null, vec__4463__4464, 1, null);
    var height__4467 = cljs.core.nth.call(null, vec__4463__4464, 2, null);
    if(w__4458 <= cw__4460) {
      return return$__4462
    }else {
      if(x__4457 <= cx__4465 + width__4466) {
        var G__4468 = x__4457;
        var G__4469 = w__4458;
        var G__4470 = cx__4465 + width__4466;
        var G__4471 = cw__4460 + width__4466;
        var G__4472 = cljs.core.rest.call(null, datas__4461);
        var G__4473 = cljs.core.conj.call(null, return$__4462, cljs.core.PersistentVector.fromArray([cx__4465, width__4466, height__4467]));
        x__4457 = G__4468;
        w__4458 = G__4469;
        lx__4459 = G__4470;
        cw__4460 = G__4471;
        datas__4461 = G__4472;
        return$__4462 = G__4473;
        continue
      }else {
        var G__4474 = x__4457;
        var G__4475 = w__4458;
        var G__4476 = cx__4465 + width__4466;
        var G__4477 = cw__4460;
        var G__4478 = cljs.core.rest.call(null, datas__4461);
        var G__4479 = return$__4462;
        x__4457 = G__4474;
        w__4458 = G__4475;
        lx__4459 = G__4476;
        cw__4460 = G__4477;
        datas__4461 = G__4478;
        return$__4462 = G__4479;
        continue
      }
    }
    break
  }
};
grunner.core.collides_with_level_QMARK_ = function collides_with_level_QMARK_(x, y) {
  var vec__4480__4481 = cljs.core.first.call(null, grunner.core.get_level_data.call(null, x, 1));
  var lx__4482 = cljs.core.nth.call(null, vec__4480__4481, 0, null);
  var width__4483 = cljs.core.nth.call(null, vec__4480__4481, 1, null);
  var height__4484 = cljs.core.nth.call(null, vec__4480__4481, 2, null);
  return y < height__4484
};
grunner.core.on_ground_QMARK_ = function on_ground_QMARK_(x, y) {
  var vec__4485__4486 = cljs.core.first.call(null, grunner.core.get_level_data.call(null, x, 1));
  var lx__4487 = cljs.core.nth.call(null, vec__4485__4486, 0, null);
  var width__4488 = cljs.core.nth.call(null, vec__4485__4486, 1, null);
  var height__4489 = cljs.core.nth.call(null, vec__4485__4486, 2, null);
  return y <= height__4489 + 1.5
};
grunner.core.simulate = function simulate() {
  var map__4490__4493 = cljs.core.deref.call(null, grunner.core.data).call(null, "\ufdd0'player");
  var map__4490__4494 = cljs.core.seq_QMARK_.call(null, map__4490__4493) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4490__4493) : map__4490__4493;
  var x__4495 = cljs.core.get.call(null, map__4490__4494, "\ufdd0'x");
  var y__4496 = cljs.core.get.call(null, map__4490__4494, "\ufdd0'y");
  var vx__4497 = cljs.core.get.call(null, map__4490__4494, "\ufdd0'vx");
  var vy__4498 = cljs.core.get.call(null, map__4490__4494, "\ufdd0'vy");
  var jump_QMARK___4499 = cljs.core.get.call(null, map__4490__4494, "\ufdd0'jump?");
  var jumping__4500 = cljs.core.get.call(null, map__4490__4494, "\ufdd0'jumping");
  var dt__4501 = 1 / 60;
  var ax__4502 = 100;
  var ay__4503 = -9.81 * 100;
  var ground_QMARK___4504 = grunner.core.on_ground_QMARK_.call(null, x__4495, y__4496);
  var jvy__4506 = cljs.core.truth_(function() {
    var and__3546__auto____4505 = jump_QMARK___4499;
    if(cljs.core.truth_(and__3546__auto____4505)) {
      return ground_QMARK___4504
    }else {
      return and__3546__auto____4505
    }
  }()) ? Math.min.call(null, jumping__4500 + 2, 8) * 100 : 0;
  var nvx__4507 = vx__4497 + ax__4502 * dt__4501;
  var nvy__4508 = vy__4498 + jvy__4506 + ay__4503 * dt__4501;
  var nx__4509 = x__4495 + nvx__4507 * dt__4501;
  var ny__4510 = y__4496 + nvy__4508 * dt__4501;
  var vvx__4511 = Math.max.call(null, cljs.core.get_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'view", "\ufdd0'vx"]), 1), nvx__4507 * dt__4501);
  var vec__4491__4512 = cljs.core.first.call(null, grunner.core.get_level_data.call(null, x__4495, 1));
  var lx__4513 = cljs.core.nth.call(null, vec__4491__4512, 0, null);
  var width__4514 = cljs.core.nth.call(null, vec__4491__4512, 1, null);
  var height__4515 = cljs.core.nth.call(null, vec__4491__4512, 2, null);
  var min_view_x__4516 = 500;
  var vec__4492__4517 = cljs.core.truth_(grunner.core.collides_with_level_QMARK_.call(null, nx__4509, ny__4510)) ? cljs.core.truth_(grunner.core.collides_with_level_QMARK_.call(null, nx__4509, y__4496)) ? cljs.core.truth_(grunner.core.collides_with_level_QMARK_.call(null, x__4495, ny__4510)) ? cljs.core.PersistentVector.fromArray([x__4495, y__4496, 0, nvy__4508 < 0 ? 0 : nvy__4508, true]) : cljs.core.PersistentVector.fromArray([x__4495, ny__4510, 0, nvy__4508, true]) : cljs.core.PersistentVector.fromArray([nx__4509, 
  ny__4510 < height__4515 ? height__4515 : y__4496, nvx__4507, 0, true]) : cljs.core.PersistentVector.fromArray([nx__4509, ny__4510, nvx__4507, nvy__4508, false]);
  var x__4518 = cljs.core.nth.call(null, vec__4492__4517, 0, null);
  var y__4519 = cljs.core.nth.call(null, vec__4492__4517, 1, null);
  var vx__4520 = cljs.core.nth.call(null, vec__4492__4517, 2, null);
  var vy__4521 = cljs.core.nth.call(null, vec__4492__4517, 3, null);
  var collided_QMARK___4522 = cljs.core.nth.call(null, vec__4492__4517, 4, null);
  cljs.core.swap_BANG_.call(null, grunner.core.data, function() {
    return cljs.core.assoc_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'x"]), x__4518)
  });
  cljs.core.swap_BANG_.call(null, grunner.core.data, function() {
    return cljs.core.assoc_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'y"]), y__4519)
  });
  cljs.core.swap_BANG_.call(null, grunner.core.data, function() {
    return cljs.core.assoc_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'vx"]), vx__4520)
  });
  cljs.core.swap_BANG_.call(null, grunner.core.data, function() {
    return cljs.core.assoc_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'vy"]), vy__4521)
  });
  if(jumping__4500 >= 0) {
    cljs.core.swap_BANG_.call(null, grunner.core.data, function(data) {
      return cljs.core.update_in.call(null, data, cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'jumping"]), cljs.core.inc)
    })
  }else {
  }
  if(cljs.core.truth_(jump_QMARK___4499)) {
    cljs.core.swap_BANG_.call(null, grunner.core.data, function(data) {
      return cljs.core.assoc_in.call(null, data, cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'jumping"]), 0)
    })
  }else {
  }
  cljs.core.swap_BANG_.call(null, grunner.core.data, function(data) {
    return cljs.core.assoc_in.call(null, data, cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'jump?"]), false)
  });
  cljs.core.swap_BANG_.call(null, grunner.core.data, function(data) {
    return cljs.core.update_in.call(null, data, cljs.core.PersistentVector.fromArray(["\ufdd0'view", "\ufdd0'vx"]), cljs.core.max, vvx__4511)
  });
  cljs.core.swap_BANG_.call(null, grunner.core.data, function(data) {
    return cljs.core.update_in.call(null, data, cljs.core.PersistentVector.fromArray(["\ufdd0'view", "\ufdd0'x"]), function(old) {
      if(old + min_view_x__4516 < x__4518) {
        return x__4518 - min_view_x__4516
      }else {
        return old + vvx__4511
      }
    })
  });
  if(x__4518 < cljs.core.get_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'view", "\ufdd0'x"]))) {
    cljs.core.swap_BANG_.call(null, grunner.core.data, function() {
      return cljs.core.assoc_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'dead?"]), true)
    })
  }else {
  }
  return cljs.core.swap_BANG_.call(null, grunner.core.data, function() {
    return cljs.core.assoc_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'score"]), Math.round.call(null, x__4518))
  })
};
grunner.core.draw = function draw() {
  if(cljs.core.truth_(cljs.core.deref.call(null, grunner.core.data).call(null, "\ufdd0'dead?"))) {
  }else {
    grunner.core.simulate.call(null)
  }
  var screen_width__4523 = cljs.core.deref.call(null, grunner.core.gee).width;
  var screen_height__4524 = cljs.core.deref.call(null, grunner.core.gee).height;
  var view_x__4525 = cljs.core.get_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'view", "\ufdd0'x"]));
  cljs.core.deref.call(null, grunner.core.ctx).fillStyle = "rgb(70, 75, 75)";
  cljs.core.deref.call(null, grunner.core.ctx).fillRect(0, 0, screen_width__4523, screen_height__4524);
  cljs.core.deref.call(null, grunner.core.ctx).fillStyle = "rgb(255, 255, 255)";
  cljs.core.deref.call(null, grunner.core.ctx).strokeStyle = "rgba(255, 255, 255, 0.2)";
  cljs.core.deref.call(null, grunner.core.ctx).fillStyle = "rgb(255, 255, 255)";
  cljs.core.deref.call(null, grunner.core.ctx).font = "bold 30px sans-serif";
  cljs.core.deref.call(null, grunner.core.ctx).textAlign = "left";
  cljs.core.deref.call(null, grunner.core.ctx).textBaseline = "middle";
  cljs.core.deref.call(null, grunner.core.ctx).font = "20pt Courier New";
  cljs.core.deref.call(null, grunner.core.ctx).fillText([cljs.core.str("fps "), cljs.core.str(Math.round.call(null, cljs.core.deref.call(null, grunner.core.gee).frameRate))].join(""), 50, 20);
  cljs.core.deref.call(null, grunner.core.ctx).fillText([cljs.core.str("score "), cljs.core.str(cljs.core.deref.call(null, grunner.core.data).call(null, "\ufdd0'score"))].join(""), 50, 50);
  cljs.core.deref.call(null, grunner.core.ctx).fillText([cljs.core.str("jumping "), cljs.core.str(cljs.core.get_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'jumping"])))].join(""), 50, 80);
  cljs.core.deref.call(null, grunner.core.ctx).font = "normal 18px sans-serif";
  cljs.core.deref.call(null, grunner.core.ctx).strokeStyle = "rgb(255, 255, 255)";
  cljs.core.deref.call(null, grunner.core.ctx).fillStyle = "rgb(255, 255, 255)";
  var levels__4526 = grunner.core.get_level_data.call(null, view_x__4525, 1.5 * screen_width__4523);
  cljs.core.dorun.call(null, cljs.core.map.call(null, function(p__4527) {
    var vec__4528__4529 = p__4527;
    var x__4530 = cljs.core.nth.call(null, vec__4528__4529, 0, null);
    var width__4531 = cljs.core.nth.call(null, vec__4528__4529, 1, null);
    var height__4532 = cljs.core.nth.call(null, vec__4528__4529, 2, null);
    var x__4533 = x__4530 - view_x__4525;
    cljs.core.deref.call(null, grunner.core.ctx).beginPath();
    grunner.core.rectangle2.call(null, x__4533, screen_height__4524 - height__4532 - 200, x__4533 + width__4531, screen_height__4524);
    cljs.core.deref.call(null, grunner.core.ctx).closePath();
    cljs.core.deref.call(null, grunner.core.ctx).fillStyle = "rgb(100, 100, 100)";
    return cljs.core.deref.call(null, grunner.core.ctx).fill()
  }, levels__4526));
  cljs.core.deref.call(null, grunner.core.ctx).strokeStyle = "rgb(255, 255, 255)";
  cljs.core.deref.call(null, grunner.core.ctx).fillStyle = "rgb(255, 255, 255)";
  var map__4534__4535 = cljs.core.deref.call(null, grunner.core.data).call(null, "\ufdd0'player");
  var map__4534__4536 = cljs.core.seq_QMARK_.call(null, map__4534__4535) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4534__4535) : map__4534__4535;
  var player_x__4537 = cljs.core.get.call(null, map__4534__4536, "\ufdd0'x");
  var player_y__4538 = cljs.core.get.call(null, map__4534__4536, "\ufdd0'y");
  var jumping__4539 = cljs.core.get.call(null, map__4534__4536, "\ufdd0'jumping");
  var x__4540 = player_x__4537 - view_x__4525;
  var s__4541 = 20 - Math.min.call(null, jumping__4539, 5);
  grunner.core.circle.call(null, x__4540, screen_height__4524 - player_y__4538 - 200 - s__4541, 15, 15);
  if(cljs.core.truth_(cljs.core.deref.call(null, grunner.core.data).call(null, "\ufdd0'dead?"))) {
    cljs.core.deref.call(null, grunner.core.ctx).textAlign = "center";
    cljs.core.deref.call(null, grunner.core.ctx).font = "60pt Courier New";
    return cljs.core.deref.call(null, grunner.core.ctx).fillText([cljs.core.str("G A M E  O V E R")].join(""), screen_width__4523 / 2, screen_height__4524 / 2)
  }else {
    return null
  }
};
grunner.core.move = function move() {
  return cljs.core.swap_BANG_.call(null, grunner.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, grunner.core.data), "\ufdd0'tx", cljs.core.deref.call(null, grunner.core.gee).mouseX, "\ufdd0'ty", cljs.core.deref.call(null, grunner.core.gee).mouseY)
  })
};
grunner.core.keydown = function keydown() {
  var map__4542__4543 = cljs.core.deref.call(null, grunner.core.data).call(null, grunner.core.player);
  var map__4542__4544 = cljs.core.seq_QMARK_.call(null, map__4542__4543) ? cljs.core.apply.call(null, cljs.core.hash_map, map__4542__4543) : map__4542__4543;
  var x__4545 = cljs.core.get.call(null, map__4542__4544, "\ufdd0'x");
  var y__4546 = cljs.core.get.call(null, map__4542__4544, "\ufdd0'y");
  var jumping__4547 = cljs.core.get.call(null, map__4542__4544, "\ufdd0'jumping");
  if(cljs.core.truth_(function() {
    var and__3546__auto____4548 = grunner.core.on_ground_QMARK_.call(null, x__4545, y__4546);
    if(cljs.core.truth_(and__3546__auto____4548)) {
      return cljs.core._EQ_.call(null, 0, jumping__4547)
    }else {
      return and__3546__auto____4548
    }
  }())) {
    return cljs.core.swap_BANG_.call(null, grunner.core.data, function() {
      return cljs.core.assoc_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'jumping"]), 1)
    })
  }else {
    return null
  }
};
grunner.core.keyup = function keyup() {
  return cljs.core.swap_BANG_.call(null, grunner.core.data, function() {
    return cljs.core.assoc_in.call(null, cljs.core.deref.call(null, grunner.core.data), cljs.core.PersistentVector.fromArray(["\ufdd0'player", "\ufdd0'jump?"]), true)
  })
};
grunner.core.start = function start() {
  cljs.core.swap_BANG_.call(null, grunner.core.gee, function() {
    return new window.GEE(grunner.core.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'fullscreen", "\ufdd0'context"], {"\ufdd0'fullscreen":true, "\ufdd0'context":"2d"})))
  });
  cljs.core.swap_BANG_.call(null, grunner.core.ctx, function() {
    return cljs.core.deref.call(null, grunner.core.gee).ctx
  });
  cljs.core.deref.call(null, grunner.core.gee).draw = grunner.core.draw;
  cljs.core.deref.call(null, grunner.core.gee).frameTime = "50";
  cljs.core.deref.call(null, grunner.core.gee).keydown = grunner.core.keydown;
  return cljs.core.deref.call(null, grunner.core.gee).keyup = grunner.core.keyup
};
