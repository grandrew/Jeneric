// LICENSE: GPL v.3 or later (C) 2010 Andrew Gryaznov realgrandrew@gmail.com, a.gryaznov@svoyaset.ru

/*
This file is part of Jeneric operating system project (jeneric.net).

    Jeneric is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Jeneric is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Jeneric.  If not, see <http://www.gnu.org/licenses/>.
    
    Author(s): Andrew Gryaznov realgrandrew@gmail.com, a.gryaznov@svoyaset.ru
*/

/*

TODO: cache .jn files, do not load them every time! (MANIFEST?)

*/

DEBUG=0;

// parameters for STOMP connection
E_SERVER = "localhost";
E_PORT = 61613;
HUB_PATH = "/hub";
ANNOUNCE_PATH = "/announce";
RQ_RESEND_INTERVAL = 4000; // milliseconds to wait before request send retries
ACK_TIMEOUT = 70000; // milliseconds before give up resending
MAX_WINDOW_SIZE = 60000; // ms. max window size for ACKs to remember
KEY_LENGTH = 80; // bytes stringkey length
PING_INTERVAL = 90000;
MAXFAIL_TO_RESET = 1; // failed transmits to reset STOMP connection
MAXRESEND_TO_RESET = 5; // resends to reset STOMP connection
STOMP_ERRORS_TO_RESET = 3;
STOMP_RESET_LOCK_INTERVAL = 4000; // milliseconds to lock sending till a reset
MAX_RQ_TIME = 600000; // 10 minutes maximum request time

// GENERAL INIT part
KCONFIG = {
  host: "http://"+location.host,
  autorestore: false,
  autoswapout: false
}

KCONFIG_DEFAULTS = {
  terminal_id: "~", // init as unknown, will be set later at terminal object instance
  MEMOBJECTS: 1000, // max allowed amount of objects in memory (in __eos_objects)}; // kernel configuration
  saveinterval: 10000 // interval of object serialization turnaround in ms.
  // init or 'run' defaults??
}

//////////////////////////////////////////////////////////////////////////////
// browser compatibility section; we're now dependent on these globals!
_isFF = ((navigator.product === "Gecko") && (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) );
_isIE = (navigator.userAgent.indexOf("MSIE") != -1);
_isIE8 = (navigator.userAgent.indexOf("MSIE 8") != -1);
if(window.opera && opera.postError) console = { log: opera.postError };
function fake () {}

//////////////////////////////////////////////////////////////////////////////
// JENERIC INIT

function jeneric_init(elemt) {
    //////////////////////////////////////////////////////////////////////////////
    // terminal & system objects init section

    _terminal_vm = new Jnaric();

    _terminal_vm.name = "~"; // "terminal"+(new Date()).getTime(); // TODO! get real terminal name!!! (somehow??)
    _terminal_vm.TypeURI = ""; // no real tURI
    _terminal_vm.SecurityURI = "~/security/terminal"; 
    _terminal_vm.parent = {serID: 0, uri: "/"}; // only for serialization
    _terminal_vm.uri = "~";//_terminal_vm.parent + "/"+name;
    _terminal_vm.serID = -1; // set to real value, if exists
    _terminal_vm.childList = {}; // init the CL later

    _terminal_vm.global.initIPCLock = new _terminal_vm.global.Lock(); // THIS to be flushed by security validateRequest method init
    _terminal_vm.global.initIPCLock.goflag = 0; // set the lock
    _terminal_vm.global.wakeupIPCLock = new _terminal_vm.global.Lock(); 


 
    var d = new DOMImplementation(); // SLOW??
    ddocument = d.loadXML("<div/>"); // SLOW???
    _dmb = ddocument.documentElement;
    //_dmb = new __HTMLElement(_terminal_vm, "DIV" );
    _dmb.___link.style.width = "100%";
    elemt.appendChild(_dmb.___link);

    _terminal_vm.bind_dom(_dmb); // TODO bind to fake DOM element since it is currently impossible to serialize DOM-enabled elements
    _terminal_vm.bind_om(); // bind the protected EOS object model
    _terminal_vm.bind_terminal();


    // TWEAKINIT part

    //_terminal_vm.load("os/anarchic.jn");
    _terminal_vm.load("os/st.jn");


    // write the object!
    __eos_objects["terminal"] = _terminal_vm; // conventional... get rid of this later XXX
    __eos_objects["~"] = _terminal_vm;

    _cn = 0;
    /////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////// THE tweak part here
    INITOBS = 0; // will auto-tune depending on amount of objects requested to load
    ffoo = function () { 
        _cn++; 
        if(_cn == INITOBS) { // see below
            _terminal_vm.load("os/terminal.jn"); 
            hubConnection.connect();
        }
    }; 

    
    
    var init_objects = [
        {name: "sys", parentURI: "~", security: "os/readonly.jn" }, 
        // XXX anarchic should be removed on production
        {name: "anarchic", parentURI: "~/sys", contenturl: "os/anarchic.jn", security: "os/readonly.jn" },
        {name: "security", parentURI: "~", typeurl: "os/ramstore.jn", security: "os/st.jn" }, // security folder SHOULD be serializable!
        //{name: "insecure", parentURI: "~", typeurl: "os/ramstore.jn", security: "os/st.jn" }, // should be made serializeable too!
        
        // TODO: if object does not exist!
        {name: "terminal", parentURI: "~/security", contenturl: "os/st.jn", security: "os/readonly.jn" },
        {name: "ACL", parentURI: "~/security", typeurl: "os/st_acl.jn", typeuri: "~/security/acltype", security: "os/st.jn" }, 
        {name: "acltype", parentURI: "~/security", contenturl: "os/st_acl.jn", security: "os/readonly.jn" },
        
        {name: "ramstore", parentURI: "~/sys", contenturl: "os/ramstore.jn", security: "os/readonly.jn" },
        {name: "tmpstore", parentURI: "~/sys", contenturl: "os/tmpstore.jn", security: "os/readonly.jn" },
        //{name: "public", parentURI: "~/sys", url: "os/public.jn" },
        
        {name: "ic", parentURI: "~/sys", contenturl: "os/ic.jn", security: "os/readonly.jn" },
        {name: "init", parentURI: "~/sys", contenturl: "os/totinit.jn", security: "os/readonly.jn" }
    ];
    
    for(var ix=0; ix < init_objects.length; ix++) {
        nvm = manualRamstoreObject(init_objects[ix].name, __eos_objects[init_objects[ix].parentURI], init_objects[ix].typeurl, init_objects[ix].security);
        if(init_objects[ix].typeuri) nvm.TypeURI=init_objects[ix].typeuri;
        
        (function () {
            var n = nvm;
            if(init_objects[ix].contenturl) {
                var s = init_objects[ix].contenturl;
                if(window.BUNDLED_FILES && BUNDLED_FILES[init_objects[ix].contenturl]) {
                    n.global.sdata = BUNDLED_FILES[init_objects[ix].contenturl];
                    n.onfinish = function () {
                        n.onfinish = ffoo;
                        n.evaluate("wakeupIPCLock.release();"); 
                    }; 
                } else {
                    n.onfinish = function () {
                        n.onfinish = ffoo;
                        n.evaluate("sdata = fetchUrl2('"+s+"');wakeupIPCLock.release();"); 
                    }; 
                }
            } else {
                n.onfinish = function () {
                    n.onfinish = ffoo;
                    n.evaluate("wakeupIPCLock.release();"); 
                }; 
            }
        })();
        INITOBS++;
        
    }
    
    // now set security states...
    __eos_objects["~"].security.state = { ipcIn: {"hubConnectionChanged":[""]} };



    _stor = getFixedStorage();
    if(_stor) {
        // if fixed storage is accessible

        
        // XXX WARNING! this is a trick for a predefined security!
        var d = _stor.getByURI("~/security");
        if(d) {
          var ncl = JSON.parse(d.ChildList);
          for(var ob in ncl) {
            delete __eos_objects["~/security/"+ob]; // make sure to clean out auto-created object equivalents!
          }
          
          __eos_objects["~/security"].ErrorConsole.log("restoring ~/security childList...");
          for(var obc in ncl) {
            __eos_objects["~/security"].childList[obc] = ncl[obc];
          }
          __eos_objects["~/security"].serID = parseInt(d.rowid);
        } else {
            __eos_serial_weak.push(__eos_objects["~/security"]);
        }
        

        d = _stor.getByURI("~");        
        if(d) {
          _terminal_vm.ErrorConsole.log("restoring ~ childList...");
          // MERGE instead of RESTORE
          var termcl = JSON.parse(d.ChildList);
          /*
          for(var ob in termcl) {
            if(ob != "security") delete __eos_objects["~/"+ob]; // make sure to clean out auto-created object equivalents!
          }
          */
          for(var obc in termcl) {
              _terminal_vm.childList[obc] = termcl[obc];
          }
          _terminal_vm.serID = parseInt(d.rowid); // ok.
          // now restore security state, if any
          if(d.SecurityProp && d.SecurityProp.length > 0) {
            _terminal_vm.onfinish = function () {
                try {
                    __eos_objects["~"].execf_thread(__eos_objects["~"].security.setSecurityState, [JSON.parse(d.SecurityProp)], fake, fake, undefined,__eos_objects["~"].security);
                } catch (e) {
                    if(window.console) console.log("ERROR restoring security state of terminal object: "+e);
                    _EEE = e;
                }
            };
          }

        } else {
            __eos_serial_weak.push(_terminal_vm); // 
        }
        _stor.close();
    }
    delete d;
    delete _stor;

    // parse kernel parameters, use terminal_id and terminal_key as logon credentials
    // DOC this!
    (function () {
    var params = location.href.toString().split('#')[1];
    var nv;
    if(params) {
        var lp = params.split(",");
        for(var i=0; i<lp.length; i++) {
            if(lp[i].search("=") > -1) {
                nv = lp[i].split("=");
                if(!KCONFIG[nv[0]])KCONFIG[nv[0]] = nv[1];
            }
        }
    }
    // nof fill in defaults
    for(dob in KCONFIG_DEFAULTS) {
        if(!KCONFIG[dob])KCONFIG[dob] = KCONFIG_DEFAULTS[dob];
    }
    })()
    
    // start the pinger
    setInterval((function() {
        if((new Date()).getTime() - hubConnection.last_sent_time > PING_INTERVAL ) {
            try {
                hubConnection.send({id: __jn_stacks.newId(), terminal_id:KCONFIG["terminal_id"], uri: "/", method: "ping", args: []});
            } catch (e) {
                // never stop... HTID!
            }
        }
    }), PING_INTERVAL/2);

    hubConnection.init();
    hubConnection.receive = eos_rcvEvent; // XXX this interconnects with jsobject.js in an ugly way...

    
}








///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////


function manualRamstoreObject(oname, oparent, typeurl, security) {
    var _vm = new Jnaric();

    _vm.name = oname;
    _vm.TypeURI = "~/sys/ramstore";
    //_vm.SecurityURI = "~/sys/anarchic"; 
    _vm.SecurityURI = "~/security/terminal"; 
    _vm.parent = oparent; 
                              
    _vm.uri = _vm.parent.uri + "/"+oname; 
                          
    _vm.serID = -1; // can never be serialized
    _vm.childList = {}; 

    _vm.global.initIPCLock = new _vm.global.Lock(); // THIS to be flushed by security validateRequest method init
    _vm.global.initIPCLock.goflag = 0; // set the lock
    _vm.global.wakeupIPCLock = new _vm.global.Lock(); 
    _vm.global.wakeupIPCLock.goflag = 0; // set the lock

    // BINDING part
    _vm.bind_dom(); // XXX not ever bind DOM???
    _vm.bind_om(); // bind the protected EOS object model
    _vm.global.fetchUrl2 = _vm.global.fetchUrl; // cheating for trusted code....

    // TWEAKINIT part

    //_vm.load("os/anarchic.jn");
    
    if(security) _vm.load(security);
    else _vm.load("os/readonly.jn");
    
    if(typeurl) _vm.load(typeurl);
    else _vm.load("os/tmpstore.jn"); // XXX THIS IS CHEATING!!!
        
    oparent.childList[oname] = _vm;
    __eos_objects[_vm.uri] = _vm;
    return _vm;

}



function randomString( string_length ) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}


function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

// do announce with new credentials if the hubConnectionChanged hook is received
//       this is rather a terminal issue!
hubConnection = {
    receive: null, // to be set by jsobject
    fresh: true,
    ___SESSIONKEY: (readCookie("session") ? readCookie("session") : randomString(KEY_LENGTH)),
    stomp: new STOMPClient(),
    rqe: {},
    acks: {},
    last_sent_time: 0,
    last_ack: (new Date()).getTime(),
    fail_count: 0,
    resend_count: 0,
    stomperror_count: 0,
    send_lock: true,
    announce: function () {
        // TODO: announce ourself with credentials so server says we're the one we need
        //       i.e. send terminal authentication data
        // do announce only when connected!
        
        var ann = { "session": this.___SESSIONKEY };
        if(KCONFIG.terminal_id && KCONFIG.terminal_key) { // TODO document this!
            ann.terminal_id = KCONFIG.terminal_id;
            ann.terminal_key = KCONFIG.terminal_key;
        }
        if(window.console) console.log("announcing... "+ann.terminal_id);
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
            hubConnection.stomperror_count = 0;
            if(hubConnection.send_lock) {
                hubConnection.send_lock = false;
                hubConnection.send_real();
            }
            // set session key cookie 
            createCookie("session", hubConnection.___SESSIONKEY);
            
        };
        
        var self = this;

        this.stomp.onmessageframe = function(frame) {

                        
            // now decode body
            var blobCount = {n:0};
            var rqh = {};

            var reviver = function (key, value) {
                return blob_parse(key, value, blobCount, rqh);
            };
            
            if(DEBUG) console.log("Input!: "+frame.body);
            
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
                // and resend pending requests
                hubConnection.send_real(true); // force
                return;           
            }

            // send ack that we've received the stuff
            if(! self.ack_snd(rq.id)) return; // means we've already processed

            // now pass further
            
            // TODO Blob: do not receive if we are waiting for blob; in case of receipt failure
            //     we should send a notification of that
            if(blobCount.n == 0) {
                self.receive(rq);
                if(DEBUG && window.console) console.log(frame.body)
            } else {
                if(window.console) {
                    console.log("Delayed blob receipt:");
                    console.log(frame.body)
                }
            }
        };

    },
    
    lock_release: function () {
        if(!hubConnection.send_lock) return;
        hubConnection.send_lock = false;
        hubConnection.send_real();
    },
    
    safe_reset: function () {
        this.stomp.reset();
        this.send_lock = true;
        clearTimeout(this.locktm);
        this.locktm=setTimeout(hubConnection.lock_release, STOMP_RESET_LOCK_INTERVAL);
    },
    
    connect: function () {
        if(window.console) console.log("starting HUB connection...");
        this.stomp.connect(E_SERVER, E_PORT, "eos", "eos"); 
    },
    
    send: function (rq) {
        rq.terminal_id = KCONFIG.terminal_id; // set before send...
        this.rqe[rq.id] = {r: rq, t: (new Date()).getTime()};
        if(this.send_lock) return;
        this.send_real();
    },
    
    send_real: function (force) {
        var ct = (new Date()).getTime();
        if ( (ct - this.last_ack) > PING_INTERVAL*1.5) {
            if(DEBUG && window.console) console.log("Resetting STOMP due to last_ack hit");
            this.last_ack = ct;
            //this.stomp.reset();
            this.safe_reset();
        }
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
                this.fail_count += 1;
                if(this.fail_count >= MAXFAIL_TO_RESET) {
                    if(DEBUG && window.console) console.log("Resetting STOMP due to fail_count hit");
                    //this.stomp.reset();
                    this.safe_reset();
                    this.fail_count = 0;
                }

                delete this.rqe[i]; // XXX TODO how will it interact with property-iteration?
                
            } else if (this.rqe[i]["r"].timeout < 100) {
                delete this.rqe[i]; // drop silently due to explicit timeout
            } else {
                if(!force && this.rqe[i]["last_resend"] && ((ct - this.rqe[i]["last_resend"]) < RQ_RESEND_INTERVAL)) continue;
                // tick timeout
                if( this.rqe[i]["r"].timeout ) {
                    if("last_resend" in this.rqe[i]) {
                        this.rqe[i]["r"].timeout = this.rqe[i]["r"].timeout - ((ct - this.rqe[i]["t"]) - (this.rqe[i].last_resend - this.rqe[i]["t"]));
                    } else {
                        this.rqe[i]["r"].timeout = this.rqe[i]["r"].timeout -  (ct - this.rqe[i]["t"]);
                    }
                }
                this.rqe[i]["last_resend"] = ct;
                if(!this.rqe[i]["resend_count"]) this.rqe[i]["resend_count"] = 1;
                else this.rqe[i]["resend_count"] += 1;
                //this.resend_count += this.rqe[i]["resend_count"];
                //if(this.resend_count > MAXRESEND_TO_RESET) {
                if(this.rqe[i]["resend_count"] >= MAXRESEND_TO_RESET) {
                    if(DEBUG && window.console) console.log("Resetting STOMP due to resend_count hit");
                    for(var orr in this.rqe) {
                      this.rqe[orr]["resend_count"] = 0;
                    }
                    this.rqe[i]["resend_count"] = 0; // not needed
                    //this.stomp.reset();
                    this.safe_reset();
                }
                
                this.rqe[i]["r"].session = this.___SESSIONKEY;
                var rqq = this.rqe[i]["r"];
                //      XXX check how will blob send fail behave!!
                
                
                
                var replacer = function(key, value) {
                    return blob_replacer(key, value, rqq);
                };
                
                
                
                try {
                    //this.stomp.send(JSON.stringify(this.rqe[i]["r"], replacer), HUB_PATH);
                    var jsn = JSON.stringify(this.rqe[i]["r"], replacer);
                    if(DEBUG && window.console) {
                        console.log("Sending "+jsn);
                        //AAA_json = this.rqe[i]["r"];
                    }
                    
                    //if(window.console) console.log("Sending "+jsn);
                } catch (e) {
                    this.rqe[i]["r"]["status"] = "EEXCP"; // DOC document this too
                    this.rqe[i]["r"]["result"] = "Could not parse JSON to send: "+e; // DOC document this too
                    this.receive(this.rqe[i]["r"]);
                    delete this.rqe[i]; // XXX TODO how will it interact with property-iteration?
                    if(window.console) console.log("Error! Could not parse JSON to send: "+e);
                }
                try {
                    this.stomp.send(jsn, HUB_PATH);
                    this.last_sent_time = (new Date()).getTime();
                } catch (e) {
                    // try again later
                    //hubConnection.connect(); // hope this works
                    if(window.console) console.log("STOMP SEND Error occured: "+e);
                    if(this.stomperror_count >= STOMP_ERRORS_TO_RESET) {
                      if(window.console) console.log("Resetting connection due to STOMP_ERRORS_TO_RESET hit");
                      //hubConnection.stomp.reset(); 
                      hubConnection.safe_reset();
                      this.stomperror_count=0;
                    }
                    else this.stomperror_count++;
                }
            }
        }
        // cleanup ACKs window
        
        for(var i in this.acks) {
            //if(i == "__defineProperty__") continue; // XXX FUCK!!
            if((ct - this.acks[i]) > MAX_WINDOW_SIZE) {
                delete this.acks[i];
            }
        }
    },
    
    ack_rcv: function (rqid) {
        this.fail_count = 0;
        this.resend_count = 0;
        this.last_ack = (new Date()).getTime();
        if(DEBUG && window.console) console.log("ack!");
        delete this.rqe[rqid];
    },
    
    ack_snd: function (rqid) {
        var t = true;
        if(rqid in this.acks) t = false;
        this.acks[rqid] = (new Date()).getTime(); // XXX make sure the local rqID and response (HUB ones) namespaces never get intersected
        if(DEBUG && window.console) console.log("sending ack");
        this.stomp.send(JSON.stringify({ack: rqid}), HUB_PATH, {ack: rqid});
        return t;
    },
    
    abort: function (rqid){
        delete this.rqe[rqid];
    }
};


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
        if(value.hasOwnProperty("wrappedString")) {
            sendWrappedBlob(blobID, value, req); // TEST IT
        }
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
    console.log("wrappedBlob working");
    // TODO: notifications of send error
    // dr.onload = ...;
    dr.onfail = function (status, txt) {
        req["status"] = "ECONN"; // DOC document this too
        req["result"] = "blob send failed with status "+status; // DOC document this too
        hubConnection.receive(req);
    
        if(window.console) console.log("wrappedBlob send failure for request "+req.id+" with status "+status);
    };
    // console.log("wrappedBlob sending string: '"+blob.wrappedString+"'");
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
    dr.addArg(_GET, "blob_session", hubConnection.___SESSIONKEY);
    dr.addArg(_GET, "blobid", bid);
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


