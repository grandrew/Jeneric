

import psycopg2, httplib, time, string,simplejson, os.path, os, sys
from random import choice # for genhash


DATA_DB_CREDENTIALS = "dbname=jeneric_data user=jeneric_data"
REG_DB_CREDENTIALS = "dbname=jeneric_reg user=jeneric_data"
MAX_READ_SIZE = 400000 # max read slice size in bytes!
# JENERIC_TMP = "/tmp/jeneric/"


MAXLIST = 100 # maximum file listing length

RTIME = 1268347288 # reference time
RBITS = 1024*1024*2*8 # reference bits amount

INIT_OBJECTLIST = ["bin", "lib", "home"]
ADMIN_TERMINALS = ["test", "grandrew", "admin"] # hard-coded admin terminals


METHODS_FULL_ACCESS = ["securitySet", "securityGet", "read", "write", "describe", "listChildren", "createChild", "deleteChild"] # everything

################################################################################
try:
  from hub_config import *
except:
  print "\n\n\n-------------------------\nimport hub_config FAILED.\nTry doing it manually.\n-------------------------\\n\n\n"
  pass



pgconn = psycopg2.connect(DATA_DB_CREDENTIALS)

def cur_maxbytes():
    return (RBITS + int(time.time()-RTIME))/8

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
    ownerTerminalList = ADMIN_TERMINALS
    methodList = METHODS_FULL_ACCESS
    #objectlist = ["bin", "test", "lib", "home", "types"]
    
    for ob in INIT_OBJECTLIST:
        createObject("/"+ob, ownerTerminalList, methodList)
    pgconn.commit()
def secg(uri):
    c = pgconn.cursor()
    c.execute("SELECT oid,size FROM files WHERE uri=%s", (uri,));
    d = c.fetchone();
    if d is None:
        print "Error: no such uri"
        return
    print simplejson.dumps(data_securityGet(d[0], uri, c));
    c.close()

def secs(uri,sjs):
    c = pgconn.cursor()
    c.execute("SELECT oid,size FROM files WHERE uri=%s", (uri,));
    d = c.fetchone();
    if d is None:
        print "Error: no such uri"
        return
    struct = simplejson.loads(sjs)
    print data_securitySet(d[0], uri, struct, c);
    pgconn.commit()
    c.close()

    
#init_db() # do not init DB each time we launch... use interactive mode insted!!

def validate(rq,c):


    # TODO:
    # 1. first check in obj,
    # 2. then check inherit
    #   3.  do the same 1. and 2. in inherit-parent

    parent = rq["uri"]
    it = 0
    
    
    # security update - we can have terminals for which the action is defined (incl. "*") and others for which action is inherit
    it = 0;
    d = True

    # TODO: check if method is not in the object ipc deny/allow - set method name to "*" for the following steps:
    while d and it < 100:
        mdefined = False
        # print "------   VALIDATE: doing for", parent 
        c.execute("SELECT parent_uri FROM inherit WHERE uri=%s AND ( method=%s OR method=%s )", (parent, rq["method"], "*"))
        d = c.fetchone();
        
        while d and it < 100:
            # print "------- VALIDATE222"
            parent = d[0]
            # the following line actually acts a very limited value - no 'method:ingerit' notation supported anymore
            c.execute("SELECT parent_uri FROM inherit WHERE uri=%s AND ( method=%s OR method=%s )", (parent, rq["method"], "*"))
            d = c.fetchone()
            it += 1
    
        
#        c.execute("SELECT * FROM deny WHERE uri=%s AND method=%s AND terminal_id=%s", (parent, rq["method"], rq["terminal_id"]))
#        d = c.fetchone();
#        if d:
#            return False;

        c.execute("SELECT * FROM deny WHERE uri=%s AND method=%s", (parent, rq["method"]))
        d = c.fetchall();
        if len(d):
            mdefined = True
            for t in d:
                if t[3] == rq["terminal_id"] or t[3]=="*": 
                    # print "-------- FALSE deny FROM", parent
                    return False
                elif t[3] == "inherit":
                    parent = string.join(parent.split("/")[:-1], "/")  # TODO: path manipulation here!
                    # print "------- comntinue1"
                    continue


                
#        c.execute("SELECT * FROM allow WHERE uri=%s AND method=%s AND (terminal_id=%s OR terminal_id=%s)", (parent, rq["method"], rq["terminal_id"], "*"))
#        d = c.fetchone();
#        if d:
#            return True;

        c.execute("SELECT * FROM allow WHERE uri=%s AND method=%s", (parent, rq["method"]))
        d = c.fetchall();
        if len(d):
            mdefined = True
            for t in d:
                if t[3] == rq["terminal_id"] or t[3]=="*": return True
                elif t[3] == "inherit":
                    parent = string.join(parent.split("/")[:-1], "/")  # TODO: path manipulation here!
                    continue

       

        # else, check if there are some ACLs defined:
        
        c.execute("SELECT aclname FROM acl_deny WHERE uri=%s AND method=%s", (parent, rq["method"]))
        c2 = pgconn.cursor()
        d=c.fetchone()
        while d:
            mdefined = True
            # TODO: multiple ACL inheritance?
            c2.execute("SELECT * FROM acls WHERE aclname=%s AND terminal_id=%s", (d[0],rq["terminal_id"]))
            if c2.fetchone(): return False
            d=c.fetchone()
        
        
        c.execute("SELECT aclname FROM acl_allow WHERE uri=%s AND method=%s", (parent, rq["method"]))
        c2 = pgconn.cursor()
        d=c.fetchone()
        while d:
            mdefined = True
            # TODO: multiple ACL inheritance?
            c2.execute("SELECT * FROM acls WHERE aclname=%s AND terminal_id=%s", (d[0],rq["terminal_id"]))
            if c2.fetchone(): return True
            d=c.fetchone()
            
        #c.execute("SELECT parent_uri FROM inherit WHERE uri=%s AND ( method=%s OR method=%s )", (rq["uri"], rq["method"], "*"))
        #d = c.fetchone();
        
        #while d and it < 100:
        #    parent = d[0]
        # now check if we have 'inherit' in the method-list:
        if not mdefined:
	  c.execute("SELECT * FROM allow WHERE uri=%s AND (method=%s OR method='*') AND terminal_id=%s", (parent, rq["method"], "inherit"))
          d = c.fetchone();
          if d:
              mdefined = True
              parent = string.join(parent.split("/")[:-1], "/") # TODO: WARNING: disallow "/" in names!!


       
        ###################################################################################################
        # NOW the same for method "*"
        
        
        # we need to make sure the method was not defined previously and was not defaulted to "deny others"
        if not mdefined:
            
            c.execute("SELECT * FROM deny WHERE uri=%s AND method=%s AND terminal_id=%s", (parent, "*", rq["terminal_id"]))
            d = c.fetchone();
            if d:
                #print "FALSE deny * FROM", parent
                return False;

                    
            c.execute("SELECT * FROM allow WHERE uri=%s AND method=%s AND (terminal_id=%s OR terminal_id=%s)", (parent, "*", rq["terminal_id"], "*"))
            d = c.fetchone();
            if d:
                return True;
            
            # else, check if there are some ACLs defined:
            
            c.execute("SELECT aclname FROM acl_deny WHERE uri=%s AND method=%s", (parent, "*"))
            c2 = pgconn.cursor()
            d=c.fetchone()
            while d:
                # TODO: multiple ACL inheritance?
                c2.execute("SELECT * FROM acls WHERE aclname=%s AND terminal_id=%s", (d[0],rq["terminal_id"]))
                if c2.fetchone(): return False
                d=c.fetchone()
            
            
            c.execute("SELECT aclname FROM acl_allow WHERE uri=%s AND method=%s", (parent, "*"))
            c2 = pgconn.cursor()
            d=c.fetchone()
            while d:
                # TODO: multiple ACL inheritance?
                c2.execute("SELECT * FROM acls WHERE aclname=%s AND terminal_id=%s", (d[0],rq["terminal_id"]))
                if c2.fetchone(): return True
                d=c.fetchone()
                
            #c.execute("SELECT parent_uri FROM inherit WHERE uri=%s AND ( method=%s OR method=%s )", (rq["uri"], rq["method"], "*"))
            #d = c.fetchone();
            
            #while d and it < 100:
            #    parent = d[0]

            # now check if we have 'inherit' in the method-list:
            c.execute("SELECT * FROM allow WHERE uri=%s AND method=%s AND terminal_id=%s", (parent, "*", "inherit"))
            d = c.fetchone();
            if d:
                parent = string.join(parent.split("/")[:-1], "/") # TODO: WARNING: disallow "/" in names!!
        
        
        
        it+=1
        # TODO: inherit cache!
    
    #print "------    FALSE general from", parent, "it", it, "method", rq["method"], "uri", rq["uri"]
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
        c.execute("INSERT INTO inherit (uri,parent_uri,method) VALUES (%s,%s,%s)", (uri,parent_uri,"*"))
    else:
        for ob in t:
            #if t[ob] == "inherit": # not supported by latest spec
                # TODO: reasonable caching!
            #    parent_uri = string.join(uri.split("/")[:-1], "/")
            #    c.execute("INSERT INTO inherit (uri,method,parent_uri) VALUES (%s,%s,%s)", (uri,ob,parent_uri))
            #else: # it is a list
                for tname in t[ob]:
                    if tname[0] == "!":
                        if tname[1] == "#": c.execute("INSERT INTO acl_deny (aclname,uri,method) VALUES (%s,%s,%s)", (tname[2:],uri,ob))
                        else: c.execute("INSERT INTO deny (uri,oid,method,terminal_id) VALUES (%s,%s,%s,%s)", (uri,oid,ob,tname[1:]))
                    else:
                        # treat inherit as normal terminal-id... but never allow it to register!!
                        #if tname == "inherit": 
                        #    parent_uri = string.join(uri.split("/")[:-1], "/")
                        #    c.execute("INSERT INTO inherit (uri,parent_uri,method) VALUES (%s,%s,%s)", (uri,parent_uri,"*"))
                        if tname[0] == "#": c.execute("INSERT INTO acl_allow (aclname,uri,method) VALUES (%s,%s,%s)", (tname[1:],uri,ob))
                        # the following will also eat "*"
                        else: c.execute("INSERT INTO allow (uri,oid,method,terminal_id) VALUES (%s,%s,%s,%s)", (uri,oid,ob,tname))
    return None

def data_securityGet(oid, uri, c):
    sec = { "ipcIn": {}}
    
    c.execute("SELECT parent_uri FROM inherit WHERE uri=%s AND method=%s", (uri, "*"))
    d = c.fetchone();
    if d:
        if c.fetchone(): # only if it is the only entry in list => optimize struct?
            return { "ipcIn": "inherit" }
    
    
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
        sec["ipcIn"][d[0]].append("!#"+d[1])
        d = c.fetchone();
    
    c.execute("SELECT method,aclname FROM acl_allow WHERE uri=%s", (uri,))
    d = c.fetchone();
    while d:
        if not d[0] in sec["ipcIn"]: sec["ipcIn"][d[0]] = []
        sec["ipcIn"][d[0]].append("#"+d[1])
        d = c.fetchone();

    # now examine inheritance
    
    c.execute("SELECT method FROM inherit WHERE uri=%s", (uri,))
    d = c.fetchone();
    while d:
        #if not d[0] in sec["ipcIn"]: sec["ipcIn"][d[0]] = []
        if d[0] in sec["ipcIn"]: sec["ipcIn"][d[0]].append("inherit")
        else: sec["ipcIn"][d[0]] = ["inherit"]
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
    #print "READ: Will return data of len", len(data)
    lo.close()
    return data
    
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
        try:
            data = arg[0].encode("utf-8") # str(arg[0].decode("utf-8"))
        except:
            data = arg[0]
    lo = pgconn.lobject(oid, "w")
    if len(arg) == 1:
        lo.write(data)
        c.execute("UPDATE files SET size=%s,mdate=%s WHERE oid=%s", (len(data), int(time.time()), oid))
    else:
        if len(arg) > 1: seek = int(arg[1])
        else: seek = 0
        if seek >=0 : lo.seek(seek)
        else: lo.seek(0, 2) # to get length - is the return value of this!
        print "Seeking to", seek
        lo.write(data)
        if seek+len(data) > size:
            size = size + (size - seek + len(data))
            c.execute("UPDATE files SET size=%s,mdate=%s WHERE oid=%s", (size,int(time.time()), oid))
        else:
            size = size # ...
    print "File size is:", size
    # now, if the 'seek' is ommitted, truncate the size!! DOC this
    lo.close()
    if len(arg) == 1: c.execute("select lo_truncate(lo_open(%s,131072),%s)", (oid, len(data))); # no seek?
    return "";
    
def data_listChildren(oid, c, arg):
    c.execute("SELECT child_uri from childlist where oid=%s LIMIT %s", (oid,MAXLIST))
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
    
    c.execute("SELECT child_uri from childlist where uri=%s", (uri,))
    #childlist = []
    # TODO warning! recursion!!
    d=c.fetchone()
    while d: 
        data_deleteObject(0, d[0], c);
	d = c.fetchone()
        #childlist.append(d[0].split("/")[-1])
    
    c.execute("DELETE FROM childlist WHERE child_uri=%s", (uri,))
    c.execute("DELETE FROM allow WHERE uri=%s", (uri,))
    c.execute("DELETE FROM deny WHERE uri=%s", (uri,))
    c.execute("DELETE FROM inherit WHERE uri=%s", (uri,))
    c.execute("DELETE FROM acl_deny WHERE uri=%s", (uri,))
    c.execute("DELETE FROM acl_allow WHERE uri=%s", (uri,))
        
    
def fetch_listing(base):
    c = pgconn.cursor()
    print "Doing select ...", "SELECT oid,size FROM files WHERE uri like %s" % ("%s%%" % base,), 
    #c.execute("SELECT oid,size FROM files WHERE uri like %s", ("%s/%%" % base,))
    c.execute("SELECT uri, oid FROM files WHERE uri like '%s%%'" % base)
    d = c.fetchall();
    if d is None:
        rq["status"] = "EEXCP"
        rq["result"] = "object not found by URI" # TODO: normalize error messages!
        c.close()
	print "failed."
        return -1
    print "length", len(d)
    ret = []
    for entry in d:
      print "appending path", entry
      ret.append(entry)
    c.close()
    return ret
  
def fetch_data(loids, base):
    c = pgconn.cursor()
    for oid in loids:
        hasChild = len(data_listChildren(oid[1], c, None))
        rem = oid[0].split(base)[1]
        if hasChild:
            print "Creating direcotry", rem
            try:
                os.makedirs(rem)
            except OSError, e:
                if e.errno != 17: print "Failed to create dir:", rem
            data = data_read(oid[1], [])
            if len(data) > 1:
                dob = rem+".___"
                print "Creating directory dataobject", dob
                file(dob, 'wb').write(data_read(oid[1], []))
        else:
            print "Creating file", rem
            try:
                os.makedirs(os.path.dirname(rem))
            except OSError, e:
                if e.errno != 17 and len(os.path.dirname(rem)) > 0: print "Cannot create", rem, "(",os.path.dirname(rem)  , ")", "path"
            file(rem, 'wb').write(data_read(oid[1], []))

#def push_data()

def main():
    jn_path = sys.argv[1]
    if jn_path[-1] != "/":
      jn_path += "/"
    fs_path = os.getcwd() # unused
    fetch_data(fetch_listing(jn_path), jn_path)

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
    sec["ipcIn"]["listChildren"]=["*"] # allow listing for all
    sec["ipcIn"]["read"]=["*"] # allow read for all
    data_securitySet(oid, fullURI, sec, c)
    
    
    if lURI[1] == "home":
        # set ACL access too:
        sec = {"ipcIn": {}}
        for m in ["addACL", "deleteACL", "listACL", "ACLappend", "ACLremove", "ACLlist", "setTrustList", "getTrustList"]:
            sec["ipcIn"][m] = []
            for t in [child]:
                sec["ipcIn"][m].append(t)
        
        data_securitySet(0, fullURI+"/security/ACL", sec, c)
    pgconn.commit()
    c.close();

if __name__ == '__main__':
  main()
    
