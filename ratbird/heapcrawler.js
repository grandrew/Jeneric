// heap-crawler
// (C) 2010 Andrew Gryaznov (realgrandrew@gmail.com)
// License: GPL v.3


DEEP = 100
DEEPREACHED = 0;
// obj_desc = {name: "obn", idx: 3}
SCANNED = 0;
SCANBASE=[];
EXCLUDEV = [];
path_desc = [];
obj_desc = {};

FOUND = [];
STOP = false;
XXXX = 0;

function copy_path(path, last) {
  // TODO: path conversion to string?
  var np = [];
  var spath = "";
  for(var i=0;i<path.length;i++) {
    np.push({name: path[i].name, value: path[i].value, accessCount: path[i].accessCount, idx: path[i].idx});
    spath += path[i].name+".";
  }
  np.pop();
  np.push(last);
  console.log(spath);
  return np;
}

function read_path(path, last) {
  var spath = "";
  for(var i=0;i<path.length;i++) {
    spath += path[i].name+".";
  }
  return spath;
}

function traverse_path(path, last) {
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
    return { value: cur_obj[last.idx], name: last.idx, idx: 0, accessCount: 0};
  } else {
    var i = cur_obj.length || 0;
    for(var ob in cur_obj) {
      if(last.idx == i) return {value: cur_obj[ob], name: ob, idx: 0, accessCount: 0};
      i++;
    }
  }
  return null;
}

function scanned_add(obj) {
  for(var i=0; i<SCANBASE.length; i++) {
    if(obj.value === SCANBASE[i]) return false;
  }
  SCANBASE.push(obj.value);
  return true;
}

function find_step() {
  //while(path_desc.length) {
    // TODO: depth control
    // TODO: loop control (1-level)
    obj_desc = path_desc[path_desc.length -1];
    if(!obj_desc) return; // finished
    cur_obj = traverse_path(path_desc, obj_desc);
    if(!cur_obj) {
      var out = path_desc.pop();
      if(out.accessCount > MAX_ACCESS) {
        MAX_ACCESS_OBJ.push( {c: out.accessCount, p: read_path(path_desc, out) });
        MAX_ACCESS = out.accessCount;
      }
      //continue;
      return
    }
    obj_desc.idx += 1;
    obj_desc.name = cur_obj.name;
    obj_desc.value = cur_obj.value;
    
    if(cur_obj.value === target) {
      FOUND.push(copy_path(path_desc, obj_desc));
    }
    //if(path_desc[path_desc.length-2] && (cur_obj.value === path_desc[path_desc.length-2].value)) return;
    /*
    for(var ii =0; ii<(path_desc.length-2); ii++) {
        if(path_desc[ii].value === cur_obj.value) {
          
          //console.log("DUP! at "+path_desc.length);
          //CUR_OBJ = cur_obj;
          //STOP=true
          //clearTimeout(XXXX);
          
          return;
        }
    }
    */
    if(typeof(cur_obj.value) !== "object") return;
    //if(cur_obj.name === "___link" || cur_obj.name === "SCANBASE" || cur_obj.name === "FOUND" || cur_obj.value instanceof HTMLDocument) return; //OMG!
    if(cur_obj.name === "SCANBASE" || cur_obj.name === "FOUND"|| cur_obj.name === "EXCLUDEV" || cur_obj.name === "MAX_ACCESS_OBJ") return; //OMG!
    if(EXCLUDEV.length) {
      for(var ix=0; ix<EXCLUDEV.length;ix++) {
        if(EXCLUDEV[ix].value === cur_obj.value) return;
      }
    }
    if(path_desc.length > DEEP) {
      DEEPREACHED++;
      return;
    }
    if(!scanned_add(cur_obj)) return;
    
    if ((cur_obj.value instanceof Array)) {
      path_desc.push({name: 0, idx: 0, value: cur_obj.value, accessCount: 0});
      //continue;
      return
    } else if(typeof(cur_obj.value) === "object") {
      for(var ob in cur_obj.value) {
        path_desc.push({name: ob, idx: 0, value: cur_obj.value, accessCount: 0});
        //continue;
        return
      }
    }  
  //}
}


/*
 * heap_count_paths
 */
hcp_first_run = true;
function heap_count_paths(f, t) {
  if(path_desc.length) {
    setTimeout(heap_count_paths, 1000);
    return;
  }
  f = f || where;
  t = t || target;
  var ex_len = EXCLUDEV.length;
  for(var i=0; i<FOUND.length; i++) {
    for(var j=0; ((j < EXCLUDEV.length) && (EXCLUDEV[j].value !== FOUND[i][0].value));j++) { }
    if(j==EXCLUDEV.length) EXCLUDEV.push(FOUND[i][0]);
  }
  if((ex_len == EXCLUDEV.length) && !hcp_first_run) {
      console.log("heap_count_paths: Found all paths; total: "+EXCLUDEV.length);
      return;
  }

  console.log("Starting new scan with "+EXCLUDEV.length+" paths removed")
  do_travel(f, t);
  hcp_first_run = false;
  setTimeout(heap_count_paths, 1000);
}

//do_travel(__eos_objects, 20000)
/*
 * Main method to scan
 */
function do_travel(from, to) {
  where = from;
  target = to;
  path_desc = [traverse_path([], {idx:0})];
  FOUND = [];
  STOP = false;
  SCANBASE = [];
  SCANNED = 0;
  DEEPREACHED = 0;
  MAX_ACCESS = 0;
  MAX_ACCESS_OBJ = [];

  _TS = (new Date()).getTime();
  travel_timer();
}

function sinfo() {
  console.log("SCANNED: "+SCANNED+" SCANBASE: "+SCANBASE.length+" DEEP: "+path_desc.length+" reached:"+DEEPREACHED+" time: "+parseInt(((new Date()).getTime()-_TS)/1000)+"s Found: "+ FOUND.length);
}

function travel_timer() {
  for(var i=0; i<1000; i++) {
    find_step();
    //if(STOP) return;
  }
  SCANNED += i;
  //console.log("SCANNED: "+SCANNED+" DEEP: "+path_desc.length+" time: "+parseInt(((new Date()).getTime()-_TS)/1000)+"s Found: "+ FOUND.length);
  ssinf = "SCANNED: "+SCANNED+" DEEP: "+path_desc.length+" time: "+parseInt(((new Date()).getTime()-_TS)/1000)+"s Found: "+ FOUND.length;
  if(STOP) {
    console.log("STOP due to STOP=true");
    return;
  }
  if(path_desc.length) XXXX = setTimeout(travel_timer, 30);
  else {
    console.log("HEAP SCAN FINISHED in "+parseInt(((new Date()).getTime()-_TS)/1000)+"s; total objects collected: "+SCANBASE.length+ " total scanned: "+SCANNED+" DEEP value "+DEEP+" reached "+DEEPREACHED+" times." +" FOUND: "+FOUND.length);
    // CLEAN BASE?
    SCANBASE = [];
  }
}

/*
 Jeneric global pollution auditing result:

// polluted with vm's
iNodeParent
_terminal_vm
__SERIALIZER
__eos_serial
nvm

// beware also
setTimeout/setInterval's
registered callbacks (e.g. for hubConnection)

*/
