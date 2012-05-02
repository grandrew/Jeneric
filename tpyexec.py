import sys
sys.path.append("/home/jeneric/jeneric")

from interhub import *

ACCESS_KEY="skytrol_key"

class pyExec:
    
    AUTHENTICATED_TERMINALS = []
    
    def __init__(self, conn1):
        self.conn1 = HubConnection()
        self.conn1.terminal_id = conn1["terminal_id"]
        self.conn1.terminal_key = conn1["terminal_key"]
        self.conn1.host = conn1["host"]
        self.conn1.port = conn1["port"]
        if "blob_port" in conn1: self.conn1.blob_port = conn1["blob_port"]
        
        # now set receivers
        self.conn1.receive = self.receive1
        
        # now run.
        reactor.connectTCP(conn1["host"], conn1["port"], self.conn1)
        
    def receive1(self, rq):
        self.receive(rq, self.conn1)
    
    def receive(self, rq, conn=None):
        if "uri" in rq: lURI = rq["uri"].split("/")
        if DEBUG > 3: 
          if len(repr(rq)) < 3000: print "HUBCONN_RECVD", repr(rq)
          else: print "RECVD largre object"

        if "status" in rq:
            # response... 
            if DEBUG > 3: print "Got respone ", repr(rq)
            #if len(lURI) < 1:
            #    print "Malformed request (URI)!", repr(rq)
            #    rq["status"] = "EPERM"
            #    rq["result"] = "Permission denied"
            #    conn.send(rq)
            #    return        
            # TODO: request without URI is not supported!!!

            # we received a response. Responses are not supported yet since we don't request anything
        else:
            # receive and process the request
            
            #if len(lURI) < 1:
            #    rq["status"] = "EPERM"
            #    rq["result"] = "Permission denied"
            #    conn.send(rq)
            #    print "Malformed request (URI)!", repr(rq)
            #    return        

            if rq["uri"] == "~": # request for hub
                rq["uri"] = "/"
            else: rq["uri"] = "/"+string.join(lURI[1:],"/") # bypass our name
            
            # ignore all of the above and treat all requests as requests for tpyexec terminal root ("/")
            # TODO: authentication?
            if rq['method'] == 'auth':
                # authenticate with key
                if rq['args'][0] == ACCESS_KEY:
                    if not (rq['terminal_id'] in self.AUTHENTICATED_TERMINALS):
                        self.AUTHENTICATED_TERMINALS.append(rq['terminal_id'])
                    result = "OK"
                else:
                    rq['status'] = 'EPERM'
                    rq["result"] = "Permission denied"
                    conn.send(rq)
                    return
            
            if rq['method'] == 'exec':
                if not (rq['terminal_id'] in self.AUTHENTICATED_TERMINALS):
                    rq['status'] = 'EPERM'
                    rq["result"] = "Permission denied"
                    conn.send(rq)
                    return
                # now process query, parse and send the result [or return immediately and send result later?]
                #result = py_process(rq['args'][0])
                try:
                    global result
                    result = None
                    code = compile(rq['args'][0], "<string>", "exec")
                    eval(code) # define result
                except:
                    rq['status'] = 'EEXCP'
                    rq['error'] = rq['result'] = traceback.format_exc()
                    if DEBUG: print "Exception:", repr(rq['error'])
          
                if DEBUG: print "sending reply:", repr(result)

            # prepare a result
            if not ('status' in rq):
                rq['status'] = 'OK'
                rq['result'] = result
            del rq['args']
            
            #return rq
            
            self.conn1.send(rq)

def test_ih():
    c1 = {"terminal_id": "skytrol_interface", "terminal_key": "kikonkov2", "host":"go.jeneric.net", "port": 61613}
    hr = pyExec(c1)
    reactor.run()

if __name__ == '__main__':
    test_ih()
    