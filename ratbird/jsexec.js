/*  This file is part of jnaric.
    Copyright (C) 2009 Andrew Gryaznov <realgrandrew@gmail.com>
    Parts of the source (C) 2004 Brendan Eich <brendan@mozilla.org>
    See other authors in file AUTHOS

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License , or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; see the file COPYING.  If not, write to:
      The Free Software Foundation, Inc.
      59 Temple Place, Suite 330
      Boston, MA 02111 USA

    You may contact the author by:
       e-mail:  realgrandrew@gmail.com, a.gryaznov@svoyaset.ru
       
*************************************************************************/

/*

  TODO: 
    + Main Thread!
    + evaluate - unshift to MT
    + ExecutionContext.current - make right
    + EVAL - push(!!) to MT
      + deal with try/catch and ExecutionContext switch
      + check that for evaluate and evaluate_thread!
    . what is Activation? http://www.jibbering.com/faq/faq_notes/closures.html
    + (test run available tests)
    + internal log console/methods (
        + log (errors) to firebug console if it exists
            + auto-register ErrorConsole.log to console.log if firebug console detected
            + otherwise ErrorConsole.log will point to function that logs to ErrorConsole.messages array, logrotating!!!
            + ErrorConsole.size = 100 (lines by default)
        
        
    + avoid exception t_hrowing to outer space)
    + Stack trace seems to be incomplete!!
        - now stack trace is gabberish with tokenizer source
   * * *
    + testing suite
      + python script to create filelist (~800 files in mozilla js 1.5 test suite)
      + (++sequential) vm.load() method (ajax-fetch & evaluate(not thread version!))          based on DataRequestor
      + onfinish event: when main thread stack is exhausted
    + vm.load error reporting
    - test
      (... 797 tests)
      - take a closer look at Scope/181834
      - many native calls to jn compiler objects problems
      - Exceptions: say lineNumber and fileName at ErrorConsole
      - Exceptions: create a better trace (see MOZ Exceptions/errstack-001.js)
      - Exceptions: new native objects produce incorrect stack trace (see bug MOZ Exceptions/errstack-001.js)
      - dunno what to do with MOZ Exceptions/315147
      - array.concat
      - // "extensions/regress-348986.js" , // parser hangs 
      
    - other error reporting (like parser, DataRequestor were not loaded! (?!?!?!)
    
    - improve speed
    - improve parser
    - a new testing suite (url - OK/FAIL/ERROR (percentage))
        - NEXT: advanced testing suite with object registry? (to track progress: what tests were OK and what FAIL) ;-)
   * * *
    T+ onfinish is firead on finish and on error... this is WRONG! error != normal finish and canno be treated this way.
        T+ maybe on finish & error flag? (for testsuite purposes) -- done, needs testing
    T+ external scope bindings/unbind (  vm.bind_scope(x) // binds to (selected) namespace, otherwise - dont!  )
        + just minimalistic solution - see protected mode for advanced        
        T+ bind to namespace ?? (.bind_scope)
    + sleep() global method
    + setTimeout() global method
    + internal load() method (should behave as external load, but should do PUSH instead of UNSHIFT in evaluate)
    

    + nice and throttle (internal values) - tweak current task properties
      - user allowed values: -10..+19, total: -19..+19 (wtf?? noone is allowed to add nwegative increment excepto for root!)
      + start a new thread (add task) with nice based on current thread/main thread
        + nice: use up to 100% cpu time; fairly distribute among tasks
          + set the st.rt * nice_lvl
        + throttle: use up to 100% * throttle cpu time
          + reduce real rt for that task; always add the virtual rt value to st.rt

    
    + max total threads - general event stack. if evts > MAX_THREADS - wait; if evts_buff > MAX_BUF - drop new (drop old flag?);
        + just DROP if there are too many! (for now; also report an error to the console)
    + setTimeout() / clearTimeout() and setInterval() / clearInterval() - full spec
        ? internal setTimeout returns non-zero timer IDs
        TODO: add a scope argument of timer ID for the executing method?? would be very pleasable

    
    + start_new_thread (create new stack) (internal VM method) == internal setTimeout... effectively
        + TOTAL MAX NUMBER OF THREADS = 100!
        + see the totmaxnumber of threads issue with setTimeout!!
        + a faster algorithm of switching/nicing threads, a more predictable and preempting
        + more nice control
    + the start_new_thread pack: semaphores, etc -- just chech if there are any drawbacks of not implementing them in core.

///////////////////// no real need for this >>>
    - start_new_thread_dummy (rewrite)
        - create a new vm
        - bind vm to global namespace
        - run anonymous function (do not state it into vm) like (function (params))() (why not?? it is a new VM!)
        - can accept parameters ??? -> may define parameters at global scope vm.global
            in this case it will be "intermediate" scope since global bind.
///////////////////// <<< end_no real need for this 

    + comment out all __unnessesary__ verbosity

    ...
    + blocking and non-blocking (web) I/O
        - fetchUrl(url, args, callback, CALL_MODE)
          url: a URL
          args: arguments structure
          callback: null/undefined - for blocking request, other - for non-blocking [default will cause blocking rq]
          CALL_MODE: GET or POST, [default POST]

    
    
    
    
    + a test suite for our new methods
        + load
        + setTimeout / clearTimeout
        + setInterval / clearInterval
        + start_new_thread
        + ajax i/o
        - method to return overall(cross-vm) CPU usage - internal and external (to test the below)
        - nice (and everything that comes: inherited niceness, etc.)
             - including scheduler rsolution test, stress-test, etc.: like a.push(1) a.push(2) and count 1 and 2...
        - throttle

    -------------------------------------------------------------------------------------
    - The DOM security model should be developed here
    - 1. the denied DOM model
    -    (use only emulated access methods) - VERY slow but VERY secure and is a set-and-go solution
          BUT, alloing only some of the methods is generally a better idea since there are is no evidence
          if this or that method will be eventually added

    -  - SWF object restriction: http://blogs.adobe.com/stateofsecurity/2007/07/how_to_restrict_swf_content_fr_1.html
    -  - allowScriptAccess & allowNetworking
    
    - ability to bind onclick & other events (maybe a one-directional bind ?? 
        like can access through global but not vice-versa!: define connectors for methods in global)
    
    
    ...
    - protected mode (examples & methods)
        - bind events!
            - it is okay for events, but not for things like Array.sort ( my_coded_function ) - it is like I am to reimplement sort??
            - rebuild event object according to http://www.javascriptkit.com/jsref/event.shtml

        - jh (a very stupid javascript console) console methods

        - bind to DIV (.bind_dom(htmlelement))
            - rebuild 
                - document http://www.w3schools.com/htmldom/dom_obj_document.asp
                - navigator http://www.w3schools.com/htmldom/dom_obj_navigator.asp
                - window http://www.w3schools.com/htmldom/dom_obj_window.asp
                - location                
                - screen (return the width and height of the current)


        - script DOM injection ???? 
          - via innerHTML
          - via document.write
        - document.write (?? can rewrite itself!) (just dont support that method)

        - CSS ?? (do not allow the direct CSS insertion currently -- only through STYLE tag)
          todo for later on...

        - total VM memory consumption?
        - setInterval bomb! (setting interval of lower than X is not allowed for a non-priileged user)

    ...
    (another test suite update)
      - bind_dom
        - will add document,window,navigator,location,screen
      + bind_scope - DANGEROUS!!

      - (kernel access flags)



    - fast and secure JSON encoding/decoding methods
        - json test
    
    ...
    FULL OBJECT/SECURITY MODEL
    - IPC (object-bound)
        - PUSH protocol connection establishment methods (trusted server)
            - create request object
            - pass the request object to security checker
            - if the result is OKAY, pass on to VM
                - either a threading interface [ _IPC_METHODS.setSomething = doSomething; ]
                - or a buffer-and-block read request [ data = bindReadIPC("setSomething"); ]
        
        
        'L4-like security policy'
        - non-protected inter-child IPC
        - 'chief' supervised cross-child IPC (via URI path concept?)
          XXX this one can be achieved by using a minimal security policy (don't check for access if the messages 
          are coming from the object whose parent is our parent too. (that implies that parent check is open and fast too))
        'UNIX-like security policy'
        - (...)
        'STORAGE securit model' -- only objects of certain type (no code) are allowed to be created
        'Plan9-like security' http://plan9.bell-labs.com/sys/doc/auth.html
    - object serialization (hibernation)
    - server micro forwarder

    TODO: return [native code] for native methods toString...
          this is the way we will distinguish whether this is a user-defined method or not
          and decide whether to hibernate
          XXX we could detect it any other way ;-)
    
    - somehow count total vm object size
    - uptime?
    
    ...
    + BURST exec
    - other small CPU optimizations
      - profile and speed-up (see f=getValue each iteration at CALL:, for example)
      - narcissus parser bug (at least patch the parser for cross-browser compatibility)
      - remove e.g. .oldx notaion for CALL
      - stack.my...dotting is generally slow; passing "this" would be much faster
    - """ STRING """ notation support
    
    TAKE CARE OF 'DEBUG' VARIALBE - IT IS UNRELIABLY RELIED ON EVERYWHERE
    
    - browser compatibility Chrome/Safari/IE/(Opera)
    - browser re-emulation: version, etc.: IE must report as IE, Moz as moz, etc.
    - external library/script test (like Ext JS)
    
    - vm.destroy() method
    
    ... alpha 0.1 !
    
    
    
    
    - vm.abort()
    - vm.pause()
    - vm.interrupt(val) // to pass values to VM from outside
    - script debugging - watch () mechanism: internal and external
    
    - methods to get VM current free THREADS, STACK, etc. - internal and external bindings
    
    - advanced (hibernating) server

*/
 
/*
  CURRENT PROBLEMS:
    - function names as keywords are not allowed due to parser specs (BUG MOZ Lex/343675)
    - native methods requiring native compiled functions as parameters (like Array.sort(fn))
  
  
  - Built-in and new, modified object contents via FOR_IN
  
  (clean the code, alpha release)
*/

/*
  MID-TERM DEVELOPMENT
  - setTimeout
  - start_new_thread, other thread control methods
    - 'external' (for outer JS) AND 'internal' (for JS inside VM)
  - fork()
  - syncronous and asyncronous HTTPRequest (ajax)
  - VM version and other properties
  - the """ TEXT """ form
  - all the methods and properties of in-browser JS
  - .log2 errorconsole prototype method - make more intuitive use of log2 (check at rt if the log2 is defined)
  - a more reliable error protocol:
      - for AJAX events: load, fetchUrl: timeout, server_error
  - core httpRequest emulation
  - kernel object-compile methods
  - kernel hibernate methods (stop all timers, save all stacks and the object)
*/


/*
  FUTURE DEVELOPMENT:
  - onUnload object hibernate code: http://www.livelearncode.com/archives/11
  - vm 'driver' interface: to do things like process viewing, to kill process etc.:
      - implement local secure object store; attach methods to local system objects
  - burst exec
  - GC
  - SUBJIT compile to native JS (GC required)
  - IE optimization: see http://code.google.com/intl/ru/apis/v8/benchmarks.html (and IE statement limit problem for long-running scripts)
  - TraceMonkey optimization: see http://hacks.mozilla.org/2009/07/tracemonkey-overview/ (tend to create simple loops)
  - get rid of __defineProperty__ it does not work either;
  - dynamic scope? https://issues.apache.org/jira/browse/SLING-165 https://developer.mozilla.org/En/Rhino_documentation/Scopes_and_Contexts
  - webWorkers-alike API https://developer.mozilla.org/En/Using_web_workers - and wrapper for anyBrowser
  - HTML to JS DOM code converter? http://www.smelzo.it/html2js/
*/

/*
  SECURITY MODEL
  - user.appname
  - verify app code (CRC?)
  - remote calls executed as another user?? (another.appname)
  - central server has limited security schemes
  - local servers have computed security models
  
  
  - how can one program invoke another program??
*/

/*
    SUBJIT PROPOSAL
    - do not do context switching at every step: integrate with bursting...
    - new interpreter Node.type = JIT: instructs to run natively
    - run native method: JIT compiler will compile code 
        - to functions and use __methodname_locals to store local vars and __methodname_globals
        - or just clone/pass the entire scope tree inside __methodname_scope (??)
        - or JIT compiler will compile to string that could be evaluated accordingly 
    - or just do native "eval" - it is still faster
    - for sort() and other native run purposes:
      - sortInt() - AND - sortString() method: set the toString method?? smth like that
      - no calls; no loops (or compile a timer imto loops that if runs out of time will break task and instruct the VM to interpret everything instead)
    
    - avoid catch(e if e) constructs -- not supported by g.chrome
    - use yield in firefox; use WebWorkers of Google Gears in others
    - Safari?? Opera?? -- may have similar things
*/
DEBUG = 5; // > 2 = VERBOSE, 50ms delay, no bursting, JIT, etc.... >4 = wholy shit!!

__jn_stacks = {
    // the consts
    BURST_TOTAL: 45, // ms
    BURST_MIN: 10, // ms, 3-4 threads per tick; may be tweaked by the system on slow hardware
    SET_TIMEOUT: 50, // ms of gap between ticks; may be tweaked by the system on slow hardware

    // variables
    min_runtime: (new Date).getTime(),
    pid_counter: 1, // pid=0 is not allowed
    timer_id: null,
    idsource: 0,
    
    // the thread states
    stacks_running: [],
    stacks_sleeping: [],
    
    newId: function () {
        return ++this.idsource;
    },
    // methods
    add_task: function (vm, stack, nice, throttle) {
        // return pid of new process, set it to stack

        // XXX this becomes a very expensive function
        // first, count threads for that particular VM
        var i, counter = 0;
        for(i=0;i<this.stacks_sleeping.length;i++)
            if(this.stacks_sleeping[i].vm == vm) counter++;
        for(i=0;i<this.stacks_running.length;i++)
            if(this.stacks_running[i].vm == vm) counter++;
        
        
        if(counter > vm.MAX_THREADS) {
            vm.ErrorConsole.log("JNARIC Error: maximum amount of threads per this VM exceeded ("+counter+"); dropping thread creation");
            
            throw (new vm.global.InternalError("JNARIC Error: maximum amount of threads per this VM exceeded; dropping thread creation"));
            return null; // never reached
        }
        
        // TODO: security here??? / another exception thrown for security: SecurityError

        
        stack.pid = this.pid_counter++;
        stack.nice = nice;
        if(typeof(nice) == "undefined") var nice = 0;
        if(typeof(throttle) == "undefined") var throttle = 1;

        // inline convert min_runtime to string
        var rts = this.min_runtime+"";
        
        this.stacks_running.unshift({pid: stack.pid, rt: this.min_runtime, rt_s: rts, vm: vm, stack: stack,  nice: nice, throttle: throttle});
        
        // start the timer
        if(this.stacks_running.length == 1) {
            var __tihs = this;
            var _clf = function () {
                __tihs.tick();
            };
            clearInterval(this.timer_id);
            //setTimeout(_clf, 0);
            this.timer_id = setInterval(_clf, this.SET_TIMEOUT);
        } else {
            // start a watchdog timeout ??
            var _lmin = this.min_runtime;
            var __tihs = this;
            var _wf = function () {
                if(__tihs.min_timeout == _lmin) {
                    var _clf = function () {
                        __tihs.tick();
                    };
                    clearInterval(__tihs.timer_id);
                    __tihs.timer_id = setInterval(_clf, __tihs.SET_TIMEOUT);
                    //alert("JNARIC ProgrammingError: timer woke up via watchdog (ADD_TASK)!");
                }
            };
            setTimeout(_wf, this.SET_TIMEOUT * 3);
        }
        // else assume it is running ???
        return stack.pid;
        
    },
    
    start: function (pid) {
        // move the process from sleeping to running state; set the time to (min_runtime-1)

        var i, l=this.stacks_sleeping.length;
        for(i=0;i<l;i++)
            if(this.stacks_sleeping[i].pid == pid) break;
        //console.log("rst");
        if(i < l) {
            this.stacks_running.unshift(this.stacks_sleeping[i]);
            this.stacks_running[0].rt = this.min_runtime;
            this.stacks_running[0].rts = this.min_runtime + "";
            this.stacks_sleeping.splice(i,1);
            //console.log("rst found");
        }
        
        // run the timer; if not already run
//        console.log("i:"+i+"this.stacks_sleeping.length:"+this.stacks_sleeping.length+"this.stacks_running.length:"+this.stacks_running.length+"this.timer_id:"+this.timer_id);
        if( (i < l) && (this.stacks_running.length == 1) && (this.timer_id == null)) {
            var __tihs = this;
            var _clf = function () {
                __tihs.tick();
            };
            //clearInterval(this.timer_id); // timer_id is null here
            //setTimeout(_clf, 0);
            //console.log("rst SI");
            this.timer_id = setInterval(_clf, this.SET_TIMEOUT);
        } else {
            // start a watchdog timeout ??
            //console.log("rst WD");
            var _lmin = this.min_runtime;
            var __tihs = this;
            var _wf = function () {

                if(__tihs.min_runtime == _lmin) {
                    var _clf = function () {
                        __tihs.tick();
                    };
                    clearInterval(__tihs.timer_id);
                    __tihs.timer_id = setInterval(_clf, __tihs.SET_TIMEOUT);
                    //alert("JNARIC ProgrammingError: timer woke up via watchdog (START)!");
                }
            };
            setTimeout(_wf, this.SET_TIMEOUT * 3);
        }
        
        if(i == this.stacks_sleeping.length) return -1; // means not found or already running
        else return pid;

    },
    
    tick: function () {
        // TODO: average performance mark (steps/run_time)
        if((new Date()).getTime() - this.last_tick < this.SET_TIMEOUT / 4) {
            console.log("fast ticking!");
            return; // miss if the interval is less than third of SET_TIMEOUT
        }
            
        // burst the leftmost task, then nex leftmost task, etc.
        // by BURST_MIN minimal; BURST_TOTAL maximum; with BURST_CURRENT time slot
        var BURST_CURRENT = this.BURST_TOTAL / this.stacks_running.length;
        BURST_CURRENT = (BURST_CURRENT < this.BURST_MIN) ? this.BURST_MIN : BURST_CURRENT;
        
        // okay now burst the stack!
        var ot = (new Date()).getTime(), i = 0, curtm = (new Date()).getTime();
        var rt, st, steps,bc,j;

        // create a copy of currently bursting stack
        var stacks_running_copy = [].concat(this.stacks_running);
        while ( (((new Date()).getTime() - ot) <= this.BURST_TOTAL) && stacks_running_copy[i] ) {
            st = stacks_running_copy[i];
            rt = (new Date()).getTime();
            //steps = 0; // count steps for each bursting stack
            bc = BURST_CURRENT * st.throttle;
            
            
            
//            console.log("bursting: "+st.pid + " r/s: "+this.stacks_running.length + "/" + this.stacks_sleeping.length);
//            console.log(this.stacks_running);
//            console.log(this.stacks_sleeping);
            
            while ( (curtm - rt) <= bc ) {
                // check for stop here and break then;

                if(st.stack.STOP) {             // if st.stop -> move to sleeping

//                    console.log(this.stacks_running);
//                    console.log(this.stacks_sleeping);

                    this.stacks_sleeping.push(st);
                    //stacks_running_copy.splice(i,1);
                    for(j=0; j<this.stacks_running.length;j++) {
                        if(this.stacks_running[j] == st) {
//                            console.log("sleeping (re)moving: "+st.pid + " r/s: "+this.stacks_running.length + "/" + this.stacks_sleeping.length);
                            this.stacks_running.splice(j,1);
                            break;
                        }
                    }
                    break;
                }
                // now step teh task
                // WARNING! stepping could push another task into stacks_running
                //          so the 'i' will not correspond to the right value anymore
                //          so do the splices over there VERY carefully...
                if(!st.vm.step_next(st.stack)) { // means the stack finished
                    //stacks_running_copy.splice(i,1);
                    for(j=0; j<this.stacks_running.length;j++) {
                        if(this.stacks_running[j] == st) {
                            this.stacks_running.splice(j,1);
                            break;
                        }
                    }
                    break;
                }
                curtm = (new Date()).getTime();
            }
            
            // in fact, the 'time diff' would have been not required since we're using BURST_CURRENT burst chunks
            // but because of the possibility of huge loads in parser and native methods
            // we need the ability to 'punish' failed task
            var td = curtm - rt;
            
            if (td > bc ) { // now, if the burst "succeeded", set the run time; else just ignore
                if(st.throttle != 1) td = parseInt(td / st.throttle);
                if(st.nice == 0) st.rt = st.rt + td;
                else st.rt = st.rt + parseInt( td * (1.0 + st.nice / 27.0) );
                
                st.rts = st.rt+"";
                
            }
            i++;
        }
        
        // inline fast key sort
        //  perform sorting only if there is > 2 elements; otherwise do nothing or switch if there are two...
        if(this.stacks_running.length == 0) {
            // stop the timer; exit scheduler.
            clearInterval(this.timer_id);
            this.timer_id = null;
            return;
        }
        else if (this.stacks_running.length == 2) {
            if(this.stacks_running[1].rt > this.stacks_running[0].rt) this.stacks_running.reverse();
        }
        else if (this.stacks_running.length > 2) { 
            var bak = Object.prototype.toString;
            Object.prototype.toString = this.fast_sort_ret;
            this.stacks_running.sort();
            Object.prototype.toString = bak;
        }
        
        // set the min_runtime
        this.min_runtime = this.stacks_running[0].rt;
    },
    
    fast_sort_ret: function () {
        return this.rts;
    },
    
    __nice: function (pid, value) {
        // WARNING!! unprotected internal method!!!
        var i,st;
        for(i=0;i<this.stacks_sleeping.length;i++)
            if(this.stacks_sleeping[i].pid == pid) break;

        if(i >= this.stacks_sleeping.length) {
            for(i=0;i<this.stacks_running.length;i++)
                if(this.stacks_running[i].pid == pid) break;
            if(i >= this.stacks_running.length) return null;
            else st = this.stacks_running[i];
        } else st = this.stacks_sleeping[i];
        
        
        if(typeof(value) == "undefined") {
            return st.nice;
        } else {
            if(value > 19) value = 19;
            if(value < -19) value = -19;
            st.nice = value;
        }
    },
    
    __throttle: function (pid, value) {
        // WARNING!! unprotected internal method!!!
        var i,st;
        for(i=0;i<this.stacks_sleeping.length;i++)
            if(this.stacks_sleeping[i].pid == pid) break;

        if(i >= this.stacks_sleeping.length) {
            for(i=0;i<this.stacks_running.length;i++)
                if(this.stacks_running[i].pid == pid) break;
            if(i >= this.stacks_running.length) return null;
            else st = this.stacks_running[i];
        } else st = this.stacks_sleeping[i];
        
        
        if(typeof(value) == "undefined") {
            return st.throttle;
        } else {
            if(value > 1.4) value = 1.4;
            if(value < 0.2) value = 0.2;
            //if(value == 1.0) value = 1; // speed-up to INT for some browsers (??? or speed-down?)
            st.throttle = value;
        }
    }
};

var __jn_old_min_rt = __jn_stacks.min_runtime;
function __jn_wd () {
    // check if the main timer is running
    if( (__jn_stacks.stacks_running.length > 0) && (__jn_old_min_rt == __jn_stacks.min_runtime)) {
          var _clf = function () {
              __jn_stacks.tick();
          };
          clearInterval(__jn_stacks.timer_id);
          __jn_stacks.timer_id = setInterval(_clf, __jn_stacks.SET_TIMEOUT);
          //alert("JNARIC ProgrammingError: timer woke up via watchdog (__jn_wd)!");
    }
    __jn_old_min_rt = __jn_stacks.min_runtime;
}

// XXX DISABLED FOR DEBUGGING PURPOSES...
// setInterval(__jn_wd, __jn_stacks.SET_TIMEOUT * 10); // 10 timeouts for check

function __ErrorConsole() {
    this.messages = [];
    this.size = 100;
    // register firebug as supplementary console logging tool
    if(typeof(console) != "undefined") {
        if(console.log) this.log2 = function (s) { 
            console.log(s);
        };
        this.log("Registered firebug console as supplementary logging tool; If this is not intended behaviour - change .log2 method");
    }
}

__ErrorConsole.prototype.log = function (s) {
    this.messages.push(s);
    if(this.messages.length > this.size) this.messages.shift();
    if(this.log2) this.log2(s);
};

__ErrorConsole.prototype.read = function () {
    var out = "";
    for(var i; i<this.messages.length; i++) {
        out = out+this.messages[i];
    }
    return out;
};


const GLOBAL_CODE = 0, EVAL_CODE = 1, FUNCTION_CODE = 2, S_EXEC = 3;

__MAXARLEN = Math.pow(2,16)+1;

function Jnaric() {
    this.STEP_TIMEOUT = 1; // 1 ms ;-)
    this.STACKSIZE = 10000; // very much recursion ;-)
    this.MAX_THREADS = 50; // 50 max threads per VM. TODO: some hardware-variable??; see __get_max_threads method
    this.GRANTED = false;
    
    this.ErrorConsole = new __ErrorConsole();
    this._load_stack = [];
    this.ERROR_ONFINISH = false; // fire onfinish event when the execution stops due to error too    
    this.AJAX_TIMEOUT = 20000; // ms, 20 sec.
    this.nice = 0; // default startup nice levl
    this.throttle = 1; // throttle lvl
    
    
    this.idsource = 0;
    this.timeouts = [];
    
    var __tihs = this; // closure
    
    this.VERSION = "jnaric 0.1 alpha";
    
    this.global = {
        //document: document,
        ErrorConsole: __tihs.ErrorConsole, 
        //window: window,
        //location: location,
        /*
        alert: function (s) { // alert will BLOCK!! so dont have it
            alert(s); // defeat strange firefox behaviour on alert.apply(this, argv) with 'this != null'
        },
        */
        
        _FETCH_GET: 1, // document these...
        _FETCH_POST: 0,
        
        // Value properties.
        NaN: NaN, Infinity: Infinity, undefined: undefined,

        eval: function eval(s) {
            //console.log("data passed to eval: "+s);
            if (typeof s != "string") {
                __tihs.cur_stack.my.v0 = s;
                __tihs.ExecutionContext.current.result = s;
                return s;
            }
            var xx = __tihs.ExecutionContext.current;
            var xx2 = new __tihs.ExecutionContext(EVAL_CODE);
            xx2.thisObject = xx.thisObject;
            xx2.caller = xx.caller;
            xx2.callee = xx.callee;
            xx2.scope = xx.scope; // x x2
            __tihs.ExecutionContext.current = xx2;    // switch context to one of eval
            var my_cur_stack = __tihs.cur_stack;
            
            var dexecf = function () {
                //console.log("doneeval swapping results: "+xx.result+" to "+xx2.result);
                xx.result = xx2.result;                // pass return value further...
                __tihs.ExecutionContext.current = xx; // switch context back
                //my_cur_stack.my.v0 = xx2.result;
            };
            
            var texecf = function () {
                //console.log("throweval swapping results: "+xx.result+" to "+xx2.result);
                xx.result = xx2.result;                // but before that, switch context results!
                __tihs.ExecutionContext.current = xx; // switch context back ??????????????
                //my_cur_stack.my.v0 = xx2.result;
            };
            
            // WARNING: ONLY ONE OF done_exec or finally_exec IS ALLOWED!!!
            //__tihs.cur_stack.my.finally_exec = dexecf;
            //__tihs.cur_stack.my.t_hrow_exec = texecf;
            //if(DEBUG > 4) __tihs.ErrorConsole.log("pushing to stack from eval()");
            __tihs.cur_stack.push(S_EXEC, {v: "v0", n: parse(s), x: xx2, pmy: __tihs.cur_stack.my.myObj, finally_exec: dexecf, throw_exec: texecf }); 
            xx.result = undefined;
            __tihs.cur_stack.my.v0 = undefined; // in case eval is called on a zero statements.
        },
        
        
        parseInt: parseInt, parseFloat: parseFloat,
        isNaN: isNaN, isFinite: isFinite,
        decodeURI: decodeURI, encodeURI: encodeURI,
        decodeURIComponent: decodeURIComponent,
        encodeURIComponent: encodeURIComponent,
        escape: escape, unescape: unescape,

        // Class constructors.  Where ECMA-262 requires C.length == 1, we declare
        // a dummy formal parameter.
        Object: Object,
        Function: function Function(dummy) {
            var p = "", b = "", n = arguments.length;
            if (n) {
                var m = n - 1;
                if (m) {
                    p += arguments[0];
                    for (var k = 1; k < m; k++)
                        p += "," + arguments[k];
                }
                b += arguments[m];
            }

            // XXX We want to pass a good file and line to the tokenizer.
            // Note the anonymous name to maintain parity with Spidermonkey.
            var t = new Tokenizer("anonymous(" + p + ") {" + b + "}");

            // NB: Use the STATEMENT_FORM constant since we don't want to push this
            // function onto the null compilation context.
            var f = FunctionDefinition(t, null, false, STATEMENT_FORM);
            var s = {object: __tihs.global, parent: null};
            return new __tihs.FunctionObject(f, s);
        },
        Array: function Array(dummy) {
            // Array when called as a function acts as a constructor.
            
            // MOZ BUG Array/350256-03
            if(arguments.length > __MAXARLEN) throw new __tihs.global.InternalError("script stack space quota is exhausted");
            
            return GLOBAL.Array.apply(this, arguments);
        },
        String: function String(s) {
            // Called as function or constructor: convert argument to string type.
            s = arguments.length ? "" + s : "";
            if (this instanceof String) {
                // Called as constructor: save the argument as the string value
                // of this String object and return this object.
                this.value = s;
                return this;
            }
            return s;
        },
        Boolean: Boolean, Number: Number, Date: Date, RegExp: RegExp,
        
        Error: Error, EvalError: EvalError, RangeError: RangeError,
        ReferenceError: ReferenceError, SyntaxError: SyntaxError,
        TypeError: TypeError, URIError: URIError,
        
        InternalError: function (msg) {
            this.message = msg;
            this.name = "InternalError";
            this.toString = function () {
                return "InternalError: "+this.message;
            };
        },
        
        SecurityError: function (msg) {
            this.message = msg;
            this.name = "SecurityError";
            this.toString = function () {
                return "SecurityError: "+this.message;
            };
        },

        // Other properties.
        // TODO: check if other props expose the same behaviour!
        // BUG MOZ 192226
        Math: { LN2: Math.LN2, 
            E: Math.E,
            LN2: Math.LN2,
            LN10: Math.LN10,
            LOG2E: Math.LOG2E,
            LOG10E: Math.LOG10E,
            PI: Math.PI,
            SQRT1_2: Math.SQRT1_2,
            SQRT2: Math.SQRT2,

            abs: Math.abs,
            acos: Math.acos,
            asin: Math.asin,
            atan: Math.atan,
            atan2: Math.atan2,
            ceil: Math.ceil,
            cos: Math.cos,
            exp: Math.exp,
            floor: Math.floor,
            log: Math.log,
            max: Math.max,
            min: Math.min,
            pow: Math.pow,
            random: Math.random,
            round: Math.round,
            sin: Math.sin,
            sqrt: Math.sqrt,
            tan: Math.tan,
            toSource: Math.toSource
        },
        
        // extensions section ->>
        
        Lock: function () {
            // a lock to be acquired and released
            this.goflag = 1;
            this.___wait_queue = [];
        },
        
        sleep: function ( milliseconds ) {
            // sleep will suspend current thread execution until timer event is received (event == interrupt here)

            // set up a stop execution flag
            var _mystop = __jn_stacks.newId();
            __tihs.cur_stack.STOP = _mystop;
            var __cs = __tihs.cur_stack;
            
            var cont_f = function () {
                if( __cs.STOP != _mystop ) { // what does that mean???
                     // if not false -> __tihs.ErrorConsole.log("VM: sleep: internal programming error!");
                     return;
                }
                __cs.STOP = false;
                //__tihs.step_next(__cs);

                __jn_stacks.start(__cs.pid);
            }
            
            // set up a sleep timer
            setTimeout(cont_f, milliseconds);
            
            // set up a backup timeout timer
            //   (not required here) 903 295 02 49
        },
        
        setTimeout: function ( fun, millisec, args ) {
            // NOTE: this is a threaded version of setTimeout!!
            // it may result in serious race conditions if used improperly
            
            var x2 = new __tihs.ExecutionContext(FUNCTION_CODE);
                
            x2.thisObject = __tihs.global;
            x2.caller = null;
            x2.callee = fun;
            
            if(typeof(args) != "undefined" ) {
                var a = Array.prototype.splice.call(args, 0, args.length);
                a.__defineProperty__('callee', fun, false, false, true);
            } else {
                a = [];
                a.__defineProperty__('callee', fun, false, false, true);
            }
            var f = fun.node;
            
            //console.log("Normal call working...");
            
            x2.scope = {object: new Activation(f, a), parent: fun.scope};
            
            var g_stack = new __Stack(x2);
            g_stack.push(S_EXEC, { n: f.body, x: x2, pmy: {} });
            
            var my_nice = __jn_stacks.__nice(__tihs.cur_stack.pid);
            
            var run_code = function () {
                // create a new execution context
                //__tihs.step_next(g_stack);
                __jn_stacks.add_task(__tihs, g_stack, my_nice, __tihs.throttle);

                
            };
            var t_id = setTimeout(run_code, millisec);
            __tihs.timeouts[t_id] = null; // TODO: clean out timeouts! (somehow??)
            if(__tihs.timeouts.length > 5000) {
                __tihs.ErrorConsole.log("timeouts cache overflow; restart required!!");
                for(ob in __tihs.timeouts) { delete __tihs.timeouts[ob]; break; }
            }
            return t_id;
        },
        
        start_new_thread: function ( fun, args ) { // DOC; args is optional Array
            
            var x2 = new __tihs.ExecutionContext(FUNCTION_CODE);
                
            x2.thisObject = __tihs.global;
            x2.caller = null;
            x2.callee = fun;
            
            if(typeof(args) != "undefined" ) {
                var a = Array.prototype.splice.call(args, 0, args.length);
                a.__defineProperty__('callee', fun, false, false, true);
            } else {
                a = [];
                a.__defineProperty__('callee', fun, false, false, true);
            }
            var f = fun.node;
            
            //console.log("Normal call working...");
            
            x2.scope = {object: new Activation(f, a), parent: fun.scope};
            
            var g_stack = new __Stack(x2);
            g_stack.push(S_EXEC, { n: f.body, x: x2, pmy: {} });
            
            var my_nice = __jn_stacks.__nice(__tihs.cur_stack.pid);

            var pid = __jn_stacks.add_task(__tihs, g_stack, my_nice, __tihs.throttle);
            //console.log("running task in thread... "+a.length+ " pid:" + pid);
            return pid;
        },
        
        clearTimeout: function (id) {

            if(id in __tihs.timeouts) {

                clearTimeout(parseInt(id)); // ECMA... need to parse object to Int for setTimeout to work; this is changed behaviour
            }
        },


        setInterval: function ( fun, millisec, args ) {
            // NOTE: this is a threaded version of setTimeout!!
            // it may result in serious race conditions if used improperly
            
            var x2 = new __tihs.ExecutionContext(FUNCTION_CODE);
                
            x2.thisObject = __tihs.global;
            x2.caller = null;
            x2.callee = fun;
            
            var f = fun.node;
            
            //console.log("Normal call working...");
            
            
            var my_nice = __jn_stacks.__nice(__tihs.cur_stack.pid);
            
            var run_code = function () {
                // create a new execution context
                //__tihs.step_next(g_stack);

                if(typeof(args) != "undefined" ) {
                    var a = Array.prototype.splice.call(args, 0, args.length);
                } else {
                    a = [];
                }
                a.__defineProperty__('callee', fun, false, false, true);


                x2.scope = {object: new Activation(f, a), parent: fun.scope};
            
                var g_stack = new __Stack(x2);
                g_stack.push(S_EXEC, { n: f.body, x: x2, pmy: {} });

                __jn_stacks.add_task(__tihs, g_stack, my_nice, __tihs.throttle);

                
            };
            var t_id = setInterval(run_code, millisec);
            __tihs.timeouts[t_id]=null; // TODO: clean out timeouts! (somehow??)
            if(__tihs.timeouts.length > 5000) {
                __tihs.ErrorConsole.log("timeouts cache overflow; restart required!!");
                for(ob in __tihs.timeouts) { delete __tihs.timeouts[ob]; break; }
            }
            return t_id;
        },
        
        clearInterval: function (id) {
            
            if(id in __tihs.timeouts)
                clearInterval(id);
        },


        
        load : function ( url ) {
            
            // remove RETURN exception from stack; set v0 as the 'result' to the stack
            __tihs.cur_stack.EXCEPTION = false;
            __tihs.cur_stack.my.v0 = undefined;
            
            // set up a stop execution flag
            var _mystop = __jn_stacks.newId();
            __tihs.cur_stack.STOP = _mystop;
            var __cs = __tihs.cur_stack;
            
            
            var exec_f = function (data, obj) {
                // like evaluate, but push!
                if( __cs.STOP != _mystop ) // means TIMEOUT already fired. Also, if it is != false then a serious programming error may be in place!!
                        return;
                
                try {
                    var _p = parse(data, url, 0);
                    __cs.push(S_EXEC, {n: _p, x: __cs.exc, pmy: {}}); // append it to the 'end' of execution stack
                } catch (e) {
                    __cs.EXCEPTION = THROW;
                    __cs.exc.result = e;// TEST THIS!!
                }
                
                __cs.STOP = false;
                //__tihs.step_next(__cs);
                __jn_stacks.start(__cs.pid);
            };
            
                        
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
            
            // set the timeout watchguard
            setTimeout(timeout_f, __tihs.AJAX_TIMEOUT);
            
            // fire the ajax load component
            var dr = new DataRequestor();
            dr.onload = exec_f;
            dr.onfail = function (status, txt) {
                if( __cs.STOP != _mystop ) // means TIMEOUT already fired
                        return;

                __cs.EXCEPTION = THROW;
                var ex = new __tihs.global.InternalError("load('"+url+"') failed with status: "+status);
                ex.status = status;
                __cs.exc.result = ex;

                __cs.STOP = false;
                //__tihs.step_next(__cs);  
                __jn_stacks.start(__cs.pid);              
            };
            dr.getURL( url );
        },
        
        fetchUrl: function (url, args, callback, mode) {
            // remove RETURN exception from stack; set v0 as the 'result' to the stack
            __tihs.cur_stack.my.v0 = undefined;
            
            // set up a stop execution flag
            var __cs = __tihs.cur_stack;
            var x2 = __cs.my.x2;
            if(typeof(mode) == 'undefined') mode = _POST; 
            if( (typeof(callback) == "undefined") || callback == null || !callback.node )  {
                __tihs.cur_stack.EXCEPTION = false;
                var _mystop = __jn_stacks.newId();
                __tihs.cur_stack.STOP = _mystop;

                var timeout_f = function () {
                    if( __cs.STOP != _mystop ) { // it should NEVER appear to place a STOP flag on the same stack twice
                        // if not false -> __tihs.ErrorConsole.log("VM: load: internal programming error!");
                        return;
                    }
                    
                    
                    __cs.EXCEPTION = THROW;
                    var ex = new __tihs.global.InternalError("url fetch ("+url+") failed with timeout");// TEST THIS!!
                    ex.status = "timeout";
                    __cs.exc.result = ex;

                    
                    __cs.STOP = false;
                    //__tihs.step_next(__cs);
                    __jn_stacks.start(__cs.pid);
                };
                var tmg=setTimeout(timeout_f, __tihs.AJAX_TIMEOUT);

                var exec_f = function (data, obj) {
                    // like evaluate, but push!
                    clearTimeout(tmg);
                    if( __cs.STOP != _mystop ) // means TIMEOUT already fired. Also, if it is != false then a serious programming error may be in place!!
                            return;
                    // __cs.exc.result = data;
                    x2.result = data; // XXX this shit is because thats how CALL: gets the result :-(
                    __cs.EXCEPTION = RETURN;
                    __cs.STOP = false;
                    //__tihs.step_next(__cs);
                    __cs.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: __cs.exc, NodeNum: 0, pmy: __cs.my.myObj});
                    __jn_stacks.start(__cs.pid);
                };

                
                
                var fail_f = function (status, txt) {
                    clearTimeout(tmg);
                    if( __cs.STOP != _mystop ) // means TIMEOUT already fired
                            return;
                    
                    __cs.EXCEPTION = THROW;
                    var ex = new __tihs.global.InternalError("url fetch ("+url+") failed with status: "+status);
                    ex.status = status;
                    __cs.exc.result = ex;

                    __cs.STOP = false;
                    //__tihs.step_next(__cs);  
                    __jn_stacks.start(__cs.pid);              
                };

            } else {
                // run in non-blocking mode
                // set the callback exec_f
                // and the log-only timeout method (or call the callback with error?)
                
                // set the timeout watchguard
                
                var timeout_f = function () {
                    __tihs.ErrorConsole.log("url fetch ("+url+") failed with timeout");// TEST THIS!!
                };
                
                var tmg = setTimeout(timeout_f, __tihs.AJAX_TIMEOUT);
            

                var exec_f = function (data, obj) {
                    // like evaluate, but push!
                    // execute the callback with arguments
                    clearTimeout(tmg);
                    __tihs.global.start_new_thread(callback, [data]);

                    
                };

                
                
                var fail_f = function (status, txt) {
                    __tihs.ErrorConsole.log("url fetch ("+url+") failed with status: "+status);
                    clearTimeout(tmg);
                    __tihs.global.start_new_thread(callback, [null, status, txt]);
                };

            }
            
                        
            
            
            // fire the ajax load component
            var dr = new DataRequestor();
            var arg; // haha not sure it's required?? haha
            if(typeof(args) != "undefined") { // ANY argument but for URL may be omitted
                for(arg in args) {
                    if( (arg != "__defineProperty__") && (arg.substr(0,3) != "___")) dr.addArg(mode, arg, args[arg]); // document to never use __defineProperty__
                }
            }
            dr.onload = exec_f;
            dr.onfail = fail_f;
            
            dr.getURL( url );
        },
        
        nice: function (val) {
            if(typeof(val) == "undefined") {
                return __jn_stacks.__nice(__tihs.cur_stack.pid);
            } 
            val = parseInt(val);
            if(isNaN(val)) throw (new __tihs.global.InternalError("nice() argument must be a number"));
            
            if(val < 0 && !__tihs.GRANTED) throw (new __tihs.global.SecurityError("setting negative nice increment is not allowed"));
            var cur_nice = __jn_stacks.__nice(__tihs.cur_stack.pid);
            
            __jn_stacks.__nice(__tihs.cur_stack.pid, cur_nice + val);
        },
        
        throttle: function (val) {
            if(typeof(val) == "undefined") {
                return __jn_stacks.__throttle(__tihs.cur_stack.pid);
            } 
            val = parseFloat(val);
            if(isNaN(val)) throw (new __tihs.global.InternalError("throttle() argument must be a number"));
            
            if(val > 1 && !__tihs.GRANTED) throw (new __tihs.global.SecurityError("setting process throttle > 1 is not allowed"));
            
            __jn_stacks.__throttle(__tihs.cur_stack.pid, val);
        },
        
        // global VM method to get max allowed threads per this particular VM
        __get_max_threads: function () {
            return __tihs.MAX_THREADS;
        },

        version: __tihs.VERSION
    };
    
    // TODO: move these out of the closure scope!
    this.global.Lock.prototype.acquire = function (blocking) {
        blocking = blocking || true;
        if(this.goflag > 0) { 
            --this.goflag;
            return true;
        }
        else { // block...
            if(blocking) {
                var _mystop = __jn_stacks.newId();
                __tihs.cur_stack.STOP = _mystop;
                var __cs = __tihs.cur_stack;
                __cs.EXCEPTION = false; // do not return till we finish...
                
                this.___wait_queue.push({cs: __cs, stop: _mystop}); // DOC the kernel lock should push itself manually
            } else {
                return false;
            }
            
        }
        // not reached by running stack; return does not matter
    };
    
    this.global.Lock.prototype.release = function (f) {
        if(!f && this.goflag > 0) {
            // set exception
            __tihs.cur_stack.EXCEPTION = THROW;
            __tihs.cur_stack.exc.result = (new __tihs.global.Error("release unlocked lock"));
        }
        //++this.goflag; // is like someone may have requested a lock again, dont release it!
        var desc = this.___wait_queue.shift();
        
        if(!desc) {
            this.goflag = 1; // just leave unlocked
            return;
        }
        
        if(desc.cs) { // release first who waits
            if( desc.cs.STOP != desc.stop ) { // ASSERT should never happen
                __tihs.ErrorConsole.log("Lock: ASSERT! tried to release stack with foregin block!");
                return;
            }
            
            desc.cs.STOP = false;
            desc.cs.EXCEPTION = RETURN;
            desc.cs.my.x2.result = true;
            __jn_stacks.start(desc.cs.pid);
        }
        if(desc.callback) { // for hardware locks
            desc.callback(); // DOC WARNING! the hardware lock should call release() manually
        }
        // no return value
    };

    this.global.Lock.prototype.check = function () {
        if(this.goflag > 0) {
            return false;
        }
        return true;
    };
        


    
    this.reflectClass('Array', new Array);

    
    
    
    this.gSp = this.reflectClass('String', new String);
    this.gSp.toSource = function () { return this.value.toSource(); };
    this.gSp.toString = function () { return this.value; };
    this.gSp.valueOf  = function () { return this.value; };
    this.global.String.fromCharCode = String.fromCharCode;

    
    
    this.ExecutionContext = function(type) {
        this.type = type;
    }
    this.XCp = this.ExecutionContext.prototype;
    
    this.ExecutionContext.current = this.XCp.caller = this.XCp.callee = null;
    
    this.XCp.scope = {object: this.global, parent: null};
    this.XCp.thisObject = this.global;
    this.XCp.result = undefined;
    this.XCp.target = null;
    this.XCp.ecmaStrictMode = false;
    
    
    // init execution context for first evaluate
    this.glo_exc = new this.ExecutionContext(GLOBAL_CODE);
    this.ExecutionContext.current = this.glo_exc;
    
    this.g_stack = new __Stack(this.ExecutionContext.current); 
    //this.e_stack = [];
    //this.g_stack.e_stack = this.e_stack;
    
    
    
    
    
    this.FunctionObject = function (node, scope) {
        this.node = node;
        this.scope = scope;
        this.__defineProperty__('length', node.params.length, true, true, true);
        var proto = {};
        this.__defineProperty__('prototype', proto, true);
        proto.__defineProperty__('constructor', this, false, false, true);
    }

    var FOp = this.FunctionObject.prototype = {
        // Internal methods.
        __call__: function (t, a, x, stack) {
            var x2 = new __tihs.ExecutionContext(FUNCTION_CODE);
            x2.thisObject = t || __tihs.global;
            x2.caller = x;
            x2.callee = this;
            a.__defineProperty__('callee', this, false, false, true);
            var f = this.node;
            
            //console.log("Normal call working...");
            
            x2.scope = {object: new Activation(f, a), parent: this.scope};

            __tihs.ExecutionContext.current = x2;
            
            
            
            

            stack.my.oldx = x;
            stack.my.x2 = x2;
            stack.push(S_EXEC, {v: "v0", n: f.body, x: x2, oldx: x, pmy: stack.my.myObj});
            return undefined;
        },

        __construct__: function (a, x, stack) {
            //__tihs.ErrorConsole.log("Executing normal __construct__");
            var o = new Object;
            var p = this.prototype;
            if (isObject(p))
                o.__proto__ = p;
            // else o.__proto__ defaulted to Object.prototype
            stack.my.o = o;
            //console.log("calling constructor with a="+a);
            var v = this.__call__(o, a, x, stack);
            
            // the following will be ignored by step executor anyways
            // (does not inspect return)
            //if (isObject(v))
            //    return v;
            //return o;
        },

        __hasInstance__: function (v) {
            if (isPrimitive(v))
                return false;
            var p = this.prototype;
            if (isPrimitive(p)) {
                throw new TypeError("JNARIC: 'prototype' property is not an object",
                                    this.node.filename, this.node.lineno);
            }
            var o;
            while ((o = v.__proto__)) {
                if (o == p)
                    return true;
                v = o;
            }
            return false;
        },

        // Standard methods.
        toString: function () {
            return this.node.getSource();
        },

        apply: function (t, a) {
            // Curse ECMA again!
            if (typeof this.__call__ != "function") {
                throw new TypeError("JNARIC: Function.prototype.apply called on" +
                                    " uncallable object");
            }
            
            /////////////////////////////
            /*
            var _s = "";
            for(var o in t) {
                _s  = _s + o + "; ";
            }
            console.log("CALLING APPLY t: "+t+" - "+ _s +" a: " +a);
            */
            //console.log("CALLING APPLY t: "+t+" - "+ _s +" a: " +a);
            ///////////////////////////////

            
            if (t === undefined || t === null)
                t = __tihs.global;
            else if (typeof t != "object")
                t = __tihs.toObject(t, t);

            if (a === undefined || a === null) {
                a = {};
                a.__defineProperty__('length', 0, false, false, true);
            } else if (a instanceof Array) {
                var v = {};
                for (var i = 0, j = a.length; i < j; i++)
                    v.__defineProperty__(i, a[i], false, false, true);
                v.__defineProperty__('length', i, false, false, true);
                a = v;
            } else if (!(a instanceof Object)) {
                // XXX check for a non-arguments object
                throw new TypeError("JNARIC: Second argument to Function.prototype.apply" +
                                    " must be an array or arguments object",
                                    this.node.filename, this.node.lineno);
            }

            /*
            var _s = "";
            for(var o in t) {
                _s  = _s + o + "; ";
            }
            console.log("INVOKING CALL t: "+t+" - "+ _s +" a: " +a);
            */
            // if we've been called with cur_stack.EXCEPTION = means we're called out of native call-wrapper
            // then, remove the exception since we're likely to add another ;-)
                        
            if(__tihs.cur_stack.EXCEPTION && __tihs.cur_stack.EXCEPTION==RETURN) delete __tihs.cur_stack.EXCEPTION;
            return this.__call__(t, a, __tihs.ExecutionContext.current, __tihs.cur_stack);
        },

        call: function (t) {
            // Curse ECMA a third time!
            var a = Array.prototype.splice.call(arguments, 1);
            return this.apply(t, a);
        }
    };

    // Connect Function.prototype and Function.prototype.constructor in global.
    this.reflectClass('Function', FOp);
    
    
    
    
    
    
}

Jnaric.prototype.reflectClass = function (name, proto) {
    var gctor = this.global[name];
    gctor.__defineProperty__('prototype', proto, true, true, true);
    proto.__defineProperty__('constructor', gctor, false, false, true);
    return proto;
};

Jnaric.prototype.bind_scope = function (x) {
    // bind to scope
    // executed after this.ExecutionContext has been set
    var user_scope = { object: x, parent: null };
    this.ExecutionContext.prototype.scope.parent = user_scope; 
    this.glo_exc.scope.parent = user_scope; // warning: dynamic binding is supported but not intended
    
    this.global.alert = function (s) { alert(s); };

};


Jnaric.prototype.putValue = function (v, w, vn) {
    if (v instanceof Reference) {
        // temporary pseudo-watch mechanism
        //if(v.propertyName == "actual") this.ErrorConsole.log("setting value of actual to "+w);
        //if(v.base)this.ErrorConsole.log("v.base is: "+v.base + " v.propName is: "+v.propertyName+ " __call__: "+v.base.__call__);
        if(v.base && v.base.__call__ && (v.propertyName == '__proto__')) throw (new this.global.InternalError("JNARIC: Setting of __proto__ on functionObject is not supported")); // just dont set __proto__ of a function!!!
        if(v.propertyName.substr(0,3) == "___") throw (new this.global.InternalError("JNARIC: triple underscore is reserved")); 
        
        // TODO HERE: 
        // - implement watchpoints
        // - implement protected access
        // - implement getters/setters
        
        //var r = (v.base || this.global)[v.propertyName] = w;
        /*
        if(v.propertyName in this.waitlist && (v.base === this.waitlist[v.propertyName].scope || this.global === this.waitlist[v.propertyName].scope)) {
            var wl = this.waitlist[v.propertyName];
            if(wl.cond == w) {
                delete this.waitlist[v.propertyName];
                wl.fn(); // warning: may block
            }
            
        }
        */
        //return r; 
        if(v.base && v.base.___setters && v.base.___setters[v.propertyName]) {
            if(v.base.___setters[v.propertyName] == 1) {
                throw new TypeError("JNARIC: setting a property that has only a getter", vn.filename, vn.lineno);
            }
            return v.base.___setters[v.propertyName].apply(v.base, [v.propertyName, w]);
            // r not equalling to value should be treated as failed setter set attempt ? XXX decide on that
            // currently, a setter is not allowed to fail
        }

        return (v.base || this.global)[v.propertyName] = w;
        //var vr = w;
        //if(v.base) v.base[v.propertyName] = w;
        //if(v.base) this.ErrorConsole.log("after assignment: v.base is: "+v.base + " v.propName is: "+v.propertyName + " __call__: "+v.base.__call__);
        //return vr;
    }
    // TODO: VM SHOULD NEVER THROW!!!!
    //t_hrow new ReferenceError("Invalid assignment left-hand side",
    //                         vn.filename, vn.lineno);
    ////this.cur_stack.EXCEPTION = THROW;
    //this.cur_stack.stack[this.cur_stack.stack.length-1].x.result = new ReferenceError("Invalid assignment left-hand side",                             vn.filename, vn.lineno);
    //this.ExecutionContext.current.result = new ReferenceError("Invalid assignment left-hand side",                             vn.filename, vn.lineno);
    ////this.cur_stack.EXCEPTION_OBJ = new ReferenceError("Invalid assignment left-hand side", vn.filename, vn.lineno);
    throw new ReferenceError("JNARIC: Invalid assignment left-hand side", vn.filename, vn.lineno);
    //throw "exception is here!";
};

Jnaric.prototype.getValue = function (v) {
    if (v instanceof Reference) {
        if (!v.base) {
            // vm should never t_hrow --
            //t_hrow new ReferenceError(v.propertyName + " is not defined",
            //                         v.node.filename, v.node.lineno);
            /////this.cur_stack.EXCEPTION = THROW;
            //this.cur_stack.stack[this.cur_stack.stack.length-1].x.result = new ReferenceError(v.propertyName + " is not defined",                                     v.node.filename, v.node.lineno);
            /////this.cur_stack.EXCEPTION_OBJ = new ReferenceError(v.propertyName + " is not defined", v.node.filename, v.node.lineno);
            //this.ExecutionContext.current.result= new ReferenceError(v.propertyName + " is not defined", v.node.filename, v.node.lineno);
            //throw "exception is here!";
            //this.cur_stack.stack.pop(); // ??
            throw new ReferenceError("JNARIC: " + v.propertyName + " is not defined", v.node.filename, v.node.lineno);
            return; // return undefined
        }
        if(v.propertyName.substr(0,3) == "___") throw (new this.global.InternalError("JNARIC: triple underscore is reserved")); 
        // implement hard-coded getter
        if(v.base.___getters && v.base.___getters[v.propertyName]) {
            // return value returned by getter
            return v.base.___getters[v.propertyName].apply(v.base, [v.propertyName]);
        }
        return v.base[v.propertyName];
    }
    return v;
};

Jnaric.prototype.toObject = function (v, r, rn) {
    switch (typeof v) {
      case "boolean":
        return new this.global.Boolean(v);
      case "number":
        return new this.global.Number(v);
      case "string":
        return new this.global.String(v);
      case "function":
        return v;
      case "object":
        if (v !== null)
            return v;
    }
    var message = "JNARIC: " + r + " (type " + (typeof v) + ") has no properties";
    throw rn ? new TypeError(message, rn.filename, rn.lineno)
             : new TypeError(message);
};

// WARNING: it MAY or may not throw exceptions!!!
Jnaric.prototype.__abort = function () {
    this._load_stack=[];
    this.g_stack.stack = [];
    this.onfinish = null; // TODO: should onfinish be fired on abort?? guess not.. but it must not be lost!
    //this.onerror = null;
};

Jnaric.prototype.load = function (url) {
    this._load_stack.unshift(url);
    if(this._load_stack.length == 1) {
        this.__load_next();
    }
};

Jnaric.prototype.__load_next = function () {
    var dr = new DataRequestor();
    var url = this._load_stack[(this._load_stack.length-1)];
    var _tihs = this;
    dr.onload = function (data, obj) {
        if(DEBUG>2)
            _tihs.ErrorConsole.log(".load(): evaluating text of length "+data.length); 
        try {
            _tihs.evaluate(data, url); // TODO: evaluate - use source name!
        } catch (e) {
            // TODO: rewrite this to set exception on main thread stack???
            _tihs.ErrorConsole.log("Parse of file "+url+" failed: "+e);
            try {
                _tihs.onerror && _tihs.onerror(e);
            } catch (e) {
                _tihs.ErrorConsole.log(".onerror event failed to execute with exception: "+e);
            }
        } finally {
            //console.log("NEXT REACHED");
            _tihs._load_stack.pop();
            if(_tihs._load_stack.length) _tihs.__load_next();
        }
    };
    dr.onfail = function (status, txt) {
        _tihs.ErrorConsole.log(".load('"+url+"') failed with status: "+status);
        _tihs._load_stack.pop();
        if(_tihs._load_stack.length) _tihs.__load_next();
    };
    if(DEBUG>2) this.ErrorConsole.log(".load(): requesting url: "+url); 
    dr.getURL(url);
};

// Helper to avoid Object.prototype.hasOwnProperty polluting scope objects.
function hasDirectProperty(o, p) {
    return Object.prototype.hasOwnProperty.call(o, p);
}


function Reference(base, propertyName, node) {
    this.base = base;
    this.propertyName = propertyName;
    this.node = node;
}

Reference.prototype.toString = function () { return this.node.getSource(); }


function isPrimitive(v) {
    var t = typeof v;
    return (t == "object") ? v === null : t != "function";
}

function isObject(v) {
    var t = typeof v;
    return (t == "object") ? v !== null : t == "function";
}

// If r instanceof Reference, v == getValue(r); else v === r.  If passed, rn
// is the node whose execute result was r.



function say_type(t) {

    switch (t) {
      case FUNCTION:
        v="FUNCTION";
        break;

      case SCRIPT:
        return "SCRIPT";

      case BLOCK:
        return "BLOCK";

      case IF:
        return "IF";

      case SWITCH:
        return "SWITCH";

      case FOR:
        return "FOR";
      case WHILE:
        return "WHILE";

      case FOR_IN:
        return "FOR_IN";
      case DO:
        return "DO";

      case BREAK:
        return "BREAK";
      case CONTINUE:
        return "CONTINUE";

      case TRY:
        return "TRY";
        
      case THROW:
        return "THROW";

      case RETURN:
        return "RETURN";

      case WITH:
        return "WITH";
        
      case VAR:
        return "VAR";
        
      case CONST:
        return "CONST";
        
      case DEBUGGER:
        return "DEBUG";
        
      case SEMICOLON:
        return "SEMICOLON";

      case LABEL:
        return "LABEL";

      case COMMA:
        return "COMMA";

      case ASSIGN:
        return "ASSIGN";
      case HOOK:
        return "HOOK";
        
      case OR:
        return "OR";
      case AND:
        return "AND";
      case BITWISE_OR:
        return "BITWISE_OR";
      case BITWISE_XOR:
       return "BITWISE_XOR";
      case BITWISE_AND:
        return "BITWISE_AND";
      case EQ:
        return "EQ";
      case NE:
        return "NE";
      case STRICT_EQ:
        return "STRICT_EQ";
      case STRICT_NE:
        return "STRICT_NE";
      case LT:
        return "LT";
      case LE:
        return "LE";
      case GE:
        return "GE";
      case GT:
        return "GT";
      case IN:
        return "IN";
      case INSTANCEOF:
        return "INSTANCEOF";
      case LSH:
        return "LSH";
      case RSH:
        return "RSH";
      case URSH:
        return "URSH";
      case PLUS:
        return "PLUS";
      case MINUS:
        return "MINUS";
      case MUL:
        return "MUL";
      case DIV:
        return "DIV";
      case MOD:
        return "MOD";
      case DELETE:
        return "DELETE";
      case VOID:
        return "VOID";
      case TYPEOF:
        return "TYPEOF";
      case NOT:
        return "NOT";
      case BITWISE_NOT:
        return "BITWISE_NOT";
      case UNARY_PLUS:
        return "UNARY_PLUS";
      case UNARY_MINUS:
        return "UNARY_MINUS";
      case INCREMENT:
        return "INCREMENT";
      case DECREMENT:
        return "DECREMENT";
      case DOT:
        return "DOT";

      case INDEX:
        return "INDEX";
      case LIST:
        return "LIST";
      case CALL:
        return "CALL";
      case NEW:
        return "NEW";
      case NEW_WITH_ARGS:
        return "NEW_WITH_ARGS";

      case ARRAY_INIT:
        return "ARRAY_INIT";
      case OBJECT_INIT:
        return "OBJECT_INIT";
      case NULL:
        return "NULL";
      case THIS:
        return "THIS";
      case TRUE:
        return "TRUE";
      case FALSE:
        return "FALSE";
      case IDENTIFIER:
        return "IDENTIFIER";
      case NUMBER:
        return "NUMBER";
      case STRING:
        return "STRING";
      case REGEXP:
        return "REGEXP";
      case GROUP:
        return "GROUP";
      default:
        return "PANIC: unknown operation " + t;
    }

    return v;

}

__Stack = function (exc) {
    this.my = {};
    this.stack = [];
    this.exc = exc;
    this.e_stack = [];
}

__Stack.prototype.push = function (x, o) {
    // ignore x
    this.stack.push(o);
}

// global stack
//g_stack = new Stack;

// global exception stack
//e_stack = [];

Jnaric.prototype.step_next = function (g_stack) {
    var ex, v;
    ex = g_stack.stack[(g_stack.stack.length-1)];
    if(!ex) return false; // in case of emergency ;-)
    var e_stack = g_stack.e_stack;
    g_stack.my = ex;
    g_stack.my.myObj = ex;
    
    // now check for done; purge everybody who is done in the array tail
    while(ex.done) {
        
        if(DEBUG) {
            var tabl = "";
            for(var i=0; i<g_stack.stack.length; i++) tabl = tabl + "x";
            this.ErrorConsole.log(tabl+"  -- done, popping: "+say_type(g_stack.stack[(g_stack.stack.length-1)].n.type)+" "+(g_stack.stack[(g_stack.stack.length-1)].TRY_WAIT ? "TRY_WAIT" : ""));
        }
        if(!g_stack.EXCEPTION) g_stack.stack.pop();
        if(g_stack.stack.length == 0) {
            //console.log("stack exhausted; "+(g_stack === this.g_stack)+" onfinish set "+(this.onfinish ? "yes ": "no ")+" Load stack length: "+this._load_stack.length);
            if(this.onfinish  && (g_stack === this.g_stack) ) {
                if(this._load_stack.length == 0) { // only if there is eft nothing to load & exec in main thread
                    if(DEBUG && DEBUG > 3) this.ErrorConsole.log("Firing onfinish event!");
                    try {
                        this.onfinish(ex.x.result); // main thread stack exhausted, run 'onfinish'
                    } catch (e) {
                        this.ErrorConsole.log(".onfinish event failed to execute with exception: "+e);
                    }
                }
            } else if(g_stack.onfinish ) {
                
                if(this.DEBUG && this.DEBUG > 3) this.ErrorConsole.log("Firing onfinish event on stack!");
                try {
                    g_stack.onfinish(ex.x.result); // main thread stack exhausted, run 'onfinish'
                } catch (e) {
                    this.ErrorConsole.log("stack .onfinish event failed to execute with exception: "+e);
                }
            
            }

            return false;
        }
        ex = g_stack.stack[(g_stack.stack.length-1)];
        g_stack.my = ex;
        g_stack.my.myObj = ex;
    }
    
    
    
    if(DEBUG) {
        var tabl = "";
        for(var i=0; i<g_stack.stack.length; i++) tabl = tabl + "x";
        this.ErrorConsole.log(tabl+" Diving in: "+say_type(ex.n.type) + " Executor:"+(ex.Nodes ? say_type(ex.Nodes.type) : "--") + (g_stack.EXCEPTION ? " Exception: " + g_stack.EXCEPTION : "") + ((g_stack.EXCEPTION_OBJ && g_stack.EXCEPTION) ? " obj: " + g_stack.EXCEPTION_OBJ : ""));
    }
    
    this.ExecutionContext.current = g_stack.exc; // switch context 
    //console.log("Setting exc to "+g_stack.exc);
    this.cur_stack = g_stack; // for eval () method and other context switching
    
    // !! log to the console if 'JNARIC' is in the exception object's description/message
    // otherwise - throw
    try {
        
        v = this.step_execute(ex.n, ex.x, g_stack);
        //if(ex.x.scope.object.f) this.ErrorConsole.log("f is: "+ex.x.scope.object.f+ " f.__call__ is: "+ex.x.scope.object.f.__call__);
    } catch (e) {
        // TODO: 'allocation size overflow' is not compatible with IE/Opera/v8!!
        if(e.message && ((e.message.toString().indexOf("JNARIC") >= 0) || e.message.toString() == "allocation size overflow" || (e instanceof this.global.InternalError))) {
            // log to the console
            // suggested string: TYPE(name), MESSAGE, STACK_TRACE(how to trace?)
            // TODO: STACK TRACE PRINT!!
            //if(e.name) this.ErrorConsole.log("Exception... "+e.name+" '"+e.message+"' Stack trace: "+__print_strace(g_stack));
            //else this.ErrorConsole.log("Exception... "+ e +"' Stack trace: "+__print_strace(g_stack));
            // clear the stacks, return
            ex.x.result = e;
            g_stack.EXCEPTION = THROW;
            g_stack.EXCEPTION_OBJ = e;
            
        } else {
            // TODO: add onerror event alongside with onfinish
            this.ErrorConsole.log("vm error: throwing exception '"+e.toString()+"' " + (e.message ? (e.message + ": ") : "") +(e.message ? e.message : "")+"' Stack trace: "+__print_strace(g_stack));
            // purge stack and all possible exceptions??
            delete g_stack.EXCEPTION;
            do {
                e_stack.push(g_stack.stack.pop());
            } while(!(g_stack.stack.length == 0 ))
            try {
                this.onerror && this.onerror(e);
            } catch (e) {
                this.ErrorConsole.log(".onerror event failed to execute with exception: "+e);
            }

            try {
                g_stack.onerror && g_stack.onerror(e);
            } catch (e) {
                this.ErrorConsole.log("stack .onerror event failed to execute with exception: "+e);
            }

            
            if(this.ERROR_ONFINISH && (g_stack === this.g_stack)) {
                try {
                    this.onfinish && this.onfinish();
                } catch (e) {
                    this.ErrorConsole.log(".onfinish(error) event failed to execute with exception: "+e);
                }
            }
            
            throw e;
        }
    }
    
    g_stack.exc = this.ExecutionContext.current; // switch context back...

    if(g_stack.stack.length > this.STACKSIZE) {
        // IE does not have InternalError
        // TODO: implement internalError in global!!!
        
        var e = new this.global.InternalError("too much recursion");
        ex.x.result = e;
        g_stack.EXCEPTION = THROW;
    }
    
    if(ex.done) {
        if("e" in ex) {
            if(DEBUG) {
                try {
                    this.ErrorConsole.log(tabl+"  -- setting exec: "+ex["e"]+"("+v+")"+" on "+(ex.Nodes ? say_type(ex.Nodes.type) : "--"));
                } catch (e) {
                    this.ErrorConsole.log(tabl+"  -- setting exec: "+ex["e"]+"(can't convert)"+" on "+(ex.Nodes ? say_type(ex.Nodes.type) : "--"));
                }
                
            }
            ex.pmy[ex["e"]] = v;
        }
        if("v" in ex) {
            if(DEBUG) {
                try {
                    this.ErrorConsole.log(tabl+"  -- setting exec(v): "+ex["v"]+"("+this.getValue(v)+")"+" on "+(ex.Nodes ? say_type(ex.Nodes.type) : "--"));
                } catch (e) {
                    this.ErrorConsole.log(tabl+"  -- setting exec(v): "+ex["v"]+"(can't convert) on "+(ex.Nodes ? say_type(ex.Nodes.type) : "--"));
                }
            }
            
            try { // now, we have to pay for this method of getValue calling AND exception propagation... - it may throw errors now!
                ex.pmy[ex["v"]] = this.getValue(v);
            } catch (e) {
                if(e instanceof ReferenceError) {
                    ex.x.result = e;
                    g_stack.EXCEPTION = THROW;
                    g_stack.EXCEPTION_OBJ = e;
                }
            }
        }
        ex.finally_exec && ex.finally_exec();
        
        
    }
    
    // warning! due to nature of getValue () exception setting - we will (in SOME cases) receive an exception 
    // one stack deeper than expected. That is not the problem unless we rely on the fact that TRY_WAIT
    // will not be executed if an exception is coming from the stack point where this TRY_WAIT was set
    // (do not catch ourself-generated exceptions - means do not TRY_WAIT and THROW in the same exec method)

    // now check for exception
    if(g_stack.EXCEPTION) {
        ex.finally_exec && ex.finally_exec();
        
        if(ex.EXCEPTION == THROW) ex.throw_exec && ex.throw_exec();
        // pop() until found the TRY_WAIT
        if(DEBUG) this.ErrorConsole.log("-- catch procedure started, next dive into TRY_WAIT or break the stack;");
        var t_ex;
        do {
            t_ex = g_stack.stack.pop();
            
            t_ex.finally_exec && t_ex.finally_exec();
            
            if(t_ex.EXCEPTION == THROW) t_ex.throw_exec && t_ex.throw_exec();
            
            e_stack.push(t_ex);
        } while(!(g_stack.stack.length == 0 || g_stack.stack[(g_stack.stack.length-1)].TRY_WAIT))
        
        //g_stack.push(e_stack.pop());
    } else {
        e_stack = [];
    }

    /*
    var __thiss = this;
    var faa = function () {
        __thiss.step_next(g_stack);
    }
    */
    //if(g_stack.stack.length > 0) setTimeout(step_next, STEP_TIMEOUT);
    if(g_stack.stack.length > 0) { 
        //if(!g_stack.STOP)  // a STOP flag introduced here! will suspend execution until released
            return true;
    } else {
        if(g_stack.EXCEPTION && g_stack.EXCEPTION != RETURN) {
            delete g_stack.EXCEPTION;
            
            var ex_obj;
            if(g_stack.EXCEPTION_OBJ) {
                // TODO: get rid of EXCEPTION_OBJ !!
                //this.ErrorConsole.log("Exception obj... "+g_stack.EXCEPTION_OBJ.name+" '"+g_stack.EXCEPTION_OBJ.message+" ("+g_stack.EXCEPTION_OBJ+")"+"' Stack trace: "+__print_strace(e_stack));
                ex_obj = g_stack.EXCEPTION_OBJ;
                delete g_stack.EXCEPTION_OBJ;
            } else {
                ex_obj = ex.x.result;
            }
            
            if(ex_obj.name) this.ErrorConsole.log("Exception ... "+ex_obj.name+" '"+ex_obj.message+" ("+ex_obj.result+")"+" Line: "+ex_obj.lineNumber+" File: "+ex_obj.fileName+"' Stack trace: "+__print_strace(e_stack));
            else if (ex_obj.toString instanceof this.FunctionObject) {
                
                var __onfinish = null;
                if(this.onfinish && (g_stack === this.g_stack) && (this._load_stack.length == 0)) {
                    __onfinish = this.onfinish;
                    this.onfinish = null;
                }
                /*
                - i seem to just need to set the object in scope and then evaluate 
                    - this.global[propertyName] = w;
                - in the currently running thread(context, scope & stack) of course
                - previously clean the stack (the stack may already be clean)
                */
                
                var _tihs = this;
                var _e_stack = e_stack;
                var __fexc = function () {
                    _tihs.ErrorConsole.log("DEBG: exception conversion finished");
                    _tihs.ErrorConsole.log("Exception ... " + _tihs.global.__jn_exception_string+" Stack trace: "+__print_strace(_e_stack));
                    __onfinish && __onfinish(_tihs.global.__jn_exception_string);
                }
                
                // the VM should be left in a usable state to normally execute the following:
                
                var exc_string = ' try { __jn_exception_string = __jn_exception_obj.toString(); } catch (e) { __jn_exception_string = "uncaught exception (could not convert to String, an exception occurred: "+e+")"; } ';
                this.global.__jn_exception_obj = ex_obj;
                
                var _p = parse(exc_string, "uncaught_exception_parser", 0); // errors will propagate to caller...
                g_stack.stack.push({n: _p, x: g_stack.exc, pmy: {}, finally_exec: __fexc}); // append it to the 'end' of execution stack
                this.ErrorConsole.log("DEBG: doing exception conversion...");
                //this.step_next(g_stack, e_stack);
                __jn_stacks.add_task(this, g_stack);
                
            }
            else {
                //console.log("ex_obj is: "+typeof(ex_obj)+" .toString: "+!!ex_obj.toString+" type of "+typeof(ex_obj.toString));
                this.ErrorConsole.log("Uncaught exception ... "+ex_obj+"' Stack trace: "+__print_strace(e_stack));
            }
            
            
            try {
                this.onerror && this.onerror(ex_obj);
            } catch (e) {
                this.ErrorConsole.log(".onerror event failed to execute with exception: "+e);
            } 

            try {
                g_stack.onerror && g_stack.onerror(ex_obj);
            } catch (e) {
                this.ErrorConsole.log("stack .onerror event failed to execute with exception: "+e);
            } 

            
            if(this.ERROR_ONFINISH && (g_stack === this.g_stack)) {
                try {
                    this.onfinish && this.onfinish(ex_obj);
                } catch (e) {
                    this.ErrorConsole.log(".onfinish(error) event failed to execute with exception: "+e);
                }
            }
            
        } else { 
            if(this.onfinish  && (g_stack === this.g_stack) ) {
            
                if(this._load_stack.length == 0) { // only if there is eft nothing to load & exec in main thread
                    if(DEBUG && DEBUG > 3) this.ErrorConsole.log("Firing onfinish event!");
                    try {
                        this.onfinish(ex.x.result); // main thread stack exhausted, run 'onfinish'
                    } catch (e) {
                        this.ErrorConsole.log(".onfinish event failed to execute with exception: "+e);
                    }
                }
            } else if (g_stack.onfinish) {
                if(this.DEBUG && this.DEBUG > 3) this.ErrorConsole.log("Firing onfinish event!");
                try {
                    g_stack.onfinish(ex.x.result); // main thread stack exhausted, run 'onfinish'
                } catch (e) {
                    this.ErrorConsole.log("stack .onfinish event failed to execute with exception: "+e);
                }
            }
        }
        //console.log("stack exhausted; "+(g_stack === this.g_stack)+" onfinish set "+(this.onfinish ? "yes ": "no ")+" Load stack length: "+this._load_stack.length);
        return false;
    }
}

function __print_strace(s_stack) {
    var __out = "";
    var __ex, __src="";
    if(s_stack.stack) {
        
        
        for(var i=(((s_stack.stack.length-30) < 0) ? 0 : (s_stack.stack.length-30)) ; i<s_stack.stack.length; i++) {
            __src = "";
            __ex = s_stack.stack[i];
            //__ex.n.tokenizer && (__src = String.prototype.slice.call(__ex.n.tokenizer.source, 0, 40));
            if(__ex.n) __out = __out + " >"+say_type(__ex.n.type) + "(" + __ex.n.value + ")" + " File: " + __ex.n.filename + " Line: " + __ex.n.lineno + ";";
            else __out = __out + " INTERNAL ERROR: node not defined at "+i+";";
        }
    } else {
        for(var i=( ((s_stack.length-1) > 30) ? 30 : (s_stack.length-1) ); i>=0; i--) {
            __src = "";
            __ex = s_stack[i];
            //__ex.n.tokenizer && (__src = String.prototype.slice.call(__ex.n.tokenizer.source, 0, 40));
            if(__ex.n) __out = __out + " >"+say_type(__ex.n.type) + "(" + __ex.n.value + ")" + " File: " + __ex.n.filename + " Line: " + __ex.n.lineno + ";";
            else __out = __out + " INTERNAL ERROR: node not defined at "+i+";";
        }
    }
    return __out;
}

Jnaric.prototype.step_execute = function (n, x, stack) {
  // here we define execution thread scope, etc.
    var a, f, i, j, r, s, t, u, v;

    switch (n.type) {
      case FUNCTION:
        if (n.functionForm != DECLARED_FORM) {
            if (!n.name || n.functionForm == STATEMENT_FORM) {
                v = new this.FunctionObject(n, x.scope);
                if (n.functionForm == STATEMENT_FORM)
                    x.scope.object.__defineProperty__(n.name, v, true);
                    //this.ErrorConsole.log("STMT: defined "+n.name+" v: "+x.scope.object[n.name] + "/" + v );
            } else {
                t = new Object;
                x.scope = {object: t, parent: x.scope};
                try {
                    v = new this.FunctionObject(n, x.scope);
                    t.__defineProperty__(n.name, v, true, true);
                } finally {
                    x.scope = x.scope.parent;
                }
            }
        }
        stack.my.done = true;
        break;

      case SCRIPT:
        if(!("t" in stack.my)) {
            stack.my.t = x.scope.object;
            a = n.funDecls;
            for (i = 0, j = a.length; i < j; i++) {
                s = a[i].name;
                f = new this.FunctionObject(a[i], x.scope);
                stack.my.t.__defineProperty__(s, f, x.type != EVAL_CODE);
            }
            a = n.varDecls;
            for (i = 0, j = a.length; i < j; i++) {
                u = a[i];
                s = u.name;
                if (u.readOnly && hasDirectProperty(stack.my.t, s)) {
                    x.result = TypeError("Redeclaration of const " + s,
                                        u.filename, u.lineno);
                    stack.EXCEPTION = THROW;
                    break;
                }
                if (u.readOnly || !hasDirectProperty(stack.my.t, s)) {
                    stack.my.t.__defineProperty__(s, undefined, x.type != EVAL_CODE,
                                         u.readOnly);
                }
            }
        }
        // FALL THROUGH

      case BLOCK:
        //for (i = 0, j = n.length; i < j; i++)
            //execute(n[i], x);
          if(!("i" in stack.my)) stack.my.i = 0
          stack.my.j = n.length;
          if(stack.my.i < stack.my.j) {
            
            stack.push(S_EXEC, {n: n[stack.my.i], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj}); // why the hell we need all those values?
            stack.my.i = stack.my.i + 1;
          } else {
            stack.my.done = true; // indicate we're finished
          }
        break;

      case IF:

        // we need the stepper to get us v1 first, by executing the condition
        if (!("v1" in stack.my)) {
          stack.push(S_EXEC, {v: "v1", n: n.condition, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
          break;
        } else {
          
          if (stack.my.v1) {
              //execute(n.thenPart, x);
         
              stack.push(S_EXEC, {n: n.thenPart, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj}); 
              stack.my.done = true;
         
          } else if (n.elsePart) {
             
              //execute(n.elsePart, x);
              stack.push(S_EXEC, {n: n.elsePart, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj}); 
              // now delete v1 from stack
             
              stack.my.done = true; // and we're done!
              }
        }
        
        stack.my.done = true;
        break;

      case SWITCH:

        if(!("s" in stack.my)) {
          stack.push(S_EXEC, {v: "s", n: n.discriminant, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
          stack.my.looping = false; // in case of emergency ;-)
          stack.my.matchDefault = false;
          break;
        }
        s = stack.my.s;
        a = n.cases;
        
        if(! ("i" in stack.my)) stack.my.i = 0;
        
        // here is the loop started (infinite)...
        
        j = a.length;

        if (stack.my.i == j && !stack.my.looping) {
            if (n.defaultIndex >= 0) {
                //console.log("SW no case matched, no default i="+stack.my.i);
                stack.my.i = n.defaultIndex - 1; // no case matched, do default
                stack.my.matchDefault = true;
                stack.my.i++; // pair w/next means "continue"
                delete stack.my.u;
                break; // request next iteration step
            }
            //console.log("SW DONE, exit");
            stack.my.done = true; // this means real break & release stack
            break;                      // no default, exit switch_loop
        }

        if(!stack.my.looping) { // only if not looping
            //console.log("SW not looping");
            stack.my.t = a[stack.my.i];                       // next case (might be default!)
            
            if (stack.my.t.type == CASE) {
                //console.log("SW type==case");
                // we need stack.my.u, request it!
                //if(!("u" in stack.my) || (stack.my.old_t != stack.my.t)) { // NO! always push a new computed value! 
                if(!("u" in stack.my)) {
                  //console.log("SW no u, requesting");
                  stack.push(S_EXEC, {v: "u", n: stack.my.t.caseLabel, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                  //stack.my.old_t = stack.my.t;
                  break;
                }
            } else {
                if (!stack.my.matchDefault) {          // not defaulting, skip for now
                    //console.log("SW not defaulting, skip for now i="+stack.my.i);
                    stack.my.i++;  // like continue
                    delete stack.my.u; // u is always new..
                    break;      
                }
                //console.log("SW force match to do default");
                stack.my.u = s;                      // force match to do default
            }
        }
        if (stack.my.u === s || stack.my.looping) {
            //for (;;) {                  // this loop exits switch_loop
            //console.log("SW looping");
            stack.my.looping = true;
            if (stack.my.t.statements.length) {
                //console.log("SW stmts length");
                // first, make sure the stack returned has executed our request
                if(("v2" in stack.my) || stack.EXCEPTION) {
                  // check for exceptions in stack
                  //console.log("SW v2 is there");
                  if(stack.EXCEPTION) {
                      // check type
                      if(stack.EXCEPTION == BREAK && x.target == n) {
                          //console.log("SW break exception");
                          // like catch it
                          stack.EXCEPTION = false; // if left true - propagate to further stack until caught (?????)
                          stack.my.TRY_WAIT = false;
                          stack.my.i = 0; // like begin the for loop again
                          stack.my.looping = false; // exit the loop
                          delete stack.my.u;
                          if("v2" in stack.my) delete stack.my.v2;
                          stack.my.done = true;
                          break;
                      } else {
                          break; // means we didn't catch it..
                      }
                  }
                  delete stack.my.v2;
                } else {
                  // request the bitch!
                  //console.log("SW req v2");
                  stack.push(S_EXEC, {v:"v2", n: stack.my.t.statements, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                  stack.my.TRY_WAIT = true;
                  break;
                }
            
            }
            if (++stack.my.i == j) {
                //console.log("SW i=j, returning to for");
                stack.my.i = 0; // like begin the for loop again
                stack.my.looping = false; // exit the loop // in fact this is not required since we dont delete my.u
                delete stack.my.u;
                if(stack.my.matchDefault) stack.my.done = true;
                break;
            }
            
            //console.log("SW taking new stack.my.t for "+stack.my.i);
            stack.my.t = a[stack.my.i];
            break; // request next iteration
            //}
            // NOT REACHED
        }
        //console.log("SW incrementing stack.my.i was:"+stack.my.i);
        stack.my.i++;
        delete stack.my.u
        //}
        
        break;

      case FOR:
        if(n.setup && (! ("uu" in stack.my))) {

            stack.push(S_EXEC, {v: "uu", n: n.setup, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        }
        // FALL THROUGH
      case WHILE:
        if(!("lastnc" in stack.my)) stack.my.lastnc = 0;
        if(!("get0_step" in stack.my)) stack.my.get0_step = true;
        
    
        if(stack.my.get0_step) {
          if(n.condition) {
              stack.push(S_EXEC, {v: "wv", n: n.condition, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
              stack.my.get0_step = false;
              break;
          } else {
              stack.my.wv = true;
          }
        } else {
          //stack.my.get0_step = true;
        }

        
        
        // WHILE REPLACE BY THIS
        if (n.condition && !stack.my.wv) {
            stack.my.done = true;
            break;
        }
        
        //{        
        
        if(("v2" in stack.my) || stack.EXCEPTION) {
          // check for exceptions in stack
          if(stack.EXCEPTION) {
              // check type
              if(stack.EXCEPTION == CONTINUE && x.target == n) {
                  // like catch it
                  stack.EXCEPTION = false; // if left true - propagate to further stack until caught (?????)
                  stack.my.TRY_WAIT = false;
                  //if("v2" in stack.my) 
                  delete stack.my.v2;
                  break;
              } else if (stack.EXCEPTION == BREAK && x.target == n) {
                  // like catch it
                  stack.EXCEPTION = false; // if left true - propagate to further stack until caught (?????)
                  stack.my.TRY_WAIT = false;
                  stack.my.done = true;
                  break;                  
              } else {
                  break; // means we didn't catch it..
              }
          }
          delete stack.my.v2;
          delete stack.my.wv;
          stack.my.get0_step = true;
        } else {
          // request the bitch!
          stack.push(S_EXEC, {v:"v2", n: n.body, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
          stack.my.TRY_WAIT = true;
          break;
        }      


        if(n.update) {
          stack.push(S_EXEC, {n: n.update, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
        } 
        //}
        
        
        break;

      case FOR_IN:
        u = n.varDecl;
        //if (u)
        //    execute(u, x);
        
        if(! ("uu" in stack.my) && u) {
            
            stack.push(S_EXEC, {v: "uu", n: u, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        }
        
        r = n.iterator;
        
        


        if(! ("v0" in stack.my)) {
            stack.push(S_EXEC, {v: "v0", e: "s", n: n.object, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.my.i = 0; // cheat, only once exec
            break;
        }
        
        
        // ECMA deviation to track extant browser JS implementation behavior.
        if(!("t" in stack.my)) stack.my.t = (stack.my.v0 == null && !x.ecmaStrictMode) ? stack.my.v0 : this.toObject(stack.my.v0, stack.my.s, n.object);
        if(!("a" in stack.my)) {
            stack.my.a = [];
            for (i in stack.my.t)
                if( (i != "__defineProperty__") && (i.substr(0,3) != "___")) stack.my.a.push(i);
            
        }
            
        //for (i = 0, j = a.length; i < j; i++) {
        
        j = stack.my.a.length;
        if(stack.my.i >= j) {
            stack.my.done = true;
            break;
        }
        // else just fall
        //execute(r, x)
        
        if(! ("sres" in stack.my)) {
            stack.push(S_EXEC, {e: "sres", n: r, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.my.vput = false;
            break;
        }
        
        if(!stack.my.vput) {
            this.putValue(stack.my.sres, stack.my.a[stack.my.i], r);
            
            stack.my.vput = true;
        }
        
        if("v2" in stack.my || stack.EXCEPTION) {
            // check for exceptions in stack
            if(stack.EXCEPTION) {
                // check type
                if(stack.EXCEPTION == CONTINUE && x.target == n) {
                    // like catch it
                    stack.EXCEPTION = false; // if left true - propagate to further stack until caught (?????)
                    stack.my.TRY_WAIT = false;
                    delete stack.my.v2;
                    delete stack.my.sres;
                    stack.my.i++;
                    break;
                } else if (stack.EXCEPTION == BREAK && x.target == n) {
                    // like catch it
                    stack.EXCEPTION = false; // if left true - propagate to further stack until caught (?????)
                    stack.my.TRY_WAIT = false;
                    stack.my.done = true;
                    break;                  
                } else {
                    break; // means we didn't catch it..
                }
            }
            stack.my.i++;
            delete stack.my.sres;
            delete stack.my.v2;
        } else {
            // request the bitch!
            
            stack.push(S_EXEC, {v:"v2", n: n.body, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.my.TRY_WAIT = true;
            break;
        }
        
        
        //delete stack.my.sres;
        //}
        
        
        break;

      case DO:
      
        
        if("v2" in stack.my || stack.EXCEPTION) {
            // check for exceptions in stack
            if(stack.EXCEPTION) {
                // check type
                if(stack.EXCEPTION == CONTINUE && x.target == n) {
                    // like catch it
                    stack.EXCEPTION = false; // if left true - propagate to further stack until caught (?????)
                    stack.my.TRY_WAIT = false;
                    delete stack.my.v2;
                    
                    break; // continue means we check or not??? -- seems not..
                } else if (stack.EXCEPTION == BREAK && x.target == n) {
                    // like catch it
                    stack.EXCEPTION = false; // if left true - propagate to further stack until caught (?????)
                    stack.my.TRY_WAIT = false;
                    stack.my.done = true;
                    break;                  
                } else {
                    break; // means we didn't catch it..
                }
            }
        } else {
            // request the bitch!
            stack.push(S_EXEC, {v:"v2", n: n.body, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.my.TRY_WAIT = true;
            break;
        }

        
        if(!("condx" in stack.my)) {
            stack.push(S_EXEC, {v:"condx", n: n.condition, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        }
        if(! stack.my.condx) {
            stack.my.done = true;
        }
        delete stack.my.condx;
        delete stack.my.v2

        break;

      case BREAK:
      case CONTINUE:
        x.target = n.target;
        //throw n.type;
        stack.EXCEPTION = n.type;
        
        stack.my.done = true;
        break;

      case TRY:        
        if(("v2" in stack.my) || stack.my.loop || stack.EXCEPTION) {
            // check for exceptions in stack
            if(!stack.my.v2) stack.my.v2 = "shit";
            if(this.DEBUG > 3) this.ErrorConsole.log(stack.stack.length+"value okay or loop or ex");
            if(stack.EXCEPTION || stack.my.loop) {
                // check type
                if(this.DEBUG > 3)this.ErrorConsole.log("ex or loop: ex: "+stack.EXCEPTION+" e: "+x.result);
                if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                if((stack.EXCEPTION == THROW && (j = n.catchClauses.length)) || (stack.my.loop && (j = n.catchClauses.length))) {
                    if(this.DEBUG > 3)this.ErrorConsole.log("ex = throw!!:" + stack.EXCEPTION + ":" + (stack.EXCEPTION == THROW));
                    if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                    if(!("i" in stack.my)) stack.my.i = 0; // init the loop
                    t = n.catchClauses[stack.my.i];
                    if(!stack.my.reach2try) { // we're only trying to reach the second try block...
                        if(!("e" in stack.my)) {
                            stack.my.e = x.result;
                            if(this.DEBUG > 3)this.ErrorConsole.log("x.result done");
                        }
                        x.result = undefined;
                        
                        if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                        if(!stack.my.ex1caught) {
                            if(this.DEBUG > 3)this.ErrorConsole.log("EX=false; caught1 true");
                            if(this.DEBUG > 3) {var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                            stack.my.ex1caught = true;
                            stack.EXCEPTION = false;
                            stack.my.TRY_WAIT = false;
                        }
                        
                        if(stack.my.i == j) {
                            //x.result = stack.my.e; // here hides the EXCEPTION_OBJ
                            if(this.DEBUG > 3)this.ErrorConsole.log("i = j!! throw again!!! blin!!!");
                            if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                            // stack.EXCEPTION = THROW; // but still execute filnally!! ECMA...
                            stack.my.loop = false;
                            delete stack.EXCEPTION;
                            stack.my.savedException = THROW;
                            stack.my.savedResult = stack.my.e;
                            break;
                        }
                        stack.my.loop = true;
                        if(this.DEBUG > 3)this.ErrorConsole.log("loop setup ok; scope setup done");
                        if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                        x.scope = {object: {}, parent: x.scope};
                        x.scope.object.__defineProperty__(t.varName, stack.my.e, true);                    
                    } 
                    
                    if(t.guard && (!stack.my.ex2caught)) {
                        stack.my.ex2caught = true;
                        if(this.DEBUG > 3)this.ErrorConsole.log("t guard");
                        if(this.DEBUG > 3) {var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                        // another try block here...///////////////////////
                        if("v3" in stack.my || stack.EXCEPTION) {

                            DEBUG = 0;
                            if(this.DEBUG > 3)this.ErrorConsole.log("v3 there or ex");
                            if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                            
                            //  to actually follow the spec...
                            if(!stack.my.ex2caught) { // but we're not catching exceptions, we only executing finally block!
                                stack.my.ex2caught = true;
                                stack.my.TRY_WAIT = false;
                                if(this.DEBUG > 3)this.ErrorConsole.log("ex2 caught (not caught!)");
                                if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                            }
                            if(!stack.my.v3 && !stack.EXCEPTION) {
                                if(this.DEBUG > 3)this.ErrorConsole.log("emulating continue! scope back...");
                                if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                                // emulate continue
                                delete stack.my.v3; // get another value if required
                                stack.my.ex2caught = false;
                                stack.my.reach2try = false; // 
                                stack.my.i++;
                                x.scope = x.scope.parent;
                                break;
                            }
                            
                            // now finally...
                            
                            if(stack.EXCEPTION) {
                                if(this.DEBUG > 3)this.ErrorConsole.log("finally in t.guard... scope back");
                                if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                                x.scope = x.scope.parent;
                                
                                // break; // will blow away since exception // commented out to actually follow the  spec...
                                
                                stack.my.savedException = stack.EXCEPTION;
                                stack.my.savedResult = x.result;
                                delete stack.EXCEPTION;
                            
                                stack.my.loop = false;
                                
                                break;
                            }
                             // <-  to actually follow the  spec...
                            
                        } else {
                            
                            stack.push(S_EXEC, {v:"v3", n: t.guard, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                            stack.my.TRY_WAIT = true;
                            stack.my.reach2try = true;
                            stack.my.ex2caught = false;
                            if(this.DEBUG > 3)this.ErrorConsole.log("requesting v3");
                            if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                            break;
                        }
                    }

                    /////////////////////////////////////////////////////
                    // the last TRY block!!
                    if("v4" in stack.my || stack.EXCEPTION) {
                        if(this.DEBUG > 3)
                            this.ErrorConsole.log("v4 there or ex, ex: "+stack.EXCEPTION);
                        if(this.DEBUG > 3){var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                        if(!stack.my.ex3caught) { // i'm not sure this is required here though...
                            if(this.DEBUG > 3)this.ErrorConsole.log(stack.stack.length+"ex3caught yo");
                            if(this.DEBUG > 3) {var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                            stack.my.ex3caught = true;
                            stack.my.TRY_WAIT = false;
                        }
                        if(!stack.EXCEPTION) {
                            
                            if(this.DEBUG > 3)this.ErrorConsole.log(stack.stack.length+"break the loop and exit (BREAK)");
                            if(this.DEBUG > 3) {var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                            stack.my.loop = false;
                            stack.my.i = 0;
                            stack.my.reach2try = false;
                            if(this.DEBUG > 3)this.ErrorConsole.log(stack.stack.length + "... scope back");
                            x.scope = x.scope.parent; // means 'finally'
                            break; // break the loop and EXIT
                        } else {
                            if(this.DEBUG > 3)this.ErrorConsole.log(stack.stack.length + "finally in v4... scope back");
                            if(this.DEBUG > 3) { var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                            x.scope = x.scope.parent; // means 'finally'
                            //break; // will blow away exception up
                            stack.my.savedException = stack.EXCEPTION;
                            stack.my.savedResult = x.result;
                            delete stack.EXCEPTION;
                            stack.my.loop = false;
                            
                            break;
                        }
                        
                    } else {
                        // request the bitch!
                        if(this.DEBUG > 3)
                            this.ErrorConsole.log(stack.stack.length+"requesting v4 (last try block)");
                        if(this.DEBUG > 3) {var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                        stack.push(S_EXEC, {v:"v4", n: t.block, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                        stack.my.TRY_WAIT = true;
                        stack.my.reach2try = true;
                        stack.my.ex3caught = false;
                        break;
                    }

                    // code to execute finally (in case nothing exceptioned happened) goes here...
                    if(this.DEBUG > 3)this.ErrorConsole.log(stack.stack.length+"executing the other shit... scope back");
                    if(this.DEBUG > 3) {var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                    delete stack.my.v3;
                    delete stack.my.v4;
                    stack.my.ex1caught = false;
                    stack.my.ex2caught = false;
                    stack.my.ex3caught = false;
                    x.scope = x.scope.parent;
                    //break; // the exception will go up the stack...
                    
                } else {
                    // means we didn't catch it.. so continue to n.finallyBlock down
                }
            }
            if(stack.my.loop) {
                if(this.DEBUG > 3)this.ErrorConsole.log(stack.stack.length+"looping again");
                if(this.DEBUG > 3) { var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                stack.my.i++;
                stack.my.reach2try = false;
                break; // we don't want to fall down to finallyBlock
            }
            
            // if we're not looping then we're finallyBlock'ing!
            if (n.finallyBlock) {
                // we need to temporarily remove the exception from stack to execute finally block
                // then introduce back
                if(this.DEBUG > 3)
                    this.ErrorConsole.log(stack.stack.length+"in finally block!");
                if(!("ve" in stack.my)) {
                    if(this.DEBUG > 3)this.ErrorConsole.log(stack.stack.length+"finallyblock - requesting ve");
                    if(this.DEBUG > 3) {var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
                    if(stack.EXCEPTION) {
                        stack.my.exc = stack.EXCEPTION;
                        stack.my.result = x.result;
                        stack.my.exobj = stack.EXCEPTION_OBJ;
                        if(this.DEBUG > 3)this.ErrorConsole.log("storing exception for later rethrow: "+stack.my.result);
                        delete stack.EXCEPTION;
                    }
                    
                    stack.push(S_EXEC, {v:"ve", n: n.finallyBlock, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                    break;
                }
                // now, here we reach with finallyBlock has been executed
                if(!stack.EXCEPTION) {
                    if(stack.my.exc) {
                        if(this.DEBUG > 3)this.ErrorConsole.log("okay, stack.my.exc, exiting");
                        stack.EXCEPTION = stack.my.exc;
                        x.result = stack.my.result;
                        stack.EXCEPTION_OBJ = stack.my.exobj;
                        
                    }
                    
                    if ( stack.my.savedException ) {
                                //this.ErrorConsole.log("re-introducing ex: "+stack.my.savedException+" whith v: "+stack.my.savedResult);
                                stack.EXCEPTION = stack.my.savedException;
                                x.result = stack.my.savedResult;
                    }
                }
                // okay, just finish after finally block
                stack.my.done = true;
            
            } else {
                if ( stack.my.savedException ) {
                    //this.ErrorConsole.log("re-introducing ex: "+stack.my.savedException+" whith v: "+stack.my.savedResult);
                    stack.EXCEPTION = stack.my.savedException;
                    x.result = stack.my.savedResult;
                }
                stack.my.done = true;
            }
        } else {
            // request the bitch!
            if(this.DEBUG > 3)this.ErrorConsole.log("requesting  v2");
            if(!("v2" in stack.my)) {
                if(this.DEBUG > 3)this.ErrorConsole.log("!!!!!!!!!! v2 is not in stack.my");
                if(this.DEBUG > 3) {var vvvx = []; for(var ob in stack.my) vvvx.push(ob); this.ErrorConsole.log(vvvx);}
            }
            stack.push(S_EXEC, {v:"v2", n: n.tryBlock, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.my.TRY_WAIT = true;
            break;
        }
        
        
        break;

      case THROW:
        
        if(!("v2" in stack.my)) {
            // request the bitch!
            stack.push(S_EXEC, {v:"v2", n: n.exception, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            // any code in 'finally' block will go here
            // ...
            
            x.result = stack.my.v2;
            stack.EXCEPTION = THROW;

            
            //delete stack.my.v2; // finally, delete the tmp variable
        }
        stack.my.done = true;
        break;

      case RETURN:
        if(typeof n.value == "string" ) {
                x.result = undefined;
                stack.EXCEPTION = RETURN;
                stack.my.done = true;        
        } else {
            if(!("v2" in stack.my)) {
                stack.push(S_EXEC, {v:"v2", n: n.value, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                break;
            } else {
                x.result = stack.my.v2;
                stack.EXCEPTION = RETURN;
                //stack.EXCEPTION_OBJ = stack.my.v2;
            }
            stack.my.done = true;
        }
        break;
        
        
      case WITH:
        
        if(!("r" in stack.my)) {
            stack.push(S_EXEC, {e:"r", n: n.object, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            if(!("t" in stack.my)) {
                stack.my.tt = this.getValue(stack.my.r);
                stack.my.t = this.toObject(stack.my.tt, stack.my.r, n.object);
                if(stack.my.t === stack.my.tt) { // BUG MOZ 184107
                    stack.my.t = new Object();
                    for(var _ob in stack.my.tt) stack.my.t[_ob] = stack.my.tt[_ob];
                }
                if(stack.EXCEPTION && (x.result instanceof ReferenceError)) return; // check for exception after getValue
                
                x.scope = {object: stack.my.t, parent: x.scope};
            }
            
            
            
            if(!("v2" in stack.my) && !stack.EXCEPTION) {
                stack.push(S_EXEC, {v:"v2", n: n.body, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                
                // this single line sets TRY while executing
                stack.my.TRY_WAIT = true;
                break;
            } 
            stack.my.TRY_WAIT = false;
            // THERE SHOULD BE A RETURN ANYWAYS
            
                // any code in 'finally' block will go here
                // ...
                // According to ECMA, new scope(function) objects should propagate to parent
                //var _shit = "";
                //for(var __ob in x.scope.object) _shit = _shit + __ob + "; ";
                //console.log("saerching scope " + _shit);
                
                for(var __ob in x.scope.object) { 
                    if((x.scope.object[__ob] instanceof this.FunctionObject) && (x.scope.object[__ob].node.functionForm == STATEMENT_FORM)) { // BUG MOZ 184107
                        // means we are new statement form function
                        //console.log("setting "+__ob+ " in parent scope: "+x.scope.parent);
                        x.scope.parent.object[__ob] = x.scope.object[__ob];
                    } else {
                        if(x.scope.object[__ob] !== stack.my.tt[__ob]) { // BUG MOZ 185485 means value changed
                            stack.my.tt[__ob] = x.scope.object[__ob];
                        }
                    }
                }
                
                x.scope = x.scope.parent;
                
                stack.my.done=true;
                break;
                
                
                delete stack.my.v2; // finally, delete the tmp variable
            
            
            
            delete stack.my.r; // finally, delete the tmp variable
        }
        break;

      case VAR:
      case CONST:
        if(!("i" in stack.my)) {
            stack.my.i=0;
            stack.my.j = n.length;
        }
        
        if( stack.my.i >= stack.my.j ) {
            stack.my.done = true;
            break;
        }
        

        
        if(!("u" in stack.my)) {
            stack.my.u = n[stack.my.i].initializer;
            if(!stack.my.u) {
              delete stack.my.u;
              stack.my.i++; // means continue
              break;
            }

            stack.my.t = n[stack.my.i].name;
            for (stack.my.s = x.scope; stack.my.s; stack.my.s = stack.my.s.parent) {
                    if (hasDirectProperty(stack.my.s.object, stack.my.t))
                        break;
            }
            
            stack.push(S_EXEC, {v:"u", n: stack.my.u, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            if (n.type == CONST)
                stack.my.s.object.__defineProperty__(stack.my.t, stack.my.u, x.type != EVAL_CODE, true);
            else {
                
                stack.my.s.object[stack.my.t] = stack.my.u;
            }
            
            delete stack.my.u; // finally, delete the tmp variable
        }
        
        stack.my.i++;
        break;

      case DEBUGGER:
        stack.EXCEPTION = "NYI: " + tokens[n.type];
        break;

      case SEMICOLON:
        if (n.expression) {
          

          
          
            if(!("v2" in stack.my)) {
                
                stack.push(S_EXEC, {v:"v2", n: n.expression, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                break;
            } else {

                x.result = stack.my.v2;
                
                delete stack.my.v2; // finally, delete the tmp variable
            }
          
          
          
        }
        stack.my.done = true;
        break;

      case LABEL:
        
        if(!("v2" in stack.my) && !stack.EXCEPTION) {
            stack.push(S_EXEC, {v:"v2", n: n.statement, x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            
            // this single line sets TRY while executing
            stack.my.TRY_WAIT = true;
            break;
        } 
            // any code in 'finally' block will go here
            // ...
            
            if(stack.EXCEPTION) {
                // check type
                if(stack.EXCEPTION == BREAK && x.target == n) {
                    // like catch it
                    stack.EXCEPTION = false; // if left true - propagate to further stack until caught (?????)
                    stack.my.TRY_WAIT = false;
                    
                    delete stack.my.v2; // this is equivalent to CONTINUE
                    stack.my.done = true;
                    break; 
                } else {
                    // this will finish the execution anyway...
                    break; // means we didn't catch it..
                }
            }
            
            
            delete stack.my.v2; // finally, delete the tmp variable
        
        
        stack.my.done = true;
        break;

      case COMMA:
        // IDEAL ITERATED 'FOR' LOOP
        
        
        if(!("i" in stack.my)) {
            stack.my.i = 0;
            stack.my.j = n.length;
        }
        
        if(stack.my.i >= stack.my.j) {
            stack.my.done = true;
            break;
        }
        
        stack.push(S_EXEC, {v:"v2", n: n[stack.my.i], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
        
        
        stack.my.i++;
        break;

      case ASSIGN:
        
        if(!("r" in stack.my)) {
            
            stack.push(S_EXEC, {e:"r", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj, iwana: "ASSIGN"});
            break;
        } else {
            
            if(!("v0" in stack.my)) {
                //stack.my.t = n[0].assignOp;
                
                if (n[0].assignOp)
                    stack.my.u = this.getValue(stack.my.r);
                if(stack.EXCEPTION && (x.result instanceof ReferenceError)) return; // check for exception after getValue
                
                stack.push(S_EXEC, {v:"v0", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                break;
            } else {
                t = n[0].assignOp;
                v = stack.my.v0;
                
                if (t) {
                    switch (t) {
                      case BITWISE_OR:  v = stack.my.u | v; break;
                      case BITWISE_XOR: v = stack.my.u ^ v; break;
                      case BITWISE_AND: v = stack.my.u & v; break;
                      case LSH:         v = stack.my.u << v; break;
                      case RSH:         v = stack.my.u >> v; break;
                      case URSH:        v = stack.my.u >>> v; break;
                      case PLUS:        v = stack.my.u + v; break;
                      case MINUS:       v = stack.my.u - v; break;
                      case MUL:         v = stack.my.u * v; break;
                      case DIV:         v = stack.my.u / v; break;
                      case MOD:         v = stack.my.u % v; break;
                    }
                }
                this.putValue(stack.my.r, v, n[0]);
            }
        }
        
        stack.my.done = true;
        break;
        
        
        
      case HOOK:
        if(!("r" in stack.my)) {
            stack.push(S_EXEC, {v:"r", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            if(stack.my.r) {
              
              if(!("v0" in stack.my)) {
                  stack.push(S_EXEC, {v:"v0", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                  break;
              } else {
                  v = stack.my.v0;
              }
              
            } else {
            
              if(!("v1" in stack.my)) {
                  stack.push(S_EXEC, {v:"v1", n: n[2], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                  break;
              } else {
                  v = stack.my.v1;
              }
            
            }
        }
        stack.my.done = true;
        break;

        
        
        
      case OR:
        
        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            
            break;
        } else {
            if(!stack.my.r1) {
                if(!("r2" in stack.my)) {
                    
                    stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                    break;
                } else {
                    v = stack.my.r1 || stack.my.r2;
                }

            } else {
                v = true;
            }
        }
        stack.my.done = true;
        break;        
        
        
        
      case AND:
        
        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            
            break;
        } else {
            if(stack.my.r1) {
                if(!("r2" in stack.my)) {
                    
                    stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                    break;
                } else {
                    v = stack.my.r1 && stack.my.r2;
                }

            } else {
                v = false;
            }
        }
        stack.my.done = true;
        break;        
        
        

      case BITWISE_OR:
        
        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 | stack.my.r2;
        }
        stack.my.done = true;
        break;
        

      case BITWISE_XOR:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 ^ stack.my.r2;
        }
        stack.my.done = true;
        break;

      case BITWISE_AND:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 & stack.my.r2;
        }
        stack.my.done = true;
        break;


      case EQ:
        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 == stack.my.r2;
        }
        stack.my.done = true;
        break;


      case NE:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 != stack.my.r2;
        }
        stack.my.done = true;
        break;


      case STRICT_EQ:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 === stack.my.r2;
        }
        stack.my.done = true;
        break;


      case STRICT_NE:
        
        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 !== stack.my.r2;
        }
        stack.my.done = true;
        break;


      case LT:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 < stack.my.r2;
        }
        stack.my.done = true;
        break;


      case LE:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 <= stack.my.r2;
        }
        stack.my.done = true;
        break;


      case GE:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 >= stack.my.r2;
        }
        stack.my.done = true;
        break;


      case GT:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 > stack.my.r2;
        }
        stack.my.done = true;
        break;


      case LSH:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 << stack.my.r2;
        }
        stack.my.done = true;
        break;


      case RSH:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 >> stack.my.r2;
        }
        stack.my.done = true;
        break;


      case URSH:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 >>> stack.my.r2;
        }
        stack.my.done = true;
        break;


      case PLUS:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 + stack.my.r2;
        }
        stack.my.done = true;
        break;


      case MINUS:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 - stack.my.r2;
        }
        stack.my.done = true;
        break;


      case MUL:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 * stack.my.r2;
        }
        stack.my.done = true;
        break;


      case DIV:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 / stack.my.r2;
        }
        stack.my.done = true;
        break;


      case MOD:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 % stack.my.r2;
        }
        stack.my.done = true;
        break;

        
      case NOT:
        
        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            
            break;
        } else {
            v = !stack.my.r1;
        }
        stack.my.done = true;
        break;


      case BITWISE_NOT:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            
            break;
        } else {
            v = ~stack.my.r1;
        }
        stack.my.done = true;
        break;

      case UNARY_PLUS:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            
            break;
        } else {
            v = +stack.my.r1;
        }
        stack.my.done = true;
        break;

      case UNARY_MINUS:

        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            
            break;
        } else {
            v = -stack.my.r1;
        }
        stack.my.done = true;
        break;
        

      case IN:
        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"r2", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = stack.my.r1 in stack.my.r2;
        }
        stack.my.done = true;
        break;

        
        
        
      case INSTANCEOF:

        if(!("t" in stack.my)) {
            stack.push(S_EXEC, {v:"t", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"u", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            
            if (isObject(stack.my.u) && typeof stack.my.u.__hasInstance__ == "function")
                v = stack.my.u.__hasInstance__(stack.my.t);
            else
                v = stack.my.t instanceof stack.my.u;
                
        }
        stack.my.done = true;
        break;
        
      case DELETE:

        if(!("t" in stack.my)) {
            stack.push(S_EXEC, {e:"t", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            v = !(stack.my.t instanceof Reference) || delete stack.my.t.base[stack.my.t.propertyName];
        }
        stack.my.done = true;
        break;


      case VOID:
        if(!("t" in stack.my)) {
            stack.push(S_EXEC, {e:"t", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {

        }
        stack.my.done = true;
        break;

      case TYPEOF:
        
        if(!("t" in stack.my)) {
            stack.push(S_EXEC, {e:"t", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            if (stack.my.t instanceof Reference)
                stack.my.t = stack.my.t.base ? stack.my.t.base[stack.my.t.propertyName] : undefined;
            
            if(stack.my.t instanceof this.FunctionObject) v = "function";
            else v = typeof stack.my.t;
        }
        stack.my.done = true;
        break;

      case INCREMENT:
      case DECREMENT:
        if(!("t" in stack.my)) {
            stack.push(S_EXEC, {e:"t", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            u = Number(this.getValue(stack.my.t));
            if(stack.EXCEPTION && (x.result instanceof ReferenceError)) return; // check for exception after getValue
            if (n.postfix)
                v = u;
            this.putValue(stack.my.t, (n.type == INCREMENT) ? ++u : --u, n[0]);
            if (!n.postfix)
                v = u;
        }
        stack.my.done = true;
        break;
        
      case DOT:
        if(!("r" in stack.my)) {
            stack.push(S_EXEC, {e:"r", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            t = this.getValue(stack.my.r);
            if(stack.EXCEPTION && (x.result instanceof ReferenceError)) return; // check for exception after getValue
            u = n[1].value;
            v = new Reference(this.toObject(t, stack.my.r, n[0]), u, n);
        }
        stack.my.done = true;
        break;

      case INDEX:
        if(!("r" in stack.my)) {
            stack.push(S_EXEC, {e:"r", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {v:"u", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            t = this.getValue(stack.my.r);
            if(stack.EXCEPTION && (x.result instanceof ReferenceError)) return; // check for exception after getValue
            v = new Reference(this.toObject(t, stack.my.r, n[0]), String(stack.my.u), n);
        }
        stack.my.done = true;
        break;
        
      case LIST:
        // Curse ECMA for specifying that arguments is not an Array object!

        if(!("i" in stack.my)) {
            stack.my.i = 0;
            stack.my.j = n.length;
            stack.my.vcc = {};
        }
        
        if(stack.my.i >= stack.my.j) {
            stack.my.done = true;
            stack.my.vcc.__defineProperty__('length', stack.my.i, false, false, true);
            v = stack.my.vcc;
            break;
        }
        
        if(!("u" in stack.my)) {
            stack.push(S_EXEC, {v:"u", n: n[stack.my.i], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            
            stack.my.vcc.__defineProperty__(stack.my.i, stack.my.u, false, false, true);
            delete stack.my.u
        }
        
        stack.my.i++;
        break;
        
        
        

        
        
        
        
      case CALL:
        //r = execute(n[0], x);
        //a = execute(n[1], x);
        // .v
        if(!("r" in stack.my)) {
            stack.push(S_EXEC, {e:"r", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.push(S_EXEC, {e:"a", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            stack.my.oldxx = x;
            break;
        } else {
          
            f = this.getValue(stack.my.r);
            if(stack.EXCEPTION && (x.result instanceof ReferenceError)) return; // check for exception after getValue
            if (isPrimitive(f) || typeof f.__call__ != "function") {
                stack.EXCEPTION_OBJ = new TypeError(stack.my.r + " is not callable",
                                    n[0].filename, n[0].lineno);
                stack.EXCEPTION = THROW;
                break;
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
// !! still don't understand... how and who will catch the exception? where is exception obj?
// !! here stack.exception should not equal to THROW! but i still dunno whats goin on...
               
            }
            t = (stack.my.r instanceof Reference) ? stack.my.r.base : null;
            if (t instanceof Activation)
                t = null;
           
            if(!("v0" in stack.my) && !stack.EXCEPTION) {
                //this.ErrorConsole.log("requesting v0");
                if(f === this.global.eval) { // eval is a special keyword!
                    bb = Array.prototype.splice.call(stack.my.a, 0, stack.my.a.length);
                    // what if bb is "" ? => evaluate to undefined
                    if(this.DEBUG > 3) this.ErrorConsole.log("requesting v0 from eval with "+bb);
                    
                    this.ExecutionContext.current = x;
                    this.global.eval.apply(this, bb); // do eval.. will add 'v0' too
                    stack.my.TRY_WAIT = true;
                    break;
                } else {
                    //console.log("calling __call__");
                    f.__call__(t, stack.my.a, x, stack); // this will add 'v0'
                    stack.my.TRY_WAIT = true;
                    break;
                }
                // we should catch RETURN and THROW here
            } 
         
            stack.my.TRY_WAIT = false;
            // 'v' is in there means we're finished execing
            if(stack.EXCEPTION) {
                
                if(stack.EXCEPTION == RETURN) {
                    v = stack.my.x2.result;
                    
                    stack.EXCEPTION = false;
                  
                    this.ExecutionContext.current = stack.my.oldxx;
                  
                    stack.my.done = true;
                    
                    break;
                } else if (stack.EXCEPTION == THROW) {
                    if(stack.my.x2 && stack.my.x2.result) x.result = stack.my.x2.result; // after all, stack.my.x2.result will contain the result!
                    else {
                        if(DEBUG) { this.ErrorConsole.log("NOT Setting CALL result to UNDEFINED"); }
                        //x.result = undefined;
                    }
                    this.ExecutionContext.current = stack.my.oldxx;
                   
                    stack.my.done = true; // this is not required :-)
                    break; // the exception propagate further (like throw it again)
                }
                
                this.ErrorConsole.log("JNARIC: strange behaviour at CALL exception");
                
            }
            // else
            if(f === this.global.eval) {
                v = x.result;
                //v = stack.my.v0;
                if(this.DEBUG > 3) { try { this.ErrorConsole.log("setting EVAL result to "+v); } catch (e) { this.ErrorConsole.log("setting EVAL result to [Object: cannot convert to string]"); } };
            }
            else {
                v = undefined;
                this.ExecutionContext.current = stack.my.oldxx;
                if(DEBUG) this.ErrorConsole.log("WARNING! Setting CALL to DONE in an unexpected SCRIPT END");
            }
            stack.my.done = true;
        
        }
        

            // in case of RETURN
            // IN CASE OF ANY EXCEPTION WE WILL ___NOT___ GET THE VALUE!!!!
            // TODO: FOR EVERY SAKE THAT WAITS EXCEPTIONS: DO NOT WAIT FOR VALUE!!!!!!
            // WAIT FOR VALUE OR EXCEPTION!!!!!!!
            // JUST DO NOT DO ELSE ON EXCEPTION WATCHING!!!! THAT IS STUPID!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1

        
        break;
        

      case NEW:
      case NEW_WITH_ARGS:
        
        if(!("r" in stack.my)) {
            stack.push(S_EXEC, {e:"r", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            if(!("f" in stack.my)) stack.my.f = this.getValue(stack.my.r);
            if(stack.EXCEPTION && (x.result instanceof ReferenceError)) return; // check for exception after getValue
            
            if (n.type == NEW) {
                stack.my.a = {};
                stack.my.a.__defineProperty__('length', 0, false, false, true);
            } else {
            
                if(!("a" in stack.my)) {
                    stack.push(S_EXEC, {e:"a", n: n[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                    break;
                } else {
                    //a = stack.my.a;
                }
            }
        
            if (isPrimitive(stack.my.f) || typeof stack.my.f.__construct__ != "function") {
                stack.EXCEPTION_OBJ = new TypeError(r + " is not a constructor",
                                    n[0].filename, n[0].lineno);
                stack.EXCEPTION = THROW;
                break;
            }
            
            
            if(!("v0" in stack.my) && !stack.EXCEPTION) {
                stack.my.f.__construct__(stack.my.a, x, stack); // this will add 'v'
                stack.my.TRY_WAIT = true;
                break;
                // we should catch RETURN and THROW here
            } 
                stack.my.TRY_WAIT = false;
                // 'v' is in there means we're finished execing
                if(stack.EXCEPTION) {
                    if(stack.EXCEPTION == RETURN) {
                        v = stack.my.x2.result;
                        if(!isObject(v))
                          v = stack.my.o; // o is defined at __construct__
                        

                        stack.EXCEPTION = false;
                        this.ExecutionContext.current = stack.my.oldx;
                        stack.my.done = true;
                        break;
                    } else if (stack.EXCEPTION == THROW) {
                        x.result = stack.my.x2.result; // after all, stack.my.x2.result will contain the result!
                        this.ExecutionContext.current = stack.my.oldx;
                        stack.my.done = true; // this is not required :-)
                        break; // the exception propagate further (like throw it again)
                    }
                    
                }
                // else
                v = stack.my.v0;
                if(!isObject(v))
                    v = stack.my.o; // o is defined at __construct__
                this.ExecutionContext.current = stack.my.oldx;
                stack.my.done = true;
            
        
        }
        break;
        
      case ARRAY_INIT:
        if(!("i" in stack.my)) {
            stack.my.i = 0;
            stack.my.j = n.length;
            stack.my.vcc = [];
        }
        
        if(stack.my.i >= stack.my.j) {
            stack.my.done = true;
            v = stack.my.vcc;
            v.length = stack.my.j;
            break;
        }
        
        if(!("v2" in stack.my)) {
            stack.push(S_EXEC, {v:"v2", n: n[stack.my.i], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            break;
        } else {
            stack.my.vcc[stack.my.i] = stack.my.v2;
            delete stack.my.v2; // finally, delete the tmp variable
        }
        
        stack.my.i++;
        break;
        

      case OBJECT_INIT:

        if(!("i" in stack.my)) {
            stack.my.i = 0;
            stack.my.j = n.length;
            stack.my.vcc = {};
        }
        
        if(stack.my.i >= stack.my.j) {
            stack.my.done = true;
            v = stack.my.vcc;
            break;
        }
        
        stack.my.t = n[stack.my.i];
        
        
        if (stack.my.t.type == PROPERTY_INIT) {

            if(!("v2" in stack.my)) {
                stack.push(S_EXEC, {v:"v2", n: stack.my.t[1], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
                break;
            } else {
                stack.my.vcc[stack.my.t[0].value] = stack.my.v2;
                delete stack.my.v2; // finally, delete the tmp variable
            }
        
        } else {
            f = new this.FunctionObject(stack.my.t, x.scope);
            u = (stack.my.t.type == GETTER) ? '__defineGetter__'
                                   : '__defineSetter__';
            stack.my.vcc[u](stack.my.t.name, thunk(f, x, stack));
        }
        
        stack.my.i++;
        break;
        
        
        
      case NULL:
        v = null;
        stack.my.done = true;
        break;

      case THIS:
        v = x.thisObject;
        stack.my.done = true;
        break;

      case TRUE:
        v = true;
        stack.my.done = true;
        break;

      case FALSE:
        v = false;
        stack.my.done = true;
        break;

      case IDENTIFIER:
        for (s = x.scope; s; s = s.parent) {
            if (n.value in s.object)
                break;
        }
        v = new Reference(s && s.object, n.value, n);
        stack.my.done = true;
        break;

      case NUMBER:
      case STRING:
      case REGEXP:
        v = n.value;
        stack.my.done = true;
        break;

      case GROUP:
        if(!("r1" in stack.my)) {
            stack.push(S_EXEC, {v:"r1", n: n[0], x: x, Nodes: n, Context: x, NodeNum: 0, pmy: stack.my.myObj});
            
            break;
        } else {
            v = stack.my.r1;
        }
        stack.my.done = true;
        break;

      default:
          throw "PANIC: unknown operation " + n.type + ": " + n;

    }

    return v;
}



Jnaric.prototype.evaluate_thread = function (s, f, l) {
    if (typeof s != "string")
        s = s.toString();
        //return s;
    
    if(DEBUG && (DEBUG > 2)) this.STEP_TIMEOUT = 50;
    //var x = this.ExecutionContext.current; // now unused.
    var x2 = new this.ExecutionContext(GLOBAL_CODE);
    //this.ExecutionContext.current = x2; // this is now done via executionContext switcher in step_next
    
    var g_stack = new __Stack(x2); // a 'threading mode' means we create a new execution stack! ... and execution context
    //var e_stack = [];
    //g_stack.e_stack = e_stack;
    g_stack.stack.unshift({n: parse(s, f, l), x: x2, pmy: {}}); // append it to the 'end' of execution stack
    //this.step_next(g_stack);
    __jn_stacks.add_task(this, g_stack, this.nice, this.throttle);

    //ExecutionContext.current = x; // ???????????????????
    return x2.result;
}


Jnaric.prototype.execf_thread = function (func, args, onok, onerr, nice) {

          // TODO: execf with ref as parameter
          // TODO: thread NICE
          // TODO: check for onfinish & onerror is function

    // self.execf_thread(self.global.__ipc[rq.method], [rq].concat(rq.args), cbo2, cbe2); // TODO: execf with ref as parameter


    if(typeof nice == "undefined") var nice = this.nice;

    
    
    var x2 = new this.ExecutionContext(GLOBAL_CODE);


    if(typeof(args) != "undefined" ) {
        var a = Array.prototype.splice.call(args, 0, args.length);
        a.__defineProperty__('callee', func, false, false, true);
    } else {
        a = [];
        a.__defineProperty__('callee', func, false, false, true);
    }
    
    var f = func.node;
    var n = f.body;
    //console.log("Normal call working...");
    
    x2.scope = {object: new Activation(f, a), parent: func.scope};



    var g_stack = new __Stack(x2); // a 'threading mode' means we create a new execution stack! ... and execution context
    
    
    g_stack.stack.unshift({n: n, x: x2, pmy: {}}); // append it to the 'end' of execution stack
    g_stack.onfinish = onok;
    g_stack.onerror = onerr;
    __jn_stacks.add_task(this, g_stack, nice, this.throttle);

}

Jnaric.prototype.evaluate = function (s, f, l) {
    if (typeof s != "string")
        s = s.toString();
        //return s;
    
    if(DEBUG && (DEBUG > 4)) this.STEP_TIMEOUT = 50;
    if(DEBUG && (DEBUG > 3)) this.STACKSIZE = 150;
    //var x = this.ExecutionContext.current;
    //var x2 = new this.ExecutionContext(GLOBAL_CODE);
    //this.ExecutionContext.current = x2;
    
    var g_stack = this.g_stack; 
    //var e_stack = this.e_stack;
    var __running = (g_stack.stack.length > 0);
    
    //try {
    var _p = parse(s, f, l); // errors will propagate to caller...
    //} catch (e) {
    //    
    //    this.ErrorConsole.log("Parse of file "+f+" failed: "+e);
    //    this.onerror && this.onerror();
    //    return;
    //}
    
    g_stack.stack.unshift({n: _p, x: g_stack.exc, pmy: {}}); // append it to the 'end' of execution stack
    
    // ONLY IF NO CURRENTLY RUN!
    if(! __running) __jn_stacks.add_task(this, g_stack, this.nice, this.throttle);
    
    //return x2.result;
    // TODO: store results elsewhere ???
}


function Activation(f, a) {
    for (var i = 0, j = f.params.length; i < j; i++)
        this.__defineProperty__(f.params[i], a[i], true);
    this.__defineProperty__('arguments', a, true);
}

// Null Activation.prototype's proto slot so that Object.prototype.* does not
// pollute the scope of heavyweight functions.  Also delete its 'constructor'
// property so that it doesn't pollute function scopes.  But first, we must
// copy __defineProperty__ down from Object.prototype.

Activation.prototype.__defineProperty__ = Object.prototype.__defineProperty__;
Activation.prototype.__proto__ = null;
delete Activation.prototype.constructor;










// now create the first global-linked vm
jnaric_vm = new Jnaric();

// Help native and host-scripted functions be like FunctionObjects.
// TODO: do this for only one 'global-linked' VM
// other VMs can be or not be 'global-linked' or can be partially global-linked via shared refs in their globals
var Fp = Function.prototype;
var REp = RegExp.prototype;
var __F = function() {};
if (!('__call__' in Fp)) {
    Fp.__defineProperty__('__call__', function (t, a, x, stack) {
        // Curse ECMA yet again!
        
        
        a = Array.prototype.splice.call(a, 0, a.length);
        stack.my.x2 = {};
        
        
        
        
        // here mozilla will throw an exception IF an exception occurs in internal native code function
        // the error may be of any type, we should just indicate that it is an error in native code
        // and stop due to exception
        // TODO: some native methods want OUR (non-native, not compiled) functions - pass JIT or use emulated methods
        
        stack.EXCEPTION = RETURN; // TODO: HOPE THIS WILL WORK!!! WARN!! UNKNOWN!!!
        
        try {
            stack.my.x2.result = this.apply(t, a);
        } catch (e) {
            if(e instanceof SyntaxError) { // catch RegExp errors
                stack.EXCEPTION = THROW;
                x.result = e;
            } else {
                stack.EXCEPTION = THROW;
                x.result = "InternalError: native call to "+this+" failed with exception: "+e+" Line: "+e.lineNumber+" File: "+e.fileName;
            }
            return;
        }
        
        //stack.EXCEPTION_OBJ = stack.my.x2.result;
        
        // push a fake exec
        if(stack.EXCEPTION && stack.EXCEPTION==RETURN) stack.push(S_EXEC, {n: {type:TRUE}, x: {}, Nodes: {}, Context: x, NodeNum: 0, pmy: stack.my.myObj});
        // t_hrow RETURN
        return stack.my.x2.result;
    }, true, true, true);

    REp.__defineProperty__('__call__', function (t, a, x, stack) {
        a = Array.prototype.splice.call(a, 0, a.length);
        //return this.exec.apply(this, a);
        stack.my.x2 = {};
        try {
            stack.my.x2.result = this.exec.apply(this, a);
        } catch (e) {
            stack.EXCEPTION = THROW;
            x.result = "InternalError: native call to "+this+" failed with exception: "+e+" Line: "+e.lineNumber+" File: "+e.fileName;
        }        
        
        return stack.my.x2.result;

        }, true, true, true);

    Fp.__defineProperty__('__construct__', function (a, x, stack) {
        args = Array.prototype.splice.call(a, 0, a.length);
        //return new this(a);
        // now a contains an array of parameters
        stack.my.oldx = x;
        if ( this === Object || this === Boolean || this === String || this === Number || this === Date ) {
            if ( args.length === 0 )
                stack.my.v0 = new this();
            if( args.length === 1 ) stack.my.v0 = new this(args[0]);
            if( args.length === 2 ) stack.my.v0 = new this(args[0],args[1]);
            if( args.length === 3 ) stack.my.v0 = new this(args[0],args[1],args[2]);
            if( args.length === 4 ) stack.my.v0 = new this(args[0],args[1],args[2],args[3]);
            if( args.length === 5 ) stack.my.v0 = new this(args[0],args[1],args[2],args[3],args[4]);
            if( args.length === 6 ) stack.my.v0 = new this(args[0],args[1],args[2],args[3],args[4],args[5]);
            if( args.length === 7 ) stack.my.v0 = new this(args[0],args[1],args[2],args[3],args[4],args[5],args[6]);
        } else {
            __F.prototype = this.prototype;
            var thisp = new __F();
            // RegeExp SyntaxErrors possible here:
            try {
                var returned = this.apply(thisp, args);
            } catch (e) {
                if(e instanceof SyntaxError) { // catch RegExp errors see MOZ BUG Exceptions/332472
                    stack.EXCEPTION = THROW;
                    x.result = e; // TODO: exception has wrong stack...
                } else {
                    stack.EXCEPTION = THROW;
                    x.result = "InternalError: native call to "+this+" failed with exception: "+e+" Line: "+e.lineNumber+" File: "+e.fileName;
                }
                return;
            }
            if ( returned !== undefined )
                thisp = returned;
            stack.my.v0 = thisp;
        }

        
        /*
        stack.my.x2 = {};
        stack.my.x2.result = new this(a);
        stack.my.oldx = x;
        stack.my.v0 = stack.my.x2.result;
        console.log("Executing SHIT!");
        */
        //return stack.my.x2.result;
        return stack.my.v0;

        }, true, true, true);

    // Since we use native functions such as Date along with host ones such
    // as global.eval, we want both to be considered instances of the native
    // Function constructor.
    Fp.__defineProperty__('__hasInstance__', function (v) {
        //console.log("native hasinstance call: "+v, " i am: "+this);
        return v instanceof Function || v instanceof jnaric_vm.global.Function || v instanceof this;
    }, true, true, true);
}


function thunk(f, x, stack) {
    return function () { return f.__call__(this, arguments, x, stack); };
}


function start_new_thread_dummy(fn) {
    var fs = fn.toString();
    //alert(fs);
    var pat = /function[\s]+([A-Za-z0-9\_]+)[\s]*\(/g;
    var fnames = pat(fs);
    if(fnames == null) fnames = pat(fs);
    //alert(fnames[1]);
    //this.ErrorConsole.log("fn "+fnames[1]);
    jnaric_vm.evaluate(fs + fnames[1]+"()");
}
