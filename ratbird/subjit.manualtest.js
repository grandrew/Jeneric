// experiment with subjit code (hand-written to understand the problem)

function loop_A_dom () {
  var v = "a"
  while(v.length < get_some_val()) {
    if (v == "A")
      v = "a";
    else
      v = "A";
    document.body.appendChild(document.createTextNode(v));
  }
}


// the subjit-rewritten version
___var("v", LOCAL).v="a";
___while(
    function w1 () {
        return ___var("v").v.length < ___call("get_some_val", []);
    }, 
    function w2 () {
        
    }
);






function fibonacci_native(n)
{
    return n <= 1 ? n : fibonacci_native(n - 1) + fibonacci_native(n - 2);
}
