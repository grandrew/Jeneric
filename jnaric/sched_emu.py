# emulating the gap stabilization

threads = [{"T":10, "c":0}]; # threads are only by set_timeout!
add_threads = 5;
insert_at = [1, 5, 120, 125, 126, 127, 178, 187, 411]
#insert_at = [1, 5, 120, 125, 178, 411]
#insert_at = [1, 5, 120]
add_intervals = 10 # each 10 cycles a thread is added
BURST_TIME = 1
GAP_MIN = 4
GAP_MAX = 5

def main():
  added = 0
  last_step_time = 0
  for cur_time in range(3000): # 1000 cycles
    if added < add_threads:
      if cur_time in insert_at:
        threads.append({"T":10, "c":0})

    for t in threads:
      print t["T"],
    


    for t in threads:
      if t["c"] <= 0:
        # the logic...
        tc = 0
        gap = cur_time - last_step_time
        print "gap:", gap,
        if gap < GAP_MIN:
          t["T"] = t["T"] + int((GAP_MIN - gap) )
        if gap > GAP_MAX:
          t["T"] = t["T"] + int((GAP_MAX - gap) )
        
        if t["T"] < int(float((BURST_TIME + (BURST_TIME + GAP_MIN) * (len(threads) - 1) ))*1): # to add stability
          tc = t["T"]
          t["T"] = (BURST_TIME + (BURST_TIME + GAP_MIN) * (len(threads) - 1) );
          
        if t["T"] > int(float(BURST_TIME + (BURST_TIME + GAP_MAX) * (len(threads) - 1) )*1): # to add stability
          tc = t["T"]
          t["T"] = (BURST_TIME + (BURST_TIME + GAP_MAX) * (len(threads) - 1) );

        last_step_time = cur_time
        if tc != 0:
          t["c"] = tc
        else: 
          t["c"] = t["T"]
      else:
        t["c"] = t["c"] - BURST_TIME;
    
    print ""
main()
