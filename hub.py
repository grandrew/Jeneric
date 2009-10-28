# the URI HUB for jeos3



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
# - remove object_name from here and jsobject!
# - IHCP support (controller, peer)
# - dynamic transport window on both sides
# - clean up the request objects on response internally! (in case we're reporting errors)

# first, have a memory storage

# test redir
# test security??

# required: 

# python 2.5
# twisted (install...
# cjson egg [or (install... (python-cjson?)
# stompservice egg
##### pyorbited egg
# orbited egg
# - patch line 119 /usr/lib/python2.5/site-packages/morbid-0.8.7.3-py2.5.egg/morbid/mqsecurity.py
#         global security_parameters

from stompservice import StompClientFactory
from twisted.internet import reactor
from twisted.internet.task import LoopingCall
from random import random,seed,choice
from orbited import json
import string,time,thread,copy,sqlite3

REGISTRAR_DB = "/var/lib/eoshub/registrar.sqlite"

PFX = "t" # terminal ID prefix
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

# XXX the HUB SHOULD guarantee uniquity of terminalID and sessions in its DB
#     rather the terminal may supply its SESSIONKEY each time it reconnects (and possibly receives a new terminalID)
def add_session(t, s):
    sessions[t] = {"s": s, "tm":time.time()}
    terminals[s] = t

def touch_session(s):
    try:
        sessions[terminals[s]]["tm"] = time.time()
    except KeyError:
        print "No session to touch"
        
    
def clean_timeout():
    time.sleep(TIMEOUT_SESSION/2);
    ct = time.time();
    for t in sessions:
        if ct - sessions[t]["tm"] > TIMEOUT_SESSION:
            # delete session silenlty
            del terminals[sessions[t]["s"]]
            del sessions[t]            
thread.start_new_thread(clean_timeout, ())

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
    
    def deliver(self, dest, rq): # will become self.send after init!!! XXX ABI glitch
        # XXX this is extremely high-level mess that overbloats the transport layer because of STOMP simplification
        print "Will deliver", rq, "to", dest
        self.rqe[str(rq["id"])] = {"d": dest, "r": rq, "tm": time.time() };
        #self.timer(); # just does not fucking work...
        self.timer.stop()
        self.timer.start(RQ_RESEND_INTERVAL)
        

    def send_real(self):
        ct = time.time()
        for i in copy.copy(self.rqe): # XXX WTF COPY!!!
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
                self.rqe[i]["r"]["id"] = self.rqe[i]["r"]["hub_oid"] # in case the callee will use this...
                # TODO: this may fail too - in case client dropped connection as well
                try:
                    sss = get_session_by_terminal(nt)
                except KeyError:
                    del self.rqe[i]
                    print "EEEEE NT WAS:", nt
                    continue;
                self.dummy_send(sss, json.encode(self.rqe[i]["r"]) )                    
                
                
                del self.rqe[i]
                
            else:
                # XXX: send without "hub_oid" ?? -> less traffic
                print "Sending", self.rqe[i]["r"], "to", self.rqe[i]["d"]
                self.dummy_send(self.rqe[i]["d"], json.encode(self.rqe[i]["r"]) )
        # cleanup ACKs window
        # XXX how does python deal with DEL inside for .. in loop???
        for i in copy.copy(self.acks): # XXX WTF COPY!!!
            if ct - self.acks[i] > MAX_WINDOW_SIZE:
                del self.acks[i]
    
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
        self.dummy_send(sessid, json.encode({"ack": rqid}))

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
                           "object_type": "",
                           "object_uri": "/",
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

    def recv_message(self,msg):
        print "Received", repr(msg)
        if msg["headers"]["destination"] == ANNOUNCE_PATH:
            # the client wants another session, give it
            print "Caught announce!"
            
            rq = json.decode(msg["body"])
            
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
                   "object_name": "",
                   "object_type": "",
                   "object_uri": "/",
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

            rq = json.decode(msg["body"])
            
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
                self.dummy_send(msg["headers"]["session"], json.encode({"error": "NOSESSION"})) # DOC document here . & ->
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
                term = rq["uri"].split("/")[1];
                
                rr = rq["uri"].split("/")[1:];
                rr[0] = "~"
                rq["uri"] = string.join(rr, "/") # TODO XXX DISCUSS: should I change DST URI to terminal shortcut???
                
                try:
                    sess = get_session_by_terminal( term )
                except KeyError:
                    # exc[
                    rq["id"] = rq["hub_oid"] # XXX redundancy issue here too
                    rq["result"] = "object not found by path";
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

reactor.connectTCP('localhost', 61613, h)
reactor.run()



