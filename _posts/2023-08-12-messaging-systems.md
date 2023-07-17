---
title: Messaging Systems
---

## Kafka

### Setup

- note - environment should have java 8+ installed
- download the zip from [here](https://www.apache.org/dyn/closer.cgi?path=/kafka/3.5.0/kafka_2.13-3.5.0.tgz)
- unzip it - `tar -xzf kafka_2.13-3.5.0.tgz`
- note - the 2.13... here is not the kafka, but the scala version?

### Staring using Zookeeper

- in one terminal, start zookeeper - `zookeeper-server-start.sh ~/kafka_2.13-3.5.0/config/zookeeper.properties`
- in another terminal, start kafka - `kafka-server-start.sh ~/kafka_2.13-3.5.0/config/server.properties`

### Starting using Kraft

- generate a cluster uuid - `KAFKA_CLUSTER_ID="$(~/kafka_2.13-3.5.0/bin/kafka-storage.sh random-uuid)"`
- format log directories - `kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c ~/kafka_2.13-3.5.0/config/kraft/server.properties`
- start kafka - `kafka-server-start.sh ~/kafka_2.13-3.5.0/config/kraft/server.properties`

### Concepts

- helps with system integrations. sources produce data into kafka, and targets consume from kafka
- distributed, resilient, fault tolerant
- created by linkedin, now maintained by ibm, cloudera, confluent, etc
- works with spark, flink, hadoop, etc
- a sequence of messages is called a data stream
- kafka topic - a particular stream of data
- a topic is identified by topic name
- topics support any kind of message format like json, avro, binary, etc
- we can produce data using kafka producers, and consume data using kafka consumers
- topics are split into partitions
- **messages within a partition are ordered**
- **messages in a partition get an id called offset**. note - so offsets are specific to a partition
- so, order is only guaranteed inside one partition
- **offsets are not reused in a partition even if previous messages are deleted from it**
- immutability - once data is written into a partition, it cannot be updated / deleted, we can just append (add) data to it
- my understanding - we basically interact with kafka producers and consumers in our code, and they internally do things like batching, where we provide network configuration, security parameters, etc
- producers can optionally send a key along with the message. this key can be a string, number, binary, etc
- if this key is null, then the message can end up in any partition
- if this key is not null, this key is hashed to produce the partition number. this partition number then determines the partition the message should go to. use case - e.g. we have a delivery service, where our trucks send its coordinates every 5 seconds. we should ensure that a truck sends its coordinates to the same partition to ensure ordering, therefore the truck can use its id as the kafka message key. messages with the same key end up in the same partition
- internally kafka partitioner determines the partition using murmur2 algorithm
- parts of a message - key, body, compression (e.g. gzip, snappy, etc or even none), headers (key value pairs) and a timestamp (can be set by the system or by the user)
- kafka message serializer - help in serializing our messages which are objects into bytes. e.g. if our key is an integer and our value is a string, kafka will use its inbuilt integer and string serializer respectively for this
- consumers - pull model i.e. consumers request for data from the brokers, and not the broker pushing data into the consumers
- consumers can deserialize using deserializers similar to serializers
- best practice - do not change serializer in the producer, since that will break the deserializers in the consumers. so, create a new topic instead and have the consumers to start pulling from this new topic
- **consumers in kafka read as a consumer group**
- **consumers in a group read from exclusive partitions** i.e. multiple consumers of the same group cannot read from the same partition
- so, if we have more consumers in a consumer group than the number of partitions, (number of consumers - number of partitions) consumers remain idle
- however, a consumer in a consumer group can read from multiple partitions (e.g. when number of partitions > number of consumers)
- of course consumers from different consumer groups can read from the same partition
- if suppose a consumer from a consumer group is removed, the partitions that consumer was responsible for is automatically distributed among the other members of that consumer group
- a consumer group id is used to help identify the consumers part of the same group
- consumer offset - **consumers store the offsets they have read up till in a topic called __consumer_offsets periodically**. this way, if they die and come back up, they can continue reading from the same position in the partition where they left off
- a kafka cluster has multiple kafka brokers. each broker is identified by an id
- **each broker only contains some partitions of a topic** - so data is distributed. understand the implication of this - **this way, our topic is not limited to scale by the capability of only one worker node** in our kafka cluster
- broker discovery mechanism - consumers do not need to connect to all brokers in advance. they only need to connect to one broker, and by that they are automatically able to connect to all brokers since on initiating connection with one broker, all metadata related to the other brokers, partitions, etc is sent
- topic replication factor - if a broker is down, another broker is still available to produce data to and receive data from. **replication factor = how many copies i.e. how many brokers will have the same partition's copy**
- in sync replicas (isr) - all replica brokers that have caught up with the broker
- since there are multiple partitions, there is a leader among these partitions, and producers can only send data to this leader
- consumers by default only consume from the leader. so i think the replication factor only helps with disaster recovery in this case
- however, in newer versions, kafka consumers can read from replica brokers as well, if the replica broker is closer to them (e.g. we should have the consumer read from the isr in same az and not the leader / another isr in a different az to help reduce network latency and costs). this feature is called rack awareness, and for this to work, `rack.id` on the broker should have the same value as `client.rack` on the consumer
- producer acknowledgements - 
  - acks = 0 means producer will not wait for acknowledgement
  - acks = 1 means producer will wait for acknowledgements from leader. data can be lost if leader goes down unexpectedly before replication goes through to other brokers. it was the default earlier
  - acks = all (or -1) means producer will wait for acknowledgement from all replicas along with the master as well. default kafka 3.x onwards
    - this option goes hand in hand with the `min.insync.replicas` option, which states how many replicas should acknowledge the data. if its value is 1, it means that only the leader has to acknowledge the data
    - so, one ideal configuration to start with would be setting min isr to 2, acknowledgement mode to -1 and setting replication factor to be 3. this way, at least one replica and the leader have the write before the producer can consider the message successfully written into kafka
- topic durability - if replication factor is m, and say we want isr to be n, then we can tolerate m - n brokers going down. so, for e.g. don't over optimize i.e. if min in sync replicas are 3, (acknowledgement mode is all) and replication factor is 3, that means we cannot withstand any broker going down, which might be too much
- retries - note - this is producer retries not consumer, don't confuse with concepts like dlq here 😅. retries here refer to transient failures like kafka saves the message but acks fail, required number of brokers (min insync replicas) are unavailable at the time so kafka cannot save the message, etc. focussing on the newer versions here -
  - retries (`retries`) are set to infinite (2147483647) by default. so, after the producer sends the message and if there is a failure for some of the transient reasons discussed above, the producer would again retry sending the message
  - idempotence (`enable.idempotence`) is set to true by default. imagine that kafka was able to save the message i.e. write it to the replication factor number of partitions, but the ack failed. so, the producer thinks that some stuff have failed and will retry sending. so, since this property is set to true, kafka would know not to re add this message to the partitions, and would just try sending the ack again. this helps with exactly once semantics (and not duplicating thus resulting in at least once). now, from what i understood, it also helps with ordering. so, if for example the producer sends the first batch and kafka fails to commit it, when the second batch is received by kafka, kafka would throw an out of order exception to the producer. with this property, its almost like a sequence number is sent with each batch. this way, both ordering and exactly once semantics are ensured
  - max in flight requests (`max.in.flight.requests.per.connection`) is set to 5 by default. **this is basically how many concurrent requests producer will send without receiving the acknowledgements for them**. after this number, if our application calls send on the producer, it will start blocking. this needed to be 1 in older versions to maintain ordering, but with idempotence now, it is enough to keep this <= 5 based on what we discussed above and [this](https://docs.confluent.io/platform/current/installation/configuration/producer-configs.html#max-in-flight-requests-per-connection)
  - delivery timeout (`delivery.timeout.ms`) is set to 120000 i.e. 2 minutes by default. now retries is infinite does not mean producer would just keep retrying endlessly in case of failure, since the time it first sent the message, it would keep retrying until this timeout occurs. again remember that this retrying decision is being done by the producer which we write, so we can configure it in the properties
- zookeeper - helps with managing multiple brokers. so, helps with issues like leader election, sending notifications to other brokers if a brokers goes down, etc
- kafka up to 2.x cannot work without zookeeper. however, kafka from 3.x can work without zookeeper using kraft, and kafka 4.x onwards will not use zookeeper at all
- zookeeper itself too runs in master slave mode, runs odd number of servers underneath
- because of this change of migrating away from zookeeper, we should not mention zookeeper configuration inside our connections, but only mention broker endpoints. this change can even be seen in the kafka cli etc, e.g. when running kafka-topics.sh, we do not specify the zookeeper endpoint. this way when we change from 3.x to 4.x, there would be slim to no change required from us
- understand how the offsets are associated to a consumer group on a per partition basis
- as we add / remove more consumers to a group, the existing consumers are notified of this and they accordingly adjust the partitions that they listen to
- when a new partition is added to a topic, this new partition also needs to be assigned to one of the consumers of a group subscribed to the topic
- partition rebalance - moving of partitions between consumers - can happen due to adding new partitions to the topic / adding or removing consumers in a group
- there are different strategies to partition rebalance (`partition.assignment.strategy`) - 
  - **eager rebalance** - all consumers give up their ownership i.e. the partition they were responsible for. then a fresh calculation is made and the consumers are randomly assigned the partitions again. issue - it might happen that an existing consumer now starts listening to a new partition. also, for albeit a brief period when the rebalancing is happening, there would be no consumers at all, this phenomenon where there are no consumers at all during a brief period is called stop the world event
  - **cooperative rebalance / incremental rebalance** - process is uninterrupted for unaffected partitions, e.g. imagine consumer 1 was subscribed to partition 1, and consumer 2 was subscribed to partitions 2 and 3. if a new consumer is added, only for e.g. partition 3 would be reassigned to this new consumer, but data from partitions 1 and 2 continues flowing uninterrupted
- **static group membership** - by default, when a consumer leaves a group, the partition they owned is reassigned. we can specify a `group.instance.id` which makes the consumer a static member. this way there is no rebalance until `session.timeout.ms` (heartbeat mechanism discussed later), so the consumer has this much time to be able to come back up, otherwise the partition would be rebalanced. use case - consumers for e.g. maintain a cache and this way, a rebuilding of that cache is not required by the new consumer. feels like without this property, the partition would be reassigned to another consumer and not wait for the session timeout?
- quick question - how to implement a fan out pattern in kafka - do not assign the consumer group id / specify a different value for the consumer group id for each of your horizontally scaled instances - this way all the instances will receive the message
- producer compresses the batch of messages before sending it to the broker
- this helps with things like better utilization of disk on kafka, better throughput, etc
- compression can be specified at producer / topic level
- compression can be specified at producer level or the broker level as well using `compression.type` - 
  - producer - the default. use the compressed batch from the producer as is and write directly without recompression
  - none - all batches are decompressed by the broker
  - specify a type like lz4 explicitly. if the compression format is the same as done by the producer then store as is, else decompress and recompress using the specified format
- so, the summary of above according to my understanding is, leave compression type at broker level to be producer (it is the default), and set the compression type to be snappy or something at the producer config (default is none)
- batching settings - increasing batch sizes improves throughput, means lesser network calls, compression becomes more effective, etc. but of course it introduces latency for downstream consumers
  - `linger.ms` - how long the producer should wait before sending the message to kafka. default is 0
  - `batch.size` - if the batch fills to this value before `linger.ms` is over, send the batch. default is 16 kb
- `partitioner.class` - in earlier versions of kafka, if we specify no key for our message, the messages are sent to partitions in round robin fashion using **round robin partitioner**. disadvantage - for e.g. remember batching happens at partition level, so this means we cannot utilize batching effectively, since there is a batch being created for every partition. **sticky partitioner** is the default in newer versions of kafka. this means that instead of round robbin, producer would fill one batch (until `linger.ms` or `batch.size`) and then send to one partition. after this, a new batch is started. so we can leave this property untouched in newer versions
- delivery semantics - this is for consumers
  - at least once - default and usually preferred. commit offset after processing of message is over. if processing of message fails or imagine consumer crashes after receiving messages, message will be read again and reprocessed since the offset was not committed. so, the processing logic must be idempotent
  - at most once - commit offset as soon as message is received. if processing of message fails or imagine that after receiving messages, the consumer crashes, messages will be lost and not read again. this case ensures a message would not be processed multiple times
  - exactly once - this would only be possible if both source and sink is kafka. we use the transactional api in this case. e.g. when using kafka streams for transformations, we can use this
- to make our processing idempotent with at least once semantics, for a given message, we should add an id, e.g. imagine how we know for an object if it needs to be updated or created in the database based on its id property. otherwise, we can use kafka coordinates - every message will have a unique (topic + partition + offset) combination, so for e.g. we could generate an id like this - `<topic>_<partition>_<offset>` (understand why a separator like _ is needed - otherwise there is no way to differentiate between partition 2 offset 22 and partition 22 offset 2)
- offsets are committed after at least `auto.commit.interval.ms` time has passed since us calling poll(). the default value of this is 5 seconds. my understanding - e.g. we poll every 7 seconds, and auto commit interval is 5 seconds. when the second poll is called, the first poll would be committed. however, if we poll every 5 seconds, and auto commit interval is 7 seconds, **the first poll would be committed when the third poll is called**
- for staying inside at least once semantics, because of what was described above, our processing should be synchronous - before we call poll the next time, our current batch should have been successfully processed, so that if by chance the next poll has to commit, it can be sure that we have already successfully processed our current batch. in auto commit, commitAsync is called
- we can disable auto committing as well, and instead manually commit offsets using `consumer.commitSync()` / `consumer.commitAsync()`
- the auto offset reset (`auto.offset.reset`) property defines how to consume from a topic if there is no initial offset i.e. a new consumer group has just started listening - the default is latest i.e. start consuming from the end of the partition. we can set it to earliest. my understanding - earliest corresponds to the `--from-beginning` flag in the cli for kafka console consumer
- we can also reset consumer offsets. internally, feels like this might be possible since it is as simple as adding a message to the __consumer_offsets topic, due to the cleanup policy being compact? (discussed later)
- consumers send a heartbeat every `heartbeat.interval.ms` seconds (3 seconds by default), and if no heartbeats are received for `session.timeout.ms` seconds (45 seconds by default), the consumer is considered dead. this heartbeat related functionality is carried out by the heartbeat thread
- if a new poll call is not made in `max.poll.interval.ms`, the consumer is considered to have failed processing of that message. my understanding - this is important because all offset commits are done by newer poll calls for the previous polls? so maybe this way, kafka can know that for some reason, message processing has been stuck or has failed, and it has to re send the message for processing?
- for replicating data across kafka clusters, e.g. if cluster is across regions, or for e.g. when we are hitting performance limits with one kafka cluster and need multiple kafka clusters, etc, we can use tools like mirror maker 2. replication can be active active (two way replication, e.g. data producers in multiple regions) or active passive (one way, e.g. for global resiliency)
- when we try to connect to kafka, kafka brokers have a setting called `advertise.listeners`. this way, when the client tries connecting to the kafka broker, the broker returns this value and the client instead tries connecting using this value if the value it initially tried connecting using was different. e.g. imagine client tries connecting using a public ip, but the value returned by the broker using `advertise.listeners` is the private ip address
- partition count - if we change the partition count suddenly, understand it would affect ordering of messages with same keys etc
- more partitions = more parallelism
- partitions should be usually 3 times the number of brokers, so 3 partitions per broker
- replication factor - if we change this, we increase load on our kafka custer, since there is more network calls etc involved for the replicas
- replication factor should be usually 3
- [topic naming guide](https://cnr.sh/essays/how-paint-bike-shed-kafka-topic-naming-conventions) - `<message type>.<dataset name>.<data name>`. for message type, all possible values are mentioned in the link, some common ones are `queuing` for classic use cases, `etl` for cdc, etc. dataset name is like database name and data name is like table name. also use snake case
- [debezium](https://github.com/debezium/debezium) uses kafka connectors and kafka ecosystem underneath, and helps do realtime cdc by using database's transaction logs
- so, two common patterns with kafka -
  - use applications like spark, flink, (or even kafka itself) etc to read from kafka and generate realtime analytics
  - use kafka connect to write to s3, hdfs, etc from kafka and generate batch analytics from this
- kafka metrics - monitor a lot of things like how many under replicated partitions exist i.e. how many partitions have issues with in sync replicas
- we can enable in flight encryption ssl, authentication and authorization
- kafka has data retention for 7 days by default
- but until then, everything is internally in file formats, e.g. i tried poking around in the log.dir folder on my local i.e. inside /tmp/kraft-combined-logs/
- partitions are internally made up of segments
- so, there is one (the latest) active segment, and other segments can be consider obsolete
- a segment is closed means it is available for log cleanup - this helps delete obsolete data from the disk of kafka
- how to cleanup logs - there are two possible values for `cleanup.policy` on a topic - `compact` (default for __consumer_offsets) and `delete` (default for all user defined topics)
- a segment is closed and a new one is started when either the `log.segment.bytes` size is reached, or if `log.retention.hours` is reached
- if we set cleanup policy to be compact - a new segment is created, and only the values for the latest keys for a topic is retained, and others are discarded. so e.g. segment 1 has value a for key x and value b for key y, and segment 2 has value c for key y, the newly created segment would have value a for key x and value c for key y. this behavior also makes sense for the consumer offsets topic if i think about it
- for very large messages, either tweak configuration parameters to increase maximum limits, or better, use something like sqs extended client of aws is possible

## JMS

- helps communicate with the message brokers in a vendor agnostic way
- like jdbc is for databases, jms is for "jms providers"
- some examples of jms providers - activemq, webspheremq, tibcomq - they are called jms providers because they implement the "jms specification"

### Messaging Topologies

- messaging topologies - internal broker, external broker, embedded broker
- "internal broker" - the j2ee application server itself can act as a message broker. so, now there is not much difference between our application servers and the message broker - around how we run and host them etc
- issues - we lose out on separation of concerns. also, this solution only works for java to java applications
- "external broker" - we use technologies like activemq, openmq etc on standalone servers. the j2ee application servers interact with ths external broker
- "embedded broker" - the jvm itself spins up the message broker. useful for localized messaging
- one possible pattern - the way for service a to communicate to service b is via service b's embedded message broker, instead of via for e.g. service b's rest apis

### Queue Design Approaches

- queue design approaches - queue router design, queue processor design
- "queue router design" - there is just one queue for producers and consumers
- the different producers put messages into this queue, while the "consumer router" consumes the message and decides which processor to call - if message type is cd, call cd processor and so on
- disadvantages - the single router on the consumer side which receives all messages and routes it to the current destination, the single queue, etc are bottlenecks
- also, consumer has logic around which processor to call etc

![queue router design](/assets/img/messaging-systems/queue-router-design.png)

- "queue processor design" - each message has a dedicated queue
- the processors now have built in consumers as well
- this approach has more scalability, throughput, etc

![queue processor design](/assets/img/messaging-systems/queue-processor-design.png)

### Messaging Models

- jms supports two kinds of messaging models - p2p and pubsub
- "p2p" or "point to point" - only one receiver is there
- a "queue" is used for p2p
- "pubsub" or "publish subscribe" - multiple receivers are present
- a "topic" is used instead of a queue in pubsub

### Running Apache ActiveMQ Artemis

- download apache activemq artemis from [here](https://activemq.apache.org/components/artemis/download/)
- `tar -xvzf apache-artemis-2.33.0-bin.tar.gz`, `cd apache-artemis-2.33.0/`
- create a broker - `./bin/artemis create broker` - it then prompts for username and password - i entered "admin" for both
- run the broker - `cd broker`, `./bin/artemis run`
- now, we can visit the ui at http://localhost:8161/console/

### Getting Started

- `Destination` - can be topic or queue based on the [messaging model](#messaging-models) we are using
- both the `ConnectionFactory` and `Destination` are provided by the [jms provider](#jms) and registered with the jndi registry
- first, we add the dependency - 
  ```xml
  <dependency>
    <groupId>org.apache.activemq</groupId>
    <artifactId>artemis-jms-client-all</artifactId>
    <version>${artemis.version}</version>
  </dependency>
  ```
- we create a properties file - jndi.properties, which jms looks for - 
  ```
  java.naming.factory.initial=org.apache.activemq.artemis.jndi.ActiveMQInitialContextFactory
  connectionFactory.ConnectionFactory=tcp://localhost:61616?user=admin;password=admin
  queue.queue/firstQueue=first_queue
  ```
- my understanding - the names `queue/firstQueue`, `ConnectionFactory`, etc is what helps us retrieve objects from the jndi registry
- we create the `InitialContext` and obtain the `ConnectionFactory` from it
- then, we create a `Connection` from the `ConnectionFactory` and then inturn a `Session` from the `Connection`
- we use `lookup` to fetch `ConnectionFactory` and `Destination` (`Queue` in our case) from the jndi registry -
  ```java
  InitialContext initialContext = new InitialContext();
  ConnectionFactory connectionFactory = (ConnectionFactory) initialContext.lookup("ConnectionFactory");

  try (Connection connection = connectionFactory.createConnection()) {
    try(Session session = connection.createSession()) {

      Queue queue = (Queue) initialContext.lookup("queue/firstQueue");

      // ...
    }
  }
  ```
- finally, we can create `MessageProducer` and from the `Session`
  ```java
  MessageProducer producer = session.createProducer(queue);
  TextMessage messageSent = session.createTextMessage("i am the creator of my destiny");
  producer.send(messageSent);
  ```
- similarly, we can create `MessageConsumer` from the `Session`. notice how we need to call `connection.start()` to have the receiver to start receiving the messages
  ```java
  MessageConsumer consumer = session.createConsumer(queue);
  connection.start();
  TextMessage messageReceived = (TextMessage) consumer.receive();
  System.out.println("message received: " + messageReceived.getText());
  ```

### Message Browsing

- "message browsing" - receive messages without consuming them from the queue
- a snapshot of the queue is taken and returned to us, so that we can then browse through the messages
- use case - increase resiliency of application - e.g. a java application can use message browsing to "alert developers" or even "spin up additional workers" when number of messages in a queue exceed a certain threshold
- we can perform monitoring on dlq as well
- we can also implement "[wiretap](https://www.enterpriseintegrationpatterns.com/patterns/messaging/WireTap.html)" like functionality using message browsing
- we use the `QueueBrowser` and `Enumeration` classes for this -

```java
QueueBrowser queueBrowser = session.createBrowser(queue);
Enumeration enumeration = queueBrowser.getEnumeration();
while (enumeration.hasMoreElements()) {
  TextMessage message = (TextMessage) enumeration.nextElement();
  System.out.println("message browsed: " + message.getText());
}
```

### JMS 2.x

- the `JMSContext` is now the equivalent of the `Connection` and `Session`
- the `MessageProducer` and `MessageConsumer` are also replaced by the `JMSProducer` and `JMSConsumer` now

```java
InitialContext initialContext = new InitialContext();
Queue queue = (Queue) initialContext.lookup("queue/firstQueue");

try (
  ActiveMQConnectionFactory connectionFactory = (ActiveMQConnectionFactory) initialContext.lookup("ConnectionFactory");
  JMSContext jmsContext = connectionFactory.createContext();
) {

  JMSProducer producer = jmsContext.createProducer();
  producer.send(queue, "work until success");

  JMSConsumer consumer = jmsContext.createConsumer(queue);
  String message = consumer.receiveBody(String.class);
  System.out.println("consumed: " + message);
}
```

### Message Anatomy

- three parts - headers, properties and payload
- both "headers" and "properties" contain metadata about the message
- both can either be set by the provider or by the developer
- priority - we can set priority on messages, so that messages with higher priority are delivered first. default priority is 4
- remember to consider starvation etc for messages with lower priority - 
  ```java
  producer.setPriority(0); producer.send(queue, "low priority");
  producer.setPriority(5); producer.send(queue, "medium priority");
  producer.setPriority(9); producer.send(queue, "high priority");

  // ...
  for (int i = 0; i < 3; i++) {
    Message message = consumer.receive();
    System.out.println("consumed priority: " + message.getJMSPriority());
  }
  
  // output - 9, 5, 0 
  ```
- instead of a generic asynchronous style that we are used to, it might happen that the producer expects the consumer to send the reply using another queue. now, what if the consumer does not know the queue to respond to ahead of time? we can use `setJMSReplyTo`. i think it is just using headers / properties underneath, and we could have done this manually as well 
  ```java
  // producer sets the destination on the message
  textMessage.setJMSReplyTo(replyQueue);

  // consumer extracts the destination from the message
  Queue queueToReplyTo = (Queue) textMessage.getJMSReplyTo();
  ```
- we can set an expiry / ttl on the messages via the producer - `producer.setTimeToLive(2000);`
- if a message sent on this producer is not polled till 2 seconds, it will be moved to a queue called `ExpiryQueue`
- we can then consume using maybe another consumer from this queue if we want to get the expired messages
- setting / retrieving custom properties - 
  ```java
  // producer
  textMessage.setStringProperty("name", "shameek");
  textMessage.setIntProperty("age", 25);
  
  // consumer
  textMessage.getStringProperty("name");
  textMessage.getIntProperty("age");
  ```
- jms allows 5 different types of messages - all of them implement the `Message` interface - `TextMessage`, `ByteMessage`, `ObjectMessage`, `StreamMessage` and `MapMessage`. e.g. of using `ObjectMessage` - 
  ```java
  // producer
  JMSProducer producer = jmsContext.createProducer();
  producer.send(queue, new Patient("shameek", 25));

  // consumer
  JMSConsumer consumer = jmsContext.createConsumer(queue);
  Patient patient = consumer.receiveBody(Patient.class);
  System.out.println("hospitalized: " + patient);
  ```
- my understanding - while we did not use `ObjectMessage` explicitly above, neither while producing nor while consuming, that is what is being used underneath
- note - `Patient` needs to implement `Serializable`
  ```java
  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  public class Patient implements Serializable {
  
    private String name;
  
    private int age;
  }
  ```
- note - till now, we were using `consumer.receive` etc for consumer, which is "synchronous" - the consumer would be blocked till a message is received
- we can instead register a `MessageListener` whose `onMessage` would be called automatically when the message is available on the queue. this is "asynchronous"
  ```java
  JMSConsumer consumer = context.createConsumer(requestQueue);
  consumer.setMessageListener(new EligibilityMessageListener());

  // ...

  class EligibilityMessageListener implements MessageListener {
  
    @Override
    public void onMessage(Message message) {
      try {
        Patient patient = message.getBody(Patient.class);
        System.out.println("check for: " + patient);
      } catch (JMSException e) {
        throw new RuntimeException(e);
      }
    }
  }
  ```
- in pubsub pattern, if one of the subscribers in the pubsub model go down, there is no way for the jms provider to send this subscriber the message
- "durable subscriptions" - the subscriber sends its "client id" and "subscription name"
- the jms provider will now check if the message is sent to all its durable subscribers, and if not, it will retain the messages till all the durable subscribers do not get the message successfully
- so, once the subscriber comes back up, it can receive all the remaining messages
  ```java
  jmsContext.setClientID("topic_demo");
  // ...
  JMSConsumer consumer = jmsContext.createDurableConsumer(destination, "subscription_name");
  ```
- "shared consumers" - only one of the consumers will receive the message. useful for parallel processing
  ```java
  jmsContext.createSharedConsumer( ...
  ```
- my doubt - similar functionality is ensured when using a queue, and multiple consumers are listening on this queue. shared consumers might be useful when we have horizontally scaled consumers of a topic

### Message Filtering

- e.g. we have multiple consumers on a queue
- one of the consumers consume the message, but they realize that the message was not meant for them, but another consumer
- then, they might try putting the message back into the queue, and we end up in a weird scenario
- so, we can use "message filtering"
- note - message filtering only works on the properties / headers and not the payload of the message
- also, while it works for custom properties, it does not work for custom headers - only jms provided headers
- mathematical operators, `like`, `in`, etc are supported as well
- use case - multiple consumers used for different insurance providers, while the same queue is being used

```java
// producer
ObjectMessage claim1 = jmsContext.createObjectMessage();
claim1.setObject(new Claim("blue cross", 45000));
claim1.setStringProperty("insurance_provider", "blue cross");

// consumer - only insurance providers with 'apollo' will be received
JMSConsumer consumer = jmsContext.createConsumer(queue, "insurance_provider='apollo'");
```

### Message Acknowledgements

- three acknowledgements are supported - auto acknowledge, client acknowledge, dups ok acknowledge
- my understanding - in case of producer, for all three modes, it is in waiting state till an acknowledgement is received from the broker
- so, rest of the discussion would be consumer specific
- "auto acknowledge" - the consumer acknowledges after the message has been processed. we do not have to do this manually - it happens automatically, e.g. when `MessageListener#onMessage` finishes to run
- for this mode, all we need to is set it on the context while creating it like so - 
  ```java
  try (
    ActiveMQConnectionFactory connectionFactory = (ActiveMQConnectionFactory) initialContext.lookup("ConnectionFactory");
    JMSContext context = connectionFactory.createContext(JMSContext.AUTO_ACKNOWLEDGE);
  ) {
  ```
- note - auto acknowledge has some "overhead" associated to it for the jms provider, since it has to ensure that the message is sent only once
- "dups ok acknowledge" - the jms provider need not worry about duplication of message
- internally, acknowledgements still happen automatically for us
- however, this technique removes the additional overhead we discussed in auto acknowledgements
- so, the logic on the consumer should be idempotent for this
- one way - use the "unique message id" that jms attaches to all messages
- "client acknowledge" - the consumer itself takes the responsibility of acknowledging the message manually
- advantage - the jms provider can in the meantime do some other work - its thread is not blocked by this acknowledgement
  ```java
  try (
    ActiveMQConnectionFactory connectionFactory = (ActiveMQConnectionFactory) initialContext.lookup("ConnectionFactory");
    JMSContext context = connectionFactory.createContext(JMSContext.CLIENT_ACKNOWLEDGE);
  ) {
    // ...
    message.acknowledge();
  }
  ```

### Transacted Sessions

- imagine there are two trades we want to perform
- without transactions, the producer immediately sends the messages to the broker
- so, if an error occurs after sending the first message, we land in an inconsistent state where the consumers receive only the first trade and not the second
- with transactions, when our code calls the send api, internally, the producers holds on to the messages
- once the entire transaction runs successfully, the transaction is committed i.e. all messages are now sent to the broker in one go
- so, either all messages are sent, or none
- we need to manually call `context.commit()`
- note - we can call `context.rollback()` as well in case of a failure
  ```java
  try (
    ActiveMQConnectionFactory connectionFactory = (ActiveMQConnectionFactory) initialContext.lookup("ConnectionFactory");
    JMSContext context = connectionFactory.createContext(JMSContext.SESSION_TRANSACTED);
  ) {

    // ...
    context.commit();
  }
  ```
- in case of receiver - the jms provider only removes the messages from itself after the consumer calls commit successfully
- e.g. assume the receiver calls `receive` 3 times - since receive is blocking, the calls complete once it has received 3 messages
- now, if the client fails before committing the session, the messages will be retained on the queue and not removed from it - so, these three messages are redelivered when the queue is polled again
- the syntax for transactions in consumers is the same as the producer that we saw above

### Security

- note - different jms providers handle security differently
- we will find three files under etc inside the broker folder that was generated for us when we created the broker
- artemis-user.properties - usernames and passwords. add the below to it -
  ```
  clinical_user = clinical_pass
  eligibility_user = eligibility_pass
  ```
- artemis-roles.properties - roles, which users are assigned which roles
  ```
  clinical_role = clinical_user
  eligibility_role = eligibility_user
  ```
- broker.xml - which roles have access to which topics and queues - it allows wildcards as well. here, we say for all queues and topics matching the name com.example.#, we send permissions to clinical_role while the consume permissions to eligibility_role. creating and deleting queues permissions are with both, because either of the apps may be started first, and the queue will not exist when the apps are started and it should be created dynamically
  ```xml
  <security-setting match="com.example.#">
    <permission type="createNonDurableQueue" roles="clinical_role,eligibility_role"/>
    <permission type="deleteNonDurableQueue" roles="clinical_role,eligibility_role"/>
    <permission type="createDurableQueue" roles="clinical_role,eligibility_role"/>
    <permission type="deleteDurableQueue" roles="clinical_role,eligibility_role"/>
    <permission type="createAddress" roles="clinical_role,eligibility_role"/>
    <permission type="deleteAddress" roles="clinical_role,eligibility_role"/>
    <permission type="consume" roles="eligibility_role"/>
    <permission type="browse" roles="eligibility_role"/>
    <permission type="send" roles="clinical_role"/>
    <!-- we need this otherwise ./artemis data imp wouldn't work -->
    <permission type="manage" roles="amq"/>
  </security-setting>
  ```

### Message Grouping

- when we want to send a group of messages, all to the same consumer
- for this, all our messages should have a group id set
- full example included below - comment the `setStringProperty` line to see the difference

```java
public class MessageGroupingDemo {

  public static void main(String[] args) throws Exception {

    InitialContext initialContext = new InitialContext();

    try (
      ActiveMQConnectionFactory connectionFactory = (ActiveMQConnectionFactory) initialContext.lookup("ConnectionFactory");
      JMSContext context = connectionFactory.createContext();
    ) {

      Queue queue = (Queue) initialContext.lookup("queue/firstQueue");

      // consumers

      JMSConsumer consumer1 = context.createConsumer(queue);
      consumer1.setMessageListener(new Listener("consumer 1"));

      JMSConsumer consumer2 = context.createConsumer(queue);
      consumer2.setMessageListener(new Listener("consumer 2"));

      // producer

      JMSProducer producer = context.createProducer();

      for (int i = 0; i < 5; i++) {
        TextMessage message = context.createTextMessage();
        message.setText("message " + i);
        message.setStringProperty("JMSXGroupID", "first_group");
        producer.send(queue, message);
      }

      Thread.sleep(10000);
    }
  }
}

@RequiredArgsConstructor
class Listener implements MessageListener {

  private final String consumerName;

  @Override
  @SneakyThrows
  public void onMessage(Message message) {
    Thread.sleep(500);
    System.out.println(consumerName + ": " + message.getBody(String.class));
  }
}
```

### Spring JMS

- spring sits between our application code and jms api - thus simplifying jms further
- add the following dependency - 
  ```xml
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-artemis</artifactId>
	</dependency>
  ```
- first, we need to add `@EnableJms`, maybe add it on the application class
- add properties like so -  
  ```
  spring.artemis.broker-url=tcp://localhost:61616
  spring.artemis.user=admin
  spring.artemis.password=admin
  ```
- apparently, there is an embedded mode which we might be able to use as well for e.g. for tests
- `JMSTemplate` - has methods to send / receive messages. when using `convertAndSend`, jmsTemplate is smart enough to capture string using `TextMessage`, objects using `ObjectMessage`, etc
  ```java
  @Service
  @RequiredArgsConstructor
  public class Producer {
  
    private final JmsTemplate jmsTemplate;
  
    @Value("${custom.demo_queue}")
    private String demoQueue;
  
    public void send(String message) {
      jmsTemplate.convertAndSend(demoQueue, message);
    }
  }
  ```
- to be able to set properties etc on the message, we need to use a `MessageCreator` with `send` instead of `convertAndSend` - 
  ```java
  MessageCreator messageCreator = (session) -> {
    TextMessage textMessage = session.createTextMessage();
    textMessage.setText(message);
    textMessage.setStringProperty("provider", "fedex");
    return textMessage;
  };
  
  jmsTemplate.send(demoQueue, messageCreator);
  ```
- for receiving messages, we can either use a synchronous approach by using `receive` on the jms template, or an asynchronous approach using the `@JmsListener`, like we saw in `MessageListener`. underneath, the "listener container" is what is responsible to call our listeners
  ```java
  @Service
  @Slf4j
  public class Consumer {
  
    @JmsListener(destination = "${custom.demo_queue}")
    public void receive(String message) {
      log.info("received: {}", message);
    }
  }
  ```
- "message driven pojo" - we receive the message body as an argument, without having to deal with messaging / jms specific details. this makes our Consumer class a message driven pojo. just like we were doing in convert and send

### Restful JMS

- combining rest with jms to overcome the limitations of jms
- some jms providers like activemq provide this
- in case of activemq, the url is `http://hostname/msg/queue/<queue-name>`
- GET can be used for [message browsing](#message-browsing), POST for putting messages on the queue and DELETE for consuming messages from the queue
- use case - firewalls do not work for message brokers - it is more of a web services / rest feature - e.g. [unlike load balancers, message brokers are not typically exposed](/posts/high-level-design/#message-brokers). that is why this feature can be useful
