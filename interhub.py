

from stompservice import StompClientFactory
from twisted.internet import reactor
from twisted.internet.task import LoopingCall
from random import random,seed,choice
from orbited import json
import string,time,thread,copy,sqlite3, traceback,copy
import simplejson
from storage import * # import storage submodule (JEFS1)

# not registering...
#REGISTRAR_DB = "/var/lib/eoshub/registrar.sqlite"

# TODO: use BLOBs
DEBUG  = 5
TMP_DB = "/tmp/blob_tmp_db.sqlite"

ANNOUNCE_PATH = "/announce"


#######################################
# THESE ARE FROM eosinit.js->hubConnection

E_SERVER = "localhost";
E_PORT = 61613;
HUB_PATH = "/hub";
ANNOUNCE_PATH = "/announce";
KEY_LENGTH = 80; # bytes stringkey length
PING_INTERVAL = 90;

# most likely not needed
#MAXFAIL_TO_RESET = 1; // failed transmits to reset STOMP connection
#MAXRESEND_TO_RESET = 5; // resends to reset STOMP connection
#STOMP_ERRORS_TO_RESET = 3;
#STOMP_RESET_LOCK_INTERVAL = 4000; // milliseconds to lock sending till a reset

#######################################
# THESE ARE FROM HUB.PY

TIMEOUT_SESSION = 200 # seconds
MAX_WINDOW_SIZE = 60 # transport layer maximum window size [ack]
RQ_RESEND_INTERVAL = 10 # seconds between resend attempts
ACK_TIMEOUT = 60 # seconds timeout to give up resending

###########################################################################################


# this subsystem will not be a source of any IDs, so just comment out and delete
#rq_pending = {}
#idsource = 0 # id source counter
#termsource=1 # terminal IDs counter


# TODO: for BLOBs?
#blobtmp = sqlite3.connect(TMP_DB);
#blobtmp.text_factory = str;
#c = blobtmp.cursor()

seed(time.time())


def genhash(length=8, chars=string.letters + string.digits):
    return ''.join([choice(chars) for i in range(length)])


class HubConnection(StompClientFactory):
    
    terminal_id = "" # set it at init
    terminal_key = "" # set at init
    username = "eos"
    password = "eos"
    
    
    ___SESSIONKEY = genhash(KEY_LENGTH)

    # to be set to what is needed
    def receive(self, rq):
        pass;
    
     
    last_time = 0

    rqe = {}
    acks = {}
    
  
    #############
    # client clone
    
    def ping(self):
        rq = {"id": genhash(), "terminal_id": self.terminal_id, "uri": "/", "method": "ping", "args": []}
	self.send(rq)

    def announce(self):
        ann = {"session": self.___SESSIONKEY};
        if len(self.terminal_id)>0 and len(self.terminal_key)>0:
            ann["terminal_id"] = self.terminal_id;
            ann["terminal_key"] = self.terminal_key;
        if DEBUG: print "HUBCONN: announcing...", repr(ann), "from", self.___SESSIONKEY
        self.dummy_send(ANNOUNCE_PATH, simplejson.dumps(ann))
    
    def recv_connected(self, msg):
        if DEBUG: print 'HUBCONN: Connected; Subscribing to ', self.___SESSIONKEY
        self.subscribe(self.___SESSIONKEY)
        
        self.dummy_send = self.send
        self.send = self.deliver
        # create new terminal name
        self.timer = LoopingCall(self.send_real)
        self.timer.start(RQ_RESEND_INTERVAL)

        self.pinger = LoopingCall(self.ping)
        self.pinger.start(PING_INTERVAL)
	self.announce()
        
        # TODO: clean requests left unanswered!
        #self.cleantimeout = LoopingCall(clean_timeout)
        #self.cleantimeout.start(TIMEOUT_SESSION/2)


    def recv_message(self,msg):
        if DEBUG > 3: print "HUBCONN: Received", repr(msg), "to", self.___SESSIONKEY

        # now try to parse and pass the request

        #rq = json.decode(msg["body"]) # remove all these <<--
        if type(msg["body"]) == type(""): # for local static requests
            rq = simplejson.loads(msg["body"])
        else:
            rq = msg["body"] # for locally-bound ipc only
        
        if "ack" in rq:
            self.ack_rcv(rq["ack"])
            return


        # deal with nosession!
        if "error" in rq and rq["error"] == "NOSESSION":
            if DEBUG: print "HUBCONN: nosession, reannounce"
            self.announce();
            self.send_real(True) # force
            return

        if not self.ack_snd(rq["id"]):
            return # means we've already processed this session|id pair

        # now we got the rq ready to rcv
        self.receive(rq)


    # def send(self, dest(???), rq):    
    def deliver(self, rq): # will become self.send after init, and send->dummy_send!!! XXX ABI glitch
        
        # TODO: dont forget to set terminal_id appropriately!
        
        if DEBUG > 3: print "HUBCONN: Will deliver", rq, "from", self.___SESSIONKEY
        self.rqe[str(rq["id"])] = { "r": rq, "tm": time.time() };
        try:
            self.timer.stop()
            self.timer.start(RQ_RESEND_INTERVAL)
        except:
            print "HUBCONN: Error!!! timer was DEAD, trying to re-run from", self.___SESSIONKEY
            self.timer.start(RQ_RESEND_INTERVAL)


    def send_real(self, force = False):
        ct = time.time()
        for i in copy.copy(self.rqe): # XXX WTF COPY!!! (SEE STUPID I AM)
            if ct - self.rqe[i]["tm"] > ACK_TIMEOUT:
                # notify the caller that we could not deliver the message
                # that means that the client has restarted or somethig (session reset?)
                # XXX but session reset means that the message CAN still be delivered if the terminal is
                #     e.g. authenticated or was re-linked as the same child object to dest (via other auth policy) using another session
                
                # XXX only for requests??
                
                if "response" in self.rqe[i]["r"]:
                    #try:
                    #    nt = self.rqe[i]["r"]["uri"].split("/")[1]
                    #except:
                    #    nt=""
                    #    continue
                    # we just failed to send response!!
                    if DEBUG>1: print "HUBCONN: Failed to send response", repr(self.rqe[i]), "from", self.___SESSIONKEY
                    # do nothing
                else: # request failed
                    self.rqe[i]["r"]["status"] = "ECONN";
                    self.rqe[i]["r"]["result"] = "Too much resend to HUB fails. Giving up.";
                    
                    self.receive(self.rqe[i]["r"]);
                    
                    #try:
                    #    nt = self.rqe[i]["r"]["terminal_id"]
                    #except:
                    #    print "Error!: no terminal_id in request available!:", repr(self.rqe[i]["r"])
                    #    continue
                    
                
            else:
                # XXX: send without "hub_oid" ?? -> less traffic
                # now select what exactly we're going to send:
                if not "last_sent" in self.rqe[i]: self.rqe[i]["last_sent"] = ct
                else:
                  if (ct - self.rqe[i]["last_sent"] < RQ_RESEND_INTERVAL) and (not force): continue
                
                self.rqe[i]["r"]["session"] = self.___SESSIONKEY
                
                # TODO: BLOB SEND HERE!!

                if DEBUG > 3: print "HUBCONN: Sending", self.rqe[i]["r"], "from", self.___SESSIONKEY
                
                self.dummy_send(HUB_PATH, simplejson.dumps(self.rqe[i]["r"]) )
        # cleanup ACKs window
        for i in copy.copy(self.acks): # XXX WTF COPY!!!
            if ct - self.acks[i] > MAX_WINDOW_SIZE:
                del self.acks[i]
                #break
    
    def ack_rcv(self, data):
        try:
            del self.rqe[str(data)]
        except KeyError:
            pass
    
    def ack_snd(self, rqid):
        # a method to remember sent request IDs ACKs
        # in case we receive the same rqid - drop the connection
        t = 1
        if repr(rqid) in self.acks: t = 0
        
        self.acks[repr(rqid)] = time.time()
        self.dummy_send(HUB_PATH, simplejson.dumps({"ack": rqid}))

        return t
    

    def clientConnectionLost(self, connector, reason):
        print 'HUBCONN: Connection Lost. Reason:', reason
        self.clientConnectionFailed(connector, reason)




# relay class

class HubRelay:
    def __init__(self, conn1, conn2):
        self.conn1 = HubConnection()
        self.conn1.terminal_id = conn1["terminal_id"]
        self.conn1.terminal_key = conn1["terminal_key"]
        
        self.conn2 = HubConnection()
        self.conn2.terminal_id = conn2["terminal_id"]
        self.conn2.terminal_key = conn2["terminal_key"]
        
        # now set receivers
        self.conn1.receive = self.receive1
        self.conn2.receive = self.receive2
        
        # now run.
        reactor.connectTCP(conn1["host"], conn1["port"], self.conn1)
        reactor.connectTCP(conn2["host"], conn2["port"], self.conn2)
    
    def receive1(self, rq):
        self.receive(rq, self.conn1)
    def receive2(self, rq):
        self.receive(rq, self.conn2)
    
    def receive(self, rq, conn=None):
        lURI = rq["uri"].split("/")
	if DEBUG > 3: print "HUBCONN_RECVD", repr(rq)

        if "status" in rq:
            # response... 
            if DEBUG > 3: print "Got respone "
            #if len(lURI) < 1:
            #    print "Malformed request (URI)!", repr(rq)
            #    rq["status"] = "EPERM"
            #    rq["result"] = "Permission denied"
            #    conn.send(rq)
            #    return        

            rq["id"] = rq["id"][:-5]

            if conn == self.conn1:
                rq["uri"] = string.join([self.conn2.terminal_id]+lURI,"/") # append our name
                rq["terminal_id"] = self.conn2.terminal_id;
                if DEBUG > 3: print "Sending ", repr(rq)
                self.conn2.send(rq);
            else:
                rq["uri"] = string.join([self.conn1.terminal_id]+lURI,"/") # append our name
                rq["terminal_id"] = self.conn1.terminal_id; 
                if DEBUG > 3: print "Sending ", repr(rq)
                self.conn1.send(rq)
        else:
            # receive and relay the request
            
            #if len(lURI) < 1:
            #    rq["status"] = "EPERM"
            #    rq["result"] = "Permission denied"
            #    conn.send(rq)
            #    print "Malformed request (URI)!", repr(rq)
            #    return        

            if rq["uri"] == "~": # request for hub
                rq["uri"] = "/"
            else: rq["uri"] = "/"+string.join(lURI[1:],"/") # bypass our name
	    rq["id"] = rq["id"]+"RELAY"

            if conn == self.conn1:
                rq["terminal_id"] = self.conn2.terminal_id;
                if DEBUG > 3: print "Sending ", repr(rq)
                self.conn2.send(rq)
            else:
                rq["terminal_id"] = self.conn1.terminal_id;
                if DEBUG > 3: print "Sending ", repr(rq)
                self.conn1.send(rq)

def test_ih():
    c1 = {"terminal_id": "hub1_testing", "terminal_key": "hub1_testing", "host":"jeneric.dyndns.org", "port": 61613}
    c2 = {"terminal_id": "hub2_testing", "terminal_key": "hub2_testing", "host":"go.jeneric.net", "port": 61613}    
    hr = HubRelay(c1, c2)
    reactor.run()
