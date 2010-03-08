/*

Seems that we're going to implement
http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
and not
http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/java-binding.html


TODO

+ implement these setters through jsdom2
    + also implement setter/getter interface
    + also support no ___link available
+ implement innerHTML setter via parser -> load XML and attach node
+ NO! exclude <script>! use list of supported tags (exclude SCRIPT tag) SEE: <object> is OKAY !?!?! SECURITY PROBLEM!!
+ extend document interface
    ? prop: document.title, body, URL, width, height, styleSheets, ?links, (readyState, activeElement - HTML5)
    ? meth: document.[STD DOM], createEvent, hasFocus, ?write, (ononline, onoffline - MOZ)
    - body: set at inittime
+ implement event model
+ do the switch to xmldom2 as described in bind_dom
+ run all the above shit
((( do we need this ever?
    - introduce DOM clean hooks (and general clear on DELETE object event)
        - or clean DOM by calling clean by a parent? Then notify parent of child finish() (maybe thru iclib?)
    - test new clean hooks (the apps to remove from DOM)
)))
+ window.getComputedStyle(elementRef, pseudoElementName) Not supported in IE, which uses the "currentStyle" property instead.
+ window full support: selection, etc.
    - props: innerHeght/width to be set to containing element
    - methods:
+ selection objects WRAP
    - securioty issue of toString
+ range objects WRAP
    + document.createRange
    - security issue
    - internal XML mods
+ implement execCommand
+ event handlers: set 'this' pointer to the needed value (& modify the ABI of execf)
+ set 'navigator': 
    + userAgent object to return 'Jeneric (Gecko translator Jeneric 0.1)'
    + product to equal "Gecko"
+ set 'window.virtual' object to contain information about current VM: running environment, real user agent, etc.

- implement each HTML element interface as of mozilla DOM reference https://developer.mozilla.org/en/gecko_dom_reference
    + link
    + form
    - select
    (others, see https://developer.mozilla.org/en/gecko_dom_reference)
    see rhino env.js anyways; Gecko ref is incomplete
    http://www.google.com/codesearch/p?hl=en#PSg8XFiA2K0/plugins/jXmanip/lib/env.js&q=lang:javascript%20env.js%20rhino&sa=N&cd=1&ct=rc
- FORM SUBMIT healing with _target https://developer.mozilla.org/en/DOM/element.name - iframe name (associated with each form?)
    - create a default named target for all this stuff
    - implement a _target controlled setter (to set target to what is desired for developer)
- LINK HREF with _target = _blank
- IFRAME to support DOMDocument interface.. see http://www.mozilla.org/editor/ie2midas.html and others

- support for CSS loading/unloading and cleanup alongside with DOM!
    - allow apps to detect which browser is in case
- CSS fixups:
    - opacity setter for IE, to div.style.filter = "alpha(opacity=0)";
    - IE border transparency
- create IE-specific wrappers:  
    - add Event IE properties, window.event object
    - document.selection & TextContent
    - document.designMode
- implement *NS DOM methods: createElementNS and others,
- XXX TODO: remember the form submit problems as well as links problems (set navigate-away notifier?? with kernel disable initline)

wtf is: 
     // fix IE image caching issue
     4:         document.execCommand("BackgroundImageCache", false, true);

- CSS: setting-by-id problem? need to tweak element IDs??? ever possible to set CSS to elements without distortion?

??? automatic refactoring JSDOM into JNDOM ???    

    -----------
    
if(typeof(document.compatMode)=='undefined' || document.compatMode=='CSS1Compat')
return document.documentElement.clientWidth;
else return document.body.clientWidth;
-- WTF?


*/

Jnaric.prototype.bind_dom = function (wrapped_domElement) {
    
  
    /*
    if(typeof domElement == 'undefined')
        var l_body = new __HTMLElement(this, "BODY"); //fake element
    else {
        var l_body = new __HTMLElement(this, domElement);
    }
    */
    
    var self = this;
    
    // for new dom2 model:
    // + set up DOMDocument
    // + create "body" DIV node
    // +     set .body to .documentElement, and both to the given DIV container
    // + attach body's ___link to real domElement passed here
    // + set .___vm on created document
    
    // TODO: the following could be made faster if we create the document tree directly
    var di = new DOMImplementation(); // SLOW??
    
    // this is not conforming -> documentElement should be <html> and contain <head> and <title> or such
    this.global.document = di.loadXML("<div/>"); // SLOW???
    
    this.global.document.body = this.global.document.documentElement; // DOC this: documentElement == body!
    
    
    if(typeof wrapped_domElement != 'undefined')
            wrapped_domElement.___link.appendChild(this.global.document.body.___link);
    //TODO here: need to strip special chars from this-uri and replace them by char codes
    this.uriId = this.uri2id(this.uri);
    this.global.document.body.___link.id = this.uriId;
    
    this.global.document.___vm = this;
    
    this.global.document.defaultView = this.global;
    
    // now extend global with window
    // NO! window IS global!
    /*
    for(var o in this.global.window) {
        this.global[o] = this.global.window[o];
    }
    */
    
    /*
    this.global.window.document = this.global.document;
    this.global.window.location = "JENERIC";
    this.global.window.parent = this.global.window;
    this.global.window.top = this.global.window;
    this.global.window.window = this.global.window;
    this.global.window.self = this.global.window;
    */
    
    extendWindow(this.global);
   
    //  parse the CSS to apply only to descendants
    this.global.importCSS = function (uri) {
        return self._importCSS(self, uri, true);
    };
    
    this.global.document.styleSheets = [(new __CSSStyleSheet(this))]; // only one stylesheet per vm!
    this.cssRules = []; // should be a list of rules for this particular VM (TODO: to be cleaned by some mechanism)
};

Jnaric.prototype._importCSS = function (__tihs, src_uri, stop) {
    // stop indicates whether to stop the stack
    if(stop) {
        __tihs.cur_stack.EXCEPTION = false;
        __tihs.cur_stack.my.v0 = undefined;
        
        // set up a stop execution flag
        var _mystop = __jn_stacks.newId();
        __tihs.cur_stack.STOP = _mystop;
        var __cs = __tihs.cur_stack;
    }
    var vm = __tihs;
    var exec_f = function (rs, obj) {
        var ruleStr = rs.result.toString();
        
        if( stop && __cs.STOP != _mystop ) // means TIMEOUT already fired. Also, if it is != false then a serious programming error may be in place!!
                return;
        
        
        // now parse the ruleset
        ruleStr.replace(/\/\*.+\*\//g, "");
        // split rules
        
        var ruleList = ruleStr.split("}");
        ruleList.pop(); // pop the last null- split
        
        if(stop) __cs.my.x2.result = true; // DOC: test and document this!
        if(vm.global.document.styleSheets[0]) {
            
            for(var i=0; i<ruleList.length; i++) {
                try {
                    
                    vm.global.document.styleSheets[0].insertRule(ruleList[i]+"}");
                    
                } catch (e) {
                    vm.ErrorConsole.log("Error parsing CSS rule: "+ruleList[i]+"}"+"; Error: "+e);
                    if(stop) __cs.my.x2.result = false;// DOC: test and document this!
                }
            }
        }
        
        if(stop) {
            __cs.STOP = false;
            //__tihs.step_next(__cs);
            __jn_stacks.start(__cs.pid);
        }
    };
    
    /*            
    var timeout_f = function () {
        if( __cs.STOP != _mystop ) { // it should NEVER appear to place a STOP flag on the same stack twice
            // if not false -> __tihs.ErrorConsole.log("VM: load: internal programming error!");
            return;
        }
        // XXX XXX TODO WARNING! LOAD may fail in releasing the stack WITH CONTROL FLOW CATCHUP!!
        // XXX TODO set onfinish to the currently running steck to continue it!!                
        __cs.EXCEPTION = THROW;
        var ex = new __tihs.global.InternalError("load( '"+url+"' ): fetch failed with timeout");// TEST THIS!!
        ex.status = "timeout";
        __cs.exc.result = ex;

        __cs.STOP = false;
        //__tihs.step_next(__cs);
        __jn_stacks.start(__cs.pid);
    };
    */
    
    // set the timeout watchguard
    // setTimeout(timeout_f, __tihs.AJAX_TIMEOUT);
    
    // fire the ajax load component
    
    var onfail = function (rs) {
        if( stop && __cs.STOP != _mystop ) // means TIMEOUT already fired
                return;

        if(stop) {
            __cs.EXCEPTION = THROW;
            var ex = new __tihs.global.InternalError("importCSS('"+src_uri+"') failed with exception: "+rs.result);
            ex.status = rs.status;
            __cs.exc.result = ex;

            __cs.STOP = false;
            //__tihs.step_next(__cs);  
            __jn_stacks.start(__cs.pid);              
        } else {
            vm.ErrorConsole.log("importCSS('"+src_uri+"') failed with exception: "+rs.result);
        }
    };
    
    kIPC(__tihs, src_uri, "read", [], exec_f, onfail);
    
};

Jnaric.prototype.uri2id = function (uri) {
    var CHARS = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z";
    CHARS += "," + CHARS.toUpperCase();
    var lCHARS = CHARS.split(",");
    CHARS = {};
    for(var i=0; i<lCHARS.length;i++) {
        CHARS[lCHARS[i]] = true;
    }
    var uid="ID";
    for(var i=0; i<uri.length;i++) {
        if(uri.charAt(i) in CHARS) {
            uid += uri.charAt(i);
        } else {
            uid += uri.charCodeAt(i).toString();
        }
    }
    return uid;
}




function __htmldom_set_direct(name, value) {
    if(this.___link) this.___link[name] = value;
    else return this[name] = value;
    return value; // always return a value!
}

function __htmldom_get_direct(name) {
    if(this.___link) return this.___link[name];
    else return this[name];
}

function __htmldom_getter_this(name) {
    return this["get"+name.charAt(0).toUpperCase() + name.substr(1)]();
}



/* GETTER/SETTER NODE LIST - IE equivalent

--- GETTER ONLY (G)
+ clientHeight 
+ clientLeft 
+ clientTop 
+ clientWidth 
+ offsetHeight 
+ offsetLeft 
+ offsetTop 
+ offsetWidth 
+ scrollHeight 
+ scrollWidth 
--- END GETTER

+ scrollLeft GS_
+ scrollTop GS_


+ tabIndex GS_
+ title (hover) GS_

+ offsetParent G_W

+ style -> link directly to ___link: VIA INITIALIZER?? DANGEROUS ?!?!?!


+ ownerDocument: G__ wrapped

+ dir
+ innerHTML
+? name ?? try to get element.name // this conforms with IE

+ className GS_

+ childNodes -> create a new wrapped array [].concat
+ firstChild
+ lastChild
+ nextSibling
+ previousSibling
+ nodeName
+ nodeType
+ nodeValue
+ parentNode
+ tagName
+ textContent

N spellcheck ??? HTML5

+ contentEditable!!??
N designMode ?? (or dont support it??)

*/


___DOMHTMLGetters = {
    contentEditable: __htmldom_get_direct,
    
    innerHTML: __htmldom_get_direct,
    
    textContent: function (name) {
        if(!this.___link) return this[name];
        if("textContent" in this.___link) return this.___link.textContent;
        return this.___link.innerText;
    },
    id: function (name) {
        if(this.___link) return this.getAttribute(name);
        else return this.id;
    },

    offsetParent: function (name) {
        // get parent from our instance
        // XXX WARNING! this will return non-standards! It should return positioning rather than parent :-\
        var pn = this.getParentNode();
        if(pn.___link) {
            if (pn.___link == this.___link.offsetParent) {
                return pn;
            } else {
                var el = this.ownerDocument.___get_from_link(this.___link.offsetParent);
                if(el) return el;
                return null;
            }
        }
        return null;
    },
    
    ownerDocument: function (name) {
        return this.ownerDocument;
    },
    childNodes: function (name) { 
        var wrap = [].concat(this.childNodes._nodes); // to be accessible via [] // WARNING! IE differs here! DOC avoid spaghetti programming!!
        wrap.item = function(i) {return this[i];}
        return wrap;
    },
    firstChild: __htmldom_getter_this,
    lastChild: __htmldom_getter_this,
    nextSibling: __htmldom_getter_this,
    previousSibling: __htmldom_getter_this,
    nodeName: __htmldom_getter_this,
    nodeType: __htmldom_getter_this,
    nodeValue: __htmldom_getter_this,
    parentNode: __htmldom_getter_this,
    tagName: __htmldom_getter_this,

    
    scrollLeft : __htmldom_get_direct,
    scrollTop :__htmldom_get_direct,
    tabIndex :__htmldom_get_direct,
    title :__htmldom_get_direct,
    dir: __htmldom_get_direct,
    className: __htmldom_get_direct,
        
    clientHeight :  __htmldom_get_direct,
    clientLeft :  __htmldom_get_direct,
    clientTop :  __htmldom_get_direct,
    clientWidth :  __htmldom_get_direct,
    offsetHeight :  __htmldom_get_direct,
    offsetLeft  :  __htmldom_get_direct,
    offsetTop  :  __htmldom_get_direct,
    offsetWidth  :  __htmldom_get_direct,
    scrollHeight  :  __htmldom_get_direct,
    scrollWidth  : __htmldom_get_direct,
    
    name: __htmldom_get_direct,

    // now go the event getters

    onbeforeunload : __get_onevent_listener,
    onblur : __get_onevent_listener,
    onchange : __get_onevent_listener,
    onclick : __get_onevent_listener,
    oncontextmenu : __get_onevent_listener,
    ondblclick : __get_onevent_listener,
    onfocus : __get_onevent_listener,
    onkeydown : __get_onevent_listener,
    onkeypress : __get_onevent_listener,
    onkeyup : __get_onevent_listener,
    onmousedown : __get_onevent_listener,
    onmousemove : __get_onevent_listener,
    onmouseout : __get_onevent_listener,
    onmouseover : __get_onevent_listener,
    onmouseup : __get_onevent_listener,
    onresize : __get_onevent_listener,
    onscroll : __get_onevent_listener,
    onsubmit : __get_onevent_listener,
    
    // HTML element interface
    
    // link properties
    
    charset: __htmldom_get_direct,
    disabled: __htmldom_get_direct,
    href: __htmldom_get_direct,
    hreflang: __htmldom_get_direct,
    media: __htmldom_get_direct,
    rel: __htmldom_get_direct,
    rev: __htmldom_get_direct,
    target: __htmldom_get_direct,
    type: __htmldom_get_direct,
    spellcheck: __htmldom_get_direct,
    // form
    
    action : __htmldom_get_direct,
    enctype : __htmldom_get_direct,
    encoding : __htmldom_get_direct,
    method : __htmldom_get_direct,
    
    // input
    
    accessKey : __htmldom_get_direct,
    //align : __htmldom_get_direct,
    alt : __htmldom_get_direct,
    checked : __htmldom_get_direct,
    defaultValue : __htmldom_get_direct,
    defaultChecked : __htmldom_get_direct,
    disabled : __htmldom_get_direct,
    //files Requires Gecko 1.9 	list of selected files 	Readonly FileList 	All
    //form 	containing form element 	Readonly HTMLFormElement 	All
    maxLength : __htmldom_get_direct,
    //multiple Requires Gecko 1.9.2 	more than one value possible (e.g. multiple files) 	Boolean 	All
    name : __htmldom_get_direct,
    readOnly : __htmldom_get_direct,
    selectionEnd : __htmldom_get_direct,
    selectionStart : __htmldom_get_direct,
    size : __htmldom_get_direct,
    src : __htmldom_get_direct,
    tabIndex : __htmldom_get_direct,
    textLength : 1,
    type : 1,
    useMap : __htmldom_get_direct,
    value : __htmldom_get_direct
    
};

// Setters should always return a value
___DOMHTMLSetters = {
    contentEditable: __htmldom_set_direct,
    
    innerHTML: function (name, value) {
        /*
        // parse through innerHTML
        // XXX it introduces HTML4 quirksmode errors so is not appropriate for parsing now.
        // the system will only accept strict XML
        if(typeof document != "undefined" && document.createElement) {
            var tmp_t = document.createElement(this.tagName);
            tmp_t.innerHTML = value; // parse
            value = tmp_t.innerHTML; // get... ECMAbindings :-\
        }
        */
        // clear current element's child list
        //delete this.childNodes; //._nodes;
        this.childNodes._nodes = [];
        // parse as innerHTML and get the parsed values, then re-parse the correct XML with our parser
        // not attaching it anywhere onevent
        var di = new DOMImplementation();
        // XXX namespace-inaware!! TODO: more conformace
        // not quite conforming to http://www.w3.org/TR/2008/WD-html5-20080610/dom.html#innerhtml1
        //console.log("Setting innerHTML to: "+value);
        var dom = di.loadXML("<"+this.tagName+">"+value+"</"+this.tagName+">"); 
        //this.childNodes = dom.documentElement.childNodes; // what with ownerDocument??
        this.___link.innerHTML = "";
        // TODO: deal with memory-management mess here (ownerDocument, delete old DI, parents, etc. refs)
        for(var i=0; i<dom.documentElement.childNodes.getLength(); i++) {
            dom.documentElement.childNodes.item(i).ownerDocument = this.ownerDocument; // like w3c? 
            this.appendChild(dom.documentElement.childNodes.item(i));
        }
    },
    
    textContent: function (name, value) {
        if(!this.___link) {
            return this[name] = value;
        }
        if("textContent" in this.___link) this.___link.textContent = value;
        this.___link.innerText = value;
    },
    id: function (name, value) {
        if(this.___link) this.setAttribute(name, value);
        else this.id = value;
        return id;
    },
    
    scrollLeft : __htmldom_set_direct,
    scrollTop :__htmldom_set_direct,   
    tabIndex :__htmldom_set_direct,   
    title :__htmldom_set_direct,
    dir: __htmldom_set_direct,
    className: __htmldom_set_direct,
    
    // only a getter
    clientHeight : 1,
    clientLeft : 1,
    clientTop : 1,
    clientWidth : 1,
    offsetHeight : 1,
    offsetLeft  : 1,
    offsetTop  : 1,
    offsetWidth  : 1,
    scrollHeight  : 1,
    scrollWidth  : 1,
    
    offsetParent: 1,
    
    ownerDocument: 1,
    childNodes: 1,
    firstChild: 1,
    lastChild: 1,
    nextSibling: 1,
    previousSibling: 1,
    nodeName: 1,
    nodeType: 1,
    nodeValue: __htmldom_set_direct, // XXX TODO: is this secure? is this correct? implement thru setter?
    parentNode: 1,
    tagName: 1,

    
    name: 1, // behave as IE
    
    // now go the event setters

    onbeforeunload : __set_onevent_listener,
    onblur : __set_onevent_listener,
    onchange : __set_onevent_listener,
    onclick : __set_onevent_listener,
    oncontextmenu : __set_onevent_listener,
    ondblclick : __set_onevent_listener,
    onfocus : __set_onevent_listener,
    onkeydown : __set_onevent_listener,
    onkeypress : __set_onevent_listener,
    onkeyup : __set_onevent_listener,
    onmousedown : __set_onevent_listener,
    onmousemove : __set_onevent_listener,
    onmouseout : __set_onevent_listener,
    onmouseover : __set_onevent_listener,
    onmouseup : __set_onevent_listener,
    onresize : __set_onevent_listener,
    onscroll : __set_onevent_listener,
    onsubmit : __set_onevent_listener,

    // HTML element interface
    
    // link properties
    
    charset: __htmldom_set_direct,
    disabled: __htmldom_set_direct,
    href: __htmldom_set_direct,
    hreflang: __htmldom_set_direct,
    media: __htmldom_set_direct,
    rel: __htmldom_set_direct,
    rev: __htmldom_set_direct,
    target: function (name, val) {
        if(this.tagName.toLowerCase() == "a") return; // if link -> always set to _blank
        // if form -> set to NAME; and never set to _self
        if(val != "_self") this[name] = val;
    },
    type: __htmldom_set_direct, // <--------------- XXX INTERFACE MESS HERE
    spellcheck: __htmldom_set_direct,
    // form
    action : __htmldom_set_direct,
    enctype : __htmldom_set_direct,
    encoding : __htmldom_set_direct,
    method : __htmldom_set_direct,
    
    
    // input
    accept : __htmldom_set_direct,
    accessKey : __htmldom_set_direct,
    //align : __htmldom_set_direct,
    alt : __htmldom_set_direct,
    checked : __htmldom_set_direct,
    defaultValue : __htmldom_set_direct,
    defaultChecked : __htmldom_set_direct,
    disabled : __htmldom_set_direct,
    //files Requires Gecko 1.9 	list of selected files 	Readonly FileList 	All
    //form 	containing form element 	Readonly HTMLFormElement 	All
    maxLength : __htmldom_set_direct,
    //multiple Requires Gecko 1.9.2 	more than one value possible (e.g. multiple files) 	Boolean 	All
    name : __htmldom_set_direct,
    readOnly : __htmldom_set_direct,
    selectionEnd : __htmldom_set_direct,
    selectionStart : __htmldom_set_direct,
    size : __htmldom_set_direct,
    src : __htmldom_set_direct,
    tabIndex : __htmldom_set_direct,
    textLength : 1,
    // type : 1, // <--------------- XXX INTERFACE MESS HERE -- get/set mimetype of link resource
    useMap : __htmldom_set_direct,
    value : __htmldom_set_direct
};


// implement DOM setters:
//DOMElement.prototype.___getters = ___DOMHTMLGetters;
//DOMElement.prototype.___setters = ___DOMHTMLSetters;
DOMNode.prototype.___getters = ___DOMHTMLGetters;
DOMNode.prototype.___setters = ___DOMHTMLSetters;



/* DOMElement methods list

+ scrollIntoView( alignWithTop )
+ focus()
+ blur()
+ click()
execCommand(String aCommandName, Boolean aShowDefaultUI, String aValueArgument)
    https://developer.mozilla.org/en/Rich-Text_Editing_in_Mozilla
    // --> VERY HARD!
    // need to wrap commands that are allowed, then do safe equivalents for not allowed things
getElementsByClassName ( ) ???? SKIP
hasClassName


compareDocumentPosition [tricky] DOM3
compareElementPosition (???) check that
https://developer.mozilla.org/En/DOM/Node.isSupported

*/

// form
DOMElement.prototype.submit = function ( ) {
    if(this.___link && this.___link.submit) this.___link.submit();
};
//form
DOMElement.prototype.reset = function ( ) {
    if(this.___link && this.___link.reset) this.___link.reset();
};

DOMElement.prototype.focus = function ( ) {
    if(this.___link && this.___link.focus) this.___link.focus();
};

DOMElement.prototype.blur = function ( ) {
    if(this.___link && this.___link.blur) this.___link.blur();
};

DOMElement.prototype.click = function ( ) {
    if(this.___link && this.___link.click) this.___link.click();
};

DOMElement.prototype.scrollIntoView = function ( alignWithTop ) {
    if(this.___link && this.___link.scrollIntoView) {
        if(alignWithTop) this.___link.scrollIntoView( alignWithTop );
        else this.___link.scrollIntoView( );
    }
};

DOMElement.prototype.compareDocumentPosition = function ( wrappedNode ) {
    var a = this.___link;
    var b = wrappedNode.___link;
    
    return a.compareDocumentPosition ?
    a.compareDocumentPosition(b) :
    a.contains ?
      (a != b && a.contains(b) && 16) +
        (a != b && b.contains(a) && 8) +
        (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
          (a.sourceIndex < b.sourceIndex && 4) +
            (a.sourceIndex > b.sourceIndex && 2) :
          1) +
      0 :
      0;
};


/////////////////////////////////////////////////////////////////////////////////////

/* DOCUMENT INTERFACE
--- PROPS
+documentURI
+domain (?)
+location
+URL
+title

+ activeElement -> element in focus, [cached? if not found in cache -> rebuild cache]

+characterSet -> UTF-8
+inputEncoding -> UTF-8
+contentType -> text/html
+referrer -> "#"

doctype [STD DOM2]

TODO LATER HERE ->
defaultView -> window obj !!!!!!!!!!!!!!!!!!!!!!!

+height
+width

forms
images
links
styleSheets

/////////
// HTML5 impl
readyState


--- METHODS


+ hasFocus
getElementsByXPath

execCommand
getElementsByName
getElementsByClassName(className, element);

createAttribute
createComment
createDocumentFragment // TODO: see if it does comply with W3C (does not create a full document??)
    see https://developer.mozilla.org/en/Migrate_apps_from_Internet_Explorer_to_Mozilla
createElement
createTextNode

createEntityReference (?)
createExpression HTML5 Compiles an XPathExpression

*/

___DOCHTMLGetters = {
    designMode: function (name) {
        if(this.body.___link && this.body.___link.contentEditable) return "on";
        else return "off";
    },
    textContent: function (name) {
        return null;
    },

    
    ownerDocument: function (name) {
        return null;
    },
    
    childNodes: function (name) { // TODO: create a full-version wrapper here!
        return [].concat(this.childNodes._nodes); // to be accessible via [] // WARNING! IE differs here! DOC avoid spaghetti programming!!
    },
    
    firstChild: __htmldom_getter_this,
    lastChild: __htmldom_getter_this,
    nextSibling: __htmldom_getter_this,
    previousSibling: __htmldom_getter_this,
    nodeName: __htmldom_getter_this,
    nodeType: __htmldom_getter_this,
    nodeValue: __htmldom_getter_this,
    parentNode: __htmldom_getter_this,
    tagName: __htmldom_getter_this,

    title : function(name) { return "JENERIC"; },
    dir: __htmldom_get_direct,

    activeElement: function (name) {
        if(typeof document != "undefined" && document.activeElement) {
            var el = this.___get_from_link(document.activeElement);
            if(el) return el;
        }
        return this.body; // must have
    },
    
    height: function (name) {
        if(this.documentElement.___link) return this.documentElement.___link.scrollHeight;
        return 0;
    },
    width: function (name) {
        if(this.documentElement.___link) return this.documentElement.___link.scrollWidth;
        return 0;
    },
    
        // now go the event getters

    onbeforeunload : __get_onevent_listener,
    onblur : __get_onevent_listener,
    onchange : __get_onevent_listener,
    onclick : __get_onevent_listener,
    oncontextmenu : __get_onevent_listener,
    ondblclick : __get_onevent_listener,
    onfocus : __get_onevent_listener,
    onkeydown : __get_onevent_listener,
    onkeypress : __get_onevent_listener,
    onkeyup : __get_onevent_listener,
    onmousedown : __get_onevent_listener,
    onmousemove : __get_onevent_listener,
    onmouseout : __get_onevent_listener,
    onmouseover : __get_onevent_listener,
    onmouseup : __get_onevent_listener,
    onresize : __get_onevent_listener,
    onscroll : __get_onevent_listener,
    onsubmit : __get_onevent_listener


};

// Setters should always return a value
___DOCHTMLSetters = {
    contentEditable: __htmldom_set_direct,
    designMode: function (name, value) {
        //console.log("Setting contentEditable to "+(value=="on" ? true : false));
        this.body.___link && (this.body.___link.contentEditable = (value=="on" ? true : false));
    },
    textContent: function (name, value) { // do nothing
        return value;
    },
       
    title: function (name, value) { return value;},
    dir: __htmldom_set_direct,  
    
    ownerDocument: 1,
    childNodes: 1,
    firstChild: 1,
    lastChild: 1,
    nextSibling: 1,
    previousSibling: 1,
    nodeName: 1,
    nodeType: 1,
    nodeValue: 1,
    parentNode: 1,
    tagName: 1,
    
    activeElement: 1,
    
    height: 1,
    width: 1,
    
        // now go the event setters

    onbeforeunload : __set_onevent_listener,
    onblur : __set_onevent_listener,
    onchange : __set_onevent_listener,
    onclick : __set_onevent_listener,
    oncontextmenu : __set_onevent_listener,
    ondblclick : __set_onevent_listener,
    onfocus : __set_onevent_listener,
    onkeydown : __set_onevent_listener,
    onkeypress : __set_onevent_listener,
    onkeyup : __set_onevent_listener,
    onmousedown : __set_onevent_listener,
    onmousemove : __set_onevent_listener,
    onmouseout : __set_onevent_listener,
    onmouseover : __set_onevent_listener,
    onmouseup : __set_onevent_listener,
    onresize : __set_onevent_listener,
    onscroll : __set_onevent_listener,
    onsubmit : __set_onevent_listener
    
};

DOMDocument.prototype.___getters = ___DOCHTMLGetters;
DOMDocument.prototype.___setters = ___DOCHTMLSetters;

DOMDocument.prototype.characterSet = "UTF-8";
DOMDocument.prototype.inputEncoding = "UTF-8";
DOMDocument.prototype.contentType = "text/html";
DOMDocument.prototype.referrer = "#"; // XXX not sure

// the following are of no need
DOMDocument.prototype.documentURI = ""; 
DOMDocument.prototype.domain = ""; 
DOMDocument.prototype.location = ""; 
DOMDocument.prototype.URL = ""; 


DOMDocument.prototype.hasFocus = function () {
    if(typeof(document) != "undefined" && document.hasFocus) return document.hasFocus();
    return false; // XXX DOC this (default false) // XXX or return always true??
};

DOMDocument.prototype.getElementsByName = function () {
    // TODO XXX not yet implemented: need element cache
};

DOMDocument.prototype.___get_from_link = function (domElement) {
    if(!domElement) return undefined;
    if(!this.___DOMcache || this.___DOMcache_outdated) this.___rebuild_cache();
    if(domElement.nodeType == 3) { // text node
      // search for container, then return ref to textNodde, if exists
      // normalize when needed
      var src = domElement.parentNode;
    } else {
      var src = domElement;
    }
    
    var wt = this.___DOMcache[src.___id];
    if(!wt) {
        //if(window.console)console.log("Cache problem! Element not found");
        // search in frames
        if(this.defaultView.frames.length)  {
            var t;
            for(var i=0; i< this.defaultView.frames.length; i++){
                t = this.defaultView.frames[i].contentDocument;
                if(!t.___DOMcache || t.___DOMcache_outdated) t.___rebuild_cache();
                wt = t.___DOMcache[src.___id];
                if(wt) break;
            }
        }
        
    }
    if(!wt) return null;
    
    if(domElement.nodeType == 3) { // text node
        console.log('doing for text node');
        if(src.childNodes.length == 1) {
          // just get child
                  if(wt.childNodes._nodes.length == 1) {
                    return wt.getFirstChild();
                  } else {
                    if(window.console && console.log) console.log("get_from_link: XML tree TextNodes inconsistency #1");
                    return null;
                  }
        } else {
            // normalize if necessary
            NOTNORM = src;
            if(window.console && console.log) console.log('Can not normalize yet!');
        }
    } else {
      return wt;
    }
};

DOMDocument.prototype.___rebuild_cache = function () {
    var all = (this.documentElement.getElementsByTagName("*"))._nodes;
    //console.log("Len rebuild: "+all.length);
    delete this.___DOMcache;
    this.___DOMcache = {};
    for(var i=0; i<all.length; i++) {
        if( all[i].___link ) this.___DOMcache[all[i].___link.___id] = all[i];
    }
    this.___DOMcache_outdated = false;
};


// write as an attempt to conform to HTML5 SPEC

DOMDocument.prototype.write = function () {
    var args = Array.prototype.slice.call(arguments);
    var s = args.join("");
    // XXX or just do .loadXML and flush current document??
    this._parseComplete = false;
    parser = new XMLP(s);
    this.implementation.___parseLoop(this, parser);
    this._parseComplete = true;
};

DOMDocument.prototype.open = function () {}; // XXX just dont even know how to implement this...
DOMDocument.prototype.close = function () {}; // XXX just dont even know how to implement this...
/*

 if we need to register onload event for an iframe:
 
 1. document finished parsing
 2. iframe.ownerDocument.___scriptTagStack -> when becoms empty 
	(register core onfinish event && onfinish_onerror)
 
 onload event for main is LTR but seems straightforward
 LTR: inline script parsing (a bad thing though)

*/

////////////////////////////////////////////////////////////////////
// EVENT MODEL
////////////////////////////////////////////////////////////////////


/* warning for event model: 
// warning for event model: 
// + set to callable methods only 
// + call in multi-threaded mode DOC IT
// - What to do with external calls to onsmth()?? 
//      processes can access each other's DOM values and execute methods cross-vm. That's BAD!
//      if the method is calling something with a lock -> the lock may be lost in stacks :-\ TODO resolve this!
//      TODO: AT LEAST detect this situation!
// - the events are fired each as new thread! this is dangerous! especially when everything is SO SLOW
*/

/* EVENT MODEL

--- METHODS ABOUT:
+ element.addEventListener( type, listener, useCapture ) // useCapture always to false
+ element.removeEventListener( type, handler, useCapture )
+ element.dispatchEvent( event ) (IE: .fireEvent())

+ document.addEventListener
+ element.removeEventListener( type, handler, useCapture )
+ document.createEvent IE: createEventObject -- only STD events supported (need a crutch)

--- EVENT METHODS


+ event.initEvent 
    Initializes the value of an Event created through the DocumentEvent interface.

((
    event.initKeyEvent 
        Initializes a keyboard event. Gecko-specific.
    event.initMouseEvent 
        Initializes a mouse event once it's been created
    event.initUIEvent 
        Initializes a UI event once it's been created.
))

+ event.preventDefault 
    Cancels the event (if it is cancelable).
+ event.stopPropagation 
    Stops the propagation of events further along in the DOM. 

--- PROPERTIES
// NOT ALL ARE IMPLEMETED OR SUPPORTED

event.altKey 
    Returns a boolean indicating whether the <alt> key was pressed during the event.
event.bubbles 
    Returns a boolean indicating whether the event bubbles up through the DOM or not.
    as we dont support capture, just set to true always
event.button 
    Returns a mouse key.
event.cancelBubble 
    Deprecated Returns a boolean indicating whether the bubbling up of the event has been canceled or not.
event.cancelable 
    Returns a boolean indicating whether the event is cancelable.
event.charCode 
    Returns the Unicode value of a character key that was pressed as part of a keypress event. See also Gecko Keypress Event.
event.clientX 
    Returns the horizontal position of the event.
event.clientY 
    Returns the vertical position of the event.
event.ctrlKey 
    Returns a boolean indicating whether the <ctrl> key was pressed during the event.
event.currentTarget 
    Returns a reference to the currently registered target for the event.
event.detail 
    Returns detail about the event, depending on the type of event.
event.eventPhase 
    Used to indicate which phase of the event flow is currently being evaluated.
event.explicitOriginalTarget 
    The explicit original target of the event (Mozilla-specific).
event.isChar // in these terms we behave as IE currently
    Returns a boolean indicating whether the event produced a key character or not.
event.keyCode 
    Returns the Unicode value of a non-character key in a keypress event or any key in any other type of keyboard event.
event.layerX 
    Returns the horizontal coordinate of the event relative to the current layer.
event.layerY 
    Returns the vertical coordinate of the event relative to the current layer.
event.metaKey 
    Returns a boolean indicating whether the meta key was pressed during the event.
event.originalTarget 
    The original target of the event, before any retargetings (Mozilla-specific).
event.pageX 
    Returns the horizontal coordinate of the event relative to the page.
event.pageY 
    Returns the vertical coorindate of the event relative to the page.
event.relatedTarget 
    Identifies a secondary target for the event.
event.screenX 
    Returns the horizontal position of the event on the screen.
event.screenY 
    Returns the vertical position of the event on the screen.
event.shiftKey 
    Returns a boolean indicating whether the <shift> key was pressed when the event was fired.
event.target 
    Returns a reference to the target to which the event was originally dispatched.
event.timeStamp 
    Returns the time that the event was created.
event.type 
    Returns the name of the event (case-insensitive).
event.view 
    The view attribute identifies the AbstractView from which the event was generated.
event.which 
    Returns the Unicode value of a key in a keyboard event, regardless of which type of key is pressed. 


--- STANDARD EVENT SETTERS (create a getter/setter interface for this)
IMPLEMENTED_ALL->>
        onbeforeunload
            Returns the event handling code for the beforeunload event.
        onblur
            Returns the event handling code for the blur event.
        onchange
            Returns the event handling code for the change event.
        onclick
            Returns the event handling code for the click event.
        oncontextmenu
            Returns the event handling code for the contextmenu event.
        ondblclick
            Returns the event handling code for the dblclick event.
        onfocus
            Returns the event handling code for the focus event.
        onkeydown
            Returns the event handling code for the keydown event.
        onkeypress
            Returns the event handling code for the keypress event.
        onkeyup
            Returns the event handling code for the keyup event.
        onmousedown
            Returns the event handling code for the mousedown event.
        onmousemove
            Returns the event handling code for the mousemove event.
        onmouseout
            Returns the event handling code for the mouseout event.
        onmouseover
            Returns the event handling code for the mouseover event.
        onmouseup
            Returns the event handling code for the mouseup event.
        onresize
            Returns the event handling code for the resize event.
        onscroll
            Returns the event handling code for the scroll event. 
            
        --- SPECIAL EVENT SETTERS
link /_t167/lib ~/lib  /_t167/var/formtest.jn /dfgdfg/dfgd
        onsubmit

*/

function fake() {};

// DOC all these parameters
DOMElement.prototype.addEventListener = function ( type, listener, useCapture, skip, preventDefault) {
    // XXX DOC currently useCapture always set to false to behave exactly as IE
    // XXX DOC skip & preventDefault combination weirdness
    // DOC the preventDefault issue; opera has bug with preventing default not on all handlers...
    // it only works when real DOM rendering is available so our task simplifies much
    if(!this.___link) return;
    
    
    
    // assume ___vm is set to this.ownerDocument
    var vm = this.ownerDocument.___vm;
    
    if(!(listener.node && listener.scope)) throw (new vm.global.TypeError("JNARIC: addEventListener second argument must be a function"));

    var cstack = undefined;
    var self = this;
    var evt = function (e) {
        /*
        __jn_stacks.add_task(vm, g_stack, my_nice, vm.throttle);
        */
        // var e = window.event ? window.event : aEvent;
        
        
        var e = new __Event(vm, e); // create an event based on real event
        if(e.target == null) { 
            return; // DOC: skip events not coming from current VM scope (???)
        }
        
        if(preventDefault) e.preventDefault();
        
        // TODO: more verbosity here
        var evt_fakeerr = function ( err ) { vm.ErrorConsole.log("Error executing event handler: "+err); };
        if(cstack && cstack.stack.length > 0) {
            if(skip) {
                //console.log("--------------- skip!");
                return; // just skip event // DOC this!
            }
            if(cstack.stack.length > 1000) {
                if(window.console) console.log("Event handler: stack too deep (pid "+cstack.pid+"); skipping event!");
                return; //force skip: DOC and TODO some meaningful value
            }
            vm.execf_stack(cstack, listener, [e], e.target); 
        } else { // new thread
            //console.log("------------- new thread!");
            cstack = vm.execf_thread(listener, [e], fake, evt_fakeerr, -11, e.target); // -11 nice will preempt task
        }
        // we need to append to thread stack - if it exists - and do not append if stack is too full
        // (thus skipping events)
        
        if(preventDefault || e.___preventDefault) {
            // XXX: TODO HERE: REMOVE THIS!
            //console.log("PreventDefault: prevented, returning false!");
            return false;
        }
        e.passed = true; // DOC: means it can not be canceled anymore due to 'passed'
        e.cancelable = false;
    };
    
    // now register event
    // DOC WARNING!: currently does not support user-defined events due to IE direct link
    // DOC: currently do not support capture to behave as IE

    if(this.___link.attachEvent) this.___link.attachEvent("on"+type, evt); // IE    
    else this.___link.addEventListener(type, evt, false);
        
    if(!this.___listeners) this.___listeners = {};
    if(!this.___listeners[type]) this.___listeners[type] = {};
    this.___listeners[type][listener] = evt;
    
    
    
};

DOMDocument.prototype.addEventListener = function ( type, listener, useCapture , skip, preventDefault) {
    //console.log("LOOOG: Adding event listener to: "+this.documentElement.___link+"id:"+this.documentElement.___id+" type "+type+" list "+listener);
    //this.documentElement.addEventListener( type, listener, useCapture , skip, preventDefault);
    this.body.LISTENING = true;
    this.body.addEventListener( type, listener, useCapture , skip, preventDefault);
};

DOMDocument.prototype.removeEventListener = function ( type, listener, useCapture ) {
    this.documentElement.removeEventListener( type, listener, useCapture );
};

DOMDocument.prototype.listEventListeners = function ( type, listener, useCapture ) {
    this.documentElement.listEventListeners( type, listener, useCapture );
};

// TODO: more type checks over here
DOMElement.prototype.removeEventListener = function ( type, listener, useCapture ) {
    if(!this.___listeners || !this.___listeners[type]) return;
    if(!this.___link) return;
    
    if(listener in this.___listeners[type]) {
        var evt = this.___listeners[type][listener];
        //if(this.___link.addEventListener) this.___link.removeEventListener(type, evt, false);
        //else this.___link.detachEvent("on"+type, evt); // IE
        if(this.___link.attachEvent) this.___link.detachEvent("on"+type, evt); // IE    
        else this.___link.removeEventListener(type, evt, false);
        
        
        delete this.___listeners[type][listener];
    }
};

DOMElement.prototype.listEventListeners = function ( ) { // DOC THIS: new 
    if(!this.___listeners) return;
    var t = {};
    for(var ob in this.___listeners) {
        t[ob]={};
        for(var ob2 in this.___listeners[ob]) {
            t[ob] = ob2;
        }
    }
    return t;
};

DOMElement.prototype.dispatchEvent = function ( event ) { // (IE: .fireEvent())
    // TODO: a more complete handling of null DOM rendering output (or DOM outout into REMOTE??)
    if(this.___link) {
        if(this.___link.dispatchEvent) this.___link.dispatchEvent(event.___link);
        else this.___link.fireEvent(event.___link);
    }
};

/* TODO: 
- DOC ument everything here
*/
DOMElement.prototype.waitEvent = function ( eType, timeout, propertyComp, preventDefault ) {
    // DOC: watch for propertyName of event to equal propertyValue, else ignore it  propertyComp!
    //  and continue blocking execution
    //  timeout = 0 -> infinite
    
    // block the current calling stack
    timeout = timeout || 0;
    var ___vm = this.ownerDocument.___vm;
    var cs = this.ownerDocument.___vm.cur_stack;
    var x2 = cs.my.x2; // set x2.result
    cs.EXCEPTION = false;
    var mySTOP = __jn_stacks.newId();
    cs.STOP = mySTOP;
    var elmt = this;
    
    
    var evt = function (aEvent) {
        e = new __Event(___vm, aEvent);
        
        if(e.target != elmt) {
            return; // bypass // and check if everything works (like cache)
        }
        
        if(propertyComp) {
            var m=false;
            for(var propertyName in propertyComp) {
                if(propertyComp[propertyName] instanceof Array) {
                    for(var i=0;i< propertyComp[propertyName].length;i++) {
                        if(propertyComp[propertyName][i] == e[propertyName]) m=true;
                    }
                    if(!m) return;
                } else {
                    if(e[propertyName] != propertyComp[propertyName]) {
                        //console.log("PROPERTY FAILURE for "+propertyName);
                        return;
                    }
                }
            }
        }
        
        if(preventDefault) e.preventDefault();
        //console.log("FIRING EVENT");

        // now unregister event
        if(elmt.___link.addEventListener) elmt.___link.removeEventListener(eType, arguments.callee, false);
        else elmt.___link.detachEvent("on"+eType, arguments.callee); // IE

        
        x2.result = e;
        cs.EXCEPTION = RETURN;
        cs.STOP = false;
        // cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
        __jn_stacks.start(cs.pid);
        
        if(preventDefault) return false; //safari...

    };
    
    // now register event
    if(this.___link.addEventListener) this.___link.addEventListener(eType, evt, false);
    else this.___link.attachEvent("on"+eType, evt); // IE

    // now wait for event or for timeout
    if( timeout ) {
        var tm = function () {
            if(cs.STOP != mySTOP) return; // means we're out
            // release the stack
            x2.result = null; // means no event caught tadviser.ru
            
            cs.EXCEPTION = RETURN;
            cs.STOP = false;
            // cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
            __jn_stacks.start(cs.pid);
        };
        setTimeout(tm, timeout);
    }

    
};

DOMDocument.prototype.createEvent = function (etype) {
    // IE
    var eo = document.createEventObject ? document.createEventObject() : document.createEvent(etype);
    vm = this.___vm; // WARNING!! event objects are attached to a document of a particular VM!
    var _eo = new __Event(vm, eo); // wrapped
    return _eo;
}

function __Event(vm, event) { // ABI WARNING!! event objects are attached to a document of a particular VM!
    if(!event && window.event) event = window.event;
    else if (!event && !window.event) throw "Assert failed: no event supplied for init";
    
    // we need to detect if we are IE and need to wrap event types, etc.
    // id IE -> the event MAY contain additional object description
    
    this.___vm = vm;
    this.___link = event;

    this.altKey = event.altKey;
    this.ctrlKey = event.ctrlKey;
    this.clientX = event.clientX;
    this.clientY = event.clientY;
    this.screenX = event.screenX;
    this.screenY = event.screenY;
    this.shiftKey = event.shiftKey;
    this.type = event.type;
    this.keyCode = event.keyCode;
    this.charCode = event.srcElement ? String.fromCharCode(event.keyCode) : event.charCode;
    this.isChar = (this.charCode > 0);
    
    // mouse button which
    if(event.which) {
        this.which = event.which;
    } else { // IE
        if(event.button == 1) this.which = 1;
        if(event.button == 4) this.which = 2;
        if(event.button == 2) this.which = 3;
    }
    if(this.which) this.button = this.which - 1;
    
    // now get the wrapped target from our window document object
    
    var rtarget = event.target ? event.target : event.srcElement;
    this.target = event.target ? this.___vm.global.document.___get_from_link(event.target) : this.___vm.global.document.___get_from_link(event.srcElement);
    this.relatedTarget  = event.relatedTarget ? this.___vm.global.document.___get_from_link(event.relatedTarget) : this.___vm.global.document.___get_from_link(event.fromElement);// IE: fromElement
    this.currentTarget = event.currentTarget ? this.___vm.global.document.___get_from_link(event.currentTarget) : this.___vm.global.document.___get_from_link(event.toElement); // IE: toElement
    if(this.target == this.relatedTarget) this.relatedTarget = this.currentTarget;
}

__Event.prototype.toString = function () {
    return "[object Event]"; // TODO DOC XXX nonstandard
};

// TODO: more DOM3 event model support here
__Event.prototype.initEvent = function (type, bubbles, cancelable) {
    if(this.___link.initEvent) this.___link.initEvent(type, bubbles, cancelable); // only basic Event dom3 module is supported for MOX/DOM3 now
    // for IE, just ignore
};

__Event.prototype.preventDefault = function () {
    // IE: returnValue property
    
    this.___preventDefault = true;
    if(this.___link) {
        if(this.___link.preventDefault) {
            this.___link.preventDefault();
            if(this.passed) this.___vm.ErrorConsole.log("failed to preventDefault(): check event preemption condition");
        }
        else {
            try {
                this.___link.returnValue = false;
            } catch (e) {
                this.___vm.ErrorConsole.log("failed to set .returnValue: check event preemption condition");
                
            }
        }
    }
};

__Event.prototype.stopPropagation = function () {
    // IE: cancelBubble property
    if(this.___link) {
        if(this.___link.stopPropagation) this.___link.stopPropagation();
        else this.___link.cancelBubble = true;
    }
};

//////////////////////////////////////////////////////
// Mozilla-specific these are :-\
__Event.prototype.initKeyEvent = function () {

};

__Event.prototype.initMouseEvent = function () {

};

__Event.prototype.initUIEvent = function () {

};
// End mozilla-specific
//////////////////////////////////////////////////////


function __set_onevent_listener(name, listener) {

    if(this["___"+name]) { // exists already, replace it!    
        // make sure the listener is a functionObject?
        this.removeEventListener(name.slice(2), this["___"+name], false);
    } 

    if(!listener || !listener.node || !listener.scope) { // TODO: instanceof functionObject
        // remove listener
        delete this["___"+name];
    } else {
        this.addEventListener(name.slice(2), listener, false);
        this["___"+name] = listener;
    }

}

function __get_onevent_listener(name) {
    // check if everything is okay:
    var type = name.slice(2);
    if(!this.___listeners) this.___listeners = {};
    
    if(this.___listeners[type] && this.___listeners[type][this["___"+name]]) return this["___"+name];
    return null; // means unset
}

////////////////////////////////////////////////////////////////////
// WINDOW model
////////////////////////////////////////////////////////////////////

/*
--- GETTERS/SETTERS LIST

-- SET BY INIT:
+ document
+ location
+ parent
+ top
+ window
+ self

-- IMPLEMENT GETTERS:
+ innerHeight
+ innerWidth
+? name
+ outerHeight
+ outerWidth
+ scrollX
+ scrollY

screen ???

(((
!    navigator
!    history
)))


--- METHODS

LEGEND: 
    + - implemented 
      - unimplemented 
    ! - incompatible and should be avoided
    ? - undecided

+ atob
+ btoa
! back
! blur

    // TODO: decide will these be compatible or not??
addEventListener ? -> document.addEventListener
    onload!!
removeEventListener

+ clearInterval
+ clearTimeout
! close
! confirm

+ escape
! focus
! find
! forward
! getAttention (?)

+ getComputedStyle

getSelection !!!!!!!!!!!!!-> mozilla
    AND I do not know what to do with IE currently
    ... just implement it as-is for IE! everybody has already done everything needed to support that stuff
    check out IERange project!! 

! home

! moveBy
! moveTo
! open
! resizeBy
! resizeTo

! openDialog
! print
! prompt


+ window.scroll
    Scrolls the window to a particular place in the document.

+ window.scrollBy
    Scrolls the document in the window by the given amount.

window.scrollByLines
    Scrolls the document by the given number of lines.

window.scrollByPages
    Scrolls the current document by the specified number of pages.

+ window.scrollTo
    Scrolls to a particular set of coordinates in the document.

+ window.unescape


--- EVENT HANDLERS (a plenty of)

*/


// window object should extend 'global' object with all its methods and properties!

// a function to extend global with window
function extendWindow(global) {
    global.window = global;
    
    global.frameElement = null;
    global.frames = [];
    global.length = 0;
    
    
    global.window.location = "JENERIC";
    global.window.parent = global.window;
    global.window.top = global.window;
    global.window.window = global.window;
    global.window.self = global.window;
    
    for(ob in __Window.prototype) {
        global[ob] = __Window.prototype[ob];
    }
    
}

// reference. should not be called.

function __Window() { 
    // this.document to be set by inuit!!!!
    this.frameElement = null;
    this.frames = [];
    this.length = 0;
        
}


// just do not implement incompatible methods!!
// __Window.prototype.back = fake;
// __Window.prototype.close = fake;
// __Window.prototype.confirm = fake;

__Window.prototype.escape = escape; 
__Window.prototype.unescape = unescape;

// TODO for these: Hide IE differences??
__Window.prototype.encodeURI = encodeURI;
__Window.prototype.decodeURI = decodeURI;

__Window.prototype.btoa = Orbited.base64.encode;
__Window.prototype.atob = Orbited.base64.decode;

__Window.prototype.scrollTo = function (x,y) {
    if(window.scrollTo) window.scrollTo(x,y);
};
__Window.prototype.scroll = __Window.prototype.scrollTo;

__Window.prototype.scrollBy = function (x,y) {
    if(window.scrollBy) window.scrollBy(x,y);
};
__Window.prototype.focus = function () {
    window.focus();
};
__Window.prototype.blur = function () {
    // do nothing
};


/*
    TODO: window event handling:
    addEventListener/removeEventListener/listEventListeners
    events:
        load ( -> all scripts loaded, CSS loaded, etc.)
        unload (-> onclose)
        scroll (reroute to window.document.body.addEventListener)

*/

__Window.prototype.addEventListener = function ( type, listener, useCapture, skip, preventDefault) {
    
    if(type == 'load' || type == 'DOMContentLoaded') { 
        // DOC: window.onload event only available for iframes with coode supplied by document.write
        //      will attach to the first code-running frame detected
        
        // searching for stack in current document or frames
        var sstack = null;
        if(this.document.___scriptTagStack) sstack = this.document.___scriptTagStack;
        else { 
            for(var i=0; i<this.frames.length; i++) {
                if(this.frames[i].contentWindow.document.___scriptTagStack) {
                    sstack = this.frames[i].contentWindow.document.___scriptTagStack;
                }
            }
        }
        if(sstack) {
            
            var self = this;
            sstack.onfinish = function () {
                //console.log("onfinish figanulo!!! : "+sstack.queueSize);
                // now check if there is something loading
                if(!sstack.queueSize) { // XXX DOC: will not fire onfinish event if some of the script that were to be loaded fired an error. (see how onfinish/onerror and script loading works)
                    //console.log("Starting ONLOAD!!!!!");
                    var evt_fakeerr = function ( err ) { self.document.___vm.ErrorConsole.log("Error executing onload event handler: "+err); };
                    
                    if(sstack.global_scope) { // this is the only place where stack is created manually since we want to execute in the loader's scope
                        
                        var x2 = new self.document.___vm.ExecutionContext(GLOBAL_CODE);
                        
                        x2.scope = { object: self.document.defaultView, parent: null };
                        var nstack = new __Stack(x2);
                        nstack.global_scope = sstack.global_scope;
                        nstack.onerror = function (ee) {
                            self.document.___vm.ErrorConsole.log("Error executing onload(): "+ee);
                        };
                        
                        var st = self.document.___vm.execf_stack(nstack, listener, [{}], self.document.defaultView);
                        __jn_stacks.add_task(self.document.___vm, st, self.document.___vm.nice, self.document.___vm.throttle);
                    } else {
                        console.log("Starting onload via THREAD");
                        self.document.___vm.execf_thread(listener, [{}], fake, evt_fakeerr);
                    }
                }
            }
        } else {
            this.document.___vm.ErrorConsole.log("Failed to find which script stack to attach onload to!");
        }
    } else if (type == 'unload') {
        // do nothing
    } else {
        // XXX TODO: onscroll event will likely be at higher (inaccessible from within here) DIV
        this.document.body.addEventListener( type, listener, useCapture, skip, preventDefault);
    }
};

__Window.prototype.removeEventListener = function ( type, listener, useCapture ) {
    if(type == 'load') { 
        // is very unlikely that it will ever be called... (TODO)
    } else if (type == 'unload') {
        // do nothing
    } else {
        this.document.body.removeEventListener( type, listener, useCapture );
    }
}

if(window.getSelection) {
    __Window.prototype.getSelection = function getSelection () {
        // IE: nouse!!
        var sel = new __Selection();
        sel.___document = this.document;
        return sel;
    };

    function __Selection() {
        // go Gecko- only way
        this.sel = window.getSelection(); // fixed
        this.___link = this.sel; // because i pissed.
    }

    __Selection.prototype.getRangeAt = function (n) {
        // TODO: return a Range wrapper object! huh.
        // WARNING! Safari MAY not support this -> create a wrapper for this situation
        if(this.___link.getRangeAt) {
            var range = this.___link.getRangeAt(n);
        } else {
            var range = document.createRange();
            range.setStart(this.___link.anchorNode,this.___link.anchorOffset);
            range.setEnd(this.___link.focusNode,this.___link.focusOffset);
        }
        var wrange = new __Range();
        wrange.___link = range;
        wrange.___document = this.___document;
		return wrange;
    };

    __Selection.prototype.collapse = function (w_parentNode, offset) {
        this.sel.collapse(w_parentNode.___link, offset);
    };

    __Selection.prototype.extend = function (w_parentNode, offset) {
        this.sel.extend(w_parentNode.___link, offset);
    };

    __Selection.prototype.collapseToStart = function () {
        this.sel.collapseToStart();
    };

    __Selection.prototype.collapseToEnd = function () {
        this.sel.collapseToEnd();
    };

    __Selection.prototype.selectAllChildren = function (w_parentNode) {
        this.sel.selectAllChildren(w_parentNode.___link);
    };

    __Selection.prototype.addRange = function (w_range) {
        this.sel.addRange(w_range.___link);
    };

    __Selection.prototype.removeRange = function (w_range) {
        this.sel.removeRange(w_range.___link);
    };

    __Selection.prototype.removeAllRanges = function () {
        this.sel.removeAllRanges();
    };

    __Selection.prototype.deleteFromDocument = function () {
        this.sel.deleteFromDocument();
    };

    __Selection.prototype.containsNode = function (w_aNode, aPartlyContained) {
        return this.sel.containsNode(w_aNode.___link, aPartlyContained);
    };

    __Selection.prototype.toString = function () {
        // TODO: return only if the selection is inside the 'vm document'
        // XXX otherwise it is a security issue!
        return this.___link.toString();
    };

    // ... and selection getters!
    
    __Selection.prototype.___get_wrapped_node  = function (name) {
        return this.___document.___get_from_link(this.sel[name]);
    };
    
    __Selection.prototype.___getters = { 
        anchorNode: __Selection.prototype.___get_wrapped_node,
        anchorOffset: __htmldom_get_direct,
        focusNode: __Selection.prototype.___get_wrapped_node,
        focusOffset: __htmldom_get_direct,
        isCollapsed: __htmldom_get_direct,
        rangeCount: function (name) { // __htmldom_get_direct // not supported by Safari, Opera, Chrome
            if(this.___link.rangeCount) {
                // DOC multiple selections are unsupported
                var r = this.getRangeAt(0);
                // we should return 0 if the selection is outside our scope!
                if(r.___getters.startContainer.call(r, "startContainer") == null) return 0;
            }
            if("rangeCount" in this.___link) return this.___link.rangeCount;
            return 0;
        }
    };
    
    __Selection.prototype.___setters = { 
        anchorNode:1,
        anchorOffset:1,
        focusNode:1,
        focusOffset:1,
        isCollapsed:1,
        rangeCount:1
    };
    
    // now for the Range object
    
    // WARNING! gecko methods left unimplemented (see https://developer.mozilla.org/En/DOM/Range)
    
    function __Range() {
        // ___link and ___document MUST be set by instantizer!
    }
    
    // XXX what will be with absent ___link?
    __Range.prototype.setStart = function (startNode, startOffset) {
        this.___link.setStart(startNode.___link, startOffset);
    };
    
    __Range.prototype.setEnd = function (startNode, startOffset) {
        this.___link.setEnd(startNode.___link, startOffset);
    };
    
    __Range.prototype.setStartBefore = function (startNode) {
        this.___link.setStartBefore(startNode.___link);
    };
    
    __Range.prototype.setStartAfter = function (startNode) {
        this.___link.setStartAfter(startNode.___link);
    };
    
    __Range.prototype.setEndBefore = function (startNode) {
        this.___link.setEndBefore(startNode.___link);
    };
    
    __Range.prototype.setEndAfter = function (startNode) {
        this.___link.setEndAfter(startNode.___link);
    };
    
    __Range.prototype.selectNode = function (startNode) {
        this.___link.selectNode(startNode.___link);
    };
    
    __Range.prototype.selectNodeContents = function (startNode) {
        this.___link.selectNodeContents(startNode.___link);
    };
    
    __Range.prototype.collapse = function (toStart) {
        this.___link.collapse(toStart);
    };
    
    
    // --- editing methods
    
    // expensive function
    __Range.prototype.cloneContents = function () {
        var docFragment = this.___link.cloneContents();
        
        // Curse W3C !
        var tmpe = document.createElement("DIV");
        tmpe.appendChild(docFragment)
        var ihtml = tmpe.innerHTML;
        // end curse W3C 
        
        var wdf = this.___document.createDocumentFragment();
        wdf.___setters.innerHTML("innerHTML", ihtml); // XXX test it!
        return wdf;
    };
    
    __Range.prototype.deleteContents = function () {
        
        // TODO: reflect changes in local XML tree!
        this.___link.deleteContents();
    };
    
    __Range.prototype.extractContents = function () {
        var wdf = this.cloneContents();
        this.deleteContents();
        return wdf;
    };
    
    __Range.prototype.insertNode = function (newNode) {
		// TODO: DOM security - make sure we're inserting only to where we have access to!
		
		// this.___link.insertNode(newNode.___link);
		
		// 		: simulate the insertNode rather than executing it 
		
		var node = this.___link.startContainer;
		var offset = this.___link.startOffset;

		if (node.nodeType == 3){ // text node
			var Text = node.textContent ? node.textContent : node.innerText;
			if (offset == 0) {
			    var wbefore = this.___document.___get_from_link(node);
				wbefore.getParentNode().insertBefore(newNode, wbefore);
			 
			} else if (offset == Text.length) {
				if(node.nextSibling) {
					var wbefore = this.___document.___get_from_link(node.nextSibling);
                    // TODO: DOM normalizer required here! DOC the absense..
                    /* temporary workaround(for <br> after enter-press) ... */
                    //if(!wbefore && !node.nextSibling.nextSibling) {if(window.console) console.log("insertBefore: doing workaround!"); node.parentNode.removeChild(node.nextSibling); this.___document.___get_from_link(node.parentNode).appendChild(newNode); return;}
                    /* ... end temporary workaround */
					wbefore.getParentNode().insertBefore(newNode, wbefore);
				} else {
					var wbefore = this.___document.___get_from_link(node.parentNode);
					wbefore.appendChild(newNode);
				}
			} else {
			  // we need to split the textNode here and insert between... see spec... 

			  var wparent = this.___document.___get_from_link(node.parentNode);
			  var wthis = this.___document.___get_from_link(node);
			  
			  var begText = Text.slice(0, offset);
			  var endText = Text.slice(offset);
			  var wbegNode = this.___document.createTextNode(begText);
			  var wendNode = this.___document.createTextNode(endText);
			  wparent.replaceChild(wendNode, wthis);
			  wparent.insertBefore(wbegNode, wendNode);
			  wparent.insertBefore(newNode, wendNode);
			}
			 
		} else {
			if (offset == node.childNodes.length) {
				var wnode = this.___document.___get_from_link(node);
				wnode.appendChild(newNode);
			}
			else if (offset == 0) {
				var wbefore = this.___document.___get_from_link(node.firstChild);
				wbefore.getParentNode().insertBefore(newNode, wbefore);
			}
			else {
				var wbefore = this.___document.___get_from_link(node.childNodes[offset]);
				wbefore.getParentNode().insertBefore(newNode, wbefore);
			}
		}
		
		
		// set the ___id of new element and add to cache to avoid unnesessary cache rebuilding
		// TODO: update cache at insertBefore..
	
        
    };
    
    __Range.prototype.surroundContents = function (newNode) {
        newNode.appendChild(this.extractContents()); 
        this.insertNode(newNode);
    };
    
    // Other Methods 
    
    __Range.prototype.compareBoundaryPoints = function (how, sourceRange) {
        return this.___link.compareBoundaryPoints(how, sourceRange.___link);
    };
    
    __Range.prototype.cloneRange = function () {
        var wr = new __Range();
        wr.___link = this.___link.cloneRange();
        wr.___document = this.___document;
        return wr;
    };
    
    // WARNING!! this all may result in exceptions! (DOMException) -> this should not be thrown by VM as errors!
    __Range.prototype.detach = function () {
        this.___link.detach();
    };
    
    __Range.prototype.toString = function () {
        // TODO: DOM security enhancements!
        return this.___link.toString();
    };
    
    __Range.prototype.___getters = {
        collapsed: function(name) {
            return this.___link.collapsed;
        },
        
        // copypaste region... ;-)
        commonAncestorContainer: function (name) {
            var el = this.___document.___get_from_link(this.___link[name]);
            if(el) return el;
            return null;
        },
        endContainer: function (name) {
            var el = this.___document.___get_from_link(this.___link[name]);
            if(el) return el;
            return null;
        },
        endOffset: function (name) {
            return this.___link.endOffset;
        },
        startContainer: function (name) {
            var el = this.___document.___get_from_link(this.___link[name]);
            if(el) return el;
            console.log("CCC: no container!");
            CCC = this.___link[name];
			return null;
            
        },
        startOffset: function (name) {
            return this.___link.startOffset;
        }
    };
    
    __Range.prototype.___setters = {
        collapsed: 1,
        commonAncestorContainer:1,
        endContainer: 1,
        endOffset: 1,
        startContainer: 1,
        startOffset: 1
    };
    
    __Range.prototype.END_TO_END = Range.END_TO_END;
    __Range.prototype.END_TO_START = Range.END_TO_START;
    __Range.prototype.START_TO_END = Range.START_TO_END;
    __Range.prototype.START_TO_START = Range.START_TO_START;
    
    DOMDocument.prototype.createRange = function () {
        var wr = new __Range();
        wr.___link = document.createRange();
        wr.___document = this;
        return wr;
    };
    
    // no Gecko methods implemented...
    
} else {
    // IE way here...
    alert("IERange library not loaded!");
}
// ----------------------------

__Window.prototype.getComputedStyle = function getComputedStyle (wrappedElement) {
    // IE: .currentStyle
    return (new ComputedStyle(wrappedElement));
};

function ComputedStyle(wrappedElement) {
    this.el = wrappedElement;
}

ComputedStyle.prototype.getPropertyValue = function (name) {
    if(window.getComputedStyle) {
        return window.getComputedStyle(this.el.___link).getPropertyValue(name); 
    } else {
        return this.el.___link.currentStyle[name];
    }
};


__window_getters = {
    innerHeight: function (name) {
        return this.document.documentElement.___getters.clientHeight("clientHeight");
    },
    innerWidth: function (name) {
        return this.document.documentElement.___getters.clientWidth("clientWidth");
    },
    name: function (name) { return ""; }, // ???
    outerHeight: function (name) {
        return this.document.documentElement.___getters.offsetHeight("offsetHeight");
    },
    outerWidth: function (name) {
        return this.document.documentElement.___getters.offsetWidth("offsetWidth");
    },
    scrollX: function (name) {
        return this.document.documentElement.___getters.scrollLeft("scrollLeft");
    },
    scrollY: function (name) {
        return this.document.documentElement.___getters.scrollTop("scrollTop");
    }
    
    // TODO: implement window.selection
};

__window_setters = {
    innerHeight: 1,
    innerWidth: 1,
    name: fake,
    outerHeight: 1,
    outerWidth: 1,
    scrollX: 1,
    scrollY: 1
    
    // TODO: implement window.selection
};

__nav_set = {
    appCodeName : 1,
    appName  : 1,
    appVersion  : 1,
    buildID  : 1,
    cookieEnabled : 1, 
    language  : 1,
    mimeTypes  : 1,
    onLine  : 1,
    oscpu  : 1,
    platform  : 1,
    plugins  : 1,
    product  : 1,
    productSub  : 1,
    securityPolicy  : 1,
    userAgent  : 1,
    vendor  : 1,
    vendorSub  : 1
};


__nav_get = {
    appCodeName : function () {return "jeneric";},
    appName  : function () {return "Netscape";},
    appVersion  : function () {return "0.1";},
    buildID  : function () {return "2009a";},
    cookieEnabled : function () {return false;},
    language  : function () {return "en-US";},
    mimeTypes  : function () {return navigator.mimeTypes; },
    onLine  : function () {return true;}, // TODO: return a real value based on HUB connectivity
    oscpu  : function () {return navigator.oscpu;},
    platform  : function () {return navigator.platform;},
    plugins  : function () {return navigator.plugins;},
    product  : function () {return "Gecko";},
    productSub  : function () {return "Jeneric0.1";},
    securityPolicy  : function () {return "process";},
    userAgent  : function () {return "Jeneric Web Virtual Machine (Gecko translator Jeneric 0.1)";},
    vendor  : function () {return "jeneric.net";},
    vendorSub  : function () {return "doc.jeneric.net";}
};

__vrt_set = __nav_set;

function __get_real_nav(name) {
    return navigator[name];
}

__vrt_get = {
    appCodeName : __get_real_nav,
    appName  : __get_real_nav,
    appVersion  : __get_real_nav,
    buildID  : __get_real_nav,
    cookieEnabled : __get_real_nav,
    language  : __get_real_nav,
    mimeTypes  : __get_real_nav,
    onLine  : __get_real_nav,
    oscpu  : __get_real_nav,
    platform  : __get_real_nav,
    plugins  : __get_real_nav,
    product  : __get_real_nav,
    productSub  : __get_real_nav,
    securityPolicy  : __get_real_nav,
    userAgent  : __get_real_nav,
    vendor  : __get_real_nav,
    vendorSub  : __get_real_nav
};

__Window.prototype.virtual = { ___setters: __vrt_set, ___getters: __vrt_get, "vmkernel": "ratbird", "vmkernelVersion": "0.1" };
__Window.prototype.navigator = { ___setters: __nav_set, ___getters: __nav_get };

__Window.prototype.___getters = __window_getters;
__Window.prototype.___setters = __window_setters;

///////////////////////////////////////////////////////////
// execCommand

__execCMDs = {
    backColor:1,
    bold:1,
    contentReadOnly:1,
    copy:1,
    createLink:1, // must be treated accurately
    cut:1,
    decreaseFontSize:1,
    "delete":1,
    fontName:1,
    fontSize:1,
    foreColor:1,
    formatBlock:1,
    heading:1,
    hiliteColor:1,
    increaseFontSize:1,
    indent:1,
    insertHorizontalRule:1,
    //insertHTML:1, // XXX currently unsupported
    insertImage:1,
    insertOrderedList:1,
    insertUnorderedList:1,
    insertParagraph:1,
    italic:1,
    justifyCenter:1,
    justifyLeft:1,
    justifyRight:1,
    outdent:1,
    paste:1,
    redo:1,
    removeFormat:1,
    selectAll:1,
    strikeThrough:1,
    subscript:1,
    superscript:1,
    underline:1,
    undo:1,
    unlink: 1,
    styleWithCSS: 1
};

DOMDocument.prototype.execCommand = function (aCommandName, aShowDefaultUI, aValueArgument) {
    // there are some unsafe elements! Like <link>
    // we need to insert _target for each <LINK> ! 
    // parse again, for example, before switching from EDIT to HTML.. or such
    if(!__execCMDs[aCommandName]) return false; // filter out
    return document.execCommand(aCommandName, aShowDefaultUI, aValueArgument);
};


////////////////////////////////////////////////////////////////////////////////////////////////
// style sheet section

function __CSSStyleSheet(vm) {
    this.cssRules=[]; // TODO: should be a getter only
    this.disabled = false;
    this.href = "";
    this.media="screen"; // no printing support yet... how do ya imagine printing an application anyways?
    this.ownerNode = null;
    this.ownerRule = null;
    this.parentStyleSheet  = null;
    this.title = "";
    this.type = "text/css";
    this.___vm = vm;
}

__CSSStyleSheet.prototype.insertRule = function (ruleStr, indx) {
    if(typeof indx != "number" || indx == -1) indx = this.cssRules.length;
    this.cssRules[indx] = new __CSSStyleRule(ruleStr);
    // now parse the rule
    // strip comments
    ruleStr = ruleStr.toString();
    ruleStr.replace(/\/\*.+\*\//g, "");
    if(ruleStr.match(/(})/g).length != 1) {
        throw "wrong rule!";
    }
    
    var p = ruleStr.split("{")[0];
    var r = "{"+ruleStr.split("{")[1];
    
    var lp = p.split(",");
    var op = [];
    for(var ii = 0; ii<lp.length;ii++) {
        op.push("#"+this.___vm.uriId+" "+lp[ii]);
    }
    var p = op.join(",");
    ruleStr = p+" "+r;

    //ruleStr = "#"+this.___vm.uriId+" "+ruleStr;
    if (document.styleSheets[0].cssRules) {
        var real_idx = document.styleSheets[0].cssRules.length;
        //console.log("Inserting rule: "+ruleStr);
        document.styleSheets[0].insertRule(ruleStr, real_idx);
        var styleObj = document.styleSheets[0].cssRules[real_idx];
    } else {
        var real_idx = document.styleSheets[0].rules.length;
        //var sel = ruleStr.split("{")[0];
        //var rul = "{"+ruleStr.split("{")[1];
        //console.log("Inserting sel: "+sel+" rul: "+rul);
        //document.styleSheets[0].addRule(sel, rul, real_idx);   
        if(p.indexOf(",") > -1) { // IE supports only 'Single contextual selector' here
            lp = p.split(",");
            for(var l=0; l<lp.length;l++) {
                document.styleSheets[0].addRule(lp[l], r, real_idx+l);
            }
        } else {
            document.styleSheets[0].addRule(p, r, real_idx);        
        }
        var styleObj = document.styleSheets[0].rules[real_idx];
    }
    this.cssRules[indx].___idx = real_idx;
    this.cssRules[indx].style = styleObj;
    this.___vm.cssRules.push(real_idx);
};

__CSSStyleSheet.prototype.deleteRule = function (indx) {
    if (document.styleSheets[0].cssRules) {
        document.styleSheets[0].deleteRule(this.cssRules[indx].___idx);
    } else {
        document.styleSheets[0].removeRule(this.cssRules[indx].___idx); // IE
    }
    delete this.cssRules[indx];
};

function __CSSStyleRule(ruleStr) {
    this.cssText = ruleStr;
    this.parentRule = null;
    this.parentStyleSheet = null;
    this.type = 1; // CSSRule.STYLE_RULE
    this.selectorText = ruleStr.split("{")[0];
}


