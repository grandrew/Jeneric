// objj.js - jeneric compiler to 'object file'
// (C) 2010 Andrew Gryaznov (realgrandrew@gmail.com)
// License: GPL v.3 or higher

/*

  Object compiler - compiles parsed file into JSON suitable to native processing

*/
(function () {

_P_COMPILER = {DEEP: 500};

function traverse_path(where, path, last) {
  var cur_obj = where;
  var c;
  for(var i=0; i<(path.length-1); i++) {
    c = path[i];
    c.accessCount += 1;
    //console.log("obname "+c.name);
    cur_obj = cur_obj[c.name];
    if(!cur_obj) return null; // object changed at runtime??
  }
  //console.log("cur_obj  1 is " +cur_obj);
  // now last part
  if((cur_obj instanceof Array) && (last.idx < cur_obj.length)) {
    last.name = last.idx;
    return { value: cur_obj[last.idx], name: last.idx, idx: 0, accessCount: 0};
  } else {
    var i = cur_obj.length || 0;
    for(var ob in cur_obj) {
      if(last.idx == i) {
        last.name = ob;
        return {value: cur_obj[ob], name: ob, idx: 0, accessCount: 0};
      }
      i++;
    }
  }
  return null;
}


function traverse_path_targ(where, path, last) {
  var cur_obj = where;
  var c;
  for(var i=0; i<(path.length-1); i++) {
    c = path[i];
    c.accessCount += 1;
    //console.log("obname "+c.name);

    if(!cur_obj[c.name]) {
       //console.log("returning  null!!");
       //return {value: {}, name: c.name, idx: 0, accessCount: 0};
       return null; // object changed at runtime??
    }

    cur_obj = cur_obj[c.name];
  }
  //console.log("cur_obj  1 is " +cur_obj);
  // now last part
  /*
  if(!cur_obj[last.name]) {
    cur_obj[last.name] = {};
    console.log("creating new!");
  }
  */
  if(typeof(last.name) === "number") cur_obj.length = last.name+1;
  if(!cur_obj[last.name]) return {value: cur_obj, name: last.name, idx: 0, accessCount: 0};
  return {value: cur_obj[last.name], name: last.name, idx: 0, accessCount: 0};
}

/*
function scanned_add(obj) {
  for(var i=0; i<SCANBASE.length; i++) {
    if(obj.value === SCANBASE[i]) return false;
  }
  SCANBASE.push(obj.value);
  return true;
}
*/

function find_step(PROC) {
    var path_desc = PROC.path_desc;
    var obj_desc = path_desc[path_desc.length -1];
    if(!obj_desc) return; // finished
    var cur_obj = traverse_path(PROC.parsed, path_desc, obj_desc);

    PROC.targ_current = traverse_path_targ(PROC.targ, path_desc, obj_desc);
    
    if(!cur_obj) {
      var out = path_desc.pop();
      return
    }
    obj_desc.idx += 1;
    obj_desc.name = cur_obj.name;
    obj_desc.value = cur_obj.value;

    // now add the value to current obj
    // ... here
    //console.log("doing for "+cur_obj.name);
    
    if(typeof(cur_obj.value) !== "object") {
      if(typeof(cur_obj.value) !== "function")
          PROC.targ_current.value[cur_obj.name] = cur_obj.value;
      return;
    }
    if(cur_obj.name === "tokenizer") return; 

    if(path_desc.length > _P_COMPILER.DEEP) {
      PROC.STOP = true;
      return;
    }
    PROC.targ_current.value[cur_obj.name] = {}
    //if(!scanned_add(cur_obj)) return;
    
    if ((cur_obj.value instanceof Array)) {
      path_desc.push({name: 0, idx: 0, value: cur_obj.value, accessCount: 0});
//      PROC.targ_current.value[0] = {};
      return
    } else if(typeof(cur_obj.value) === "object") {
      for(var ob in cur_obj.value) {
        path_desc.push({name: ob, idx: 0, value: cur_obj.value, accessCount: 0});
//        PROC.targ_current.value[ob] = {};
        return
      }
    }  
}


objj = function _objj(parsed, onfinish) {
  var PROC = {};
  PROC.parsed = parsed;
  PROC.targ = {};
  PROC.path_desc = [{name: 0, value: parsed[0], idx:0}];

  PROC.STOP = false;
  PROC.SCANNED = 0;

  PROC._TS = (new Date()).getTime();
  (function travel_timer() {
      var TIMESLICE = 45;
      var ts0 = (new Date).getTime();
      while((PROC.path_desc.length) && ((new Date).getTime()) - ts0 < TIMESLICE) {
        find_step(PROC);
      }
      //SCANNED += i;
      if(PROC.STOP) {
        console.log("STOP due to STOP=true");
        return;
      }

      if(PROC.path_desc.length) XXXX = setTimeout(arguments.callee, 50);
      else {
        // finished. run onfinish
        onfinish(PROC.targ);
      }
  })();
}

/*
function sinfo() {
  console.log("SCANNED: "+SCANNED+" SCANBASE: "+SCANBASE.length+" DEEP: "+path_desc.length+" reached:"+DEEPREACHED+" time: "+parseInt(((new Date()).getTime()-_TS)/1000)+"s Found: "+ FOUND.length);
}
*/

})();

function test_objj() {
    var onf = function (res) {
      OUT = res;
      /*
        TODO: try to: 
          1. JSON.stringify
          2. JSON.parse
          3. evaluate a VM with that code!
      */
      console.log("Finished processing");
      var jj = JSON.parse(JSON.stringify(res));
      var vmss = new Jnaric();
      vmss.global.sdata = "";
      vmss.global.object = {};
      vmss.g_stack.stack.unshift({n: jj, x: vmss.g_stack.exc, pmy: {}})
      __jn_stacks.add_task(vmss, vmss.g_stack, vmss.nice, vmss.throttle);
    };
    objj(parse(BUNDLED_FILES["os/tmpstore.jn"], "tmpstore.jn", 0), onf);
}

