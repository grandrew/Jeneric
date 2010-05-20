///////////////////////////////////////////////////////////////////
// JavaScript wrappers for JNEXT sockets plugin
///////////////////////////////////////////////////////////////////

// Wrapper for base64 encoder/decoder adapted from http://ntt.cc/

JNEXT_.prototype.Base64 = function()
{  
    this.encode64 = Orbited.base64.encode;
    this.decode64 = Orbited.base64.decode;
}

JNEXT_UdpSocket = function(vm)
{
    var self = this;
    if(vm) this.___vm = vm;
    self.m_base64 = new JNEXT.Base64()

    self.setListenPort = function( nPort )
    {
        var strPort = "" + nPort;
        var strVal = JNEXT.invoke( self.m_strObjId, "SetListenPort", strPort );
        arParams = strVal.split( " " );
        return ( arParams[ 0 ] == "Ok" )
    }
    
    self.setRemoteAddr = function( strAddr, nPort )
    {
        var strParams = strAddr + " " + nPort;
        var strVal = JNEXT.invoke( self.m_strObjId, "SetRemoteAddr", strParams );
        arParams = strVal.split( " " );
        return ( arParams[ 0 ] == "Ok" )
    }
    
    self.sendPacket = function()
    {
        var strData, strAddr, strPort;
        var nArgs = arguments.length;
        if ( nArgs == 1 )
        {
            strData = arguments[ 0 ];
        }
        else
        if ( nArgs == 3 )
        {
            strAddr = arguments[ 0 ];
            nPort   = arguments[ 1 ];
            strData = arguments[ 2 ];
        }
        else
        {
            return false;
        }
        var strBase64Data = self.m_base64.encode64( strData );
        var strSendParams;
        
        if ( nArgs == 3 )
        {
            strSendParams = strAddr + " " + nPort + " " + strBase64Data;
        }
        else
        {
            strSendParams = strBase64Data;
        }
        
        var strVal = JNEXT.invoke( self.m_strObjId, "SendPacket", strSendParams );
        arParams = strVal.split( " " );
        return ( arParams[ 0 ] == "Ok" )
    }
    
    self.close = function()
    {
        strRes = JNEXT.invoke( self.m_strObjId, "Close" );
        strRes = JNEXT.invoke( self.m_strObjId, "Dispose" );
        JNEXT.unregisterEvents( self );
    }
    
    self.onEvent = function( strData )
    {
        var arData = strData.split( " " );
        var strEventDesc = arData[ 0 ];
        switch ( strEventDesc )
        {
            case "Error":
            {
                //self.onError();
                if (typeof(self.onError) == 'function') self.onError();
                else {
                    self.___vm.execf_thread(self.onError, [], fake);
                }
                break;
            }
            
            case "OnPacket":
            {
                var strFromIP   = arData[ 1 ];
                var nFromPort   = parseInt(arData[ 2 ]);
                var strBase64Data = arData[ 3 ];
                var strData = self.m_base64.decode64( strBase64Data );
                //self.onPacket( strFromIP, nFromPort, strData );
                if (typeof(self.onPacket) == 'function') self.onPacket();
                else {
                    self.___vm.execf_thread(self.onPacket, [strFromIP, nFromPort, strData], fake);
                }
                break;
            }
        }
    }
    
    self.getId = function()
    {
        return self.m_strObjId;
    }
    
    self.init = function()
    {
        if ( !JNEXT.require( "sockets" ) )
        {
            return false;
        }
        self.m_strObjId = JNEXT.createObject( "sockets.UdpSocket" );
        if ( self.m_strObjId == "" )
        {
            if(window.console) console.log("JNEXT: UDP: error initializing UdpSocket");
            return false;
        }
        JNEXT.registerEvents( self );
    }
    
    self.onError = function()
    {
        if(window.console) console.log("JNEXT: UDP: onError");
    }
    
    self.onPacket = function( strSourceIP, nSourcePort, strData )
    {
        var strMsg = "onPacket: SourceIP=" + strSourceIP;
        strMsg += ", SourcePort=" + nSourcePort;
        strMsg += ", Data=" + strData;
        if(window.console) console.log("JNEXT: UDP: "+strMsg);
    }
    
    self.m_strObjId = "";
    self.init();
}


JNEXT_AsyncLineSocket = function(vm)
{
    if(vm) this.___vm = vm;
    var self = this;
    self.connect = function( strAddress, nPort )
    {
        var strAddr = strAddress + " " + nPort;
        var strVal = JNEXT.invoke( self.m_strObjId, "Connect", strAddr );
        arParams = strVal.split( " " );
        return ( arParams[ 0 ] == "Ok" )
    }
    
    self.sendLine = function( strLine )
    {
        var strVal = JNEXT.invoke( self.m_strObjId, "SendLine", strLine );
        arParams = strVal.split( " " );
        return ( arParams[ 0 ] == "Ok" )
    }
    
    self.close = function()
    {
        strRes = JNEXT.invoke( self.m_strObjId, "Close" );
        strRes = JNEXT.invoke( self.m_strObjId, "Dispose" );
        JNEXT.unregisterEvents( self );
    }
    
    self.onEvent = function( strData )
    {
        var arData = strData.split( " " );
        var strEventDesc = arData[ 0 ];
        switch ( strEventDesc )
        {
            case "ConnectError":
            {
                if (typeof(self.onConnectError) == 'function') self.onConnectError();
                else {
                    self.___vm.execf_thread(self.onConnectError, [], fake);
                }
                break;
            }
            
            case "Connected":
            {
                //self.onConnected();
                if (typeof(self.onConnected) == 'function') self.onConnected();
                else {
                    self.___vm.execf_thread(self.onConnected, [], fake);
                }
                break;
            }
            
            case "Close":
            {
                var strReason = strData.substring( strEventDesc.length + 1 );
                
                //self.onClose( strReason );
                if (typeof(self.onClose) == 'function') self.onClose(strReason);
                else {
                    self.___vm.execf_thread(self.onClose, [strReason], fake);
                }
                break;
            }
            
            case "OnLine":
            {
                var strLine = strData.substring( strEventDesc.length + 1 );
                //self.onLine( strLine );
                if (typeof(self.onLine) == 'function') self.onLine(strLine);
                else {
                    self.___vm.execf_thread(self.onLine, [strLine], fake);
                }
                break;
            }
        }
    }
    
    self.getId = function()
    {
        return self.m_strObjId;
    }
    
    self.init = function()
    {
        if ( !JNEXT.require( "sockets" ) )
        {
            return false;
        }
        self.m_strObjId = JNEXT.createObject( "sockets.ClientSocket" );
        if ( self.m_strObjId == "" )
        {
            if(window.console) console.log("JNEXT: UDP: error initializing ClientSocket");
            return false;
        }
        JNEXT.registerEvents( self );
    }
    
    self.onConnected = function()
    {
        if(window.console) console.log( "onConnected" );
    }
    
    self.onConnectError = function()
    {
        if(window.console) console.log( "onConnectError" );
    }
    
    self.onLine = function( strLine )
    {
        if(window.console) console.log( "onLine:" + strLine );
    }
    
    self.onClose = function( strReaon )
    {
        if(window.console) console.log( "onClose " + strReaon );
    }
    
    self.m_strObjId = "";
    self.init();
}
