---
title: High Level Design IV
math: true
---

## Physical Time

- we need time for various use cases in distributed systems -
  - record when an event happened in logs, databases, etc
  - when to expire things from cache
  - measure performances, profiling, etc
- "physical clocks" - count no. of seconds, tell us the date and time, etc
- most computers use quartz crystal oscillators to keep track of time
- these oscillators vibrate at a constant frequency
- they use "piezoelectric effect" underneath. this basically means they generate an electric signal when mechanical stress is applied and vice versa
- since they are crystals, they are prone to error
- error is measured in "ppm" or "parts per million" - 1 ppm is 1 microsecond per second or 32 seconds in a year
- as a rule of thumb - most quartz clocks will have errors around below 50 ppm
- for a much more accurate clock, we can use "atomic clocks"
- it uses caesium (very expensive) or rubidium atoms (cheaper) underneath, but they are bulky in nature
- their precision is 1 second in 3 million years
- these clocks are what get used in gps etc underneath
- "gmt" or "greenwich mean time" - there is a line in the laboratory. when the sun falls on it, the time is noon gmt
- issue - we have two different ways of measuring time - quartz / atomic clocks ("quantum physics") and earths rotation ("astronomical physics")
- so, "utc" or "universal coordinated time" is used - it is based on atomic clocks but adjusted with earths rotation
- this "adjustment" is called "leap seconds"
- so every year on 30 june or 31 december, one of these three things may happen -
  - a leap second may be added - clock jumps from 23:59:59 to 23:59:60 and then to 00:00:00
  - a leap second may be removed - clock jumps from 23:59:58 to 00:00:00
  - nothing may happen
- the two common ways to represent time in computers are -
  - "unix time" - no. of seconds (epoch) since 1 january 1970
  - "iso 8601" - e.g. 2025-12-26T14:28:56+00:00 - a human friendly format for year, month, day, hour, minute, second, timezone offset
- we can inter convert between these two formats easily
- however, computers ignore the leap seconds correction completely
- this was the issue on 30 june 2012, when multiple systems failed because of the leap second addition

## Clock Synchronization

- computers use quartz clocks, which are prone to "drift"
- solution - "clock synchronization" - periodically get the time from a more accurate source (e.g. atomic clocks)
- e.g. "ntp" or "network time protocol"
- we can see the ntp server configured for our macos devices under the settings for date and time
- "stratum" - clocks are arranged in a hierarchy
  - "stratum 0" - atomic clocks
  - "stratum 1" - directly connected to stratum 0 server
  - "stratum 2" - connected to stratum 1 server
- uses strategies like querying multiple servers to remove outliers etc. with ntp and a good network, clocks can be synchronized to within a few milliseconds
- now, the client compares the time it has locally vs the time received from the server, and based on it, it makes one of the following decisions -
  - "slewing" - used when the difference from server is less than 125ms. it slightly changes its clock speed by say 500 ppm for a few minutes to gradually sync up
  - "stepping" - used when the difference from server is between 125ms and 1s. it immediately sets its clock to the server time i.e. there is a "jump" in the time
  - "panic" - used when the difference from server is more than 1s. it raises an error and does not sync. it requires manual intervention
- e.g. because of the skew observed in the quartz crystal, the clock applies a slew of 500ppm to gradually bring the ntp server and the client in sync
- there are two kinds of clocks -
  - "time of day clock" - both slewing and stepping are applied
  - "monotonic clock" - only slewing is applied. so, it can only move forwards, never backwards
- issue with time of day clock - due to the stepping, the elapsed time can also be negative, or can be much bigger
  ```txt
  long start = System.currentTimeMillis();
  // some processing
  long end = System.currentTimeMillis();
  long elapsed = end - start;
  ```
- apart from the superficial difference of milliseconds vs nanoseconds, this api uses monotonic clocks instead
  ```txt
  long start = System.nanoTime();
  // some processing
  long end = System.nanoTime();
  long elapsed = end - start;
  ```
- time of day clock can measure epoch / tell us the exact date and time
  - advantage - can be used to compare across nodes
  - disadvantage - can move backwards because of stepping
- monotonic clock is an arbitrary clock e.g. time elapsed since the machine booted up
  - advantage - can be used to measure elapsed time correctly
  - disadvantage - do not have any meaning when compared across different machines

## Causality

- assume the following scenario -
  - node a sends a message to node b and node c
  - node b sends a reply for this message to node a and node c
  - node c might receive the reply from node b before the original message from node a
  - this can happen because of network delays etc
  - thus, the messages would not make sense to node c
- so, despite performing clock synchronization, we are unable to order events correctly in distributed systems
- so, we need "happens before relationship" in distributed systems
- we say a -> b (a happens before b) iff -
  - a and b are events in the same process and a occurs before b
  - a is the event of sending a message in one process and b is the event of receiving that message in another process (receiving can only happen after sending)
  - there is an event c such that a -> c and c -> b (transitivity)
- it is possible that neither a -> b nor b -> a. in that case, we say a II b (a is concurrent with b)
- this phenomenon is called "partial order" (as some events are incomparable)
- note - concurrent does not mean happening at the same time. it means there is no causal relationship between the two events

### Example

![](/assets/img/high-level-design/causality-happens-before-example.png)

- due to rule 1 - a -> b, c -> d, e -> f
- due to rule 2 - b -> c, d -> f
- due to rule 3 - a -> c, a -> d, a -> f, b -> d, b -> f, c -> f
- a II e, b II e, c II e, d II e

### Causality

- if a -> b, then a "might have caused" b
- if a II b, then a "cannot have caused" b
- so, happens before encodes "potential causality"

### Conclusion - Ordering Events

- our scenario's problem was our inability to order events correctly in distributed systems
- we basically want to ensure the correct order of events in the distributed system
- if a -> b, then a should appear before b in that order
- however, if a II b, then a and b can appear in any order

## Logical Time

- even with "clock synchronization", physical clocks cannot help us with causality
- so, we use "logical clocks" to capture causality
- they use a counter for the number of events, and have no relation to the actual time
- we want our logical clocks to capture this accurately - if a -> b, then T(a) < T(b)
- two kinds of logical clocks - "lamport clocks" and "vector clocks"

### Lamport Clocks

- initialize with 0 for each node
- on any local event on the node, do t = t + 1
- on sending a message - 
  - do t = t + 1
  - send (t, m) i.e. attach the timestamp when sending the message
- on receiving a message (t', m) - do t = max(t, t') + 1

![](/assets/img/high-level-design/lamport-clock-example.png)

- issue with lamport clocks - if T(a) < T(b), we cannot say for sure if a -> b or a II b. we can definitely say that b -> a did not happen, but nothing about the other two cases. so, we cannot differentiate between causally related and concurrent events
- so, we need vector clocks

### Vector Clocks

- initialize with (0, 0, ... 0) for each node
- on any local event on the node, do t\[i\] = t\[i\] + 1
- on sending a message - 
  - do t\[i\] = t\[i\] + 1
  - send (t, m) i.e. attach the timestamp when sending the message
- on receiving a message (t', m) - 
  - do t\[j\] = max(t\[j\], t'\[j\]) for all j
  - then, do t\[i\] = t\[i\] + 1

![](/assets/img/high-level-design/vector-clock-example.png)

- now for e.g. 2,2,0 would represent not only this event
- but also all events that happened before it - e.g. 1,0,0, 2,0,0 and 0,1,0
- now, we have the following things - 
  - $T = T' \iff \forall i, \; T[i] = T'[i]$
  - $T \leq T' \iff \forall i, \; T[i] \leq T'[i]$
  - $T < T' \iff T \leq T' \; and \; T \neq T'$
  - $T \parallel T' \iff neither \; (T < T') \; nor \; (T' < T)$
- so, we can now accurately capture the "happens before" relationship - 
  - $V(a) < V(b) \implies a \to b$
  - $V(a) \parallel V(b) \implies a \parallel b$
- vector clock disadvantage - vector clocks can become huge / difficult to store, thus not fit inside the 64 bit space

## Redis

### Memcached

- it uses "shared nothing architecture", which helps it with high throughput
- facebook uses memcached, as redis was not around back then
- there, out of 50 million requests, only 2.5 million reach the persistent storage, i.e. it has a cache hit rate of 95%
- now we discuss about redis, and how it differs from memcached

### Features

- "pipelining" in redis -
  - redis uses "pipelining" to reduce the number of "rtt" or "round trip time" spans
  - basically the client does not wait for every request's response
  - advantage - reduces time spent in socket io, context switching, etc
  - the multiple requests are processed independently, e.g. one might return an error and another a success

  ![](/assets/img/high-level-design/redis-pipelining.png)

- "data structures" in redis - 
  - in memcached, both key and values are stored as strings. so, values need to be serialized before storing / we cannot manipulate the values
  - however, redis  supports "data structure storage" instead of retrieving the data, manipulating it and finally storing it back, we can make in house changes
  - it supports sorted sets, bitmaps, hashmaps, etc
  - by using ram primarily, caches can easily use complex data structures like sorted sets, bitmaps, hashmaps, etc without worrying about how to store them
- "single threaded model" in redis -
  - redis uses a single threaded model, thus avoiding complexities around context switching, locking, etc
  - this is why some setups run multiple instances of redis on a single server to utilize multi core systems better
  - since redis is single threaded, all operations performed on redis are atomic in nature
  - memcached, however can efficiently use multi core system / multithreading unlike redis
- "persistence" in redis -
  - it provides configurable persistence, which can help reconstruct the cache in case of restarts
  - firstly, it periodically take snapshots and store dump files on the disk
  - secondly, it can also log all operations to a wal file
  - we can opt-in to these persistence mechanisms, or keep everything in memory only
  - memcached uses ram only. it uses 3rd party tools for implementing non volatile storage
- "expiration policies" in redis - 
  - use the "expire" command manually
  - set expire arguments in set commands (like ttl)
  - supports managed eviction policies like lru
- writes happen via primary, which then go to secondary using wal files, similar to [dynamodb](/posts/high-level-design-iii/#dynamodb)
- sharding happens using the key we choose, so we should choose it wisely to avoid "hot partitions"
- one crude way to scale in redis - write the key to multiple servers (e.g. append random numbers multiple times to the key). now. we can then read it from any of the multiple servers we wrote to as well
- note - in redis, the "client" knows about all the servers, and routes the requests to the right server
- the servers are each aware of each other using the gossip protocol

### Redis Streams

- this covers "streams" in redis, and its comparison with kafka 
- think like kafka - but has some differences in how it works
- "redis stream" is basically a data structure - so it is basically the value part for a specific key
- its basically an "append only" log - we can only add data to it - this is much like kafka
- kafka writes to disk and uses os page caching. so, reads etc needs to be sequential
- however, redis is in memory first, but supports persistence using snapshots etc. so, reads are much faster. additionally, access can be much more random as well. however, it may not be as durable as kafka
- kafka achieves scaling by "partitioning" the topic
- to achieve the same in redis, recall that the stream is basically a value. so, we can have multiple streams instead (say data_stream_1 and data_stream_2). these are basically multiple key value pairs of redis, and since they are independent of each other, they can be present across multiple redis servers
- each "entry" in redis streams has three parts - an id (which is a combination of epoch and sequence number) and also a key and value pair
- writing to a stream - `add <key_of_stream> <id> <key> <value>` - id can be `*` to generate it automatically
- reading from a stream - `read <key_of_stream> <id>` - id can be `$` for reading from the end
- specifying the id when reading is like specifying "offsets" in kafka
- we can use "range queries" on streams, since it is internally sorted by id (think bst)
- redis supports "consumer groups" like kafka, but the principle is different
- in kafka, the partitions are assigned to different consumers, so each consumer reads from its own partition
- however in redis, all consumers read from the same stream. recall how streams can be thought of as one partition of the kafka topic
- so, the consumer group in redis ensures that each entry in the stream is read by only one consumer in the group
- so, one advantage of this model - say in kafka, one of the consumer handles partition 1, and another handles partition 2. if consumer 1 is much faster, it would sit idle, while consumer 2 is doing its job
- however in redis, since multiple consumers read from the same stream using consumer groups, the faster consumer can continue reading more entries
- if a consumer fails, other consumers can read the unacknowledged entries from it after a timeout. this is called "claiming" the entries
- one use case of redis streams - it can basically act as a "asynchronous job queue"
- a consumer group of multiple "workers" can keep consuming items from this stream
- if there is a failure in the worker, other workers can claim it after a timeout
- the guarantee here is "at least once" processing i.e. multiple workers might be assigned the same item in case of failures (e.g. a worker continues processing an item but crashes before acknowledging it)

![](/assets/img/high-level-design/redis-streams-async-job-queue.svg)

### Redis PubSub

- unlike [redis streams](#redis-streams), redis pubsub does not store messages durably in disk or in memory
- it has no overhead of offsets, consumer groups, etc
- it has at most once delivery semantics
- this is also called "fire and forget" model
- use case - it has much much higher throughput than redis streams because of this

### Redis Sorted Sets

- example use case - leaderboard for top 5 tweets
- again, the sorted set is basically a data structure stored as the value for a specific key in redis
- each entry has two parts - "score" and "key"
- we can only have one entry for a specific key, and the set is sorted by "score"
- adding to the sorted set - `add <key_of_sorted_set> <score> <key>`
- so, we can add tweets based on id for key, and number if likes for score
- for updating the number of likes for a particular tweet, we can simply call the add command again with the new number of likes but the same tweet id (same key new score)
- we can do some complex operations - e.g. remove all but top 5 elements - `remove_by_rank <key_of_sorted_set> 0 -5`
- adding the elements and maintaining the sorted list takes log(n) time, so keeping the n small by performing the above operation periodically keeps our performance fast
- again, to scale this, we need to have multiple sorted sets, as a sorted set is basically a value and lives on one node only. at the time of querying, we query all of them and merge the results to get the final top 5 tweets
- internally, it is implemented using a combination of "hashmaps" and "skip lists"
  - hashmap - o(1) access to the "score" of a specific "key"
  - skip list - like a bst, sorted by score. o(log n) insertion, deletion, etc
- another use case of sorted sets are "geospatial indices" i.e. they use sorted sets underneath
- it exposes a very easy to use api which we can leverage
- we can add locations like this - `geo_add <key_of_index> <longitude> <latitude> <identifier>`. e.g. we add a bike to our inventory - `geo_add bikes 77.5946 12.9716 bike_1`
- then, we can query for members within a radius using - `geo_search <key_of_index> <longitude> <latitude> <radius> <unit>`. e.g. we search for bikes within 1 km of a particular location - `geo_search bikes 77.5946 12.9716 1 km`
- how it works underneath - a "geohash" is generated using the latitude and longitude, which is then used as the score in the sorted set. then, we are basically performing range queries on the sorted set
- i was thinking that if asked to scale it in interviews, we can for e.g. scale using specific areas i.e. one sorted set per area, as one sorted set lives on one node only

## Stock Exchange System Design

### Realtime Stock Updates

- basic flow / entities - client -> robinhood backend -> stock exchange service
- option 1 - robinhood backend can poll stock exchange service for updates
- however, we can use "server sent events" (sse) instead
- note - we can avoid websockets as we do not need the bidirectional communication
- approach 1 - 
- every time a new client comes in, the robinhood backend first establishes a new connection to the stock exchange service, if it does not already have a connection for the stock the client requested
- the robinhood backend then stores which clients want the updates for which stocks
- then, it keeps pushing the updates to the relevant clients
- so, we now have one connection to stock exchange service per stock, one connection per client, and all clients get the updates for all the requested stocks

![](/assets/img/high-level-design/robinhood-realtime-approach-1.png)

- issue - cannot scale to multiple machines easily
- approach 2 - so, assume one server can handle 100k concurrent connections
- so, if we have 1m active users, then we would need 10 servers
- issue - duplicate connections from different servers for the same stock
- e.g. nyse has 5k+ stocks, so we would have 5k connections from each robinhood backend instance

![](/assets/img/high-level-design/robinhood-realtime-approach-2.png)

- approach 3 - we break the backend into two different components
- the lookup table stores which "robinhood backend server" is interested in which stock updates
- each backend server has its own local lookup table - which stock should be pushed to which clients
- the layer requesting the stock exchange service can be sharded as well - e.g. the first one requests msft, the second one requests db and appl and so on

![](/assets/img/high-level-design/robinhood-realtime-final.png)

- approach 4 - replace the api calls with a pub sub system in between
- so, the dispatch service can publish / frontend service can subscribe to those topics
- if not relevant, they can just discard the messages

## Chandy Lamport Algorithm

- helps capture the "snapshot" of a distributed system at any given point of time
- it helps with debugging, checkpointing for fault tolerance, etc
- we cannot pause the system to record it, it needs to be taken asynchronously
- naive solution - taking a snapshot of all nodes independently
- issue - the snapshot may capture the receiving of a message, but not the sending of it
- solution - chandy lamport algorithm
- each process has a dedicated incoming and a dedicated outgoing channel for every other process
- messages can only travel along these channels
- once the state recording at a node starts, it sends "markers" to other processes
- after the other processes receive this marker, they start their own state recording as well
- and after starting their recording, they send out their markers as well
- now, the issue we described and how it is handled - if a message from p0 - p1 is received before this marker was received - it is included. else, if the message is received after the corresponding marker was received, it is not included in the snapshot
- look at the diagram below (go through the time part carefully, when a message was sent, received, etc) - 
  - the snapshot recording starts from p0
  - the blue line represents the markers
  - the green line represents the accepted message
  - the red line represents the rejected message
  - message from p1 to p0 is accepted when it came before the marker from p0 to p1
  - note that this message was dispatched from p1 after the marker from p0 to p1 was received, but it was received by p0 before the marker from p0 to p1 was received. this can happen due to network delays
  - message from p1 to p0 is rejected when it came after the marker from p0 to p1

![](/assets/img/high-level-design/chandy-lamport.png)

## Ordering and Consistency Models

- "ordering" - helps determine the sequence
- each ordering model offers a different guarantee about consistency and performance
- "total ordering" -
  - all nodes agree on one order of events
  - e.g. in multiplayer games, all players should see the same order of events
  - can be implemented using lamport clocks
  - in case of a tie, the same deterministic tie breaker should be used across all the nodes, e.g. the process or the node identifier
  - note, my understanding - since it is using lamport clocks, the order need not capture causality properly. however, it is same across all nodes
- "partial ordering" -
  - only certain events are ordered based on some predefined rules
  - e.g. payment can happen after order conformation
  - however, conformation across different customers need not follow the same order
  - it can be implemented using vector clocks
- "causal ordering" -
  - preserves happens before relationship
  - e.g. if mike replies to ross, mike's message should come after ross's message
  - however, if rachel and mike are messaging concurrently, their messages can be in any order
  - it can also be implemented using vector clocks
  - my understanding - causal is a subset of partial ordering, it is more strict
- now, this effects the kind of consistency models we can see
- "strong consistency" -
  - all reads show latest write
  - more coordination overhead / latency, less fault tolerance
  - e.g. bank balance
- "causal consistency" -
  - causal operations are in order
  - e.g. if someone updates their email, it reflects in login
  - however, people cannot see the updated email in their profile details immediately
- "eventual consistency" - 
  - no guarantees, replicas can be out of sync
  - however, they will eventually converge
  - allows for high concurrency / low latency
  - uses asynchronous replication

## Coordination

- we need "coordination" in distributed systems
- coordination has the following different "primitives"
  - leader election
  - distributed locks
  - consensus protocols
  - service discovery
- "leader election" - e.g. replicas in a database need to perform a leader election to agree on the primary node. it must provide failover mechanisms to elect a new leader in case of failures
- "distributed locks" - e.g. ensure that only one instance of a scheduled job runs at a time, even if the scheduler itself is replicated for high availability
- "consensus protocols" - e.g. ensure that all nodes agree on a value. most well known protocols - raft, paxos
- "service discovery" - machines can continuously come up or go down. so, they interact with a central "registry" and send it period heartbeats. the other services can query this registry to find the address of the different machines
- examples of coordinators - etcd, zookeeper
- they run as a small, separate cluster, and expose the primitives we discussed above as simple apis
- etcd uses keys to store data, while zookeeper uses znodes to do the same (znodes follow a hierarchical file like structure, unlike the flat structure in a key value store like etcd)
- they use "watcher" mechanism - clients subscribe to a specific key / znode. then, they receive notifications whenever the value in that key / znode changes
- to run reliably, they run in high availability, and use a "quorum based approach" to agree upon a value
- for instance, in the scheduled jobs example using distributed locks, the scheduler instances try to write to the same key / znode, and the one that succeeds gets the lock i.e. executes the job

## Failures and Fault Tolerance

- "hardware failures" -
  - hierarchy of failure - component (disk, ram, etc) -> node -> rack -> data center
  - use technologies like "raid" (redundant array of independent disks) - it combines multiple physical disks into one logical unit to provide redundancy. note that this will protect against a single disk failure, but not against node / rack failure
  - use replication and then failover across multiple nodes
  - in cloud, deploy across multiple availability zones
- "software failure" - 
  - code bugs, deadlocks (one thread waiting for another thread to release a resource), oom, unhandled exceptions, etc
  - there can be cascading failures - fraud detection service times out, which causes the payment service and then eventually the checkout service to fail
  - mitigate using circuit breakers, bulkhead, retries, etc
- "network failures" - 
  - "partition" - nodes are split into groups, where intra group communication continues working fine, but inter group communication starts to fail
  - when a network partition happens, each group might try electing its own leader
  - this can result in a "split brain"
  - so, we use a "quorum based approach" to agree upon the elected leader
  - if the system is unable to even reach a quorum, e.g. assume nodes are split into two groups of 4 nodes each, the system can for e.g. stops processing writes, and only allows reads
  - my understanding - this the approach when used when favoring consistency. for availability, maybe the groups each process their own writes, and maybe later either reconcile automatically, or expect the client to resolve the conflicts
  - additionally, we use "fencing" - isolate the out of sync or faulty nodes
  - "packet loss" / "packet delay" due to congestion
  - mitigation - use heartbeats, timeouts, reties, etc
- what if the server is able to process a request successfully, but the response is lost? if the client retries, the server might end up processing the same request again. solution - "idempotency". it can be achieved in several ways - 
  - "state" - the system checks if order is already in processed state - if it is, it does not reprocess the order
  - "idempotency key" - the client generates a unique idempotency key for each request, and sends it along with for e.g. the request headers. the server checks if it has already processed a request with the same idempotency key, and if it has, it does not reprocess the request. payment processing systems use this pattern
- "checkpointing" - retry from where we left off, instead of retrying from the beginning. e.g. a long running batch job writes its state after every 10,000 records, and it crashes after processing 55,000 records. it can restart from the last successful checkpoint i.e. 50,000 records, instead of starting from the beginning

## Concurrency

- "process" - self contained environment with its own resources. e.g. chrome runs each tab as a separate process. if one tab crashes, the others stay unaffected as each has its own isolated environment
- "thread" - run inside the same process. they share resources, but run different tasks. e.g. in word, one thread captures the input, while another performs spell check in the background
- one process cannot directly access the memory of another, thus providing strong isolation
- threads share the memory of their parent, like heap etc. however, each thread has its own stack which stores function calls, local variables, etc
- so, threads are lightweight / consume less resources, but at the cost of weaker isolation
- a process creation in unix systems is called "forking"
- the os in case of processes has to declared dedicated memory spaces, copy the program code, etc. then, all these resources should be released when the process ends
- "context switching" - the os switches from one process to another. it needs to save the state of the current process, and restore the state of the incoming process. this is why it is expensive / has overhead associated
- note that this context switching is faster for threads than for processes
- during this context switch, even the l1 / l2 cache is invalidated. the new process / threads sees a cache miss initially, and has to perform slow disk i/o etc
- "thread per request" model - new thread is used for each client. this simplifies development as each thread can block on i/o without affecting other threads, looks linear, etc
- however, it causes the "c10k problem" - context switching starts creating bottlenecks at 10,000 connections
- so, we have the "asynchronous" / "event driven model" -
  - function calls are pushed on the call "stack"
  - execution of a program happens by popping these from the call stack
  - now, when "blocking" operations are seen, they are sent to the os
  - once the os completes the operation, it pushes the callback to the "callback queue"
  - the "event loop" keeps checking the call stack
  - only if the stack is empty, it picks the event from the callback queue
  - then, it pushes it into the call stack
  - understanding - if the os tried writing to the call stack directly, the behavior might become unpredictable. so, it uses the callback queue and event loop
- understanding using an example - 
  - this is a code snippet for javascript -
    ```
    console.log("start");
    setTimeout(() => console.log("timeout"), 0);
    console.log("end");
    ```
  - first, print start is pushed
  - then, print start is popped and executed
  - then, the set timeout is pushed
  - then, set timeout is popped and executed
  - the set timeout is a blocking operation, so it is sent to the os
  - then, print end is pushed
  - then, print end is popped and executed
  - in parallel, the os completes the set timeout operation and pushes the callback to the callback queue
  - then, the event loop picks the callback from the callback queue and pushes it to the call stack
  - then, print timeout is popped and executed
- so, for "cpu bound tasks", multiple threads allow the efficient use of multiple cores
- however for "io bound tasks", the event driven model efficiently handles the idle time because of the blocking operations
- so, for e.g. in a chat application, to address the scale of millions of users, we can use event driven model to handle the websocket connections that mostly sit idle
- "concurrency" - managing multiple tasks at a time. it requires context switching
- "parallelism" - executing multiple tasks at the same time. it requires multiple cores
- a single cpu core can only execute one task at a time. however, it can context switch between multiple tasks, thus giving the illusion of simultaneous execution. it is useful for io bound tasks, where the task is waiting for the database query to return, api call to respond, etc
- concurrency issues -
  - "race conditions" - when two tasks try to update the same resource simultaneously, and the final value depends on the order of execution (which is unpredictable)
  - "deadlocks" - when two tasks are waiting for each other to release a resource
  - "context switching overhead"
  - "starvation" - when a task is denied resources like cpu perpetually because of other high priority tasks
- increasing tasks initially increases the cpu utilization. however, beyond a point, it results in "thrashing" - phenomenon where system spends more time in context switching than executing the actual tasks
- parallelism helps in cpu bound tasks by breaking them into smaller tasks and executing them in parallel on multiple cores faster. used in video encoding and rendering, large scale data processing and scientific simulations, model training, etc
- challenges of parallelism
  - "data dependency" - some tasks may depend on others, task b has to depend on results of task a. this limits the parallelism of the workload
  - "load imbalance" - some tasks may take longer than others, leading to idle cores
  - "synchronization overhead" - parallel tasks may need to communicate or synchronize with each other

## Resource Management

- the os does two things -
  - "cpu scheduling" - which process gets the cpu and for how long
  - "memory management" - how much memory is allocated to each process. it isolates the memory of the different processes from each other
- "cpu scheduling" can be preemptive (the os can interrupt a process and switch to another) or non preemptive (the process runs until it voluntarily yields the cpu). preemptive scheduling is more common, as it allows better responsiveness and fairness. following are the preemptive algorithms -
  - "round robin" - each process gets a fixed time slice (called "quantum") in a cyclic order. con - lot of context switching
  - "priority based scheduling" - each process is assigned a priority, and the os schedules the highest priority process. con - starvation of low priority processes
  - "multilevel queue scheduling" - processes are divided into multiple queues based on their priority or type (e.g. user facing processes have high priority, while background jobs have low priority). a middle ground of the two approaches above
- "memory management" - uses virtual memory (extends a computer's physical ram by using a portion of the computer's hard drive or ssd)
- the process access memory using virtual addresses, which are mapped to physical addresses by the os
- the processes feel like they have a large contiguous block of memory, while the os allocates physical memory in a fragmented manner along with other processes to these processes
- the virtual memory is divided into fixed size blocks called "pages"
- the physical memory is divided into fixed size blocks called "frames"
- i guess these are just different names of how a component sees something
- the os maintains a "page table" for storing this mapping from virtual memory to physical addresses
- recall how virtual memory helps abstract away physical memory (ram) and disk
- if the process requests for a page not available in the physical memory, it results in a "page fault"
- the os then loads the page from disk into the ram. this process is very slow due to disk i/o
- if the ram is full, it results in a "swap" - the existing, unused pages / frames are moved to the disk in a space called the "swap space" to make room for the new page
- excessive swapping leads to "thrashing" (like in context switching)
- in java, go, python, etc, we are abstracted away from memory management using "garbage collection"
- garbage collection automatically identifies and frees up memory that is no longer in use
- issue - the garbage collector has to periodically pause the application threads to do this
- for low latency systems like gaming or bidding applications, even a few such pauses of a few milliseconds are unacceptable. this causes the high tail latency problem
- jvm is split into two parts - young and old generations
- young generation - 
  - new objects
  - gc runs frequently but fast
  - also called minor gc
- old generation
  - old objects - objects are promoted from young generation to old generation
  - gc runs infrequently and takes longer
  - causes stop-the-world event
  - also called major gc
- solutions - advanced java collectors like "zgc" perform concurrent garbage collection with the application. some applications for e.g. discord migrate away from java to rust
- con - when using zgc, more resources are consumed, so it needs more threads / cores as it runs alongside the application itself
- so, when deploying software, we should set the right cpu and memory, configure right garbage collection parameters, monitor using commands like `top` and `vmstat`, use the right programming language, etc

## Network Protocols

- "http" - it is stateless
- pro - this makes it scalable
- con - that is why, the state needs be managed externally, e.g. each request should carry the authentication token
- requests have methods / responses have status codes. both have headers and body
- next, we look at the evolution of http and major improvements in each of them
- http/0.9 - only get method, only supported html
- http/1.0 - added post method. added support for media, files
- http/1.1 - added put, delete, etc methods. also, reuse the same connection using "keep alive". so, it avoids the cost of establishing a new connection (tcp handshake etc) for every request
- it used "pipelining" - so, it could fire requests one after another quickly, as in send requests a, b and c without waiting for the response of a to arrive first
- issue - however, it expected the responses to be returned in order, e.g. response a then b and then c. this meant that if response a was slow, it would make response b and c wait as well
- http/2 - added "multiplexing", which i think allows responses to be returned out of order
- http/3 - migrated from tcp to udp (uses "quic" protocol). it is faster than tcp, as it avoids the overhead of connection establishment, etc. it is much faster, and has built in reliability. e.g. even with http/2, if a packet is lost for one response, packets from all the other responses are blocked until the lost packet is retransmitted. this is called "head of line blocking". however, with http/3, only packets for that specific response are blocked, the other responses are not
- apart from http, we have websockets (allows for full duplex communication), grpc (which uses [rpc](/posts/high-level-design/#rpc) and an efficient binary format for communication), etc
- tcp -
  - it is a "connection oriented protocol" i.e. it involves a "three way handshake" first (syn, syn/ack and ack)
  - after this connection is established, for every packet that the sender sends, the receiver sends an ack back for it
  - if the sender does not receive the ack, it re-sends the packet
  - additionally, sequence numbers are sent with every packet, so that the receiver can reassemble the packets in order
  - this makes it reliable but slower
- udp -
  - connection less, "fire and forget" protocol
  - it sends "datagrams" and does not wait for acks, no ordering guarantees, etc
  - it prioritizes speed over reliability
  - so, it is used in applications like streaming, where it is okay to lose a few packets
- two interaction models -
  - pull - the client asks for updates
  - push - the server delivers the updates
- "polling" - client repeatedly asks the server for new data, e.g. every 5 seconds
- "long polling" - client sends a request, and server holds the connection open until new data is available or a timeout occurs. once the server responds, the client immediately sends a new request. this reduces the number of requests compared to regular polling
- "push model" - server sends updates to the client, e.g. websockets. requires managing persistent connections. ideal for real time applications like chat, stock updates, etc. websockets also allow for "bidirectional communication" (also called "full duplex")
- typical workflow - clients send an http request with the header "upgrade: websocket" to the server. if the server supports websockets, it responds with a 101 status code, and the connection is upgraded to a websocket connection
- challenges of websockets - managing so many persistent connections at scale - either use "sticky sessions", or the backend servers should be able to route the requests to the right server
- "webhooks" - not the same as websockets. useful for communication between backend services
- instead of one service polling another service for updates, the consumer registers a url with the provider. when the event happens, the provider sends an http post request to the consumer url with the event details
- e.g. stripe sends us an event after the payment is successful
- "server sent events" - helps push real time updates to the clients over a long lived connection. unlike websockets, it is unidirectional. it is simpler when we want to push the same data to all the clients
- there can be other mechanisms as well - e.g. to show if a user is offline or online in a chat application, we can use "heartbeats" - the client sends a heartbeat to the server every few seconds
- "rest" - you already know
- "graphql" - only one endpoint that the client calls to request for the required data
- it solves the over / under fetching problem with rest
- caching logic becomes tough, as the queries can be different for every client, with one url
- it can also cause the n+1 problem - if we have a list of items and we want to fetch some fields for each item, it may result in 1 query to fetch the list, and n subsequent queries for the related fields
- "grpc" - an rpc framework developed by google. used for communication between microservices
- it uses http/2 underneath, so all the benefits of http/2 come with it
- it is more efficient than json as it uses a binary format called "protocol buffers" (protobuf)
- it also supports bidirectional streaming
- since it is rpc, it follows a "strict schema", we can generate the client and server code automatically as well
- disadvantage - lack of readability due to its binary format, making it difficult to debug
- so, it is used for fast inter microservice communication, while rest is used for public apis
- data serialization / deserialization - two categories
  - "text based" - json, xml, etc
  - "binary based" - protobuf, thrift, avro, etc
- text based formats are human readable, but larger in size and slower to parse
- also, they typically do not have a pre defined schema
- binary formats are compact, and much faster. they require a pre defined schema. however, they are not human readable
- my understanding - protobuf and thrift are similar in nature / used for internal microservice communication
- however, avro is used for data streaming pipelines
- also, avro supports "schema evolution" - the schema can change over time, and the producers attach a "schema id" to the data, so that consumers can fetch the right schema to deserialize the data correctly

## Ticketmaster

### Functional Requirements

- search and filter events by date, location, etc
- view the details for an event
- reserve and purchase tickets, select seats, etc
- clarifying question - kinds of events to support - any or scope to only movies for now

### Non Functional Requirements

- low latency / high availability when searching for events etc
- scalability - scale to millions of concurrent users trying to book the same seat for high demand events
- reliability / consistency - prevent double booking, ensure seat overselling, etc

### Estimations

- 100M DAU, assume 100 requests per day per user
- this means approximately 100,000 k requests per second
- so, if 1 server can handle 64k rps, we would need approximately 2 servers to handle the load
- at peak traffic, dau can become a proxy to the concurrent requests. at that time, we would need over 1000 servers
- an example of calculating the storage e.g. for a booking entity, as it stores the following fields - 
  - booking id - 4 bytes
  - movie id - 4 bytes
  - show id - 4 bytes
  - timestamp - 4 bytes
  - seats - 2 bytes (assume 2 seats per booking on an average)
- so this is like a few bytes barely
- for now, assuming each booking stores approximately 1 KB of data. there might be several other entities like account etc as well, and several other fields as well, so just taking a ballpark number
- now, assume 1000 cities, 100 venues per city, 10 shows per venue, 100 bookings per show. this way, we can approximate the bandwidth etc
- use read to write ration of 100:1 when doing these estimations for incoming vs outgoing bandwidths

### Core Entities

- event - maybe break this into movie and a particular show in case of movies
- venue - name, coordinates for applying algorithms like geo hashing / quad trees when searching, etc
- booking - highlight that it would go through a lifecycle of different states - confirmed, cancelled, timed out, etc

### API Design

- search for events - GET /events/search?location=seattle&date=26-07-2026&type=movie
- maybe mention pagination of events as well
- also, it would only return partial event details, just enough to show the card view, thumbnail, etc, not all the details like which seats are available and which are not etc
- get event details - GET /events/:eventId
- this should return seat details as well
- we typically use a "two phase" process in such cases. in the first phase, we select the seats, which reserves them for a short time period of time. this creates the booking entity for us. the seats become unavailable to other users for this period if the payment is completed. if not, the booking times out and the seats again become available for them
- create a booking - POST /bookings - returns the booking id
  - eventId
  - seats: ["A1", "A2", ...]
- confirm a booking - POST /bookings/:bookingId/confirm
  - payment details
- retrieve booking - GET /bookings/:bookingId

### Design

- we use an api gateway that handles authentication, rate limiting, etc and sits before microservices
- "event service" - crud of events
- we can use an sql database, as it gives us consistency, which is required for seats availability / updates
- mention how we can shard it using event id for scaling
- these are the different entities and their attributes in the event service / event db
  - event - id, name, ..., venueId
  - venue - id, name, coordinates, ...
  - seat - id, eventId, status (available, reserved, booked), ...
  - booking - id, eventId, userId, seats, status (timed_out, cancelled, ...) ...
- "booking service" - interacts with the same database to create booking, change status of seats, etc
- how integration with a payment gateway like stripe works - 
  - the booking service calls the payment gateway api with the payment details
  - the payment service returns an initial response
  - however, recall that the processing happens asynchronously on the payment gateway side
  - the booking service registers with the payment gateway using "webhooks"
  - these webhooks are called when the payment is successful, failed, etc
- "optimistic locking" - use version numbers. if seat version changes during a booking attempt, it is rolled back, indicating that the seat was booked by someone else. this results in frequent failures during high contention
- another requirement - we wanted to first allow for reserving a seat, and then allow the user to complete the booking by completing the payment within a certain time frame. if not completed, the booking is considered timed out
- "distributed locking" - so, we use a distributed locking mechanism using redis, zookeeper, etc with a timeout of say 10 minutes
- we can scale to multiple instances of booking service easily as well, as they all communicate to the same redis cluster
- when we try to reserve a booking, we first acquire a lock for the seat using a timeout of say 10 minutes
- when users fetch the event details via the event service -
  - it first queries the database for the seats and their statuses
  - then, it queries the redis cluster for the locks on those seats
  - if the seats are locked, they are marked as unavailable in the response
- frequent question - what happens if the redis cluster goes down
  - answer - firstly, redis cluster itself is highly available and fault tolerant. it already uses replication, automatic failover, and partitioning, etc
  - however, what if it still is unreachable
  - solution - since we are using a postgres database, it supports acid properties, and only one of the writes succeed
  - here is where maybe i can mention the use of read committed level of isolation with optimistic concurrency control
- "search service" - search and filter events
- it can use elasticsearch to support quick searches. mention concepts of "inverted index" etc here
- it can also use geo spatial indices using techniques like geo hash, quad trees, etc
- we can use a cdc pipeline to populate the elasticsearch index from the database - mention how wal files of databases are read, then sent through a distributed message queue for back pressure etc, and then finally written to the database of choice
- cache the most frequent queries - now, a setting around caching is available and can be enabled in elasticsearch clusters, e.g. top 10 k queries. otherwise, we can use solutions like cdn, or maybe maintain a redis cluster ourselves, etc for caching popular events. cdn might also be useful as people only typically search for events in their own city / location
- an issue - assume user 1 tries to browse through an event's details, and while it is browsing through the seats, a seat that it sees as free is booked by user 2. the user could be browsing through the seats for minutes, and multiple seats could have been reserved or booked meanwhile
- solution - long polling, websockets, server sent events, etc. point out advantages and disadvantages of each of these approaches
- popular events - for events like taylor swift, there would me millions of concurrent users trying to book, and this would cause our services to fail. solution - we can queue the requests, and process them in a first come first serve manner. users would be notified once their reservation requests are complete, so that they can proceed to make the payment. this flow of making the reservation and notifying about them asynchronously can be enabled only for really popular events, and we can continue using the normal flow for all other events
- when showing the list of events, we might want to show statuses like "sold out". maybe the postgres database event can be updated with the sold out status when someone completes the booking of a seat successfully using transactions. did something similar for average rating calculation in yelp's system design
- availability and fault tolerance - deploy multiple instances for redundancy, use replication for databases, failover to standby instances, etc
- security - authentication and authorization, encryption for data at rest and transit, pci-dss compliance for payment processing, ddos protection, etc

![](/assets/img/high-level-design/ticketmaster.png)
