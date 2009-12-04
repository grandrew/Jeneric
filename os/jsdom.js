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
        l_body = new __HTMLElement(this, "BODY"); //fake element
    else {
        var l_body = new __HTMLElement(this, domElement);
    }
    var self = this;
    
    
    
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


// TODO: implement a virtual getter/setter interface here to defeat browser incompatibless
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
            x2.result = null; // means no event caught
            
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
