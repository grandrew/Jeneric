/* Faux Console by Chris Heilmann & others http://wait-till-i.com */ 
if(!window.console && '\v' == 'v'){
var console={
    DEPTH: 70,
    init:function(){
        console.d=document.createElement('div');
        document.body.appendChild(console.d);
        console.d.style.display="none";
        var a=document.createElement('a');
        a.href='javascript:console.hide()';
        a.innerHTML='close';
        console.d.appendChild(a);
        var a=document.createElement('a');
        a.href='javascript:console.clear();';
        a.innerHTML='clear';
        console.d.appendChild(a);
        var id='fauxconsole';
        if(!document.getElementById(id)){
            console.d.id=id;
        }
        console.show();
    },
    
    hide:function(){
        console.d.style.display='none';
        console.hidden = true;
    },
    
    show:function(){
        console.d.style.display='block';
        console.hidden = false;
    },
    
    log:function(o){
        if(console.hidden) return;
        var t = document.createTextNode(o);
        var div = document.createElement("DIV");
        div.appendChild(t);
        console.d.appendChild(div);
        if(console.d.childNodes.length > console.DEPTH) console.d.removeChild(console.d.firstChild);
    },
    
    clear:function(){
        console.d.parentNode.removeChild(console.d);
        console.init();
        console.show();
    },

    addLoadEvent:function(func){
        window.attachEvent("onload", func);
    }
};
console.addLoadEvent(console.init);
//console.init();
}
