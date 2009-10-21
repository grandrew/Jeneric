// the load method of jnaric
var gTestfile = "load.js";
var BUGNUMBER = "(none)";
var summary = "";

// first, try to load test js file

a = 0
ect = 1
load("test.js");
act = a
sum = "Test1"
reportCompare(ect, act, sum);


// second, try to catch exception

e = 0
sum = "no exception";

try {
    load("fake.js");
} catch (ex) {
    sum = ex;
    e = 1;
}

ect = 1;
act = e;
reportCompare(ect, act, sum);
print(sum);


