---
title: Interview Experiences Revisions
math: true
---

## Experience 1

- you're leading a migration from dbt cloud and snowflake to dbt core with spark, projected to save $1m+ annually
  - walk me through the architectural decision - why spark over staying in snowflake
    - snowflake ties compute + storage + licensing - all together
    - at scale, this becomes very expensive
    - open architecture allows for flexibility, e.g. swap spark with trino for compute based on workload
- what the migration path looks like for existing dbt models
  - convert snowflake sql to spark sql
  - migrate staging models then marts
  - run both systems in parallel for some time before cut over
- what is the hardest technical problem you've hit so far in the migration
  - spark kubeflow does not support thrift server automatically. so, a custom wrapper was required around it
  - similarly, mention the build out required for custom authentication layer, observability, ci / cd etc
- dbt core with spark requires a different execution model than dbt cloud with snowflake - specifically around incremental materializations and late-arriving data. how are you handling models that relied on snowflake's merge behavior?
  - snowflake merge is very fast - it has micro partitions, statistics around max and min values, compactions, several layers of caching, etc in background
  - e.g. assume merge is happening on column x - we should partition data using that column for partition pruning
  - or say use merge on read instead of copy on write strategy to avoid overwriting whole parquet files and then combine this with compaction
- you managed ingestion from kafka topics at 65 gb/second to iceberg, s3, and snowflake via kafka connect. at that throughput, consumer lag and connector back pressure are real operational concerns. walk me through the topology
  - how many connectors - actually one per topic - because when using iceberg sink, when we tried using the same connector for multiple topics, a failure in one stopped ingestion for all tables, thus increasing bast radius
  - how many workers - multiple. one worker can run multiple tasks, and we can have multiple tasks per connector. number of tasks should be same as number of partitions in kafka topic for maximum concurrency
  - how did you size the connector cluster - parameters like flush interval etc come into play. larger batches mean fewer s3 files but more memory would be required
  - what broke first when you pushed it to that throughput - small file problem, multiple snapshots, etc. combat using frequent maintenance jobs
- if a kafka connect sink connector to iceberg starts falling behind during a traffic spike, walk me through how you'd diagnose whether the bottleneck is in the
  - connector worker
    - we can check if the lag is increasing or not
    - kafka-consumer-groups.sh --group connect-lse-tdp-redux-iceberg-dataos --describe
  - the iceberg commit process
    - data files are getting written but metadata is not getting updated
  - the kafka broker
    - maybe the lag is lesser than usual or 0?
    - monitor the throughput of the topics - number of messages or bytes
  - for most things, metrics like gc pauses, jvm memory, heap usage, etc should be monitored
- your ingestion framework cut pipeline build time from 2+ weeks to 2–3 hours by onboarding use cases via dynamic airflow dags. what does "dynamic" mean here specifically - are dags being generated at runtime from config, and if so, how did you handle dag versioning, dependency management between dynamic dags, and testing a new use case configuration before it hits production?
  - we have a parallel staging environment, where only the config is different. we can test out the changes in this layer before committing them
- airflow's scheduler can struggle with a large number of dags. how did your dynamic dag approach handle this, and what was the dag count at peak?
  - we run multiple instances of the scheduler to handle this
  - they can coordinate and use locking to ensure only one scheduler picks up a task
  - they can also use a heartbeat like concept so that if they fail midway, another scheduler can pick over and run the tasks
- you're writing to iceberg from multiple sources — kafka connect, spark batch jobs, and the ingestion framework. iceberg uses optimistic concurrency control with snapshot isolation. when multiple writers commit to the same table simultaneously, what failure modes did you observe, and how did you handle concurrent write conflicts in production?
  - append only mode for streaming writes. this avoids conflicts
  - compaction is run on closed partitions i.e. partitions which are no longer receiving writes
- iceberg's small file problem is a real operational concern with high-frequency streaming writes
  - what compaction strategy did you use
    - binpack, sort, zorder - just say that we use sort
  - how did you schedule it without impacting read performance?
    - readers read say snapshot 1.1, compaction writes snapshot 1.2
    - so, they do not interfere with each other
- a spark executor on kubernetes is being oom killed despite the jvm heap being well within the configured limit. you have kubectl and node ssh access. walk me through your exact diagnostic steps — what you check first, what commands you run, and how you determine whether this is off-heap memory, executor overhead, or something else
  - oom killed container but jvm heap is fine
  - so, issue is in memory overhead
  - so, issue might be in the pyspark container or the exchange buffers
  - also, spark has off heap memory optimizations to avoid inefficient garbage collection
- you set spark.executor.memoryoverhead to 512mb and the oomkills stop. three weeks later they return during a job with wider shuffles. what changed, and how would you calculate the right overhead value going forward?
  - we would calculate the overhead based on peak loads / have headroom, and not just regular workloads
- spark jobs are jvm workloads with a specific memory model — executor heap is divided between execution memory and storage memory, and gc behavior in long-running streaming jobs is different from batch. have you ever tuned gc on a spark executor — not at the spark config level, but at the jvm flag level — and what metric told you gc was the bottleneck rather than shuffle or i/o?
  - spark ui shows task time (gc time) under executors tab
  - gc time should be a very small fraction, e.g. 5% of task time
  - batch jobs just run once and complete, but streaming jobs run forever
  - so, gc handling becomes more important for streaming jobs
  - now, major gc happens in streaming jobs for long lived objects
  - some examples - cached data, accumulated state (recall stateful processing), etc
  - this causes a stop the world event - which in turn causes issues like spikes / lags
- spark's default gc for executors has historically been g1gc. if you were running a streaming job with high object churn in the execution memory pool, what gc behavior would you expect to see, and would you consider zgc — and what trade-off would that introduce for a long-running streaming job?
  - makes the stop the world pauses sub millisecond by running concurrently
  - however replacing g1gc with zgc consumes cpu etc, so requires more resources

## Experience 2

- truncate vs delete -
  | delete                                      | truncate                               |
  | ------------------------------------------- | -------------------------------------- |
  | dml                                         | ddl                                    |
  | where clause supported                      | not supported                          |
  | slow                                        | fast                                   |
  | identity counter (auto increment) not reset | resets                                 |
  | acquires row / page level locks             | acquires table level locks             |
  | does not immediately free up disk space     | frees up disk space immediately        |
  | can be rolled back if inside a transaction  | can or cannot be depending on database |
- write an sql query to retrieve an entire organizational hierarchy of direct reports -
  ```
  with recursive org_chart as (
    select emp_id, name, manager_id
    from employees
    where manager_id is null
    
    union all
    
    select e.emp_id, e.name, e.manager_id
    from employees e
    join org_chart o
    on e.manager_id = o.emp_id
  )
  select * from org_chart;
  ```
- the magic is in `join org_chart o`. normally, joins involve whole tables. in recursive queries, it only joins against the exact rows that were found in the previous loop. so, base case finds ceo, then joins ceo to cto, then cto to vp and so on
- dense rank vs rank vs row number
- assume my sql is as follows - 
  ```
  select
    score,
    dense_rank() over (order by score desc) as 'dense_rank',
    rank() over (order by score desc) as 'rank',
    row_number() over (order by score desc) as 'row_number'
  from
    scores
  ```
- input - 
  ```
  | id | score |
  | -- | ----- |
  | 1  | 3.5   |
  | 2  | 3.65  |
  | 3  | 4     |
  | 4  | 3.85  |
  | 5  | 4     |
  | 6  | 3.65  |
- output - 
  ```
  | score | dense_rank | rank | row_number |
  | ----- | ---------- | ---- | ---------- |
  | 4     | 1          | 1    | 1          |
  | 4     | 1          | 1    | 2          |
  | 3.85  | 2          | 3    | 3          |
  | 3.65  | 3          | 4    | 4          |
  | 3.65  | 3          | 4    | 5          |
  | 3.5   | 4          | 6    | 6          |
  ```

## Experience 3

### Question 1

- you have two tables - `signup_events` and `login_events`. both tables have the same schema -
  - `event_id`
  - `event_time`
  - `customer_id`
  - `user_id`
- we want to compute the monthly metrics. write a select query returning these columns -
  - `date_month` - month in this format `YYYY-MM-01` (date)
  - `customer_id` - the customer id
  - `signups` - number of signup events
  - `logins` - number of login events
  - `active_users` - number of distinct users who triggered any of those events
- note - a user may appear in both tables in the same month - they should be counted once in `active_users`
- solution pointers - 
  - how to use the 1 0 technique with union
  - `count(distinct column)`

```
with events as (
    select
      to_char(event_time, 'YYYY-MM-01') as date_month
      customer_id,
      user_id,
      1 AS signups,
      0 AS logins
    from
      signup_events

    union all

    select
      to_char(event_time, 'YYYY-MM-01') as date_month
      customer_id,
      user_id,
      0 AS signups,
      1 AS logins
    from
      login_events
)
select
    date_month,
    customer_id,
    sum(signups) as signups,
    sum(logins) as logins,
    count(distinct user_id) as active_users
from
  events
group by
    date_month,
    customer_id
order by
    date_month,
    customer_id;
```

## Experience 4

- initial load dump of cdc is there in say postgres
- assume table is user(id, name, email, loaded_at, operation, ...)

### Generate Current State

- this can be thought of as scd type 1
- if the most recent action is delete, it should not be present in the table
- the record might be present multiple times, and we need to ensure we only include the latest occurrence in our final result. the "row number" window function can help us achieve that

```
select 
  id,
  operation,
  loaded_at,
  email,
  row_number() over (partition by id order by loaded_at desc) rn
from
  users_cdc
where
  rn = 1
  and operation != 'delete'
```

### Generate Historical View

- this can be thought of as scd type 2
- so, assign "valid from" and "valid to"
- we can generate an additional surrogate key for the primary key, as the original natural key would now be present in multiple rows
- "lead" window function helps look at the next operation's timestamp
- assume the last record was a delete. the operation before it correctly gets the right "valid to" because of the lead logic, and we filter out the rows with the delete operation
- additional - perform the first calculations in a subquery so that the rows with the delete are included. then, filter out the ones with delete operations

```
with history as (
  select
    id,
    operation,
    email,
    loaded_at as valid_from,
    lead(loaded_at) over (partition by id order by loaded_at asc) as valid_to
  from
    users_cdc
)
select
  random_uuid() as surrogate_key,
  id,
  operation,
  valid_from,
  valid_to,
  email,
  case
    when valid_to is null then true else false
  end as is_active
from
  history
where
  operation != 'delete'
```

- to query the data as of a particular date say pqr, we can use - 

```
select *
from dim_users_history
where pqr between valid_from and valid_to
```

## Experience 5

### Scenario

- think of dsp (digital service provider) like spotify, apple music, etc
- source 1 - the data pipeline system ingests 3 files daily - dsp a, dsp b, dsp c
- files have timestamped, user tagged listen events for the prior 24 hour period
- the files arrive between 1300 et and 2300 et each day, but not at predictable times. they are dumped into an s3 bucket
- dsp a -
  - 1m rows
  - one row per song id, each row has a list of user timestamp pairs, one for each listen of the song
  - accounts for 10% of wmg streams
- dsp b -
  - 10m rows
  - one row per user song, with a list of timestamps one for each listen to that song by that user
  - accounts for 30% of wmg streams
- dsp c -
  - 500m rows
  - each individual listen event is its own timestamped record
  - accounts for 60% of wmg streams
- song id is an industry standard id
- source 2 - we have an artist id to song id mapping in a relational database
- this database is updated twice daily, at noon and midnight et
- source 3 - 1 weekly follower / listener. 100k rows from dsp c for wmg artists only
- keyed by artist id, each record includes follower and listener counts for the previous week, together with geo and age group breakdowns
- this dataset arrives weekly between 1500 et sunday and 0300 et monday

### Produce

- basic streams table
  - track listens
  - dsp c only - geo slicing on track listens
  - artist rollups on track listens
  - temporal aggregations, sliding windows - hour, day, week, month, quarter, year
  - period on period deltas, sliding windows - day, week, month, quarter, year
- basic followers table
  - current week follower count per artist
  - period on period growth for week, month, quarter, year
- followers streams table
  - per artist, this week’s streams with last week’s followers, this week’s followers, and growth
  - streams broken down by dsp and geo (dsp c only)
  - same for monthly

### Answer

- highlight pros and cons of a batch vs a streaming pipeline. specify how a batch pipeline is a better fit in this case
- since the files are unpredictable, we can use for e.g. aws sqs sensors, or aws lambda
- they listen for the putting of file and for e.g. trigger an airflow dag that in turn runs the spark processing pipeline
- this can be used for both - daily and weekly files landing in s3
- for the relational database, and even maybe for these daily and weekly files, we can have just a normal schedule based trigger in airflow as well since the time windows are explicitly specified
- now, we create the silver layer for the streams, like the "streams fact table"
- specify concepts of dimensional modelling, data warehousing, elt, medallion architecture, etc here
- for transformations / producing the gold layer, we can use dbt
- for dsp a - explode on user, timestamp
- for dsp b - explode on timestamps
- for dsp c - already flat
- the fact table should be partitioned using dsp and day(timestamp) -
  - helps with idempotency (rewrite partition)
  - helps in faster querying
  - use hidden partitioning feature of iceberg to avoid storing an extra column for the day of timestamp
- here, a question might be which timestamp - try partitioning using the event timestamp, and not say the date the file was written, as that is the column we run queries on etc
- using best practices - 
  - ingest the raw data as is to a bronze layer
  - the silver layer can be the dimension modelling - fact tables with the data from the different dsp normalized, using slowly changing dimensions for artists, etc
- so, we have a silver table `streams_fact`, and we can have gold tables like `streams_daily_agg`, `streams_hourly_agg`, etc
- typically, the pattern followed is this - hourly and daily are materialized, while weekly, monthly, quarterly, etc are computed from daily
- we usually also store an additional "date dimension" table (basically per day i believe). it handles the et to utc mapping, it will store columns for week start, month, quarter, etc. then, when a join is done between the gold tables we described above and this date dimension, we can easily compute the statistics as needed
- the three dsp are processed independently using separate spark clusters, right sized based on workload, autoscaled using dynamic allocation
- the downstream jobs only kick in once all the three dsp have been ingested successfully - so there can be a check task in the airflow dag - have the three files arrived
- the data from the relational database is basically dimensional data, so it can be modelled for instance using scd type 2
- some example of window functions for querying growth -
  ```
  lag(week_listens, 7) over (partition by artist_id order by date) as prev_week_listens,
  (week_listens - prev_week_listens) / pref_week_listens as wow_growth
  ```
- do not miss - basic streams, basic followers and followers streams. so, the third one is basically a join between sources 1 and 3. understand these pointers when evaluating
- additional optimizations - specify using of broadcast joins for smaller tables
- example of a `merge into` for the silver table -
  ```
  merge into silver using (
    select
      *,
      hash_64(all columns, maybe omit timestamp) hash,
      row_number() over (partition by hash order by timestamp desc) row_num
    from bronze
    where
      row_num = 1
  ) bronze
  on silver.hash = bronze.hash
  and silver.ts > today - 1 day
  when not matched then insert *
  ```
- remember the different optimizations we do when performing such merges
- optimization 1 - look at data from up to 1 day before to avoid heavy reads
- this is the pointer for handling "late arriving data" - point this out yourself
- optimization 2 - dedupe the bronze layer data - 
  - calculate a hash, say base 64
  - use row number window function
  - partition using this calculated hash
  - filter out the first row only
- optimization 3 - similarly, dedupe the incoming bronze data with the existing silver data -
  - perform the `merge into` using this hash
  - simply call `when not matched then insert *`
- run periodic maintenance jobs - compaction, snapshot expiration, orphan file cleanup, etc
- we can have multiple kinds of data quality checks -
  - data freshness check - if the data does not arrive in the specified time, we can throw alerts
  - volume anomaly checks - we already know the approximate volume at which the data is coming. if we see a drop, we should raise an alert on the same. we can use standard deviation here - how much the value deviated from its typical mean
- kind of joins to perform - for e.g. outer join / left join to retain facts whose dimensions have not arrived yet vs inner join to drop them altogether
- point out how iceberg supports rollbacks / point in time querying in case of issues

## Experience 6 Preparation

- exactly once usage ledger - each api call gets recorded as an event in kafka. billing comes from that ledger. how do you make sure every event is counted exactly once, from kafka through to click house and snowflake? cover "duplicates", "replays", "late events"
  - duplicates - we run deduplication
  - "exactly once" basically means "at least once" with idempotent sinks
  - use the hash of the record
  - dedupe the incoming data
  - either the records themselves have a unique idempotency key or an id
  - or we keep calculating a hash on the fly for them
  - dedupe using merge into to remove duplicates
    ```
    merge into target
      (
        select
          *,
          hash(all_columns),
          row_num over partition by hash order by timestamp desc
        from bronze
        where row_num = 1
      ) as source
    where target.hash = source.hash
    and target.timestamp >= current - 1 day
    when not matched the insert *
    ```
  - replays - 
    - we can use a medallion architecture
    - we store the raw, bronze data as is
    - this allows us to replay it on the silver data to reprocess
    - replaying needs to be idempotent, so we can use commands like merge into, or overwrite partitions when we do so, etc
    - for kafka to bronze, kafka topics themselves would also have some kind of a retention, e.g. 1 day and so on
    - this allows us to reprocess the data from kafka to bronze layer
  - late events -
    - if events are late, they are processed say in the next billing cycle
    - we can have a filter condition in place as well - only process events that are timestamped within say week or so
    - then, we can simply reject records older than that / move them to a dlq for processing them later
  - reconciliation - 
    - say we can have a separate batch and a separate streaming pipeline
    - a reconciliation process runs between the two
    - this helps consolidate the batch and streaming pipelines by comparing the counts etc
- your freshness slo for kafka -> click house is about 3 seconds. during peak traffic, consumer lag climbs and dashboards fall 2 minutes behind. how do you debug and fix it?
  - if the lag in kafka topics is climbing, there is a bottleneck
  - horizontal scaling of the consumer - ensure there is a consumers = partition of the kafka topic
  - vertical scaling of the consumer - ensure each consumer is ingesting at the rate data is produced into the topic
  - ensure there are no hot keys i.e. say lag should not be high for a specific partition only
  - maybe the batch size is too small (causing writes to be too frequent, causing small file like problems, etc) or too big (causing writes to be too slow)
  - ensure writing of data does not involve touching of multiple partitions of data
- dms replicates aurora mysql into snowflake. a backend dev renames a column in a table that billing joins on, and deploys on a friday evening. what breaks and how would you design the pipeline so this doesn't hurt?
  - column name changes -> column name becomes null -> joins drop rows -> under billing
  - ensure backward compatibility - instead of renaming directly, they can use say views, alias using column names, or maybe maintain duplicate columns while the downstream pipelines are migrated as well
  - staging models can add fixes like this - `coalesce(new_col, old_col)`
  - ensure that the data is dumped as is into a bronze / landing layer of sorts to ensure it can be replayed later, e.g. landing data in snowflake using `variant` column type
  - ci / cd pipeline practices - flag rename / drop on cdc tables, codeowners for reviews
  - have strong data contracts for tables
- a nightly dag builds customer facing usage aggregates. at 3am, it fails on task 7 of 12 because an upstream cdc table was not fully loaded yet. how do you redesign it so it fails loudly, recovers cleanly, and doesn't page anyone at night?
  - add polling / sensors of airflow so it checks if data has been loaded and only runs once loaded
  - e.g. check - like a watermark - e.g. max(commit_timestamp) > end_of_window, so something like if we are processing 2-3am data, data of 3.15 has already been loaded
  - add retries in case of intermittent failures - this means pipelines should be idempotent. also, retries should have exponential backoff etc configured to avoid retry storms
  - only page after even the retries have failed - page on sla breaches, not on single task failures
  - follow the write-audit-publish pattern - build in staging, audit and then swap so half built aggregates are not seen
- snowflake spend is up 40% quarter over quarter, while traffic grew only 15%. your manager wants a plan in a week. where do you look first? what levers do you pull?
  - check what change - warehouse_metering_history, query_history, etc tables can help here
  - compute costs > storage costs so target compute first
  - consolidate warehouses (using fewer warehouses keeps costs down), downscale warehouses where possible, add autoscaling / use multi cluster warehouses
  - use budgets for cost attribution etc
  - optimize expensive queries, apply clustering, etc where applicable
- about quotas - 
  - each consumer is on a plan, for example 1m calls a month. the platform needs two different things from the same calls - 
  - enforcement - block the next call the moment the consumer goes over. this has to answer in ms, so it uses kinesis -> lambda -> dynamodb / redis counters. fast but approximate
  - billing overage - charge for calls above the quota. this has to be exact and auditable, so it is counted from the event ledger in click house
  - so, there can be differences between enforcement and billing coverage, and billing coverage should be accurate
  - for e.g., counters cannot handle duplicates, a retry simply adds to the counter
  - similarly, when the quota service is down, we cannot reprocess, the proxy simply lets all calls go through. recall how rate limiters should not block the calls if they are down for user experience
- always for streaming highlight things like choosing the batch size, small file problems and compaction, using append only for bronze to avoid conflicts, etc
