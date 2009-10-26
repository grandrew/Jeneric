// settimeout and sleep test
var gTestfile = "settimeout.js";
var BUGNUMBER = "(none)";
var summary = "";
tl = (new Date()).getTime();


function seta () {
    a=1;
    print("setting a! time lapsed: "+((new Date()).getTime() - tl));
}

a=0;
setTimeout(seta, 5000);
sleep(7000);

ect = 1;
act = a;
sum = "setTimeout works"
reportCompare(ect, act, sum);

// ------------------------------


a=0;
x=setTimeout(seta, 5000);
sleep(3000);

ect = 0;
act = a;
sum = "setTimeout works"
reportCompare(ect, act, sum);
clearTimeout(x);
// ------------------------------
sleep(3000);
ect = 0;
act = a;
sum = "clearTimeout works: " + x;
reportCompare(ect, act, sum);


