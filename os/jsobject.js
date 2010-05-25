// Be completely free to do what you want, create what you want, share what you want, customize, modify, invent...
// Whatever.
// Unlock your mind. jeneric. together we are free.
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

+ createChild should return status codes if the direct error occured (for example, 'duplicate name')
TODO WARNING cyclic forward may cause hang!
TODO throw exceptions if not enough arguments for createChild supplied: secURI etc.
    max_depth in terminal and in a hub (LIPC parser and WIPC parser - add response flags)
    also, hint for a hub: collect some stats? ;-)
+ remove push TRUE everywhere!! it is useless and really BAD! (as it thrashes the stack)
+ __defineProperty__ is in the childList too!!! get rid of it EVERYWHERE now!!!!
TODO standardise error reporting everywhere!!!
+T wake up only childlist, if required!
TODO response did not reach recipient(caller) in HUB and HERE! work out the issue - e.g. the caller disappeared suddenly

- HOLD() to hold down all the activity until "CONTINUE" presed (will stop the scheduler)
  (for those willing to get maximum from their machine that is being accessed or is sharing files, 
  for a period of time)
  this will be accomplished by total serialization - it will be possible to just hibernate the machine

    - readSerialized(startByte=0, length=-1) return the last serialized state of the object (or null if no one given) - or a part of it
    - restoreAsChild(name, StringOrFixedStorageRef) - restore a child from a given string or fixed storage file reference
    - getMyAbsoluteURI() or getTerminalURI() or getAbsoluteURI(URI)[return abs URI of a given relative URI]
    - reattach/move() calls!

TODO cache object typeURIs and secURIs, aggressively, to dramatically reduce server hit!
     (fetch some version or checksum info before??)
*/

/*
- dynamic library loading ??? COOL! 8) 8)
        
*/

// TODO: some max for requests?

__eos_requests = {}; // object storing all the waiting requests
__eos_objects = {};
__eos_comet = {getID: function() {return 1;}}; // TODO get rid of this
__eos_serial = []; // list of objects to be freed
__eos_serial_weak = []; // objects that can NOT be swapped out now // XXX name misspelled
__SERIALIZER = {};


function fakeerr(e) {if(window.console) console.log("Generic error: "+e);}
function fake() {}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOB Wrapper methods


function BlobBuilder () {
    if(window.google && google.gears) {
        this.___builder = google.gears.factory.create("beta.blobbuilder");
    } else {
        this.___bloblist = [];
    }
}
// protos...
BlobBuilder.prototype.getAsBlob = function () {
    if(this.___builder) {
        var bo = new BlobObject();
        bo.___blob = this.___builder.getAsBlob();
        return bo;
    }
    var bo = new BlobObject();
    bo.wrappedString = this.___bloblist.join("");
    return bo;
};

BlobBuilder.prototype.append = function (obj) {
    if(this.___builder) {
        if(obj.___blob) return this.___builder.append(obj.___blob);
        else return this.___builder.append(obj);
    }
    // else
    if(obj.wrappedString) this.___bloblist.push(obj.wrappedString);
    else {
        
        if(typeof obj == "string" || obj instanceof String) {
            var s = obj;
            var lh = [];
            var r, ch;
            for(var i=0;i<s.length;i++) {
                // convert UTF-8 to hex
                ch = s.charAt(i);
                r = encodeURI(ch);
                if(r.length > 1) r = r.split("%"); // %D0%AB -> "", "D0" "AB"
                else r = [ r.charCodeAt(0).toString(16).toUpperCase() ]; // -> HEX.
                lh=lh.concat(r);
            }
            this.___bloblist.push(lh.join(""));
        } else if (obj instanceof Array) {
            var lh = "";
            var r, ch;
            for(var i=0;i<obj.length;i++) {
                // convert int to hex
                if(typeof obj[i] == "number") ch = obj[i].toString(16).toUpperCase(); // assume it is integer??
                else throw (new TypeError("array does not consist of numbers"));
                if(ch.length==0) ch = "0"+ch;
                lh = lh + ch;
            }
            this.___bloblist.push(lh);
        }
    }
}; ////////////////////////////////////

function BlobObject() {
    // TODO: copy prototypes to local Blob object at bind_om()
    // this.___blob is the actual blob; if supported!
    
    // no way of creating a spare blob directly...
    //_BlobObject.apply(this);
    this.isBlob = true; // to detect blobs
}

BlobObject.prototype.toString = function () {
    return "[object GearsBlob]";
};

BlobObject.prototype.getLength = function () {
    if(this.___blob) return this.___blob.length;
    return this.wrappedString.length / 2; // should be integer
};

BlobObject.prototype.getBytes = function (offset, len) {
    len = len || this.getLength();
    offset = offset || 0;
    
    if(this.___blob) return this.___blob.getBytes(offset, len);
    var r=[];
    for(var i=offset;i<len; i++) {
        r.push(parseInt(this.wrappedString.charAt(i*2)+this.wrappedString.charAt(i*2+1), 16)); // value
    }
    return r;
};

BlobObject.prototype.slice = function (offset, len) {
    if(this.___blob) {
        // GEARS bug workaround:
        // never set len to size more than real current length
        
        var newBlob = new this.constructor();
        if(typeof(offset) == "undefined") newBlob.___blob = this.___blob.slice();
        else if(typeof(len) != "undefined") {
            var bytes_left = this.___blob.length - offset;
            if(len > bytes_left) len = bytes_left;
            if(len < 0) len = 0;
            newBlob.___blob =  this.___blob.slice(offset, len); 
        }
        else newBlob.___blob = this.___blob.slice(offset);
        return newBlob;
    }
    else {
        var newBlob = new this.constructor();
        len = len || this.wrappedString.length;
        if(len) newBlob.wrappedString = this.wrappedString.slice(offset*2, len*2);
        else newBlob.wrappedString = this.wrappedString.slice(offset*2);
        return newBlob;
    }
};

BlobObject.prototype.getAsBase64 = function () {
    var p = "=";
    var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var ba = this.getBytes(); // woohooo! for large BLOBs!!
    //  summary
    //  Encode a string as a base64-encoded string
    var s=[];
    var l=ba.length;
    var rm=l%3;
    var x=l-rm;
    for (var i=0; i<x;){
    var t=ba[i++]<<16|ba[i++]<<8|ba[i++];
    s.push(tab.charAt((t>>>18)&0x3f));
    s.push(tab.charAt((t>>>12)&0x3f));
    s.push(tab.charAt((t>>>6)&0x3f));
    s.push(tab.charAt(t&0x3f));
    }
    //  deal with trailers, based on patch from Peter Wood.
    switch(rm){
    case 2:
    t=ba[i++]<<16|ba[i++]<<8;
    s.push(tab.charAt((t>>>18)&0x3f));
    s.push(tab.charAt((t>>>12)&0x3f));
    s.push(tab.charAt((t>>>6)&0x3f));
    s.push(p);
    break;
    case 1:
    t=ba[i++]<<16;
    s.push(tab.charAt((t>>>18)&0x3f));
    s.push(tab.charAt((t>>>12)&0x3f));
    s.push(p);
    s.push(p);
    break;
    }
    return s.join("");  //    string

}

function eos_execURI(vm, sUri, sMethod, lArgs, timeout) {
    // this is a blocking call, so block the VM thread first
    var cs = vm.cur_stack;
    var x2 = cs.my.x2;
    cs.EXCEPTION = false;
    var mystop = __jn_stacks.newId();
    
    cs.STOP = mystop;
    if(vm.DEBUG) vm.ErrorConsole.log("in execURI... stopped stack!");
    // . means current object
    // .. means parent object
    // ~ means current terminal object
    // otherwise let the URI-HUB decide on what to do
    
    // first, find the dest object: if it is local - pass to eos_processRequest (vm, )
    // else - form&execute query to URI-hub and wait for result via callback
    
    
    if((typeof sUri != "string") && !(sUri instanceof String)) {
        cs.EXCEPTION = THROW;
        cs.exc.result = new vm.global.TypeError("First execURI argument must be a string, got: "+typeof(sUri));
        cs.STOP = false;
        return;
    }
    
    if((typeof sMethod != "string") && !(sMethod instanceof String)) {
        cs.EXCEPTION = THROW;
        cs.exc.result = new vm.global.TypeError("Second execURI argument must be a string, got: "+typeof(sMethod));
        cs.STOP = false;
        return;
    }

    if(!(lArgs instanceof Array)) {
        cs.EXCEPTION = THROW;
        cs.exc.result = new vm.global.TypeError("Args execURI argument must be an Array object");
        cs.STOP = false;
        return;
    }
    
    if((typeof timeout != "undefined") && !(timeout >= 0)) {
        cs.EXCEPTION = THROW;
        cs.exc.result = new vm.global.TypeError("timeout execURI argument must be a number >= 0");
        cs.STOP = false;
        return;
    }
    
    // now define actions we will take upon rs object receipt:
    // no matter, is it an error or OK status, we will parse it as usual
    
    // TODO: a smaller closure not to create such an overhead...?
    var onResponse = function (rq) {
        if(cs.STOP != mystop) {
            // could not detect that timeout is first or last; just skip for now
            // and TODO- detect timeout first or last to arrive and report accordingly
            //vm.ErrorConsole.log("WARNING: Stack lock mess; likely timeout fired but result arrived afterwards for "+vm.uri);
            return; // may happen if timeout fires before the result arrives (no way to abort)
        }
        
        if(rq.status == "OK") {        
            x2.result = rq.result;

            // the following is the procedure just to release the stack
            cs.EXCEPTION = RETURN;
            cs.STOP = false;
            __jn_stacks.start(cs.pid);
        } else {

            cs.EXCEPTION = THROW;
        
            if (rq.status == "EEXCP") {
                var ex = new vm.global.InternalError("execURI failed with exception: "+rq.result);
                ex.result = rq.result;
            } else if (rq.status == "ECONN") { 
                cs.EXCEPTION = THROW;
                var ex = new vm.global.InternalError("connection failed: "+rq.result);
                ex.result = rq.result;
            } else if (rq.status == "EPERM") {
                cs.EXCEPTION = THROW;
                var ex = new vm.global.SecurityError(rq.result);
                ex.result = rq.result;
            } else if (rq.status == "EDROP") {
                cs.EXCEPTION = THROW;
                var ex = new new vm.global.InternalError("connection failed: "+rq.result);
                ex.result = rq.result;
            } else {
                // unknown status received
                cs.EXCEPTION = THROW;
                var ex = new vm.global.InternalError("execURI failed with UNKNOWN status: "+rq.status);
            }

            cs.exc.result = ex;
            cs.STOP = false;
            __jn_stacks.start(cs.pid);

        }


    };
    

    
    kIPC(vm, sUri, sMethod, lArgs, onResponse, onResponse, timeout);
    
}



function eos_rcvEvent(rq) {

   //rq = JSON.parse(data);
    
    if(rq.result || rq.status) {
        // this is result arrived;
        if(!(rq.id in __eos_requests)) return; // silently fail? XXX this is okay for pinger



        if(__eos_requests[rq.id].onok) { 
            if(rq.status == "OK") {
                __eos_requests[rq.id].onok(rq);
            } else {
                if(__eos_requests[rq.id].onerror) {
                   __eos_requests[rq.id].onerror(rq);
                } else {
                   __eos_requests[rq.id].onok(rq);
                } 
            }
            delete __eos_requests[rq.id];
            return;
        }
        

        var x2 = __eos_requests[rq.id]["context"];
        var cs = __eos_requests[rq.id]["stack"];
        var vm = __eos_requests[rq.id]["vm"];
        
                
        delete __eos_requests[rq.id];
        
        // TODO: check what is unused here!!!
        
        if(rq.status == "OK") {
            // i HOPE that this IF path is unused!!
            // now there are two options: we have validateResponse defined - and we  have not.
            if(vm.security.validateResponse) {
                    var cbo = function (vr) {
                        if(vr) {
                            x2.result = rq.result;
                            // the following is the procedure just to release the stack
                            cs.EXCEPTION = RETURN;
                            //cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
                            cs.STOP = false;
                            __jn_stacks.start(cs.pid);
                            
                            
                        } else {

                            cs.EXCEPTION = THROW;
                            var ex = new vm.global.SecurityError("failed to validate RESPONSE that was received");
                            ex.result = rq.result;
                            cs.exc.result = ex;
                            cs.STOP = false; // XXX TODO: MAY it release foreign LOCK??? SHIT!!
                            __jn_stacks.start(cs.pid);   

                        
                        }
                    };
                    
                    var cbe = function (vr) {
                        cs.EXCEPTION = THROW;
                        var ex = new vm.global.InternalError("validateResponse failed with exception: "+vr);
                        ex.result = rs.result;
                        cs.exc.result = ex;
                        cs.STOP = false; // XXX TODO: MAY it release foreign LOCK??? SHIT!!
                        __jn_stacks.start(cs.pid);   

                    };
                    
                    vm.execf_thread(vm.security.validateResponse, [rq], cbo, cbe, undefined, vm.security); 
            } else {
                x2.result = rq.result;
                // the following is the procedure just to release the stack
                cs.EXCEPTION = RETURN;
                //cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
                cs.STOP = false;
                __jn_stacks.start(cs.pid);
                
            }
        } else {

            cs.EXCEPTION = THROW;
        
            if (rq.status == "EEXCP") {
                var ex = new vm.global.InternalError("execURL failed with exception: "+rq.result);
                ex.result = rq.result;
            } else if (rq.status == "ECONN") { 

                cs.EXCEPTION = THROW;
                var ex = new vm.global.InternalError("connection failed: "+rq.result);
                ex.result = rq.result;
            } else if (rq.status == "EPERM") {

                cs.EXCEPTION = THROW;
                var ex = new vm.global.SecurityError(rq.result);
                ex.result = rq.result;
            } else if (rq.status == "EDROP") {
     
                cs.EXCEPTION = THROW;
                var ex = new new vm.global.InternalError("connection failed: "+rq.result);
                ex.result = rq.result;
            } else {
                // unknown status received
                cs.EXCEPTION = THROW;
                var ex = new vm.global.InternalError("execURL failed with UNKNOWN status: "+rq.status);
            }

            cs.exc.result = ex;
            cs.STOP = false;
            __jn_stacks.start(cs.pid);


        }


        // return goes here (nothing below);
    // this part is still used! we received a request!
    } else {
    
        if(rq.status && rq.status == "EDROP") {
            return; // XXX do something? take actions???
        }
        // this is request; take care of running it and then returning it back to the server with appropriate ID
        var t = __eos_objects["terminal"];
        // parse the URI
        var lURI = rq.uri.split("/");
        
        
        var dest = t.getChild(lURI); // XXX strange.. it works :-\
        
        if(dest == null) {
            // child not found...
            rq.result = "object not found by URI "+rq.uri;
            rq.status = "EEXCP";
            delete rq["args"];
            hubConnection.send(rq);
            return;
        }
        

        if(typeof(dest) == "string") {
            // redir 
            // 1. locally
            // 2. globally
            if(dest.charAt(0) == "/") {
                rq.uri = dest;
                rq.status = "REDIR"; // instruction for HUB
                delete rq["args"];
                //rq.result = ""; // to indicate we're NOT;) result ?? (omit result param; see how hub works
                hubConnection.send(rq);
            } else if (dest.charAt(0) == "~") {
                rq.uri = dest;
                // treat as we've received this one
                eos_rcvEvent(rq);
            } else {
                // XXX TODO XXX RELATIVE REDIRECTION NOT SUPPORTED!!
                delete rq.args
                rq.result = "Redirection failed";
                rq.status = "EEXCP";
                hubConnection.send(rq);
                return;
            }
        } else {
            var cbo = function (rs) {
                // rs is already a good object..
//console.log("Sending back...");
                hubConnection.send(rs);                
            };

            
            
            dest.execIPC(rq, cbo, cbo); 
        }
    
    }
    
    
    
    
}


// ------------------------------------------------------------------


Jnaric.prototype.execIPC = function (rq, cbOK, cbERR) {
    if(this.DEBUG) this.ErrorConsole.log("in execIPC... ");
    // 1. validate the request, run OK or ERROR callbacks 
    var self = this;
    var cbo = function (result) {
        if(self.DEBUG) self.ErrorConsole.log("in execIPC... validate done");
        // 2. if validated to OK, run the method using the same fn        
        if(result !== true) {
            cbERR({id: rq.id, status: "EPERM", result: ((typeof result == "string") ? result  : "permission denied")});
            return;
        } 
        if(self.DEBUG) self.ErrorConsole.log("in execIPC... validateOK");
        var ipcm;
        if(   (ipcm = (self.global.object.ipc.hasOwnProperty(rq.method))) || (self.security.ipc && self.security.ipc.hasOwnProperty(rq.method))) { // __ipc

            var cbo2 = function (result) {
                // if(typeof(result) == "undefined") result = -999999999;
                // TODO: introduce UNDEFINED transfer?
                // DOC: no result -> undefined (this is how json seialization does it)

                
                if(self.security.signResponse) {

                    var cbo = function (res) {
                        cbOK({id: rq.id, status: "OK", result: res});
                    };
                    
                    var cbe = function (ex) {
                        cbERR({id: rq.id, status: "EEXCP", result: "signResponse failed with exception: "+ex});
                    };

                    self.execf_thread(self.security.signResponse, [rq], cbo, cbe, undefined, self.security); 
                } else {
//console.log("!!!!!!!!!!!!!!!!...cbOK");
                    cbOK({id: rq.id, status: "OK", result: result});
                }

            };
            
            var cbe2 = function (ex) {

                if(self.DEBUG) self.ErrorConsole.log("method IPC call failed with exception: "+ex); // for debug only
                cbERR({id: rq.id, status: "EEXCP", result: "method failed with exception: "+ex});
            };

//console.log("!!!!!!!!!!!!!!!!!11executing...:" + ipcm);
            if(!ipcm) self.execf_thread(self.security.ipc[rq.method], [rq].concat(rq.args), cbo2, cbe2, undefined, self.security); 
            else self.execf_thread(self.global.object.ipc[rq.method], [rq].concat(rq.args), cbo2, cbe2); 
        
        } else {
            if(self.DEBUG) self.ErrorConsole.log("method IPC call failed with NO SUCH METHOD"); // for debug only
            
            cbERR({id: rq.id, status: "EEXCP", result: ("no such method: "+rq.method)});
            return
        }
    };
    
    var cbe = function (ex) {
        self.ErrorConsole.log("request validation failed with exception: "+ex);
        cbERR({id: rq.id, status: "EEXCP", result: "request validation failed with exception: "+ex});
    };
    
    
    if(this.global.initIPCLock) { // means we're in the state of initialization

        if(self.global.initIPCLock.goflag < 1) { // means lock is set
            var cb = function () {
                self.global.initIPCLock.release(true);
                self.execIPC(rq, cbOK, cbERR);
            };
            self.global.initIPCLock.___wait_queue.push({callback: cb});
            return; // this will ensure that only one instance of retying is in the queue!!
        } // else just continue
   }
   
   if(this.global.wakeupIPCLock) {
        if(self.global.wakeupIPCLock.goflag < 1) { // means lock is set
            var cb = function () {
                self.global.wakeupIPCLock.release(true);
                self.execIPC(rq, cbOK, cbERR);
            };
            self.global.wakeupIPCLock.___wait_queue.push({callback: cb});
            return;
        } // else just continue
    }


    
    if(this.security.validateRequest) {
        this.execf_thread(this.security.validateRequest, [rq], cbo, cbe, undefined, this.security); 
    } else {
        cbe("validateRequest is undefined at callee side");
    }
    
    // re-push the __eos_serial list    

    for(var i=0; i<__eos_serial.length; i++) {
        if(__eos_serial[i] == this) { // we're in serial
                __eos_serial.splice(i,1);
                __eos_serial.push(this);
                break;
        }
    }

        
};

Jnaric.prototype.getChild = function (lURI, r) {
    // a method to return child
    
    if(lURI.length == 0) return this;
    if(lURI.length == 1 && lURI[0] == "~") return __eos_objects["terminal"];

    if(typeof(r) == 'undefined') { // do only if not recursively called
        // TODO: support for relative URI parsing
        // create a copy of lURI
        var llURI = [].concat(lURI);
        
        if(llURI[0] == ".") {
            llURI.shift();
            llURI = (this.uri.split("/")).concat(llURI);            
        }
        else if(llURI[0] == "..") {
            llURI.shift();
            llURI = (this.getParent().uri.split("/")).concat(llURI);
        }

        
        // abs uri cache
        var sURI = llURI.join("/"); 
        if(sURI in __eos_objects) return __eos_objects[sURI];
        
        // now check for serialized object
        // if it is there by URI, -> return eos_wakeObject
        var stor = getFixedStorage();
        if(stor) {
            var d = stor.getChildList(sURI);
            if(d) {
                // first, find parent
                // or invent one
                var parentURI = [].concat(llURI);
                var child_name = parentURI.pop();
                parentURI = parentURI.join("/");
                var parent = __eos_objects[parentURI];
                if(!parent) {

                    var td = stor.getChildList(parentURI);
                    // XXX what if... ??? parent isnt at storage too O_o
                    if(!td) __eos_objects["terminal"].ErrorConsole.log("failed to retreive parent from stor: "+parentURI+" / "+sURI);
                    parent = {serID: parseInt(td.rowid), uri: parentURI, name: llURI[(llURI.length - 1)]};
                }
                //console.log("getting ser par from "+parentURI);
                //console.log("got obj oid: "+d.rowid+" from uri "+sURI+" TypeURI "+d.TypeURI);
                return eos_wakeObject(parent, child_name, parseInt(d.rowid));
                
            }
            stor.close();
        }
        
        
    }
    
    // TODO: support for redirection URI caching 
    
    

    if(lURI[0] == ".") {
        lURI.shift();
        return this.getChild(lURI, true);
    }
    else if(lURI[0] == "..") {
        lURI.shift();
        return this.getParent().getChild(lURI, true); 
    }
    else if(lURI[0] == "~") {
        
        lURI.shift();
        return __eos_objects["terminal"].getChild(lURI, true);
    }
    else if(lURI[0] == "") { // skip...
        lURI.shift();
        return this.getChild(lURI, true);
    }

    
    //var trg = this.global.__child[lURI[0]];
    var trg = this.childList[lURI[0]];
    if(typeof(trg) == "undefined") return null;

    //if( (typeof(trg) == "string") && (trg.charAt(0) == "@") ) {
    if(typeof(trg) == "number") {
        // this means we have a serialized object, wake it up!
        if(!KCONFIG.autorestore) return null; // XXX work in progress... TODO later
        trg = eos_wakeObject(this, lURI[0], trg); 
        if(trg == -1) return null; // XXX in case we failed to get the object due to wakeup fail :-\
        // this may take a while though... TODO some optimization and prioritization
        // or make this a user-level task
    }
    
    if(typeof(trg) == "string") {
        // now count what is left in lURI
        if(lURI.length == 1) return trg;
        lURI.shift();
        return trg+"/"+lURI.join("/");
        //console.log("whats left length:"+lURI.length+" 0:"+lURI[0]+"/"+lURI[1]);
        
    }


    if(lURI.length == 1) {
        // return our child directly
        //if(trg.___vm) return trg.___vm;
        //else return trg; // return whatever is there
        return trg; // either a string or an instance...
    }
    
    lURI.shift();
    return trg.getChild(lURI, true);

};

Jnaric.prototype.getParent = function () {

    return this.parent; //  always set 'parent'! parent may be fake. See serialization internal protocol
};


// universal request method
// TODO: REWRITE THE eos_execURI to BE STACK_INDEPENDENT!!!
//       like do kIPC() and have eos_execURI as a wrapper??
function kIPC(vm, uri, method, args, onok, onerr, timeout) {

    var rq = {
        id: __jn_stacks.newId(), 
        uri: uri,
        terminal_id: "~", // always 'myself' for local requests - remote set at hubConnection
/*
        object_type: vm.TypeURI, // TODO DOC decide on these names! mb. caller_type, caller_uri, etc.?
        object_security: vm.SecurityURI,
        object_uri: vm.uri, // named request
*/
        caller_type: vm.TypeURI, // TODO DOC decide on these names! mb. caller_type, caller_uri, etc.?
        caller_security: vm.SecurityURI,
        caller_uri: vm.uri, // named request

        method: method,
        args: args
    };
    
    //var TIMEOUT_OK = {v: false};
        
    var afterSign = function () {
        if (vm.security.validateResponse) {
            var myonok = function (rs) {
                // validate response, if appropriate
                // TODO: these are currently unusable for in-stack execution; need to set SecurityError instead
                //       maybe do not validate response here??
                
                var cbo = function (vr) {
                    if(vr) {
                        //TIMEOUT_OK.v = true;
                        onok(rs);                    
                    } else {
                        onerr({id: rq.id, status: "EPERM", result: "response validation failed"}); // this can actually be parsed as permission error and raise SecurityError..
                    }
                };
                
                var cbe = function (vr) {
                    onerr({id: rq.id, status: "EEXCP", result: "validateResponse failed with exception: "+vr});
                };
                
                vm.execf_thread(vm.security.validateResponse, [rq], cbo, cbe, undefined, vm.security); 
            };
        } else {
            //var myonok = function (rs) { TIMEOUT_OK.v = true; onok(rs); };
            var myonok = onok;
        }

        var lURI = uri.split("/");
        if(lURI[0] == "") { // means this is root HUB request
            if(vm.DEBUG) vm.ErrorConsole.log("in kIPC... request for HUB");

            // DOC if no onerror and only onok: call onok always -> as a standard kernel programming practice
            __eos_requests[rq.id] = {request: rq, onok: myonok, onerror: onerr}; 
            hubConnection.send(rq); 
        } else {         // TODO: URI caching
            try { // TODO get rid of this.. later
                // cache
                if(__eos_objects[uri]) var dest = __eos_objects[uri];
                else var dest = vm.getChild(lURI); // should never fail...
            } catch (e) {
                onerr({id: rq.id, status: "EEXCP", result: "FAILED TO EXECUTE GETCHILD: "+e+" Line:"+e.lineNumber+" File:"+e.fileName});
                return;
            }
            if(dest == null) {
                
                onerr({id: rq.id, status: "EEXCP", result: "object not found by URI"});
                return;
            }
            if(typeof(dest)=="string") { // means we're redirect 
                if(vm.DEBUG) vm.ErrorConsole.log("in kIPC... again kIPC!");
                // TODO optimize this! this will run signRequest at least twice; and pollute heap
                kIPC(vm, dest, method, args, onok, onerr); // we're taking advantage of the 'GIL' in js engine
            } else { // means it is a VM instance, so execute the request
                try {
                    dest.execIPC(rq, myonok, onerr); // XXX parse results?? if YES -> change wakeObject!!    
                } catch (e) {
                    if(window.console) console.log("in kIPC - execIPC error:: " + e);
                }
            }
        }
        
        if(typeof(timeout) == "number") {
            var tmf = function () {
                //if(TIMEOUT_OK.v) return;
                onerr({id: rq.id, status: "EEXCP", result: "TIMEOUT"});
                //hubConnection.abort(rq.id); // fail silently?? or do not abort??
            };
            setTimeout(tmf, timeout); // document that timeout is milliseconds
        }
        
    };

    if (vm.security.signRequest) {
        // do somehow validate request
        var onSok = function (res){
            if(res === true) { // XXX DOC the signRequest should modify the rq object itself and it should return true
                afterSign();
            } else {
                onerr({id: rq.id, status: "EPERM", result: (res ? res : "signRequest refused to sign request")});
            }
        };
        
        var onSerr = function (exc) {
            onerr({id: rq.id, status: "EEXCP", result: "signRequest failed with exception: "+exc});
        };
        vm.execf_thread(vm.security.signRequest, [rq], onSok, onSerr, undefined, vm.security); 
    } else {
        afterSign();
    }

}



function eos_wakeObject(parent, name, serID) {
    // XXX: delay the request until the objects get deserialized!!! this is accomplished via execIPC - check that!
    // TODO: what if the object does not exist?? - system error!!
    // TEMPORARY SOLUTION GOES HERE
    
    var stor = getFixedStorage();
    
    if(!stor) {
        __eos_objects["terminal"].ErrorConsole.log("ASSERT FAILED: wakeObject: storage not availabl");
        return null; // should getChild abandon the failing object or just ignore it??
    }
    
    var self = this;
    var dump = stor.getByID(serID);
    stor.close();
    if(!dump) {
        __eos_objects["terminal"].ErrorConsole.log("ASSERT FAILED: wakeObject: could not get object by id: "+serID);
        return null;
    }
    
    var obj = new Jnaric();
    
    ////////////////////////////
    // copypaste part of eos_createObject TODO: write a single initObject kernel method
    // URI text, TypeURI text, SecurityURI text, SecurityProp text, ChildList text, Data blob, Created int, Modified int)");
    obj.name = name;
    obj.TypeURI = dump.TypeURI;
    obj.SecurityURI = dump.SecurityURI;
    obj.parent = parent;
    obj.uri = obj.parent.uri+"/"+name; 
    // assert here
    if(obj.parent.uri+"/"+name != dump.URI) {
        __eos_objects["terminal"].ErrorConsole.log("ASSERT FAILED: obj.parent.uri+\"/\"+name != dump.URI: "+obj.parent.uri+"/"+name+" != "+dump.URI);
    }
    obj.serID = dump.rowid;
    obj.childList = JSON.parse(dump.ChildList);
    
    //obj.global.initIPCLock = true; // THIS to be flushed by security validateRequest method init
    //obj.global.wakeupIPCLock = true; // THIS to be flushed by a call to setSecurityState method
    obj.global.initIPCLock = new obj.global.Lock(); // THIS to be flushed by security validateRequest method init
    obj.global.initIPCLock.goflag = 0; // set the lock
    obj.global.wakeupIPCLock = new obj.global.Lock(); 
    obj.global.wakeupIPCLock.goflag = 0; // set the lock

    obj.bind_dom(); // TODO bind to fake DOM element since it is currently impossible to serialize DOM-enabled elements
    obj.bind_om(); // bind the protected EOS object model
    
    
    /////////////// end copypaste part
    
    // now try to attach as parent to all possible children!
    for(var ch in obj.childList) {
        for(var ob in __eos_objects) {
            if(__eos_objects[ob].serID == obj.childList[ch]) {
                obj.childList[ch] = __eos_objects[ob];
                __eos_objects[ob].parent = obj; // and forget fake parent
                break;
            }
        }
    }
    
    var dummy = function () {
        //console.log("dummy..");
    };
    var dummy_assert = function () {
        __eos_objects["terminal"].ErrorConsole.log("error while executing setSecurityState!!");
        //    XXX a deadlock may occur!
    };

    /*
    obj.onfinish = function () {
        // we should call setState and setSecurityState on finish        
        // THESE methods should drop the ready flag immediately and restore it later on to avoid possible requests from being run on obj        
    };
    */

    obj.onerror = function () {
        
        obj.ErrorConsole.log("ERROR! object wakeup failed due to error in main thread. Removing dead object.");
        if(obj.swapout() != 0) {
            obj.clean_stacks();
            delete __eos_objects[obj.uri];
        }
    };
    
    // OKAY, write 2 more kernel methods: - to read() the data via URI and [LATER] to create system object manually
    //      i.e. createObject method
    // the kernel ipc loop: set the rq ids and callees as kIPC("URI", "", args)
    // ---the method will sign read request as if it was from the current object IPC---
    // kLIPC always executes from terminal identity
    
    var onerror = function (e) {
        // TODO: abandon object on error!
        // TODO: remove wakeup lock on any IPC semaphores/timeouts!
        __eos_objects["terminal"].ErrorConsole.log("wakeObject kIPC error: "+e);
        //    XXX a deadlock may occur!
    }
    
    var onft = function (sec_src) {
        // we'll be setting Sec while getting Type..
        obj.evaluate(sec_src.result, dump.SecurityURI); // this will set the initIPCLock to false (XXX why ever initLock needed here??)
        var onfs = function (type_src) {
            
            obj.evaluate(type_src.result, dump.TypeURI); // XXX TYPE SRC CODE MUST RELEASE MAIN THREAD for serialization..
                                           // OR IT WILL DEADLOCK THE SYSTEM IPC FOR THAT OBJECT
            
            if(dump.Data) {
                try {
                    obj.global.object.data = JSON.parse(dump.Data); // set data variable directly
                } catch (e) {
                    obj.ErrorConsole.log("Could not load JSON object data (TQLW wakeup)");
                }
            }

            if(dump.SecurityProp) { // if any security preferences registered...?
                obj.onfinish = function () {
                    // XXX this should set the wakeupIPCLock to false
                    obj.execf_thread(obj.security.setSecurityState, [JSON.parse(dump.SecurityProp)], dummy, dummy_assert, undefined, obj.security); 
                };
            } else {
            
            }
        };
        kIPC(__eos_objects["terminal"], obj.TypeURI, "read", [], onfs, onerror);
    };
    kIPC(__eos_objects["terminal"], obj.SecurityURI, "read", [], onft, onerror); 
    
    //    the Security model init should NEVER block and unset initIPCLock. the later setSecurityState drops the wakeupIPCLock flag
  
    
    
    // now check & serialize-swapout somebody if appropriate
    if(KCONFIG.autoswapout && (__eos_objects.length > KCONFIG.MEMOBJECTS)) {
        // try to serialize-swapout somebody on the list of pretendents
        // TODO where to construct this list??
        // this is a list of objects that requested serialization and released themselves from memory
        var snew = [];
        for(var i=0; (i < (__eos_objects.length - KCONFIG.MEMOBJECTS)) && (i < __eos_serial.length); i++) {
            // should be the oldest accessed!
            var vmo = __eos_serial[i];
            
            for(var j=0; j<__eos_serial_weak.length; j++) {
                if(vmo == __eos_serial_weak[j]) break;
            }
            if(j == __eos_serial_weak.length) vmo.swapout(); 
            else snew.push(vmo);
        }
        // clean out the list afterwards
        __eos_serial = snew;
    }
    
    
    
    
    // TODO: handle errors with duplicate names on wakeup?? or it is impossible situatuin? assert?
    if(parent.childList) // defeat fake parent!
        parent.childList[name] = obj;
    __eos_objects[obj.uri] = obj;
    
    // now set for release 
    __eos_serial.push(obj);
    return obj;
}

function eos_createObject(vm, name, type_src, sec_src, parentURI, typeURI, secURI, DOMElement) {
    // parentURI may only be a local object...
    // TODO: special security policy should apply here since the method may be globally IPC accessed
    //       but doing so will lead to method arguments inconsistency
    
    var cs = vm.cur_stack;
    var x2 = cs.my.x2;

    // DO NOT STOP THE STACK!!
    //    since theres nothing to check for 'onfinish' ...
    
    // the most of this method should be executed inside VM or it will be getting too complex
    // XXX this is actually bad and slow and shows actually why object creation is so slow in general
        
    var obj = new Jnaric();
    
    
    
/*    
    obj.onfinish = function () {
    }; 
*/
    
    obj.name = name;
    obj.TypeURI = typeURI;
    obj.SecurityURI = secURI;

    obj.parent = __eos_objects["terminal"].getChild(parentURI.split("/")); // XXX sneaky place


    obj.parent.childList[name] = obj;

    //console.log("getting parent of "+parentURI+" set to "+(obj.parent ? obj.parent.name : obj.parent));
    obj.uri = obj.parent.uri+"/"+name; 
    __eos_objects[obj.uri] = obj; // DUP name issue??? 

    
    obj.serID = -1;
    obj.childList = {};
    //obj.global.initIPCLock = true; // flush this by validateRequest init XXX
    //obj.global.wakeupIPCLock = false;

    obj.global.initIPCLock = new obj.global.Lock(); // THIS to be flushed by security validateRequest method init
    obj.global.initIPCLock.goflag = 0; // set the lock
    obj.global.wakeupIPCLock = new obj.global.Lock(); 
    
    
    obj.bind_dom(DOMElement); // TODO bind to protected wrapped DOM or to fake DOM element
    obj.bind_om(); // bind the protected EOS object model
    
    obj.onerror = function (ex) {
        // DOC this! 
        vm.global.ErrorConsole.log("created child (URI "+obj.uri+") main thread died with exception: "+ex);//+". Removing dead object."); 
        
        // now delete the object ???
        //if(obj.swapout() != 0) { // new child to swap out with error??
        //obj.serID = -1; // prevent from saving changes
        //eos_deleteChild(); // WARNING! 
        //obj.clean_stacks();
        //delete __eos_objects[obj.uri];
        
        //}
    };
    //console.log("evaluating securoty code!: "+ secURI +" : "+sec_src);
    obj.evaluate(sec_src, secURI); // the single threaded nature here ensures we're not going to receive onfinish not in time
    obj.evaluate(type_src, typeURI);

    //obj.execIPC();

    
    
    
}



Jnaric.prototype.getChildList = function () {
    // return the list of children FOR SERIALIZATION!!!
    var r = {};
    var good = true; // XXX good will be unused from now on...
    for (ob in this.childList) {
        //if(ob == "__defineProperty__") continue; // XXX FUCK!!!!!!!! XXX XXX XXX
        if(typeof this.childList[ob] == "number" || typeof this.childList[ob] == "string") {
            r[ob] = this.childList[ob];
        } else { // XXX this does not nessesarily indicate there is a non-serialized object; this may indicate a programming error instead!
            if(this.childList[ob].serID > -1) r[ob] = this.childList[ob].serID;
            /*
            else {
                // if the object is in __eos_serial_weak: return bad
                // TODO HERE
                // NO! delete everything here!! -> do it at serialize: if parent is not serialized - skip to another
                //     then when object is serialized - re-serialize parent childList (only)!
                //     CL only ser and retr is useful for URI pass/cache resolv (today)
                for() {
                    good = false;
                }
            }
            */
        }
    }
    return {good: good, list:r}; 
};


// DOC - API here!
Jnaric.prototype.swapout = function (force) { // DOC this - force means clean out regardless the running stacks
    // swap the object out of memory
    
    var hs = this.has_stacks();
    var j;
    
    if(!force && hs) return -1; // DOC this, cannot continue
    
    if(!(this.serID > 0)) return -2;

    // clean ALL references!!! -->
    // 1. as .parent for childList
    // 2. stacks
    // 3. from parent
    // 4. __eos_objects
    
    // clean childlist
    for(var ch in this.childList) {
        this.childList[ch].parent = {serID: this.serID, uri: this.uri, name: this.name}; // NOTE: .parent is FAKE now
    }

    
    if(hs) {
        // forget the stacks and all the shit
        /*
        var newss = [];
        for(j=0;j<__jn_stacks.stacks_sleeping.length;j++)
            if(__jn_stacks.stacks_sleeping[j].vm != this)
                 newss.push(__jn_stacks.stacks_sleeping[j]);
        __jn_stacks.stacks_sleeping = newss;
        newss = [];
        for(j=0;j<__jn_stacks.stacks_running.length;j++)
            if(__jn_stacks.stacks_running[j].vm != this)
                newss.push(__jn_stacks.stacks_running[j]);
        __jn_stacks.stacks_running = newss;
        */
        this.clean_stacks();
    }
    
    
    // if the parent got swapped out -> do nothing
    /// this.parent.childList[this.name] = this.serID; 
    (this.getParent()).childList[this.name] = this.serID; // will just ignore for fake parent...?

    // the sys uri cache
    delete __eos_objects[this.uri];

    return 0;
};

// dangerous function!
Jnaric.prototype.clean_stacks = function () {
        // forget the stacks and all the shit
        var newss = [];
        for(j=0;j<__jn_stacks.stacks_sleeping.length;j++)
            if(__jn_stacks.stacks_sleeping[j].vm != this)
                 newss.push(__jn_stacks.stacks_sleeping[j]);
        __jn_stacks.stacks_sleeping = newss;
        newss = [];
        for(j=0;j<__jn_stacks.stacks_running.length;j++)
            if(__jn_stacks.stacks_running[j].vm != this)
                newss.push(__jn_stacks.stacks_running[j]);
        __jn_stacks.stacks_running = newss;
};


// return true if the object has running/sleeping tasks, else - false
Jnaric.prototype.has_stacks = function () {
        var i,j;
        for(j=0;j<__jn_stacks.stacks_sleeping.length;j++)
            if(__jn_stacks.stacks_sleeping[j].vm == this)
                return true; 


        for(j=0;j<__jn_stacks.stacks_running.length;j++)
            if(__jn_stacks.stacks_running[j].vm == this)
                return true;

};


function GearsStore() {
    this.db = google.gears.factory.create("beta.database");
    this.db.open("jeos3-ss");
    this.db.execute("create table if not exists Serialize (URI text UNIQUE, TypeURI text, SecurityURI text, SecurityProp text, ChildList text, Data text, Created int, Modified int)");
};

GearsStore.prototype.checkID = function (ID) {
    // check if the ID is available in serial form
    var r = this.db.execute("SELECT * FROM Serialize WHERE OID=?", [ID]);
    if(r.isValidRow()) {
        r.close();
        return true;
    }
    r.close();
    return false;
};

GearsStore.prototype.update = function (ID, data) {
    // may fail here??
    this.db.execute("UPDATE Serialize SET SecurityProp=?, ChildList=?, Data=?, Modified=? WHERE OID=?", 
                            [data.SecurityProp, data.ChildList, data.Data, (new Date()).getTime(), ID]); 
};

GearsStore.prototype.insert = function (data) {
    // may fail here??
    // console.log("Doing insert with "+[data.URI, data.TypeURI, data.SecurityURI, data.SecurityProp, data.ChildList, data.Data, (new Date()).getTime(), (new Date()).getTime()].join(" ; "));
    //this.db.execute("INSERT INTO Serialize (URI, TypeURI, SecurityURI, SecurityProp, ChildList, Data, Created, Modified) VALUES (?,?,?,?,?,?,?,?)",
    this.db.execute("INSERT INTO Serialize values (?,?,?,?,?,?,?,?)",  
                            [data.URI, data.TypeURI, data.SecurityURI, data.SecurityProp, data.ChildList, data.Data, (new Date()).getTime(), (new Date()).getTime()]); 

    // now get and set the oid of the shitty thing
    var oidr = this.db.execute("SELECT rowid FROM Serialize WHERE URI=?", [data.URI]);
    var iid = parseInt(oidr.field(0)); // not sure parseInt is required here
    oidr.close();
    return iid;
};

GearsStore.prototype.getByID = function (serID) {
    var rs = this.db.execute("SELECT URI,rowid,TypeURI,SecurityURI,SecurityProp,ChildList,Data FROM Serialize WHERE OID=?", [serID]);
    if(!rs.isValidRow()) {
      rs.close();
      return null;
    }
    var dump = {};
    for(var i=0;i<rs.fieldCount();i++) {
        dump[rs.fieldName(i)] = rs.field(i);
    }
    rs.close();
    return dump;
};

GearsStore.prototype.getByURI = function (uri) {
    var rs = this.db.execute("SELECT rowid,TypeURI,SecurityURI,SecurityProp,ChildList,Data FROM Serialize WHERE URI=?", [uri]);
    if(!rs.isValidRow()) {
      rs.close();
      return null;
    }
    var dump = {};
    for(var i=0;i<rs.fieldCount();i++) {
        dump[rs.fieldName(i)] = rs.field(i);
    }
    rs.close();
    return dump;
};


GearsStore.prototype.getChildList = function (URIorID) {
    if(typeof URIorID == "string") {
        var rs = this.db.execute("SELECT rowid,TypeURI,SecurityURI,ChildList FROM Serialize WHERE URI=?", [URIorID]);
    } else {
        var rs = this.db.execute("SELECT rowid,URI,TypeURI,SecurityURI,ChildList FROM Serialize WHERE OID=?", [URIorID]);
    }
        
    if(!rs.isValidRow()) {
      rs.close();
      return null;
    }
    var dump = {};
    for(var i=0;i<rs.fieldCount();i++) {
        dump[rs.fieldName(i)] = rs.field(i);
    }
    rs.close();
    return dump;
};

GearsStore.prototype.setChildList = function (ID, schildList) {
    if(typeof(ID) == "string") {
        this.db.execute("UPDATE Serialize SET ChildList=?, Modified=? WHERE URI=?", 
                                [schildList, (new Date()).getTime(), ID]); 
    } else {
        this.db.execute("UPDATE Serialize SET ChildList=?, Modified=? WHERE OID=?", 
                                [schildList, (new Date()).getTime(), ID]); 
    }

};


GearsStore.prototype.remove = function (ID) { // remove from storage...
    // may fail here??
    this.db.execute("DELETE FROM Serialize WHERE OID=?", [ID]); 
};


GearsStore.prototype.close = function () {
    // may fail here??
    this.db.close();
};

/* 
 *  localStorage interface!
 */

function localStore() {

}

localStore.prototype.checkID = function (ID) {
    // check if the ID is available in serial form
    if(window.localStorage.getItem(ID.toString())) return true;
    return false;
};

localStore.prototype.update = function (ID, data) {
    // inefficient...
    var saved_data = JSON.parse(window.localStorage.getItem(ID.toString()));
    for(var ob in data) {
        saved_data[ob] = data[ob];
    }
    saved_data.Modified = (new Date()).getTime();
    window.localStorage.setItem(ID.toString(), JSON.stringify(saved_data));
};

localStore.prototype.insert = function (data) {
    var ID = (new Date()).getTime();
    data.Created = data.Modified = ID;
    window.localStorage.setItem(ID.toString(), JSON.stringify(data));
    window.localStorage.setItem(data.URI, ID.toString());
    return ID;
};


localStore.prototype.getByID = function (serID) {
    var d = JSON.parse(window.localStorage.getItem(serID.toString()));
    d.rowid = parseInt(serID); // XXX Gears API mess :-\
    return d;
};

localStore.prototype.getByURI = function (uri) {
    var ID = window.localStorage.getItem(uri);
    if(!ID) return null;
    return this.getByID(ID);
};


localStore.prototype.getChildList = function (URIorID) {
    if(typeof URIorID == "string") {
        var ID = window.localStorage.getItem(URIorID);
        if(!ID) {
            if(DEBUG && window.console) console.log("localStore getChildList consistency error!!: "+URIorID);
            return;
        }
    } else {
        var ID = URIorID;
    }
    var d= JSON.parse(window.localStorage.getItem(ID.toString()));
    d.rowid = parseInt(ID); // XXX Gears API mess :-\
    return d;
};


localStore.prototype.setChildList = function (URIorID, schildList) {
    if(typeof URIorID == "string") {
        var ID = window.localStorage.getItem(URIorID);
        if(!ID) { 
            if(DEBUG && window.console) console.log("localStore setChildList consistency error!!: "+URIorID);
            return;
        }
    } else {
        var ID = URIorID;
    }
    var data = JSON.parse(window.localStorage.getItem(ID.toString()));
    data.ChildList = schildList;
    window.localStorage.setItem(ID.toString(), JSON.stringify(data))
};


localStore.prototype.remove = function (ID) { // remove from storage...
    // may fail here??
    var data = JSON.parse(window.localStorage.getItem(ID.toString()));
    window.localStorage.removeItem(data.URI);
    window.localStorage.removeItem(ID.toString());
};


localStore.prototype.close = function () { };

function getFixedStorage() {
    if(window.google) {
        try {
            return (new GearsStore()); // prefer gears??
        } catch (e) { // not permitted
            if (window.localStorage) {
                return (new localStore());
            } else {
                return undefined;
            } 
        }
    } else if (window.localStorage) {
        return (new localStore());
    } else {
        return undefined;
    }
    
}

// WARNING! different error handling API here
// WARNING! need all children to be serialized too
//          may result in a deadlock for calling stack if not all children provide the capability of serialization
Jnaric.prototype.serialize = function (onfinish, onerror) {
    // return null if serialization is not possible
    var stor = getFixedStorage();
    if(!stor) return -1;
    
    var self = this;
    var oChildList = self.getChildList();
    
    // make sure we are clean to serialize: parent is serialized
    if(!(this.parent.serID > -1)) { 
        onerror && onerror("object not ready - parent not serialized, skip to another"); 
        return -2;
    }
    
    
    // WARNING: do something more adequeate here?
    /*
    if(!oChildList.good) { 
        onerror && onerror("object not ready - some children not serialized, skip to another"); 
        return -2;
    }
    */  
    
    var sChildList = JSON.stringify(oChildList.list);
    // first, get the object data state
    
    //var onGetState = function (resultData) {
    var onGetSec = function (resultSec) {
        // TODO: 2 storage methods: Database and Filelike            

        // TODO: serialization error still possible here!!! - REPORT!!
        //try ... etc

        // 1. the object is serialized already -> search by id (this.serID) - OR - ERROR !!!
        if(self.serID > 0) {
            if(stor.checkID(self.serID)) {
                // update me
                var data = {
                    SecurityProp: JSON.stringify(resultSec),
                    //Data: JSON.stringify(resultData),
                    Data: JSON.stringify(self.global.object.data),
                    ChildList: sChildList
                };
                stor.update(self.serID, data);
            } else {
                // error, the object has been serialized but is not available or some other programming error occurred
                // TODO: possible solutions: 1. serialize as new object. 2. throw an exception (WHERE??)
                // suggestion is 2. TODO this at earlier stages!
            }
        // 2. the object is not serialized
        } else {
                // insert
                var data = {
                    SecurityProp: JSON.stringify(resultSec),
                    Data: JSON.stringify(self.global.object.data),
                    ChildList: sChildList,
                    TypeURI: self.TypeURI,
                    SecurityURI: self.SecurityURI,
                    URI: self.uri
                };

                self.serID = stor.insert(data);
        }
        // now ensure that we're at the parent's serialized CL
        var pardata = stor.getChildList(self.parent.uri);
        if(pardata) { // XXX the parent ChildList may only not be available for terminal serialization
            
            var cl = JSON.parse( pardata.ChildList); // by URI! this is a requirement for ID-less terminal to work (restored manually)
            if(! (self.name in cl)) {
                // push and store
                cl[self.name] = self.serID;
                stor.setChildList(self.parent.uri, JSON.stringify(cl));
            }
        }
        
        stor.close();
        onfinish && onfinish(self.serID);
    };
    
    var onGetSecError = function (exc) {
        onerror && onerror(exc);
    };

    // TODO: error checking (like it does not exist...)
    self.execf_thread(self.security.getSecurityState, [], onGetSec, onGetSecError, undefined, self.security); 
    //};
    
    /*
    var onGetStateError = function (exc) {
        // execute onerror
        onerror && onerror(exc);
    };
    */
    
    // second, get the security state
    //self.execf_thread(self.global.getState, [], onGetState, onGetStateError);
 
}

eos_om = {

    openFiles: function (vm, options, callback) {
        vm.cur_stack.my.v0 = undefined;
        var __cs = vm.cur_stack;
        var x2 = __cs.my.x2;
        if(typeof(options) == 'undefined') options = {};
        
        if( (typeof(callback) == "undefined") || callback == null || !(callback instanceof this.FunctionObject) )  { 
            
            vm.cur_stack.EXCEPTION = false;
            var _mystop = __jn_stacks.newId();
            vm.cur_stack.STOP = _mystop;

            var exec_f = function (data) {
                if( __cs.STOP != _mystop ) // means TIMEOUT already fired. Also, if it is != false then a serious programming error may be in place!!
                        return;
                
                // now prepare wrapped data
                var wrapped_data = [];
                var btemp;
                for(var i=0;i<data.length;i++) {
                    btemp = new BlobObject();
                    btemp.___blob = data[i].blob;
                    wrapped_data[i] = { name: data[i].name, blob: btemp };
                }
                
                x2.result = wrapped_data; // XXX this shit is because thats how CALL: gets the result :-(
                __cs.EXCEPTION = RETURN;
                __cs.STOP = false;
                __jn_stacks.start(__cs.pid);
            };
        } else {
            // run in non-blocking mode
            var exec_f = function (data) {
                // now prepare wrapped data
                var wrapped_data = [];
                var btemp;
                for(var i=0;i<data.length;i++) {
                    btemp = new BlobObject();
                    btemp.___blob = data[i].blob;
                    wrapped_data[i] = { name: data[i].name, blob: btemp };
                }
                // TODO: use vm.execf_thread instead of start_new_thread defined at global :-\
                vm.global.start_new_thread(callback, [wrapped_data]);
            };

        }
        
        desktop = google.gears.factory.create('beta.desktop');
        desktop.openFiles(exec_f, options);
    },



    release: function (__tihs, setit) {
        // first, search if we're in the list?
        if(typeof(setit) == 'undefined') setit = true;
        for(var i=0; i<__eos_serial.length; i++) {
            if(__eos_serial[i] == __tihs) {
                    __eos_serial.splice(i,1);
                    break;
            }
        }
        setit && __eos_serial.push(__tihs); // the topmost object to be swapped out first...    
        
        // always request serialize then
        eos_om.serialize(__tihs);
    },
    
    serialize: function (vm) {
        /*
        for(var i=0; i<__eos_serial_weak.length; i++) {
            if(__eos_serial_weak[i] == vm) {
                    __eos_serial_weak.splice(i,1);
                    break;
            }
        }
        */
        __eos_serial_weak.push(vm); // the topmost object to be swapped out first...    
        if(__SERIALIZER.vm) {
            var dummy = function () {};
            var onerr = function (e) {
                __SERIALIZER.vm.ErrorConsole.log("serialized thread died with exception: "+e);
            }
            __SERIALIZER.vm.execf_thread(__SERIALIZER.fn, [], dummy, onerr, 5);
        }
    },
    
    register_serializer: function (vm, fn) {
        __SERIALIZER = {vm: vm, fn: fn};
    },
    
    listObjects: function () {
        var ro = [];
        for(ob in __eos_objects) {
            ro.push(__eos_objects[ob].uri); 
        }
        return ro;        
    },

/*
   getReleaseList: function () {

        var ro = [];
        
        var i=0
        for(i=0; i< __eos_serial.length; i++) {
            ro.push(__eos_serial[i].uri); 
        }
        
        return ro;
    },
    
    getSerializeList: function () {

        var ro = [];
        
        var i=0
        for(i=0; i< __eos_serial_weak.length; i++) {
            ro.push(__eos_serial_weak[i].uri); 
        }
        
        return ro;
    },
*/  
    createChild: function (__tihs, name, typeURI, secURI, DOMElement) {
        // make sure it is possible to pass any object reference via LIPC
        var myst = __jn_stacks.newId();
        var cs=__tihs.cur_stack;
        
      
        if(name in __tihs.childList) {
            __tihs.cur_stack.EXCEPTION = THROW;
            __tihs.cur_stack.my.x2.result = "duplicate child name";
            return;
        }
        if(name.toString().indexOf("/") != -1) {
            __tihs.cur_stack.EXCEPTION = THROW;
            __tihs.cur_stack.my.x2.result = "child name may not contain slash";
            return;
        }
        if( (typeof(typeURI) != "string") && !(typeURI instanceof String)) {
            __tihs.cur_stack.EXCEPTION = THROW;
            __tihs.cur_stack.my.x2.result = (new __tihs.global.TypeError("TypeURI must be a string")); 
            return;
        }

        if( (typeof(secURI) != "string") && !(secURI instanceof String)) {
            __tihs.cur_stack.EXCEPTION = THROW;
            __tihs.cur_stack.my.x2.result = (new __tihs.global.TypeError("SecurityURI must be a string")); 
            return;
        }
        
        cs.STOP = myst;
        cs.EXCEPTION = false;

        //console.log("Me is "+__tihs.name+" request createObj to ~");
        //eos_execURI(__tihs, "~", "createObject", [name, typeURI, secURI, DOMElement]);
        
        var onok = function(rs) {
            var type_src = rs.result;
            var onok = function (rs) {
                var sec_src = rs.result;
                // TODO HERE -> test and go on to rq signing!! mb. replace eos_execURI with kIPC
                // now create the object!
                cs.STOP = false;
                cs.EXCEPTION = RETURN;
                cs.my.x2.result = 1;
                __jn_stacks.start(cs.pid);
                eos_createObject(__tihs, name, type_src, sec_src, __tihs.uri, typeURI, secURI, DOMElement);
            };
            var onerr = function (ro) {
                cs.EXCEPTION = THROW;
                if(ro.status == "EPERM") {
                   cs.my.x2.result = (new __tihs.global.SecurityError(ro.result)); 
                } else {
                   cs.exc.result = (new __tihs.global.Error(ro.result)); 
                }
                cs.STOP = false;
                __jn_stacks.start(cs.pid);
            };
            
            
            kIPC(__tihs, secURI, 'read', [], onok, onerr);
        };
        
        var onerr = function (ro) {
            
            cs.EXCEPTION = THROW;
            if(ro.status == "EPERM") {
               cs.my.x2.result = (new __tihs.global.SecurityError(ro.result)); 
            } else {
               //cs.my.x2.result = (new __tihs.global.Error(ro.result));
               cs.exc.result =  (new __tihs.global.Error(ro.result));
//               cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
            }
            cs.STOP = false;
            __jn_stacks.start(cs.pid);
        };
        kIPC(__tihs, typeURI, 'read', [], onok, onerr);
         
    },


    getReleaseObj: function (i) {
      if(i >= __eos_serial.length) return null;
      return __eos_serial[i].uri; 
    },
    
    getSerializeObj: function (i) {
       if(i >= __eos_serial_weak.length) return null;
       return __eos_serial_weak[i].uri; 
    },

    delReleaseObj: function (uri) {
        var i=0
        for(i=0; i< __eos_serial.length; i++) {
            if(uri == __eos_serial[i].uri ) {
                __eos_serial.splice(i, 1);
                return;
            }
        }
    },
    
    delSerializeObj: function (uri) {
        var i=0
        for(i=0; i< __eos_serial_weak.length; i++) {
            if(uri == __eos_serial_weak[i].uri ) {
                __eos_serial_weak.splice(i, 1);
                return;
            }
        }
    },

    getReleaseLength: function () {
        return __eos_serial.length;
    },
    
    getSerializeLength: function () {
       return __eos_serial_weak.length;
    },

    kconfig: function (vm, p, v) {
        if(typeof(v) != 'undefined') {
            for(var i=0; i<vm.kconfig_w.length; i++) {
                if(p == vm.kconfig_w[i]) { 
                    KCONFIG[p] = v;
                    return v;
                }
            }
            return undefined;
        } else {
            for(var i=0; i<vm.kconfig_r.length; i++) {
                if(p == vm.kconfig_r[i]) return KCONFIG[p];
            }
            return undefined;            
        }
    },
    
    kbind: function (vm, childName, bindList, kconfig_r, kconfig_w) {
        // DOC 'no such child' is exception!
        if(!(childName in vm.childList)) {
            vm.cur_stack.EXCEPTION = THROW;
            vm.cur_stack.my.x2.result = "object not found by URI";
            return;
        }
        var ch = vm.childList[childName];
        for(var i=0; i<bindList.length; i++) {
            ch[bindList[i]](); // DOC this is dangerous kernel method!!
        }
        // now SET the kconfig access strings
        ch.kconfig_r = kconfig_r; // TODO error checking here (if kconfig_ list is incorrect
        ch.kconfig_w = kconfig_w;
    },
    
    "include": function (__tihs, src_uri, sstack) { 
        // TODO: DOC: XXX: should an include timeout or not??
        // DOC: includes only once
        if(!__tihs.includes) __tihs.includes={};
        if(src_uri in __tihs.includes) return;
        __tihs.includes[src_uri] = true;
        // ABI: sstack is a special stack to push to (for iframe includes)
        if(!sstack) {
            __tihs.cur_stack.EXCEPTION = false;
            __tihs.cur_stack.my.v0 = undefined;
            
            // set up a stop execution flag
            var _mystop = __jn_stacks.newId();
            __tihs.cur_stack.STOP = _mystop;
            var __cs = __tihs.cur_stack;
        } else {
			var __cs = sstack;
		}
        
        var exec_f = function (rs, obj) {
            var data = rs.result;
            // like evaluate, but push!
            if(!sstack && __cs.STOP != _mystop ) // means TIMEOUT already fired. Also, if it is != false then a serious programming error may be in place!!
                    return;
            // TODO HERE: add task if stack is not yet init; go another path for task specified
            //      ... __jn_stacks.add_task(this, g_stack, this.nice, this.throttle);
            try {
                var _p = parse(data, src_uri, 0);
                
                if(!sstack) {
                    //__cs.stack.unshift({n: _p, x: __cs.exc, pmy: {}}); // virtually 
                    __cs.push(S_EXEC, {n: _p, x: __cs.exc, pmy: {}}); // append it to the 'end' of execution stack
                }
                else {
                    sstack.stack.unshift({n: _p, x: __cs.exc, pmy: {}}); // virtually 
                    if(!sstack.pid || sstack.stack.length == 1)   
                            __jn_stacks.add_task(__tihs, sstack, __tihs.nice, __tihs.throttle);
                    sstack.queueSize--; // XXX see jsdom2: how sstack is set up in setAttribute; also see jsdom how window.addEventListener & onload work
                    
                }
            } catch (e) {
                if(!sstack) {
                    __cs.EXCEPTION = THROW;
                    __cs.exc.result = e;// TEST THIS!!
                } else {
                    __tihs.ErrorConsole.log("include exec error! "+e+" Line: "+e.lineNumber+" File: "+e.fileName);
					__tihs.ErrorConsole.log(e);
                }
            }
            
            if(!sstack) {
                __cs.STOP = false;
                //__tihs.step_next(__cs);
                __jn_stacks.start(__cs.pid);
            } else {
                sstack.pid && __jn_stacks.start(sstack.pid);
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
            if(!sstack && __cs.STOP != _mystop ) // means TIMEOUT already fired
                    return;
                    
            if(!sstack) {
                __cs.EXCEPTION = THROW;
                var ex = new __tihs.global.InternalError("include('"+src_uri+"') failed with exception: "+rs.result);
                ex.status = rs.status;
                __cs.exc.result = ex;

                __cs.STOP = false;
                //__tihs.step_next(__cs);  
                __jn_stacks.start(__cs.pid);              
            } else {
                var ex = new __tihs.global.InternalError("include('"+src_uri+"') failed with exception: "+rs.result);
                ex.status = rs.status;
                __tihs.ErrorConsole.log(""+ex);
            }
        };
        
        kIPC(__tihs, src_uri, "read", [], exec_f, onfail);
        
    },
    
    deleteChild: function (vm, name) {
        var r = eos_deleteChild(vm, name);
        var cs = vm.cur_stack;
        var x2 = cs.my.x2;
        if(r == -3) {
            cs.EXCEPTION = THROW;
            cs.exc.result = new vm.global.Error("object not found by URI");
        } else if (r < 0) {
            cs.EXCEPTION = THROW;
            cs.exc.result = new vm.global.Error("delete object error code "+r);        
        }
        return r;
    },
    
    changeSecurityURI: function (vm, newURI) {
        vm.SecurityURI = newURI;
        // now clean security object; 
        vm.security_backup = vm.security;
        vm.security_backup_global = vm.global.security;
        vm.security = {ipc:{}, object: vm.sec_object};
        
        // attach it to global
        vm.global.security = vm.security;
        // lock the VM Inbound-IPC
        // XXX TODO: lock the outbound IPC!
        vm.global.initIPCLock.goflag = 0;
        // load new code into it {in a thread?}
        // XXX DOC: the object may LOCK until restarted if new security fails?
        // XXX: do we need to stop all stacks for a period here??
        var exec_f = function (rs, obj) {
            var data = rs.result;
            // now run thread!
            var t_ok = function () {
                vm.global.initIPCLock.goflag = 1;
            };
            
            var t_err = function (e) {
                vm.ErrorConsole.log("changeSecurityURI security code error! "+e+" Line: "+e.lineNumber+" File: "+e.fileName);
                vm.ErrorConsole.log(e);
                vm.security = vm.security_backup;
                vm.global.security = vm.security_backup_global;
                vm.global.initIPCLock.goflag = 1;
            };
            
            try {
                vm.evaluate_thread(data, newURI, 0, t_ok, t_err);
            } catch (e) {
                t_err(e);
            }
        };
        

        var onfail = function (rs) {
            vm.ErrorConsole.log("changeSecurityURI security code failed to fetch from this URI "+newURI+" Reason: "+rs.status+" : "+rs.result);
            vm.security = vm.security_backup;
            vm.global.security = vm.security_backup_global;
            vm.global.initIPCLock.goflag = 1;
        };
        
        kIPC(vm, newURI, "read", [], exec_f, onfail);

    }
}


// WARNING! API CHANGE - CHECK THE KERNEL METHODS API FOR PREDICTABILITY
function eos_deleteChild(vm, name) {

    // possible scenarios:
    // 1. the parent(vm) and child are real RAM objects
    // 2. parent is fake ramobject, child is real RAM
    // 4. parent fake, child serialized (via recursive call from here)
    // 5. parent serialized, child serialized
    // 6. parent serialized, child real RAM

    // we should be serialization-aware now.
    if (typeof(vm) == "number") { // parent is serialized, name is either real or serialized
        vm = {serID: vm}; // be very accurate.. work only with serial ref!
    } 
    
    if (!vm.global) { // parent is fake, name is real or ser
        // get the vm childList from serialized state

        var stor = getFixedStorage();
        if(!stor) {
            // impossible scenario happened!!!
            __eos_objects["terminal"].ErrorConsole.log("deleteChild: impossible scenario happened: object not found in storage "+vm.uri+" "+name);
            return -1;
        }
        var cl = JSON.parse( (stor.getChildList(vm.serID)).ChildList); 
        if(! (name in cl)) {
            __eos_objects["terminal"].ErrorConsole.log("deleteChild: impossible scenario happened: child not found in stored parent "+vm.uri+" "+name);
            stor.close();
            return -2;
        }
        vm.childList = cl; // set virtual CL
        stor.close();
    }

    // get child
    
    var ch = vm.childList[name];
    if(!ch) {
        __eos_objects["terminal"].ErrorConsole.log("deleteChild: child not found in cl "+vm.uri+" "+name);
        //vm.cur_stack.my.x2.result = -3; // set an exception?? // another impossible scenario
        return -3;
    }
    // first, try to attach running child, if any
    if(typeof(ch) == "number") {
        for(var ob in __eos_objects) {
            if(__eos_objects[ob].serID == ch) {
                ch = __eos_objects[ob];
                break;
            }
        }
    } 
    
    if(typeof(ch) == "number") {
        // here, if the search for running child failed, we should be able to delete sleeping child
        // with all of it subchildren, if appropriate
        // for this task we will make ch a fake parent for children
        // and load childList from storage
        var stor = getFixedStorage();
        if(!stor) return -4; // shit. won't deal
        ch = {name: name, serID: ch, uri: vm.uri+"/"+name};
        ch.childList = JSON.parse( (stor.getChildList(ch.serID)).ChildList);
        stor.close();
    } 

    // force-delete all sub-child objects of a selected child, including serialized ones (???)
    // now, ch has been found, we may continue to recursively deleting
    // XXX this is a heavy RECURSIVE algorithm: may OOM if a large subtree is deleted!!! need a more accurate deletion
    for(var cch in ch.childList) {
        //if(cch == "__defineProperty__") continue; // FUCK XXX FUCK FUCK
        eos_deleteChild(ch, cch); 
    }

    
    // stop all stacks of a child silently
    if(ch.global) {
        var hs = ch.has_stacks();
        var j;
        if(hs) {
            // forget the stacks and all the shit
            var newss = [];
            for(j=0;j<__jn_stacks.stacks_sleeping.length;j++)
                if(__jn_stacks.stacks_sleeping[j].vm != ch)
                     newss.push(__jn_stacks.stacks_sleeping[j]);
            __jn_stacks.stacks_sleeping = newss;
            newss = [];
            for(j=0;j<__jn_stacks.stacks_running.length;j++)
                if(__jn_stacks.stacks_running[j].vm != ch)
                    newss.push(__jn_stacks.stacks_running[j]);
            __jn_stacks.stacks_running = newss;
        }
    }
    
    // clean CSS stylesheets
    if(vm.childList[name].cssRules) {
        for(var i=0; i<vm.childList[name].cssRules.length; i++) {
            
            try { // XXX TODO: BAD, this may fail to accomplish
                if (document.styleSheets[0].cssRules) {
                    document.styleSheets[0].deleteRule(vm.childList[name].cssRules[i]);
                } else {
                    document.styleSheets[0].removeRule(vm.childList[name].cssRules[i]); // IE
                }
            } catch (e) {
                vm.ErrorConsole.log("deleteChild: failed to remove stylesheet entry due to error: " +e);
            }
        }
    }
    
    // TODO: clean DOM tree (??)
    // DOC: CSS stylesheets are cleared, while the generated DOM tree is not

    // delete from vm (incl. fake)
    delete vm.childList[name];

    // delete last reference in __eos_objects
    
    delete __eos_objects[ch.uri]; // may silently fail

    var stor = getFixedStorage();
    if(!stor) return 0; // nono..
    if(vm.serID > 0) {
        // serialize new CL automatically if real .global here?? TODO decide on that ->
        if(!vm.global) stor.setChildList(vm.serID, JSON.stringify(vm.childList)); // access by serID is faster...
    }
    if(ch.serID > 0) {
        // delete child from storage
        stor.remove(ch.serID);
    }
    stor.close();
    if(window.google) {
        var ls = google.gears.factory.create("beta.localserver");
        ls.removeStore(ch.uri.split("/").join("."));
    }
    

    return 0;
}


Jnaric.prototype.bind_om = function () {
    // bind object model to VM global
    var __tihs = this;
    this.ErrorConsole.id=this.uri+": ";
    //delete this.global.fetchUrl; // should be done by security!
    //delete this.global.load;
 
 
    this.kconfig_r = ['init', 'terminal_id', 'host', 'run']; // access nothing DOC this! <- the only method to get terminal_id
    this.kconfig_w = [];
    
    this.security = {ipc:{}}; // empty security
    this.global.security = this.security;
    this.security.changeSecurityURI = function (newURI) {
        return eos_om.changeSecurityURI(__tihs, newURI); // no return, no block
    }
    
    this.global.object = {name: this.name, version: this.VERSION};
    this.global._object = this.global.object; // backup object...
    //this.global.Object = this.global.object; // backup object...
    this.global.object.ipc = {};
    this.global.object.data = {}; // the TQLW
    
    this.global.object.uri2id = Jnaric.prototype.uri2id;
    // XX timeout is optional -  if the 'timeout' is hit it is not necessary that the method does not get successfully executed on the callee side
    this.global.execURI = function(sUri, sMethod, lArgs, iTimeout) {
        eos_execURI(__tihs, sUri, sMethod, lArgs, iTimeout);
    };
    this.global.object.execURI = this.global.execURI;
    
    this.global.__ipc = this.global.object.ipc;
    //this.global.__ipc_doc = {};
    // this.global.__child = {}; // DELETE THIS!!

    this.global.object.createChild = function(name, typeURI, secURI, DOMElement) {
        eos_om.createChild(__tihs, name, typeURI, secURI, DOMElement);
    };
/*
        // make sure it is possible to pass any object reference via LIPC
        if(name in __tihs.childList) {
            __tihs.cur_stack.EXCEPTION = THROW;
            __tihs.cur_stack.my.x2.result = "duplicate child name";
            return;
        }
        //console.log("Me is "+__tihs.name+" request createObj to ~");
        eos_execURI(__tihs, "~", "createObject", [name, typeURI, secURI, DOMElement]); 
    };
*/
    //this.global.createChild = this.global.object.createChild;
    
    
    this.global.object.deleteChild = function(name) {
        
        eos_om.deleteChild(__tihs, name);
    };
    //this.global.deleteChild = this.global.object.deleteChild;
    
    
    this.global.object.linkChild = function(name, URI) {
        if(name in __tihs.childList) {
            __tihs.cur_stack.EXCEPTION = THROW;
            __tihs.cur_stack.exc.result = "duplicate child name";
            return;
        }
        
        __tihs.childList[name] = URI;
    };
    
    //this.global.linkChild = this.global.object.linkChild;



    this.global.object.enumerateChildren = function() {
        //var x2 = __tihs.cur_stack.my.x2;
        var r = [];
        for(ob in __tihs.childList) {
            //if(ob != "__defineProperty__") r.push(ob);
            r.push(ob);
        }
        //x2.result = r;
        return r;
        //__tihs.cur_stack.EXCEPTION = RETURN;
        //__tihs.cur_stack.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: __tihs.cur_stack.my.myObj});
        
    };
    //this.global.enumerateChildren = this.global.object.enumerateChildren;

    
    this.global.object.getMyURI = function(a) {
        if(a) return "/"+KCONFIG["terminal_id"] + __tihs.uri.slice(1);    
        return __tihs.uri;        
    };
    this.global.object.getMyAbsoluteURI = function() {
        //return KCONFIG["terminal_id"] + __tihs.uri.split("~",1)[1]; // to remove ~ or fail :-\       
        return "/"+KCONFIG["terminal_id"] + __tihs.uri.slice(1);     
    };    
    this.global.object.getMyTypeURI = function(a) {
        if(a && __tihs.TypeURI.charAt(0) == "~") return "/"+KCONFIG["terminal_id"]+__tihs.TypeURI.slice(1); 
        return __tihs.TypeURI;        
    };
    this.global.object.getMySecurityURI = function(a) {
        if(a && __tihs.SecurityURI.charAt(0) == "~") return "/"+KCONFIG["terminal_id"]+__tihs.SecurityURI.slice(1); 
        return __tihs.SecurityURI;        
    };


    //this.global.getMyURI = this.global.object.getMyURI;

    this.global.object.release = function(setit) { // TODO document this: true - set the flag, false = do not release
        eos_om.release(__tihs, setit);
        // return nothing...
    };
    //this.global.release = this.global.object.release;

    this.global.object.serialize = function() { // request serialization XXX it may not be possible though to serialize
        // XXX DISCUSS whether to remove method or report if serialization is impossible??
        eos_om.serialize(__tihs);
    };
    this.global.object.isSerialized = function() { // request serialization XXX it may not be possible though to serialize
        return (__tihs.serID > 0);
    };
    //this.global.serialize = this.global.object.serialize;
    
    this.global.object.destroyInstance = function () {
        // delete myself and all my children - from my parent
        // XXX: API change - detect errors via return value
        eos_deleteChild(__tihs.parent, __tihs.name);
    };
    this.global.object.destroy = this.global.object.destroyInstance;
    //this.global.destroyInstance = this.global.object.destroyInstance;
    
    this.global.object.kconfig = function (p, v) {
        return eos_om.kconfig(__tihs, p, v);
    };
    
    this.global.object["include"] = function (srcURI) { // safari bug
        // kernel extension to include code into current stack and scope
        return eos_om["include"].call(this, __tihs, srcURI, false);
    };
    this.global["include"] = this.global.object["include"];
    
    // getMethodList ?? describeObject ?? or is it security code??
    
    
    
    this.global.BlobBuilder = function () {
        if(window.google && google.gears) {
            this.___builder = google.gears.factory.create("beta.blobbuilder");
        } else {
            this.___bloblist = [];
        }
    };
    this.global.object.BlobBuilder = this.global.BlobBuilder;
    inject_proto(this.global.BlobBuilder, BlobBuilder); // XXX check for prototype-safety!!!
    // protos...
    this.global.BlobBuilder.prototype.getAsBlob = BlobBuilder.prototype.getAsBlob;    
    this.global.BlobBuilder.prototype.append = BlobBuilder.prototype.append;
    
    this.global.JSON = {
        stringify: function (value, replacer, space) {
            // in fact, we cannot yet use replacer at all.. DOC
            if(typeof(replacer)==="function") return JSON.stringify(value, replacer, space);
            else { 
                if(JSON.native_stringify) return JSON.native_stringify(value, replacer, space);
                else return JSON.stringify(value, replacer, space);
            }
        },
        parse: function (text, reviver) {
            return JSON.parse(text, reviver);
        }
    };
    if(getFixedStorage()) {
        this.global.object.canSerialize = true;
    } else {
        this.global.object.canSerialize = false;
    }
    
    
    // DOC: bind only 'standard' global methods to security.object
    this.security.object = this.sec_object = {};
    for(var ob in this.global.object) {
        this.security.object[ob] = this.global.object[ob];
    }    
    
    this.global.object.JNEXT = { // DOC this!!
        init: function jnext_init () {
            if(!window.JNEXT) {
                JNEXT = new JNEXT_();
                return !!objJSExt.sendCmd; // WARNING! non-standard??!!
            } else {
                return !!objJSExt.sendCmd;
            }
        },
        UdpSocket: function UdpSocket () {
            return (new JNEXT_UdpSocket(__tihs));
        }, 
        AsyncLineSocket: function AsyncLineSocket () {
            return (new JNEXT_AsyncLineSocket(__tihs));
        }
    };
    
    this.bind_storage(); // always try to bind storage
    
};

// TODO: move this utility function out of here!
function inject_proto (fn, donor) {
    for(var ob in donor.prototype) {
        fn.prototype[ob] = donor.prototype[ob];
    }
}

// TODO: prettify this
function FixedStorage() {}

FixedStorage.prototype.___init = function (vm) {
    this.___vm = vm;
    this.___ls = google.gears.factory.create("beta.localserver");
    var storname = this.___vm.uri.split("/").join(".");
    this.___r = this.___ls.openStore(storname);
    if(!this.___r) this.___r = this.___ls.createStore(storname);
};

FixedStorage.prototype.remove = function (fname) {
    this.___r.remove(this.___vm.uri+"/~blobs/"+fname);
};

FixedStorage.prototype.rename = function (fname1, fname2) {
    this.___r.rename(this.___vm.uri+"/~blobs/"+fname1, this.___vm.uri+"/~blobs/"+fname2);
};

FixedStorage.prototype.copy = function (fname1, fname2) {
    this.___r.copy(this.___vm.uri+"/~blobs/"+fname1, this.___vm.uri+"/~blobs/"+fname2);
};

FixedStorage.prototype.isStored = function (fname) {
    return this.___r.isCaptured(this.___vm.uri+"/~blobs/"+fname);
};

FixedStorage.prototype.storeBlob = function (blob, fname, contenttype) {
    var b = blob.___blob;
    if(!b) throw "storeBlob: first argument must be a BlobObject with Gears installed";
    
    if(contenttype) this.___r.captureBlob(b, this.___vm.uri+"/~blobs/"+fname, contenttype);
    else this.___r.captureBlob(b, this.___vm.uri+"/~blobs/"+fname);
};

FixedStorage.prototype.getAsBlob = function (fname) {
    if(this.isStored(fname)) {
        var wrapped_blob = new BlobObject();
        wrapped_blob.___blob = this.___r.getAsBlob(this.___vm.uri+"/~blobs/"+fname);
        return wrapped_blob;
    }
    else return null;
};

FixedStorage.prototype.getObjectUrl = function (fname) {
    return this.___vm.uri+"/~blobs/"+fname;
};

FixedStorage.prototype.getAllHeaders = function (fname) {
    if(this.isStored(fname)) return this.___r.getAllHeaders(this.___vm.uri+"/~blobs/"+fname);
    else return null;
};

Jnaric.prototype.bind_storage = function () {

/*
object.FixedStorage class
   void          remove(string fname) : remove [object_url]/fname
   void          rename(string fname1, string fname2) : fname1 -> fname2
   void          copy(string fname1, string fname2) 
   boolean       isStored(string desc)
   void          storeBlob(Blob blob, string fname, string optContentType) : with Content-Type header
   string        getHeader(string fname, string hname) : reserved. see Gears
   string        getAllHeaders(string fname) : -..-
   Blob          getAsBlob(string fname) : only if stored, otherwise fail
   string        getObjectUrl(string fname) : return the URL of stored object, otherwise fail.
*/

    if(!window.google || !google.gears) { // see below
        return;
    }
    
    var self = this;
    
    this.global.object.FixedStorage = function () {
        this.___init(self); 
    };
    inject_proto(this.global.object.FixedStorage, FixedStorage);
    

    // WARNING: the following should not be here!
    // but since we use Gears check it is OKAY here for now...
    
    this.global.object.openFiles = function (options, callback) {
        eos_om.openFiles(self, options, callback);
    };
    
};

Jnaric.prototype.bind_terminal = function () {
    var __tihs = this;
    
    for(var ob in KCONFIG) {
        this.kconfig_r.push(ob);
        this.kconfig_w.push(ob);
    }
    
    for(var ob in KCONFIG_DEFAULTS) {
        this.kconfig_r.push(ob);
        this.kconfig_w.push(ob);
    }
    
    this.GRANTED = true; // grant changing NICE, etc...  - see jsexec.js; also need more nice control of children so TODO
    //                                   (name, code, sec,   rq.object_uri, typeURI, secURI, DOMElement)
    
    // TODO: move entirely to object.?
    // REMOVE THESE -> UNUSED AND DANGEROUS!
    this.global.__createObject = function(name, stype, ssec, parentURI, typeURI, secURI, DOMElement) {
        
        return eos_createObject(__tihs, name, stype, ssec, parentURI, typeURI, secURI, DOMElement);
    };
    this.global.object.createObject = this.global.__createObject;

    this.global.object.kbind = function (childName, bindList, kconfig_r, kconfig_w) {
        return eos_om.kbind(__tihs, childName, bindList, kconfig_r, kconfig_w);
    };

    
    this.bind_serial();    

};

Jnaric.prototype.bind_serial = function () {
    var __tihs = this;

    // serialization is only accessible if it is possible to get storage!
    var ts = getFixedStorage();
    
    if(ts) {
        this.global.object.serializeURI = function (URI, blocking) {
            if(typeof(blocking) == 'undefined')
                blocking = false;
            var cs = __tihs.cur_stack;
            var x2 = cs.my.x2;
             
            if(blocking) { // stop the stack
                cs.EXCEPTION = false;
                cs.STOP = true;
                // store the result here
            }
            // get the object by uri
            var vm = __eos_objects["terminal"].getChild(URI.split("/")); // XXX warning! do not wake up just to serialize?!
            

            var cbOK = function (rs) { // callback on OK
                // set the result
                if(blocking) {
                    x2.result = 1;
                    
                    // the following is the procedure just to release the stack
                    cs.EXCEPTION = RETURN;
                    cs.STOP = false;
                    //cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
                    __jn_stacks.start(cs.pid);
                }
                
            };
            
            var cbERR = function (rs) {
                if(blocking) {              
                    cs.EXCEPTION = THROW;
                    // var ex = rs;
                    //ex.result = rs.result;
                    cs.exc.result = rs;
                    cs.STOP = false;
                    __jn_stacks.start(cs.pid);   
                }
                
            };
            
            if(blocking) { 
                vm.serialize(cbOK, cbERR);
            } else {
                return vm.serialize(cbOK, cbERR);
            }
        };
        
        // TODO: how do we denote that the object has been or has not been serialized / swapped out??
        this.global.object.swapoutURI = function (URI, force) {
              
            var vm = __eos_objects["terminal"].getChild(URI.split("/"));
            
            return vm.swapout(force);    // XXX DOC strange API here! (see .swapout)
        };
        
        this.global.object.listSystemObjects = eos_om.listSystemObjects;
        
        this.global.object.getReleaseLength = eos_om.getReleaseLength;
        this.global.object.getSerializeLength = eos_om.getSerializeLength;
        this.global.object.getReleaseObj = eos_om.getReleaseObj;
        this.global.object.getSerializeObj = eos_om.getSerializeObj;
        this.global.object.delReleaseObj = eos_om.delReleaseObj;
        this.global.object.delSerializeObj = eos_om.delSerializeObj;
        
        this.global.object.register_serializer = function (fn) {
              eos_om.register_serializer(__tihs, fn);
        };
        ts.close();
    }
    delete ts;

};


