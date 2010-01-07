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

TODO: cache .jn files, do not load them every time!

*/

DEBUG=0;

// parameters for STOMP connection
E_SERVER = "localhost";
E_PORT = 61613;
HUB_PATH = "/hub";
ANNOUNCE_PATH = "/announce";
RQ_RESEND_INTERVAL = 10000; // milliseconds to wait before request send retries
ACK_TIMEOUT = 60000; // milliseconds before give up resending
MAX_WINDOW_SIZE = 60000; // ms. max window size for ACKs to remember
KEY_LENGTH = 80; // bytes stringkey length
PING_INTERVAL = 90000;
// GENERAL INIT part
KCONFIG = {
  terminal_id: "~", // init as unknown, will be set later at terminal object instance
  autorestore: false,
  autoswapout: false,
  MEMOBJECTS: 1000, // max allowed amount of objects in memory (in __eos_objects)}; // kernel configuration
  saveinterval: 10000 // interval of object serialization turnaround in ms.
}

_terminal_vm = new Jnaric();

_terminal_vm.name = "~"; // "terminal"+(new Date()).getTime(); // TODO! get real terminal name!!! (somehow??)
_terminal_vm.TypeURI = "terminal"; // no real tURI
_terminal_vm.SecurityURI = "terminal"; 
_terminal_vm.parent = {serID: 0, uri: "/"}; // only for serialization
_terminal_vm.uri = "~";//_terminal_vm.parent + "/"+name;
_terminal_vm.serID = -1; // set to real value, if exists
_terminal_vm.childList = {}; // init the CL later

//_terminal_vm.global.initIPCLock = true; // THIS to be flushed by security validateRequest method init
//_terminal_vm.global.wakeupIPCLock = false; 
_terminal_vm.global.initIPCLock = new _terminal_vm.global.Lock(); // THIS to be flushed by security validateRequest method init
_terminal_vm.global.initIPCLock.goflag = 0; // set the lock
_terminal_vm.global.wakeupIPCLock = new _terminal_vm.global.Lock(); 


// BINDING part
//var dmb = document.createElement("DIV");
//dmb.style.width = "100%";
//document.body.appendChild(dmb);

var d = new DOMImplementation(); // SLOW??
ddocument = d.loadXML("<div/>"); // SLOW???
_dmb = ddocument.documentElement;
//_dmb = new __HTMLElement(_terminal_vm, "DIV" );
_dmb.___link.style.width = "100%";
document.body.appendChild(_dmb.___link);

_terminal_vm.bind_dom(_dmb); // TODO bind to fake DOM element since it is currently impossible to serialize DOM-enabled elements
_terminal_vm.bind_om(); // bind the protected EOS object model
_terminal_vm.bind_terminal();


// TWEAKINIT part

_terminal_vm.load("os/anarchic.jn");



// write the object!
__eos_objects["terminal"] = _terminal_vm; // conventional... get rid of this later XXX
__eos_objects["~"] = _terminal_vm;


// NOW CREATE SYS OBJECT

_sys_vm = new Jnaric();

_sys_vm.name = "sys";
_sys_vm.TypeURI = "~/sys/ramstore";
_sys_vm.SecurityURI = "~/sys/anarchic"; // no IPC for terminal at all
_sys_vm.parent = _terminal_vm; 
                          
_sys_vm.uri = _sys_vm.parent.uri + "/"+_sys_vm.name; 
                         
_sys_vm.serID = -1; // can never be serialized
_sys_vm.childList = {}; 

//_sys_vm.global.initIPCLock = true; // THIS to be flushed by security validateRequest method init
//_sys_vm.global.wakeupIPCLock = true; // THIS to be flushed by a call to setSecurityState method
_sys_vm.global.initIPCLock = new _sys_vm.global.Lock(); // THIS to be flushed by security validateRequest method init
_sys_vm.global.initIPCLock.goflag = 0; // set the lock
_sys_vm.global.wakeupIPCLock = new _sys_vm.global.Lock(); 
_sys_vm.global.wakeupIPCLock.goflag = 0; // set the lock

// BINDING part
_sys_vm.bind_dom(); // XXX not ever bind DOM???
_sys_vm.bind_om(); // bind the protected EOS object model

// TWEAKINIT part

_sys_vm.load("os/anarchic.jn");
_sys_vm.load("os/tmpstore.jn"); // XXX CHEATING!


// register it
_terminal_vm.childList["sys"] = _sys_vm;
__eos_objects["~/sys"] = _sys_vm;


_cn = 0;
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// THE tweak part here
ffoo = function () { 
    _cn++; 
    if(_cn == 6) { // XXX run terminal when 5 objects initialized!
        _terminal_vm.load("os/terminal.jn"); 
        hubConnection.connect();
    }
}; 

_sys_vm.onfinish = function () {
    _sys_vm.onfinish = ffoo;
    _sys_vm.evaluate("wakeupIPCLock.release();"); 
}; 


function manualRamstoreObject(oname, oparent) {
    var _vm = new Jnaric();

    _vm.name = oname;
    _vm.TypeURI = "~/sys/ramstore";
    _vm.SecurityURI = "~/sys/anarchic"; // no IPC for terminal at all
    _vm.parent = oparent; 
                              
    _vm.uri = _vm.parent.uri + "/"+oname; 
                          
    _vm.serID = -1; // can never be serialized
    _vm.childList = {}; 

//    _vm.global.initIPCLock = true; // this will be normally unset
//    _vm.global.wakeupIPCLock = true; // this will emulate like we're deserializing and will lock IPC until we explicitly unlock

    _vm.global.initIPCLock = new _vm.global.Lock(); // THIS to be flushed by security validateRequest method init
    _vm.global.initIPCLock.goflag = 0; // set the lock
    _vm.global.wakeupIPCLock = new _vm.global.Lock(); 
    _vm.global.wakeupIPCLock.goflag = 0; // set the lock

    // BINDING part
    _vm.bind_dom(); // XXX not ever bind DOM???
    _vm.bind_om(); // bind the protected EOS object model

    // TWEAKINIT part

    _vm.load("os/anarchic.jn");
    _vm.load("os/tmpstore.jn"); // XXX THIS IS CHEATING!!!
        
    oparent.childList[oname] = _vm;
    __eos_objects[_vm.uri] = _vm;
    return _vm;

}

// NOW CREATE anarchic OBJECT


// TODO: beautify it ;-)
//       1. create a struct {objname: url,} 2. use object count or length in THE tweak part
_anarchic_vm = manualRamstoreObject("anarchic", _sys_vm);
_anarchic_vm.onfinish = function () {
    _anarchic_vm.onfinish = ffoo;
//    _anarchic_vm.evaluate("sdata = fetchUrl('anarchic.jn');wakeupIPCLock=false;");
    _anarchic_vm.evaluate("sdata = fetchUrl('os/anarchic.jn');wakeupIPCLock.release();");  
}; // WARNING!? XXX precedence test heeded here!!!!!!

// NOW CREATE ramstore OBJECT
_ramstore_vm = manualRamstoreObject("ramstore", _sys_vm);
_ramstore_vm.onfinish = function () { 
    _ramstore_vm.onfinish = ffoo;
    _ramstore_vm.evaluate("sdata = fetchUrl('os/ramstore.jn');wakeupIPCLock.release();"); 
}; // WARNING!? XXX precedence test heeded here!!!!!!

// NOW CREATE public security model OBJECT
_public_vm = manualRamstoreObject("public", _sys_vm);
_public_vm.onfinish = function () { 
    _public_vm.onfinish = ffoo;
    _public_vm.evaluate("sdata = fetchUrl('os/public.jn');wakeupIPCLock.release();"); 
}; 


// create ic.jn object
_ic_vm = manualRamstoreObject("ic", _sys_vm);
_ic_vm.onfinish = function () {
    _ic_vm.onfinish = ffoo;
    _ic_vm.evaluate("sdata = fetchUrl('os/ic.jn');wakeupIPCLock.release();"); 
}; 

// create totinit.jn object
_init_vm = manualRamstoreObject("init", _sys_vm);
_init_vm.onfinish = function () {
    _init_vm.onfinish = ffoo;
    _init_vm.evaluate("sdata = fetchUrl('os/totinit.jn');wakeupIPCLock.release();"); 
}; 








////////////////////////////////////////////////////////////////////////////////////
// okay, now deserialize 'var' ramstore object and its childlist!

var _var_vm = new Jnaric();

_var_vm.name = "var";
_var_vm.TypeURI = "~/sys/ramstore";
_var_vm.SecurityURI = "~/sys/anarchic"; // no IPC for terminal at all
_var_vm.parent = _terminal_vm; 
                          
_var_vm.uri = _var_vm.parent.uri + "/var"; 
                      
_var_vm.serID = -1; // can never be serialized
_var_vm.childList = {}; 

//_var_vm.global.initIPCLock = true; // this will be normally unset
//_var_vm.global.wakeupIPCLock = true; // this will emulate like we're deserializing and will lock IPC until we explicitly unlock

_var_vm.global.initIPCLock = new _var_vm.global.Lock(); // THIS to be flushed by security validateRequest method init
_var_vm.global.initIPCLock.goflag = 0; // set the lock
_var_vm.global.wakeupIPCLock = new _var_vm.global.Lock(); 
_var_vm.global.wakeupIPCLock.goflag = 0; // set the lock


// BINDING part
_var_vm.bind_dom(); // XXX not ever bind DOM???
_var_vm.bind_om(); // bind the protected EOS object model

// TWEAKINIT part

_var_vm.load("os/anarchic.jn");
_var_vm.load("os/ramstore.jn");
    
_terminal_vm.childList["var"] = _var_vm;
__eos_objects[_var_vm.uri] = _var_vm;

_var_vm.onfinish = function () {
    _var_vm.onfinish = ffoo;
    _var_vm.evaluate("wakeupIPCLock.release();"); 
}; 


_stor = getFixedStorage();
if(_stor) {
    // if fixed storage is accessible
    var d = _stor.getByURI("~/var");
    if(d) {
      _var_vm.ErrorConsole.log("restoring ~/var childList...");
      _var_vm.childList = JSON.parse(d.ChildList);
      _var_vm.serID = parseInt(d.rowid);
    }
    d = _stor.getByURI("~");
    if(d) {
      _terminal_vm.ErrorConsole.log("restoring ~ childList...");
      // MERGE instead of RESTORE
      var termcl = JSON.parse(d.ChildList);
      for(var obc in termcl) {
          _terminal_vm.childList[obc] = termcl[obc];
      }
      _terminal_vm.serID = parseInt(d.rowid); // ok.

    } else {
        __eos_serial_weak.push(_terminal_vm); // 
    }
    _stor.close();
}
delete d;
delete _stor;









///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////


function randomString( string_length ) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

// TODO: parse kernel parameters, use terminal_id and terminal_key as logon credentials
(function () {
var params = location.href.toString().split('#')[1];
var nv;
if(params) {
    var lp = params.split(",");
    for(var i=0; i<lp.length; i++) {
        if(lp[i].search("=") > -1) {
            nv = lp[i].split("=");
            KCONFIG[nv[0]] = nv[1];
        }
    }
}
})()

// do announce with new credentials if the hubConnectionChanged hook is received
//       this is rather a terminal issue!
hubConnection = {
    receive: null, // to be set by jsobject
    fresh: true,
    ___SESSIONKEY: randomString(KEY_LENGTH),
    stomp: new STOMPClient(),
    rqe: {},
    acks: {},
    last_sent_time: 0,
    announce: function () {
        // TODO: announce ourself with credentials so server says we're the one we need
        //       i.e. send terminal authentication data
        // do announce only when connected!
        if(window.console) console.log("announcing...");
        var ann = { "session": this.___SESSIONKEY };
        if(KCONFIG.terminal_id && KCONFIG.terminal_key) { // TODO document this!
            ann.terminal_id = KCONFIG.terminal_id;
            ann.terminal_key = KCONFIG.terminal_key;
        }
        this.stomp.send(JSON.stringify(ann), ANNOUNCE_PATH); // we will receive our terminal_id back!
    },
    
    init: function () {
    
        this.stomp.onopen = function() {
        };

        this.stomp.onclose = function(c) { 
            // TODO: notify terminal of events
            setTimeout( (function () { hubConnection.connect(); }), 2000);
            if(window.console) console.log('Lost Connection, Code: ' + c); // TODO: log to terminal?
        };

        this.stomp.onerror = function(error) {
            if(window.console) console.log("Error: " + error);
        };

        this.stomp.onerrorframe = function(frame) {
            if(window.console) console.log("Errorframe: " + frame.body);
        };

        this.stomp.onconnectedframe = function() {
            // TODO: notify terminal of events
            if(hubConnection.fresh) {
                
                hubConnection.fresh = false;
                hubConnection.announce(); // XXX we dont need to announce each time we reconnect. This should be a transparent process
            }
            
            var hr = function () {
                hubConnection.send_real();
            };
            
            hubConnection.stomp.subscribe(hubConnection.___SESSIONKEY);
            
            clearInterval(hubConnection.si);
            hubConnection.si = setInterval(hr, RQ_RESEND_INTERVAL); 
            
        };
        
        var self = this;

        this.stomp.onmessageframe = function(frame) {
            // here to receive the messages. 
            // take care of 'session lost' errors!
            /*
            // in fact, headers do not work in Orbited in this configureation 
            if(frame.headers.error && frame.headers.error == "NOSESSION") {
                hubConnection.announce();
                return;
            }
            */
            // now receive ack
            /*
            if(frame.headers.ack) {
                self.ack_rcv(frame.headers.ack);
                return;
            }
            */
                        
            // now decode body
            var blobCount = {n:0};
            var rqh = {};

            var reviver = function (key, value) {
                return blob_parse(key, value, blobCount, rqh);
            };
            
            //console.log("Input!: frame.body");
            
            //var rq = JSON.parse(frame.body, reviver);

            try {
                var rq = JSON.parse(frame.body, reviver);
                //var rq = JSON.parse(frame.body);
                // TODO: Blob retrieval delay goes here
            } catch (e) {
                if(window.console) console.log("Invalid JSON data received: "+frame.body+ "; producing error: "+e+":"+e.message+"  "+e.lineNumber);
                return;
            }
            
            rqh.rq = rq;
            
            if(rq.ack) {
                self.ack_rcv(rq.ack);
                return;
            }
            
            if(rq.error && rq.error == "NOSESSION") {
                if(window.console) console.log("no session, doing announce");
                hubConnection.announce();
                return;           
            }

            // send ack that we've received the stuff
            if(! self.ack_snd(rq.id)) return; // means we've already processed

            // now pass further
            
            // TODO Blob: do not receive if we are waiting for blob; in case of receipt failure
            //     we should send a notification of that
            if(blobCount.n == 0) {
                self.receive(rq);
                if(window.console) console.log(frame.body)
            } else {
                if(window.console) {
                    console.log("Delayed blob receipt:");
                    console.log(frame.body)
                }
            }
        };

    },
    
    connect: function () {
        if(window.console) console.log("starting HUB connection...");
        this.stomp.connect(E_SERVER, E_PORT, "eos", "eos"); 
    },
    
    send: function (rq) {
        this.rqe[rq.id] = {r: rq, t: (new Date()).getTime()};
        this.send_real();
    },
    
    send_real: function () {
        var ct = (new Date()).getTime();
        for(var i in this.rqe) {
            //if(i == "__defineProperty__") continue; // XXX FUCK!!
            
            if(ct - this.rqe[i]["t"] > ACK_TIMEOUT) {
                // XXX only for requests??
                
                if ("response" in this.rqe[i]["r"]) {
                    // do nothing??? we just failed to send resp
                    // TODO: decide on what to do if we cannot send responses!!
                    // TODO: log something!
                } else { // request failed
                    // notify silently
                    this.rqe[i]["r"]["status"] = "ECONN"; // DOC document this too
                    this.rqe[i]["r"]["result"] = "Too much resend to HUB fails. Giving up."; // DOC document this too
                    this.receive(this.rqe[i]["r"]); 
                }

                delete this.rqe[i]; // XXX TODO how will it interact with property-iteration?
                
            } else {
                this.rqe[i]["r"].session = this.___SESSIONKEY;
                var rqq = this.rqe[i]["r"];
                // TODO: Blob send goes here
                //      XXX check how will blob send fail behave!!
                var replacer = function(key, value) {
                    return blob_replacer(key, value, rqq);
                };
                
                
                
                try {
                    //this.stomp.send(JSON.stringify(this.rqe[i]["r"], replacer), HUB_PATH);
                    var jsn = JSON.stringify(this.rqe[i]["r"], replacer);
                    this.stomp.send(jsn, HUB_PATH);
                    this.last_sent_time = (new Date()).getTime();
                } catch (e) {

                    this.rqe[i]["r"]["status"] = "EEXCP"; // DOC document this too
                    this.rqe[i]["r"]["result"] = "Could not parse JSON to send: "+e; // DOC document this too
                    this.receive(this.rqe[i]["r"]);
                    delete this.rqe[i]; // XXX TODO how will it interact with property-iteration?
                    if(window.console) console.log("STOMP SEND Error occured: "+e);
                }
            }
        }
        // cleanup ACKs window
        
        for(var i in this.acks) {
            //if(i == "__defineProperty__") continue; // XXX FUCK!!
            if(ct - this.acks[i] > MAX_WINDOW_SIZE) {
                delete this.acks[i];
            }
        }
    },
    
    ack_rcv: function (rqid) {
        if(window.console) console.log("ack!");
        delete this.rqe[rqid];
    },
    
    ack_snd: function (rqid) {
        var t = true;
        if(rqid in this.acks) t = false;
        this.acks[rqid] = (new Date()).getTime(); // XXX make sure the local rqID and response (HUB ones) namespaces never get intersected
        if(window.console) console.log("sending ack");
        this.stomp.send(JSON.stringify({ack: rqid}), HUB_PATH, {ack: rqid});
        return t;
    },
    
    abort: function (rqid){
        delete this.rqe[rqid];
    }
};

// start the pinger
setInterval((function() {
    if((new Date()).getTime() - hubConnection.last_sent_time > PING_INTERVAL ) hubConnection.send({id: __jn_stacks.newId(), uri: "/", method: "ping", args: []});
}), PING_INTERVAL/2);

hubConnection.init();
hubConnection.receive = eos_rcvEvent; // XXX this interconnects with jsobject.js in an ugly way...

////////////////////////////////////////////////////////////////////////////////////
// Blob transfer methods


/*
// TODO TODO TODO HERE:
- handle different blob transfer failure scenarios:
    + hub sent back exception for json (Blob likely to be transferred, delete it from server. Mb. timeout?)
    + timeout waiting for Blob to arrive to hub (may be a huge transfer?)
    + all the send/rcv errors - check readyState, fail statuses, etc.
    - ack/send retries? LATER
    + hub: drop open blob/get connections via some timeout
    
    -------------------------
    + HUB: introudece timeouts: for BLOBs; for wait-connections
    
+ add blobBuilder interface to bind_om
- add localServer Blob storage interface (and serialize the list of stored data?? -> or leave it to developer?)
    no! we need it at least to delete an object preperly

*/


// very tightly connected with jsobject.js for Gears Blobs
function blob_replacer(key, value, req) {
    
    if (value && value.getBytes && value.toString() == "[object GearsBlob]") {
        // now, check if we are a native Blob or a wrapped UUstring
        
        // add object to BlobSender and send separately
        // return blob-representation object
        // XXX assume we HAVE gears installed if we encounter GearsBlob here!

        var blobID = "Blob("+key+"."+randomString(10)+")";
        if(value.wrappedString) sendWrappedBlob(blobID, value, req); // TEST IT
        else sendBlob(blobID, value, req);
        return blobID;
    }
    //console.log("returning: "+value.toString());
    return value; // always return the actual value
}

function sendBlob(bid, blob, req) {
    // again,assume gears is there
    var request = google.gears.factory.create("beta.httprequest");
    request.open("POST", "/blobsend?blobid="+bid+"&blob_session="+hubConnection.___SESSIONKEY);
    //request.setRequestHeader("blob_session", hubConnection.___SESSIONKEY); // XXX ugly sessionkey get...
    //request.setRequestHeader("blobid", bid); 
    //console.log("sending BLOB of length "+blob.___blob.length);
    //AAABBB = blob.___blob;
    request.onreadystatechange = function () {
        
        if(request.readyState == 4) {
            // ok?
            if(request.status != 200) {
                // TODO: notify of error; 
                //      race conditions possible here: the request may have already been sent and ack'ed
                //      TODO: remove req_parameter/closure from here if unused!
                req["status"] = "ECONN"; // DOC document this too
                req["result"] = "blob send failed with status "+request.status; // DOC document this too
                hubConnection.receive(req);
                if(window.console) console.log("blob send failure for request "+req.id+" status "+request.status+ " msg "+request.responseText);
            } else {
                //if(window.console) console.log("BLOB SENT");        
            }
        } else {
    
        } 
    }
    request.send(blob.___blob);
}

function sendWrappedBlob(bid, blob, req) {
    var dr = new DataRequestor();
    
    // TODO: notifications of send error
    // dr.onload = ...;
    dr.onfail = function (status, txt) {
        req["status"] = "ECONN"; // DOC document this too
        req["result"] = "blob send failed with status "+status; // DOC document this too
        hubConnection.receive(req);
    
        if(window.console) console.log("wrappedBlob send failure for request "+req.id+" with status "+status);
    };
    dr.addArg(_POST, "data", blob.wrappedString);
    dr.addArg(_POST, "blob_session", hubConnection.___SESSIONKEY);
    dr.addArg(_POST, "blobid", bid);
    dr.getURL( "/base64send" );

}


function getBlob(bid, blobCount, blobObject, req) {
    // again,assume gears is there
    var request = google.gears.factory.create("beta.httprequest");
    request.open("GET", "/blobget?blobid="+bid+"&blob_session="+hubConnection.___SESSIONKEY);
    //request.setRequestHeader("blob_session", hubConnection.___SESSIONKEY); // XXX ugly sessionkey get...
    //request.setRequestHeader("blobid", bid);
    request.onreadystatechange = function () {
        if(request.readyState == 4) {
            if(request.status == 200) {
                blobObject.___blob = request.responseBlob;
                blobCount.n -= 1;
                if(blobCount.n == 0) {
                    // we got all blobs needed; proceed to rcv
                    hubConnection.receive(req.rq);
                }
            } else {
                req.rq["status"] = "ECONN"; // DOC document this too
                req.rq["result"] = "blob GET failed with status "+request.status; // DOC document this too
                delete req.rq["args"];
                hubConnection.send(req.rq);
                if(window.console) console.log("blob receive failure for request "+req.rq.id);            
            }
        } else {
            // TODO: notify of error; 
            //      race conditions possible here: the request may have already been sent and ack'ed
            //      TODO: remove req_parameter/closure from here if unused!
            //if(window.console) console.log("blob get failure for request "+req.id);
        } 
    }
    request.send();
    
}

function getWrappedBlob(bid, blobCount, blobObject, req) {
    var dr = new DataRequestor();
    
    // TODO: notifications of send error
    dr.onload = function (data, obj) {
            blobObject.wrappedString = data;
            blobCount.n -= 1;
            if(blobCount.n == 0) {
                // we got all blobs needed; proceed to rcv
                hubConnection.receive(req.rq);
            }        
    };
    
    dr.onfail = function (status, txt) {
        req.rq["status"] = "ECONN"; // DOC document this too
        req.rq["result"] = "blob send failed with status "+status; // DOC document this too
        delete req.rq["args"];
        hubConnection.send(req.rq);

        if(window.console) console.log("wrappedBlob get failure for request "+req.rq.id+" with status "+status);
    };
    dr.addArg(_POST, "blob_session", hubConnection.___SESSIONKEY);
    dr.addArg(_POST, "blobid", bid);
    dr.getURL( "/base64get" );

}


function blob_parse (key, value, blobCount, rqh) {
    var d;
    if (typeof value == 'string' &&
            value.slice(0, 5) == 'Blob(' &&
            value.slice(-1) == ')') {
        d = value.slice(5, -1).split(".");       
        // the last check
        //if (d[0] == key) { // XXX the blob should just be properly escaped!
            // now wait for Blob... (try to http/get it)
            // TODO HERE
            // callee may have no support for blobs. In this case, we should get not the Blob but
            // mime or uu-encoded text string (suitable for src substitution, for example) - but treat it as Blob object
            blobCount.n += 1;
            // now get blob
            
            var blobObject = new BlobObject(); // TODO
            
            if(window.google && google.gears) getBlob(value, blobCount, blobObject, rqh); // TODO
            else getWrappedBlob(value, blobCount, blobObject, rqh); // TODO
            return blobObject; // will replace it afterwards
                              // XXX DOC the blobObject will not nessessarily be instanceof global Blob!! this will
                              // eventually show that the Blob was received but not locally-generated
                              // in either case .toString() value should be used as well as .getBytes
        //}
    }
    return value;
}


