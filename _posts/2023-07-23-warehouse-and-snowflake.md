---
title: Warehouse and Snowflake
---

## Warehouse

- we need data for - 
  - operational data keeping - oltp (online transactional processing). we do not need a very long history of the data
  - analytical decision making - olap (online analytical processing). millions of records are analyzed at a time, so we need fast query processing
- data warehouse - 
  - centralized location for all data sources
  - optimized for analytic processing
  - should also be user friendly for decision makers
  - must load data consistently and repeatedly using etl
- data lake - 
  - used for storing raw (unstructured) data. data is not processed (structured) unlike in warehouse, where we have data thats user friendly and optimized for performance
  - because of this, technology used by data lake is big data, while warehouses use databases
  - used when the use case is not properly defined yet. data can be taken out of lake

### Technologies in Warehouses

- relational databases - uses popular sql, primary key + foreign key to easily perform joins, etc
- in memory databases - for high query performance, used in for e.g. data marts. in traditional databases, data is stored in hdd / ssd in disk and loaded into memory for querying. this is eliminated here to increase performance. challenge - lack of durability, resolve via snapshots / images to help restore to a specific point. e.g. sap hana, amazon memory db, etc
- cubes - data is stored in a multidimensional array. my understanding - e.g. imagine we want sales for a particular customer and product, the value will already be aggregated across remaining dimensions like time. it uses the mdx language for querying
- ods - operational data storage - used for operational decision making and not analytical / strategic decision making. there is a need for realtime unlike in data warehouses. now, we can have a separate warehouse and an ods, or optionally, treat ods as the **staging layer for our warehouse** along with using it for operational decision making
- elt - we extract and load the data into the warehouse directly. then, we use the compute of the warehouse to perform transformations. this is possible with architectures like snowflake. we can also perform the e and l of the elt using realtime streaming. elt allows for much more flexible transformations as compared to etl, since in etl, we perform transformations to load data into the core layer, while the transformations move towards the client in elt
- indexes - make reads faster, writes slower. useful when we join, filter by, etc. on the data based on that column
- b tree index - this is the default / most common type of index. we can break data into a multi level tree. helpful when column has high cardinality<br />
  ![b tree](/assets/img/warehouse-and-snowflake/b-tree.drawio.png)
- bitmap index - useful when the column has a low cardinality. the position of bit corresponds to the row number, and if its 1, it means that row has that value
  
  | pk | payment type |
  | -- | ------------ |
  | 1  | visa         |
  | 2  | mastercard   |
  | 3  | mastercard   |
  | 4  | visa         |

  | payment type | bitmap |
  | ------------ | ------ |
  | visa         | 1001   |
  | mastercard   | 0110   |

- fact table indexing example - using b tree index on surrogate key (automatically setup if we use primary key?) and bitmap index on the dimension column foreign keys
- massive parallel processing - a task can be broken down into multiple subtasks. this way, these subtasks can run in parallel, thus optimizing performance. till now, we talked about breaking down "compute". for scaling storage, the underlying architecture can be shared disk architecture (underlying storage is one) or shared nothing architecture (underlying storage is also broken down)
- columnar storage - traditionally, queries are processed row wise. if we use columnar storage, data is stored column wise. so, if we need to process only a small subset of columns, we do not have to process entire rows and go through all the data like in traditional relational databases

### Warehouse Architecture

- we put the data **as is** into the staging layer of the warehouse
- we can do some minute transformations like renaming and adjusting positions of columns when performing a union between employee datasets from different sources
- we put the data into the core / access / warehouse layer by performing transformations from the staging layer. recall this is done to make data user friendly and optimized for querying
- why do we need a staging layer i.e. why not load into the warehouse layers directly from the sources - 
  - we risk burdening our oltp systems
  - also, data from sources can be in different formats like crm, files like xml, etc. we get all the data from these different sources into for e.g. a relational db, which helps us use sql / a standard way to perform transformations, e.g. perform joins easily which would not be possible otherwise when data comes from different sources
- staging layer can be temporary (more common) or permanent
- temporary - after the data is loaded into the warehouse layer, we truncate the staging layer. this way, the next time we want to load data into the warehouse layer, we need to perform a diff - we need to know the last inserted row inside the warehouse layer, and calculate the new rows inside the sources since then, and accordingly add the new data to the warehouse. this diff checking can be done based on the surrogate key, created date column if maintained, etc
- persistent staging layer - maybe easier since the entire warehouse layer can be rewritten every time?
- why data marts i.e. why not use core layer directly - 
  - core layer has a lot of tables - we can have data marts on top of this. now, users will only have access to tables which they need
  - core layer isn't burdened with queries from all consumers, and consumers only consume capacity of their data marts
  - allow us have different types of databases, e.g. in memory vs cubes based on use case
- watermark - we keep track of the last record that we load from the sources into the core layer. based on the value of the watermark, we need to put the data into the staging layer and accordingly append data to the warehouse layer
- initial load - first extraction. it is much slower and puts load on sources, so it is best if done during weekends etc. so that the systems are not impacted
- delta load - incrementally loading data. usually, timestamp fields like created / modified date. the same workflow as the initial load can be reused, but now we run it on a schedule regularly instead of just once, and we also run it on a subset of data by filtering out and retaining only the new / modified data
- sometimes, for fact tables a delta load is possible due to timestamp like columns, but for dimension tables which might be relatively smaller, we can just do a full load every time
- when loading data from (temporary) staging to core layer, we can either just insert / append or update as well. we usually do not process deletes, but can use delete markers to go about this

  ![warehouse architecture](/assets/img/warehouse-and-snowflake/data-warehouse.png)

- basic transformations when loading to core layer - deduplication, filtering out rows, filtering out columns, cleaning data (e.g. when performing a union, one source contains m and f, while another contains male / female), key generation (surrogate key)
- advanced transformations when loading to core layer - joining, splitting (split address into city, state, etc), aggregations / groupings, deriving columns (calculate profit using sales, costs, discounts)

### Dimensional Modelling

- dimensional modelling - method of organizing data, which again helps in 🥁... usability and performance
- facts - measurements e.g. profit
- dimensions - give context to the measurements e.g. product category
- note - dimensions modelling is organizing tables into facts and dimensions. but, based on use case, we can also rather organize data as flat tables in our warehouse, e.g. join and group data to produce the final aggregated form directly, instead of expecting our end users to perform aggregations
- dimensional modelling e.g. - we shouldn't have very wide tables - instead of duplicating product and category information in all rows, which can make scanning data slower, extract them to a dimension table, and only maintain the product id as a foreign key in the fact table, and product + category in a separate table. similarly with date - extract date into a different dimension table and store the date dimension id in the fact table. optionally, store pre calculated values in the date dimension table like day of week, month, etc
- e.g. if we have data like this -

  | date     | product        | category   | profit |
  | -------- | -------------- | ---------- | ------ |
  | 5/8/2023 | tangy tomato   | vegetables | 23     |
  | 6/8/2023 | cheese cracker | snacks     | 19     |
  | 5/8/2023 | chocolate cake | snacks     | 99     |

- it can be dimension modelled this way -

  | date_id  | product_id | profit |
  | -------- | ---------- | ------ |
  | 05082023 | 1          | 23     |
  | 06082023 | 2          | 19     |
  | 05082023 | 3          | 99     |

  | date_id  | month  | day_of_week |
  | -------- | ------ | ----------- |
  | 05082023 | august | saturday    |
  | 06082023 | august | sunday      |

  | product_id | product        | category   |
  | ---------- | -------------- | ---------- |
  | 1          | tangy tomato   | vegetables |
  | 2          | cheese cracker | snacks     |
  | 3          | chocolate cake | snacks     |

- identifying facts - are measurable / can be aggregated as compared to dimensions which are descriptive. facts can also mark events sometimes, which is why it is accompanied by a date
- parts of a fact table - primary key to uniquely identify a row, foreign keys to dimension tables and then the actual facts themselves
- grain - the most atomic level of a fact table - what does a row in the fact table actually represent. keep it fine level for flexibility, so that various aggregations can be made
- dimensions help in grouping / filtering facts for our use case
- we usually have multiple dimensions clustered around the fact, thus it is called a star schema - the structure looks like that of a star, with the fact table at the center and the center and the dimension tables at the tips of the star spiking out of the fact table
- fact tables to dimension tables are generally many to one
- denormalization or data redundancy might be used in warehouses to help with query performance, e.g. the column category in the product dimension table discussed above, notice the repeating category snacks
- snowflake schema - a star schema is a snowflake schema with one level. if the denormalization above is actually degrading our performance / affecting our consistency, we can also have multiple levels e.g. the category column can be extracted into its own dimension table in the product dimension we discussed. so, when we have multiple levels of dimension tables, it is also called a snowflake schema. note it can result in multiple joins, thus degrading performance
- surrogate keys - use auto generated integer ids instead of natural keys for **both** primary keys and foreign keys. they are more performant compared to natural keys which are usually strings. we can also use -1 for dummy dimensions discussed below to make our intent clearer. exception - date dimensions - instead of an auto incremented integer, represent the actual date time as an integer, e.g. 050820232232 (first 8 characters represent date, remaining 4 time)
- it is common to keep pre calculated aggregates in the fact table, e.g. instead of expecting users to perform calculations to get the profit earned per order line item, just maintain it as a separate column in the fact table which can be used. this way users do not perform erroneous calculations
- if changing to surrogate keys (recall why it is a best practice) in dimension tables, remember to correctly map the values in the fact table foreign key column to use the surrogate key instead of the natural key
- date dimension - pre calculated values like day of week, month name, etc
- foreign key / surrogate key in date dimension does not have to be meaningless i.e. auto incremented integer, it can be of the format 06082023
- optionally, since date dimension is very predictable, we can pre-populate the date dimension table for the next 10 years or so in advance
- consider populating all variations, e.g. month full name, month abbreviation, month as integer in case of date dimension

### Additivity in Facts

- additive facts - can be added across all dimensions. e.g. adding units sold across the date dimension tells us the number of units sold for a particular product, adding the units sold across the product dimension tells us the number of units sold at a particular date. note - i get confused in terminology. across product means group by date

  | product_id | units sold | date     | price |
  | ---------- | ---------- | -------- | ----- |
  | 1          | 2          | 06082023 | 23    |
  | 2          | 2          | 06082023 | 19    |
  | 1          | 5          | 10082023 | 11    |

- semi-additive facts - only added across some dimensions. e.g. imagine a fact table where the grain is our balance on a particular date for a particular folio

  | portfolio_id | date     | balance |
  | ------------ | -------- | ------- |
  | 1            | 06082023 | 100     |
  | 2            | 06082023 | 50      |
  | 1            | 10082023 | 110     |

- adding balance across the date dimension does not make sense, since balance is a cumulative number

  | portfolio_id | balance |
  | ------------ | ------- |
  | 1            | 210     |
  | 2            | 50      |

- but adding it across portfolios tells us our total balance on a particular date

  | date     | balance |
  | -------- | ------- |
  | 06082023 | 150     |
  | 10082023 | 110     |

- non-additive facts - cannot be added across any dimension. e.g. price of a product (refer the example in additive facts). there is no meaning of that fact by itself, unless multiplied with the number of units sold
- nulls for facts in fact tables - usually in tools, average ignores null, sums will treat nulls as a 0, etc. but sometimes, we might want to replace nulls with 0, it depends on our use case
- nulls for foreign keys in fact tables - nulls can result in problems, therefore introduce a row in the dimension table with a dummy value, and have the rows with null as foreign key in the fact table point to this dummy value's primary key instead
- my understanding - year to date facts - we often want year to date calculations i.e. things like month to date (days from beginning of month to last business date of that month / today, depending on use case) and so on. however, these should not be stored, because then people will start performing aggregations on these calculated values. so, its is better to just store the underlying value and perform this calculation on the fly

### Types of Fact Tables

- transactional fact table - one row / grain indicates one event / transaction. e.g. one row represents one customer support call. characteristic - will have **many dimensions** (foreign keys). disadvantage - **grow very rapidly** in size, and often need to be aggregated
- periodic snapshot fact table - one row is a **summary of multiple events over a day**, etc. e.g. number of customer support calls over a day. note that a fact table can **contain multiple facts**, like number of calls, average call duration, etc. characteristic - because of its nature, it **will not (cannot) have many dimensions**, since one row is an aggregation across a dimension. advantage - they grow slower compared to the transactional fact table
- accumulation snapshot fact table - one row summarizes many events. my understanding - unlike periodic fact table where a grain is an accumulation of the same type of event, a grain in accumulation snapshot fact table is the **accumulation of the lifetime of events of that fact**. e.g. one row has production date, shipping date, return date, etc. characteristic - it **has many date dimensions**. so, this is also an example of **a role playing dimension**. this too grows slower in size as compared to the transactional fact table
- factless fact table - a fact table can have multiple facts i.e. measurements. sometimes, there is no such fact and we just have dimensions. e.g. a fact table where a new record for every new employee that is registered. it will have dimensions like department id, employee id, position id, date, etc, but no fact. we can perform aggregations like number of employees who joined last month

### Types of Dimensions

- conformed dimensions - dimensions shared across multiple facts, e.g. date dimension. this helps combine the facts using the shared dimension. e.g. if we have two different facts for sales and profits, we can combine them using the date dimension. this helps us compare the cost and sales side by side
- degenerate dimension - e.g. we have a sales fact table, with a foreign (surrogate) key for the category dimension. the category dimension only has two columns - the surrogate key and the category name. so, we can instead directly store the category name in the sales fact table. this usually occurs in the transactional fact table
- junk dimensions - e.g. imagine we have a lot of indicators that are eating up a lot of width (therefore space) of the fact table, thus impacting its performance. so, we can instead extract these dimensions to its own table. note - the cardinality of these dimensions should be low. also, the number of rows in this junk dimension grows exponentially, e.g. m values for one column and n values for another column basically mean m * n combinations. so, we can only store the dimensions we come across in this junk dimension instead of storing all combinations in a precomputed fashion. another idea could be to split junk dimensions i.e. group related junk dimensions together

  | amount | payment_method | incoming / outgoing |
  | ------ | -------------- | ------------------- |
  | 23     | credit card    | incoming            |
  | 12     | cash           | outgoing            |

  | amount | flag |
  | ------ | ---- |
  | 23     | 1    |
  | 12     | 3    |

  | pk | payment_method | incoming / outgoing |
  | -- | -------------- | ------------------- |
  | 1  | credit card    | incoming            |
  | 3  | cash           | outgoing            |

- role playing dimension - referenced in the fact table multiple times. e.g. date dimension for order date vs shipping date. an additional optimization for our users - use views - data is not duplicated, but users see different dimension tables for the different "roles" the date dimension might be playing, thus increasing readability

### Slowly Changing Dimensions

this suggests various solutions with how we should handle changing of dimensions. dimensions are considered to fairly static as compared to facts

- type 0 - only retain the original data. only works when our dimensions do not change. e.g. date dimension
- type 1 - we overwrite the old with the new values in the dimension table. this way, we loose the old value. e.g. a new category for biscuits was introduced. so, the category changes from snacks to biscuits. issue - this can suddenly kind of maybe show reduced sales for dashboards which were monitoring the category for snacks. also, imagine if the category of snacks was replaced altogether with its more specific counterparts. any dashboards for e.g. grouping or filtering based on this dimension would suffer. understand that the idea is that for the same surrogate key in the dimension table, we overwrote its value
- type 2 - add a new row instead of update existing. any new biscuits related products will point to this new category for biscuits, while older biscuits products will continue pointing to snacks. this way, we maintain the history accurately

  | pk  | product            | category_fk |
  | --- | ------------------ | ----------- |
  | 1   | oatmeal biscuits   | 1           |
  | 2   | sunglasses         | 2           |
  | *3* | *oatmeal biscuits* | *3*         |

  | pk  | category    |
  | --- | ----------- |
  | 1   | snacks      |
  | 2   | accessories |
  | *3* | *biscuits*  |

- the issue with type 2 and its fix - we do not have a way of telling for e.g. the current categories in our system, since we now have multiple rows - snacks and biscuits, while we know that snacks is no longer a valid category in our systems. so, we can introduce new columns for effective and expiry dates in the category table. e.g. notice the values in the date dimensions below

  | pk  | category    | effective_date | expiry_date |
  | --- | ----------- | -------------- | ----------- |
  | 1   | snacks      | 06082023       | 08082023    |
  | 2   | accessories | 06082023       | 31129999    |
  | *3* | *biscuits*  | *08082023*     | *31129999*  |

- we can also mix types, e.g. mix type 1 and type 2. use type 1 for product name, type 2 for category
- type 3 - we introduce a new column, so we will have two columns - previous category and current category in the category dimension table. this way, we can lay out a clear demise plan in place with maintaining backwards compatibility. it is not for unpredictable / frequent changes, use type 2 for that. this is for a more structured change like a reorg in a company

## Snowflake

- we can create and run queries inside worksheets
- we can see the snowflake_sample_data database by default with some sample data
  ```sql
  select * from snowflake_sample_data.tpch_sf1.customer
  ```
- we use snowflake's virtual warehouses for mpp (massive parallel processing). this allows the query to be processed in parallel in small chunks
- virtual warehouse sizes - xs (1 server), s (2 servers), m (4 servers),...4xl (128 servers)
- when not in use, a warehouse can be suspended. configure this behavior automatically using auto suspend and auto resume
- creating warehouses can be done by using the ui / even issuing sql statements in the worksheet
- in the worksheet, we can set the context i.e. the current database, schema and warehouse or use commands like `use warehouse` or `use database`
- multi clustering - when creating a warehouse, we can create it as a cluster and set the minimum and maximum number of warehouses allowed
- i think multi clustering is an enterprise feature, i do not see the option for it in the ui
- based on when load is high, this cluster will automatically add or remove warehouses for us (think asg in aws)
- multi clustering is better for more number of queries, for more complex queries we might need to consider vertical scaling (increase size of warehouse)
- notice difference between **more number of queries** vs **more complex queries**
- so basically there is a queue of the queries, which gets assigned one by one to the warehouses
- scaling policy - standard is the default whereas economy preserves the cost
  - standard - add additional virtual warehouses if there is a task queued
  - economy - add additional virtual warehouses if the estimated time for the current cluster is at least 6 minutes
- optimize virtual warehouse usage - 
  - have dedicated virtual warehouses for different use cases since they have different workload types
  - understand horizontal scaling (more concurrent queries) vs vertical scaling (more complex queries), and choose the right one based on use case
- snowflake editions - **standard**, **enterprise** (has all features of standard with additional features like multi cluster warehouse, time travel upto 90 days as opposed to the 1 day inside standard, materialized views, etc), **business critical** (all features of enterprise with extended support etc) and **virtual private** (think dedicated hosts in aws ec2)
- we are charged for storage (after compression) and compute (warehouse)
- <u>for storage</u>, we have two options to choose between - **on demand** (pay for what you use) and **capacity** (pay upfront)
- 40$ per tb per month for on demand storage, 23$ per tb per month for capacity storage
- for xs virtual warehouse, we consume 1 credit per hour consumed by second i.e. if we consume for half an hour, we use half a credit (minimum is one minute). number of credits consumed by a warehouse depends on size (1 credit per server, so medium would consume 4 credits per hour)
- for virtual warehouse, we are charged in terms of credits. there is a conversion of credit and dollars associated with it. e.g. for cloud provider as aws and in the us-east-1 region - 2$ per credit for compute if using standard edition
- methods of loading data in snowflake - 
  - **bulk / batch loading** - uses our compute. e.g. copy command
  - **continuous loading** - doesn't use our compute, serverless. e.g. snowpipe
- stages - location from where data can be loaded
  - **external** - maintains url, access credentials, etc. e.g. s3 buckets
  - **internal** - local storage maintained by snowflake
- note - there are costs considerations around data transfer when moving data from different regions or different clouds vs same cloud and same region
- creating a stage - 
  ```sql
  create or replace database our_first_db;

  create or replace database manage_db;
  create or replace schema manage_db.external_stages;
  
  create or replace file format manage_db.external_stages.csv_format
    type = csv field_delimiter = ',' skip_header = 1;

  create or replace stage manage_db.external_stages.bucketsnowflakes3
    url = 's3://bucketsnowflakes3'; -- the bucket is unprotected

  list @manage_db.external_stages.bucketsnowflakes3; -- lists files

  create or replace table our_first_db.public.orders (
    order_id varchar(30),
    amount int,
    profit int,
    quantity int,
    category varchar(30),
    subcategory varchar(30)
  );

  copy into our_first_db.public.orders
    from @manage_db.external_stages.bucketsnowflakes3
    file_format = manage_db.external_stages.csv_format
    files = ('OrderDetails.csv');
  ```
- doing some transformations before loading data - 
  ```sql
  copy into orders_ex (order_id, profit, profitable_flag) from (
    select
      s3.$1,
      s3.$2,
      iff(cast(s3.$3 as int) > 0, 'profitable', 'non profitable')
    from
      @manage_db.external_stages.bucketsnowflakes3 s3
  )
  file_format = manage_db.external_stages.csv_format
  files = ('OrderDetails.csv');
  ```
- instead of `files` where we specify the full names of the files in an array like structure, we can specify a regex to match file names using the `pattern` keyword
- lets say we have a column of type integer in the create table statement, but the data in the csv inside s3 is bad and one of the rows in the csv has a string for the corresponding column. we can configure the behavior on encountering an error as follows - 
  ```sql
  -- ...
  files = ('OrderDetails_error.csv')
  on_error = skip_file;
  ```
  the options for `on_error` are - 
  - **abort_statement** - the default. abort the copying and rollback the rows copied
  - **continue** - skip the row where the error happened and continue the loading of data
  - **skip_file** - skip the file where the error happened but continue loading other files. we can also configure the error limit per file in this case, e.g. **skip_file_3** would mean skip the file if three or more errors happen (so skip_file actually means skip_file_1?)
- before actually copying over the data, we can also do a dry run of the copy - this way we can know beforehand if the copying will go through without actually executing it. we configure this using **validation_mode** i.e. if we provide this option, the data is not actually copied
  ```sql
  -- ...
  files = ('OrderDetails_error.csv')
  validation_mode = return_errors;
  ```
  the two options are - 
  - **return_errors** - returns all errors if any during the execution of the entire thing. the output will contain the files where the error occurred, the row number, the reason of the error, etc
  - **return_n_rows** - e.g. return_5_rows would mean perform the validation on only the first 5 rows, and if a failure occurs, throw the exception, and if no, return these 5 rows. note - the difference is this returns the processed rows while the above returns files where exceptions occurred
- if column has type `varchar(10)` but the source csv column has values of larger lengths, the copy command will fail. we can prevent this failure by using `truncatecolumns = true`, so that columns with greater lengths are just truncated i.e. electronics will become electronic
- by default, if we rerun the same copy command more than once, the rows will not be duplicated 🤯. we can change this behavior by providing `force = true`. note that this can lead to duplicates
- to view the history of copy commands i.e. source stage, success vs failure count, etc, use - 
  ```sql
  select * from copy_db.information_schema.load_history;
  ```
- note that the command above was for a single database. to view the same thing across databases, use the snowflake db
  ```sql
  select * from snowflake.account_usage.load_history;
  ```
- for loading unstructured data (e.g. json), we might not be able to load it directly like above i.e. csv rows were easily mapping one to one with table rows
- so, we first load the json to a new table which has only one column of type `variant`
- we then transform this data (e.g. flatten) to load into our own tables
  ```sql
  create or replace stage manage_db.public.s3_json
      url = 's3://bucketsnowflake-jsondemo';

  create or replace file format manage_db.public.json
      type = json;

  create or replace table our_first_db.public.json_demo (
      raw_json variant
  );

  copy into our_first_db.public.json_demo
    from @manage_db.public.s3_json
    file_format = manage_db.public.json
    files = ('HR_data.json');
  ```
- now, assume the json has the format as below - 
  ```json
  {
    "city": "Louny",
    "first_name": "Dag",
    "gender": "Male",
    "id": 2,
    "job": {
      "salary": 43000,
      "title": "Clinical Specialist"
    },
    "last_name": "Croney",
    "prev_company": [
      "MacGyver, Kessler and Corwin",
      "Gerlach, Russel and Moen"
    ],
    "spoken_languages": [
      { "language": "Assamese", "level": "Basic" },
      { "language": "Papiamento", "level": "Expert" },
      { "language": "Telugu", "level": "Basic" }
    ]
  }
  ```
- we can for e.g. query city as follows - 
  ```sql
  select raw_json:city from our_first_db.public.json_demo;
  ```
- recall raw_json was the variant column in our table. the output for e.g. of above would be a column containing cells of the format `"Bakersfield"`. so, now to convert this to a string i.e. `Bakersfield` (without quotes), we can do the below -
  ```sql
  select raw_json:city::string from our_first_db.public.json_demo;
  ```
- for nested object e.g. refer job in the json, this would work -
  ```sql
  raw_json:job.salary::int job_salary
  ```
- for nested arrays e.g. refer languages in the json, this would work - note how we can only grab one language at a time since this is like one to many
  ```sql
  raw_json:spoken_languages[0].language::string first_language
  ```
- so, the above solution works for arrays if we are fine with introducing new columns like first_language, second_language, etc
- but what if we want a table that is like if we had to perform a join between employee data and spoken languages - 
  ```sql
  select
      json_demo.raw_json:first_name::string first_name,
      flattened.value:language::string language
  from
      our_first_db.public.json_demo json_demo,
      table(flatten(raw_json:spoken_languages)) flattened;
  ```
- the output of this command would look like this - 

  | first_name | language   |
  | ---------- | ---------- |
  | Portia     | Kazakh     |
  | Portia     | Lao        |
  | Dag        | Assamese   |
  | Dag        | Papiamento |
  | Dag        | Telugu     |

- now theoretically we could have done as below - 
  ```sql
  select
      raw_json:first_name::string first_name,
      raw_json:spoken_languages[0].language::string language
  from
      our_first_db.public.json_demo
  union all
  select
      raw_json:first_name::string first_name,
      raw_json:spoken_languages[1].language::string language
  from
      our_first_db.public.json_demo
  union all
  select
      raw_json:first_name::string first_name,
      raw_json:spoken_languages[2].language::string language
  from
      our_first_db.public.json_demo;
  ```
- _notice the index of spoken_languages above_. the downside is the output would be as follows i.e. there would be nulls inside the language row for people having less than three languages

  | first_name | language    |
  | ---------- | ----------- |
  | Portia     | Kazakh      |
  | Portia     | <i>null</i> |
  | Portia     | <i>null</i> |
  | Dag        | Assamese    |
  | Dag        | Papiamento  |
  | Dag        | Telugu      |

- caching - snowflake has caching enabled by default, and it is cached for 24 hrs. to ensure this however, ensure that queries go on the **same warehouse**. this is why having dedicated virtual warehouses for dedicated groups can help
- we can confirm if the cache was used by clicking on the query id - it shows table scan + aggregation for the first time, and shows query result reuse the second time onwards
- clustering - snowflake creates cluster keys for columns to create micro partitions. this prevents full table scans
- we can explicitly do clustering
  - do it for columns which are usually used in where clauses
  - do it for columns frequently used in joins (similar to above)
  - avoid extremes - 
    - not useful for columns which have too many unique values, e.g. id
    - not useful for columns which have too less unique values, e.g. gender
- we can confirm clustering performance by clicking on the query id - it shows how many total partitions are there and how many partitions are used
- connecting to s3 securely using integration objects - 
  - create an iam role -
    - select the trusted entity as the same account id in which this role is being created
    - select the requires external id parameter and enter a random value here for now
  - above steps result in a trust policy like below. note that both values entered above are placeholders for now -
    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "AWS": "arn:aws:iam::8502136:root"
          },
          "Action": "sts:AssumeRole",
          "Condition": {
            "StringEquals": {
              "sts:ExternalId": "something-random"
            }
          }
        }
      ]
    }
    ```
  - create an integration object inside snowflake - 
    ```sql
    create or replace storage integration snowflake_s3_demo
      type = external_stage
      storage_provider = s3
      enabled = true
      storage_aws_role_arn = 'arn:aws:iam::8502136:role/SnowflakeDemo'
      storage_allowed_locations = ('s3://snowflake-demo-3b98x97')
    ```
  - run `describe storage integration snowflake_s3_demo` and copy the values under `STORAGE_AWS_IAM_USER_ARN` and `STORAGE_AWS_EXTERNAL_ID`. replace the values in the trust policy for principal and external id with this
  - now, we can use the integration object when creating a stage - 
    ```sql
    create or replace stage manage_db.external_stages.csv_folder
      url = 's3://snowflake-demo-3x7'
      storage_integration = snowflake_s3_demo
      file_format = manage_db.file_formats.csv_fileformat
    ```
- snowpipe - enables loading of data automatically when for e.g. a new file is added to the s3 bucket
- snowpipe is serverless i.e. our compute is not used for this
- this near realtime ability is achieved via s3 notifications sent to snowflake managed sqs queue
- setting up a snowpipe - 
  - create a pipe - 
    ```sql
    create pipe snowpipe_demo.public.s3
      auto_ingest = true as
          copy into snowpipe_demo.public.employee
              from @snowpipe_demo.public.s3_csv
              file_format = snowpipe_demo.public.csv
              pattern = '.*employee.*\.csv';
    ```
  - run the describe command to grab the queue arn - `describe pipe snowpipe_demo.public.s3`
  - set up event notification on the s3 bucket with this sqs arn as the destination
- to view pipes, use `show pipes` or we can specify database as well using `show pipes in database snowpipe_demo`
- to make changes to the pipe, pause it first - 
  ```sql
  alter pipe snowpipe_demo.public.s3 set pipe_execution_paused = true;
  ```
- even if we want to make changes to data, e.g. to have existing files picked up the snowpipe, pause the snowpipe before running the copy command manually to load the data of existing files
- time travel - e.g. we make an erroneous update like this - 
  ```sql
  update test set first_name = 'Shameek';
  ```
- we can now go back in time to look at what the data looked like before the erroneous update - 
  ```sql
  -- go back a specific amount of seconds
  select * from test at (offset => -60 * 2);
  -- OR go back to a certain timestamp
  alter session set timezone = 'UTC';
  select current_timestamp;
  select * from test at (timestamp => '2023-07-28 03:36:21.779'::timestamp);
  -- OR before a certain query (the erroneous update in this case) was executed
  select * from test before (statement => '01adeb9c-0604-af37-0000-007bd70792b5');
  ```
- note - for the `before` statement query issued above, snowflake has a history of all queries executed which we can see in the ui
- e.g. of restoring - 
  ```sql
  truncate table test;
  insert into test (
    select * from test before (statement => '01adebc9-0604-af9c-0000-007bd707b315')
  );
  ```
- optionally, load the time traveled data into a backup table and then load it from here into the original table instead of loading the data into the original table directly as described above
- if we accidentally drop a table / schema / database, we can run the undrop command, e.g. `undrop table test` to restore it
  - optionally, if we accidentally run `create or replace table test...`, we can restore the test table before the replace command was executed by first renaming the current wrongly instantiated table, e.g. `alter table test rename to test_aux`, and then running the undrop command to restore the test table before the replace to our database
- we can go back upto 90 days in editions enterprise and above, and upto 1 day in standard edition. however, the default is set to 1. therefore, we have to change the retention period manually to 90 days for editions other than standard - 
  ```sql
  alter table test_tt set data_retention_time_in_days = 2;
  ```
- failsafe - protection of historical data in case of a disaster
- the failsafe period **starts after the time travel period ends**
- the failsafe period is for 7 days
- this is not queryable / usable by front users like in time travel. the idea is to reach out to snowflake support after a disaster occurs to restore the table to a previous state
- the failsafe period cannot be configured like time travel
- table type - table type is a property of the table. the different table types are - 
  - permanent tables - this is the default. we have both time travel (0-90 days) and failsafe
  - transient tables - we have time travel (0-1 day). but no failsafe
    ```sql
    create or replace transient table -- ...
    ```
  - temporary - we have time travel (0-1 day) but no failsafe. note - this is only scoped to a session i.e. we loose this table when the session is closed / cannot view it from other sessions
    ```sql
    create or replace temporary table -- ...
    ```
- the types above are not only scoped to a table, but to database / schemas as well
- we would pay for additional storage for failsafe / time travel, so use transient tables for "reproducible" data like staging layer of warehouse?
- **zero copy cloning** - when we use the clone command, the new table reuses the data and metadata of the older table. this way, it is cost efficient. the additional updates however do not effect one another
- we can clone storage objects (databases, tables, schemas) and stages, file formats, tasks, etc
- we can use time travel with cloning as well - 
  ```sql
  create table cloned
    clone source
    before (timestamp => ...)
  ```
- swap table / schemas - swaps the underlying metadata and data as well
  ```sql
  alter table swap_demo.public.development
    swap with swap_demo.public.production;
  ```
- data sharing - data is not copied again, so it is automatically immediately up to date for the consumer
- snowflake users it is shared with have to use their own compute resources for this
- creating a share - 
  ```sql
  create or replace share orders_share;
  grant usage on database data_share_demo to share orders_share;
  grant usage on schema data_share_demo.public to share orders_share;
  grant select on table data_share_demo.public.orders to share orders_share;
  ```
- add account to share - 
  ```sql
  alter share orders_share add account = <<consumer-account>>;
  ```
- create a database from the share inside the consumer account - 
  ```sql
  create database orders_db from share <<producer-account>>.orders_share;
  ```
- now, the consumer can start consuming the data from this newly created database
- till now, we assumed that the consumers have their own snowflake account when sharing data. non snowflake users can access shares via a reader account. however, our compute is used in this case
- create a reader account
  ```sql
  create managed account analytics
    admin_name = analytics
    admin_password = 'P4$$w0rcl'
    type = reader;
  ```
- add the reader account to the share - 
  ```sql
  show managed accounts; -- use the value of "locator" for the value below
  alter share orders_share add account = QBB35692;
  ```
- in the reader account, create database from share - 
  ```sql
  show shares;
  create database orders_db from share <<producer-account>>.orders_share;
  ```
- create a virtual warehouse inside the reader account (looks like parent account virtual warehouses and reader account virtual warehouses are not exposed to each other?)
- for granting select on all tables in a database / schema - 
  ```sql
  -- instead of
  grant select on table data_share_demo.public.orders to share orders_share;
  -- do
  grant select on all tables in database data_share_demo to share orders_share;
  -- or 
  grant select on all tables in schema data_share_demo.public to share orders_share;
  ```
- views - e.g. instead of sharing all data, we want to share some restricted data. we can do this via views. e.g. - 
  ```sql
  create or replace view data_share_demo.public.loan_payments_cpo as (
    select loan_id, principal
      from data_share_demo.public.loan_payments
      where loan_status = 'COLLECTION_PAIDOFF'
  );
  ```
- however, the issue with the above is for e.g. if we grant a role select on this view, and if a user with that role runs the command `show views`, they can view things like view definition. ideally, i would not have wanted to expose the fact that loan_status maintains an enum, since it is not even present in the projection clause of the view creation statement
- creating a secure view - `create or replace secure view...`
- note - we cannot use shares with normal views, we have to use secure views
- data sampling - use a subset of dataset when for e.g. testing workflows out
- two methods of sampling in snowflake - 
  - row or bernoulli method - every row is chosen with a probability of percentage p. so, it maybe more random since continuous rows are not chosen
  ```sql
  select * from snowflake_sample_data.tpcds_sf10tcl.customer_address
    sample row (1) seed (25); -- seed helps reproduce same results when using randomness
  ```
  - block or system method - every block is chosen with a probability of percentage p. so, it maybe a bit more quicker, since it uses micro partitions
  ```sql
  select * from snowflake_sample_data.tpcds_sf10tcl.customer_address
    sample system (1) seed (25);
  ```
- tasks - it stores an sql statement that can be scheduled to be executed at a certain time or interval
  ```sql
  create or replace task task_db.public.customer_insert
    warehouse = compute_wh
    schedule = '1 minute'
    as
    insert into customers (created_date) values (current_timestamp);
  ```
- notice how tasks use our compute unlike snowpipe, materialized views, etc?
- on running `show tasks`, feels like tasks are suspended by default. so, run the following - 
  ```sql
  alter task task_db.public.customer_insert resume;
  ```
- for crons, - `schedule = 'USING CRON * * * * * UTC'`
- tree of tasks - a root task, which can then have children (multiple levels are allowed). one child task can have one parent task, but one parent task can have multiple children. when declaring a child task, instead of `schedule`, we use `after task_db.public.parent_task`
- note - i think the parent task needs to be suspended first i.e. we first suspend the parent task, create and resume the child task and then finally resume the parent task, else we get an error. even as a best practice that feels right
- getting execution history of tasks like errors, completion time, etc. it also has records for the next queued execution
  ```sql
  select * from table(task_db.information_schema.task_history(task_name => 'customer_insert'));
  ```
- tasks can also have a `when` clause, and the task is executed only if the condition evaluates to true, else the task is skipped
- streams - helps with cdc (change data capture) to capture the delta (changes) of the source data. so, streams help capture dml (i.e. crud) changes
- we only pay for the storage of metadata columns of the stream that helps determine whether the row was deleted, updated, etc. the rows in streams reference the original source for the actual data
- create a stream - 
  ```sql
  create or replace stream streams_demo.public.sales_raw_stream
      on table streams_demo.public.sales_raw;
  ```
- we can run select on the stream table just like we would on a normal table
  ```sql
  select * from streams_demo.public.sales_raw_stream;
  ```
- the stream has three additional columns - `METADATA$ACTION`, `METADATA$ISUPDATE`, `METADATA$ROW_ID`
- once we process the stream, the data in the stream is deleted. it feels like stream is like an "auto generated temporary staging layer" of the warehouse. e.g. if i insert into a table by running a select on the stream table, the stream table clears up
- an update corresponds to two rows in streams - an insert and a delete for `METADATA$ACTION`, and true for `METADATA$ISUPDATE` in both rows. so, `METADATA$ACTION` is always either insert or delete, and we need to determine if the change is due to an update using `METADATA$ISUPDATE`
- e.g. of using streams - imagine store is a static reference table. we want to process the changes in sales table to a table used for analytics, that is like a join between sales and store tables. so, we can assume that for every record in the sales table, there would be a record in this sales analytics table, with added information about the store. so, the stream is needed for the sales table, and not the store table, and we update the final table used for analytics by joining the sales stream table and store reference table
  ```sql
  create or replace stream streams_demo.public.sales_raw_stream
    on table streams_demo.public.sales_raw;

  merge into streams_demo.public.sales_final sf
  using (
      select sa.*, st.employees, st.location
      from streams_demo.public.sales_raw_stream sa
      join streams_demo.public.store_raw st
      on sa.store_id = st.store_id
  ) src
  on src.id = sf.id
      when
          matched
          and src.METADATA$ACTION = 'DELETE'
          and not src.METADATA$ISUPDATE
          then delete
      when
          matched
          and src.METADATA$ACTION = 'INSERT'
          and src.METADATA$ISUPDATE
          then update set
              sf.product = src.product,
              sf.price = src.price,
              sf.amount = src.amount,
              sf.store_id = src.store_id,
              sf.location = src.location,
              sf.employees = src.employees
      when
          not matched
          and src.METADATA$ACTION = 'INSERT'
          and not src.METADATA$ISUPDATE
          then insert values (
            src.id,
            src.product,
            src.price,
            src.amount,
            src.store_id,
            src.location,
            src.employees
          );       
  ```
- we can use streams in the `when` clause of tasks! so, we can pretty much build an entire etl pipeline just using snowflake - 
  ```sql
  when system$stream_has_data('stream-name')
  as -- the entire sql for stream processing defined above
  ```
- stream types - standard and append-only. append-only captures only inserts while standard captures inserts, updates and deletes.  default is standard as seen above
- change tracking - tables have a change tracking property. we can set it to true as follows - 
  ```sql
  alter table names set change_tracking = true;
  ```
- now, with change tracking enabled, we can basically see the changes in a table in the same format as we saw in streams - 
  ```sql
  select * from names
  changes (information => default)
  at (offset => -240);
  ```
- my understanding - **the difference is that unlike streams, this does not get deleted. its almost like we have a rolling window of cdc until the time travel / retention period**
- again - notice the use of default in the changes clause above. we can also use append_only instead
- materialized view - if we run an expensive query frequently, it can lead to bad user experience. so, we can instead use materialized views
  ```sql
  create or replace materialized view orders_mv as 
  -- ...
  ```
- so, materialized views are updated automatically when its base tables are updated. this updating is maintained by snowflake itself. when we query using materialized view, data is always current
- this means that if the materialized view has not been updated completely by the time we initiate a query, snowflake will use the up to date portions of the materialized view and fetch the remaining data from the base tables
- since background services of snowflake are being used for updating materialized views, it adds to the cost independent of our virtual warehouses
- use materialized views if data is not changing frequently and view computation is expensive. if data is changing frequently, use change tracking / streams + tasks
- [has a lot of limitations i think 😭](https://docs.snowflake.com/en/user-guide/views-materialized#limitations-on-creating-materialized-views) - joins, some aggregation functions, having clause, etc are not supported at the time of writing
- dynamic data masking - returns masked results for security purpose, e.g. pii (personally identifiable information)
  ```sql
  create or replace masking policy phone
    as (val varchar) returns varchar -> 
      case
        when current_role() in ('ACCOUNTADMIN') then val
        else '#####'
      end;
  
  alter table customers
    modify column phone_number
    set masking policy phone;
  ```
- some more masking policy examples - 
  - we just want to see the domain of the emails - 
    ```sql
    when current_role() not in ('ACCOUNTADMIN') then regexp_replace(val, '+\@', '****@')
    ```
  - we want to be able to do comparisons, e.g. we want to join by name, but we do not want to allow seeing of the names. we can use `sha2(val)`, so that while users see an encrypted value, it is a consistent hash, so running it on the same value will produce the same result

### Access Management

- rbac (role based access control) i.e. privileges are assigned to roles, which are inturn assigned to users
- in snowflake we have dac (discretionary access control) i.e. every object has an owner, who can grant access to that resource. so, all objects have an owner, which is a role, and this role has all privileges on that object by default. the objects on which we can grant privileges are also called securable objects, e.g. warehouses, databases, tables, etc
- role hierarchy - the parent role will automatically have the privileges of all of its child roles
- my understanding
  - a user can have multiple roles
  - the public role is assigned to all new users by default
  - the default role is the one that determines what role to use when for e.g. a new worksheet is opened by the user, or maybe like when no role is specified
  - for all roles to be used, set secondary role to all. e.g. we have a system account, which has warehouse access via a different role, and access to tables via yet another role. we cannot specify both roles in for e.g. the jdbc url. so, we can instead set the secondary role to all for permissions from all roles to kick in for a user anytime the user makes a query
- system defined roles - 
  - account admin - 
    - the top level role
    - can manage things like reader accounts
    - avoid using this, and users using this should use mfa
    - do not create objects using this, as otherwise we would have to manually add privileges to users that need it (it is at the top of hierarchy so no role inherits "from" it)
    - only account admin can view things like usage / billing information
  - security admin -
    - can manage any object grant globally - my doubt - does this mean it can do this for objects that it (or its nested children) do not own as well?
    - can be used to create and manage roles but thats usually done by useradmin?
    - example - (note the hierarchy i.e. sales_user is a child of sales_admin, which is inturn a child of sysadmin. this is a best practice)
      ```sql
      create or replace role sales_admin;
      create or replace role sales_user;

      grant role sales_user to role sales_admin;
      grant role sales_admin to role sysadmin;

      create or replace user simon_sales_user
          password = 'p@$$worcl'
          default_role = sales_user;
      grant role sales_user to user simon_sales_user;

      create or replace user olivia_sales_admin
          password = 'p@$$worcl'
          default_role = sales_admin;
      grant role sales_admin to user olivia_sales_admin;
      ```
  - sysadmin -
    - create warehouses, databases, etc
    - custom roles should be attached to sysadmin as a best practice. this way, the objects created by these custom roles can be managed by sysadmin. otherwise, this would not be possible
    - example - we run the below from inside sysadmin. despite us granting ownership to sales_admin, sysadmin can still perform all the operations on these objects since sysadmin inherits permissions from sales_admin. refer above, this setup was basically done by security admin
      ```sql
      create or replace database sales_db;
      grant ownership on database sales_db to role sales_admin;
      grant ownership on schema sales_db.public to role sales_admin;
      ```
    - now, from inside sales_admin, we can run the below - 
      ```sql
      grant usage on database sales_db to role sales_user;
      grant usage on schema sales_db.public to role sales_user;
      grant select on table sales_db.public.customers to role sales_user;
      ```
  - useradmin - 
    - used to create / manage users and roles
    - unlike securityadmin, it does not have ability to grant privileges to all objects, only on objects that it owns
  - public role 
    - every user is granted this role by default

![role hierarchy](/assets/img/warehouse-and-snowflake/role-hierarchy.png)
