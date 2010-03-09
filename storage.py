# storage.py - a filelike-object storage database plug-in
# to be imported bu main hub module

# JEFS1

# TODO: 
# + default object control (create default objects with full access given to terminal named admin)
#   + INT_FS_LIST = ["bin", "test", "lib", "home"]
# + insert request processing 
# T? test objects -- additional Blob object testing required!
# - test ACLs
# ---
# - terminal registration home folder object & ACL object creation
#   - terminal md5 password challenge
# - register /home object, set listing-only allowed
# +T /home/<termid>/ACL
# - user resource monitoring?: report no space available
#       SELECT SUM(size) AS total FROM files WHERE uri=%s;
# - listing size LIMIT (childList limit?)
# - switch terminal registration to postgres interface in hub.py
# - create terminal registration script with no restrictions (like 8-char limit and no dots)
# - filestore object description protocol
#   - implement protocol
# - add terminal_id to http_request protocol: when getting via HTTP request, watch for session
#   (cookie-based? or maybe GET-based?)
#    check whether we already do authenticate with STOMP session?
# - offtop: add default security policy to default terminal object to allow listing for all terminals
# - see problem with icsecc in GUI mode

# + createObject(fullURI, ownerTerminalList, methodList) 
#   - check if exists, silently fail
#   + create filestore object at selected address, 
#   + create rights to do methodList opeations
#   + search for parent and set parent oid(?)?
#   + append ourself to childList of a found parent (if any - in the case of absense we are on top)


import psycopg2, httplib, time, string
from random import choice # for genhash

pgconn = psycopg2.connect("dbname=jeneric_data user=jeneric_data")

MAX_READ_SIZE = 400000 # max read slice size in bytes!
# JENERIC_TMP = "/tmp/jeneric/"

# TODO: this shoyuld be moved to utility funtctions! (copy from hub.py)
def genhash(length=8, chars=string.letters + string.digits):
    return ''.join([choice(chars) for i in range(length)])


# one-time call routine
def init_db():
    #
    cur = pgconn.cursor()
    cur.execute("CREATE TABLE files (uri varchar PRIMARY KEY, oid bigint, parent_oid bigint, size integer, cdate integer, mdate integer, adate integer);")
    cur.execute("CREATE TABLE childlist (uri varchar, child_uri varchar, oid bigint, child_oid bigint);")
    # files: uri, oid, size, cdate, mdate,adate
    # childlist: uri, child_uri, oid, child_oid
    
    # allow
    cur.execute("CREATE TABLE allow (uri varchar, oid bigint, method varchar, terminal_id varchar)")
    # deny
    cur.execute("CREATE TABLE deny (uri varchar, oid bigint, method varchar, terminal_id varchar)")
    # acl_allow
    cur.execute("CREATE TABLE acl_allow (uri varchar, method varchar, aclname varchar)")
    # acl_deny
    cur.execute("CREATE TABLE acl_deny (uri varchar, method varchar, aclname varchar)")
    # inherit
    cur.execute("CREATE TABLE inherit (uri varchar, method varchar, parent_uri varchar)")
    # acls
    cur.execute("CREATE TABLE acls (aclname varchar, terminal_id varchar, aclc_uri varchar)")
    pgconn.commit()
    cur.close()
def init_objects():
    ownerTerminalList = ["test", "grandrew", "admin"] # hard-coded admin terminals
    methodList = ["securitySet", "securityGet", "read", "write", "describe", "listChildren", "createChild", "deleteChild"] # everything
    objectlist = ["bin", "test", "lib", "home"]
    for ob in objectlist:
        createObject("/"+ob, ownerTerminalList, methodList)
    pgconn.commit()
    

#init_db() # do not init DB each time we launch... use interactive mode insted!!

def validate(rq,c):
    
    # now check inheritance
    parent = rq["uri"]
    
    c.execute("SELECT parent_uri FROM inherit WHERE uri=%s AND ( method=%s OR method=%s )", (rq["uri"], rq["method"], "*"))
    d = c.fetchone();
    it = 0;
    while d:
        parent = d[0]
        c.execute("SELECT parent_uri FROM inherit WHERE uri=%s AND ( method=%s OR method=%s )", (parent, rq["method"], "*"))
        d = c.fetchone()
        it+=1
    # TODO: inherit cache!

    c.execute("SELECT * FROM deny WHERE uri=%s AND method=%s AND terminal_id=%s", (parent, rq["method"], rq["terminal_id"]))
    d = c.fetchone();
    if d:
        return False;


            
    c.execute("SELECT * FROM allow WHERE uri=%s AND method=%s AND (terminal_id=%s OR terminal_id=%s)", (parent, rq["method"], rq["terminal_id"], "*"))
    d = c.fetchone();
    if d:
        return True;
    
        
    # else, check if there are some ACLs defined:
    
    c.execute("SELECT aclname FROM acl_deny WHERE uri=%s AND method=%s", (rq["uri"], rq["method"]))
    c2 = pgconn.cursor()
    d=c.fetchone()
    while d:
        # TODO: multiple ACL inheritance?
        c2.execute("SELECT * FROM acls WHERE aclname=%s AND terminal_id=%s", (d[0],rq["terminal_id"]))
        if c2.fetchone(): return False
        d=c.fetchone()
    
    
    c.execute("SELECT aclname FROM acl_allow WHERE uri=%s AND method=%s", (rq["uri"], rq["method"]))
    c2 = pgconn.cursor()
    d=c.fetchone()
    while d:
        # TODO: multiple ACL inheritance?
        c2.execute("SELECT * FROM acls WHERE aclname=%s AND terminal_id=%s", (d[0],rq["terminal_id"]))
        if c2.fetchone(): return True
        d=c.fetchone()
    return False
    
    
def data_securitySet(oid, uri, sec, c):
    t = sec["ipcIn"]
    # flush all previous security settings
    c.execute("DELETE FROM allow WHERE uri=%s", (uri,))
    c.execute("DELETE FROM deny WHERE uri=%s", (uri,))
    c.execute("DELETE FROM inherit WHERE uri=%s", (uri,))
    c.execute("DELETE FROM acl_deny WHERE uri=%s", (uri,))
    c.execute("DELETE FROM acl_allow WHERE uri=%s", (uri,))
    if t == "inherit":
        # get our parent uri:
        # XXX safe path manipulation escape-aware method required here!
        parent_uri = string.join(uri.split("/")[:-1], "/")
        c.execute("INSERT INTO inherit (uri,oid,parent_uri,method) VALUES (%s,%s,%s,%s)", (uri,oid,parent_uri,"*"))
    else:
        for ob in t:
            if t[ob] == "inherit":
                # TODO: reasonable caching!
                parent_uri = string.join(uri.split("/")[:-1], "/")
                c.execute("INSERT INTO inherit (uri,method,parent_uri) VALUES (%s,%s,%s)", (uri,ob,parent_uri))
            else: # it is a list
                for tname in t[ob]:
                    if tname[0] == "!":
                        if tname[1] == "#": c.execute("INSERT INTO acl_deny (aclname,uri,method) VALUES (%s,%s,%s)", (tname[1:],uri,ob))
                        else: c.execute("INSERT INTO deny (uri,oid,method,terminal_id) VALUES (%s,%s,%s,%s)", (uri,oid,ob,tname[1:]))
                    else:
                        if tname[0] == "#": c.execute("INSERT INTO acl_allow (aclname,uri,method) VALUES (%s,%s,%s)", (tname,uri,ob))
                        # the following will also eat "*"
                        else: c.execute("INSERT INTO allow (uri,oid,method,terminal_id) VALUES (%s,%s,%s,%s)", (uri,oid,ob,tname))
    return None

def data_securityGet(oid, uri, c):
    sec = { "ipcIn": {}}
    c.execute("SELECT parent_uri FROM inherit WHERE uri=%s AND method=%s", (uri, "*"))
    d = c.fetchone();
    if d:
        return { "ipcIn": "inherit" }
    
    # now examine inheritance
    
    c.execute("SELECT method FROM inherit WHERE uri=%s", (uri,))
    d = c.fetchone();
    while d:
        #if not d[0] in sec["ipcIn"]: sec["ipcIn"][d[0]] = []
        sec["ipcIn"][d[0]] = "inherit"
        d = c.fetchone();
    
    # TODO: use JOIN to get acls and terminal_ids in only 2 requests not 4
    # now check each database in turn
    c.execute("SELECT method,terminal_id FROM allow WHERE uri=%s", (uri,))
    d = c.fetchone();
    while d:
        if not d[0] in sec["ipcIn"]: sec["ipcIn"][d[0]] = []
        sec["ipcIn"][d[0]].append(d[1])
        d = c.fetchone();
    
    c.execute("SELECT method,terminal_id FROM deny WHERE uri=%s", (uri,))
    d = c.fetchone();
    while d:
        if not d[0] in sec["ipcIn"]: sec["ipcIn"][d[0]] = []
        sec["ipcIn"][d[0]].append("!"+d[1])
        d = c.fetchone();
    
    c.execute("SELECT method,aclname FROM acl_deny WHERE uri=%s", (uri,))
    d = c.fetchone();
    while d:
        if not d[0] in sec["ipcIn"]: sec["ipcIn"][d[0]] = []
        sec["ipcIn"][d[0]].append(d[1])
        d = c.fetchone();
    
    c.execute("SELECT method,aclname FROM acl_allow WHERE uri=%s", (uri,))
    d = c.fetchone();
    while d:
        if not d[0] in sec["ipcIn"]: sec["ipcIn"][d[0]] = []
        sec["ipcIn"][d[0]].append("!"+d[1])
        d = c.fetchone();
    return sec
    
def data_read(oid, arg):
    lo = pgconn.lobject(oid, "r");
    if len(arg) == 0:
        data = lo.read();
    if len(arg) == 1:
        # XXX will stress the server with large files seeked from 1 byte with no limit!
        lo.seek(int(arg[0]))
        data = lo.read()
    if len(arg) == 2:
        lo.seek(int(arg[0]))
        data = lo.read(int(arg[1]))
    
    lo.close()
    try:
        data.decode("UTF-8")
        return data
    except UnicodeDecodeError:
        # now create blob id
        sess= genhash(3)
        key=genhash()
        blobid = "Blob(%s.%s)" % (sess, key)
        #file(JENERIC_TMP + blobid, 'w').write(data)
        # WRANING! global link here!
        bp.add_blob(sess, blobid, data);
        return blobid;
    
def data_write(oid, c, size, arg):  
    
    if arg[0][0:5] == "Blob(" and arg[0][-1] == ")":
        # WARNING: we count on the fact that blob will not be available at the moment
        # #hpgconn = httplib.HTTPConnection("localhost:8100")
        # ### XXX !! WARNING!!! this will block!!???
        blobid = arg[0]
        xx,sess = arg[0][5:-1].split(".")
        # #hpgconn.request("GET", "/blobget?blobid=%s&blob_session=%s" % (arg[0], sess))
        # #r = hpgconn.getresponse()
        # if r.status != 200:
        #   print "Status:", r.status, r.read()
        #   raise TypeError
        # data = r.read()
        
        # in case of http_request, te blob should already be there!
        data = bp.get_blob(None, blobid)
        # in the next iteration, we will receive the request with blob in-line
        # this is a new technique that should probably be adopted for BlobPipe too
        if not data:
            print "data_write: Adding key of", blobid
            bp.waitblob[blobid] = {"terminal_id": "data_write", "oid": oid, "c":c,"size":size}
            return -2 # DOC: means we are left in waiting phase
    else:
        data = str(arg[0])
    lo = pgconn.lobject(oid, "w")
    if len(arg) == 1:
        lo.write(data)
        c.execute("UPDATE files SET size=%s,mdate=%s WHERE oid=%s", (len(data), int(time.time()), oid))
    else:
        seek = int(arg[1])
        lo.seek(seek)
        lo.write(data)
        if seek+len(data) > size:
            size = size + (size - seek + len(data))
            c.execute("UPDATE files SET size=%s,mdate=%s WHERE oid=%s", (size,int(time.time()), oid))
        else:
            size = size # ...
    lo.close()
    return "";
    
def data_listChildren(oid, c, arg):
    c.execute("SELECT child_uri from childlist where oid=%s", (oid,))
    childlist = []
    d=c.fetchone()
    while d:
        childlist.append(d[0].split("/")[-1])
        d=c.fetchone()
    return childlist
    
def data_createChild(oid, uri, name, c):
    lo = pgconn.lobject()
    c.execute("INSERT INTO files (uri,oid,parent_oid,size,cdate,mdate,adate) VALUES (%s,%s,%s,%s,%s,%s,%s)", (uri+"/"+name, lo.oid, oid, 0, int(time.time()), int(time.time()), int(time.time())))
    if oid > -1: c.execute("INSERT INTO childlist (uri,child_uri,oid,child_oid) VALUES (%s,%s,%s,%s)", (uri, uri+"/"+name, oid, lo.oid))
    # set default security to inherit
    # set parent in inherit
    if oid > -1: c.execute("INSERT INTO inherit (uri,method,parent_uri) VALUES (%s,%s,%s)", (uri+"/"+name,"*",uri)) # inherit all by default
    
    
def data_deleteObject(oid, uri, c):
    c.execute("DELETE FROM files WHERE uri=%s", (uri,))
    c.execute("DELETE FROM childlist WHERE child_uri=%s", (uri,))
    c.execute("DELETE FROM allow WHERE uri=%s", (uri,))
    c.execute("DELETE FROM deny WHERE uri=%s", (uri,))
    c.execute("DELETE FROM inherit WHERE uri=%s", (uri,))
    c.execute("DELETE FROM acl_deny WHERE uri=%s", (uri,))
    c.execute("DELETE FROM acl_allow WHERE uri=%s", (uri,))
    
def data_describe(oid, arg):
    return "" #TODO

def cleanrq(rq):
    del rq["args"]
    return rq
    
def process_rq(rq):
    
    uri = rq["uri"]
    c = pgconn.cursor()
    c.execute("SELECT oid,size FROM files WHERE uri=%s", (uri,));
    d = c.fetchone();
    if d is None:
        rq["status"] = "EEXCP"
        rq["result"] = "object not found by URI" # TODO: normalize error messages!
        c.close()
        return cleanrq(rq)
    
    r = validate(rq, c)
    if r != True:
        rq["status"] = "EPERM"
        if r: rq["result"] = r;
        else: rq["result"] = "permission denied"
        return cleanrq(rq)
    
    
    rq["status"] = "OK"
    
    # only two objects available: filestore-like and ACL 
    
    # XXX: TODO: safe path manipulation?
    if uri.split("/")[1] == "home" and uri.split("/")[3] == "ACL":
        # acl way
        if rq["method"] == "addACL":
            pass # in fact, does nothing XXX investigate this!!
        elif rq["method"] == "deleteACL":
            # totally delete
            c.execute("DELETE FROM acls WHERE aclc_uri=%s AND aclname=%s", (uri, rq["args"][0]))
        elif rq["method"] == "listACL":
            c.execute("SELECT aclname FROM acls WHERE aclc_uri=%s", (uri,))
            d = c.fetchone()
            l = []
            while d:
                if not d[0] in l: l.append(d[0])
                d = c.fetchone()
            rq["result"] = l
        elif rq["method"] == "ACLappend":
            c.execute("INSERT INTO acls (aclc_uri,aclname,terminal_id) VALUES (%s,%s,%s)", (uri,rq["args"][0],rq["args"][1]))
        elif rq["method"] == "ACLremove":
            c.execute("DELETE FROM acls WHERE aclc_uri=%s AND aclname=%s AND terminal_id=%s", (uri,rq["args"][0],rq["args"][1]))
        elif rq["method"] == "ACLlist":
            c.execute("SELECT terminal_id FROM acls WHERE aclc_uri=%s AND aclname=%s", (uri,rq["args"][0]))
            l = []
            while d:
                l.append(d[0])
                d = c.fetchone()
            rq["result"] = l
        # these are currently not supported:
        elif rq["method"] == "setTrustList":
            rq["result"] = "";
        elif rq["method"] == "setTrustList":
            rq["result"] = [];
        elif rq["method"] == "flushcache":
            rq["result"] = "";
        else:
            rq["status"] = "EEXCP"
            rq["result"] = "no such method"
            c.close()
            return cleanrq(rq)
    else:
        if rq["method"] == "read":
            size = int(d[1])
            if (len(rq["args"]) == 0 and size > MAX_READ_SIZE) or (len(rq["args"]) == 1 and size-int(rq["args"][0]) > MAX_READ_SIZE) or (len(rq["args"]) == 2 and int(rq["args"][1]) > MAX_READ_SIZE):
                rq["status"] = "EEXCP"
                rq["result"] = "object read size too big for a single request, try reducing slice"
                c.close()
                return cleanrq(rq)
            rq["result"] = data_read(d[0], rq["args"]);
        elif rq["method"] == "write":
            rq["result"] = data_write(d[0], c, int(d[1]), rq["args"]);
        elif rq["method"] == "listChildren":
            rq["result"] = data_listChildren(d[0], c, rq["args"]);
        elif rq["method"] == "createChild":
            # currently, it treally does not matter what object type w're trying to create, just create filestore one...
            #if rq["args"][2] != "~/sys/filestore":
            #   rq["status"] == "EPERM"
            #   rq["result"] == "can only create type ~/sys/filestore"
            #   c.close()
            #   return cleanrq(rq)
            # first, check that object exists and child with that name does not exist
            
            name = rq["args"][0]
            c.execute("SELECT uri FROM childlist WHERE uri=%s AND child_uri=%s", (uri, uri+"/"+name))
            if c.fetchone():
                rq["status"] = "EEXCP"
                rq["result"] = "duplicate child name"
                c.close()
                return cleanrq(rq)
            rq["result"] = data_createChild(d[0], uri, name, c);
        elif rq["method"] == "deleteChild":
            name = rq["args"][0]
            c.execute("SELECT uri FROM childlist WHERE uri=%s AND child_uri=%s", (uri, uri+"/"+name))
            if not c.fetchone():
                rq["status"] = "EEXCP"
                rq["result"] = "object not found by URI" # TODO: normalize error messages!
                c.close()
                return cleanrq(rq)
            rq["result"] = data_deleteObject(d[0], uri+"/"+name, c);
        elif rq["method"] == "securityGet":
            rq["result"] = data_securityGet(d[0], uri, c);
        elif rq["method"] == "securitySet":
            rq["result"] = data_securitySet(d[0], uri, rq["args"][0], c);
        elif rq["method"] == "describe":
            rq["result"] = data_describe(d[0], rq["args"]);
        else:
            rq["status"] = "EEXCP"
            rq["result"] = "no such method"
            c.close()
            return cleanrq(rq)
    pgconn.commit();
    c.close()
    return cleanrq(rq);
    # TODO: terminal registration home folder object & ACL object creation
    # TODO: addAsChild...

def createObject(fullURI, ownerTerminalList, methodList):
    # XXX will not fail when object already exists
    c = pgconn.cursor()
    # TODO path control here
    lURI = fullURI.split("/")
    parent = string.join(lURI[:-1], "/")
    child = lURI[-1]
    c.execute("SELECT oid FROM files WHERE uri=%s", (parent,))
    d = c.fetchone()
    if d:
        uri = parent
        oid = int(d[0])
    else:    
        uri = ""
        oid = -1
    data_createChild(oid, uri, child, c)
    # now set security:
    c.execute("SELECT oid FROM files WHERE uri=%s", (fullURI,))
    oid = int(c.fetchone()[0])
    sec = {"ipcIn": {}}
    for m in methodList:
        sec["ipcIn"][m] = []
        for t in ownerTerminalList:
            sec["ipcIn"][m].append(t)
    
    data_securitySet(oid, fullURI, sec, c)
    pgconn.commit()
    c.close();

# SUBSCRIBER_IDENTITIES = { "/bin": "xFcGt^", "/home": "pltcm[jev", "/test":"'njntcn,eltn"}

# DEBUG  = 0


# from stompservice import StompClientFactory
# from twisted.internet import reactor
# from twisted.internet.task import LoopingCall
# from random import random,seed,choice
# from orbited import json
# import string,time,thread,copy,sqlite3, traceback
# import simplejson



# class Hub(StompClientFactory):
    # identities = SUBSCRIBER_IDENTITIES
    # def recv_pgconnected(self, msg):
        # print 'Connected; Subscribing to hub'
        # # get sessions for all identities
        # # do not forget to ping periodically


    # def clientConnectionLost(self, pgconnector, reason):
        # print 'Connection Lost. Reason:', reason
        # self.clientConnectionFailed(pgconnector, reason)
    
    # def recv_message(self,msg):
        # # TODO: error s possible here
        # rq = simplejson.loads(msg["body"])
            
    