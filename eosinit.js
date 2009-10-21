/*
 - the general object structure, 
 - serializer init, 
 - comet init 
 - terminal creation
    - set vm.parent to ""
    - set vm.uri to "~"
 - some basic types and security??? -> additional files for vm.load()
    - getMethodList ?? describeObject ?? or is it security code??
 - create a DIV to bind terminal object to.
*/

/*
TODO: wait for all objects to finish loading, then tell terminal to continue... (or feed the code?)
TODO: cache .jn files, do not load them every time!

*/

DEBUG=0;

// GENERAL INIT part


_terminal_vm = new Jnaric();

_terminal_vm.name = "terminal"+(new Date()).getTime(); // TODO! get real terminal name!!! (somehow??)
_terminal_vm.TypeURI = "terminal"; // no real URI
_terminal_vm.SecurityURI = "terminal"; // no IPC for terminal at all
_terminal_vm.parent = "/guest"; // the server root?? username?? FUCK!!! XXX TODO !!!!!!!!!!!!
                          // the parent should be our username - REATTACH PARENT when authenticated!!
_terminal_vm.uri = "~";//_terminal_vm.parent + "/"+name; // rewrite THIS when authenticated...!!
_terminal_vm.serID = -1; // can never be serialized
_terminal_vm.childList = {}; // TODO: init the CL from somewhere !!!

_terminal_vm.global.initIPCLock = true; // THIS to be flushed by security validateRequest method init
_terminal_vm.global.wakeupIPCLock = false; 


// BINDING part
var dmb = document.createElement("DIV");
dmb.style.width = "100%";
document.body.appendChild(dmb);

_dmb = new __HTMLElement(_terminal_vm, "DIV" );
_dmb.___link = dmb;

_terminal_vm.bind_dom(_dmb); // TODO bind to fake DOM element since it is currently impossible to serialize DOM-enabled elements
_terminal_vm.bind_om(); // bind the protected EOS object model
_terminal_vm.bind_terminal();


// TWEAKINIT part

_terminal_vm.load("anarchic.jn");



// write the object!
__eos_objects["terminal"] = _terminal_vm;



// NOW CREATE SYS OBJECT

_sys_vm = new Jnaric();

_sys_vm.name = "sys";
_sys_vm.TypeURI = "~/sys/ramstore";
_sys_vm.SecurityURI = "~/sys/anarchic"; // no IPC for terminal at all
_sys_vm.parent = _terminal_vm; // the server root?? username?? FUCK!!! XXX TODO !!!!!!!!!!!!
                          // the parent should be our username - REATTACH PARENT when authenticated!!
_sys_vm.uri = _sys_vm.parent.uri + "/"+_sys_vm.name; // rewrite THIS when authenticated...!!
                          // WARNING!!! XXX TODO will get the wrong URI when authenticated!!
_sys_vm.serID = -1; // can never be serialized
_sys_vm.childList = {}; 

_sys_vm.global.initIPCLock = true; // THIS to be flushed by security validateRequest method init
_sys_vm.global.wakeupIPCLock = true; // THIS to be flushed by a call to setSecurityState method

// BINDING part
_sys_vm.bind_dom(); // XXX not ever bind DOM???
_sys_vm.bind_om(); // bind the protected EOS object model

// TWEAKINIT part

_sys_vm.load("anarchic.jn");
_sys_vm.load("ramstore.jn");


// register it
_terminal_vm.childList["sys"] = _sys_vm;
__eos_objects["~/sys"] = _sys_vm;

_cn = 0;

ffoo = function () { _cn++; if(_cn == 4) _terminal_vm.load("terminal.jn"); }; // XXX run terminal when 4 objects initialized!

_sys_vm.onfinish = function () {
    _sys_vm.onfinish = ffoo;
    _sys_vm.evaluate("wakeupIPCLock=false;"); 
}; 


function manualRamstoreObject(oname, oparent) {
    var _vm = new Jnaric();

    _vm.name = oname;
    _vm.TypeURI = "~/sys/ramstore";
    _vm.SecurityURI = "~/sys/anarchic"; // no IPC for terminal at all
    _vm.parent = oparent; // the server root?? username?? FUCK!!! XXX TODO !!!!!!!!!!!!
                              // the parent should be our username - REATTACH PARENT when authenticated!!
    _vm.uri = _vm.parent.uri + "/"+oname; // rewrite THIS when authenticated...!!
                              // WARNING!!! XXX TODO will get the wrong URI when authenticated!!
    _vm.serID = -1; // can never be serialized
    _vm.childList = {}; 

    _vm.global.initIPCLock = true; // this will be normally unset
    _vm.global.wakeupIPCLock = true; // this will emulate like we're deserializing and will lock IPC until we explicitly unlock

    // BINDING part
    _vm.bind_dom(); // XXX not ever bind DOM???
    _vm.bind_om(); // bind the protected EOS object model

    // TWEAKINIT part

    _vm.load("anarchic.jn");
    _vm.load("ramstore.jn");
        
    oparent.childList[oname] = _vm;
    __eos_objects[_vm.uri] = _vm;
    return _vm;

}

// NOW CREATE anarchic OBJECT



_anarchic_vm = manualRamstoreObject("anarchic", _sys_vm);
_anarchic_vm.onfinish = function () {
    _anarchic_vm.onfinish = ffoo;
    _anarchic_vm.evaluate("sdata = fetchUrl('anarchic.jn');wakeupIPCLock=false;"); 
}; // WARNING!? XXX precedence test heeded here!!!!!!

// NOW CREATE ramstore OBJECT
_ramstore_vm = manualRamstoreObject("ramstore", _sys_vm);
_ramstore_vm.onfinish = function () { 
    _ramstore_vm.onfinish = ffoo;
    _ramstore_vm.evaluate("sdata = fetchUrl('ramstore.jn');wakeupIPCLock=false;"); 
}; // WARNING!? XXX precedence test heeded here!!!!!!

// create ic.jn object
_ic_vm = manualRamstoreObject("ic", _sys_vm);
_ic_vm.onfinish = function () {
    _ic_vm.onfinish = ffoo;
    _ic_vm.evaluate("sdata = fetchUrl('ic.jn');wakeupIPCLock=false;"); 
}; 







