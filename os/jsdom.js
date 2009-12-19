/*


TODO NOW


+ element.waitEvent: temporarily bind to event; similar to addEventListener x.waitEvent("keyup");
    + event interface!! -  e.keyCode || e.wich ?
    - event queue ! LATER.6
    + ie && others - see event type
+ document.createElement("DIV");
+ x.style
+ document.createTextNode(txt);
+ x.appendChild(t);
+ document.body (.appenChild() ...)
+ x.focus();
+ setAttr("contentEditable", val) x.contentEditable = true; (?!?!?) - do set_contentEditable() and get_contentEditable()
+ t.nodeValue - do get_nodeValue() (!!! we cannot support getters/setters due to future possible SUBJIT problems)



Seems that we're going to implement
http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/java-binding.html
and not
http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html

- bind_event: bind an event (??) -- this is a native method...

- TODO GETTERS/SETTERS!
- cookie storage
 - append some VMID(PID? DOMID?) to all IDs of elements of the DOM? then getElementById() will prepend the DOMID to request
   and that will be a much faster search?
 - getElementById
 - getElementsByTagName: run the method, then 
*/


Jnaric.prototype.bind_dom = function (domElement) {
    
    // TODO: if domElement is undefined - bind to Fake DOM element
    
    if(typeof domElement == 'undefined')
        var l_body = new __HTMLElement(this, "BODY"); //fake element
    else {
        var l_body = new __HTMLElement(this, domElement);
    }
    var self = this;
    
    // for new dom2 model:
    // - set up DOMDocument
    // - create "body" node
    //      set .body to .documentElement, and both to the given DIV container
    // - attach body's ___link to real domElement passed here
    // - link the 'body' node to document.body
    
    // - add other mozilla's properties??
    
    
    this.global.document = {
        createElement: function ( sTagName ) {
            return new __HTMLElement(self, sTagName);
        },
        
        body: l_body,

        
        getElementById: function ( s_id ) {
            // construct & return a representing object
            // TODO
        },
        createTextNode: function ( txt ) {
            return new __Text(self, txt);
        }
    };
    
    this.global.window = {
        scrollTo: function ( x, y ) {
            window.scrollTo(x,y);
        }
    };
};

// XXX LAME! the ___ property can still be accessed via obj["___propname"]



// TODO: implement a virtual getter/setter interface here to defeat browser incompatibless

/*

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
- implement event model
- do the switch to xmldom2 as described in bind_dom
- introduce DOM clean hooks (and general clear on DELETE object event)

- implement each HTML element interface as of mozilla DOM reference https://developer.mozilla.org/en/gecko_dom_reference
- implement execCommand
- window full support: selection, etc.
    - props: innerHeght/width to be set to containing element
    - methods:
- FORM SUBMIT healing with _target https://developer.mozilla.org/en/DOM/element.name - iframe name (associated with each form?)
- LINK HREF with _target = _blank
    - create a default named target for all this stuff
- selection objects WRAP
- range objects WRAP
    - with these it is that element cache for ___link back-resolving is required
- support for CSS loading/unloading and cleanup alongside with DOM!



- XXX TODO: remember the form submit problems as well as links problems (set navigate-away notifier?? with kernel disable initline)


- CSS: setting-by-id problem? need to tweak element IDs??? ever possible to set CSS to elements without distortion?

??? automatic refactoring JSDOM into JNDOM ???    

    -----------
    
if(typeof(document.compatMode)=='undefined' || document.compatMode=='CSS1Compat')
return document.documentElement.clientWidth;
else return document.body.clientWidth;
-- WTF?


*/




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
    this["get"+name.charAt(0).toUpperCase() + name.substr(1)]();
}

/* warning for event model: 
// warning for event model: 
// -> set to callable methods only (otherwise set TypeError)
// -> call in multi-threaded mode
// What to do with external calls to onsmth()?? 
//  processes can access each other's DOM values and execute methods cross-vm. That's BAD!
//  if the method is calling something with a lock -> the lock may be lost in stacks :-\ TODO resolve this!
//  TODO: AT LEAST detect this situation!
*/


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

/* EVENT MODEL PROPERTIES

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
            } else { // rethink yr life
                
                var rop = this.___link.offsetParent;
                
                if(!this.ownerDocument.___DOMcache || this.ownerDocument.___DOMcache_outdated) {
                    this.ownerDocument.___DOMcache = (this.ownerDocument.documentElement.getElementsByTagName("*"))._nodes;
                    this.ownerDocument.___DOMcache_outdated = false;
                }
                var allElements = this.ownerDocument.___DOMcache;
                for(var i=0; i<allElements.length; i++) {
                    if( allElements[i].___link === rop ) return allElements[i];
                }
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
    
    name: __htmldom_get_direct

};

// Setters should always return a value
___DOMHTMLSetters = {
    contentEditable: __htmldom_set_direct,
    innerHTML: function (name, value) {
        // parse through innerHTML
        if(typeof document != "undefined" && document.createElement) {
            var tmp_t = document.createElement(this.tagName);
            tmp_t.innerHTML = value; // parse
            value = tmp_t.innerHTML; // get... ECMAbindings :-\
        }
        
        // clear current element's child list
        delete this.childNodes; //._nodes;
        // this.childNodes._nodes = [];
        // parse as innerHTML and get the parsed values, then re-parse the correct XML with our parser
        // not attaching it anywhere onevent
        var di = new DOMImplementation();
        // XXX namespace-inaware!! TODO: more conformace
        // not quite conforming to http://www.w3.org/TR/2008/WD-html5-20080610/dom.html#innerhtml1
        var dom = di.loadXML("<"+this.tagName+">"+value+"</"+this.tagName+">"); 
        this.childNodes = dom.documentElement.childNodes;
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
    nodeValue: 1,
    parentNode: 1,
    tagName: 1,

    
    name: 1 // behave as IE
};


// implement DOM setters:
DOMElement.prototype.___getters = ___DOMHTMLGetters;
DOMElement.prototype.___setters = ___DOMHTMLSetters;



/* DOMElement methods list

-- EVENT MODEL ---
addEventListener( type, listener, useCapture )
removeEventListener( type, handler, useCapture )
dispatchEvent( event )
--- END EVENT MODEL

scrollIntoView( alignWithTop )
+ focus()
+ blur()
+ click()

// --> VERY HARD!
// need to wrap commands that are allowed, then do safe equivalents for not allowed things
execCommand(String aCommandName, Boolean aShowDefaultUI, String aValueArgument)
    https://developer.mozilla.org/en/Rich-Text_Editing_in_Mozilla

compareDocumentPosition [tricky] DOM3

cloneNode( deep )
appendChild( appendedNode )
getAttribute( name )
getAttributeNode( name )
getElementsByTagName( name )
hasAttribute( name )
hasAttributes() (no NS version?)
hasChildNodes()
insertBefore( insertedNode, adjacentNode )
normalize()
removeAttribute( name )
removeAttributeNode( attrNode )
removeChild( removedNode )
replaceChild( insertedNode, replacedNode )
setAttribute( name, value )
setAttributeNode( name, attrNode )

https://developer.mozilla.org/En/DOM/Node.isSupported

getElementsByClassName ( ) ???? SKIP

*/

DOMElement.prototype.focus = function ( ) {
    if(this.___link && this.___link.focus) this.___link.focus();
};

DOMElement.prototype.blur = function ( ) {
    if(this.___link && this.___link.blur) this.___link.blur();
};

DOMElement.prototype.click = function ( ) {
    if(this.___link && this.___link.click) this.___link.click();
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
addEventListener
createEvent

+ hasFocus

execCommand
getElementsByName

createAttribute
createComment
createDocumentFragment
createElement
createTextNode

createEntityReference (?)
createExpression HTML5 Compiles an XPathExpression

*/

___DOCHTMLGetters = {
    // designMode: // not supported
    
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
            var al = document.activeElement;
            // now search for activeElement:
            if(!this.___DOMcache || this.___DOMcache_outdated) {
                    this.___DOMcache = (this.documentElement.getElementsByTagName("*"))._nodes;
                    this.___DOMcache_outdated = false;
            }
            for(var i=0; i<this.___DOMcache.length; i++) {
                if(this.___DOMcache[i].___link === al) return this.___DOMcache[i];
            }
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
    }

};

// Setters should always return a value
___DOCHTMLSetters = {
    contentEditable: __htmldom_set_direct,
    
    textContent: function (name, value) { // do nothing
        return value;
    },
       
    title function (name, value) { return value;},
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
    
    activeElement: 1
    
    height: 1,
    width: 1

    
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


////////////////////////////////////////////////////////////////////
// OLD CODE GOES BELOW
////////////////////////////////////////////////////////////////////

function __HTMLElement( vm, sTagName ) {
    this.tagName = sTagName;
    this.nodeType = 1;
    
    if(sTagName instanceof HTMLElement) {
        this.___link = sTagName;
        this.tagName = sTagName.tagName; // WARNING! the VM will not have 'BODY' element EVER!
    } else if (sTagName instanceof __HTMLElement) {
        this.___link = sTagName.___link;
        this.tagName = sTagName.tagName;
    } else {
        this.___link = document.createElement(sTagName);
    }
    
    this.___vm = vm;
    this.___childNodes = []; // todo: getter interface for this??
                             // todo: bind to readily available __HTMLElement with childNodes?
    this.style = this.___link.style;
}

__HTMLElement.prototype.appendChild = function ( element ) {
    this.___childNodes.push(element);
    //console.log("running appendChild of "+element.nodeType + " exact " + element.___link.nodeType + " on " + this.tagName + " exact " + this.___link.tagName );
    //console.log(this.___link);
    //console.log(element.___link);
    this.___link.appendChild( element.___link );
    //console.log("now childNodes is");
    //console.log(this.___link.childNodes);
    
};

__HTMLElement.prototype.focus = function ( ) {
    this.___link.focus();
};


__setAttrs = {
    contentEditable: null,
    textContent: function (n, v) {
        if("textContent" in n) {
           n.textContent = v;
        }
        else n.innerText = v;
    }    
};

__getAttrs = {
    contentEditable: null,
    innerHTML: null,
    textContent: function (n) {
        if("textContent" in n) return n.textContent;
        return n.innerText;
    }
};

// WARNING!!! DANGEROUS METHOD - gives access to anything !?!
// - or - block unauthorised ??
__HTMLElement.prototype.setAttr = function ( attrName, value) {
    if(!(attrName in __setAttrs)) return;
    if(__setAttrs[attrName]) {
        __setAttrs[attrName](this.___link, value);
    } else this.___link[attrName] = value;

    
};

__HTMLElement.prototype.getAttr = function ( attrName ) {
    if(!(attrName in __getAttrs)) return;
    if(__getAttrs[attrName]) {
        return __getAttrs[attrName](this.___link);
    } else return this.___link[attrName];
};

__HTMLElement.prototype.waitEvent = function ( eType, timeout ) {
    // block the current calling stack
    timeout = timeout || 0;
    var cs = this.___vm.cur_stack;
    var x2 = cs.my.x2; // set x2.result
    cs.EXCEPTION = false;
    var mySTOP = __jn_stacks.newId();
    cs.STOP = mySTOP;
    var elmt = this;
    
    
    var evt = function (e) {
        // catch MS event
        var characterCode;

        e = e || event
        
        if(e.target != elmt.___link) return; // bypass
        
        var ev = new __Event(e.type);
        ev.target = elmt;
        ev.keyCode = e.keyCode;
        ev.ctrlKey = e.ctrlKey;

        // now unregister event
        if(elmt.___link.addEventListener) elmt.___link.removeEventListener(eType, evt, true);
        else elmt.___link.detachEvent("on"+eType, evt); // IE

        
        x2.result = ev;
        cs.EXCEPTION = RETURN;
        cs.STOP = false;
        // cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
        __jn_stacks.start(cs.pid);
        

    };
    
    // now register event
    if(this.___link.addEventListener) this.___link.addEventListener(eType, evt, true);
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

function __Event(type) {
    this.type = type;
}

function __Text(vm, txt) {
    this.nodeType = 3;
    this.___link = document.createTextNode(txt);
    this.___vm = vm;
}

__Text.prototype.getNodeValue = function () {
    return this.___link.nodeValue;
}

__Text.prototype.setNodeValue = function (txt) {
    return this.___link.nodeValue = txt;
}

