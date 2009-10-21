// setInterval and sleep test
var gTestfile = "setinterval.js";
var BUGNUMBER = "(none)";
var summary = "";



function seta () {
    a=a+1;
    print("setting a");
}

a=0;
x = setInterval(seta, 1000);
sleep(7300);
clearInterval(x);
ect = 7;
act = a;
sum = "setInterval works"
reportCompare(ect, act, sum);

// ------------------------------

sleep(2000);

sum = "clearInterval works: " + x;
reportCompare(ect, act, sum);


