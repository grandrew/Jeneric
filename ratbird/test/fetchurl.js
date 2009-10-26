// the fetchUrl method of jnaric
var gTestfile = "fetchurl.js";
var BUGNUMBER = "(none)";
var summary = "";


sum =" try to load test js file in blocking mode (using default POST)";

a = 0
ect = "a=1\n\
\n\
function b () { b=1 }\n\
\n\
\n\
";
a=fetchUrl("test.js", {});
act = a

reportCompare(ect, act, sum);



sum =" try to load test js file in non-blocking mode";

a = 0

function cb (data) { 
    a = data;
    print("got data of length: "+data.length);
}

fetchUrl("test.js", {}, cb);
sleep(2000);
act = a

reportCompare(ect, act, sum);



sum =" try to load test js file in blocking mode using explicitly set GET";

a = 0
a=fetchUrl("test.js", {}, null, _FETCH_GET);
act = a

reportCompare(ect, act, sum);




sum =" try to load test js file in blocking mode and catch exception";

e = 0
sum = "no exception";

try {
    a=fetchUrl("fake.js", {});
} catch (ex) {
    sum = ex;
    e = 1;
}

ect = 1;
act = e;
reportCompare(ect, act, sum);


sum =" try to load test js file in non-blocking mode and get an exception";

e = 0

function cbe (a, er) { 
    if(a==null) e=er;
}


a=fetchUrl("fake.js", {}, cbe);
sleep(1500);
ect = 404;
act = e;
reportCompare(ect, act, sum);


