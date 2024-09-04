---
title: Rippling LLD Preparation
---

## What is Rippling

- typically, companies have different systems - a payroll system, an insurance and benefits system, a device management system, an identity system
- this leads to countless administrative problems and rippling unifies all of them
- so a unified data model called rippling's "employee graph" is created by combining data from the different applications
- rippling's "middleware" sits above the employee graph. it is a powerful set of core capabilities - workflow automation, analytics, permissions, etc. this helps engineers skip building these primitive parts repeatedly for all products of rippling
- rippling ai - if we for e.g. ask - why did our overtime costs go up high last quarter? it can analyze and answer - because of the year end spike in customer support and sales. it also displayed the employees who incurred the highest cost for the same
- a good balance of engineering and product - engineers spend time understanding business processes, decision making, workflows, abstractions, etc

## Delivery Driver Payroll Tracker

### Question

- implement an in memory payment tracker for delivery drivers who are paid by the hour for the time they spend on deliveries
- add_driver(driver_id, usd_hourly_rate) - register a driver with an hourly rate
- record_delivery(driver_id, start_time, end_time) - log a completed delivery
- get_total_cost() - return the total labor cost across all drivers and deliveries regardless of what has been paid
- pay_up_to(pay_time) - settle the wages for all work performed up to pay_time. calling it again with the same or earlier time must not pay anything twice
- get_total_cost_unpaid() - return the total wages that remain unsettled after the payouts so far

### Clarifying Requirements

- what about late deliveries - record_delivery is called after pay_up_to is called, but pay_up_to's pay_time > record_delivery's end_time? should the next pay_up_to call settle it?
- how muh precision do we need here, in fractional cents?
  - basically only two decimal places would make sense, not beyond that - we can settle 2.44$, not 2.442$, because we cannot settle fractions of cents
  - however, what if these fractions accumulate and turn into a cent? e.g. 0.2 cents 5 times becomes a cent, which should ideally be settled

### Solution

- driver(id, usd_hourly_rate)
- delivery(driver_id, start_time, end_time, status, cost)
- delivery status - settled, unsettled
- use big decimal for cost, usd_hourly_rate, etc calculations
- driver controller - store a map of (driver_id, driver)
- it also has add_driver method - add validations like if id is null, if id is already present in the map, etc
- delivery controller - has the record_delivery method - add validations like if driver id is not present, if start time is greater than end time, etc
- inside this, we can store deliveries as follows -
  - unsettled deliveries - min heap, using end time
  - settled deliveries - list
- so, when pay_up_to is called, we keep polling from the min heap till the peek's delivery's end time <= pay_up_to
- cost controller - support the get_total_cost / get_total_cost_unpaid
- it maintains the unpaid and paid costs on the fly. delivery controller calls it when a delivery is recorded (add to unpaid cost) or settled (remove from unpaid cost, add to paid cost)
- calculation of final amount for a delivery - strategy design pattern - hourly cost calculation service

### Follow Up Questions

- a driver's hourly rate can change. how do you price deliveries that cross the change?
  - solution 1 - delivery can get an additional attribute for the hourly rate of the driver at the point of time when the delivery was recorded. we use this rate instead of using the driver's latest hourly rate
  - solution 2 - drivers can hold a list of (updated_at, rate). this way, the right rate can be applied accordingly based on the start time and the end time - x for start time to t1, y for t1 to t2, z for t2 to end time
  - instead of list, a "tree map" is the right solution here - key is effective_from, value the hourly_rate. rest are calling some internal functions like floor etc on the tree map
  - since we are using strategy design pattern, these implementations should be easily swappable
  - also call out how the changes we make would not go back in time to the deliveries whose costs were already calculated and saved. they would only affect the incoming deliveries that get logged
- how would you report unpaid wages per driver? how would you turn each payout into per driver amounts in whole cents without losing fractions of a cent?
  - 2 additional attributes unpaid_costs and paid_costs can be added to the driver
  - when settling - say the amount is 1.234, we can settle 1.23 and keep 0.004 as the unpaid balance
  - when settling, it might happen that a driver does two deliveries of 1.236 each
  - we need to pay him 2.47 (and not 2.46) in this case, and the balance of 0.002 should remain
  - so, paying out to the driver should be done "at the end" and not as we are iterating through the unsettled deliveries
- millions of deliveries are recorded between payouts. what does each operation cost, and what would you change?
  - adding costs o(n log n) due to the overhead of adding to heaps
  - solution 1 - maybe we can shard the priority queue, say based on driver id
  - solution 2 - we do not need to store the deliveries separately since no one will ever query them. so, remove the unsettled deliveries heap and settled deliveries list
  - instead, use a tree map of instant -> delivery_cost. this way, when we get a new delivery, we just need to add its cost to this map
  - e.g. if two deliveries completed at the same time, we only need to store their sums for that instant in the map
  - a single day only has 86400 seconds, so this solution can easily scale, as the map will only have so many entries
- max active drivers in the last 24h -
  - example - 
    ```
    D1: 0–30
    D1: 10–40
    D2: 20–50
    D3: 50–70
    ```
  - so, first turn them into events (start time of delivery +1, end time of delivery as -1) and then we sort them by time - 
    ```
    0  D1 +1
    10 D1 +1
    20 D2 +1
    30 D1 −1
    40 D1 −1
    50 D2 −1
    50 D3 +1
    70 D3 −1
    ```
  - maybe we can ask a clarifying question here - if one delivery has times (x,y) and another has (y,z), do we consider drivers at y as 2 or 0
  - we walk through the events and count drivers
  - one issue - a driver might be doing multiple deliveries at a single time
  - solution - we keep track of the count of deliveries done by the drivers. the active drivers count is only changes when the count of deliveries of this driver goes from 0 to 1 or 1 to 0
  - only count the last 24 hours
  - e.g. if now is 1500, window becomes 60-1500
  - if a delivery has end time before 60, ignore
  - if a delivery has start time after 1500, ignore
  - else, the event we talked about above becomes max(delivery_start, window_from) to min(delivery_end, window_end)
  ```
  get_max_active_drivers_in_last_24_hours(now):
    from = now - 24h

    events = []
    for each delivery d:
        s = max(d.start, from)
        e = min(d.end, now)
        if s >= e: skip
        add (s, +1, d.driver) to events
        add (e, -1, d.driver) to events

    sort events by (time, delta)

    active = map driver -> number of their deliveries running now
    drivers = 0
    max = 0
    for each (time, delta, driver) in events:
        before = active[driver] (0 if missing)
        after  = before + delta
        active[driver] = after
        if before == 0 and after == 1: drivers += 1   # driver became busy
        if before == 1 and after == 0: drivers -= 1   # driver became free
        max = max(max, drivers)

    return max
  ```

## Rank Poker Hand

### Question

- hands of five cards
- card ranks lowest to highest - 2 3 4 5 6 7 8 9 T J Q K A
- ranking hand types, strongest first - 
  - five of a kind - 77777
  - four of a kind - Q9QQQ
  - full house - three cards of one rank and two of another - 55999
  - three cards of one rank, remaining two of different ranks - JJJ28
  - two pairs - two cards of one rank, two of another and one of a different rank - 44KKA
  - one pair, remaining all three different - 639AA
  - high card - all five ranks are different
- two hands of the same type are compared card by card in the order written - the first position where they differ decides, and the higher rank wins. e.g. 2AAAA loses to 33332 because both are four of a kind, and their first cards are 2 and 3 respectively
- the game does not for e.g. consist of straights (e.g. 23456) or flushes (same suite, as there is no concept of suite)
- note - the interviewer may not be as descriptive as this - ranking of hands, ranking of cards, etc are assumptions that we have to make beforehand and clarify with the interviewer
- a rank may appear any number of times in a hand - again we need to clarify if it is a real deck with 4 cards of each rank or unlimited
- compare(hand1: str, hand2: str) -> int
  - returns 1 if the first player's hand wins
  - -1 if the second player's hand wins
  - 0 if they tie
- some cards at the end of a hand are unknown and written as ?
- write best_and_worst(partial: str) that returns the strongest and the weakest complete hand the partial hand could turn into, with the type of each. e.g. 2345? can become 23455 (one pair) as strongest, or 23456 (high card) as its weakest

### Solution

- hand(card[], type)
- type - five, four, three_two, three_one_one, two_two_one, two_one_one_one, one_one_one_one_one
- type is an enum with following attributes - 
  - priority - one_one_.. is 1, two_one_... is 2 and so on
  - counts - one_one_.. is (1,1,1,1,1), two_one_... is (2,1,1,1) and so on. i felt this technique could help quickly map the character string to the right type
- hand has a constructor that receives a string and constructs the card list / initializes the hand type from it
- card(value)
- value is an enum with following attributes -
  - character - the character representation - 2,3,4,...T,J,Q,K,A
  - rank - 2 is 2, 3 is 3, ... A is 14 - this helps compare cards quickly
- card has a constructor that receives a character and constructs a card instance from it
- override compare to of hand - first compare the priority of hand type. if same, then run the tie breaker logic - serially iterate through all the cards of the two hands and return once the values do not match
- similarly, override compare to of card as well
- for best_and_worst, we can generate all the permutations using backtracking
  - iterate from the first to the last character
  - if the character is a valid card, skip
  - if it is a question mark - try placing all the cards on its place one by one
  - base step of recursion computes and returns the hand object
  - using recursion we keep comparing hands and keep track of the maximum hand
- so, i used strategy design pattern using completion service. it has two implementations best and worst completion service 
- time complexity - O(13^k)
- however, there is a more optimal way of achieving this apparently
- for best - fill using the card with the highest occurrence. in case of a tie, fill using the card with the higher rank
- for worst - we have 13 cards. we can always ensure all the remaining question marks are constructed using cards that have not occurred till now. for each question mark, try filling from 2 to A (an earlier question mark of a worse rank ensures that the hand is the worst possible in case of ties)
- complexity - O(13*k)
- ensure you generate a lot of tests

### Follow Up Questions

- given an opponent's complete hand, decide whether the partial hand is certain to win, certain to lose, or could go either way
  - call the best_and_worst function using one's own hand
  - compare(best, opponent) < 0 - certain to lose
  - compare(worst, opponent) > 0 - certain to win
  - if best, worst and opponent are all same - it is a tie
  - else, can go any way
- if the deck is real with four cards of each rank, how do the best and worst completions change
  - we are using strategy design pattern, so the logic should stay the same
  - if using the recursive solution, we can add a running frequency lookup argument to the recursive function
  - similarly use the frequency lookup for the optimal solution as well
- how would you rank a list of many thousands of hands from weakest to strongest and what does it cost
  - solution 1 - we can use sorting. O(n * log(n)). we anyway have a compare function already
  - solution 2 - total solutions possible - we have 7 ranks, and total 13^5 solutions. so, maybe we can map each permutation to a number somehow and then use that number / rank to compare each number

## Task Scheduler

### Question

- implement a task scheduler which decides the order in which a set of tasks is output
- tasks can depend on other tasks, and a task may be output only after all of its dependencies have been output
- tasks can have attributes such as importance or priority that affect the order
- filter requirements can remove some tasks from the output
- assume each task has an id, a list of dependency ids, a priority, and other attributes that filters can test
- some sorting logic might be specified - e.g. 
  - sort tasks using task id, priority, etc
  - a task with no parents is at the top level
  - output is depth first - print each task's subtasks directly below it, instead of in the global order

### Clarifying Requirements

- how are tasks with equal priorities ordered, by id?
- is the output a flat list or stages of tasks that could run in parallel?
- how to handle [filtering](#handling-filtering)?
- how to handle [priority](#handling-priorities)?

### Solution

- one way to structure code - 
  - we use strategy design pattern for a generic filter class - `task[] filter(task[])`
  - then, we can use chain of responsibility pattern to run a series of filters
  - first filter filters out tasks, next filter assigns the right priority, next filter sorts the tasks and so on
- use kahn's algorithm
- maintain an indegree array - if a task a contains dependency b, increment the indegree of a by 1
- create a lookup where lookup(x) contains all tasks waiting on task x to be complete
- push all tasks with zero indegree to a sorted set (for priorities)
- why sorted set / priority queue (my understanding) - this helps deque tasks with lower ids first, otherwise tasks are dequeued in a first in first out order
- iterate through the lookup of the tasks with indegree 0 and decrement their indegrees
- if their indegree becomes zero, they become eligible for the next turn
- keep repeating the process
- tasks which never reached indegree 0 have some kind of cycle
- time complexity - O(v + e) for kahn, extra O(v log v) for the heap / sorted set
- extensibility - if someone wants a different ordering logic instead of priority, they can do so. so, the task scheduler service can maybe composed using a strategy class for the task comparator

### Validations

- remember rippling has this as an important rubric. so, have a separate discussion around this
- duplicate ids
- unknown ids for dependents
- duplicate entries in dependents
- detect cycles first, and throw an exception if there are any cycles

### Handling Priorities

- interviewer might ask to implement two variants. use strategy design pattern here - 
  - option 1 - when a high priority task is dependent on a low priority task, it simply waits
  - option 2 - a task's effective priority is the max of its own priority and every thing depending on it transitively
- option 1 is already what we have discussed till now. for option 2, we can perform a reverse topological order first. this will give us the effective priority. then, we can continue our usual algorithm
- how to get the effective priority - 
  - first we obtain the reverse topological sort
  - then we process nodes in this order
  - for each node, effective priority = max(its original priority, max(effective priority of dependent subtasks))
- my understanding - so option 2 is basically an additional step we perform before we run the original kahn's algorithm. so, it can be mentioned using say a boolean flag
- thought - so we can maybe use decorator pattern here as well, a decorator to first fix the priorities of the upstream tasks

### Handling Filtering

- "filtering" can be handled in different ways as well
- option 1 - run the whole algorithm and then run the filtering
- option 2 - remove the tasks that need to be filtered out and all the tasks depending on them as well, and then run the algorithm
- thought - we can maybe use decorator pattern here, based on whether it should be pre of post filtering. pre filtering filters the argument, post filtering filters the return type

### Handling Sorting

pseudocode for sorting tasks - 

```
sort(tasks)
graph = create map of parent_id, list_of_sub_tasks

dfs(task, graph, result) {

  result.add(task);

  for (Task child : graph.getOrDefault(task.getId(), List.of())) {
    dfs(child, graph, result);
  }
}
```

## Spreadsheet

### Question

- design a spreadsheet that can display both - a cell's raw content and its computed value
- the raw content may be a literal or a formula
- changing a cell from one kind to the other must correctly update dependencies and cached values
- preserve the user's raw expression for editing
- dependent cells must reflect changes to their inputs
- this is an object and api design exercise. choose and state a formula grammar and error policy only to illustrate the design, the report does not give a complete callable contract

### Clarifying Questions

- should the value computation be - 
  - eager - writes become slow or
  - lazy - mark cells as dirty and then recompute values
- how to handle errors? see the solution below

### Solution

- the whole cell network can be modelled as a graph
- assume cell has a formula that uses cell b
- we need an edge from cell b to cell a - assume someone edits cell b. this should trigger an update in cell a as well
- we need an edge from cell a to cell b as well - assume someone changes the formula of cell a, so it no longer references cell b. this should remove the edge from cell b to cell a, so that changes to b do not anymore trigger updates to cell a. this helps keep the graph optimal i guess. this can be a different kind of a back edge maybe
- what if cells b and c depend on cell a while cell d depends on both b an c. we need to ensure that cell a is processed first, then cell b and c and finally cell d. this is only possible when we process the cells in topologically sorted order
- cell(row - int, column - int, raw - string, computed - object, error - Error)
- computed can be of any type, so i used an object here
- an api called controller is exposed that receives the edits, say the cell coordinates and the expression etc. based on this, the remaining calculations are done
- we need to have validations / reject invalid updates
  - if the resulting formula change makes the graph cyclic. so, perform a topological sort to ensure there are no cycles
  - reject invalid cell coordinates
  - reject invalid expressions
- all above were validations that can be detected immediately. some might be detected at runtime as well - e.g. making a cell as 2 makes another cell as 0 and makes a third cell as 10 / 0, thus resulting in a division by 0. should this error be returned before edit, or set on the cell itself? 
- one option can be that an additional "error" attribute is added to the cells. we can use this logic for both for the validations we performed first, and the computations we did
- another option could have been to throw an error and rollback values to their original state, i am not exploring that option right now
- we can use "memoization" for calculating the value of a cell as well, so it does not end up running the evaluation multiple times

### AST

- abstract syntax tree - imagine a cell has a formula - a1 + b2 * 3
- how do we calculate this expression effectively?
- by converting it into an ast -
  ```
      (+)
     /   \
  ref(a1)  (*)
          /   \
     ref(b2)  num(3)
  ```
- the nodes can be - 
  - literals - e.g. num(5) - return the cell's actual value
  - ref(a1) - referencing another cell. evaluate the cell and then return its value
  - binary operators - first evaluate the left and right children. then, apply the binary operation, e.g. +
- the node can be an abstract class, it has different types like literal etc, and then it can have a list of children on which these operations are applied
- now, this whole ast becomes an attribute of the cell or it is needed to help with the computation of the value of a cell
- my understanding of the advantage of using an ast - assume the literal value of a cell changes. now, we do not have to "reparse" strings of cells which were using the literal value of this cell

### Coding Tips

- this is just for a start
- abstract class cell(id, data_type, raw, getValue())
  - data type can be string or number
  - raw can be the raw input of user
  - get_value is an abstract class that returns the value
- literal_cell extends cell
  - for get_value based on if the data type is string or number, we can run integer.parse_int etc
- formula_cell extends cell(operands, operators)
  - operands - string[], operators - char[]
  - reason - this helps avoid the repeated parsing
  - e.g. assume a1 has a dependent called b1 (i.e. b1 uses a1 in its formula)
  - now, assume a1'a value changes
  - b1 needs to be updated. however, the formula for b1 need not be parsed again
  - we can simply use the existing parsed formula / ast we discussed earlier, and then use it to calculate the updated value
- a simple basic solution for evaluating integer expressions without brackets etc - 
  ```
  private int evaluate(FormulaCell formulaCell, Map<String, Cell> cells) {
    List<String> operands = formulaCell.getOperands();
    List<Character> operators = formulaCell.getOperators();

    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < operands.size(); i++) {
      int operand = (Integer) cells.get(operands.get(i)).getValue();
      char operator = i == 0 ? '+' : operators.get(i - 1);

      switch (operator) {
        case '+' -> stack.push(operand);
        case '-' -> stack.push(-operand);
        case '*' -> stack.push(stack.pop() * operand);
        case '/' -> stack.push(stack.pop() / operand);
      }
    }

    return stack.stream().mapToInt(Integer::intValue).sum();
  }
  ```
- note - it assumes formula is a + b and breaks at a + 3 etc. idea here is to get a basic understanding of how the algorithm is supposed to work
- i maintain two sets of graphs / adjacency lists - "dependencies" and "dependents"
  - assume a1 uses b1 in its formula
  - b1 is present in a1's dependencies
  - a1 is present in b1's dependents
- so, if a cell is updated, perform these two steps - 
  - first update the operator, operands, dependencies etc of the formula cell
  - account for cases where a formula cell might be converted to literal cell etc
  - then, start updating the value of the cell which got updated, and then recursively all its dependents
- for updating, one option was updating the cell and all its dependents recursively
- another option is to obtain a topological sort and then update the values in this order

### Follow Ups

- undo - store id, old_raw, new_raw, etc
- then, run the update logic again to rebuild all the cells
- solution 2 - maybe store a snapshot of all the cells that got updated for a fast rollback
- tradeoffs - time taken vs overhead
- reading and editing simultaneously - maybe mention the use of read write locks

## Nested Boolean Conditions

### Question

- companies have expense rules like "flag any meal over $50"
- today the engine probably supports only simple rules containing one condition
- each rule checks an expense, such as {category: "meals", amount: 75, vendor: "Joe's Diner"}, and flags a violation if the rule matches
- add support for composite rules -
  - and - all must be true
  - or - at least one must be true
  - not - flips true and false
  - nesting - any of these can contain other ands, ors, and nots
- examples -
  - restaurant and meals and amount > 50 - flag expenses that are restaurant meals costing more than $50
  - (entertainment AND amount > 100) OR client_hosting - flag entertainment expenses over $100, and also anything tagged client_hosting regardless of the amount
  - amount > 100 AND NOT vendor_name = specified_supplier - flag expenses over $100 unless they come from a specific supplier
- example 2 was the nesting example basically
- rules arrive as data through an api, do not treat them as arbitrary code. you must build a safe interpreter that walks the data structure

### Clarifying Questions to Ask

- how to handle nulls - if vendor is null, vendor == "dominos" evaluates to false, and NOT(false) evaluates to true
- however, that does not exactly mean vendor was not dominos, because there was no vendor at all
- so, we might need three states - true, false and an unknown

### Solution

- write an ast - or an abstract syntax tree parser
- each operator performs the evaluate function differently - or vs greater than vs not in and so on
- nested expressions can be represented as subtrees
- we can highlight the design patterns like interpreter pattern, composite pattern explicitly
- we need to differentiate explicitly -
  - some nodes like the logical operations would have children like and, or, not, etc
  - some nodes like the comparison operations would be leaf nodes that would just compute the expression, like greater than, equal to, etc
- validations -
  - e.g. not should receive one child, and not 2 or 0. so, each node runs its own set of validations
  - max depth of tree for dos attacks
  - similarly, number of nodes in the tree
- how to represent them in the api -
  ```
  {
    "expression": {
      "op": "and",
      "children": [
        {
          "op": "and",
          "children": [
            { "op": "gt", "field": "amount", "value": "50" },
            { "op": "le", "field": "amount", "value": "99" },
          ]
        },
        {
          "op": "not",
          "children": [
            { "op": "eq", "field": "vendor", "value": "dominos" },
          ]
        }
      ]
    }
  }
  ```
- we would have to handle data types separately - numbers vs strings and so on. e.g. an operator like greater than might work differently for strings and numbers. so, add a type called number, string, etc as well to the leaf nodes above - `"type": "string"`
- my understanding - the rule creation and rule evaluation are two separate concerns
- interviewer expects that one api creates the above rule and say returns the id of the rule created, while another can run these rules against an object
  ```
  "object": {
    "field1": "value1",
    "field2": "value1",
    ...
  },
  "rule_id": "xyz"
  ```
- the return type should never just be booleans - an extra trace object should contain the exact node that failed etc as well. maybe we can return a similar tree structure as the ast called "trace", that contains a pass and a fail for each node, and if it failed then why

## Logger

### Part 1

- a logger sends each message to a list of handlers
- new handlers must be addable without changing logger
- examples of handlers - 
  - remove every occurrence of a configured text, then print
  - keep the first n characters, then print
  - uppercase - uppercase the message, then print
  - store - save the message in memory, without printing
- clarifying question to ask - does each handler get the original message, or do they chain? if they chain, we can use chain of responsibility pattern. else, we can use observer pattern. both variations are asked, discussing the each handler gets the original message variation for now
- example - with remove "l" and n = 5, calling `log("hello world")`:
  cccdej
  heo word
  hello
  HELLO WORLD
  stored: ["hello world"]
  ```
- clarify for remove - remove iteratively or just once - "aabb" minus "ab" is "ab" after one pass and "" if repeated

### Part 2

- support searching the stored messages - `search(keywords)` returns the stored messages that contain the keywords
- clarifying question - any or all of the keywords? any in this case
- matching logic. you might have to clarify these yourself - 
  - messages are space separated words with no punctuation
  - matching is case sensitive
- no duplicates in the result, keep the order in which messages were logged
- make it fast, don't scan every message on every search
- example - assume these messages were stored - "user secret token ok", "disk full on node1", "user login ok"
  ```
  search(["login", "disk"]) → ["disk full on node1", "user login ok"]
  search(["Disk"])          → []
  search(["ok", "user"])    → ["user secret token ok", "user login ok"]
  ```
- my thought - use an inverted index here
- when storing logs, generate an id for logs
- then add this id to all the words of the log in the index
- issue 1 - assume a word "ok" comes twice in the log, add it only once in its index
- issue 2 - for handling any keyword, perform a merge
- understand that we need a [k way merge here](https://leetcode.com/problems/merge-k-sorted-lists/description/), so we can use a priority queue here
- for handling all keywords, we can use an intersection instead

### Discussions

- a database handler opens a connection on every log. how do you make them efficient
  - use a "connection pool" - a cache of pre established, reusable database connections. instead of opening and closing a brand new connection every time, the application borrows an idle connection from the pool, runs the query, and immediately returns it
  - batching - one bulk insert / one http call per 100 messages or per second
- one destination is slow. how to handle?
  - use asynchronous communication / queueing / buffering for handling back pressure
  - when the queue is getting full, you either block, or drop messages (e.g. drop debug and not errors logs)
  - spill the in memory logs to disk to avoid the risk of loosing them in case of crashes
  - "bulkhead pattern" - each handler can have its own bounded queue so that one slow destination does not block others
- huge log volumes - what happens to the last n messages?
  - when a message is evicted, remove its id from the list of each of its words
  - typically always remove from the beginning of the list for every word in the inverted index. so, we can mention deque
  - delete a word from the index when its list becomes empty
- punctuation / fuzzy phrase -
  - punctuation and case - run the same tokenizer (lowercase, strip punctuation, etc) when indexing and when searching
  - fuzzy - compute edit distance ≤ 1–2 against the set of distinct words, not against the messages
  - also mention vector databases that support semantic search

## Key Value Store

### Part 1

- an in memory store - `set(key, value)`, `get(key)`, `delete(key)`
- ask clarifying question - what to do when get is called for a non existent key
- what kinds of keys and values should we support - or should we keep it generic
- i was thinking of having a cache class
- then, a separate interface for storage provider. we are using strategy design pattern here. this way, we can swap implementations like in memory etc
- the cache class calls this storage provider for set, get, delete, etc
- the inmemory variant can be implemented using a hash map

### Part 2 - Support Transactions

- `begin()` starts a transaction
- inside it, `get` sees the transaction's own changes
- `commit()` applies the changes to the store, `rollback()` throws them away
- ask clarifying question - should `commit` or `rollback` with no open transaction throw an error?
- solution - an extra map (maybe an extra storage provider) for all the changes
- if this extra map has the key, then return it, else use the actual map's key
- issue - assume a key is present in the original cache. how can we differentiate between keys deleted in the transaction vs keys not touched in the transaction?
- solution i could think of - put key, null in the map. this means if get returns null - we know the key was deleted. if get is not present in the map at all, we know that they key was not deleted and then we go back to the actual map
- when the commit is performed, we need to "merge" the transaction map with the original map

### Part 3 - Nested Transactions

- i was thinking of maintaining a list of storage providers for this
- each nested transaction adds a storage provider to the list
- for get calls, start from the end of the list, keep checking backwards till the key is encountered
- when the transaction is committed, merge it with the transaction behind it in the list
- a rollback should remove the last element from the list

### Discussions

- get is o(depth), can we improve this?
- solution - use an undo log instead
- writes go directly to the actual store
- each level remembers the original value of every key it touches
- note - only remember the first value - we need to revert to the value before the transaction's changes
- this can be achieved using for e.g. putIfAbsent
- rollbacks should write those original values back
- commits - merge the undo log into the parent using putIfAbsent again, so the parent's older value wins
- now get is o(1). issue - other clients can see uncommitted writes, which matters for the thread safety follow up
