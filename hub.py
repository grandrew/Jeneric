# the URI HUB for jeos3


# INSTALLATION
# required: 

# python 2.5 USE="sqlite3"
# twisted (install...
#   : twisted-web
#   : zope-interfcae
# python-cjson egg [or (install... (python-cjson?)
# stompservice egg
# orbited egg
# - patch line 119 /usr/lib/python2.5/site-packages/morbid-0.8.7.3-py2.5.egg/morbid/mqsecurity.py
# +        global security_parameters
# access rights for REGISTRAR_DB = "/var/lib/eoshub/registrar.sqlite"

#########################################################################################



# - terminal registration support
#   + terminal methods support
#       + register(tname, tkey)
#       + auth(tname, tkey): will change tname and send the hook 
#         XXX may result in bad behaviour since terminal creds change at run-time (mostly security issue)
#       - passwd (tname, kurkey, newkey) - change password
#   + 'ping' method support; AND check if any request/response touches session!
#       + and ping from hubConnection
#   + announce with credentials tname/tkey -> from init ## parameters
#   + ic# write() ipc!
# + remove object_name from here and jsobject!
# - support for persistent hub connection sessions - for seamless restarting (terminals do not like if the 
#   session is dropped) - or TODO for terminals: support reauth when session drops
# - IHCP support (controller, peer)
# - dynamic transport window on both sides
# - clean up the request objects on response internally! (in case we're reporting errors)
# - reserved names: http_request, blob64send/get/blob..

# first, have a memory storage

# test redir
# test security??



from stompservice import StompClientFactory
from twisted.internet import reactor
from twisted.internet.task import LoopingCall
from random import random,seed,choice
from orbited import json
import string,time,thread,copy,sqlite3
import simplejson

REGISTRAR_DB = "/var/lib/eoshub/registrar.sqlite"
TMP_DB = "/tmp/blob_tmp_db.sqlite"

PFX = "_t" # terminal ID prefix
# SFX = "" # hub domain suffix

ANNOUNCE_PATH = "/announce"


# later: data pipes, etc.

HUB_PATH = "/hub"
HUB_PRIVATE_KEY = "SuPeRkEy" # OMFG!! <-> STOMP -->> orbited
#SESSION_PATH = "/session"

TIMEOUT_SESSION = 200 # seconds
MAX_WINDOW_SIZE = 60 # transport layer maximum window size [ack]
RQ_RESEND_INTERVAL = 10 # seconds between resend attempts
ACK_TIMEOUT = 60 # seconds timeout to give up resending

###########################################################################################


rq_pending = {}
idsource = 0

sessions = {}
terminals = {}


dbconn = sqlite3.connect(REGISTRAR_DB);
c = dbconn.cursor()
c.execute('''create table if not exists reg
(name text UNIQUE, key text, identity text, created int, accessed int)''')
dbconn.commit()
c.close()

blobtmp = sqlite3.connect(TMP_DB);
c = blobtmp.cursor()
c.execute('''create table if not exists tmp
(key text UNIQUE, sessid text, data blob, time int)''')
blobtmp.commit()
c.close()


# XXX the HUB SHOULD guarantee uniquity of terminalID and sessions in its DB
#     rather the terminal may supply its SESSIONKEY each time it reconnects (and possibly receives a new terminalID)
def add_session(t, s, tm=0):
    if tm ==0: tm = time.time() 
    sessions[t] = {"s": s, "tm":tm}
    terminals[s] = t

def touch_session(s):
    tm = time.time()
    try:
        if sessions[terminals[s]]["tm"] < tm: # touch only outdated
            sessions[terminals[s]]["tm"] = tm
    except KeyError:
        print "No session to touch"
        
    
def clean_timeout():
    #time.sleep(TIMEOUT_SESSION/2);
    ct = time.time();
    # TODO XXX WE MUST BE SURE NOBODY IS MODIFYING THE LISTS
    #         WHILST WE ARE ITERATING
    # USE TWISTED DELAYED EXECUTION!!!
    # -- ok done. Just check taht it works.
    try:
        for t in sessions:
            if ct - sessions[t]["tm"] > TIMEOUT_SESSION:
                # delete session silenlty
                del terminals[sessions[t]["s"]]
                del sessions[t]
    except RuntimeError:
        pass;            
# thread.start_new_thread(clean_timeout, ())

def get_session_by_terminal( t ):
    return sessions[t]["s"];

def get_terminal_by_session( s ):
    return terminals[s];

def newId():
    global idsource
    idsource += 1
    return idsource


def rq_append(rq, oldid):
    rq_pending[str(rq["id"])] = {"r": rq, "old_id":oldid}


def rq_pull(rq):
    k = str(rq["id"]);
    if not k in rq_pending: return None;
    r = {"terminal_id": rq_pending[k]["r"]["terminal_id"], "old_id": rq_pending[k]["old_id"], "r": rq_pending[k]["r"]}
    del rq_pending[k]
    return r
                


seed(time.time())


def genhash(length=8, chars=string.letters + string.digits):
    return ''.join([choice(chars) for i in range(length)])


class Hub(StompClientFactory):
    username = "hub"
    password = HUB_PRIVATE_KEY
    
    
    rqe = {}
    acks = {}
    
    static_servers = {}
    
    def deliver(self, dest, rq): # will become self.send after init, and send->dummy_send!!! XXX ABI glitch
        # XXX this is extremely high-level mess that overbloats the transport layer because of STOMP simplification
        print "Will deliver", rq, "to", dest
        if dest in self.static_servers:
            dest = self.static_servers[dest];
        self.rqe[str(rq["id"])] = {"d": dest, "r": rq, "tm": time.time() };
        #self.timer(); # just does not fucking work...
        self.timer.stop()
        self.timer.start(RQ_RESEND_INTERVAL)
        

    def send_real(self):
        ct = time.time()
        for i in copy.copy(self.rqe): # XXX WTF COPY!!! (SEE STUPID I AM)
            if ct - self.rqe[i]["tm"] > ACK_TIMEOUT:
                # notify the caller that we could not deliver the message
                # that means that the client has restarted or somethig (session reset?)
                # XXX but session reset means that the message CAN still be delivered if the terminal is
                #     e.g. authenticated or was re-linked as the same child object to dest (via other auth policy) using another session
                
                # XXX only for requests??
                
                if "response" in self.rqe[i]["r"]:
                    try:
                        nt = self.rqe[i]["r"]["uri"].split("/")[1]
                    except:
                        nt=""
                        continue
                else: # request failed
                    nt = self.rqe[i]["r"]["terminal_id"]
                    
                # notify silently
                self.rqe[i]["r"]["status"] = "EDROP" # DOC document this too

                try:
                    self.rqe[i]["r"]["id"] = self.rqe[i]["r"]["hub_oid"] # in case the callee will use this...
                except KeyError:
                    pass; # XXX TODO just ignore if hub_oid isnt set??

                # TODO: this may fail too - in case client dropped connection as well
                try:
                    sss = get_session_by_terminal(nt)
                except KeyError:
                    del self.rqe[i]
                    print "EEEEE NT WAS:", nt
                    continue;
                #self.dummy_send(sss, json.encode(self.rqe[i]["r"]) )
                self.dummy_send(sss, simplejson.dumps(self.rqe[i]["r"]) )                                        
                del self.rqe[i] # 
                #self.send_real()
                #break
                
            else:
                # XXX: send without "hub_oid" ?? -> less traffic
                deref = self.rqe[i]["d"];
                print "Sending", self.rqe[i]["r"], "to", deref
                #self.dummy_send(self.rqe[i]["d"], json.encode(self.rqe[i]["r"]) )
                if type(deref) == type(""): self.dummy_send(deref, simplejson.dumps(self.rqe[i]["r"]) )
                else: 
                    x = self.rqe[i]["r"]
                    del self.rqe[i] # we dunna want to wait for acks or retry sending either
                    deref(x) # bang!
                    #self.send_real() # XXX AM I TOO STUPID AM I??
                    #break
        # cleanup ACKs window
        # XXX how does python deal with DEL inside for .. in loop???
        for i in copy.copy(self.acks): # XXX WTF COPY!!!
            if ct - self.acks[i] > MAX_WINDOW_SIZE:
                del self.acks[i]
                break
    
    def ack_rcv(self, data):
        try:
            del self.rqe[str(data)]
        except KeyError:
            pass
    
    def ack_snd(self, sessid, rqid):
        # a method to remember sent request IDs ACKs
        # in case we receive the same rqid - drop the connection
        t = 1
        if repr(sessid)+repr(rqid) in self.acks: t = 0
        
        self.acks[repr(sessid)+repr(rqid)] = time.time()
        #self.dummy_send(sessid, "", {"ack": rqid})
        
        #self.dummy_send(sessid, json.encode({"ack": rqid}))
        self.dummy_send(sessid, simplejson.dumps({"ack": rqid}))

        return t
    
    def recv_connected(self, msg):
        print 'Connected; Subscribing to /hub'
        self.subscribe(HUB_PATH)
        self.subscribe(ANNOUNCE_PATH)
        
        self.dummy_send = self.send
        self.send = self.deliver
        # create new terminal name
        self.timer = LoopingCall(self.send_real)
        self.timer.start(RQ_RESEND_INTERVAL)
        self.cleantimeout = LoopingCall(clean_timeout)
        self.cleantimeout.start(TIMEOUT_SESSION/2)

    def clientConnectionLost(self, connector, reason):
        print 'Connection Lost. Reason:', reason
        self.clientConnectionFailed(connector, reason)
    
    def processHUBRequest(self, rq, msg):
        # process the request and return the rs object
        r = ""
        s = ""
        m = rq["method"]
        
        
        
        if m == "register":
            try:
                name = rq["args"][0]
                key = rq["args"][1]
                ident = rq["args"][2]
            except KeyError:
                s = "EEXCP"
                r = "invalid arguments"
            if len(s) == 0: # XXX arbitrary length limitations??
                if len(name) < 2: 
                  s = "EEXCP"
                  r = "name cannot be less than two chars"
                if len(key) < 2:
                  s = "EEXCP"
                  r = "key cannot be less than two chars"
            if len(s) == 0:
                # try to register the terminal
                c = dbconn.cursor();
                try:
                    
                    c.execute("insert into reg (name, key, identity, created, accessed) values (?,?,?,?,?)", (rq["args"][0],rq["args"][1],rq["args"][2], int(time.time()),int(time.time())))
                    dbconn.commit()
                    s = "OK"
                    r = "registered"
                except sqlite3.Error, e:
                    # deny registration with errror
                    s = "EEXCP"
                    r = repr(e.args[0])
                c.close()
        elif m == "passwd":
            try:
                name = rq["args"][0]
                key_old = rq["args"][1]
                key_new = rq["args"][2]
            except KeyError:
                s = "EEXCP"
                r = "invalid arguments"
            if len(s) == 0:
                c = dbconn.cursor();
                try:
                    c.execute("update or fail reg set key=? where name=? and key=?", (key_new, name, key_old))
                    dbconn.commit()
                    s = "OK"
                    r = "changed"
                except sqlite3.Error, e:
                    # deny registration with errror
                    s = "EEXCP"
                    r = "incorrect credentials"
                c.close()            
        elif m == "auth": 
            # XXX THIS procedure should be run from terminal object only, if at all...
            #     or the system will be unable to re-authenticate itself upon hub request if the kernel parameters not set
            # change current session credentials
            try:
                name = rq["args"][0]
                key = rq["args"][1]
            except KeyError:
                s = "EEXCP"
                r = "invalid arguments"
            if len(s) == 0: # XXX arbitrary length limitations??                
                c = dbconn.cursor()
                s = "EEXCP"
                r = "wrong name/key pair"
                try:
                #if 1:
                    c.execute('select * from reg where name=? and key=?', (name, key))
                    termname = c.fetchone()[0]
                    add_session(termname, msg["headers"]["session"]) 
                    
                    rq2 = {
                           "id": genhash(10)+str(newId()), 
                           # "user_name": "none", # XXX get rid of this!!
                           "terminal_id": "hub",
                           #// optional but mandatory for local calls
                           # "object_name": "",
                           "caller_type": "",
                           "caller_uri": "/",
                           "caller_security": "",
                           #// now the actual params
                           "uri": "~",
                           "method": "hubConnectionChanged",
                           "args": [termname]
                    };
                    
                    rq2["hub_oid"] = rq2["id"] # for compat
                    self.send(msg["headers"]["session"], rq2)
                    s = "OK"
                    r = ""
                    
                except sqlite3.Error, e:
                    print "Could not authenticate terminal (auth):", e.args[0]
                except:
                    print "Other general error:"
                c.close()

        elif m == "logout":
            # drop session
            try:
                ss = msg["headers"]["session"]
                del sessions[terminals[ss]]
                del terminals[ss]    
            except KeyError:
                print "dropping unknown session. WTF?"
                pass
            
            s = "OK"
            r = ""
        elif m == "ping":
            s = "OK"
            r = "pong"
        elif m == "listChildren":
            s = "OK"
            ii = 0
            ll = []
            # TODO: add sorted list terminal
            #      it will provide listChildren method that will provide some sort of categorization
            #      like assorted/0-50,50-100, etc; alphabet/a_d,e_h, etc; type, reg, etc. etc.
            #      this method here should accept sorting options then
            #      also SORTED terminal/link should always be added first!
            #      pluggable modules needed!! ;-)
            # TODO: linked terminal session -> register some terminal app as a link to provide direct controlled access (money!)
            for ob in sessions:
                if ob != GETPIPE_TERMNAME: ll.append(ob)
                ii += 1
                if ii > 50: break
            r = ll;
        else:
            s = "EEXCP"
            r = "no such method"
        
        
        try:
            del rq["args"]
        except KeyError:
            pass;
        rq["result"] = r
        rq["status"] = s
        return rq
    
    def register_session(self, terminal_id, dest_callback):
        "register a local callback"
        pass
        # invent session automatically
        sess = genhash(20)
        add_session(terminal_id, sess, time.time()+1e6); # and to never timeout
        self.static_servers[sess] = dest_callback;
    
    def self_receive(self, termname, rq):
        sessid = get_session_by_terminal(termname)
        rq["session"] = sessid
        msg = {"headers": {"destination": ""}, "session":sessid, "body": rq}
        self.recv_message(msg)
    
    def recv_message(self,msg):
        print "Received", repr(msg)
        if msg["headers"]["destination"] == ANNOUNCE_PATH:
            # the client wants another session, give it
            print "Caught announce!"
            
            #rq = json.decode(msg["body"])
            rq = simplejson.loads(msg["body"])
            
            termname = PFX+str(newId())
            
            if "terminal_id" in rq and "terminal_key" in rq:
                c = dbconn.cursor()
                try:
                    name = rq["terminal_id"]
                    key = rq["terminal_key"]
                    c.execute('select * from reg where name=? and key=?', (name, key))
                    termname = c.fetchone()[0]
                except sqlite3.Error, e:
                    print "Could not authenticate terminal:", e.args[0]
                except:
                    print "Other general error:"
                c.close()
            
            
            msg["headers"]["session"] = rq["session"]
            session = msg["headers"]["session"]
            add_session(termname, session) 
            
            rq = {
                   "id": genhash(10)+str(newId()), # just drop the id # XXX do we ever need this?? there is always an ID in STOMP!
                   # "user_name": "none", # XXX get rid of this!!
                   "terminal_id": "hub",
                   #// optional but mandatory for local calls
                   # "object_name": "",
                   "caller_type": "",
                   "caller_uri": "/",
                   "caller_security": "",
                   #// now the actual params
                   "uri": "~",
                   "method": "hubConnectionChanged",
                   "args": [termname]
            };
            
            rq["hub_oid"] = rq["id"] # for compat
            self.send(session, rq)
        elif "ack" in msg["headers"]:
            # provide a simple ack mechanism
            self.ack_rcv(msg["headers"]["ack"])
            
        else:
            # now try to parse and pass the request

            #rq = json.decode(msg["body"]) # remove all these <<--
            if type(msg["body"]) == type(""): # for local static requests
                rq = simplejson.loads(msg["body"])
            else:
                rq = msg["body"] # for locally-binded ipc only
            
            if "ack" in rq:
                self.ack_rcv(rq["ack"])
                return
            
            msg["headers"]["session"] = rq["session"]
            touch_session(rq["session"])
            del rq["session"]
            
            try:
                terminal = get_terminal_by_session(msg["headers"]["session"])
            except KeyError:
                print "Issuing nosession!"
                #self.dummy_send(msg["headers"]["session"], json.encode({"error": "NOSESSION"})) # DOC document here . & ->
                self.dummy_send(msg["headers"]["session"], simplejson.dumps({"error": "NOSESSION"})) # DOC document here . & ->
                return; # and DO NOT send ACK - so the client could re-establish a conection and resend the request!


            
            
            #self.dummy_send(msg["headers"]["session"], {"ack": rq.id}) 
            if not self.ack_snd(msg["headers"]["session"], rq["id"]): # XXX transport layer implemented here...
                return # means we've already processed this session|id pair
            

            # now pass the request to destination
            
            if "result" in rq or ("status" in rq and rq["status"] != "REDIR"): # XXX protocol mess...
                
                    
                
                # result arrived, get the caller dest by id and forward
                
                d = rq_pull(rq)
                if d is None:
                    # XXX General protection fault..
                    return
                caller = d["terminal_id"]
                oid = d["old_id"]
                # the response is a definite action so just forward it to caller
                rq["hub_oid"] = rq["id"]
                rq["id"] = oid;
                # XXX: check it has a result and status right??
                self.send(get_session_by_terminal( caller ), rq ) 
                # XXX: no such object here -> notify callee??
                
            else:
                # check for malformed request
                if not ("uri" in rq and "id" in rq and "method" in rq and "args" in rq):
                    # exc[
                    rq["id"] = rq["hub_oid"] # XXX redundancy issue here too
                    rq["result"] = "HUB: MALFORMED REQUEST";
                    rq["status"] = "EEXCP"
                    try:
                        del rq["args"]
                    except KeyError:
                        pass
                    self.send(msg["headers"]["session"], rq)                    
                    return 
                
                
                # first, check if the request is for our own subsystem
                if rq["uri"] == "/":
                    # process the request and send the response
                    self.send( msg["headers"]["session"] , self.processHUBRequest(rq, msg))
                    return
                
                # if it is request: 
                if ("status" in rq) and (rq["status"] == "REDIR"):
                    # handle redir
                    # del rq["status"]
                    # choose another request as this one
                    d = rq_pull(rq)
                    if d is None:
                        # XXX General protection fault..
                        return
                    d["r"]["uri"] = rq["uri"]
                    rq = d["r"]["uri"]
                    terminal = rq["terminal_id"] # because we've set the right one already

                rq["terminal_id"] = terminal # just change it
                oldid = rq["id"] # XXX remove redundancy
                rq["hub_oid"] = rq["id"]
                rq["id"] = genhash(10)+str(newId()); # spoofing-protection
                rq_append(rq, oldid)
                
                # XXX report malformed URI!
                try:
                    term = rq["uri"].split("/")[1];
                except IndexError:
                    print "URI parse failed:", rq["uri"]
                    # exc[
                    rq["id"] = rq["hub_oid"] # XXX redundancy issue here too
                    rq["result"] = "HUB: URI parse failed!";
                    rq["status"] = "EEXCP"
                    try:
                        del rq["args"]
                    except KeyError:
                        pass
                    self.send(msg["headers"]["session"], rq)                    
                    return 
                
                rr = rq["uri"].split("/")[1:];
                rr[0] = "~"
                rq["uri"] = string.join(rr, "/") # TODO XXX DISCUSS: should I change DST URI to terminal shortcut???
                
                try:
                    sess = get_session_by_terminal( term )
                except KeyError:
                    # exc[
                    rq["id"] = rq["hub_oid"] # XXX redundancy issue here too
                    rq["result"] = "object not found by URI";
                    rq["status"] = "EEXCP"
                    try:
                        del rq["args"]
                    except KeyError:
                        pass
                    self.send(msg["headers"]["session"], rq)
                    return
                
                self.send( sess , rq); # XXX a more secure URI parse?
                
            
        pass
        
#    def send_data(self, data):
#        self.send(HUB_PATH, data)

#    def send_trash(self):
#        self.send(HUB_PATH, "hello")

h = Hub()


###########################################################################################################
# BLOB TRANSFER PART

# from twisted.internet import reactor # imported earlier
from twisted.web import static, server
from twisted.web.resource import Resource
import base64,cStringIO

# there are two options: - render GET /blob, render POST /blob;
# render GET /base64, POST /base64
# blobsend/blobget, base64send/base64get

CONN_TIMEOUT = 100 # seconds
BLOB_TIMEOUT = 150 # seconds, to be sure all connections already dropped
PIPE_TIMEOUT = 150 # seconds to transfer a READBYTES chunk

READBYTES = 10 # 20000 # 20k bytes
TREAT_AS_BLOB_SIZE = 1000000 # 1 mb to treat as BLOB
GETPIPE_TERMNAME = "http_request" # name of DataPipe static terminal

# DEFS
ENCODE = 0
REQUEST = 1
TIME = 2


class BlobPipe(Resource):

    requests = {} # TODO: a zodb serializeable storage not RAM?
    pipes = {}
    waitblob = {}
    
    clean1 = None
    clean2 = None
    
    #static_session = "" # to be set
    
    def conn_checkdrop(self):
        # TODO: do not drop if transfer is ongoing
        d = time.time()
        ldrop = []
        for v in self.requests:
            if d - self.requests[v][TIME] > CONN_TIMEOUT:
                # drop connection
                # self.requests[v][REQUEST].write("");
                self.requests[v][REQUEST].setResponseCode(504, "timeout waiting for blob, connection drop");
                self.requests[v][REQUEST].finish();
                ldrop.append(v);
        for v in ldrop:
            del self.requests[v]
    
    def blob_checkdrop(self):
        deltime = time.time() - BLOB_TIMEOUT;
        c = blobtmp.cursor()
        c.execute("delete from tmp where time < ?", (deltime,));
        blobtmp.commit();
        c.close();            

    def pipe_checkdrop(self):
        tm = time.time()
        for v in copy.copy(self.pipes):
            if tm - self.pipes[v]["ts"] > PIPE_TIMEOUT:
                self.pipes[v]["request"].setResponseCode(500);
                self.pipes[v]["request"].write("Internal error: timeout")
                self.pipes[v]["request"].finish();
                del self.pipes[v]

    def add_blob(self, sess, key, data):

        if not self.requests.has_key(key):
            # there is no request, just append to database
            c = blobtmp.cursor()
            c.execute("insert into tmp (sessid, key, data, time) values (?,?,?,?)", (sess, key, data, time.time()));
            blobtmp.commit();
            c.close();            
        else:
            # the request is waiting already, send the data
            if self.requests[key][ENCODE]: # means request for encoded data
                self.requests[key][REQUEST].write(data.encode("hex"));
            else:
                self.requests[key][REQUEST].write(data);
            self.requests[key][REQUEST].finish();
            del self.requests[key];

        if key in self.waitblob:
            self.blobreceived(self.waitblob[key])
            del self.waitblob[key]

    def get_blob(self, sess, key):
        c= blobtmp.cursor();
        # now check if a record exists
        if sess: c.execute('select data from tmp where sessid=? and key=?', (sess, key));
        else: c.execute('select data from tmp where key=?', (key)); # ugly workarund for blob_received
        d = c.fetchone()
        c.close()
        if d is None:
            return d
        c= blobtmp.cursor();
        c.execute('delete from tmp where key=?', (key)); # ugly workarund for blob_received
        c.close()
        blobtmp.commit()
        return d[0]

            
    def getChild(self, name, request):
        return self

    def render_GET(self, request):
        if not self.clean1: 
            # XXX the ugly initializtiona way
            self.clean1 = LoopingCall(self.conn_checkdrop)
            self.clean1.start(CONN_TIMEOUT)
            self.clean2 = LoopingCall(self.blob_checkdrop)
            self.clean2.start(BLOB_TIMEOUT)
            self.clean3 = LoopingCall(self.pipe_checkdrop)
            self.clean3.start(PIPE_TIMEOUT)
            
            # now init the requestHUb object
            self.requestHub = h;

            termid = GETPIPE_TERMNAME
            self.requestHub.register_session(termid, self.blobreceived); 
            
        
        
                
        if "base64send" == request.prepath[0]:
            try:
                b64blob = request.args['data'][0]
                blobid = request.args['blobid'][0]
                sess = request.args['blob_session'][0]
            except KeyError:
                return "EPARM"
            # now store the blob in the availability list
            # and mark any waiting queues to start sending data [in fact, send data entirely]
            self.add_blob(sess, blobid, b64blob.decode("hex")); 
            return "OK"
        elif "base64get" == request.prepath[0]:
            try:
                blobid = request.args['blobid'][0]
                sess = request.args['blob_session'][0]
            except KeyError:
                return "EPARM"
            # d = self.get_blob(sess, blobid)
            d = self.get_blob(None, blobid) # XXX not sure why session is EVER NEEDED ?!?!
            if d is None:
                # defer request
                self.requests[blobid] = [1, request, time.time()];
            else:
                request.write(d.encode("hex"));
                request.finish();
            return server.NOT_DONE_YET
        elif "blobget" == request.prepath[0]:
            try:
                blobid = request.args['blobid'][0]
                sess = request.args['blob_session'][0]
            except KeyError:
                return "EPARM"
            #d = self.get_blob(sess, blobid)
            d = self.get_blob(None, blobid)  # XXX not sure why session is EVER NEEDED ?!?!
            if d is None:
                # defer request
                self.requests[blobid] = [0, request];
            else:
                request.write(d);
                request.finish();
            
            return server.NOT_DONE_YET
        else: # This means that we got a direct access request and we should parse it into sequential READs
            pass;
            # first, add to object-waiting list: request and 
            #   can we accept chunked transfer without knowing the LENGTH?
            # create new rq object and ID
            rq = {
                    "id": genhash(10)+str(newId()), 
                    "terminal_id": "/"+GETPIPE_TERMNAME,
                    #// optional but mandatory for local calls
                    "caller_type": "",
                    "caller_uri": "/"+GETPIPE_TERMNAME,
                    "caller_security": "",
                    #// now the actual params
                    "uri": request.path,
                    "method": "read",
                    "args": [0,READBYTES]
            };
            rq["hub_oid"] = rq["id"] # for compat

            self.pipes[rq["id"]] = {"rq": rq, "request": request, "pos": READBYTES, "ts": time.time(), "uri": request.path, "dir": 0};
            

            self.requestHub.self_receive(GETPIPE_TERMNAME, rq) ## NO!! do not send to session
            ## we need to expose a mechanism to resolver normal requests (for example, have a special session ID for external RQs)

            
            return  server.NOT_DONE_YET
            
            
            
        return "OK"
    
    def blobreceived(self, rq):
        # TODO HERE
        # + we should then watch for this ID either in DB or wait till received
        # + then send. If the length is less than 100k -> finish the connection and remove
        # + else - retrieve and send next chunk
        # + timeout pipes
        # + watch for errors (for eaxmple object not found by path)
        # - handle pipe for read() and write() by different paths
        # - close incoming POST connection upon first rq receipt (with offset 0)
        
        #print "RQ is", repr(rq)

        # rq = simplejson.loads(rq["body"]) 
        
        if not rq["id"] in self.pipes:
            print "ASSERT!!! -> request %s not found in PIPES" % rq["id"]
            return
        
        if rq["status"] != "OK" and self.pipes[rq["id"]]["request"]: # checking for request is required for POST pipe
            # parse error into HTTP errors
            if rq["status"] == "EPERM":
                self.pipes[rq["id"]]["request"].setResponseCode(403);
                self.pipes[rq["id"]]["request"].write("Forbidden")
                self.pipes[rq["id"]]["request"].finish();
            elif "not found" in rq["result"]:
                self.pipes[rq["id"]]["request"].setResponseCode(404);
                self.pipes[rq["id"]]["request"].write("Object not found: "+rq["result"])
                self.pipes[rq["id"]]["request"].finish();
            else:
                self.pipes[rq["id"]]["request"].setResponseCode(500);
                self.pipes[rq["id"]]["request"].write("Error at callee side: "+rq["result"])
                self.pipes[rq["id"]]["request"].finish();
            del self.pipes[rq["id"]]
            return
                    
        
        if self.pipes[rq["id"]]["dir"]: # 1 means "blob POST"
            # now that we received the data, we may safely close request
            if self.pipes[rq["id"]]["request"]:
                self.pipes[rq["id"]]["request"].finish();
                print "Closing request"
            # warning! different ABI here from the below!
            self.send_blob(self.pipes[rq["id"]]["uri"], self.pipes[rq["id"]]["fd"], self.pipes[rq["id"]]["isblob"], self.pipes[rq["id"]]["pos"], READBYTES, None)
            del self.pipes[rq["id"]]
        else:
            
            blobid = rq["result"] # it may be a blobid OR a resulting STRING!!!

            #try:
            
            # OMG!! very tiny chance of failure here (not completely robust) TODO address this later: properly escape/unescape Blobs
            if blobid[0:5] == "Blob(" and blobid[-1] == ")":
                isblob = True
            else:
                isblob = False
            
            
            #except:
            #    if rq["id"] in self.pipes: del pipes[rq["id"]]
            #    return # just ignore malformed response


            # slightly inefficient memory usage
            rq2 = {
                    "id": genhash(10)+str(newId()), 
                    "terminal_id": "/"+GETPIPE_TERMNAME,
                    #// optional but mandatory for local calls
                    "caller_type": "",
                    "caller_uri": "/"+GETPIPE_TERMNAME,
                    "caller_security": "",
                    #// now the actual params
                    "uri": self.pipes[rq["id"]]["uri"],
                    "method": "read",
                    "args": [self.pipes[rq["id"]]["pos"],READBYTES]
            };
            rq2["hub_oid"] = rq2["id"] # for compat


            if isblob:
                b = self.get_blob(None, blobid)
                if b:
                    self.pipes[rq["id"]]["request"].write(b);
                    if len(b) < READBYTES:
                        self.pipes[rq["id"]]["request"].finish();
                        del self.pipes[rq["id"]]
                    else:
                        # request next block
                        self.pipes[rq2["id"]] = {"rq": rq2, "request": self.pipes[rq["id"]]["request"], "pos": self.pipes[rq["id"]]["pos"]+READBYTES, "ts":time.time(), "uri": self.pipes[rq["id"]]["uri"], "dir": 0}
                        self.requestHub.self_receive(GETPIPE_TERMNAME, rq2) ## NO!! do not send to session
                        
                        del self.pipes[rq["id"]]
                        
                else:
                    # wait for blob to arrive here!
                    self.waitblob[blobid] = rq # TODO: re-invoke blobreceived, delete from waitblob
            else:
                self.pipes[rq["id"]]["request"].write(blobid);
                if len(blobid) < READBYTES:
                    self.pipes[rq["id"]]["request"].finish();
                    del self.pipes[rq["id"]]
                else:
                    # request next block
                    # COPYPASTE WARNING HERE!

                    self.pipes[rq2["id"]] = {"rq": rq2, "request": self.pipes[rq["id"]]["request"], "pos": self.pipes[rq["id"]]["pos"]+READBYTES, "ts": time.time(), "uri": self.pipes[rq["id"]]["uri"], "dir": 0}
                    self.requestHub.self_receive(GETPIPE_TERMNAME, rq2) ## NO!! do not send to session
                    
                    del self.pipes[rq["id"]]
                    #print "rq2 is", rq2["id"], (rq2["id"] in self.pipes)
                    # END COPYPASTE WARNING!!!@!@
                    

    def render_POST(self, request):
        #[]
        if "blobsend" == request.prepath[0]:
            #pass # do receive the blob in base64
            blob = request.content.read(); # the body of request         
            #print "GOT POST BODY: ", blob #############################################
            blobid = request.args['blobid'][0]
            sess = request.args['blob_session'][0]

            # now store the blob in the availability list
            # and mark any waiting queues to start sending data [in fact, send data entirely]
            self.add_blob(sess, blobid, blob);
            return "OK"
        else:
            # try to parse the POST in a multipart form
            # and then sequentally write it to receiver
            # returning the correct status (not found, forbidden, internal error or OK)
            
            # XXX DOC: the program must first make sure the ramstore object exists and is in a proper state
            #         (is empty or is set to appropriate length, supports BLOBs or UTF-8 TEXT)
            
            fd = request.content
            # now, treat it as BLOB is the file is larger than 1000 kb
            # also treat it as blob if these 1000kb could not be converted in UTF-8
            fd.seek(TREAT_AS_BLOB_SIZE)
            isblob = True # treat as blob by default
            if not fd.read(1):
                isblob = False
            else:
                fd.seek(0)
                r = fd.read()
                try:
                    r.decode("UTF-8")
                    isblob = False
                except UnicodeDecodeError:
                    pass
            
            fd.seek(0)
            
            fd2 = cStringIO.StringIO()
            fd2.write(fd.read()) # SHIT. why the FUCK do I need to copy it every time???
            fd2.seek(0)
            
            # XXX DOC
            #         if the blob size is more than TREAT_AS_BLOB_SIZE = 1000000 bytes - send as Blob()
            #         else, try to encode the data in UTF-8 first
            #         if succeeded, deliver as TEXT argument, otherwise - as BLOB argument
            
            
            self.send_blob(request.path, fd2, isblob, 0, READBYTES, request)
            return  server.NOT_DONE_YET
            
        return "OK"


    def send_blob(self, uri, fd, isblob, pos=0, size=READBYTES, request = None):

        rq = {
                "id": genhash(10)+str(newId()), 
                "terminal_id": "/"+GETPIPE_TERMNAME, # will be changed by terminal anyways
                #// optional but mandatory for local calls
                "caller_type": "",
                "caller_uri": "/"+GETPIPE_TERMNAME,
                "caller_security": "",
                #// now the actual params
                "uri": uri,
                "method": "write",
        };
        rq["hub_oid"] = rq["id"] # for compat
        
        #fd.seek(pos)
        data = fd.read(size)
        print "Data is:", data, " of size: ", size
        print "Value is:", fd.getvalue()
        
        if isblob:
            # first, create a blobid and the blob
            blobid = "Blob(args."+genhash(15)+")"
            self.add_blob("NOSESSION", blobid, data); # session to be ignored
            rq["args"] = [blobid, pos]
        else:
            rq["args"] = [data.decode("UTF-8"),pos]

        if len(data) == size: self.pipes[rq["id"]] = {"pos": pos+size, "ts": time.time(), "uri": uri, "isblob": isblob, "fd": fd, "dir": 1, "request" : request};
        else: 
            if request: request.finish()
        self.requestHub.self_receive(GETPIPE_TERMNAME, rq)

site = server.Site(BlobPipe())



reactor.connectTCP('localhost', 61613, h)
reactor.listenTCP(8100, site)
reactor.run()

