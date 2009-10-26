# the URI HUB for jeos3

# TODO: STOMP security so noone can attach to HUB events!!
# TODO: REDIR support
# TODO: clean up the request objects on response internally! (in case we're reporting errors)


# first, have a memory storage


# required: 

# python 2.5
# twisted (install...
# cjson (install... (python-cjson?)
# stompservice egg
# pyorbited egg
# orbited egg

from stompservice import StompClientFactory
from twisted.internet import reactor
from twisted.internet.task import LoopingCall
from random import random,seed,choice
from orbited import json
import string,time,thread,copy

PFX = "t" # terminal ID prefix
# SFX = "" # hub domain suffix

ANNOUNCE_PATH = "/announce"


# later: data pipes, etc.

HUB_PATH = "/hub"
#SESSION_PATH = "/session"

TIMEOUT_SESSION = 1000 # seconds
MAX_WINDOW_SIZE = 60 # transport layer maximum window size [ack]
RQ_RESEND_INTERVAL = 10 # seconds between resend attempts
ACK_TIMEOUT = 60 # seconds timeout to give up resending

rq_pending = {}
idsource = 0

sessions = {}
terminals = {}


def add_session(t, s):
    sessions[t] = {"s": s, "tm":time.time()}
    terminals[s] = t
    
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
    r = {"terminal_id": rq_pending[k]["r"]["terminal_id"], "old_id": rq_pending[k]["old_id"]}
    del rq_pending[k]
    return r
                


seed(time.time())


def genhash(length=8, chars=string.letters + string.digits):
    return ''.join([choice(chars) for i in range(length)])


class Hub(StompClientFactory):

    
    
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


    def recv_message(self,msg):
        print "Received", repr(msg)
        if msg["headers"]["destination"] == ANNOUNCE_PATH:
            # the client wants another session, give it
            print "Caught announce!"
            termname = PFX+str(newId())
            msg["headers"]["session"] = json.decode(msg["body"])["session"]
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
            
            if "result" in rq:
            
                # result arrived, get the caller dest by id and forward
                
                d = rq_pull(rq)
                if d is None:
                    
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
                # if it is request: 
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



