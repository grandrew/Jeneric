/* jeneric canvas wrapper */

(function () {

function __CanvasRenderingContext2D(surfaceElement) {
    this.canvas = surfaceElement; // SPEC violation: should be readonly
    this.___link = surfaceElement.___link.getContext("2d");
}

__CanvasRenderingContext2D.prototype.___setters = {
    // compositing
    globalAlpha: __htmldom_set_direct, // (default 1.0)
    globalCompositeOperation: __htmldom_set_direct, // (default source-over)

    // colors and styles
    strokeStyle: __htmldom_set_direct, // (default black)
    fillStyle: __htmldom_set_direct, // (default black)
    // line caps/joins
    lineWidth: __htmldom_set_direct, // (default 1)
    lineCap: __htmldom_set_direct, // "butt", "round", "square" (default "butt")
    lineJoin: __htmldom_set_direct, // "round", "bevel", "miter" (default "miter")
    miterLimit: __htmldom_set_direct, // (default 10)

    // shadows
    shadowOffsetX: __htmldom_set_direct, // (default 0)
    shadowOffsetY: __htmldom_set_direct, // (default 0)
    shadowBlur: __htmldom_set_direct, // (default 0)
    shadowColor: __htmldom_set_direct, // (default transparent black)
    font: __htmldom_set_direct, // (default 10px sans-serif)
    textAlign: __htmldom_set_direct, // "start", "end", "left", "right", "center" (default: "start")
    textBaseline: __htmldom_set_direct // "top", "hanging", "middle", "alphabetic", "ideographic", "bottom" (default: "alphabetic")
};

__CanvasRenderingContext2D.prototype.___getters = {
    // compositing
    globalAlpha: __htmldom_get_direct, // (default 1.0)
    globalCompositeOperation: __htmldom_get_direct, // (default source-over)

    // colors and styles
    strokeStyle: __htmldom_get_direct, // (default black)
    fillStyle: __htmldom_get_direct, // (default black)
    // line caps/joins
    lineWidth: __htmldom_get_direct, // (default 1)
    lineCap: __htmldom_get_direct, // "butt", "round", "square" (default "butt")
    lineJoin: __htmldom_get_direct, // "round", "bevel", "miter" (default "miter")
    miterLimit: __htmldom_get_direct, // (default 10)

    // shadows
    shadowOffsetX: __htmldom_get_direct, // (default 0)
    shadowOffsetY: __htmldom_get_direct, // (default 0)
    shadowBlur: __htmldom_get_direct, // (default 0)
    shadowColor: __htmldom_get_direct, // (default transparent black)
    font: __htmldom_get_direct, // (default 10px sans-serif)
    textAlign: __htmldom_get_direct, // "start", "end", "left", "right", "center" (default: "start")
    textBaseline: __htmldom_get_direct // "top", "hanging", "middle", "alphabetic", "ideographic", "bottom" (default: "alphabetic")
};

  // state
__CanvasRenderingContext2D.prototype.save = function _ctx_save() { this.___link.save(); }; // push state on state stack
  __CanvasRenderingContext2D.prototype.restore = function __ctx_restore() { this.___link.restore(); }; // pop state stack and restore state

  // transformations (default transform is the identity matrix)
  __CanvasRenderingContext2D.prototype.scale = function __ctx_scale(x,y) { this.___link.scale(x,y); };
  __CanvasRenderingContext2D.prototype.rotate = function __ctx_rotate(angle) {this.___link.rotate(angle);};
__CanvasRenderingContext2D.prototype.translate = function __ctx_translate(x, y) { this.___link.translate(x,y); };
__CanvasRenderingContext2D.prototype.transform = function __ctx_transform (a, b, c, d, e, f) { this.___link.transform(a,b,c,d,e,f); };
__CanvasRenderingContext2D.prototype.setTransform = function __ctx_setTransform(/*in double*/ a, /*in double*/ b, /*in double*/ c, /*in double*/ d, /*in double*/ e, /*in double*/ f) { this.___link.setTransform(a,b,c,d,e,f); };
  
  //CanvasGradient
  __CanvasRenderingContext2D.prototype.createLinearGradient = function __ctx_createLinearGradient(/*in double*/ x0, /*in double*/ y0, /*in double*/ x1, /*in double*/ y1) { return this.___link.createLinearGradient(x0,y0,x1,y1);};
  __CanvasRenderingContext2D.prototype.createRadialGradient = function __ctx_createRadialGradient(/*in double*/ x0, /*in double*/ y0, /*in double*/ r0, /*in double*/ x1, /*in double*/ y1, /*in double*/ r1) { return this.___link.createRadialGradient(x0,y0,r0,x1,y1,r1); } ;
  
  //CanvasPattern, not supported in IE8/ex
  __CanvasRenderingContext2D.prototype.createPattern = function __ctx_createPattern(/*in HTMLImageElement,HTMLCanvasElement,HTMLVideoElement*/ image, /*in DOMString*/ repetition) {
    return this.___link.createPattern(image.___link, repetition);
  };
  
  // rects
  __CanvasRenderingContext2D.prototype.clearRect = function __ctx_clearRect(/*in double*/ x, /*in double*/ y, /*in double*/ w, /*in double*/ h) { this.___link.clearRect(x,y,w,h); };
  __CanvasRenderingContext2D.prototype.fillRect = function __ctx_fillRect(/*in double*/ x, /*in double*/ y, /*in double*/ w, /*in double*/ h) { this.___link.fillRect(x,y,w,h); };
  __CanvasRenderingContext2D.prototype.strokeRect = function __ctx_strokeRect(/*in double*/ x, /*in double*/ y, /*in double*/ w, /*in double*/ h) { this.___link.strokeRect(x,y,w,h); };

  // path API, void
  __CanvasRenderingContext2D.prototype.beginPath = function __ctx_beginPath() { this.___link.beginPath(); };
  __CanvasRenderingContext2D.prototype. closePath= function __ctx_closePath() { this.___link.closePath(); };
  __CanvasRenderingContext2D.prototype. moveTo= function __ctx_moveTo(/*in double*/ x, /*in double*/ y) { this.___link.moveTo(x,y); };
  __CanvasRenderingContext2D.prototype. lineTo= function __ctx_lineTo(/*in double*/ x, /*in double*/ y) { this.___link.lineTo(x,y); };
  __CanvasRenderingContext2D.prototype. quadraticCurveTo= function __ctx_quadraticCurveTo(/*in double*/ cpx, /*in double*/ cpy, /*in double*/ x, /*in double*/ y) { this.___link.quadraticCurveTo(cpx,cpy,x,y); };
  __CanvasRenderingContext2D.prototype. bezierCurveTo= function __ctx_bezierCurveTo(/*in double*/ cp1x, /*in double*/ cp1y, /*in double*/ cp2x, /*in double*/ cp2y, /*in double*/ x, /*in double*/ y) { this.___link.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x,y); };
  __CanvasRenderingContext2D.prototype. arcTo= function __ctx_arcTo(/*in double*/ x1, /*in double*/ y1, /*in double*/ x2, /*in double*/ y2, /*in double*/ radius) { this.___link.arcTo(x1,y1,x2,y2,radius); };
  __CanvasRenderingContext2D.prototype. rect= function __ctx_rect(/*in double*/ x, /*in double*/ y, /*in double*/ w, /*in double*/ h) { this.___link.rect(x,y,w,h); };
  __CanvasRenderingContext2D.prototype. arc= function __ctx_arc(/*in double*/ x, /*in double*/ y, /*in double*/ radius, /*in double*/ startAngle, /*in double*/ endAngle, /*in boolean*/ anticlockwise) { this.___link.arc(x,y,radius,startAngle,endAngle,anticlockwise); };
  __CanvasRenderingContext2D.prototype. fill= function __ctx_fill() { this.___link.fill(); };
  __CanvasRenderingContext2D.prototype. stroke= function __ctx_stroke() { this.___link.stroke(); };
  __CanvasRenderingContext2D.prototype. clip= function __ctx_clip() { this.___link.clip(); };
  //boolean // not supported in IE8/ex
  __CanvasRenderingContext2D.prototype. isPointInPath= function __ctx_isPointInPath(/*in double*/ x, /*in double*/ y) { return this.___link.isPointInPath(x,y); };

  // focus management, ret boolean
  __CanvasRenderingContext2D.prototype. drawFocusRing= function __ctx_drawFocusRing(/*in Element*/ element, /*in double*/ xCaret, /*in double*/ yCaret, /*in optional boolean*/ canDrawCustom) { return this.___link.drawFocusRing(element.___link, xCaret,yCaret,canDrawCustom); };
  
  // void
  __CanvasRenderingContext2D.prototype. fillText= function __ctx_fillText(/*in DOMString*/ text, /*in double*/ x, /*in double*/ y, /*in optional double*/ maxWidth) { this.___link.fillText(text,x,y,maxWidth); };
  __CanvasRenderingContext2D.prototype. strokeText= function __ctx_strokeText(/*in DOMString*/ text, /*in double*/ x, /*in double*/ y, /*in optional double*/ maxWidth) { this.___link.strokeText(text,x,y,maxWidth); };
  
  // TextMeasures: norm
  __CanvasRenderingContext2D.prototype. measureText= function __ctx_measureText(/*in DOMString*/ text) { return this.___link.measureText(text); };

  // drawing images, void
  __CanvasRenderingContext2D.prototype. drawImage= function __ctx_drawImage(/*in HTMLImageElement,HTMLCanvasElement,HTMLVideoElement*/ image, /*in double*/ dx, /*in double*/ dy, /*in optional double*/ dw, /*in ?optional? double*/ dh,a,b,c,d) { this.___link.drawImage(image.___link, dx, dy, dw, dh,a,b,c,d); };
  //__CanvasRenderingContext2D.prototype. drawImage(in HTMLImageElement image, /*in double*/ sx, /*in double*/ sy, /*in double*/ sw, /*in double*/ sh, /*in double*/ dx, /*in double*/ dy, /*in double*/ dw, /*in double*/ dh) { this.___link.(); };
  //__CanvasRenderingContext2D.prototype. drawImage(in HTMLCanvasElement image, /*in double*/ dx, /*in double*/ dy, in optional double dw, /*in double*/ dh);
  //__CanvasRenderingContext2D.prototype. drawImage(in HTMLCanvasElement image, /*in double*/ sx, /*in double*/ sy, /*in double*/ sw, /*in double*/ sh, /*in double*/ dx, /*in double*/ dy, /*in double*/ dw, /*in double*/ dh) { this.___link.(); };
  //__CanvasRenderingContext2D.prototype. drawImage(in HTMLVideoElement image, /*in double*/ dx, /*in double*/ dy, in optional double dw, /*in double*/ dh);
  //__CanvasRenderingContext2D.prototype. drawImage(in HTMLVideoElement image, /*in double*/ sx, /*in double*/ sy, /*in double*/ sw, /*in double*/ sh, /*in double*/ dx, /*in double*/ dy, /*in double*/ dw, /*in double*/ dh) { this.___link.(); };

  // pixel manipulation, ret ImageData
  __CanvasRenderingContext2D.prototype. createImageData= function __ctx_createImageData(/*in double*/ sw, /*in double*/ sh) { 
    if(typeof sh !== "undefined") {
        return this.___link.createImageData(sw, sh);
    } 
    return this.___link.createImageData(sw);
  };
  // __CanvasRenderingContext2D.prototype. createImageData(in ImageData imagedata);
  __CanvasRenderingContext2D.prototype. getImageData= function __ctx_getImageData(/*in double*/ sx, /*in double*/ sy, /*in double*/ sw, /*in double*/ sh) { return this.___link.getImageData(sx, sy, sw, sh); };
  
  // void
  __CanvasRenderingContext2D.prototype. putImageData= function __ctx_putImageData(/*in ImageData*/ imagedata, /*in double*/ dx, /*in double*/ dy, /*in optional double*/ dirtyX, /*in double*/ dirtyY, /*in double*/ dirtyWidth, /*in double*/ dirtyHeight) { 
    this.___link.putImageData(imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight); 
  };
  
function __getContext() {
    return new __CanvasRenderingContext2D(this);
}

jsdom_applyCanvas = function (obj) {
    // we need excanvas here!
    if(!obj.___link.getContext) G_vmlCanvasManager.initElement(obj.___link);
    obj.getContext = __getContext;
}


})();
