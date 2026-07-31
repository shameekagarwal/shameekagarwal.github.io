---
title: Multithreading Examples
math: true
---

## Producer Consumer

### Approach 1

- blocking queue - blocks enqueue if no more capacity in the queue to add a new item / block dequeue if there are no items in the queue
- if size of queue is 0 during dequeue / size of queue is same as capacity during enqueue - we call wait on the current thread
- additionally, it notifies a blocked enqueuing thread when space becomes available and a blocked dequeuing thread when an item becomes available in the queue
- we use synchronized to ensure multiple threads are not touching the queue, size variable, etc at one time
- why notify all - it might happen that a producer thread adds an item and becomes full, and calling notify wakes up another producer thread. this would cause a deadlock situation

```
class BlockingQueue<T> {

  private final int capacity;
  private final T[] queue;
  private int size;
  private int head;
  private int tail;

  @SuppressWarnings("unchecked")
  BlockingQueue(int capacity) {
    this.capacity = capacity;
    this.size = 0;
    head = 0;
    tail = 0;
    this.queue = (T[]) new Object[capacity];
  }

  public synchronized void enqueue(T item) throws InterruptedException {

    while (size == capacity) {
      wait();
    }

    queue[tail] = item;
    tail = (tail + 1) % capacity;
    size += 1;
    Thread.sleep(500);

    notifyAll();
  }

  public synchronized T dequeue() throws InterruptedException {

    while (size == 0) {
      wait();
    }

    T item = queue[head];
    queue[head] = null;
    head = (head + 1) % capacity;
    size -= 1;
    Thread.sleep(100);

    notifyAll();

    return item;
  }
}
```

### Approach 2

- we can also use a semaphore - it blocks when we try to (acquire when it has no permits / release when none of the permits are in use). however, note that java's semaphore can be released even if none of the permits have been used
- so, we would instead use `CountingSemaphore` that we implement [here](#semaphore)
- we use two semaphores - one for producer and one for consumer
  - producer semaphore - each permit allows a producer to produce an item. intuition - since we can produce upto capacity items before even a single item is consumed, we initialize it as capacity
  - consumer semaphore - each permit allows a consumer to consume an item. intuition - since it cannot consume an item at the beginning, we initialize it as 0
- we also need an additional mutex (synchronized equivalent of the first approach) so that multiple threads do not modify the queue, size, etc concurrently

```
class BlockingQueue<T> {

  private final int capacity;
  private final T[] queue;
  private int size;
  private int head;
  private int tail;
  private CountingSemaphore producerSemaphore;
  private CountingSemaphore consumerSemaphore;
  private Lock lock;

  @SuppressWarnings("unchecked")
  BlockingQueue(int capacity) {
    this.capacity = capacity;
    this.size = 0;
    head = 0;
    tail = 0;
    this.queue = (T[]) new Object[capacity];
    producerSemaphore = new CountingSemaphore(capacity, capacity);
    consumerSemaphore = new CountingSemaphore(capacity, 0);
    lock = new ReentrantLock();
  }

  public void enqueue(T item) throws InterruptedException {

    producerSemaphore.acquire();

    lock.lock();

    queue[tail] = item;
    tail = (tail + 1) % capacity;
    size += 1;
    Thread.sleep(500);

    lock.unlock();

    consumerSemaphore.release();
  }

  public synchronized T dequeue() throws InterruptedException {

    consumerSemaphore.acquire();

    lock.lock();

    T item = queue[head];
    queue[head] = null;
    head = (head + 1) % capacity;
    size -= 1;
    Thread.sleep(100);

    lock.unlock();

    producerSemaphore.release();

    return item;
  }
}
```

## Rate Limiter - Token Bucket

### Approach 1

- my understanding - question is slightly different i.e. it does not drop or reject requests
- if no token is available, then the threads stay blocked till one is available
- we need not create a background thread to fill the bucket. if we know when the token bucket was instantiated and when a consumer called get token, we can take the difference of the two instants and know the number of tokens that would have collected so far
- consumers call the get token function, and once the function call returns, we know that the consumer has been allowed
- note how we use synchronized to achieve thread safety
- if no tokens are remaining, a sleep is triggered till the bucket has 1 token

```
class TokenBucketRateLimiter {

  private int capacity;
  private int current = 0;
  private long lastFill = 0;
  private double rate;

  TokenBucketRateLimiter(int capacity, double rate) {
    this.capacity = capacity;
    this.rate = rate;
  }

  synchronized void getToken() {

    try {

      long secondsPassed = (System.currentTimeMillis() - lastFill) / 1000;
      long newTokens = (long) Math.floor(secondsPassed * rate);

      current = (int) Math.min(capacity, current + newTokens);

      if (current == 0) {
        int timeForNextToken = (int) Math.ceil(((1 / rate) - secondsPassed) * 1000);
        Thread.sleep(timeForNextToken);
        current += 1;
      }

      current -= 1;
      lastFill = System.currentTimeMillis();
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
}
```

### Approach 2

- the other way is to have a daemon thread that actually keeps filling the bucket
- this way, we do not need to track the last refill time etc
- this uses the wait / notify method
- notice how we use synchronized inside the infinite loop of the daemon thread, so that it can acquire the lock, refill the bucket and then release the lock for the consumer threads. also, it goes to sleep till its time for it to refill the next token. i think it calls notify so that only one of the consumer threads can be woken up and not all
- the consumer is also super simple now - just call wait and the moment a token is available, use it

```
class TokenBucketRateLimiter {

  private long current = 0;
  private int capacity;
  private int secondsPerToken;

  public TokenBucketRateLimiter(int capacity, int timePerToken) {

    this.capacity = capacity;
    this.secondsPerToken = timePerToken;

    Thread filler = new Thread(this::filler);
    filler.setDaemon(true);
    filler.start();
  }

  private void filler() {

    while (true) {

      synchronized (this) {
        if (current < capacity) {
          current += 1;
        }
        this.notify();
      }

      try {
        Thread.sleep(secondsPerToken * 1000);
      } catch (InterruptedException e) {
        throw new RuntimeException(e);
      }
    }
  }

  synchronized void getToken() throws InterruptedException {
    while (current == 0) {
      wait();
    }
    current -= 1;
  }
}
```

- additional note - never start a thread inside the constructor
- why - filler method might try using `this` even before the object is fully instantiated properly
- solution - factory design pattern. make the constructor of this private, and a factory class takes care of instantiating, creating the daemon thread, etc 

## Thread Safe Deferred Callback 

- a thread safe class that allows registration of callbacks that are executed after a specified time interval has elapsed
- naive solution - "busy wait" - the thread keeps checking if the thread is ready to be executed
- we maintain a "priority queue" of callbacks, ordered by the time remaining for their execution
  ```
  class Callback {

    private Runnable runnable;

    private long executeAt;

    public Callback(Runnable runnable, int executeAfter) {
      this.runnable = runnable;
      this.executeAt = System.currentTimeMillis() + (executeAfter * 1000);
    }

    public Runnable getRunnable() {
      return runnable;
    }

    public long getExecuteAt() {
      return executeAt;
    }
  }

  class CallbackComparator implements Comparator<Callback> {

    @Override
    public int compare(Callback o1, Callback o2) {
      return o1.getExecuteAt() > o2.getExecuteAt() ? 1 : -1;
    }
  }
  ```
- the execution thread can sleep for the specified time interval for the callback
- however, the sleep duration can change - assume a callback came with a delay of 30 minutes. after say 5 minutes, a new callback comes with a delay of 5 minutes. the execution thread should wake up and execute this callback first
- this is why i think a regular sleep might not be enough
- structure (might not be clear as part of the requirements) - we need to have a separate "execution thread" that keeps polling the priority queue and executing the callbacks from it. on the other hand, several threads can keep adding callbacks to this deferred callback (we can call it "consumer threads")
- we need some kind of communication mechanism between the consumer threads - so, we use wait and notify
- for adding a callback to the queue, we obtain the lock, notify the execution thread and finally release the lock
  ```
  class DeferredCallbackExecutor {

    private PriorityQueue<Callback> pq = new PriorityQueue<>(new CallbackComparator());

    private Lock lock = new ReentrantLock();
    private Condition condition = lock.newCondition();

    public void add(Callback callback) {
      lock.lock();
      pq.add(callback);
      condition.signal();
      lock.unlock();
    }

    // ... execute method
  }
  ```
- for the execution thread, it initially waits while the queue is empty
- then, it waits using a timeout, which is calculated using the time interval specified when registering the callback
- now, if no new callbacks come or a callback with a greater time interval comes, the execution continues as normal
- however, if a callback with a smaller timeout comes, (the example used below, observe the output carefully), the wait is signalled, the wait duration is recalculated. after this, the new callback is executed. then, a new pass of the infinite loop happens where the new wait duration is calculated and finally the initial callback is executed
  ```
  public void execute() {

    try {

      while (true) {

        lock.lock();

        while (pq.size() == 0) {
          condition.await();
        }

        while (pq.peek().getExecuteAt() > System.currentTimeMillis()) {
          int waitFor = (int) (pq.peek().getExecuteAt() - System.currentTimeMillis());
          System.out.printf("waiting for %dms\n", waitFor);
          condition.await(waitFor, TimeUnit.MILLISECONDS);
        }

        Callback callback = pq.remove();
        lock.unlock();

        callback.getRunnable().run();
      }
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }
  ```

## Semaphore

- java's semaphore is initialized with "initial permits" and not "maximum permits"
- so, we would create our own semaphore implementation
- we use the synchronized keyword for both acquire and release methods. this way, the `usedPermits` would be correctly incremented or decremented
- a thread needs to be blocked when it tries to acquire a permit, when `usedPermits == maxPermits`
- similarly, a thread needs to be blocked when it tries to release a permit, when `usedPermits == 0`

```
class CountingSemaphore {

  private int usedPermits;
  private int maxPermits;

  CountingSemaphore(int maxPermits) {
    this.maxPermits = maxPermits;
    this.usedPermits = 0;
  }

  public synchronized void acquire() throws InterruptedException {

    while (usedPermits == maxPermits) {
      wait();
    }

    usedPermits += 1;
    notifyAll();
  }

  public synchronized void release() throws InterruptedException {

    while (usedPermits == 0) {
      wait();
    }

    usedPermits -= 1;
    notifyAll();
  }
}
```

## Read Write Lock

- the lock should let multiple readers read at a time, but only one writer write at a time
- so, we would need 4 different methods - `acquireReadLock`, `releaseReadLock`, `acquireWriteLock` and `releaseWriteLock`
- before we allow a reader to enter the critical section, we need to make sure that there's no writer in progress. it is okay to have other readers in the critical section since they aren't making any modifications. similarly, before we allow a writer to enter the critical section, we need to make sure that there's no reader or writer in the critical section
- we can maintain a boolean for the writer since we only have one, while we can maintain a count for the readers
- note how all methods are synchronized, so all the updates would be atomic

```
class ReadWriteLock {

  private boolean isWriterLocked;
  private int readersCount;

  public synchronized void acquireRead() throws InterruptedException {

    while (isWriterLocked) {
      wait();
    }

    readersCount += 1;
  }

  public synchronized void releaseRead() {    
    readersCount -= 1;
    notifyAll();
  }

  public synchronized void acquireWrite() throws InterruptedException {

    while (isWriterLocked || readersCount > 0) {
      wait();
    }

    isWriterLocked = true;
  }

  public synchronized void releaseWrite() {
    isWriterLocked = false;
    notifyAll();
  }
}
```

## Unisex Bathroom Problem

- constraints - 
  - there cannot be men and women in the bathroom at the same time
  - there should never be more than three employees in the bathroom simultaneously
- using `inUseBy`, we maintain which gender is using the bathroom currently
- lets say we also need to create a `useBathroom` function which needs to be called, and it can have a sleep of a few seconds to simulate using of the bathroom
- now, we cannot simply mark the whole method as synchronized, as that would mean say the lock would be acquired while a gents is using the bathroom. so, another gents cannot enter during that time. so, we need to use fine grained locking
- notice how we handle making the gender as none when occupants become 0

```
enum Gender {
  MALE, FEMALE
}

class Bathroom {

  private Gender occupiedBy = null;
  private int occupants = 0;

  private void useBathroom() throws InterruptedException {
    System.out.println("bathroom use start");
    Thread.sleep(1000);
    System.out.println("bathroom use complete");
  }

  public void occupyMale() throws InterruptedException {

    synchronized (this) {

      while (Gender.FEMALE.equals(occupiedBy) || (occupants == 3)) {
        wait();
      }

      occupiedBy = Gender.MALE;
      occupants += 1;
    }

    useBathroom();

    synchronized (this) {

      occupants -= 1;

      if (occupants == 0) {
        occupiedBy = null;
      }

      notifyAll();
    }
  }

  public void occupyFemale() throws InterruptedException {

    synchronized (this) {

      while (Gender.MALE.equals(occupiedBy) || (occupants == 3)) {
        wait();
      }

      occupiedBy = Gender.FEMALE;
      occupants += 1;
    }

    useBathroom();

    synchronized (this) {

      occupants -= 1;

      if (occupants == 0) {
        occupiedBy = null;
      }

      notifyAll();
    }
  }
}
```

## Barrier

- barriers allow multiple threads to converge at a point before any one of the threads is allowed to move forward
- java provides libraries which make the barrier construct available for developer use, but we would implement our own
- we would need a variable to track the number of threads that have arrived at the barrier
- the first while loop helps ensure that any new incoming threads are not allowed till the previous "batch" has finished
- we increment the count of current threads
- we need to ensure that the count is reset to 0 only after all the threads that are a part of the barrier have finished executing
- so, we use an extra released variable, and the counter is reset only after all threads that were a part of the barrier have completed
- now, when we reset the counter to 0 and then call notify all, there might be a few threads already waiting - they would have now failed the while loop for `count == totalThreads`, and gone straight to execute the remaining stuff. so, we need another wait here for such threads using `while (count < totalThreads)`
  ```
  class Barrier {

    private int currentThreads = 0;
    private int totalThreads;
    private int releasedThreads;

    Barrier(int totalThreads) {
      this.totalThreads = totalThreads;
    }

    public synchronized void execute() throws InterruptedException {

      while (currentThreads == totalThreads) {
        wait();
      }

      currentThreads += 1;

      if (currentThreads == totalThreads) {
        notifyAll();
        releasedThreads = totalThreads;
      } else {
        while (currentThreads < totalThreads) {
          wait();
        }
      }

      releasedThreads -= 1;

      if (releasedThreads == 0) {
        currentThreads = 0;
        notifyAll();
      }
    }
  }
  ```

## Dining Philosophers

- imagine you have five philosophers sitting on a round table
- the philosophers do only two kinds of activities - contemplate and eat
- however, they have only five forks between themselves to eat their food with
- each philosopher requires both the fork to his left and the fork to his right to eat his food
- we need a solution where each philosopher gets a chance to eat his food without causing a deadlock
- with five forks, only two philosophers can eat at a time
- naive solution - results in a deadlock. e.g. if all philosophers grab their left fork, none of them would be able to eat 

```
class DiningPhilosophers {

  private Semaphore[] forks = new Semaphore[5];

  public DiningPhilosophers() {
    for (int i = 0; i < 5; i++) {
      forks[i] = new Semaphore(i);
    }
  }

  public void lifecycleOfPhilosopher(int id) throws InterruptedException {
    while (true) {
      contemplate();
      eat(id);
    }
  }

  void contemplate() throws InterruptedException {
    Thread.sleep(500);
  }

  void eat(int id) throws InterruptedException {

    forks[id].acquire();
    forks[(id + 4) % 5].acquire();

    System.out.printf("philosopher %d is eating\n", id);

    forks[id].release();
    forks[(id + 4) % 5].release();
  }
}
```

### Solution 1

- allow only 4 philosophers at any given time to even try to acquire forks
- a deadlock is impossible as even if each philosopher grabs one fork, there will still be one fork left that can be acquired by one of the philosophers to eat
- we use a semaphore with 4 permits to achieve this

```
private Semaphore maxDiners = new Semaphore(4);

// ...

void eat(int id) throws InterruptedException {

  maxDiners.acquire();

  forks[id].acquire();
  forks[(id + 1) % 5].acquire();

  System.out.printf("philosopher %d is eating\n", id);

  forks[id].release();
  forks[(id + 1) % 5].release();

  maxDiners.release();
}
```

### Solution 2

- make any one of the philosophers pick up the left fork first instead of the right one

```
// ...
if (id == 3) {
  forks[id].release();
  forks[(id + 1) % 5].release();
} else {
  forks[(id + 1) % 5].release();
  forks[id].release();
}
// ...
```

## Multithreaded Merge Sort

```
if (start == end) {
  return;
}

int mid = (start + end) / 2;

Thread worker1 = new Thread(() -> mergeSort(start, mid, input));
Thread worker2 = new Thread(() -> mergeSort(mid + 1, end, input));

worker1.start(); worker2.start();

worker1.join(); worker2.join();

merge(arr, start, end)
```

## Asynchronous to Synchronous

- imagine we have an executor method that performs some useful task asynchronously
- in addition, the method accepts an object which implements the runnable interface
- the object's run gets invoked when the asynchronous execution is done
- here is the original code / situation -
  ```
  class AsynchronousExecutor {

    public void execute(Runnable runnable) {

      Thread thread = new Thread(() -> {
        try {
          Thread.sleep(5000);
        } catch (Exception e) {
          throw new RuntimeException(e);
        }
        System.out.println("asynchronous task completed");
        runnable.run();
      });

      thread.start();
    }
  }

  class Main {

    static void main() {
      AsynchronousExecutor executor = new AsynchronousExecutor();
      executor.execute(() -> System.out.println("callback invoked"));
      System.out.println("completed main thread");
    }
  }

  completed main thread
  asynchronous task completed
  callback invoked
  ```
- task - make the execution synchronous without changing the original classes
- solution - we can either use semaphore, or wait / notify
- i am extending the executor (like adapter / facade pattern i guess). this way, only change for client side is to use this instead - `AsynchronousExecutor executor = new SynchronousExecutor();`
  ```
  class SynchronousExecutor extends AsynchronousExecutor {

    @Override
    public void execute(Runnable runnable) {

      boolean[] isComplete = new boolean[]{false};
      Object lock = new Object();

      try {
        super.execute(() -> {

          runnable.run();

          synchronized (lock) {
            isComplete[0] = true;
            lock.notify();
          }
        });

        synchronized (lock) {
          while (!isComplete[0]) {
            lock.wait();
          }
        }
      } catch (Exception e) {
        throw new RuntimeException(e);
      }
    }
  }

  asynchronous task completed
  callback invoked
  completed main thread
  ```
- why do we make `isDone` as an array - because otherwise, it throws the following error - `local variable isComplete defined in an enclosing scope must be final or effectively final`

## Non Blocking Stack

- TODO - https://www.educative.io/courses/java-multithreading-for-senior-engineering-interviews/nonblocking-stack
