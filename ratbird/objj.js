// objj.js - jeneric compiler to 'object file'
// (C) 2010 Andrew Gryaznov (realgrandrew@gmail.com)
// License: GPL v.3 or higher

/*

  Object compiler - compiles parsed file into JSON suitable to native processing

*/
(function () {

_P_COMPILER = {DEEP: 5000};

function traverse_path(where, path, last) {
  var cur_obj = where;
  var c;
  for(var i=0; i<(path.length-1); i++) {
    c = path[i];
    c.accessCount += 1;
    cur_obj = cur_obj[c.name];
    if(!cur_obj) return null; // object changed at runtime??
  }

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
    if(!cur_obj[c.name]) cur_obj[c.name] = {};
    cur_obj = cur_obj[c.name];
  }

  if(typeof(last.name) === "number") cur_obj.length = last.name+1;
  if(!cur_obj[last.name]) return {value: cur_obj, name: last.name, idx: 0, accessCount: 0};

  return {value: cur_obj[last.name], name: last.name, idx: 0, accessCount: 0};
}

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

    if(cur_obj.value && cur_obj.value.exec && cur_obj.value.test && cur_obj.value.source) {
	PROC.STOP = "Cannot compile inline regex's; consider using RegExp() prototype";
	return;
    }

    if(cur_obj.name === "toSource" || cur_obj.name === "tokenizer" || cur_obj.name === "lineno" || cur_obj.name === "filename" || cur_obj.name === "start" || cur_obj.name === "end") return;    
    if(typeof(cur_obj.value) === "function") return;
    if(typeof(cur_obj.value) !== "object") {
      if(typeof(cur_obj.value) !== "function")
          PROC.targ_current.value[cur_obj.name] = cur_obj.value;
      return;
    }

    if(cur_obj.value === null) { // curse ECMA!!
        PROC.targ_current.value[cur_obj.name] = null;
        return;
    }

    if(path_desc.length > _P_COMPILER.DEEP) {
      PROC.STOP = "Max stack DEEPness reached";
      return;
    }
    
    if ((cur_obj.value instanceof Array)) {
      path_desc.push({name: 0, idx: 0, value: cur_obj.value, accessCount: 0});
      return
    } else if(typeof(cur_obj.value) === "object") {
    
      for(var ob in cur_obj.value) {
        path_desc.push({name: ob, idx: 0, value: cur_obj.value, accessCount: 0});
        return
      }
    }  
}

objj = function _objj(parsed, onfinish, onerror) {
  var PROC = {};
  PROC.parsed = parsed;
  PROC.targ = {};
  PROC.path_desc = [{name: 0, value: parsed[0], idx:0}];

  PROC.STOP = false;
  PROC._TS = (new Date()).getTime();
  var tt = (function travel_timer() {
      var TIMESLICE = 100;
      var ts0 = (new Date).getTime();
      while((PROC.path_desc.length) && ((new Date).getTime()) - ts0 < TIMESLICE) {
        find_step(PROC);
      }
      if(PROC.STOP) {
	onerror(PROC.STOP);
        return;
      }

      if(PROC.path_desc.length) setTimeout(arguments.callee, 50);
      else {
        onfinish(PROC.targ, PROC);
      }
  });
  setTimeout(tt, 50);
}

})();

function test_objj() {
    var onf = function (res, proc) {
      OUT = res;
      PROC = proc;

      console.log("Finished processing");
      var jj = JSON.parse(JSON.stringify(res));
      var vmss = new Jnaric();
      //vmss.global.sdata = "";
      vmss.global.object = {ipc:{}};
      vmss.global.security = {};
      vmss.g_stack.stack.unshift({n: jj, x: vmss.g_stack.exc, pmy: {}})
      __jn_stacks.add_task(vmss, vmss.g_stack, vmss.nice, vmss.throttle);
      PROC.vm = vmss;
    };
    var one = function (e) {
      console.log("Compile failed: "+e);
    };
    objj(parse(BUNDLED_FILES["os/st.jn"], "st.jn", 0), onf, one);
}

