# builddist
# Build create a jeneric instance
#  - compile JS files into a bundle
#  - minify minifiable js
#  - append JS that cannot be minified
#  - append base system distro files 
#  - update build number
#  - change offline manifest

# remember to include a stylesheet and some JS files from the below, also in manifest

import sys, urllib2, urllib, time, os.path, string, os, commands

COMPILE_FILES = [
    "ratbird/DataRequestor.js",
    "ratbird/json2.js",
    "os/ierange-m2.js", #                     and this
    "os/csshover3.js", # TODO: make it not load by default - IE sucks
    "os/fauxconsole.js", # this too
    "os/md5.js",
    "ratbird/jsdefs.js",
    "ratbird/jsparse.js",
    "ratbird/objj.js",
    "ratbird/jsexec.js",
    "os/gears_init.js",
    "os/jsobject.js",
    "os/Orbited.js",
    "os/xmlsax.js",
    "os/jsdom2.js",
    "os/jsdom.js",
    "os/orbited_init.js",
    "os/stomp.js",
    "os/eosinit.js"
]

DONTCOMPILE_FILES = [
    "os/fixed.js"
]

BASE_SOURCES = [
    "os/readonly.jn",
    "os/anarchic.jn",
    "os/ramstore.jn",
    "os/st.jn",
    "os/st_acl.jn",
    "os/tmpstore.jn",
    "os/ic.jn",
    "os/totinit.jn",
    "os/st.jn",
    "os/terminal.jn"
]

MANIFEST_FILES = [
    "os/fauxconsole.css",
    "os/jnext/jnext.js",
    "os/jnext/sockets.js",
    "os/CFInstall.min.js",
    "/eos.html"
]

MANIFEST_PATH = "os/jeneric.manifest"

url = "http://closure-compiler.appspot.com/compile";

FILE_SPLIT_MARK = "// -*- FILE SPLIT HERE -*-"

def fbundle( lFiles, postlen = 0):
    b = "";
    lp = []
    tp = 0
    tot = 0
    for f in lFiles:
        print "  Bundling", f, "...",
        tb = open(f).read();
        print int(len(tb)/1024), "kb"
        i = 1
        for fpart in tb.split(FILE_SPLIT_MARK):
            print "    part", i, int(len(fpart)/1024), "kb"
            tb = fpart
            if postlen:
                tp += len(tb)
                if tp >= postlen:
                    tp -= len(tb)
                    lp.append(b)
                    b = tb
                    print "Created POST bundle of", int(tp/1024), "kb"
                    tot += tp
                    tp = len(tb)
                else:
                    b += tb
            else:        
                b += tb
                tot += len(tb)
            i +=1
    if postlen: 
        lp.append(b)
        tot += len(b)
        print "Created POST bundle of", int(tp/1024), "kb"
    print "Total: ", int(tot/1024), "kb"
    if postlen: return lp
    else: return b

def closure_local(data):
    if os.path.isfile("compiler.jar"):
        print "Found google closure compiler"
        d = string.join(data, "\n");
        print "Compiling... in=", int(len(d)/1024), "kb", 
        file("/tmp/clos.tmp.js", "w").write(d)
        print commands.getoutput("java -jar compiler.jar --compilation_level SIMPLE_OPTIMIZATIONS --js /tmp/clos.tmp.js --js_output_file /tmp/clos.tmp.c.js")
        out = file("/tmp/clos.tmp.c.js").read();
        print int(len(out)/1024), "kb"
	os.remove("/tmp/clos.tmp.js")
	os.remove("/tmp/clos.tmp.c.js")
        return out
    return None


def fcompile(data):
    cdata = ""
    print "Compressing using Google Closure: "
    ret = closure_local(data)
    if ret: return ret
    print "WARNING! Local installation of google closure compiler not found, using API"
    for d in data:
        print "  <in:", int(len(d)/1024), "kb, out:",
        params = urllib.urlencode({
            'js_code': d, 
#            'compilation_level': "WHITESPACE_ONLY",
            'compilation_level': "SIMPLE_OPTIMIZATIONS",  
            "output_format": "text", 
            "output_info": "compiled_code"
        })
        r = urllib.urlopen(url, params)
        gout = r.read()
        if len(gout) < 1024:
          print gout
          sys.exit(-1);
        if len(gout) == 0:
            print "FAILED. Retreiving info:"
            print "----------------"
            params = urllib.urlencode({
                'js_code': d, 
#                'compilation_level': "WHITESPACE_ONLY",
                'compilation_level': "SIMPLE_OPTIMIZATIONS", 
                "output_format": "text", 
                "output_info": "errors"
            })
            r = urllib.urlopen(url, params)
            print r.read()
            print "----------------"
            sys.exit(-1)
            
        cdata += gout
        print int(len(gout)/1024), "kb>"
    print "done"
    print "Total compressed:", int(len(cdata)/1024), "kb"
    return cdata

def fsource(lFiles):
    print "Bundling base system distribution objects...",
    i=0
    rdata = "\nBUNDLED_FILES={"
    for f in lFiles:
        rdata += '"%s": ' % f
        d = open(f).read().replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n\\\n")
        if i < (len(lFiles) - 1): rdata += "'%s'," % d
        else: rdata += "'%s'" % d
        i+=1
    rdata += "};"
    print i, "files of length", int(len(rdata)/1024), "kb"
    return rdata

def builddist():
    ts = time.time();
    compiled = fcompile(fbundle(COMPILE_FILES, 100000)); # google max is 200kb
    bundled = fbundle(DONTCOMPILE_FILES);
    sources = fsource(BASE_SOURCES);
    
    print "\n\nTotal jeneric size is: ", int((len(compiled) + len(bundled) + len(sources))/1024), "kb"

    try:
      buildver = int(open(MANIFEST_PATH).read().split("\n")[1][8:])
    except:
      buildver = 0
    buildver +=1
    
    fd = open("os/jeneric.js", "w")
    fd.write("JENERIC_BUILD=%s;\n" % str(buildver))
    fd.write(compiled);
    fd.write("\n");
    fd.write(bundled);
    fd.write("\n");
    fd.write(sources);
    fd.close()
    
    # and finally write manifest!
    print "Build version", buildver
    print "Writing manifest... ", len(MANIFEST_FILES), "files"

    build_str = "# BUILD "+str(buildver)
    MANIFEST = "CACHE MANIFEST\n%s\n" % build_str
    for f in MANIFEST_FILES:
        MANIFEST += f+"\n"
    MANIFEST += "\nFALLBACK:\n/ eos.html\n/index.php eos.html\n/index.html eos.html\n"
    file(MANIFEST_PATH, 'w').write(MANIFEST)
    print "build time: ", int(time.time() - ts), "s"


if __name__ == '__main__':
  builddist()

