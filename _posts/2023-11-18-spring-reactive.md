---
title: Spring Reactive
---

## Project Reactor

- traditional approach - **one thread per request**. issues - 
  - there a lot of **io tasks**, e.g. calls to database, file system access, calling other microservices, etc. these io tasks **block** the threads
  - each thread **consumes resources**, so for 400 concurrent requests, we would end up consuming the resources for 400 threads
- recall how javascript works - once for e.g. web apis have successfully completed the io task, they place the callback on the (micro task / job) queue or (callback / task) queue. then, the event loop picks it from there and places it on the stack
- different paradigms - 
  - sync + blocking - we make an io call and wait for it to be finished
  - async - we delegate the work to a separate thread, which now has to first make the io call and then wait for the call to be finished
  - non blocking - we make the io call are notified automatically when the io task is over. we do not have to wait for the io call. i feel this is javascript
  - async + non blocking - even the non blocking call is delegated to a separate thread i.e. the separate thread makes the io call, and then is notified automatically when the io task is over. i feel this is what we are trying to achieve using project reactor
- **observer pattern** is used. react as and when a new message is received
  - `Publisher` publishes updates
  - `Subscriber` subscribes for updates
  - publisher has a `subscribe` method, which receives a subscriber
  - a `Subscription` object establishes this relationship. this is returned from `subscribe`
  - subscriber has the following callbacks which a publisher can call - 
    - `onNext` for new data
    - `onComplete` when the publisher work is done. no more new data would be sent
    - `onError` for error. in this case also, no more new data would be sent
- synonyms 
  - publisher, observable, source, upstream, producer
  - subscriber, observer, sink, downstream, consumer
- i think we also move to a more **declarative style** of coding instead of the usual **imperative style** when we use the reactive programming model
- **reactive streams** - a specification just like jpa
- some implementations of reactive streams - 
  - akka
  - rxjava
  - project reactor (this is covered)
- so, i think we have four things now - asynchronous, non blocking, observer pattern and declarative style of coding
- project reactor has two different implementations of publisher - `Mono` and `Flux`
- mono can emit 0 or 1 item
- i think 0 means publisher can call `onComplete` directly before `onNext`
- flux can emit 0 to n items
- analogy - mono is `null`, `Optional`, flux is `List`, `Stream`
  ```java
  Mono<Integer> mono$ = Mono.just(1);

  // only onNext callback is provided
  mono$.subscribe(i -> System.out.println("received: " + i));

  // providing onNext, onError, onComplete
  mono$.subscribe(
    (i) -> System.out.println("received: " + i),
    (e) -> System.out.println("error: " + e.getMessage()),
    () -> System.out.println("completed")
  );
  ```
- use - 
  - `Mono.just(val)` for one value
  - `Mono.empty()` for no values
  - `Mono.error(error)` for an exception
- `Mono.just(randomName())` - randomName is always called, even if not used
- to prevent this, we can use `Mono.fromSupplier(() -> randomName())`
- _this way of thinking has been reused when discussing using blocking spring data jpa with reactive webflux later!_
- **lazy** - nothing happens till we subscribe, any statements inside the mono, chained map, etc would not be run till we subscribe to it
- execute synchronously - use block
  ```java
  String capitalizedName = Mono.just(faker.name().fullName())
    .map(name -> {
      Util.sleep(5);
      return name.toUpperCase();
    })
    .block();
  ```
- from future - `Mono.fromFuture(future)`
- from runnable - `Mono.fromRunnable(runnable)`. note - since runnable does not return anything, in this case, only on complete would be called, not on next. so, we can also use fromRunnable as an alternative to fromSupplier when our method does not have any return value
- i think the main reason for `fromFuture`, `fromRunnable` etc is to help with interoperability
- just like mono, we have `just` in flux, but it accepts varargs - `Flux.just(1, 2, 3)`
- `fromIterable` in flux - 
  ```java
  Flux.fromIterable(List.of(
    faker.name().fullName(),
    faker.name().fullName(),
    faker.name().fullName()
  ));
  ```
- java streams can be only consumed once - 
  ```java
  Stream<Integer> intStream = Stream.of(1, 2, 3);
  
  // 1 2 3
  intStream.forEach(System.out::println);

  // java.lang.IllegalStateException: stream has already been operated upon or closed
  intStream.forEach(System.out::println);
  ```
- we know that traditionally, a flux can have multiple subscribers (discussed later in hot vs cold). but if using `fromStream`, if the same stream is used, we get the same error as described above - 
  ```java
  Stream<Integer> intStream = Stream.of(1, 2, 3);
  Flux<Integer> intFlux = Flux.fromStream(intStream);

  intFlux.subscribe(...) // works
  intFlux.subscribe(...) // will fail with the same exception
  ```
- utility method `range`, e.g. 10 items - 
  ```java
  Flux<String> names$ = Flux.range(1, 10)
    .map((i) -> faker.name().fullName());
  ```
- `log` explained - if we chain log to above example like so -  
  ```java
  Flux<String> names$ = Flux.range(1, 10)
    .log()
    .map((i) -> faker.name().fullName())
    .log();
  
  names$.subscribe((t) -> System.out.println("on next: " + t));
  ```
- output - since we have two logs, the first one of every pair is for the first log, and the second one for the second log
  ```
  [ INFO] (main) | onSubscribe([Synchronous Fuseable] FluxRange.RangeSubscription) // line 3's subscription
  [ INFO] (main) | onSubscribe([Fuseable] FluxMapFuseable.MapFuseableSubscriber) // line 6's subscription
  [ INFO] (main) | request(unbounded) // for line 3
  [ INFO] (main) | request(unbounded) // for line 6
  [ INFO] (main) | onNext(1) // what line 3's subscriber's onNext is called with
  [ INFO] (main) | onNext(Derek Aufderhar) // what line 6's subscriber's onNext is called with
  on next: Derek Aufderhar
  [ INFO] (main) | onNext(2)
  [ INFO] (main) | onNext(Chantell Kuvalis)
  on next: Chantell Kuvalis
  [ INFO] (main) | onNext(3)
  [ INFO] (main) | onNext(Lonnie Pollich)
  on next: Lonnie Pollich
  ```
- using a custom subscriber. important note - look how we have to call `request` manually now. this was being done bts automatically for us. note - i also had to call `cancel` manually, otherwise `onComplete` was not being called
  ```java
  AtomicReference<Subscription> subscriptionAtomicRef = new AtomicReference<>();

  Flux.range(1, 5)
    .subscribeWith(new Subscriber<Integer>() {
      @Override
      public void onSubscribe(Subscription subscription) { subscriptionAtomicRef.set(subscription); }

      @Override
      public void onNext(Integer integer) { System.out.println("on next: " + integer); }

      @Override
      public void onError(Throwable throwable) { System.out.println("on error: " + throwable.getMessage()); }

      @Override
      public void onComplete() { System.out.println("on complete"); }
    });

  subscriptionAtomicRef.get().request(5);
  Util.sleep(5);
  subscriptionAtomicRef.get().cancel();
  ```
- another note - see how we set `subscriptionAtomicRef`. this is because we wanted to control it from outside the subscription, not inside
- central difference between a normal list and flux - **in flux, since we have implemented the observer pattern, we will get items as they are available, while in list, the entire structure has to be available at one go**
- interval - emit an item every specified duration - 
  ```java
  Flux<String> names$ = Flux.interval(Duration.ofSeconds(1))
    .map(i -> Util.faker.name().fullName());
  names$.subscribe(...);
  Util.sleep(5); // to block main thread
  ```
- inter conversion between flux and mono - 
  ```java
  Mono<Integer> fluxToMono = Flux.range(1, 10).next();
  Flux<Integer> monoToFlux = Flux.from(Mono.just(1));
  ```
- take operator - 
  ```java
  Flux.range(1, 3)
    .log()
    .take(2)
    .log()
    .subscribe(t -> System.out.println("on next: " + t));
  ```
- output - see last two lines specially - since we call take, the take calls cancel on its own subscription, and calls on complete for anything thats its downstream
  ```
  [ INFO] (main) | onSubscribe([Synchronous Fuseable] FluxRange.RangeSubscription)
  [ INFO] (main) onSubscribe(FluxLimitRequest.FluxLimitRequestSubscriber)
  [ INFO] (main) request(unbounded)
  [ INFO] (main) | request(2)
  [ INFO] (main) | onNext(1)
  [ INFO] (main) onNext(1)
  on next: 1
  [ INFO] (main) | onNext(2)
  [ INFO] (main) onNext(2)
  on next: 2
  [ INFO] (main) | cancel()
  [ INFO] (main) onComplete()
  ```
- `flux.create` - we can manually call `next`, `complete`, `error` on flux sink. emit a country till we encounter canada - 
  ```java
  Flux<String> country$ = Flux.create(fluxSink -> {
    String country;
    do {
      country = Util.faker.country().name();
      fluxSink.next(country);
    } while (!"canada".equalsIgnoreCase(country) && !fluxSink.isCancelled());
    fluxSink.complete();
  });
  ```
- note - had we not called `fluxSink.isCancelled`, when the subscriber would have called cancel on its subscription, the flux sink would have continued emitting items. the subscriber would not have cared, since it has already called its on complete. but resources are still being consumed by the publisher itself
- so, one small confusion i had probably cleared - if we call `subscription.cancel()`, it does not guarantee that publisher would stop running - so i think **it is the job of the producer** to kep checking if subscription has been cancelled, and if it has, it should stop emitting items?
- in create, we have to check  manually if the downstream is cancelled, and we have a lot of flexibility in terms of emitting items. in generate, feels like we can emit items in only "one way". the method will be automatically called for us infinitely till we use something like take, cancel the subscription, call `synchronousSink.complete()`, etc. it makes code more concise, and checks like is cancelled is not needed - 
  ```java
  Flux<Object> names$ = Flux.generate(synchronousSink -> synchronousSink.next(Util.faker.name().fullName()))
    .take(5);
  // emit 5 items
  // then cancel subscription and trigger on complete
  ```
- how to emit a country till we encounter canada using generate - 
  ```java
  Flux<Object> country$ = Flux.generate(synchronousSink -> {
    String country = Util.faker.country().name();
    synchronousSink.next(country);
    if ("canada".equalsIgnoreCase(country)) synchronousSink.complete();
  });
  ```
- so, generate vs create - 
  - function passed to create will be invoked only once, function passed to generate would be invoked multiple times
  - create will not take into account downstream demand subscription cancellation etc, generate will
- one small issue with generate that was not in create - state. how can we implement state, that is persisted and available "across" executions? recall the lambda of create is only triggered once i.e. we wrote the loop manually, so we can have the state outside the loop and modify it as needed inside the loop. in generate, the lambda is triggered automatically for us bts, so we cannot do that. one method - outside the flux. but flux generate does provide us state capabilities as well. e.g. emit countries till canada is encountered or we reach the limit (10)
  ```java
  // method 1 - maintain state manually
  AtomicInteger state = new AtomicInteger(1);
  Flux<String> country$ = Flux.generate((sink) -> {
    String country = Util.faker.country().name();
    sink.next(country);
    if ("canada".equalsIgnoreCase(country) || state.getAndIncrement() == 10) sink.complete();
  });

  // method 2 - using flux state
  Flux<String> country$ = Flux.generate(
    () -> 1, // initial state
    (state, sink) -> {
      String country = Util.faker.country().name();
      sink.next(country);
      if ("canada".equalsIgnoreCase(country) || state == 10) sink.complete();
      return state + 1;
    }
  );
  ```
- handle - it accepts a function which is called once per item, and also has the sink. so we can call complete, next, error etc whatever we want. it feels like a supercharged filter / map, which looks like generate
  ```java
  Flux<String> handle$ = Flux
    .generate((SynchronousSink<String> sink) -> sink.next(Util.faker.country().name()))
    .handle((item, sink) -> {
      sink.next(item);
      if ("canada".equalsIgnoreCase(item)) sink.complete();
    });
  ```
- we have multiple callbacks / lifecycle hooks - 
  ```java
  Flux<Integer> numbers$ = Flux.range(1, 10)
    .doOnComplete(() -> System.out.println("do on complete"))
    .doFirst(() -> System.out.println("do first"))
    .doOnNext((i) -> System.out.println("do on next " + i))
    .doOnSubscribe((subscription) -> System.out.println("do on subscribe"))
    .doOnRequest((number) -> System.out.println("do on request " + number))
    .doOnError((throwable) -> System.out.println("do on error " + throwable.getMessage()))
    .doOnTerminate(() -> System.out.println("do on terminate"))
    .doFinally((signalType) -> System.out.println("do finally " + signalType));
  ```
- limit rate - e.g. not all the data is loaded in facebook at one go. as and when we scroll down, more content is loaded. similarly with limit rate, instead of the subscription calling request(unbounded), the subscription calls request(specified_number). once 75% of the specified_number is consumed by the subscriber, more request(specified_number - consumed_items) amount of items are added. so, its like a buffer of maximum specified_number is maintained, which is filled back up when 75% of it is consumed. limit rate also accepts a second argument to customize the 75%, not discussed here
  ```java
  Flux.range(1, 100)
    .log()
    .limitRate(10);
  ```
- output - 
  ```
  [ INFO] (main) | onSubscribe([Synchronous Fuseable] FluxRange.RangeSubscription)
  [ INFO] (main) | request(10) -- fill the queue with 10 items
  [ INFO] (main) | onNext(1)
  [ INFO] (main) | onNext(2)
  ...
  [ INFO] (main) | onNext(8)
  [ INFO] (main) | request(8) -- 75% consumed, request enough to fill the queue with 10 items
  [ INFO] (main) | onNext(9) 
  ```
- handling errors - we already know that we can provide an on error callback from a subscriber. but to handle it in the pipeline itself - 
  - on error return - a hardcoded fallback value would be returned - 
    ```java
    Flux.range(1, 100)
      .map(i -> 10 / (3 - i))
      .onErrorReturn(-1);
    // 5 -> 10 -> -1 -> onComplete (not onError)
    ```
  - on error resume - a different publisher i.e. flux / mono would be resumed from the point of error - 
    ```java
    Flux.range(1, 100)
      .map(i -> 10 / (3 - i))
      .onErrorResume((e) -> Flux.range(1, 3));
    // 5 -> 10 -> 1 -> 2 -> 3 -> onComplete (not onError)
    ```
  - on error continue - skip the item where the error occurred and continue processing the items. **important - in the two methods above, albeit we failed silently, the processing in the original flux was stopped as soon as the error occurred, unlike in on error continue**
    ```java
    Flux.range(1, 5)
      .map(i -> 10 / (3 - i))
      .onErrorContinue((error, obj) -> {
        // do whatever with error, obj
      });
    // 5 -> 10 -> -10 -> -5 ->  onComplete (not onError)
    ```
- handling empty - 
  - default if empty - a hardcoded value would be returned (like on error return)
    ```java
    Flux.range(1, 10)
      .filter(i -> i > 10)
      .defaultIfEmpty(-1);
    // -1
    ```
  - switch if empty - a different publisher i.e. flux / mono would be returned (like on error resume)
    ```java
    var integers$ = Flux.range(1, 10)
      .filter(i -> i > 10)
      .switchIfEmpty(Flux.range(-5, 5));
    // -5 -4 -3 -2 -1
    ```
- switch on first - first request(1) is called. the result of this gets sent to the function we pass to switch on first. based on this, our function can decide what to do. after this, request(unbounded) is called. i think it is useful when we want to make a decision based on the first element of the flux. e.g. if we find the first element has age < 20, return just one person(underage, the_age). else, return the entire list of people i.e. continue the original flux - 
  ```java
  Flux.range(1, 10)
    .map(i -> Person.generate())
    .log()
    .switchOnFirst((signal, personFlux) ->
      signal.isOnNext() && signal.get().getAge() < 20 ?
        Mono.just(new Person("underage", signal.get().getAge())) :
        personFlux
    );
  ```
- **transform** - useful when we have a set of operators that are duplicated in multiple pipelines. the function accepts `Flux<T>` and returns `Flux<R>`. idea is multiple pipelines can call transform with the same function, and these set of operators get applied to all of these pipelines
  ```java
  Flux.range(1, 10)
    .transform(TransformDemo::transformer);

  // ...
  private static Flux<Person> transformer(Flux<Integer> integers$) {
    return integers$.map(i -> Person.generate());
  }
  ```
- map - transform one element to another type. flat map - return a flux for an element. the subscriber still sees a stream of element. the flat map helps abstract away this complexity by "flattening" the flux. we try getting all persons, and for each person, we try getting all their orders, which itself is a flux. by using flat map, the subscriber just receives a stream of orders
  ```java
  Flux.range(1, 10)
    .map(i -> Person.generate())
    .flatMap(FlatMapDemo::getOrders);

  private static Flux<Order> getOrders(Person person) {
    return Flux.range(1, Util.faker.random().nextInt(4))
      .map(i -> Order.generate(person));
  }
  ```
- publisher emits data when a subscriber subscribes to the data. so till now, whatever we saw was a **cold publisher** - every subscriber has their own data
  ```java
  public class GenericSubscriber {

    public static <T> void subscribe(Flux<T> flux$, String subscriberName) {
      String thread = Thread.currentThread().getName();
      flux$.subscribe(
        (t) -> System.out.printf("[%s] %s> on next: %s%n", thread, subscriberName, t),
        (throwable) -> System.out.printf("[%s] %s> on error: %s%n", thread, subscriberName, throwable.getMessage()),
        () -> System.out.printf("[%s] %s> on complete%n", thread, subscriberName)
      );
    }
  }

  Flux<String> movie$ = Flux.range(1, 5)
    .delayElements(Duration.ofSeconds(1))
    .map((i) -> "stream " + i);
  GenericSubscriber.subscribe(movie$, "mike");
  Util.sleep(2);
  GenericSubscriber.subscribe(movie$, "sam");
  Util.sleep(50);
  ```
- output - 
  ```
  [main] mike> on next: stream 1
  [main] mike> on next: stream 2
  [main] mike> on next: stream 3
  [main] sam> on next: stream 1
  [main] mike> on next: stream 4
  [main] sam> on next: stream 2
  [main] mike> on next: stream 5
  [main] mike> on complete
  [main] sam> on next: stream 3
  [main] sam> on next: stream 4
  [main] sam> on next: stream 5
  [main] sam> on complete
  ```
- **hot publisher** - one data producer for all subscribers. the only difference here is line 4. share converts a cold publisher to hot publisher
  ```java
  Flux<String> movie$ = Flux.range(1, 5)
    .delayElements(Duration.ofSeconds(1))
    .map((i) -> "stream " + i)
    .share();
  GenericSubscriber.subscribe(movie$, "mike");
  Util.sleep(2);
  GenericSubscriber.subscribe(movie$, "sam");
  Util.sleep(50);
  ```
- output - 
  ```
  [main] mike> on next: stream 1
  [main] mike> on next: stream 2
  [main] mike> on next: stream 3
  [main] sam> on next: stream 3
  [main] mike> on next: stream 4
  [main] sam> on next: stream 4
  [main] mike> on next: stream 5
  [main] sam> on next: stream 5
  [main] mike> on complete
  [main] sam> on complete
  ```
- `share` basically is `publish().refCount(1)`. the argument passed to ref count basically tells the minimum number of subscribers required by the producer to start producing. in the above example, if we replace share by for e.g. `publish().refCount(2)`, the output would be as follows, because the producer will start producing only when the subscriber sam subscribes
  ```
  [main] mike> on next: stream 1
  [main] sam> on next: stream 1
  [main] mike> on next: stream 2
  [main] sam> on next: stream 2
  [main] mike> on next: stream 3
  [main] sam> on next: stream 3
  [main] mike> on next: stream 4
  [main] sam> on next: stream 4
  [main] mike> on next: stream 5
  [main] sam> on next: stream 5
  [main] mike> on complete
  [main] sam> on complete
  ```
- if we increase the sleep between mike and sam, we see sam starts receiving all the elements again! so, its almost like when a set of subscribers see to the end of a hot publisher, the hot publisher restarts
  ```java
  GenericSubscriber.subscribe(movie$, "mike");
  Util.sleep(7);
  GenericSubscriber.subscribe(movie$, "sam");
  Util.sleep(30);
  ```
- output - 
  ```
  [main] mike> on next: stream 1
  [main] mike> on next: stream 2
  [main] mike> on next: stream 3
  [main] mike> on next: stream 4
  [main] mike> on next: stream 5
  [main] mike> on complete
  [main] sam> on next: stream 1
  [main] sam> on next: stream 2
  [main] sam> on next: stream 3
  [main] sam> on next: stream 4
  [main] sam> on next: stream 5
  [main] sam> on complete
  ```
- example - 
  ```java
  Flux<Integer> flux$ = Flux.create((FluxSink<Integer> fluxSink) -> {
    Util.log("inside create");
    fluxSink.next(2);
  });

  flux$.subscribe((i) -> Util.log("subscribe " + i));
  flux$.subscribe((i) -> Util.log("subscribe " + i));
  ```
- output - 
  ```
  main: inside create
  main: subscribe 2
  main: inside create
  main: subscribe 2
  ```
- understand - all the process happens in the current thread - main
- schedulers available in reactive - 
  - bounded elastic - for networking / io time consuming tasks
  - parallel - for cpu intensive tasks
  - single - dedicated thread for tasks
  - immediate - current thread
- subscribe on - 
  ```java
  Flux<Integer> flux$ = Flux.create((FluxSink<Integer> fluxSink) -> {
    Util.log("inside create");
    fluxSink.next(2);
  })
    .subscribeOn(Schedulers.boundedElastic());

  flux$.subscribe((i) -> Util.log("subscribe " + i));
  flux$.subscribe((i) -> Util.log("subscribe " + i));
  ```
- output - 
  ```
  boundedElastic-2: inside create
  boundedElastic-1: inside create
  boundedElastic-2: subscribe 2
  boundedElastic-1: subscribe 2
  ```
- point to remember - scheduler does not mean execute my current pipeline in parallel. one pipeline execution still happens in one thread, e.g. boundedElastic-2. scheduler with subscribe on means that if for e.g. we have multiple subscribers, each of them would be executed in its own thread. recall how without the subscribe on, everything was happening inside the main thread
- also note how subscribe on effects the entire pipeline from top i.e. look at the thread name of "inside create"
- publish on - 
  ```java
  Flux<Integer> flux$ = Flux.create((FluxSink<Integer> fluxSink) -> {
    Util.log("inside create");
    fluxSink.next(2);
  })
  .publishOn(Schedulers.boundedElastic());

  flux$.subscribe((i) -> Util.log("subscribe " + i));
  flux$.subscribe((i) -> Util.log("subscribe " + i));
  ```
- output - 
  ```
  main: inside create
  main: inside create
  boundedElastic-1: subscribe 2
  boundedElastic-2: subscribe 2
  ```
- so, publish on only affected the downstream (whatever operators came after it) i.e. look at the thread name of "inside create". note how this behavior is different from what we saw inside subscribe on
- rule - subscribe on affects upstream and publish on affects downstream
- so, its almost like subscribe on will go over and hand its scheduler to the actual source. this way, all the operators after it are affected by subscribe on (until maybe a publish on is encountered)
- publish on is relatively simpler to visualize, since it affects all operators after it
- multiple subscribe on - 
  ```java
  Flux.range(1, 1)
    .subscribeOn(Schedulers.boundedElastic())
    .doOnNext((i) -> Util.log("inside on next 1"))
    .subscribeOn(Schedulers.parallel())
    .doOnNext((i) -> Util.log("inside on next 2"))
    .subscribe((i) -> Util.log("inside subscribe"));
  ```
- output - look how parallel was ignored, the one closer to the actual source gets executed. my understanding - this might be because **execution happens bottom to top**. its almost like the operator subscribe to the one above it and so on. so, maybe first, the second subscribe on hands on over its scheduler, and then the first subscribe on hands on over its scheduler, thus overwriting what the second scheduler did
  ```
  boundedElastic-1: inside on next 1
  boundedElastic-1: inside on next 2
  boundedElastic-1: inside subscribe
  ```
- multiple publish on - 
  ```java
  Flux.range(1, 1)
    .publishOn(Schedulers.boundedElastic())
    .doOnNext((i) -> Util.log("inside on next 1"))
    .publishOn(Schedulers.parallel())
    .doOnNext((i) -> Util.log("inside on next 2"))
    .subscribe((i) -> Util.log("inside subscribe"));
  ```
- output - the scheduler closest to before an operator gets used
  ```
  boundedElastic-1: inside on next 1
  parallel-1: inside on next 2
  parallel-1: inside subscribe
  ```
- combination of the two - 
  ```java
  Flux.range(1, 1)
    .doOnNext((i) -> Util.log("inside on next 1"))
    .publishOn(Schedulers.boundedElastic())
    .doOnNext((i) -> Util.log("inside on next 2"))
    .subscribeOn(Schedulers.parallel())
    .doOnNext((i) -> Util.log("inside on next 3"))
    .subscribe((i) -> {});
  ```
- output - 
  ```
  parallel-1: inside on next 1
  boundedElastic-1: inside on next 2
  boundedElastic-1: inside on next 3
  ```
- diagram -<br />
  ![schedulers](/assets/img/spring-reactive/schedulers.drawio.png)
- schedulers help run different instances of the same pipeline run in different threads. to process the items of a pipeline in parallel, we can use a combination of parallel and run on - 
  ```java
  Flux.range(1, 5)
    .parallel()
    .runOn(Schedulers.boundedElastic())
    .doOnNext((i) -> Util.log("inside on next " + i))
    .subscribe((i) -> {});
  ```
- output - scheduler has 4 threads probably because there are 4 cores in cpu -
  ```java
  boundedElastic-4: inside on next 4
  boundedElastic-3: inside on next 3
  boundedElastic-1: inside on next 1
  boundedElastic-1: inside on next 5
  boundedElastic-2: inside on next 2
  ```
- once we do parallel() like above, we would not have access to publish on, subscribe on, etc (which logically makes sense i think, because both are very different methods of achieving parallelism). to make the parallelized flux come back together, we can chain sequential - 
  ```java
  // compilation error
  .parallel()
  .runOn(Schedulers.boundedElastic())
  .subscribeOn(Schedulers.parallel())

  // works
  .parallel()
  .runOn(Schedulers.boundedElastic())
  .sequential()
  .subscribeOn(Schedulers.parallel())
  ```
- so, concepts we discussed - `subscribeOn()`, `publishOn()`, `.parallel().runOn()` and with it `.sequential()`
- publisher publishes at a faster rate than the consumer can consume. this is called **back pressure** / **overflow**
- overflow strategies in project reactor (basically `onBackPressure` prefix is constant, remaining suffixes have been mentioned below) - 
  - drop - once the queue is full, drop the remaining items. as simple as chaining on back pressure drop. optionally, this also accepts a callback, which receives the dropped value, which we can handle accordingly -
    ```java
    Flux.range(1, 500)
      .doOnNext((i) -> Util.sleepMillis(2))
      .onBackpressureDrop((i) -> Util.log("dropped " + i))
      .doOnNext((i) -> Util.log("produced " + i))
      .publishOn(Schedulers.boundedElastic())
      .doOnNext((i) -> Util.sleepMillis(5))
      .doOnNext((i) -> Util.log("consumed " + i))
      .subscribe((i) -> {});
    ```
  - latest - like drop, but **one latest value** keeps getting overwritten - so, just like drop but just that one latest value is present as well
  - error - an error is thrown to the downstream
  - buffer - the default. keep in memory. so, my understanding - the risk here is exceptions like out of memory. so, we can optionally configure a size like below. when the buffer limit is reached, `OverflowException` is thrown -
    ```java
    .onBackpressureBuffer(20)
    ```
- combining publishers - start with, concat, zip, merge, combine latest
- **start with** - start with the provided flux. when it gets over, start with the original flux. e.g. we generate random names (which assume is slow), so we add it to cache as well. in the second subscription, the first two names are received from the cache and are therefore quick
  ```java
  List<String> cache = new ArrayList<>();

  Flux<String> names$ = Flux
    .generate((SynchronousSink<String> sink) -> sink.next(Util.faker.name().fullName()))
    .doOnNext((i) -> Util.log("generating fresh name..."))
    .doOnNext(cache::add)
    .startWith(Flux.fromIterable(cache));

  GenericSubscriber.subscribe(names$.take(2), "sam");
  GenericSubscriber.subscribe(names$.take(3), "mike");
  ```
- output - 
  ```
  main: generating fresh name...
  [main] sam> on next: Dylan Kertzmann
  main: generating fresh name...
  [main] sam> on next: Cole Vandervort
  [main] sam> on complete
  [main] mike> on next: Dylan Kertzmann
  [main] mike> on next: Cole Vandervort
  main: generating fresh name...
  [main] mike> on next: Kandis Douglas
  [main] mike> on complete
  ```
- **concat** - like start with, but appends instead of prepending
  ```java
  Flux<String> one = Flux.just("a", "b", "c");
  Flux<String> two = Flux.just("d", "e");
  GenericSubscriber.subscribe(one.concatWith(two));
  // output - a b c d e
  ```
- we can also use an alternate syntax to combine at one go - `Flux.concat(one, two, three...)`. what if one of the flux we tried to perform concat on had an error? the subscriber would immediately halt with the error. however, we can push the error to the end i.e. after the emission from all the fluxes is over using `concatDelayError` - 
  ```java
  Flux<String> one = Flux.just("a", "b");
  Flux<String> two = Flux.error(new RuntimeException("oops..."));
  Flux<String> three = Flux.just("c");
  
  GenericSubscriber.subscribe(Flux.concat(one, two, three));
  // [main] > on next: a
  // [main] > on next: b
  // [main] > on error: oops...

  GenericSubscriber.subscribe(Flux.concatDelayError(one, two, three));
  // [main] > on next: a
  // [main] > on next: b
  // [main] > on next: c
  // [main] > on error: oops...
  ```
- remember - both in concact and in start with, we expect a flux to be over before jumping on to the next flux
- **merge** - merge all fluxes i.e. they will all simultaneously emit to the subscriber. they can all emit at their own rates, and the subscriber will receive all items from all fluxes
  ```java
  Flux<String> qatar$ = Flux
    .generate((SynchronousSink<String> sink) -> sink.next("Qatar " + Util.faker.random().nextInt(5)))
    .delayElements(Duration.ofSeconds(3));
  Flux<String> emirates$ = Flux
    .generate((SynchronousSink<String> sink) -> sink.next("Emirates " + Util.faker.random().hex()))
    .delayElements(Duration.ofSeconds(1));
  Flux<String> spiceJet$ = Flux
    .generate((SynchronousSink<String> sink) -> sink.next("Spice Jet " + Util.faker.random().nextInt(50000)))
    .delayElements(Duration.ofSeconds(2));

  Flux<String> flights$ = Flux.merge(qatar$, emirates$, spiceJet$);

  GenericSubscriber.subscribe(flights$);
  ```
- my understanding - project reactor probably ensures delay elements is run in a background thread. recall how by default, if not using schedulers, project reactor executes everything in the main thread. when i was using `.doOnNext(() -> Util.sleep(1))` instead of `.delayElements(Duration.ofSeconds(1))`, the main thread was getting blocked, and only qatar was being able to emit. same i think appplies to `Flux.interval` i.e. sleep of it happens in a background thread
- **zip** - e.g. imagine a car building pipeline needs one car body, one engine and one set of tires. assume all the three components are fluxes of their own. it can happen that tire manufacturing is much faster than engine, but we only need one of each of the three components at a time to assemble a car. this is ensured using zip
  ```java
  Flux<String> engine$ = Flux
    .generate((SynchronousSink<String> sink) -> sink.next("engine"))
    .delayElements(Duration.ofSeconds(3));
  Flux<String> body$ = Flux
    .generate((SynchronousSink<String> sink) -> sink.next("body"))
    .delayElements(Duration.ofSeconds(2));
  Flux<String> wheels$ = Flux
    .generate((SynchronousSink<String> sink) -> sink.next("wheels"))
    .delayElements(Duration.ofSeconds(1));

  Flux<Tuple3<String, String, String>> cars$ = Flux.zip(engine$, body$, wheels$);

  GenericSubscriber.subscribe(cars$);
  ```
- output - can emit only once every 3 seconds (slowest flux)?
  ```
  [main] > on next: [engine,body,wheels]
  [main] > on next: [engine,body,wheels]
  [main] > on next: [engine,body,wheels]
  ```
- **combine latest** - combine the latest emitted element from all the fluxes
  ```java
  Flux<String> one$ = Flux.just("a", "b", "c")
    .delayElements(Duration.ofSeconds(3));
  Flux<String> two$ = Flux.just("a", "b", "c")
    .delayElements(Duration.ofSeconds(2));

  Flux<List<String>> combined = Flux.combineLatest(one$, two$, (a, b) -> List.of(a, b));

  GenericSubscriber.subscribe(combined);
  ```
- output - 
  ```
  [main] > on next: [a, a] // 3rd second
  [main] > on next: [a, b] // 4th second
  [main] > on next: [a, c] // 6th second
  [main] > on next: [b, c] // 6th second
  [main] > on next: [c, c] // 9th second
  ```
- note about behavior, do not get confused - even the same instance of publisher is treated separately by separate subscribers, since default is cold publisher, not hot
  ```java
  Flux<String> flux = Flux.just("a", "b", "c");
  GenericSubscriber.subscribe(flux.startWith(flux));

  // output - 
  // a, b, c, a, b, c, on complete ✅
  // a, b, c, on complete ❌
  ```
- **batching** - buffer, window, group
- buffer - collect in groups of 5 items. for the last batch, it would not just hang and wait for 5 items, but just emit the remaining items. so, point to remember - it is important to ensure our publishers to always emit a complete signal once they are done, otherwise it can cause unexplainable behavior
  ```java
  Flux<List<String>> events$ = Flux.interval(Duration.ofMillis(300))
    .map((i) -> "event " + i)
    .take(8)
    .buffer(5);

  GenericSubscriber.subscribe(events$);
  ```
- output - 
  ```
  [main] > on next: [event 0, event 1, event 2, event 3, event 4]
  [main] > on next: [event 5, event 6, event 7]
  [main] > on complete
  ```
- buffer based on duration - 
  ```java
  .buffer(Duration.ofSeconds(2));
  ```
- best of both worlds - combination of both duration timeout and buffer size - 
  ```java
  .bufferTimeout(5, Duration.ofSeconds(2));
  ```
- another use case of buffer - if for e.g. i want last three items. the second parameter specifies how many items to "skip". since we specify 1, we get `[0,1,2]`, `[1,2,3]` and so on
  ```java
  Flux<List<String>> events$ = Flux.interval(Duration.ofMillis(300))
    .map((i) -> "event " + i)
    .buffer(3, 1);

  GenericSubscriber.subscribe(events$);
  ```
- output - 
  ```
  [main] > on next: [event 0, event 1, event 2]
  [main] > on next: [event 1, event 2, event 3]
  ```
- **window** - like buffer, but it returns a flux and not a list. the advantage - same as list vs flux! if buffer size is 5, all the items for the buffer should be available in one go, since it uses a list. in window, we can get the items as and when they arrive, since a flux is used
  ```java
  [parallel-1] > on next: event 0
  [parallel-1] > on next: event 1
  [parallel-1] > on next: event 2
  [parallel-1] > on complete
  [parallel-1] > on next: event 3
  [parallel-1] > on next: event 4
  [parallel-1] > on next: event 5
  [parallel-1] > on complete
  ```
- just like buffer, i do see option for
  - passing duration to window
  - using `windowTimeout` for best of both worlds i.e. duration and window size
  - configure skip
- **group by** - works just like in for e.g. sql. note - do not use something with high cardinality. again, this too is a flux of flux
  ```java
  Flux<GroupedFlux<Integer, Integer>> flux$ = Flux.range(1, 30)
    .delayElements(Duration.ofMillis(500))
    .groupBy(i -> i % 3);

  flux$.subscribe((f) -> {
    Util.log("invoked for " + f.key());
    f.subscribe((a) -> Util.log(String.format("[%s]: %s", f.key(), a)));
  });
  ```
- output - 
  ```
  [parallel-1] invoked for 1
  [parallel-1] [1]: 1
  [parallel-2] invoked for 2
  [parallel-2] [2]: 2
  [parallel-3] invoked for 0
  [parallel-3] [0]: 3
  [parallel-4] [1]: 4
  [parallel-1] [2]: 5
  [parallel-2] [0]: 6
  [parallel-3] [1]: 7
  ```
- **repeat** - resubscribe after complete signal. repeat 2 means repeat twice, i.e. total 3 times
  ```java
  Flux<Integer> integers$ = Flux.range(1, 3)
    .doOnComplete(() -> Util.log("do on complete (before repeat)"))
    .repeat(2)
    .doOnComplete(() -> Util.log("do on complete (after repeat)"));

  GenericSubscriber.subscribe(integers$);
  ```
- output - understand how the on complete of subscriber would be **only called once**
  ```
  [main] > on next: 1
  [main] > on next: 2
  [main] > on next: 3
  [main] do on complete (before repeat)
  [main] > on next: 1
  [main] > on next: 2
  [main] > on next: 3
  [main] do on complete (before repeat)
  [main] > on next: 1
  [main] > on next: 2
  [main] > on next: 3
  [main] do on complete (before repeat)
  [main] do on complete (after repeat)
  [main] > on complete
  ```
- repeat can also accept a boolean supplier - probably helps with making the decision of repeating dynamically
  ```java
  .repeat(() -> shouldIRepeatAgain())
  // ...
  private Boolean shouldIRepeatAgain() {
    // ...
  }
  ```
- **retry** - resubscribe after error signal
  ```java
  var integers$ = Flux.range(1, 5)
    .map((i) -> i / (i - 2))
    .doOnError((t) -> Util.log("do on error (before retry): " + t.getMessage()))
    .retry(2)
    .doOnError((t) -> Util.log("do on error (after retry): " + t.getMessage()));

  GenericSubscriber.subscribe(integers$);
  ```
- output - 
  ```
  [main] > on next: -1
  [main] do on error (before retry): / by zero
  [main] > on next: -1
  [main] do on error (before retry): / by zero
  [main] > on next: -1
  [main] do on error (before retry): / by zero
  [main] do on error (after retry): / by zero
  [main] > on error: / by zero
  ```
- **retry spec** - retry based on the type of error that occurs. e.g. it makes sense to retry when we get a 500, not 404 - 
  ```java
  var http$ = Flux.generate((sink) -> {
      if (state$.getAndIncrement() < 3) {
        sink.error(new RuntimeException("500"));
      } else {
        sink.error(new RuntimeException("400"));
      }
    })
    .doOnError((t) -> Util.log("do on error (before retry): " + t.getMessage()))
    .retryWhen(Retry.from((flux) -> flux.handle((Retry.RetrySignal rs, SynchronousSink<String> sink) -> {
      if (rs.failure().getMessage().equals("500")) sink.next("anything?");
      else sink.error(rs.failure());
    })))
    .doOnError((t) -> Util.log("do on error (after retry): " + t.getMessage()));

  GenericSubscriber.subscribe(http$);
  ```  
- output - 
  ```
  [main] do on error (before retry): 500
  [main] do on error (before retry): 500
  [main] do on error (before retry): 400
  [main] do on error (after retry): 400
  [main] > on error: 400
  ```
- sinks - producers emit values on the sinks, and subscriber can subscribe to sinks using `asMono`
  ```java
  Sinks.One<String> sink = Sinks.one();
  Mono<String> mono = sink.asMono();

  sink.tryEmitValue("hello");
  GenericSubscriber.subscribe(mono);
  ```
- similarly, we can also call `tryEmitError`
- we looked at the try variation above i.e. `tryEmitValue`. its return type is `Sinks.EmitResult`, which we can use to see any possible exceptions that might have occurred during the emitting of value. however, we can use the version without the try - `emitValue`, in which case we need to provide a callback, which is the **failure handler**. we can also return a boolean from the failure handler. if e return a true, it means the sink will retry emitting the value again automatically for us. the callback is a failure handler, it would only be called if there is a failure when trying to emit a value
  ```java
  sink.emitValue("hello", (signalType, emitResult) -> {
    Util.log("signal type: " + signalType);
    Util.log("emit result: " + emitResult);
    return false;
  });
  ```
- so, for e.g. below, the second emit would fail, because the sink is of type one, so it allows emitting only one value
  ```java
  Sinks.One<String> sink = Sinks.one();
  Mono<String> mono = sink.asMono();
  
  sink.tryEmitValue("hello");
  sink.emitValue("bonjour", (signalType, emitResult) -> {
    Util.log("signal type: " + signalType);
    Util.log("emit result: " + emitResult);
    return false;
  });
  
  GenericSubscriber.subscribe(mono);
  ```
- output -
  ```java
  [main] signal type: onNext
  [main] emit result: FAIL_TERMINATED
  [main] > on next: hello
  [main] > on complete
  ```
- if we would have returned true, we would have had an infinite loop! - it would try and fail every time
- based on above discussions, we should not just run try emit next and assume it worked! we should read its return value or use the emit value variant which accepts a callback
- types of sinks - **multicast** - multiple subscribers allowed, **unicast** - only one subscriber allowed
  - one multicast
  - many unicast
  - many multicast
  - many multicast with replay
- remember in many, unlike in one, we need to emit complete explicitly (complete emitted implicitly in one sink when we emit next). how to complete without emitting any value in one sink then? i can see that unlike many sink, one sink has `tryEmitEmpty`
- constructing a sink of many unicast type - 
  ```java
  Sinks.Many<Integer> sink = Sinks.many()
    .unicast()
    .onBackpressureBuffer();
  sink.tryEmitNext("how");
  sink.tryEmitNext("are");
  sink.tryEmitNext("you");
  sink.tryEmitComplete();

  Flux<String> flux = sink.asFlux();

  GenericSubscriber.subscribe(flux, "mike");
  ```
- output - 
  ```
  [main] mike> on next: how
  [main] mike> on next: are
  [main] mike> on next: you
  [main] mike> on complete 
  ```
- sink of many multicast type - 
  ```java
  Sinks.Many<String> sink = Sinks.many()
    .multicast()
    .directAllOrNothing();

  Flux<String> flux = sink.asFlux();

  sink.tryEmitNext("how");
  sink.tryEmitNext("are");
  GenericSubscriber.subscribe(flux, "sam");
  GenericSubscriber.subscribe(flux, "mike");
  sink.tryEmitNext("you");
  GenericSubscriber.subscribe(flux, "jake");
  sink.tryEmitNext("doing");
  ```
- output - first subscriber gets all "pending messages" (e.g. only sam gets how and are). then, the remaining subscribers "only get the messages that come after they subscribe" (e.g. sam and mike both get you, while all three sam, mike and jake get doing)
  ```
  [main] sam> on next: how
  [main] sam> on next: are
  [main] sam> on next: you
  [main] mike> on next: you
  [main] sam> on next: doing
  [main] mike> on next: doing
  [main] jake> on next: doing
  ```
- if we change the method of constructing the flux like so - 
  ```java
  Sinks.Many<String> sink = Sinks.many()
    .replay()
    .all();
  ```  
- output - 
  ```
  [main] sam> on next: how
  [main] sam> on next: are
  [main] mike> on next: how
  [main] mike> on next: are
  [main] sam> on next: you
  [main] mike> on next: you
  [main] jake> on next: how
  [main] jake> on next: are
  [main] jake> on next: you
  [main] sam> on next: doing
  [main] mike> on next: doing
  [main] jake> on next: doing
  ```
- **context** - a way for downstream to send information to upstream
  ```java
  Mono<String> mono = Mono.deferContextual((ctx) -> {
    if (ctx.hasKey("user")) return Mono.just("welcome " + ctx.get("user"));
    return Mono.error(new RuntimeException("user not provided"));
  });

  GenericSubscriber.subscribe(mono.contextWrite(Context.of("user", "sam")));
  GenericSubscriber.subscribe(mono);
  ```
- output - 
  ```
  [main] > on next: welcome sam
  [main] > on complete
  [main] > on error: user not provided
  ```
- recall how context goes from downstream to upstream. recall that is how subscription works as well. here, we demo how because of this nature, the upper context will overwrite the context below it
  ```java
  Mono<String> mono = Mono.deferContextual((ctx) -> {
      if (ctx.hasKey("user")) return Mono.just("welcome " + ctx.get("user"));
      return Mono.error(new RuntimeException("user not provided"));
    })
    .contextWrite(Context.of("user", "jake"))
    .contextWrite(Context.of("user", "sam"));

  GenericSubscriber.subscribe(mono);
  ```
- output - 
  ```
  [main] > on next: welcome jake
  [main] > on complete
  ```
- use context value to write to context - 
  ```java
  .contextWrite(ctx -> ctx.put("user", ctx.<String>get("user").toUpperCase()))
  ```
- important to note - context is unmodifiable. when we call ctx.put, a new context is returned. so, while above is a shorthand since amount of processing needed is small, remember that **modified context needs to be returned** for it to change the context for upstream, i.e. `ctx.put` does not modify the original ctx
- test simple demo - 
  ```java
  Flux<Integer> just = Flux.just(1, 2, 3);
  StepVerifier.create(just)
    .expectNext(1)
    .expectNext(2)
    .expectNext(3)
    .expectComplete()
    .verify();

  // or

  Flux<Integer> just = Flux.just(1, 2, 3);
  StepVerifier.create(just)
    .expectNext(1, 2, 3)
    .expectComplete()
    .verify();
  ```
- asserting error  -
  ```java
  Flux<Integer> flux = Flux.create((sink) -> {
    sink.next(1);
    sink.next(2);
    sink.error(new IllegalStateException("an overflow occurred"));
  });

  StepVerifier.create(flux)
    .expectNext(1, 2)
    .expectError()
    .verify();
  ```
- other specific techniques for verifying error - 
  - `.expectError(IllegalStateException.class)`
  - `.expectErrorMessage("an overflow occurred")`
- sometimes we might have many items, we cant specify all of them in `expectNext` as we saw earlier. so, we can use following tricks - 
  - expect next count - specify count
    ```java
    Flux<Integer> range = Flux.range(1, 50);

    StepVerifier.create(range)
      .expectNextCount(48)
      .expectNext(49, 50)
      .expectComplete()
      .verify();
    ```
  - consume while - consume till predicate is satisfied
    ```java
    Flux<Integer> range = Flux.range(1, 50);

    StepVerifier.create(range)
      .thenConsumeWhile((i) -> i <= 45)
      .expectNext(46, 47, 48, 49, 50)
      .expectComplete()
      .verify();
    ```
- custom assertions - 
  ```java
  Mono<Book> book$ = Mono.just(Book.generate());

  StepVerifier.create(book$)
    .assertNext((book) -> assertNotNull(book.getAuthor()))
    .expectComplete()
    .verify();
  ```
- e.g. for the flux below - 
  ```java
  Flux<Integer> flux$ = Flux.range(1, 5)
    .delayElements(Duration.ofSeconds(3))
    .map((i) -> i * i);

  StepVerifier.create(flux$)
    .expectNext(1, 4, 9, 16, 25)
    .expectComplete()
    .verify(); 
  ```
- output - it actually takes 15 seconds or so for the test to execute! so, we can use **virtual time**
  ```java
  @Test
  public void two() {
    StepVerifier.withVirtualTime(this::flux)
      .thenAwait(Duration.ofSeconds(30))
      .expectNext(1, 4, 9, 16, 25)
      .expectComplete()
      .verify();
  }

  private Flux<Integer> flux() {
    return Flux.range(1, 5)
      .delayElements(Duration.ofSeconds(3))
      .map((i) -> i * i);
  }
  ```
- the test runs immediately, with no delay. note - this did not work for me - `StepVerifier.withVirtualTime(() -> some_flux)`, but this did - `StepVerifier.withVirtualTime(method_that_returns_some_flux)` and probably this would work as well, not sure - `StepVerifier.withVirtualTime(() -> method_that_returns_some_flux())`
- verifying context - 
  ```java
  Mono<String> mono = Mono.deferContextual((ctx) -> {
    if (ctx.hasKey("user")) return Mono.just("welcome " + ctx.get("user"));
    return Mono.error(new RuntimeException("user not provided"));
  });

  // verifying error is easy
  StepVerifier.create(mono)
    .expectErrorMessage("user not provided")
    .verify();

  // we have to provide context to verify happy path
  StepVerifierOptions options = StepVerifierOptions.create()
    .withInitialContext(Context.of("user", "sam"));
  StepVerifier.create(mono, options)
    .expectNext("welcome sam")
    .expectComplete()
    .verify();
  ```

## Spring WebFlux

- traditionally, with spring mvc, a single thread is used per request
- also, each thread consumes a certain amount of resources of our compute - so threads are expensive
- with webflux, io is done in a non blocking way - the thread is notified once the io request responds
- thus, the thread is utilized more efficiently in webflux
- assume a separate service is called by a spring mvc application and a spring reactive application. assume this service takes 5 seconds to respond
  - by default, the spring mvc uses 200 threads. so, if we have 400 concurrent requests, 200 out of these 400 requests will have to "wait" for the threads to be free. however, remember that the while processing the first 200 requests, the threads are just sitting blocked for 5 seconds, waiting for the separate service to respond
  - however, with spring webflux, we only have threads = number of cores i think, and the thread would not wait on the network calls
- reactive manifesto - 
  - lazy - only do work when required
  - responsive - keep showing one post and load more when scrolled, do not block to load all posts at once
  - resilient - do not fail the whole system due to one service in the system
  - elastic - throughput of system scales automatically with varying demand
  - message driven - loose coupling, asynchronous communication, e.g. rsocket
- spring mvc uses the traditional "servlet api" using "servlet container" (discussed [here](/posts/spring))
- spring webflux uses "reactive http" using netty (by default), but can use undertow, servlet 3.x, etc
- netty working - it has two thread groups - thread group one has the one "master thread", which does things like handshake etc and queues the request. threads from thread group two - "worker threads" pick up something from the queue and perform the action. if the worker thread has to call another service, it would not wait for the response - the entire point behind reactive programming is not being blocked! it would pick up something else from the queue, and continue processing the original request when the response comes back. my doubt - does the response basically get added back to the queue, and does it happen that another thread from the worker thread group continues processing this request? maybe not, because access to variables (stack etc) might be lost?
- to create a project select "spring reactive web" from start.spring.io
- when using spring webmvc, its like our webserver is the publisher, and the browser, calling service, etc are like the subscribers
- reactive example - return the multiplication table - 
  ```java
  @GetMapping("/multiplication-table/{input}")
  public Flux<ResponseDto> multiplicationTable(@PathVariable Integer input) {
    return reactiveMathService.calculateMultiplicationTable(input);
  }

  public Flux<ResponseDto> calculateMultiplicationTable(Integer input) {
    return Flux.range(1, 10)
      .doOnNext((i) -> log.info("processing " + i))
      .doOnNext((i) -> Util.sleep(2))
      .map((i) -> ResponseDto.builder()
        .output(i * input)
        .build());
  }
  ```
- however, in above as well, 20 seconds of wait can be seen in chrome before the entire result is returned. to use streaming api, we only need to change the get mapping line - 
  ```java
  @GetMapping(value = "/multiplication-table-streaming/{input}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  ```
- this way, our application also becomes responsive - show as and when data loads
- so, the difference is that when not using text event stream, spring would still behind the scenes collect the entire list of objects and then send the response. however, when using text event stream, spring would send the objects one by one. i think this does not mean we should always use text event stream, because our core service logic would still be performed in a reactive way, even if the response is not streaming
- if suppose we cancel a request - in case of spring mvc, the processing would not stop and would continue, unlike for the spring reactive method above, where the we would not see any more "log statements" once the request is cancelled. so, spring reactive only does work when required
- request body can be read in a non blocking way as well - 
  ```java
  @RequestBody Mono<MultiplicationRequestDto> multiplicationRequestDto
  ```
- my understanding - if we do not use mono, the request body would have to be deserialized before the controller method being called, unlike when we use mono. however, the deserialization in both cases does happen in a non blocking way, so we should be good for the most part?
- exception handling, my understanding - either we can just write `throw new ...Exception...` etc or use the reactive way, e.g. `sink.error`, both work i.e. both will work with `@ControllerAdvice` and `@ExceptionHandler`, both ways get picked up by the `server.error...` properties we had discussed [here](/posts/spring), etc
  ```java
  public Mono<ResponseDto> calculateProduct(Mono<MultiplicationRequestDto> multiplicationRequestDto) {
    return multiplicationRequestDto.handle((dto, sink) -> {
      if (dto.getFirst() <= 0 || dto.getSecond() <= 0) {
        // option 1
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "input numbers should be greater than 0");
        
        // option 2 - feels like the better way, but both work according to me
        sink.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "input numbers should be greater than 0"));
      } else {
        sink.next(ResponseDto.builder()
          .output(dto.getFirst() * dto.getSecond())
          .build());
      }
    });
  }
  ```
- functional endpoints - while the above works, this is an alternative method as well, to for e.g. obey a more functional style of programming
  ```java
  @Configuration
  @RequiredArgsConstructor
  public class RouterConfig {

    private final ReactiveMathService reactiveMathService;

    @Bean
    public RouterFunction<ServerResponse> serverResponseRouterFunction() {

      return RouterFunctions.route()
        .path("/functional-reactive-math", (builder) -> builder
          .GET("/square/{input}", (request) -> {
            Integer input = Integer.parseInt(request.pathVariable("input"));
            Mono<ResponseDto> product = reactiveMathService.calculateSquare(input);
            return ServerResponse.ok().body(product, ResponseDto.class);
          })

          .GET("/multiplication-table/{input}", (request) -> {
            Integer input = Integer.parseInt(request.pathVariable("input"));
            Flux<ResponseDto> table = reactiveMathService.calculateMultiplicationTable(input);
            return ServerResponse.ok().body(table, ResponseDto.class);
          })

          .GET("/multiplication-table-streaming/{input}", (request) -> {
            Integer input = Integer.parseInt(request.pathVariable("input"));
            Flux<ResponseDto> table = reactiveMathService.calculateMultiplicationTable(input);
            return ServerResponse.ok().contentType(MediaType.TEXT_EVENT_STREAM).body(table, ResponseDto.class);
          })

          .POST("/product", (request) -> {
            Mono<MultiplicationRequestDto> body = request.bodyToMono(MultiplicationRequestDto.class);
            Mono<ResponseDto> product = reactiveMathService.calculateProduct(body);
            return ServerResponse.ok().body(product, ResponseDto.class);
          }))
        .build();
    }
  }
  ```
- note how we -
  - use one `RouterFunction<ServerResponse>` to symbolize one controller
  - extract path variable (square)
  - extract request body (product)
  - use streaming response (multiplication-table)
  - use `@RequestMapping` on controller class like feature (`.path()`)
- my understanding - recall how we could have `@ExceptionHandler` inside a controller to handle exceptions specific to a controller? for the functional style, we can achieve the same by chaining onError. hopefully, i never have to use this 🤣
- the builder pattern above also allows for request predicates i.e. only execute if condition is satisfied - 
  ```java
  .GET("/square/{input}", RequestPredicates.path(".*/1?"), (request) -> { // ...
  ```
- so, we get 404 if we ask for square of anything not in the range 11-19. the entire builder is executed from top to down, so we can also have different ways of handling as follows. note how the last one is like a catch all
  ```java
  .GET("/square/{input}", RequestPredicates.path(".*/1?"), (request) -> { // ...
  .GET("/square/{input}", RequestPredicates.path(".*/2?"), (request) -> { // ...
  .GET("/square/{input}", (request) -> { // ...
  ```
- spring boot has **rest template** for making network calls, but it is blocking. so, we use **web client** for spring reactive
- constructing a web client - 
  ```java
  @Bean
  public WebClient webClient() {
    return WebClient.builder()
      .baseUrl("http://localhost:8080")
      .defaultHeaders((headers) -> headers.setBasicAuth("username", "password"))
      .build();
  }
  ```
- web client test - 
  ```java
  @Test
  public void webClientTest() {

    Flux<ResponseDto> response = webClient.get()
      .uri("/reactive-math/multiplication-table-streaming/{input}", 7)
      .retrieve()
      .bodyToFlux(ResponseDto.class);

    StepVerifier.create(response)
      .expectNextCount(7)
      .assertNext((dto) -> assertEquals(56, dto.getOutput()))
      .assertNext((dto) -> assertEquals(63, dto.getOutput()))
      .assertNext((dto) -> assertEquals(70, dto.getOutput()))
      .expectComplete()
      .verify();
  }
  ```
- note - the above test would work for both streaming and non streaming response type!
- similarly, post request test - 
  ```java
  Mono<MultiplicationRequestDto> request = Mono.fromSupplier(() -> new MultiplicationRequestDto(6, 7));
  Mono<ResponseDto> response = webClient.post()
    .uri("/reactive-math/product")
    .body(request, MultiplicationRequestDto.class)
    .retrieve()
    .bodyToMono(ResponseDto.class);

  StepVerifier.create(response)
    .assertNext((dto) -> assertEquals(42, dto.getOutput()))
    .expectComplete()
    .verify();
  ```
- note - here, the format is `body(mono(obj), class)`. it can also be `bodyValue(obj)` based on our use case
- for testing error scenarios, recall we can chain `expectError` etc when using `StepVerifier`
- till now, we were chaining `.retrieve()`. but it only gives access to body, not status code etc. for asserting on them lot, we can use `.exchange()` instead of `.retrieve()` (not discussed here)
- adding request parameter when using web client - note how instead of providing a hardcoded string inside the uri, we now use the builder
  ```java
  .uri(builder -> builder.path("/reactive-math/stream").query("a={a}&b={b}").build(2, 4))
  ```
- attributes - help influence the "central configuration" of web client dynamically - when we use web client somewhere in the code, we pass it "attributes" - and these attributes change how web client make calls, which was configured in the "central configuration" - below, we are expected to send an attribute for auth type from the place we actually make the request, and then the configuration decides how to generate auth details for every request (using filter), which extracts the attribute and accordingly modifies the request
  ```java
  @Bean
  public WebClient webClient() {
    return WebClient.builder()
      .baseUrl("http://localhost:8080")
      .filter(this::filter)
      .build();
  }

  private Mono<ClientResponse> filter(ClientRequest request, ExchangeFunction exchangeFunction) {
    Optional<Object> authType$ = request.attribute("auth-type");
    ClientRequest modifiedRequest = authType$
      .map((authType) -> authType.equals("basic") ? addBasicAuth(request) : addTokenAuth(request))
      .orElse(request);
    return exchangeFunction.exchange(modifiedRequest);
  }

  private ClientRequest addBasicAuth(ClientRequest originalRequest) {
    return ClientRequest.from(originalRequest)
      .headers((headers) -> headers.setBasicAuth("user", "password"))
      .build();
  }

  private ClientRequest addTokenAuth(ClientRequest originalRequest) {
    return ClientRequest.from(originalRequest)
      .headers((headers) -> headers.setBearerAuth("just-the-token"))
      .build();
  }
  ```
- webclient will help with http requests, but what about database calls? they are not http, they are a custom protocol on top of tcp. so, we have different drivers for different databases
- difference in return type of blocking vs reactive of mongo driver - 

  | operation  | blocking    | non blocking |
  |------------|-------------|--------------|
  | find by id | Optional<T> | Mono<T>      |
  | find all   | List<T>     | Flux<T>      |
  | count      | Long        | Mono<Long>   |
  | exists     | Boolean     | Mono<Long>   |

- a very simple crud service for mongodb - 
  ```java
  @Service
  @RequiredArgsConstructor
  public class ProductService {

    private final ProductDao productDao;

    private final ProductMapper productMapper;

    public Flux<ProductDto> findAll() {
      return productDao.findAll()
        .map(productMapper::map);
    }

    public Mono<ProductDto> findById(String id) {
      return productDao.findById(id)
        .map(productMapper::map);
    }

    public Mono<ProductDto> create(Mono<ProductDto> productDto) {
      return productDto.map(productMapper::map)
        .flatMap(productDao::save)
        .map(productMapper::map);
    }

    public Mono<ProductDto> update(String id, Mono<ProductDto> update) {
      return productDao.findById(id)
        .flatMap((_existing) -> update)
        .doOnNext((dto) -> dto.setId(id))
        .map(productMapper::map)
        .flatMap(productDao::save)
        .map(productMapper::map);
    }

    public Mono<Void> deleteById(String id) {
      return productDao.deleteById(id);
    }
  }
  ```
- data layer -
  ```java
  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  @Builder
  @Document(collection = "products")
  public class ProductEntity {

    @Id
    private String id;

    private String description;

    private Integer price;
  }

  @Repository
  public interface ProductDao extends ReactiveMongoRepository<ProductEntity, String> {
  }
  ```
- we cannot (should not) use spring data jpa / hibernate / jdbc, because they are all blocking in nature, and therefore we lose out on the performance benefits of reactive programming
- we will use r2dbc - which feels like non blocking alternative to jdbc
- we use spring data r2dbc - which i think sits on top of the r2dbc, thus simplifying development
- i think as an alternative to r2dbc / spring data r2dbc, we can also use hibernate reactive, which probably would be closer to jpa
- r2dbc does not support relationships 😢. so, we can use tricks like `on delete cascade` in our ddl to avoid errors when deleting an entity, since we can no longer specify `CascadeType.ALL` etc on the mapping
  ```java
  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  @Builder
  @Table(name = "`user`")
  public class UserEntity {

    @Id
    private Integer id;

    private String name;

    private Integer balance;
  }

  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  @Builder
  @Table(name = "transaction")
  public class TransactionEntity {

    @Id
    private Integer id;

    private Integer userId;

    private Integer amount;

    private Instant transactionDate;
  }
  ```
- e.g. user to transaction is one to many. we want to create a transaction and reduce the balance of the user. so, we first check if the user has enough balance and reduce the balance. if there was a row with an update, the boolean returned would be true, post which we can process it further
  ```java
  @Repository
  public interface UserDao extends ReactiveCrudRepository<UserEntity, Integer> {

    @Query("update `user` set `user`.balance = `user`.balance - :amount where `user`.id = :userId and `user`.balance >= :amount")
    @Modifying
    Mono<Boolean> updateBalance(Integer userId, Integer amount);
  }
  
  public Mono<TransactionStatus> create(Integer userId, Mono<TransactionRequestDto> request) {
    return request.flatMap((dto) ->
        userDao.updateBalance(userId, dto.getAmount())
          .filter((updated) -> updated)
          .flatMap((_updated) -> transactionDao.save(transactionMapper.map(dto)))
      )
      .map((_entity) -> TransactionStatus.APPROVED)
      .defaultIfEmpty(TransactionStatus.DECLINED);
  }
  ```
- we can use jpa with webflux, i think some point to note - 
  - remember it is blocking, so we should additionally chain a `publishOn` / `subscribeOn`
  - we should use for e.g. `Flux.fromStream(() -> repo.findAl().stream())`, if we were to use `Flux.fromIterable(repo.findAll())`, i think it would defeat the point
    ```java
    public Flux<OrderResponseDto> findAll(Integer userId) {
      // orderDao is a normal jpa repository, not r2dbc
      return Flux.fromStream(() -> orderDao.findAllByUserId(userId).stream())
        .subscribeOn(Schedulers.boundedElastic())
        .map(orderMapper::map);
    }
    ```
  - also see how we chain with `.map()` when calling `save`, not with `.flatMap`, since recall it returns a normal object unlike when using spring reactive data, which returns the object wrapped with `Mono`
- [a "context" pattern](https://stackoverflow.com/a/77592888/11885333). this is all my logic btw lol - when we have several interactions with several services, we need some properties of some objects, some properties of some other objects, etc. remember that with a functional / declarative style that comes with reactive programming, we do not have access to all objects in the method - we only can access previous chained call's return value. so, we can instead use a helper context object where we store all interactions, so that they can be easily accessed at any time
  ```java
  public Mono<OrderResponseDto> fulfill(Mono<OrderRequestDto> orderRequest) {

    Context ctx = new Context();

    return orderRequest
      // record request into context 
      .doOnNext(ctx::setOrderRequestDto)
      // get product from product service
      .flatMap((_v) -> productService.getProduct(ctx.getOrderRequestDto().getProductId()))
      // record product into context
      .doOnNext(ctx::setProductDto)
      // deduct amount by calling user service - note how it involves using both original request and product
      .flatMap((_v) -> userService.createTransaction(ctx.getOrderRequestDto().getUserId(), ctx.getProductDto().getPrice()))
      // record status of response into context
      .doOnNext(ctx::setTransactionStatus)
      // build the order based on transaction status (if user had enough amount to pay for product), actual product, etc
      .map((_v) -> orderMapper.map(ctx.getProductDto(), ctx.getOrderRequestDto(), ctx.getTransactionStatus()))
      // record the built order entity into context
      .doOnNext(ctx::setOrderEntity)
      // save the order (using map, not flatMap since this is not r2dbc)
      .map((_v) -> orderDao.save(ctx.getOrderEntity()))
      // create response
      .map((_v) -> orderMapper.map(ctx.getOrderEntity()))
      // use subscribe on, since jpa repo.save is a blocking call
      .subscribeOn(Schedulers.boundedElastic());
  }

  @Data
  class Context {

    private OrderRequestDto orderRequestDto;

    private ProductDto productDto;

    private TransactionStatus transactionStatus;

    private OrderEntity orderEntity;
  }
  ```
- a simple way to implement sse (server sent events). recall we had already discussed `TEXT_EVENT_STREAM_VALUE`. we can combine it with the concept of sinks for live updates in ui!
  ```java
  @Service
  public class ProductService {

    // ...

    private final Sinks.Many<ProductDto> productsSink;

    @Getter
    private final Flux<ProductDto> productsFlux;

    public ProductService(ProductDao productDao, ProductMapper productMapper) {
      // ...
      productsSink = Sinks.many().replay().all();
      productsFlux = productsSink.asFlux();
    }

    public Mono<ProductDto> create(Mono<ProductDto> productDto) {
      // ...
        .doOnNext(productsSink::tryEmitNext);
    }

    public Mono<ProductDto> update(String id, Mono<ProductDto> update) {
      // ...
        .doOnNext(productsSink::tryEmitNext);
    }
  }

  // ...
  @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public Flux<ProductDto> findAllStream() {
    return productService.getProductsFlux();
  }
  ```
- `WebTestClient` - testing routers, controllers, controller advice, etc
  ```java
  @SpringBootTest
  @AutoConfigureWebTestClient
  public class OneWebTestClientTest {

    @Autowired
    WebTestClient client;

    @Test
    void test() {
      Flux<ResponseDto> response = client.get()
        .uri("/reactive-math/square/{n}", 4)
        .exchange()
        .expectStatus().isOk()
        .expectHeader().contentType(MediaType.APPLICATION_JSON)
        .returnResult(ResponseDto.class)
        .getResponseBody();

      StepVerifier.create(response)
        .assertNext((dto) -> assertEquals(16, dto.getOutput()))
        .expectComplete()
        .verify();
    }
  }
  ```
- note - feels like everything will be a flux, no concept of mono, but that should be fine?
- while we extracted response as a flux above, we can use fluent assertions as well - 
  ```java
  .expectHeader().contentType(MediaType.APPLICATION_JSON)
  .expectBody()
  .jsonPath("$.size()").isEqualTo(4)
  .jsonPath("$[0].output").isEqualTo(4)
  .jsonPath("$[1].output").isEqualTo(8)
  .jsonPath("$[2].output").isEqualTo(12)
  .jsonPath("$[3].output").isEqualTo(16);
  ```
- above is example of integration test, slow
- unit test is fast - we test nth layer and assume (n - 1)th layer works, and thus for e.g. mock it
- unit test controller logic using `WebClientTest`
  ```java
  @WebFluxTest({ReactiveMathController.class})
  public class TwoWebTestClientTest {

    @Autowired
    WebTestClient client;

    @MockBean
    ReactiveMathService reactiveMathService;

    @Test
    void test() {
      when(reactiveMathService.calculateSquare(4))
        .thenReturn(Mono.just(ResponseDto.builder().output(16).build()));
      
      // rest stays the same as the integration test!
    }
  }  
  ```
- 
