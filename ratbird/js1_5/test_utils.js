// jnaric testing suite

/*
  TEST GUIDE
  
  - create a VM
  - preload helper methods (this file)
  - load+run test source (evaluate via load)
    // - in source: check VM.global.TEST_OK: output to log: test name, OK/FAIL;
  - destroy VM
  repeat for next source...
  
*/

UBound = 0;
statusitems = {};
actualvalues = {};
expectedvalues = {};

function expectExitCode(e) {
    ErrorConsole.log("Expect esit code: "+e);
}

function printBugNumber(bn) {
    ErrorConsole.log("Bug number: "+bn);
}

function printStatus(s) {
    ErrorConsole.log("Status: "+s);
}

function print(s) {
    ErrorConsole.log("print(): "+s);
}

function options(s) { // method to set some mozilla shell options
    return "";
}

function reportCompare(expc, actl, summ) {
    if(expc == actl) ErrorConsole.log("TEST OK:     "+expc+" == "+actl);
    else {
        ErrorConsole.log(gTestfile + ": TEST FAIL - expected: " + expc + " got: " + actl + " summ: "+summ);
    }
}

function enterFunc( s ) {

}

function exitFunc(s) {
} 


function addThis()
{
  statusitems[UBound] = status;
  actualvalues[UBound] = actual;
  expectedvalues[UBound] = expect;
  UBound++;
}


function test()
{
  enterFunc('test');
  printBugNumber(BUGNUMBER);
  printStatus(summary);

  for (var i=0; i<UBound; i++)
  {
    reportCompare(expectedvalues[i], actualvalues[i], statusitems[i]);
  }

  exitFunc ('test');
}

function capture(val)
{
  actualvalues[UBound] = val;
  statusitems[UBound] = getStatus(UBound);
  UBound++;
}


function getStatus(i)
{
  return statprefix + i + statsuffix;
}

function inSection (u) {
    ErrorConsole.log("In section "+u);
}


function sortThis(str)
{
  var chars = str.split('');
  chars = chars.sort();
  return chars.join('');
}
