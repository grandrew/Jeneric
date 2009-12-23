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


Jnaric.prototype.bind_dom = function (wrapped_domElement) {
    
    // TODO HERE: if domElement is undefined - bind to Fake DOM element
    
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
    
    this.global.document.body = this.global.document.documentElement;
    
    
    if(typeof wrapped_domElement != 'undefined')
            wrapped_domElement.___link.appendChild(this.global.document.body.___link);
    
    
    this.global.document.___vm = this;
    
    
    this.global.window = { // TODO: reimplement!
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
+ implement event model
- do the switch to xmldom2 as described in bind_dom
- run all the above shit
- introduce DOM clean hooks (and general clear on DELETE object event)
- test new clean hooks (the apps to remove from DOM)

- getComputedStyle(elementRef, pseudoElementName) Not supported in IE, which uses the "currentStyle" property instead.
    and others. WTF??
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
    onsubmit : __get_onevent_listener
    
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
    onsubmit : __set_onevent_listener

};


// implement DOM setters:
DOMElement.prototype.___getters = ___DOMHTMLGetters;
DOMElement.prototype.___setters = ___DOMHTMLSetters;



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
    if(!this.___DOMcache || this.___DOMcache_outdated) this.___rebuild_cache();
    return this.___DOMcache[domElement];
};

DOMDocument.prototype.___rebuild_cache = function () {
    var all = (this.documentElement.getElementsByTagName("*"))._nodes;
    delete this.___DOMcache;
    this.___DOMcache = {};
    for(var i=0; i<all.length; i++) {
        if( all[i].___link ) this.___DOMcache[all[i].___link] = all[i];
    }
    this.___DOMcache_outdated = false;
};

////////////////////////////////////////////////////////////////////
// EVENT MODEL
////////////////////////////////////////////////////////////////////


/* warning for event model: 
// warning for event model: 
// + set to callable methods only 
// + call in multi-threaded mode DOC IT
// What to do with external calls to onsmth()?? 
//  processes can access each other's DOM values and execute methods cross-vm. That's BAD!
//  if the method is calling something with a lock -> the lock may be lost in stacks :-\ TODO resolve this!
//  TODO: AT LEAST detect this situation!
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

        onsubmit

*/

function fake() {};


DOMElement.prototype.addEventListener = function ( type, listener, useCapture ) {
    // XXX DOC currently useCapture always et to false to behave exactly as IE
    // it only works when real DOM rendering is available so our task simplifies much
    if(!this.___link) return;
    
    // assume ___vm is set to this.ownerDocument
    var vm = this.ownerDocument.___vm;
    
    if(!(listener.node && listener.scope)) throw (new vm.global.TypeError("JNARIC: addEventListener second argument must be a function"));

    /*
    var x2 = new vm.ExecutionContext(FUNCTION_CODE);
        
    x2.thisObject = vm.global;
    x2.caller = null;
    x2.callee = listener;
    
    var a = []; // args
    a.__defineProperty__('callee', listener, false, false, true);
    var f = listener.node;
    
    //console.log("Normal call working...");
    
    x2.scope = {object: new Activation(f, a), parent: listener.scope};
    
    var g_stack = new __Stack(x2);
    g_stack.push(S_EXEC, { n: f.body, x: x2, pmy: {} });
    
    var my_nice = __jn_stacks.__nice(vm.cur_stack.pid);
    */
    
    var evt = function (e) {
        /*
        __jn_stacks.add_task(vm, g_stack, my_nice, vm.throttle);
        */
        // var e = window.event ? window.event : aEvent;
        var e = new __Event(vm, e); // create an event based on real event
        // TODO: more verbosity here
        var evt_fakeerr = function ( err ) { vm.ErrorConsole.log("Error executing event handler: "+err); };
        vm.execf_thread(listener, [e], fake, evt_fakeerr); 
    };
    
    // now register event
    // DOC WARNING!: currently does not support user-defined events due to IE direct link
    // DOC: currently do not support capture to behave as IE
    if(this.___link.addEventListener) this.___link.addEventListener(type, evt, false);
    else this.___link.attachEvent("on"+type, evt); // IE    
    
    if(!this.___listeners) this.___listeners = {};
    if(!this.___listeners[type]) this.___listeners[type] = {};
    this.___listeners[type][listener] = evt;
};

DOMDocument.prototype.addEventListener = function ( type, listener, useCapture ) {
    this.documentElement.addEventListener( type, listener, useCapture );
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
        if(elmt.___link.addEventListener) elmt.___link.removeEventListener(type, evt, false);
        else elmt.___link.detachEvent("on"+type, evt); // IE
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
DOMElement.prototype.waitEvent = function ( eType, timeout, propertyName, propertyValue ) {
    // DOC: watch for propertyName of event to equal propertyValue, else ignore it 
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
        
        if(e.target != elmt) return; // bypass // and check if everything works (like cache)
        
        if(propertyName && propertyValue) {
            if(e[propertyName] != propertyValue) return;
        }

        // now unregister event
        if(elmt.___link.addEventListener) elmt.___link.removeEventListener(eType, arguments.callee, false);
        else elmt.___link.detachEvent("on"+eType, arguments.callee); // IE

        
        x2.result = e;
        cs.EXCEPTION = RETURN;
        cs.STOP = false;
        // cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
        __jn_stacks.start(cs.pid);
        

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
    
    var rtarget = event.srcElement ? event.srcElement : event.target;
    
    this.target = event.srcElement ? this.___vm.global.document.___get_from_link(event.srcElement) : this.___vm.global.document.___get_from_link(event.target);
    this.relatedTarget  = event.srcElement ? this.___vm.global.document.___get_from_link(event.fromElement) : this.___vm.global.document.___get_from_link(event.relatedTarget);// IE: fromElement
    this.currentTarget = event.srcElement ? this.___vm.global.document.___get_from_link(event.toElement) : this.___vm.global.document.___get_from_link(event.currentTarget); // IE: toElement
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
    if(this.___link) {
        if(this.___link.preventDefault) this.___link.preventDefault();
        else this.___link.returnValue = false;
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

    if(!listener || !listener.node || !listener.scope) {
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
// OLD CODE GOES BELOW
////////////////////////////////////////////////////////////////////
/*
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
*/

