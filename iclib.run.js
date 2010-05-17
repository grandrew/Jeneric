// LICENSE: GPL v.3 or later (C) 2010 Andrew Gryaznov realgrandrew@gmail.com, a.gryaznov@svoyaset.ru

_conform_st = false; // conform to ST (security terminal)
if(object.getMySecurityURI() == "~/security/terminal") {
    try {
        l = execURI("~/run", "listChildren", [], 5000);
        _conform_st = true;
    } catch (e) {
         // not compatible...
    }
}
_pc = 0

function ic_execChild(childPath, progPath, argv) {
    // TODO: killChild ;-)
    try {
        object.execURI(childPath, "__ic_main", [argv]); // start in a thread??
    } catch (e) {
        console.log("ic_execChild: exception at main() in "+progPath+" (progId: "+childPath + ") - delete stale object manually!"); 
        console.log(":: "+e); 
    }
    
}

/*
    ic_run_program(prog_path, argv, div)
    
    launch ic#-compatible program
        prog_path - program path to launch (may use $PATH to expand)
        argv - arguments list
        div - div to draw to
*/

function ic_run_program(prog_path, argv, div) {
    var c = prog_path
    argv = [prog_path].concat(argv);
    if(_conform_st) {
        var pname_orig = c.split("/")[c.split("/").length-1];
        var pname = pname_orig;
        var pfx = "~/run/";
        var padd = 1;
        var allprogs = execURI("~/run", "listChildren", []);
        for(var j=0;j<allprogs.length;j++) {
            if(allprogs[j] == pname) {
                pname = pname_orig+padd;
                padd++;
                j=0;
            }
        }
    } else {
        _pc++;
        var pname = p+_pc;
        var pfx = "./";
    }
    var xd = document.createElement("DIV");
    xd.style.width="100%";
    xd.style.fontSize="100%";
    div.appendChild(xd);    
    div.prog = pname;
    
    if(c.charAt(0) == "/" || c.charAt(0) == "~") {
        if(_conform_st) execURI("~/run", "createChild", [pname, c, "~/sys/anarchic", xd]);
        else object.createChild(pname, c, "~/sys/anarchic", xd); 
    }
    else {
        var lc = "~/bin/"+c;
        try {
            if(_conform_st) execURI("~/run", "createChild", [pname, lc, "~/sys/anarchic", xd]);
            else object.createChild(pname, lc, "~/sys/anarchic", xd); 
            c = lc;
        } catch(e) {
            lc = "/bin/"+c;
            try {
                if(_conform_st) execURI("~/run", "createChild", [pname, lc, "~/sys/anarchic", xd]);
                else object.createChild(pname, lc, "~/sys/anarchic", xd); 
                c = lc;
            } catch (e) {
                throw "not found by URI";
            }
        }
    }
    
    // now set security to allow-everything-in
    if(_conform_st) {
        start_new_thread(function() {execURI(pfx+pname, "securitySet", [{"ipcIn": "*"}], 50000)}); // never allow to fail...
    }
    
    var pid = start_new_thread(ic_execChild, [pfx+pname, c, argv]); // use pid??

    return pid;
}