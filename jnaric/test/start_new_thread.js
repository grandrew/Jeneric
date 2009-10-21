// start_new_thread and sleep test
var gTestfile = "start_new_thread.js";
var BUGNUMBER = "(none)";
var summary = "";

function seta_dummy () {
    a=1;
    print("setting a");
}

function seta (val) {
    a=val;
    print("setting a");
}

a=0;
start_new_thread(seta_dummy);
sleep(1000);

ect = 1;
act = a;
sum = "start_new_thread works 0"
reportCompare(ect, act, sum);

// ------------------------------


a=0;
start_new_thread(seta, [1]);
sleep(1000);

ect = 1;
act = a;
sum = "start_new_thread works 1"
reportCompare(ect, act, sum);

// ------------------------------

function setb (val) {
    for(var i=0; i<10; i++) {
        a=a+val;
        print(i+" time lapsed: "+((new Date()).getTime() - tl));
        sleep(1000);
    }
}

a=0;
tl = (new Date()).getTime();
start_new_thread(setb, [1]);
sleep(3500);

ect = 4;
act = a;
sum = "start_new_thread 2 works"
reportCompare(ect, act, sum);

