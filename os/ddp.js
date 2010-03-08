// DDP

/*

--- CRAZY
---------------
- DDP kernel extension: Direct DOM Pixelerizer
    - create a <table> of certain dim & size (or calculate via pixelsize)
        - & cloneBuffer
    - expose STD GFX hooks: pixel, draw move
        - later: more advanced fast-drawing functions: fill(), box(), circle(), arc(), etc.
    - expose 8-bit Unicode binary image drawing support (convert BMP images using GearsBlob, for ex.)
    - z-index double(or N-ble)-buffering support (.setActiveBuffer(N))


*/

function DDP(wrappedElement) {
    this.el = wrappedElement.___link;
    this.createDDPCanvas(wrappedElement);
};

DDP.prototype = {
    /* 
        Takes element with canvas and creates a new buffer in there
        wrapped element
        board width in pixels
        board height in px
        rw - resolution in pixels in width
        rh - resolution in pixels in height
    */
    MODE_NONE: 0,
    MODE_PLUS:1,
    
    createDDPCanvas: function (wrappedElement) {
        var el = wrappedElement.___link;
        el.innerHTML = "";
        el.appendChild(document.createElement("DIV"));
    },
    
    createDDPBuffer: function (w, h, rw, rh) {
        var el = this.el.firstChild;
        el.appendChild(document.createElement("TABLE"));
        var tbl = el.firstChild;
        tbl.style.borderCollapse="collapse";
        tbl.style.border="0px";
        tbl.style.width=w;
        tbl.style.height=h;
        var tr,td;
        for(var i=0;i<rh;i++) {
            tr = document.createElement("TR");
            for(var j=0;j<rw;j++) {  
                td = document.createElement("TD");
                td.style.backgroundColor = "#000000";
                tr.appendChild(td);
            }
            tbl.appendChild(tr);
        }
    },
    
    cloneCanvas: function () {
        
    },
    
    pixel: function (x,y, color) { // TODO: choose buffer number!
        this.el.firstChild.firstChild.childNodes[y].childNodes[x].style.backgroundColor = color;
    }, 
    
    set: function (wrappedElement, x,y) {

    },
    
    move: function (wrappedElement, x,y, color) {
        
    },
    
    draw: function (imgdata, w, x, y) {
        // draw imgdata at pos using MODE
        var color, xpos, ypos;
        for(var i=0; i<imgdata.length; i++) {
            ypos = parseInt(i/w);
            xpos = i % w;
            this.pixel(xpos+x, ypos+y, imgdata[i]);
            console.log(xpos+":"+ypos+" "+imgdata[i]);
        }
        
    }
}


Jnaric.prototype.bind_ddp () {
    this.global.DDP = DDP();
    inject_proto(this.global.DDP, DDP);
}
