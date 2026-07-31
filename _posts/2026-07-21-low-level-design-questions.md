---
title: Low Level Design Questions
math: true
---

## Parking Lot

### Requirements

- parking lot has multiple entrances and exits
- collect ticket / spot is assigned at entrance
- parking spot assigned should be near to the entrance vehicles enter from
- capacity of parking lot is limited (e.g. 30k)
- parking spot can be of different types - handicapped, compact, large, electric, two-wheeler
- similarly, a vehicle can be of different types - car, bus, truck, bike, etc
- parking fees should be based on duration, paid at exit
- can pay using cash / credit card / debit card
- ensure that the same parking spot is not assigned to multiple vehicles - this can happen when for e.g. two vehicles come from different entrances

### Design

- enums violate the open-closed principle, as it might require modifying the switch cases etc in our code
- so, we use the factory pattern instead for parking spots
- ParkingSpot - make it abstract so that it cannot be instantiated directly
- it can have subclasses like HandicappedParkingSpot, CompactParkingSpot, etc
- Terminal
  - EntryTerminal - getTicket(Vehicle)
  - ExitTerminal - payTicket(ParkingTicket)
- ParkingAssignmentStrategy
  - getParkingSpot(Vehicle)
- e.g. for implementing the NearestToEntranceParkingStrategy, we can use min heaps
- so, maybe we can have one min heap for each entrance
- similarly, we can use the strategy design pattern for the payment processing, like credit card, cash, etc
- FeeCalculatorStrategy - we can use the strategy design pattern here as well. we can for e.g. have an hourly fee, a parking lot booked for a specific event, charge more based on the peak hours, etc
- use the singleton design pattern for the whole parking lot system
- we need to maintain for each parking spot whether it is occupied or not
- for this, the parking spot has an occupied AtomicBoolean variable
  ```
  private AtomicBoolean occupied = new AtomicBoolean(false);
  ...
  public boolean tryOccupying() {
    return occupied.compareAndSet(false, true);
  }
  ```
- why not synchronized - assume we use the synchronized keyword on the main method. now, assume that a car came before a bike. the bike would have to wait till the car is parked, even if their types are different

## Elevator

### Requirements

- we can have multiple elevators
- "hall calls" - users request for an elevator using up / down buttons
- the system determines which elevator to send
- system should be able to handle concurrent requests

### Design

- we can take different strategies -
  - minimize the power consumption
  - minimize the wait time of passengers
  - etc
- Passenger
- Request
  - ExternalRequest
    - direction - ExternalRequestDirection(UP / DOWN)
    - originFloor
  - InternalRequest
    - destinationFloor
- ElevatorController - singleton pattern
  - elevators - Elevator[]
  - requestElevator(ExternalRequest)
- Elevator
  - floor - int
  - direction - ElevatorDirection(UP / DOWN / IDLE)
  - requests - Request[]
  - requestElevator(InternalRequest)
- logic for ElevatorController#requestElevator
  - find the best elevator
  - add to requests list of that elevator
- the elevator can be in four different states -
  - idle
  - moving towards the passenger, and in the direction the passenger wants to go
  - moving towards the passenger, but in a direction opposite to the direction the passenger wants to go
  - moving away from the passenger
- the controller needs to ignore the elevator states 3 and 4, and it can first prioritize 2 then 1
- e.g. for 2nd case, we can return true as follows -
  - if elevator direction is same as external request direction
  - if external request direction is up and request origin floor > elevator floor
  - if external request direction is down and request origin floor < elevator floor
- finally, once we collect all the elevators satisfying this 2nd case, we need to find the closest elevator
- to simulate time, we can use "ticks" / "steps" - in one tick, either the elevator stops to pick up / drop off passengers, or it moves one floor up / down
- the elevator controller calls step on each of the elevators (looks like iterator design pattern) -
  ```
  step():
    for elevator in elevators:
      elevator.step()
  ```
- now, we discuss the different "scheduling algorithms" for the elevator, which tells us the order in which the elevator would serve the requests
- first come first serve - 
  - add requests to a queue
  - the elevator would serve the requests one by one
  - first go to the source floor of the first passenger, then take the passenger to its destination
  - then, go to the second passenger and serve their request, and so on
  - flaw in this approach - if request from passenger on 5th floor comes before the request from passenger on the 3rd floor, it ignores the request from the passenger on the third floor even if they are on the way
- shortest seek time first -
  - keep going to the passenger close to the elevator
  - flaw in this approach - starvation of passengers say on the top floor, since the elevator keeps serving the passengers in the middle floors
- scan algorithm -
  - the elevator will go all the way up and then all the way down
  - on each floor, it checks - if there is a request it can serve, it would stop and onboard the passengers
  - disadvantage - it will consume a lot of power. it goes all the way to the top / bottom even if there are no pending requests there
- look ahead scan -
  - overcomes the shortcoming of scan algorithm by looking ahead
  - if there are no requests, it would just stop and not move at all
- so, the step algorithm of the elevator can look like this - 
  ```
  step():
    if requests is empty:
      direction = IDLE
      return

    # e.g. strategy, e.g. nearest floor:
    else if direction == IDLE
      nextFloor = getNextFloorFromRequests()
      direction = floor > nextFloor ? DOWN : UP

    # the elevator needs to stop
    else if requests contains a request for floor:
      if requests contains InternalRequest(floor):
        requests.remove(InternalRequest(floor))

      if direction == UP and requests contains ExternalRequest(floor, UP):
        requests.remove(ExternalRequest(floor, UP))
 
      if direction == DOWN and requests contains ExternalRequest(floor, DOWN):
        requests.remove(ExternalRequest(floor, DOWN))

    # reverse the direction
    else if direction == UP and no requests.floor > floor:
      direction = DOWN
    else if direction == DOWN and no requests.floor < floor:
      direction = UP

    else if direction == UP:
      floor += 1
    else if direction == DOWN:
      floor -= 1
  ```
- how to handle concurrency? some scenarios -
  - one user presses on floor 4, another user on floor 9. both get the idle elevator on floor 6
  - we are updating the requests list of an elevator from different threads
- we can use synchronized keyword, or try using some more fine grained locking mechanisms, e.g. each elevator can have its own lock

## Amazon Locker Service

TODO - https://www.youtube.com/watch?v=s6nGkoGJhXk

### Requirements

- customers can find the nearby locker based on zipcode
- when searching for the list of lockers, only "eligible lockers" are shown
- e.g. if a locker is not available for that time, or say a locker does not have a slot that can accommodate a package of that size, etc, it should not be shown
- once a customer selects a locker - 
  - a slot in that locker is reserved
  - a delivery agent is assigned
- then, the delivery agent comes to the locker with the package
- the barcode of the package is scanned, and that opens the assigned slot
- after this, an otp / qr code is sent to the customer
- the customer needs to go to the locker and enter this otp / scan the qr code to open the assigned slot
- then, the customer can pick up their package
- packages can expire if not picked up in say 7 days, at which point the staff can come and pick them back up

### Design

- to me, this feels very similar to the parking lot design question, but with some extra stuff
- in parking lot, we had a single parking lot with multiple parking spots
- here, we have, multiple lockers distributed at different locations, and each locker has multiple slots
- just like vehicle and spot in parking lot, the size of slot and package here helps decide the slot to assign
- again just like in parking lot, we use strategy design pattern for the assignment of a slot in a locker to a package
- however, here we need additional strategies for the search feature, delivery agent assignment feature, etc
- Package
  - size - PackageSize(SMALL / MEDIUM / LARGE)
  - customer - Customer
  - deliveryAgent - DeliveryAgent
- Locker
  - slots - Slot[]
- Slot
  - size - SlotSize(SMALL / MEDIUM / LARGE)
  - available - AtomicBoolean
  - package - Package
- User, Customer extends User, DeliveryAgent extends User
- LockerSearchService - strategy design pattern
  - getLockersByZipAndPackageSize(zipcode - String, PackageSize)
- LockerService -
  - reserveLocker(Locker, Package)
- it should generate the OTP, and then also assign a slot and a delivery agent
- SlotService - we use the strategy design pattern to assign a slot - e.g. assign a small package to a large slot if no small slot is available, etc
  - assignSlot(Locker, Package)
- AgentService - strategy design pattern to assign a delivery agent - e.g. assign the nearest delivery agent, assign the delivery agent with least number of deliveries, etc
  - assignDeliveryAgent(Locker, Package)
- OTP
  - code - String
  - expiration - DateTime
- PickupService - verify the OTP, mark the slot as empty
- add a scheduled service to release the expired packages

## Uber

### Requirements

- ask clarifying questions always
- do we need to support different kinds of cabs? - no for now

### Design

- Rider - email, phone number, etc
- Driver -
  - cab - Cab
  - currentLocation - Location # to find the nearby drivers
  - available - AtomicBoolean
- Rider will create a Trip instance
- Trip
  - source - Location
  - destination - Location
  - rider - Rider
  - driver - Driver / null
  - status - TripStatus(REQUESTED / IN_PROGRESS / COMPLETED / CANCELLED)
  - rating - double
  - price - double
- we can use state design pattern to manage the different states of the trip
- PricingStrategy - use strategy pattern - based on distance, surge, premium customer, etc
  - calculateEstimate(Trip) - show the estimate price to the rider before they confirm the trip
  - calculatePrice(Trip) - calculate the final price based on distance traveled, time taken, wait time, etc
- RideMatchingStrategy - use strategy pattern - near to the rider, have not fulfilled a lot of trips, etc
  - selectDriver(Trip)
- for the notifying of nearby drivers, we can point out "observer pattern"
- RiderManager - singleton class for managing riders (aggregation, as riders can exist without the manager)
- DriverManager - singleton class for managing drivers (aggregation, as drivers can exist without the manager)
- we can think of these classes like repository classes as well

## ATM

### Requirements

- what operations to support for the atm - only withdrawal for now
- support different kind of notes - 2000, 500, 100

### Design

- why use the state design pattern - assume we track the states using an enum etc. it violates the open closed principle, as we would have to modify the switch cases etc in our code if we add a new state. also, it violates the single responsibility principle, as the same class would handle all kinds of states and functions
- ATMState - note to self - this is one example of modelling the states, maybe try to clarify this with the interviewer
  - IdleState - insertCard(card)
  - CardInsertedState - enterPin(pin)
  - PinEnteredState - selectTransaction()
  - TransactionSelectedState - dispenseCash()
  - CashDispensedState - ejectCard()
- note to self - remember the basic structure of state design pattern - 
  - the context class (ATM) would have a reference to the current state
  - all states would have a reference to the context class (ATM)
  - the context class would delegate the function calls to the current state
  - the context class can also be used to hold the "intermediate data" which can be shared between the different state objects, e.g. the current card needs to be accessed during pin verification, to verify if the amount the user tries to withdraw can be dispensed, etc
- ATM
  - currentState - ATMState
  - insertCard(), enterPin(), selectTransaction(), dispenseCash(), ejectCard()
  - map (denomination -> count)
  - currentCard
- Card
  - cardNumber
  - pin - maybe show use hashing etc when verifying the pin
  - account - Account
- Account
  - accountNumber
  - balance
- for dispensing the cash, we can use a greedy algorithm - this uses "chain of responsibility" design pattern
- again, why chain of responsibility - if we were to handle everything inside the dispenseCash method, we would not be able to add new denominations without modifying the existing functionality

## Logger

### Requirements

- logs can have different "levels" (like importance) - info -> warn -> error
- "appenders" (where to output the log) - console, file, etc
- it can follow a certain format - timestamp [log level] message
- the format of the log should be configurable - json, plain text, etc
- it should be thread safe - e.g. if thread 1 logs "hello" and thread 2 logs "world", the output should not be "hweolrllod" or something gibberish. it can be "helloworld" or "worldhello", but not overlapped

### Design

- Log
  - level - Level(INFO / WARN / ERROR)
  - message
  - timestamp
- LogFormatter - strategy design pattern - JsonLogFormatter, PlainTextLogFormatter, etc
  - format(log - Log)
- LogLevelHandler - we use chain of responsibility design pattern. otherwise, we would have had if else / switch code blocks, which would then violate the open closed principle
- if the level is error, invoke the error log level handler, else call the next handler in line. if the level is warn, invoke the warn log level handler, else call the next handler in line, and so on
- LogAppender - strategy design pattern - ConsoleLogAppender, FileLogAppender, etc
  - synchronized append(log - Log)
- the appenders are configured using a formatter - e.g. console appender could be using plain text formatter, while a file appender could be using the json formatter
- making the append method synchronized ensures that the log messages are not interleaved when multiple threads are logging concurrently
- we can have multiple appenders for the same log level - e.g. we can log to console and file for error level, but only to console for info level
- so, we use the observer design pattern - the appenders are "observers", while the level handlers are "subjects"
- singleton design pattern is used for the logger - the same logger object is used globally

## Chess

### Requirements

- board is 8*8
- each cell is a combination of a letter and a number, e.g. a1, e5, etc
- should support undo / redo
- should we support special moves like castling - yes
- the game should support "spectators"

### Design

- Spectator - spectate the game. we can use observer pattern here. the spectators can be notified every time a move is made. one concrete implementation of this can be the "console spectator"
- Player - there can be two kinds of players -
  - HumanPlayer - decideMove() gets the move from the user
  - ComputerPlayer - decideMove() is determined by an algorithm run by the computer
- Piece - each piece has a list of moves it can make
  - color - Color(WHITE / BLACK)
  - moveStrategies - MoveStrategy[]
- mention factory design pattern for creating pieces, as we have a dedicated subclass for each piece
- we can use strategy design pattern for the MoveStrategy, and each piece can move in several ways, each implemented using the MoveStrategy
- MoveStrategy
  - abstract canMove(from - Cell, to - Cell, board - Board, piece - Piece) - boolean
  - isValid - check if same color piece is not present in destination cell etc
- the abstract base class of the MoveStrategy can check if the move is valid - the piece should not try capturing another piece of its own color, it should not move outside the board, etc. meanwhile, the different strategies can implement the specific logic for how the piece should move, e.g. we can have a DiagonalMoveStrategy, HorizontalMoveStrategy, VerticalMoveStrategy, etc
- this allows for extensibility - for adding additional moves, we just need to add additional implementations of this MoveStrategy
- Cell
  - row - char
  - column - int
  - color - Color(WHITE / BLACK)
  - piece - Piece / null
- Board
  - Cell[][] cells
- one Game class, which is like the controller responsible for managing the game, switching turns, checking for check / checkmate, etc 
- we can use memento design pattern to implement the undo / redo functionality
- we store a stack of Move class
- Move
  - from - Cell
  - to - Cell
  - pieceMoved - Piece
  - pieceKilled - Piece / null
  - undo()
- undoing a move would mean - 
  - popping the last move from the stack
  - moving the piece from the "to" cell back to the "from" cell
  - if a piece was killed, we need to put it back on the "to" cell
- note - one move in chess is special - castling move. it involves moving of two pieces and not just move. this might mean changes in different parts of the code. e.g. in case of undo, we might need to move two pieces back. so, instead of storing multiple moves, we can use "adapter pattern" here, and create a new class called CastlingMove which extends the Move class. i delegated the undo to the Move class so that it can determine how to undo the move, as for special moves like castling, it is not possible to have a generic undo logic

## BookMyShow

### Requirements

- can use this for flight booking system, hotel booking system, etc as well
- extensible for different types of seat
- support different kinds of payment methods
- add theatres, screens, movies, shows, seats into the system
- support searching of movies
- handle concurrency - only one out of multiple users should be able to book a seat
- handle timeout of seats after some time duration

### Design

- Theatre
  - name - String
  - screens - Screen[]
  - location - Location
- Screen
  - name - String
  - seats - Seat[]
- Seat - extended by ReclinerSeat, RegularSeat, etc
  - seatNumber - String
  - price - double
  - show - Show
- Movie
  - title - String
  - duration - int
- Show
  - movie - Movie
  - screen - Screen
  - startTime - DateTime
  - theatre - Theatre
- BookingService
  - lockProvider - LockProvider (aggregation pattern)
  - createBooking(booking - Booking)
  - confirmBooking(booking - Booking)
- LockProvider - strategy design pattern - RedisLockProvider, InMemoryLockProvider, etc
  - tryLock(key - String, duration - int) - boolean
  - releaseLock(key - String) - void
  - lockOwner - String
- create booking - 
  - lock the seats. the key used here can be a combination of show id and seat id
- confirm booking - 
  - check if all the locked seats have not been expired
  - additionally, also check if the lock owner is the same user or not
- PaymentStrategy - implemented via upi strategy, card strategy, etc
  - pay(booking - Booking)
- Booking
  - show - Show
  - seat - Seat[]
  - status - BookingStatus(CREATED / PENDING / CONFIRMED / CANCELLED / TIMED_OUT)

## Rate Limiter

### Requirements

- rate limit users based on tier (free vs premium)
- support different algorithms - token bucket, fixed window, sliding window log, sliding window counter, etc
- thread safe / support concurrency

### Design

- my thought - instead of hardcoding as a User, use an Identity class. 
- Identity
  - id - number
- this can in turn have different implementations like user with a tier for free and premium, ip based so that the ip hash becomes the id of the identity, etc
- RateLimiter
  - allowRequest(user - User) - boolean
  - config - RateLimiterConfig
- this uses strategy design pattern for the different algorithms - SlidingWindowRateLimiter, TokenBucketRateLimiter, etc
- similarly, we can use factory design pattern for the different kinds of config too
- RateLimiterConfig can have different implementations based on the kind of rate limiter being used
- also, whenever using strategy design pattern, remember to combine it with factory design pattern so that we can create the appropriate strategy based on the configuration we provide
- while handling concurrency, we can use the synchronized keyword. disadvantage - it would be slow. we only need to synchronize the requests from the same user, not across different users
- token bucket algorithm. notice things like the concurrent hash map, how we use `.compute()` to update the tokens in a thread safe manner for a concurrent environment, etc
  ```
  private final Map<String, Integer> tokens = new ConcurrentHashMap<>();
  private final Map<String, Long> lastRefillTime = new ConcurrentHashMap<>();

  ...

  @Override
  public boolean allowRequest(User user) {

    AtomicBoolean allowed = new AtomicBoolean(false);

    tokens.compute(user.getId(), (id, availableTokens) -> {

      long now = System.currentTimeMillis();

      int currentTokens = refillTokens(user, now);

      if (currentTokens > 0) {
        allowed.set(true);
        currentTokens -= 1;
      }

      return currentTokens;
    });

    return allowed.get();
  }

  private int refillTokens(User user, long now) {
    ... some basic logic
    return tokens;
  }
  ```
- sliding window log algorithm - 
  ```
  private final Map<String, Queue<Long>> requestLog = new ConcurrentHashMap<>();

  ...

  @Override
  public boolean allowRequest(String userId) {

    AtomicBoolean allowed = new AtomicBoolean(false);

    long now = System.currentTimeMillis() / 1000;

    requestLog.compute(userId, (id, log) -> {

      if (log == null) {
        log = new ArrayDeque<>();
      }

      while (!log.isEmpty() && (now - log.peekFirst()) >= config.getWindowInSeconds()) {
        log.removeFirst();
      }

      if (log.size() < config.getMaxRequests()) {
          log.add(now);
          allowed.set(true);
      }

      return log;
    });

    return allowed.get();
  }
  ```
- finally, for fixed counter / sliding counter, not going through the whole logic, but one point is that to get the window id, we can do something like this -
  ```
  long currentTime = System.currentTimeMillis();
  long windowId = (currentTime / 1000) / config.getWindowInSeconds();
  ```

## Splitwise LLD

### Requirements

- expenses can be "direct" or create inside a "group"
- for a group expense, first a group is created and members are added to it
- for example, assume we create a "group" for goa, with the following "expenses" -
  - flight tickets - person a owes person b 60
  - cycling - person a and person b owe person c 6 each
- "simplify debts" - a feature in split wise to reduce the number of transactions, e.g. above, person b would pay 54 to person a and 12 to person c to settle the debts. note that simplify debts feature is only present for group expenses, not for direct expenses 
- users should be able to view their "balance sheet" for every group. it shows the amount they need to pay / are supposed to get -
  - total amount paid - 60$
  - total expense - 23.33$
  - balance -
    - person a - 23.33$
    - person b - 13.33$

### Design

- Group
  - id
  - name
  - members - User[]
  - expenses - Expense[]
  - balanceSheets - map(User -> BalanceSheet)
- BalanceSheet
  - totalPaid - double
  - totalExpense - double
  - balances - map(User -> double) - positive means the user is owed money, negative vice versa
- Expense
  - splits - Split[]
  - SplitType - EQUAL / PERCENTAGE / EXACT
  - paidBy - User
  - amount - double
  - description - String
- Split
  - user - User
  - amount - double
- strategy design pattern for calculating the splits - EqualSplitStrategy, PercentageSplitStrategy, ExactSplitStrategy, etc, and again, we can use the factory design pattern for instantiating these different strategy services
- my understanding - the input argument i.e. the RequestDTO for the different strategies would be different. they too can use the factory design pattern, e.g. a base request dto class, with implementations like EqualSplitRequestDTO, PercentageSplitRequestDTO, ExactSplitRequestDTO, etc
- simplify expense receives a group `simplifyExpense(group - Group)`, and it simplifies the balance sheets part of that group
- we can specify the use of strategy design pattern for this as well
- we can find the net credit / debit for all users. now, does not matter who the user pays at the end of the day, the idea is that all the debts should be settled
  ![](/assets/img/low-level-design-questions/splitwise-simplification.png)
- so, for minimizing the transactions, we can use a "greedy approach" - find the person with the maximum credit and maximum debt, and then settle the minimum of the two. continue this process till the end. we can use heaps for doing this efficiently
- i do not think greedy is accurate, but maybe i can point out that is why using a strategy pattern helps here. otherwise, we can try for all permutations, which would have complexity of the order of factorial

## Cache

- cache - generic class of key, value
- eviction policy - generic class of key
- storage policy - generic class of key, value
- so, this feels like abstract factory pattern - the cache is composed using the right concrete implementation of the storage policy and the eviction policy
- implementation of put - 
  ```
  if storage.size == n and not storage.has(key):
    key = eviction_policy.evict()
    storage.remove(key)

  storage.add(key, value)
  eviction_policy.access(key)
  ```
- implementation of get - 
  ```
  if not storage.contains(key):
    return None

  eviction_policy.access(key)
  return storage.get(key)
  ```
- one concrete implementation of storage can be done using an in memory hash map. the storage policy would pretty much just be a simple wrapper over the functions exposed by the hash map
- implementation of the lru evection policy. it would contain the two things - 
  - a doubly linked list
  - a map of key, node address of the linked list
- when access is called using a key - 
  - if it is already present in the map, delete it from the doubly linked list. then, attach it back to the end of the doubly linked list
  - if not present, add it to the end of the doubly linked list, and add a new entry to the map
- when evict is called, remove the head of the doubly linked list (and the corresponding map entry) and return it
- mark put and get synchronized if asked about multi threading. my thought process - already so many data structures like linked list etc are being touched, that too different based on the eviction strategy we choose. so, it is best to just mark both as synchronized (coarse grained locking)

### Follow Up

- combine the above with a ttl - remove expired keys before operations / refresh expiry when a value is updated
- what interviewers try to probe - eviction is separate from expiry, so separate both concerns
- the expiration policy can be a strategy as well - "no expiry" can be the dummy default behavior, and then we can have implementations like "fixed ttl"
- expiration policy - generic class of key
  - isExpired(key) - check if the key is expired
  - remove(key) - remove the key
  - getExpiredKeys() — returns all expired keys
  - access(key) - restart the key's clock
- new implementation of put - the idea is to first remove all expired keys before we think of eviction
  ```
  for expired_key in expiration_policy.get_expired_keys():
    storage.remove(key)
    eviction_policy.remove(key)
    expiry_policy.remove(key)

  if storage.size == n and not storage.has(key):
    key = eviction_policy.evict()
    storage.remove(key)

  eviction_policy.access(key)
  expiration_policy.access(key)
  storage.add(key, value)
  ```
- new implementation of get - 
  ```
  if not storage.has(key):
    return None
  
  if expiration_policy.is_expired(key):
    storage.remove(key)
    eviction_policy.remove(key)
    expiry_policy.remove(key)
    return None
  
  eviction_policy.access(key)
  expiration_policy.access(key)
  return storage.get(key)
  ```
- what we have is a "lazy expiration". for active expiration, we can use an active background thread
- it might happen we get more requirements like different expiration per key, keep adapting at this point i think. i personally feel coming up with this much in the time frame is more than enough

## File System

### Requirements

- follows a hierarchical structure
- directories can contain other directories
- files - metadata like size, name, creation timestamp, permissions
- support efficient storage and retrieval
- access using paths, e.g. /documents/report.txt

### Design

- hierarchical structure - composite design pattern
- we can model this structure like a "trie"
- we can create a common class, say node
- file and directory classes have an "is a" relationship with the node class
- the root node is the root directory, starting from "/"
- all subsequent nodes can be directories, while files are leaf nodes
- we can have a file system manager class that uses singleton design pattern
- it can be responsible for retrieval, creation, etc
- FileSystemNode
  - name - string
  - children - map(name -> FileSystemNode)
  - created at - local date time
  - modified at - local date time
- File extends FileSystemNode
  - extension - string
  - content - string
- i was thinking of modelling different classes for a file as well, like image, executable, etc
- logic for creating a file / directory - assume the path is "/a/b/c/d". when we run a split command, the first element would be an empty string, which is basically the root. so, we skip it. then, we iterate through all the elements but last, and create directories recursively if not present. finally, we create a file or a directory for the last part. we can either have different methods for creating a file vs a directory, or use the same method and check if the name has a period or not
  ```
  components = path.split("/")
  
  current = root
  
  for i = 1 to size(components) - 2:
    if !current.children.contains(components[i]):
      current.children.add(components[i], new Directory(components[i]))
    current = current.children.get(components[i])
  
  if components.last().contains('.'):
    current.children.add(components[i], new File(components.last()))
  else:
    current.children.add(components[i], new Directory(components.last()))
  ```

## Vending Machine

- pretty similar to [atm](#atm)
- few clarifying questions i was thinking of - 
  - should we allow selecting multiple quantities of a product?
  - should it accept card or cash or both?
  - should we add the logic for dispensing the balance amount?
- first we have to insert the coins
- then, we have to choose the aisle
- finally, the product would be dispensed
- so, states - NoCoinInsertedState -> InsertedCoinState -> DispenseState -> NoCoinInsertedState
- State -
  - insertCoin(amount - double)
  - pressButton(aisleNumber - int)
  - dispenseProduct() -> Product
- though to self - can we use the singleton design pattern for the states?
- note to self - remember the basic structure of state design pattern - 
  - the context class (vending machine) would have a reference to the current state
  - the states would have a reference to the context class (vending machine)
  - the context class would delegate all the function calls to its current state. e.g. if we call the `insertCoin` method on vending machine, it would simply call `currentState.insertCoin`
  - the state of the context class is updated to the next state by the states themselves! they can for instance call `vendingMachine.setCurrentState(new CurrentState())`
  - the context class can be used to hold "intermediate state", for e.g. coins inserted. when selecting a product, we would need to know if the amount inserted was enough
- for e.g., when we insert the coin, the amount state in the vending machine gets updated
- we can also add the "inventory management" logic here. the logic in brief - 
  - a map to lookup the product stored at an aisle - map(integer -> product)
  - a map to lookup the count of items for a product - map(product -> integer)
- we can also add exception handling - 
  - if the product price is more than the inserted amount value, throw
  - if the product amount is not available, throw

## Notification System

### Requirements

- send notification to users for every client
- a subscriber can have multiple clients like uber, payment, etc
- support multiple channels -
  - sms
  - email
  - push (in app)
- a user can have preferences - which channels to support for which client

### Design

- Client - 
  - name - String
- Subscriber - 
  - name - String
  - email
  - phone number
  - preference - SubscriptionPreference
- SubscriptionPreference
  - clientToChannelsLookup - map(Client -> Channel[]) 
- we can use strategy design pattern for different kinds of notification mechanisms like email, push, sms
- NotificationChannel - SMSNotificationChannel, PushNotificationChannel, EmailNotificationChannel
  - sendNotification(subscriber - Subscriber, notification - Notification)
- here, we can highlight how SMSNotificationChannel can use the phone of the subscriber, EmailNotificationChannel can use the email of the subscriber and so on
- specify how we can use the factory design pattern for creating instances of NotificationChannel
- Notification
  - message - String
- NotificationDispatcher
  - addSubscriber(subscriber - Subscriber)
  - sendNotification(notification - Notification, client - Client) - this looks for the notification preferences for all the subscribers, and then calls the send notification on all the right channels for the client
- the dispatcher here is using the observer pattern
- additional - if asked about retry, maybe i can talk about strategy design pattern, the different strategies like exponential backoff with some random jitter, and so on

## Pizza Store Billing System

### Requirements

- calculate the price of a pizza based on its base and toppings
- "base" - a foundational element, such as regular or thin crust
- "toppings" - additional ingredients like cheese, pepperoni, vegetables, etc that are added on top of the base
- each base and topping has a specific price
- prices are store specific - so different pizza stores will have different prices for the same base or topping
- the system should be able to calculate the price for a full order that includes other items like drinks
- the system should support various deals like buy one get one free, buy one get drink free, etc

### Design

- Item - an abstract class, where both methods below are abstract
  - name - String
  - price - Double
- Store
  - priceCatalog - map(Item -> double)
- Drink extends Item
- Pizza extends Item -
  - base - PizzaBase
  - toppings - Topping[]
- PizzaBase - an abstract class. implemented by Regular, ThinCrust, etc
- Topping - an abstract class. implemented by Cheese, Pepperoni, Veggie, etc
- Pack extends Item - like composite pattern. get price would be calling the get price on all its items
  - items - Item[]
- Order -
  - items - Item[]
- can use the decorator pattern for applying promotion / deals on top of the order
- it can look at the different items to determine if a promotion is applicable or not

## Meeting Rooms

### Requirements

- different meeting rooms, each with its own capacity
- book a meeting room for a given time start, time end, capacity
- send notifications to all the people part of the meeting
- use a calendar to track the meetings

### Design

- User
  - name - String
  - calendar - Calendar
  - email - String
- Meeting
  - id - String
  - capacity - Integer
  - timeSlot - TimeSlot
  - participants - Participant[]
- MeetingRoom
  - id - String
  - capacity - Integer
  - calendar - Calendar
- TimeSlot
  - startTime - Time
  - endTime - Time
- MeetingRoomSelectionStrategy
  - meetingRooms - MeetingRoom[]
  - meeting - Meeting
- Calendar
  - slots - TimeSlot[]
- we can use strategy design pattern here. one strategy can be to -
  - first filter out rooms with capacity >= from that of the meeting
  - then filter rooms with no time overlap with the meeting's time
    ```
    for timeSlot in (all timeSlots of a meetingRoom):

      meeting.startTime <= timeSlot.startTime and meeting.endTime > timeSlot.StartTime:
        there is an overlap

      meeting.startTime < timeSlot.endTime and meeting.endTime > timeSlot.endTime:
        there is an overlap

    there is no overlap
    ```
- add logic for "observer pattern" and "strategy pattern" for the method of notification. borrow concepts discussed in [notification system](#notification-system) but skip details around clients etc

## Retry Handler

- requirement - track api calls and failures using different backoff strategies. enforce time and retry limits
- BackoffStrategy - 
  - calculateDelay(baseDelay - Long, attemptNumber - Integer) -> Long
- this strategy design pattern can have multiple implementations - 
  - fixed always returns the base delay
  - exponential doubles the delay for every retry - (delay * 2^(retryNumber - 1))
  - jitter adds the retry attempt number to the delay
- note - jitter can be modelled using the decorator pattern over both fixed and exponential - it simply adds the retry number to the delay that these two return
- BackoffStrategyFactory - uses factory design pattern
  ```
  class BackoffStrategyFactory {

    private final Map<String, BackoffStrategy> strategies = new HashMap<>();

    BackoffStrategyFactory() {
      strategies.put("FIXED", new FixedBackoffStrategy());
      strategies.put("EXPONENTIAL", new ExponentialBackoffStrategy());
      strategies.put("JITTER", new JitterBackoffStrategy());
    }

    BackoffStrategy getStrategy(String strategyName) {
      return strategies.get(strategyName);
    }
  }
  ```
- RetryClassifier - not all errors need to be retried - e.g. we do not need to retry 4xx errors, only 5xx ones. it will extract the response body / response status code to make this decision
  - isRetryable(response - Response)
- additional - only retry an operation when it is idempotent. e.g. do not retry post requests which does not carry an idempotency key. get, put and delete should be idempotent by definition. so, maybe the retry classifier above can also accept the request object, for determining this part
- the delay is (calculatedDelay - (currentTime - lastRetryTime))
- RetryState - one instance per api call
  - attemptNumber - Integer
  - lastSeenTime - Long
  - state - State
  - ... more attributes as required ...
- we can use state design pattern, as the state of the call goes through success, retrying, exhausted, etc statuses
- RetryConfig
  - maxAttempts
  - maxTotalTime
- RetryHandler
  - compose using BackoffStrategy, RetryConfig, RetryClassifier
  - hold a map of (ConcurrentMap for thread safe) of callId -> RetryState
  - execute(Callback) -> T - here T is the return type of the callback generic. this function basically retries using an infinite loop and exits once the retry limit is reached or total time is exhausted
- some points about time - 
  - prefer using monotonic clocks and not system time
  - try passing it as an argument so that it can be mocked for tests - we cannot wait for seconds or minutes when running tests to test all scenarios

## TODO

- hash map - https://www.youtube.com/watch?v=Oyijb2kXnbo
- design unix search - https://codezym.com/question/14-design-unix-find-command-file-search
