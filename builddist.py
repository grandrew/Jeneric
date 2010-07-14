# builddist
# Build create a jeneric instance
#  - compile JS files into a bundle
#  - minify minifiable js
#  - append JS that cannot be minified
#  - append base system distro files 
#  - update build number
#  - change offline manifest

# remember to include a stylesheet and some JS files from the below, also in manifest

COMPILE_FILES = [
    "ratbird/DataRequestor.js",
    "ratbird/json2.js",
    "os/ierange-m2.js",
    "os/md5.js",
    "ratbird/jsdefs.js",
    "ratbird/jsparse.js",
    "ratbird/jsexec.js",
    "os/gears_init.js",
    "os/jsobject.js",
    "os/Orbited.js",
    "os/xmlsax.js",
    "os/jsdom2.js",
    "os/jsdom.js",
    "os/orbited_init.js", # TODO!!!! instead of <script> TCPSocket = Orbited.TCPSocket; </script> !!!
    "static/protocols/stomp/stomp.js",
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
    "os/totinit.jn"
]

MANIFEST_FILES = [
    "os/fauxconsole.css",
    "os/jnext/jnext.js",
    "os/jnext/sockets.js"
]

def builddist():
    compiled = fcompile(fbundle(COMPILE_FILES));
    bundled = fbundle(DONTCOMPILE_FILES);
    sources = fsource(BASE_SOURCES);
    
    fd = open("os/jeneric.js", "w")
    fd.write(compiled);
    fd.write("\n");
    fd.write(bundled);
    fd.write("\n");
    fd.write(sources);
    fd.close()
    
    # and finally write manifest!


if __name__ == '__main__':
  builddist()

