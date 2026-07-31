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
- write an sql query to retrieve an entire organizational hierarchy of direct and indirect reports
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

### Question 2

- you have started reading many books but did not finish all of them, so you are lost and you want to reorganise your library to know what to read next
- `dim_book_library`
  - `id` - a unique id of the book
  - `author` - author of the book
  - `title` - title of the book
  - `total_pages` - the total number of pages in the book
- `fct_pages_read`
  - `year` - the year when pages were read
  - `month` - the month when pages were read
  - `book_id` - the unique id of the book
  - `pages_read` - the number of pages that were read in that year and month
- write a select query returning all books from the library sorted in a specific order - 
  - should have two columns - `author` and `title`
- first, order by the authors that have the max number of books in library
- then, order by the min number of remaining pages to finish all the books by a particular author
- then, order by the min number of remaining pages to finish a particular book
- finally, order by the title of the books
- solution pointers - 
  - left join, for e.g. books never read by us need to be included in output as well
  - i was able to arrive after breaking down the problem several times - may not be the best solution, but approach in this manner

```
with author_count_stats as (
    select
        author,
        count(*) as total_books
    from
        dim_book_library
    group by
        author
),
book_pages_read as (
    select
        book_id,
        sum(pages_read) as pages_read
    from
        fct_pages_read
    group by
        book_id
),
remaining_book_pages as (
    select
        total_pages - coalesce(pages_read, 0) as book_pages_remaining,
        title,
        author
    from
        dim_book_library
        left join book_pages_read
        on dim_book_library.id = book_pages_read.book_id
),
remaining_author_pages as (
    select
        sum(total_pages) - coalesce(sum(pages_read), 0) as pages_remaining,
        author
    from
        dim_book_library
        left join book_pages_read
        on dim_book_library.id = book_pages_read.book_id
    group by
        author
),
author_stats as (
    select
        author_count_stats.author as author,
        total_books,
        pages_remaining as author_pages_remaining
    from
        author_count_stats
        join remaining_author_pages
        on remaining_author_pages.author = author_count_stats.author
),
author_book_stats as (
    select
        author_stats.author as author,
        total_books,
        author_pages_remaining,
        book_pages_remaining,
        title
    from
        author_stats
        join remaining_book_pages
        on remaining_book_pages.author = author_stats.author
)
select
    author,
    title
from
    author_book_stats
order by
    total_books desc,
    author_pages_remaining asc,
    book_pages_remaining asc,
    title asc
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
