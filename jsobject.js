// Be completely free to do what you want, create what you want, share what you want, customize, modify, invent...
// Whatever.
// Unlock your mind. jeneric. together we are free.

/*

TODO createChild should return status codes if the direct error occured (for example, 'duplicate name')
TODO WARNING cyclic forward may cause hang!
TODO throw exceptions if not enough arguments for createChild supplied: secURI etc.
    max_depth in terminal and in a hub (LIPC parser and WIPC parser - add response flags)
    also, hint for a hub: collect some stats? ;-)
TODO remove push TRUE everywhere!! it is useless and really BAD! (as it thrashes the stack)
XXX __defineProperty__ is in the childList too!!! get rid of it EVERYWHERE now!!!!
TODO standardise error reporting everywhere!!!
TODO wake up only childlist, if required!
TODO response did not reach recipient(caller) in HUB and HERE! work out the issue - e.g. the caller disappeared suddenly

- HOLD() to hold down all the activity until "CONTINUE" presed (will stop the scheduler)
  (for those willing to get maximum from their machine that is being accessed or is sharing files, 
  for a period of time)

+ duplicate object names issue !! in createChild and others!
    + createChild( ... )
        - TODO adding a non-serialized child should drop the serID or smth?? // like the CLEAN flag? or is this ever a problem?
    + deleteChild(chldname)
        + recursive delete!
    + linkChild(name, URI) - only for link/forward requests 
    + enumerateChildren -- this may use the same request as vm.getChildList (see vm.serialize())
    + getMyURI
   check if anything left non-recursive and accessing internal child list defined in global
+ serialization
    + vm.serialize()
        + implement vm.getChildList()
        + rethink of how an object may be serialized without its children? just serialize how it is...
    + vm.swapout()
        + do not sserialize() if not all objs in childList have the serID... -> notify the caller via callback
          LATER: cache childlist not to wake up parent upon every request
                POSSIBLE BUG: we will need to repush __eos_serial at eos_wakeObject as in execIPC
    + object wakeup (see vm.getChild)
        + trg = eos_wakeObject(this, lURI[0], serID); 
        + also swap out some (inactive?) objects with no awake children no stacks, serializable and requested serialization
            - see the wakeObject method; modified abi
        + if objlimit is reached
    
    + releaseMemory([true/false]) - inform the system that the object may (or not??) be released from memory
        + the system, however, should check and if only no stacks are run/sleep 
         TODO and DOM is unused
    + destroyInstance() - recursively delete object and all children; remove from parent
        + in fact, run eos_deleteChild from parent's instance
         TODO: cleanout DOM
         and TODO - cleanout DOM in other operations invoking delete
    + execIPC: modify last access time; objects that request serialize should delete themselves and re-push __eos_serial
    + objects serialization api for terminal object
        + full access to serialization methods
        - work with ref wrappers or direct refs?
          TODO: how do we denote that the object has been or has not been serialized / swapped out??
                this is essential since the object MAY be forcely swapped out by wakeObject -- or change this behaviour??
    + think of how to feed some security flags to an object by default?? or init it by initSecurity IPC call? 
            like who's init the security - he is the 'owner' or whoever is in there.
            or make a request to a dumb method via validateRequest? that should set up the security properties
             feed with parent-defined request...
            + NO!! just create the security with parent set to full access (security-dependent setting); then the parent may
            set anything, including 'owner' flags that may be trusted from within inside the terminal.
    - some basic software!
    LATER - requestSerialize(blocking = false), return true or false whether the serialization is possible (or was completed)
          (optionally) wait until the serialization actually occurs and gets finished
          ... put this object in the first place for serialization ???
    ************** the following is library rt
    - readSerialized(startByte=0, length=-1) return the last serialized state of the object (or null if no one given) - or a part of it
    - restoreAsChild(name, StringOrFixedStorageRef) - restore a child from a given string or fixed storage file reference
    - getMyAbsoluteURI() or getTerminalURI() or getAbsoluteURI(URI)[return abs URI of a given relative URI]
    - reattach/move() calls!

(test the shit to run)

    
- fixed data (aka file, SQLite blob) access methods -- if available!
    - define in bind_om method
    - createBlob()
    - deleteBlob(ref)
    - enumerateBlobs()
    - readBlob(offset, length)
    - wrteBlob(offset, dataStr)
        these will likely need to fragment the data into pieces like 100kb or so
    - serialize/deserialize attached Blob's

        
- URI HUB
    - orbited connection
    - minimal HUB logic required (including data read-split & upload write-split for browsers that dunot have Gears)
        like "swapping object..." then "uploading object... %% %%"? and serialize the uploader!
        
- createObject security problem -- the object may alter TypeURI & SecURI that may compromise local security -- reimplement it in a system call
     
     
// TODO: many times the result parser is reimplemented :-( think of some generalization??
TODO cache object typeURIs and secURIs, aggressively, to dramatically reduce server hit!
     (fetch some version or checksum info before??)
// - some wrappers at bind_XX are not required since 'this' is unused??
XXX createChild/createObject is extremely expensive procedure... and insecure!
*/

/*

+ createChild/createObject problem
  + bind_dom problem - when an object wants to bind to inside of itself??
- regChild ? folder object type? like include("/jnaric/bin/foldertype"); -- will set up current object with folder type
  ?? gears caching of include?
  - flush cache method ( cflush(what = "all"); what = uri/include )
+ getMethodList problem -- mean as describeObject problem (security model method!)
- serialization problem TODO
    - any object may request immediate serialization
        - it is up to the kernel to decide on whether to perform that (based on access statistics, etc.)
    - if the object is serialized, the parent link will be replaced by a string!! with a special char @[OID]  
      OID is the id of the serialized object; the kernel should take care of dealing with that (getChild method)
      all the refs cleaned, the object deleted
    - each eos_wakeObject should be supplemented by a check for serialization flags list if it is time to do hibernation
    - each createObject should also...
    - everything to check for Gears availability. If the object is serialized but Gears not available (or the object 
      is unavailable in any other reason) - set an explanatory exception (object temporarily unavailable)
      this should be the case where current direct terminal link is not found at HUB: TODO new status & messages
    - hibernate to server?
- serialize/wakeup DOM enabled objects later todo...    
    


- local files shared to the internet repository (drop the files into Gears)
- dynamic library loading ??? COOL! 8) 8)
        




SERIALIZATION IMPL:
  kernel system methods:
    - vm.serialize() - saves object representation to a fixed storage
    - vm.swapout() - replaces all memory refereces of the object by the fixed storage reference
  kernel calls:
    - requestSerialize(blocking = false), return true or false whether the serialization is possible (or was completed)
      (optionally) wait until the serialization actually occurs and gets finished
    - readSerialized(startByte=0, length=-1) return the last serialized state of the object (or null if no one given) - or a part of it
    - restoreAsChild(name, StringOrFixedStorageRef) - restore a child from a given string or fixed storage file reference
... and, there are very many cases when the serialization may fail
but all that shit is nesessary!
XXX there may be several local storage implementations: gears (preferred), silverlight/db4o, flash (ugly)


CLONE:
  - cloning is supported only by serialized objects; the last serialized state is fetched in this case



SYSTEM WAKEUP:

  E: create termnal object
  E: load security model
  T: run all the needed init routines
  E: attach a saved childList, if applicable
  T: read a fileObject and set the childlist to a serialized objlist from local machine 
      TODO kernel call attachLocalObjects() or something for the terminal process
      there may be serializable object branches and non-serializable
        any object that may request serialization on a non-serialized branch will not be serialized
        or will be terminated upon system DB garbage collection
  E: any objects may be swapped out and appear serialized
      XXX instruction for local URI cache: take care of serialization 8926 174 74 34 pavel
  E: serialize objects marked for serialization in a priority order
<< APPROVED

----------

  E: create or wake up the terminal object
    - XXX each childList change should serialize at least the child list - if possible
  T: receive the message we've been deserialized; act as needed
  E: serialize objects regularly (when the scheduler idles for a while) XXX a new NICEness state "idle" or "full idle"
      - like the system is idle and it predicts no actions - run the full idle task (does not guarantee to ever run)
          - this is not NICE but a call similar to setTimeout - setDelayed or setIdle kernel call
      - additionally, if the action hasn't been in X seconds, run it
  ??? have the opportunity to choose where to serialize to. This means that this set of procedure is invalid :-)
  - the object may issue "serialize me and all my children"
  - then there is the choice either to serialize to server or locally 
    - this choice should be made by user
    - it should be controllable for the terminal object

  ENTER NAME AND PASSWORD
  CHOOSE WHAT PROFILE TO LOG ON TO:
  1. HOME: profile name stored on local computer for that username XXX the user MAY alter username but security policy will not
     allow to directly compromise that
  2. OFFICE
  3. ENTERTAINMENT
  [the ability to switch profiles or to access profiles? there is]

so, DB fields: username, profile, ...?

*/






/*
 x=getObjectURI( URI )
 x may represent either a local object, or a local sub(s)-object, or any other remote object

EXAMPLE:
  if x is a 'library' object:
  // first, load the library and create the code instance:
  try {
      //x = getObjectURI("../GUIlib");
      x = getObjectType("svoyaset/home/grandrew/guilib");
  } catch (e) {
      x = createChild("GUIlib", "svoyaset/home/grandrew/guilib", "svoyaset/security/deskapp");
  }
  
  // or, if we're using some proprietary object(???) -- it is impossible to use proprietary objects right now since
  // we cannot link to cross-DOM...
  // ... unless someone writes code to convert REPR->DOM and makes the app work with REPRs
  //     the convertion code should be loaded into code tree like eval_obj(getObjectURI("my/software/path").readObj())
  //     then use: r=newRepr(); etc...
  
  r = x.createInstance(myDomElement, myJSONspec);
  x.bindEvent(r, getMyURI(), "myEvent"); // (object?)instance, str_URI, str_method

// getChild method??
*/




// TODO: some max for requests?

__eos_requests = {}; // object storing all the waiting requests
__eos_objects = {};
__eos_comet = {getID: function() {return 1;}}; // TODO
__eos_serial = []; // list of objects to be freed




function eos_execURI(vm, sUri, sMethod, lArgs, timeout) {
    // this is a blocking call, so block the VM thread first
    var cs = vm.cur_stack;
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
    
    var lURI = sUri.split("/");
    if(lURI[0] == "") { // means this is root HUB request
        // create a request
        // ... and callback
        if(vm.DEBUG) vm.ErrorConsole.log("in execURI... request for HUB");
        eos_hubRequest(vm, cs, sUri, sMethod, lArgs, timeout, mystop); 
        
    } else {
        // TODO: URI caching
        if(vm.DEBUG) vm.ErrorConsole.log("in execURI... getting child");
        // execute locally
        var dest = vm.getChild(lURI);
        if(dest == null) {
            // child not found...
            cs.EXCEPTION = THROW;
            cs.exc.result = new vm.global.InternalError("object not found by path "+sUri);
            cs.STOP = false;
            return;
        }
        
        if(typeof(dest)=="string") { // means we're redirect to ... eos_execURI back 
            if(vm.DEBUG) vm.ErrorConsole.log("in execURI... again execURI!");
            eos_execURI(vm, dest, sMethod, lArgs); // we're taking advantage of the 'GIL' in js engine
        } else { // means it is a VM instance, so execute the request
            // create the request object
            if(vm.DEBUG) vm.ErrorConsole.log("in execURI... child is: "+dest.name);
            var rq = {
                id: __jn_stacks.newId(), 
                user_name: __eos_objects["terminal"].global.my_username ? __eos_objects["terminal"].global.my_username : "", // XXX can be undefined..??
                terminal_name: __eos_objects["terminal"].global.my_terminal ? __eos_objects["terminal"].global.my_terminal : "",
                terminal_id: __eos_comet.getID(), // TODO: persistent comet connection ID!
                // optional but mandatory for local calls
                object_name: vm.name,
                object_type: vm.type,
                object_uri: vm.uri,
                // now the actual params
                method: sMethod,
                args: lArgs
            };
            if(vm.DEBUG) vm.ErrorConsole.log("Request from "+vm.uri+" to "+sUri+" meth "+sMethod);
            // for the callbacks, save the stack, set the result and continue stack as in fetchUrl()
            var x2 = cs.my.x2;
            var cbOK = function (rs) { // callback on OK
                // set the result
                if(vm.DEBUG) vm.ErrorConsole.log("in execURI... execIPC cbOK");
                x2.result = rs.result;
                
                // the following is the procedure just to release the stack
                cs.EXCEPTION = RETURN;
                cs.STOP = false;
                cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
                __jn_stacks.start(cs.pid);
                
            };
            
            var cbERR = function (rs) {
                if(vm.DEBUG) vm.ErrorConsole.log("in execURI... execIPC cbERR");
                if (rs.status == "EEXCP") {
                    cs.EXCEPTION = THROW;
                    var ex = new vm.global.InternalError("execURL failed with exception: "+rs.result);
                } else if (rs.status == "EPERM") {
                    cs.EXCEPTION = THROW;
                    var ex = new vm.global.SecurityError(rs.result);
                } else {
                    cs.EXCEPTION = THROW;
                    var ex = new vm.global.InternalError("execURL failed with UNKNOWN status: "+rs.status);
                }
                ex.result = rs.result;
                cs.exc.result = ex;
                cs.STOP = false; // XXX TODO: MAY it release foreign LOCK??? SHIT!!
                __jn_stacks.start(cs.pid);   
                
            };
            if(vm.DEBUG) vm.ErrorConsole.log("in execURI... doing execIPC!");
            dest.execIPC(rq, cbOK, cbERR); 
        }

            
    }
    
    
}







function eos_hubRequest(vm, cs, sUri, sMethod, lArgs, timeout, _mystop) {

    // TODO: return something if the HUB connection is not ready!?!?!
    //       deal with sudden hibernation???
    // TODO: ensure the message is delivered if the TIMEOUT for execURI is not set
    
    // will do everything needed, including waking the stack up
    var x2 = cs.my.x2;
    // create request object
    var rq = {
        id: __jn_stacks.newId(), 
        //user_name: __eos_objects["terminal"].global.my_username ? __eos_objects["terminal"].global.my_username : "", // XXX can be undefined..??
        //terminal_name: __eos_objects["terminal"].global.my_terminal ? __eos_objects["terminal"].global.my_terminal : "",
        terminal_id: __eos_comet.getID(), // TODO: persistent comet connection ID!
        // optional but mandatory for local calls
        object_name: vm.name,
        object_type: vm.type,
        object_uri: vm.uri,
        // now the actual params
        uri: sUri,
        method: sMethod,
        args: lArgs
    };
    
    __eos_requests[rq.id] = {request: rq, stack: cs, context: x2, vm: vm}; 
    
    /////////////////////////////////////////////////////////////////
    // all the below does not apply to STOMP/Comet method ->>
    
    
    //
    
    //var dr = new DataRequestor();
    
    //dr.addArg(_POST, "request", JSON.stringify(rq)); // document to never use __defineProperty__
    
    // onload just okay; we will wait for the responce via COMET connection??
    // watch for the result; if the result is not status="WAIT" then use the result
    // else - wait for the result via comet
    
    /*
    dr.onload = function (data, obj) {
        if(!cs.STOP) return;
        var rs = JSON.parse(data);
        if(rs.status == "OK") {
            x2.result = rs.result;
            // the following is the procedure just to release the stack
            cs.EXCEPTION = RETURN;
            cs.STOP = false;
            cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
            __jn_stacks.start(cs.pid);
            delete __eos_requests[rq.id];
            
        } else if (rs.status == "EEXCP") {
            cs.EXCEPTION = THROW;
            var ex = new vm.global.InternalError("execURL failed with exception: "+rs.result);
            ex.result = rs.result;
            cs.exc.result = ex;
            cs.STOP = false;
            __jn_stacks.start(cs.pid);   
            delete __eos_requests[rq.id];        
            
        } else if (rs.status == "EPERM") {
            cs.EXCEPTION = THROW;
            var ex = new vm.global.SecurityError(rs.result);
            ex.result = rs.result;
            cs.exc.result = ex;
            cs.STOP = false;
            __jn_stacks.start(cs.pid);   
            delete __eos_requests[rq.id];        
        
        } else if (rs.status == "WAIT") {
            // XXX always return this status in case the server has received the request successfully!!
            // else means that we will have to wait for result to arrive via COMET intrf
            // pass... ?
        } else {
            // unknown status received
            cs.EXCEPTION = THROW;
            var ex = new vm.global.InternalError("execURL failed with UNKNOWN status: "+rs.status);
            ex.result = rs.result;
            cs.exc.result = ex;
            cs.STOP = false;
            __jn_stacks.start(cs.pid);   
            delete __eos_requests[rq.id];

        }
    };
    
    dr.onfail = function (status, txt ) {
        if(!cs.STOP) return;
        // raise an exception with status
        cs.EXCEPTION = THROW;
        var ex = new vm.global.InternalError("execURL failed with status: "+status);
        ex.status = status;
        cs.exc.result = ex;
        cs.STOP = false;
        __jn_stacks.start(cs.pid);   
        delete __eos_requests[rq.id];
    };
    
    dr.getURL( "/urihub" );
    
    */
    
    // Set a general timeout anyways...
    // TODO: general timeout should be dependent on data receipt???
    //       if there is no data receiving??? wtf?
    //       XXX XXX XXX need another mechanism to remove locks 
    //       TODO: ping server regularly! (or the session will expire and be deleted)
    ///// var to = 60000; 
    if(typeof(timeout) == "number") {
        //console.log("setting timeout");
        var tmf = function () {
            //console.log("timeout hit!!");
            if(cs.STOP != _mystop) return;
            //console.log("timeout hit!!2");
            cs.EXCEPTION = THROW;
            var ex = new vm.global.InternalError("execURL failed with TIMEOUT");
            ex.status = "TIMEOUT";
            cs.exc.result = ex;
            cs.STOP = false;
            __jn_stacks.start(cs.pid);   
            //delete __eos_requests[rq.id];
            hubConnection.abort(rq.id);
            
        };
        setTimeout(tmf, timeout); // document that timeout is milliseconds
    }
    
    hubConnection.send(rq);

}

function eos_rcvEvent(rq) {

   //rq = JSON.parse(data);
    
    if(rq.result || rq.status) {
        // this is result arrived;
        if(!(rq.id in __eos_requests)) return; // silently fail? XXX this is okay for pinger

        var x2 = __eos_requests[rq.id]["context"];
        var cs = __eos_requests[rq.id]["stack"];
        var vm = __eos_requests[rq.id]["vm"];

        if(rq.status == "OK") {   
            x2.result = rq.result;
            // the following is the procedure just to release the stack
            cs.EXCEPTION = RETURN;
            //cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: cs.my.myObj});
            
        } else {

            cs.EXCEPTION = THROW;
        
            if (rq.status == "EEXCP") {
                var ex = new vm.global.InternalError("execURL failed with exception: "+rq.result);
                ex.result = rq.result;
            } else if (rq.status == "ECONN") { // XXX unused

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
        }

        cs.STOP = false;
        __jn_stacks.start(cs.pid);
        delete __eos_requests[rq.id];


        
    } else {
    
        if(rq.status && rq.status == "EDROP") {
            return; // XXX do something? take actions???
        }
        // this is request; take care of running it and then returning it back to the server with appropriate ID
        var t = __eos_objects["terminal"];
        // parse the URI
        var lURI = rq.uri.split("/");
        
        // TODO: URI caching
        
        var dest = t.getChild(lURI); 
        
        if(dest == null) {
            // child not found...
            rq.result = "object not found by path "+rq.uri;
            rq.status = "EEXCP";
            hubConnection.send(rq);
            return;
        }
        
        // TODO HERE
        if(typeof(dest) == "string") {
            // redir 
            // 1. locally
            // 2. globally
            if(dest.charAt(0) == "/") {
                rq.uri = dest;
                rq.status = "REDIR"; // instruction for HUB
                //rq.result = ""; // to indicate we're NOT;) result
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
        if(self.DEBUG) self.ErrorConsole.log("in execIPC... validateOK");
        // 2. if validated to OK, run the method using the same fn        
        if(!result) {
            cbERR({id: rq.id, status: "EPERM", result: "permission denied"});
        }
        
        if(rq.method in self.global.object.ipc) { // __ipc

            var cbo2 = function (result) {
                // if(typeof(result) == "undefined") result = -999999999;
                // TODO: introduce UNDEFINED transfer?
                cbOK({id: rq.id, status: "OK", result: result});
            };
            
            var cbe2 = function (ex) {

                if(self.DEBUG) self.ErrorConsole.log("method IPC call failed with exception: "+ex); // for debug only
                cbERR({id: rq.id, status: "EEXCP", result: "method failed with exception: "+ex});
            };


            self.execf_thread(self.global.object.ipc[rq.method], [rq].concat(rq.args), cbo2, cbe2); // TODO: execf with ref as parameter
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
    
    // THE object ready state is set via security method: objectReady = true;
    if(this.global.initIPCLock || this.global.wakeupIPCLock) { // means we're in the state of initialization
        // wait for the main stack to issue onfinish??
        // TODO switch to Semaphores interface!
        if(this.DEBUG) this.ErrorConsole.log("in execIPC... lock there! waiting");
        if(this.onfinish) { 
            var old_onf = this.onfinish;
        } else {
            var old_onf = function () {};
        }
        // XXX use semaphores (external?!) !! object main stack may not finish at all
        var fflag = true; // tmp workaround
        this.onfinish = function () {
            if(!fflag) return; // tmp workaround
            fflag = false;
            old_onf();
            self.execIPC(rq, cbOK, cbERR);
        }
        
        // XXX temporarily workaround: use timeout to avoid deadlock
        var tmf = function () {
            if(!fflag) return;
            fflag = false;
            if(this.global.initIPCLock || this.global.wakeupIPCLock) {
                cbERR({id: rq.id, status: "EEXCP", result: "object init lock timeout"});
                return;
            }
            self.execIPC(rq, cbOK, cbERR);        
        };
        // wait for onfinish for 8 seconds
        setTimeout(tmf, 8000);
        
        // XXX may cause process deadlock here
        // TODO: some sort of a timeout here
        return;
    }
    
    if(this.global.validateRequest) {

        this.execf_thread(this.global.validateRequest, [rq], cbo, cbe); 
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

Jnaric.prototype.getChild = function (lURI) {
    // a method to return child
    
    if(lURI.length == 0) return this;

    if(lURI[0] == ".") {
        lURI.shift();
        return this.getChild(lURI);
    }
    else if(lURI[0] == "..") {
        lURI.shift();
        return vm.getParent().getChild(lURI); 
    }
    else if(lURI[0] == "~") {
        
        lURI.shift();
        return __eos_objects["terminal"].getChild(lURI);
    }
    else if(lURI[0] == "") { // skip...
        lURI.shift();
        return this.getChild(lURI);
    }

    
    //var trg = this.global.__child[lURI[0]];
    var trg = this.childList[lURI[0]];
    if(typeof(trg) == "undefined") return null;

    //if( (typeof(trg) == "string") && (trg.charAt(0) == "@") ) {
    if(typeof(trg) == "number") {
        // this means we have a serialized object, wake it up!
        if(!KCONFIG.autorestore) return null; // XXX work in progress...
        trg = eos_wakeObject(this, lURI[0], trg); 
        if(trg == -1) return null; // XXX in case we failed to get the object due to wakeup fail :-\
        // this may take a while though... TODO some optimization and prioritization
        // or make this a user-level task
    }


    if(lURI.length == 1) {
        // return our child directly
        //if(trg.___vm) return trg.___vm;
        //else return trg; // return whatever is there
        return trg; // either a string or an instance...
    }
    
    lURI.shift();
    return trg.getChild(lURI);

};

Jnaric.prototype.getParent = function () {
    return this.parent; // TODO: always set 'parent' !!!
};

/*
function eos_createChild_unpriv(vm, name, typeURI, secURI) {
    
    // first, stop the stack as usual
    var cs = vm.cur_stack;
    cs.EXCEPTION = false;
    cs.STOP = true;
    // store the result here
    var x2 = cs.my.x2;
    
    
    // the result of this method is a wrapper object (see getChild and ___ property protection)

    
    var f = function (){};
    __eos_objects["terminal"].execIPC(,f,f);
    
    
    
}
*/

function eos_wakeObject(parent, name, serID) {
    // XXX: delay the request until the objects get deserialized!!! this is accomplished via execIPC - check that!
    // TODO: what if the object does not exist?? - system error!!
    
    // first, get the data
    
    var stor = getFixedStorage();
    
    if(!stor) {
        // gears is inaccessible, return anerror
        // XXX return -1 on any error - this will instruct getChild to return 'object unavailable' error
        return -1;
        // and call onerror, if applicable (??? TODO decide on this)
        
    }
    
    
    var self = this;
    
    /*
    var db = google.gears.factory.create("beta.database");
    db.open("jeos3-ss");
    
    var rs = db.execute("SELECT OID,TypeURI,SecurityURI,SecurityProp,ChildList,Data FROM Serialize WHERE OID=?", [serID]);
    
    var dump = {};
    for(var i=0;i<rs.fieldCount();i++) {
        ob[rs.fieldName(i)] = rs.field(i);
        rs.next();
    }
    rs.close();
    */
    
    var dump = stor.getByID(serID);
    stor.close();
    
    var obj = new Jnaric();
    
    obj.onfinish = function () {
        // we should call setState and setSecurityState on finish
        
        // THESE methods should drop the ready flag immediately and restore it later on to avoid possible requests from being run on obj
        // TODO TODO XXX need another method to identify that th object is not ready here yet
        //               maybe it is a variable set to WakingUp in global namespace or something... (wakeupIPCLock && initIPCLock ?)
        
        
        // now add to parent?? -- no, we've added earlier
        
    };
    
    ////////////////////////////
    // copypaste part of eos_createObject
    // URI text, TypeURI text, SecurityURI text, SecurityProp text, ChildList text, Data blob, Created int, Modified int)");
    obj.name = name;
    obj.TypeURI = dump.TypeURI;
    obj.SecurityURI = dump.SecurityURI;
    obj.parent = parent;
    obj.uri = obj.parent.uri+"/"+name; 
    obj.serID = dump.OID;
    obj.childList = JSON.parse(dump.ChildList);
    
    obj.global.initIPCLock = true; // THIS to be flushed by security validateRequest method init
    obj.global.wakeupIPCLock = true; // THIS to be flushed by a call to setSecurityState method
    
    obj.bind_dom(); // TODO bind to fake DOM element since it is currently impossible to serialize DOM-enabled elements
    obj.bind_om(); // bind the protected EOS object model
    
    obj.evaluate(sec_src); // XXX this should set the initIPCLock to false
    obj.evaluate(type_src);

    /////////////// end copypaste part
    var dummy = function () {};
    // TODO error reporting of wakeup process
    //    XXX or a deadlock may occur!
    // now feed the object with setState data
    
    obj.execf_thread(obj.global.setState, [JSON.parse(dump.Data)], dummy, dummy); 
    // XXX we do this in this order since 1. setSecurityState will release locks and 
    //    2. the serializable object IS to release main thread!! this is a requirement for it to serialize though..
    obj.execf_thread(obj.global.setSecurityState, [JSON.parse(dump.SecurityProp)], dummy, dummy); // XXX this should set the wakeupIPCLock to false
    // now feed the obj with setSecurityState data
    
    // now check & serialize-swapout somebody if appropriate
    if(KCONFIG.autoswapout && (__eos_objects.length > KCONFIG.MEMOBJECTS)) {
        // try to serialize-swapout somebody on the list of pretendents
        // TODO where to construct this list??
        // this is a list of objects that requested serialization and released themselves from memory
        var snew = [];
        for(var i=0; (i < (__eos_objects.length - KCONFIG.MEMOBJECTS)) && (i < __eos_serial.length); i++) {
            // should be the oldest accessed!
            var vmo = __eos_serial[i];
            
            // TODO HERE!!!!
            // REFRESH interval in KCONFIG!! -> for s_agent
            // different lists: the object READY for swapout and NOT!!!
            
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
    parent.childList[name] = obj;
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
    
    obj.onerror = function (ex) {
        vm.global.ErrorConsole.log("created child main thread died with exception: "+ex);        
    }; 
    
/*    
    obj.onfinish = function () {
    }; 
*/
    
    obj.name = name;
    obj.TypeURI = typeURI;
    obj.SecurityURI = secURI;
    obj.parent = __eos_objects["terminal"].getChild(parentURI.split("/")); // XXX sneaky place
    //console.log("getting parent of "+parentURI+" set to "+(obj.parent ? obj.parent.name : obj.parent));
    obj.uri = obj.parent.uri+"/"+name; 
    obj.serID = -1;
    obj.childList = {};
    obj.global.initIPCLock = true; // flush this by validateRequest init XXX
    
    obj.bind_dom(DOMElement); // TODO bind to protected wrapped DOM or to fake DOM element
    obj.bind_om(); // bind the protected EOS object model
    
    obj.evaluate(sec_src); // the single threaded nature here ensures we're not going to receive onfinish not in time
    obj.evaluate(type_src);

    //obj.execIPC();

    obj.parent.childList[name] = obj;
    __eos_objects[obj.uri] = obj; // DUP name issue???
    
}



Jnaric.prototype.getChildList = function () {
    // return the list of children FOR SERIALIZATION!!!
    var r = {};
    var good = true;
    for (ob in this.childList) {
        if(typeof this.childList[ob] == "number" || typeof this.childList[ob] == "string") {
            r[ob] = this.childList[ob];
        } else { // XXX this does not nessesarily indicate there is a non-serialized object; this may indicate a programming error instead!
            if(this.childList[ob].serID > -1) r[ob] = this.childList[ob].serID;
            else good = false;
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
    
    if(hs) {
        // forget the stacks and all the shit
        var newss = [];
        for(j=0;j<__jn_stacks.stacks_sleeping.length;j++)
            if(__jn_stacks.stacks_sleeping[j].vm != this)
                 newss.push(__jn_stacks.stacks_sleeping[j]);
        __jn_stacks.stacks_sleeping = newss;
        newss = [];
        for(j=0;j<__jn_stacks.stacks_running.length;j++)
            if(__jn_stacks.stacks_running[j].vm == this)
                newss.push(__jn_stacks.stacks_running[j]);
        __jn_stacks.stacks_running = newss;
    }
    
    this.parent.childList[this.name] = this.serID;
    delete this.parent.childList[this.name];
    delete __eos_objects[this.uri];
    return 0;
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
    this.db.execute("create table if not exists Serialize (URI text UNIQUE, TypeURI text, SecurityURI text, SecurityProp text, ChildList text, Data blob, Created int, Modified int)");
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
    this.db.execute("INSERT INTO Serialize (URI, TypeURI, SecurityURI, SecurityProp, ChildList, Data, Created, Modified) VALUES (?,?,?,?,?,?,?,?)", 
                            [data.URI, data.TypeURI, data.SecurityURI, data.SecurityProp, data.ChildList, data.Data, (new Date()).getTime(), (new Date()).getTime()]); 
                    
    // now get and set the oid of the shitty thing
    var oidr = this.db.execute("SELECT OID FROM Serialize WHERE URI=?", [self.uri]);
    var iid = parseInt(oidr.field(0)); // not sure parseInt is required here
    oidr.close();
    return iid;
};

GearsStore.prototype.getByID = function (serID) {
    var rs = this.db.execute("SELECT OID,TypeURI,SecurityURI,SecurityProp,ChildList,Data FROM Serialize WHERE OID=?", [serID]);
    
    var dump = {};
    for(var i=0;i<rs.fieldCount();i++) {
        ob[rs.fieldName(i)] = rs.field(i);
        rs.next();
    }
    rs.close();
    return dump;
};

GearsStore.prototype.getByURI = function (uri) {
    var rs = this.db.execute("SELECT OID,TypeURI,SecurityURI,SecurityProp,ChildList,Data FROM Serialize WHERE URI=?", [uri]);
    
    var dump = {};
    for(var i=0;i<rs.fieldCount();i++) {
        ob[rs.fieldName(i)] = rs.field(i);
        rs.next();
    }
    rs.close();
    return dump;
};


GearsStore.prototype.remove = function (ID) { // remove from storage...
    // may fail here??
    this.db.execute("DELETE FROM Serialize WHERE OID=?", [ID]); 
};


GearsStore.prototype.close = function () {
    // may fail here??
    this.db.close();
};


function getFixedStorage() {
    if(!window.google) {
        return undefined;
    }
    return (new GearsStore());
}

// WARNING! different error handling API here
// WARNING! need all children to be serialized too
//          may result in a deadlock for calling stack if not all children provide the capability of serialization
Jnaric.prototype.serialize = function (onfinish, onerror) {
    // return null if serialization is not possible
    
    // now issue the call to 'getState' method (if any) to get the object representation
    
    // okay, now init the Gears DB and save the result via a call
    var stor = getFixedStorage();
    if(!stor) {
    // if(!window.google) {
        // gears is inaccessible, return anerror
        return -1;
        // and call onerror, if applicable (??? TODO decide on this)
        
    }
    
    var self = this;
    var oChildList = self.getChildList();
    
    // make sure we are clean to serialize
    // WARNING: do something more adequeate here?
    if(!oChildList.good) onerror("object not ready - some children not serialized, skip to another");
    
    var sChildList = JSON.stringify(oChildList.list);
    // first, get the object data state
    
    var onGetState = function (resultData) {
        var onGetSec = function (resultSec) {
            // TODO: another database to cache typeURIs and secURIs (the objects they're linked to WW-> they may be links)
            // TODO: 2 storage methods: Database and Filelike            

            // TODO: serialization error still possible here!!! - REPORT!!
            //try { // ... etc

            // 1. the object is serialized already -> search by id (this.serID) - OR - ERROR !!!
            if(self.serID > 0) {
                if(stor.checkID(self.serID)) {
                    // update me
                    var data = {
                        SecurityProp: JSON.stringify(resultSec),
                        Data: JSON.stringify(resultData),
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
                        Data: JSON.stringify(resultData),
                        ChildList: sChildList,
                        TypeURI: self.TypeURI,
                        SecurityURI: self.SecurityURI,
                        URI: self.uri
                    };

                    seld.serID = stor.insert(data);
            }
            stor.close();
            onfinish && onfinish(self.serID);
        };
        
        var onGetSecError = function (exc) {
            onerror && onerror(exc);
        };
        
        self.execf_thread(self.global.getSecurityState, [], onGetSec, onGetSecError); 
    };
    
    var onGetStateError = function (exc) {
        // execute onerror
        onerror && onerror(exc);
    };
    
    // second, get the security state
    self.execf_thread(self.global.getState, [], onGetState, onGetStateError); 
}

eos_om = {
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
        for(var i=0; i<__eos_serial_weak.length; i++) {
            if(__eos_serial_weak[i] == vm) {
                    __eos_serial_weak.splice(i,1);
                    break;
            }
        }
        __eos_serial_weak.push(vm); // the topmost object to be swapped out first...    
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
            for(var i=0; i<vm.kconfig_w; i++) {
                if(p == vm.kconfig_w[i]) { 
                    KCONFIG[p] = v;
                    return v;
                }
            }
            return undefined;
        } else {
            for(var i=0; i<vm.kconfig_r; i++) {
                if(p == vm.kconfig_r[i]) return KCONFIG[p];
            }
            return undefined;            
        }
    },
    
    kbind: function (vm, childName, methodStruct, kconfig_r, kconfig_w) {
        // DOC 'no such child' is exception!
        if(!(childName in vm.childList)) {
            vm.cur_stack.EXCEPTION = THROW;
            vm.cur_stack.my.x2.result = "object not found by URI";
            return;
        }
        var ch = vm.childList[childName];
        for(var ob in methodStruct) {
            ch.global.object[ob] = methodStruct[ob]; // DOC overwrite if nesessary...
        }
        // now SET the kconfig access strings
        ch.kconfig_r = kconfig_r; // TODO error checking here (if kconfig_ list is incorrect
        ch.kconfig_w = kconfig_w;
    }
}


// WARNING! API CHANGE - CHECK THE KERNEL METHODS API FOR PREDICTABILITY
function eos_deleteChild(vm, name) {
    // get child
    var ch = vm.childList[name];
    if(!ch) vm.cur_stack.my.x2.result = -1; // set an exception??
    
    // first, force-delete all sub-child objects of a selected child
    for(cch in ch.childList) {
        eos_deleteChild(ch, cch);
    }
    
    // stop all stacks of a child silently
    for(var j=0; j<__jn_stacks.stacks_running.length;j++) {
        if(__jn_stacks.stacks_running[j].vm == vm) {
            __jn_stacks.stacks_running.splice(j,1);
        }
    }

    for(var j=0; j<__jn_stacks.stacks_sleeping.length;j++) {
        if(__jn_stacks.stacks_sleeping[j].vm == vm) {
            __jn_stacks.stacks_sleeping.splice(j,1);
        }
    }
    
    // delete from vm
    delete vm.childList[name];
    // delete last reference in __eos_objects
    delete __eos_objects[ch.uri];
}


Jnaric.prototype.bind_om = function () {
    // bind object model to VM global
    var __tihs = this;
 
    this.kconfig_r = ['init', 'terminal_id']; // access nothing
    this.kconfig_w = [];
    
    this.global.object = {name: this.name, version: this.VERSION};
    this.global._object = this.global.object; // backup object...
    this.global.object.ipc = {};
    
    
    // XX timeout is optional -  if the 'timeout' is hit it is not necessary that the method does not get successfully executed on the callee side
    this.global.execURI = function(sUri, sMethod, oData, timeout) {
        eos_execURI(__tihs, sUri, sMethod, oData, timeout);
    };
    this.global.object.execURI = this.global.execURI;
    
    this.global.__ipc = this.global.object.ipc;
    //this.global.__ipc_doc = {};
    // this.global.__child = {}; // DELETE THIS!!

    this.global.object.createChild = function(name, typeURI, secURI, DOMElement) {
        // make sure it is possible to pass any object reference via LIPC
        if(name in __tihs.childList) {
            __tihs.cur_stack.EXCEPTION = THROW;
            __tihs.cur_stack.my.x2.result = "duplicate child name";
            return;
        }
        //console.log("Me is "+__tihs.name+" request createObj to ~");
        eos_execURI(__tihs, "~", "createObject", [name, typeURI, secURI, DOMElement]); 
    };
    //this.global.createChild = this.global.object.createChild;
    
    
    this.global.object.deleteChild = function(name) {
        
        eos_deleteChild(__tihs, name);
    };
    //this.global.deleteChild = this.global.object.deleteChild;
    
    
    this.global.object.linkChild = function(name, URI) {
        if(name in __tihs.childList) {
            __tihs.cur_stack.EXCEPTION = THROW;
            __tihs.cur_stack.my.x2.result = "duplicate child name";
            return;
        }
        
        __tihs.childList[name] = URI;
    };
    
    //this.global.linkChild = this.global.object.linkChild;



    this.global.object.enumerateChildren = function() {
        //var x2 = __tihs.cur_stack.my.x2;
        var r = [];
        for(ob in __tihs.childList) {
            if(ob != "__defineProperty__") r.push(ob);
        }
        //x2.result = r;
        return r;
        //__tihs.cur_stack.EXCEPTION = RETURN;
        //__tihs.cur_stack.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: cs.exc, NodeNum: 0, pmy: __tihs.cur_stack.my.myObj});
        
    };
    //this.global.enumerateChildren = this.global.object.enumerateChildren;

    
    this.global.object.getMyURI = function() {
        return __tihs.uri;        
    };
    this.global.object.getMyTypeURI = function() {
        return __tihs.TypeURI;        
    };
    this.global.object.getMySecurityURI = function() {
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
    //this.global.serialize = this.global.object.serialize;
    
    this.global.object.destroyInstance = function () {
        // delete myself and all my children - from my parent
        eos_deleteChild(this.parent, this.name);
    };
    //this.global.destroyInstance = this.global.object.destroyInstance;
    
    this.global.object.kconfig = function (p, v) {
        return eos_om.kconfig(__tihs, p, v);
    };
    
    this.global.object.kbind = function (childName, methodStruct, kconfig_r, kconfig_w) {
        return eos_om.kbind(__tihs, childName, methodStruct, kconfig_r, kconfig_w);
    };
    
    // getMethodList ?? describeObject ?? or is it security code??
    
    // TODO: set this.parent on init
    
};

Jnaric.prototype.bind_terminal = function () {
    var __tihs = this;
    
    for(var ob in KCONFIG) {
        this.kconfig_r.push(ob);
        this.kconfig_w.push(ob);
    }
    
    this.GRANTED = true; // grant changing NICE, etc...  - see jsexec.js; also need more nice control of children so TODO
    //                                   (name, code, sec,   rq.object_uri, typeURI, secURI, DOMElement)
    this.global.__createObject = function(name, stype, ssec, parentURI, typeURI, secURI, DOMElement) {
        
        return eos_createObject(__tihs, name, stype, ssec, parentURI, typeURI, secURI, DOMElement);
    };
    
    
    // serialization is only accessible if it is possible to get storage!
    var ts = getFixedStorage();
    
    if(ts) {
        this.global.object.serializeURI = function (URI, blocking) {
            if(typeof(blocking) == 'undefined')
                blocking = false;
            
            if(blocking) { // stop the stack
                var cs = __tihs.cur_stack;
                cs.EXCEPTION = false;
                cs.STOP = true;
                // store the result here
                var x2 = cs.my.x2;
            }
            // get the object by uri
            var vm = __eos_objects["terminal"].getChild(URI); // XXX warning! do not wake up just to serialize?!
            

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
                    var ex = rs;
                    //ex.result = rs.result;
                    cs.exc.result = ex;
                    cs.STOP = false;
                    __jn_stacks.start(cs.pid);   
                }
                
            };
            
            if(blocking) { 
                __tihs.cur_stack.my.x2=vm.serialize(cbOK, cbERR);
            } else {
                return vm.serialize(cbOK, cbERR);
            }
        };
        
        // TODO: how do we denote that the object has been or has not been serialized / swapped out??
        this.global.object.swapoutURI = function (URI, force) {
              
            var vm = __eos_objects["terminal"].getChild(URI);
            
            return vm.swapout(force);    // XXX DOC strange API here! (see .swapout)
        };
        
        this.global.object.listObjects = eos_om.listObjects;
        
        this.global.object.getReleaseLength = eos_om.getReleaseLength;
        this.global.object.getSerializeLength = eos_om.getSerializeLength;
        this.global.object.getReleaseObj = eos_om.getReleaseObj;
        this.global.object.getSerializeObj = eos_om.getSerializeObj;
        this.global.object.delReleaseObj = eos_om.delReleaseObj;
        this.global.object.delSerializeObj = eos_om.delSerializeObj;
    }
    ts.close();
    delete ts;
};



