---
title: SQL
tags: ["database", "sql"]
---

In this blog, I would cover my understanding of SQL, specifically mysql.

# About

SQL is a standard that has been adopted by various vendors for their implementations. the implementations include db2 by ibm, oracle rdbms by oracle, sql server by microsoft, postgresql and mysql which are opensource, etc. this blog is about mysql implementations of concepts, so things can be different for other distributions

# Architecture

- application / client layer - helps in client connections, authentication and authorization
- server layer - it parses, analyzes and optimizes queries. it also maintains cache and buffers. it makes an execution plan which gets fed into the storage engine layer
- storage engine layer - this layer actually writes and retrieves data from the underlying physical storage. mysql supports different storage engine layers like InnoDB, MyISAM, etc. can view by `show engines` InnoDB is the default. the way transactions etc. are carried out differs from one storage engine layer to another

# Database Commands

- `show databases` - list all the database. it would only show the databases that we are authorized to view
- `use database_name` - selecting the database with name database_name. future queries would be performed on the selected database
- `show create database mysql` - shows the command using which the database was created
- `show tables` - display the tables in the current database
- `create database if not exists movie_industry` - create the database if it doesn't exist
- `drop database if exists movie_industry` - drop the database if it exists

# Table Commands

- we have a lot of data types in mysql, look [here](https://dev.mysql.com/doc/refman/8.0/en/data-types.html), categorized into numeric data types, date and time data types, string data types, spatial data types, json data type. e.g. numeric data type can have int, bigint, tinyint, decimal
- `describe user` - describe the structure of a table
- `show create table user` - shows the command using which the table was created
- we can provide a constraint for non-nullable fields using `not null`
- we can provide a default value using `default`
- we can automatically assign the next integer using `auto_increment`. auto increment has a few restrictions -
  - there can be only one column in a table marked as auto increment
  - the auto increment column should be indexed
  - the auto increment column cannot have a default value
- create table example -
  ```sql
  create table if not exists actors (
    id int auto_increment,
    first_name varchar(20) not null,
    second_name varchar(20) not null,
    dob date not null,
    gender enum("male", "female", "other") not null,
    marital_status enum("married", "divorced", "single", "unknown") not null default "unknown",
    net_worth_in_millions decimal not null,
    primary key (id)
  );
  ```
- we can use `default` while inserting data to instruct mysql to use the default value. it would work for auto increment id as well. we can also not specify the column name altogether
- insert into table by not specifying id -
  ```sql
  insert into actors (first_name, second_name) values ("jennifer", "aniston");
  ```
- insert into table by specifying id which is auto increment -
  ```sql
  insert into
    actors (first_name, second_name, id)
  values
    ("jennifer", "aniston", default),
    ("johnny", "depp", default);
  ```
- querying in tables by selecting all columns -
  ```sql
  select * from actors;
  ```
- select specific columns and filter results using `where` clause -
  ```sql
  select first_name, second_name from actors where first_name = "tom";
  ```
- we have a lot of operators in mysql, look [here](https://dev.mysql.com/doc/refman/8.0/en/non-typed-operators.html)
- we can use the `like` operator with where clause for pattern matching. `_` can be used to match exactly one character, `%` can be used to match 0 or more characters -
  ```sql
  select * from actors where first_name like '_enn%';
  ```
- we can use `cast` to change data type
- order query results by number, but number would be treated as strings i.e. 2 > 10
  ```sql
  select * from actors order by cast(age as char);
  ```
- we can `limit` the number of results returned, and `offset` it from a certain point. note: sql will automatically handle even if our limit or offset goes beyond the number of rows by giving back sensible results
  ```sql
  select first_name from actors order by age desc limit 4 offset 3;
  ```
- delete selective rows -
  ```sql
  delete from actors where gender = "male" order by age desc limit 3;
  ```
- for deleting all rows, a faster method is `truncate actors`, it would delete the table entirely and recreate it
- update selective rows -
  ```sql
  update actors set age = 25 order by first_name limit 3;
  ```
- we can alter name and data type of column, provide a default value. note: while altering data type, the new and old data types should be compatible -
  ```sql
  alter table actors change first_name firstName varchar(20) default "anonymous";
  ```
- adding a column -
  ```sql
  alter table actors add first_name varchar(20);
  ```
- deleting a column -
  ```sql
  alter table actors drop first_name;
  ```
- indices help in querying data efficiently, just like we search for words in a dictionary. downside is the overhead of creating, storing and maintaining these indices. internally, mysql uses b / b+ trees with the keys of the nodes as primary indices. this helps in efficient querying of data
- we can create an index on name to speed up queries -
  ```sql
  alter table actors add index index_name (first_name);
  ```
- we can also drop that created index -
  ```sql
  alter table actors drop index index_name;
  ```
- alter table name -
  ```sql
  alter table actors rename Actors;
  ```
- delete table -
  ```sql
  drop table if exists actors;
  ```
- aliases can be used to give temporary names, as they help us write queries that are more readable
  ```sql
  select
    t1.first_name as a, t2.first_name as b
  from
    actors as t1, actors as t2
  where
    t1.net_worth_in_millions = t2.net_worth_in_millions and t1.id > t2.id;
  ```
- distinct is a post-processing filter i.e. works on the resulting rows of a query & can be used on multiple columns
  ```sql
  select distinct first_name, last_name from actors;
  ```
- aggregate methods like `min`, `max`, `sum`, `count` can be used -
  ```sql
  select count(*) from actors;
  ```
- group by - helps group rows based on a particular column. we cannot use columns **not** present in group by for select, having, or order by clauses
  ```sql
  select gender, avg(net_worth_in_millions) from actors group by gender;
  ```
- while the where clause helps us filter rows, the having clause helps us filter groups
  ```sql
  select
    marital_status, avg(net_worth_in_millions) as net_worth_in_millions
  from
    actors
  group by
    marital_status having net_worth_in_millions > 200
  ```
- inserting a foreign key - 
  ```sql
  alter table digital_assets
  add constraint digital_assets_actor
  foreign key (actor_id) references actors(id);
  ```

# Joins

- types of joins -
  - **cross join** - cartesian product of the rows of the two tables
  - **inner join** - all rows of both the tables where the condition (called the join predicate) is satisfied
  - **left outer join** - result of inner join + all rows of the left table, with null for the columns of the right table
  - **right outer join** - result of inner join + all rows of the right table, with null for the columns of left table
  - **full outer join** - result of inner join + all rows of the left table, with null for the columns of the right table + all rows of the right table, with null for the columns of the left table
  - **self join** - using the same table on both sides of the join
- inner join example - assume digital_assets table contains social media links, where the asset_type is an enum containing twitter etc. and url is the link
  ```sql
  select
    actors.first_name, actors.second_name, digital_assets.asset_type, digital_assets.url
  from
    actors inner join digital_assets
  on
    actors.id = digital_assets.actor_id;
  ```
  if the same column name is not there in the two tables, the "table." prefix can be removed e.g. `first_name` in place of `actors.first_name`, though i prefer being explicit. also, the two tables in inner join can be same
- the above query can be rewritten as below, with **no** performance impact
  ```sql
  select
    actors.first_name, actors.second_name, digital_assets.asset_type, digital_assets.url
  from
    actors, digital_assets
  where
    actors.id = digital_assets.actor_id;
  ```
- union clause - merely clubs results together, doesn't join the tables. e.g. the following query will display a list of all actress names, followed by all male actor names
  ```sql
  select concat(first_name, ' ', last_name) from actors where gender = 'female'
  union
  select concat(first_name, ' ', last_name) from actors where gender = 'male'
  ```
  note: duplicates are automatically removed since it is a "union", which can be prevented using `union all`
- left outer join syntax (right join would have similar syntax, not discussed). e.g. in the below query, actors without social media handles would be displayed too, with the columns for `asset_type` and `url` holding null -
  ```sql
  select
    actors.first_name, actors.second_name, digital_assets.asset_type, digital_assets.url
  from
    actors left outer join digital_assets
  on
    actors.id = digital_assets.actor_id;
  ```
- natural join - syntactic sugar, no need to explicitly specify the columns to use for join, i won't use it

# Nested Queries

- nested queries are slower but sometimes the only way to write a query
- the following is an example of **nested scalar query**, since the nested query returns a single value. e.g. find all actors who had updated their digital assets most recently
  ```sql
  select
    first_name
  from
    actors inner join digital_assets on digital_assets.actor_id = actors.id
  where
    digital_assets.last_updated = (select max(digital_assets.last_updated) from digital_assets);
  ```
- e.g. find all actors who are on facebook
  ```sql
  select * from actors where id in (
    select actor_id from digital_assets where asset_type = 'facebook'
  )
  ```
- e.g. find actors who updated their social handles on their birthday
  ```sql
  select
    actors.first_name
  from
    actors inner join digital_assets
  on
    actors.id = digital_assets.actor_id and
    actors.dob = digital_assets.last_updated
  ```
- the following is an example of a nested query where it returns a collection of columns. the query returns the same results as the example as above
  ```sql
  select first_name from actors where (id, dob) in
    (select actor_id, last_updated from digital_assets);
  ```

# Correlated Queries  

- the subquery references columns from the main query
- note: we can use the `exists` operator to check if the subquery returns any rows
- e.g. find actors with their names in their twitter handles - 
  ```sql
  select
    actors.first_name
  from
    actors inner join digital_assets
  on
    actors.id = digital_assets.actor_id
  where
    digital_assets.url like concat('%', actors.first_name, '%') and
    digital_assets.asset_type = 'twitter'
  ```
- the query returns the same results as the example as above
  ```sql
  select first_name from actors where exists (
    select
      *
    from
      digital_assets
    where
      digital_assets.actor_id = actors.id and
      digital_assets.url like concat('%', actors.first_name, '%') and
      digital_assets.asset_type = 'twitter'
  )
  ```
- difference between nested queries and correlated queries - in nested queries, the subquery runs first and then the main query runs. in correlated queries, the subquery runs for every row of the main query, and the subquery runs after the main query

# Multi Table Operations

- multi table delete use case - delete related data from multiple tables
  ```sql
  delete
    actors, digital_assets -- tables to delete rows from
  from
    actors, digital_assets
  where
    actors.id = digital_assets.actor_id and
    digital_assets.asset_type = 'twitter'
  ```
  we mention the tables to delete rows from, note how this isn't required when deleting from one table
- we can similarly have multi table updates -
  ```sql
  update
    actors inner join digital_assets
  on
    actors.id = digital_assets.actor_id
  set
    actors.first_name = upper(actors.first_name)
  where
    digital_assets.asset_type = 'facebook'
  ```
- note: a subquery cannot have select for tables being updated or deleted in the outer query
- copy a table **without the data** and just the structure - `create table copy_of_actors like actors`
- insert data from one table into another - `insert into copy_of_actors(name) select first_name from actors`

# Side Note

- advantage of triggers, stored procedures etc. is doing stuff at database layer increases performance
- disadvantage is the code logic being scattered everywhere, comparatively difficult to debug, and maintain

# Views

- views can be created by combining multiple tables
- we can filter out rows and columns
- now, a complex query becomes a simple single table query
- we can create views from other views as well, and we can perform the same joins and filtering on views that we would otherwise perform on a table
- when we do `show tables`, we see the views as well, we can see the type of table i.e. whether it is a normal table (also referred to as base table) or a view by using the command `show full tables`
- e.g. of creating a view -
  ```sql
  create view
    actors_twitter_accounts as
  select
    first_name, second_name, url
  from
    actors inner join digital_assets  
  on
    actors.id = digitalassets.actor_id
  where
    asset_type = 'twitter'
  ```
- views are basically like stored queries, so they get updated whenever the tables get updated
- we can use `create or replace` to either create a view or replace it if one already exists. e.g. for single actors
  ```sql
  create or replace view single_actors
    as select * from actors where marital_status = 'single';
  ```
- we can update or delete rows from the underlying base tables using views. however, there are conditions e.g. it shouldn't have specific types of joins, group by statements or aggregation functions, etc.
  ```sql
  insert into
    single_actors (first_name, second_name, dob, gender, marital_status, net_worth_in_millions)
  values
    ('charlize', 'theron', '1975-08-07', 'female', 'single', 130);
  ```
- e.g. i try inserting a row into this view, which fails the filtering clause used to create the view
  ```sql
  insert into
    single_actors (first_name, second_name, dob, gender, marital_status, net_worth_in_millions)
  values
    ('tom', 'hanks', '1956-07-09', 'male', 'married', 350);
  ```
- now, since views can update their base tables, this went through and updated the table. however, since the view's query filters out married actors, we don't see the row in the view. we have essentially updated a row in a table through a view which will not be visible in the view. if this behavior is not desirable, we can use the check option while creating the view
  ```sql
  create or replace view single_actors
    as select * from actors where marital_status = 'single'
  with check option;
  ```
- now the insert statement for tom hanks will fail
- if we create views using other views, the check option can have scopes of **local** and **cascade**
- we can drop views using `drop view single_actors`

# Stored Procedures

- it is like a program, with loops, conditions etc
- it can reduce the traffic between our applications and databases, as instead of making repeated calls to the database, the procedure can be called
- procedures can have granular security so that we can give access to procedures and not the underlying tables
- when we call a procedure, the code gets compiled and stored in cache which gets used for future calls
- we can have multiple lines in a procedure, so we can have multiple `;`
- for the entire procedure to be parsed as a single statement, we change the delimiter to something else
- example of creating a procedure -
  ```sql
  delimiter **
  create procedure show_actors()
  begin
    select * from actors;
  end **
  delimiter;
  ```
- call a procedure - `call show_actors()`
- see details about procedure - `show procedure status where db = 'movie_industry'`
- _if we don't filter using the database name, there can be a lot of output_
- delete a procedure - `delete procedure if exists show_actors`
- using variables in procedures example -
  ```sql
  delimiter **
  create procedure summary()
  begin  
    declare count_m, count_f int default 0;
    select count(*) into count_m from actors where gender = 'male';
    select count(*) into count_f from actors where gender = 'female';
    select count_m, count_f;
  end **
  delimiter ;
  ```
- we can also hardcode variables in procedures, e.g. `set count_m = 12`
- we can have parameters in procedures. they can be in three modes - **in**, **out** and **inout**
- in parameters are passed as input to the procedure. they cannot be modified since a copy of these parameters are used by the procedures
- out parameters are initially null when the procedure starts. procedures can modify them and after the procedure completes, users can get the value of these parameters
- inout parameters can function as both in and out
- example of parameters - 
  ```sql
  delimiter **
  create procedure net_worth_greater_than(in base_net_worth int, out actor_count int)
  begin
    select count(*) into actor_count from actors
    where net_worth_in_millions >= base_net_worth
  end **
  delimiter ;
  ```
- usage of parameters - 
  ```sql
  call net_worth_greater_than(750, @actor_count);
  select @actor_count;
  ```
- variables starting with @ are also called session variables. they are defined by users and only exist until the end of current session. they are not visible in other sessions
- we can use if statements in procedures as well
- conditions can evaluate to true, false or null in sql. in both false and null we skip the block
- an example - note: the elseif and else blocks are optional
  ```sql
  delimiter **
  create procedure relationship_status(in in_id int, out out_status varchar(50))
  begin
    declare queried_status varchar(15);
    select marital_status into queried_status from actors where id = in_id;
    if queried_status like 'married' then set out_status = 'actor is married';
    elseif queried_status like 'single' then set out_status = 'actor is single';
    else set out_status = 'status is unknown';
    end if;
  end **
  delimiter ;
  ```
  we can make calls to the procedure using -
  ```sql
  call relationship_status(1, @val);
  select @val
  ```
- we can also have case statements (not discussed)
- iterative statements - we can have both while style loops and do-while style loops
- syntax for while - 
  ```
  label: while condition do
  statements
  end while label;
  ```
- syntax for do while - 
  ```
  label: repeat
  statements
  until condition
  end repeat label;
  ```
- example - 
  ```sql
  drop procedure if exists print_male_actors;

  delimiter **
  create procedure print_male_actors(out str varchar(1000))
  begin
    declare f_name varchar(20);
    declare total_rows int;
    declare current_row int default 1;
    declare gen varchar(10);
    set str = '';

    select count(*) into total_rows from actors;
    print_loop: while current_row <= total_rows do

      select gender, first_name into gen, f_name from actors where id = current_row;
      if gen like 'male' then
        if str = '' then set str = f_name;
        else set str = concat(str, ', ', f_name);
        end if;
      end if;
      set current_row = current_row + 1;

    end while print_loop;
  end **
  delimiter ;

  call print_male_actors(@val);
  select @val;
  ```
- the `leave` keyword can be used to exit a label. this label can be on the procedure itself, loops, etc.
- cursors in databases can be used to iterate over the table rows one by one
- cursors are **read only** i.e. cannot be used to update data
- cursors are **non-scrollable** i.e. we can only read in an ordered way and not skip rows
- cursors are **asensitive** i.e. they point to the actual data in the database. we can also have **insensitive** cursors, not supported by mysql, where a copy of the table is created. disadvantage of asensitive is that it would reflect the ad hoc updates in the database
- if the cursor cannot move to the next row, an error can be raised. so we use the `declare continue handler`
- e.g. - 
  ```sql
  drop procedure if exists print_male_actors;

  delimiter **
  create procedure print_male_actors(out str varchar(1000))
  begin
    declare f_name varchar(20);
    declare last_row_fetched int default 0; 

    declare it cursor for
      select first_name from actors where gender = 'male';
    declare continue handler for not found set last_row_fetched = 1;

    set str = '';
    open it;
    fetch it into f_name;
    print_loop: while last_row_fetched != 1 do
      if str = '' then set str = f_name;
      else set str = concat(str, ', ', f_name);
      end if;
      fetch it into f_name;
    end while print_loop;
    close it;
  end **
  delimiter ;

  call print_male_actors(@val);
  select @val;
  ```
- error handling is necessary to avoid abnormal termination of stored procedures
- error handler in mysql has three parts - **error condition**, **action** and **statements**
- error condition can be one of the three types -
  - mysql error code - error codes specific to mysql
  - sqlstate code - error codes in ansi sql
  - user defined named condition - to make the code more readable, we can define a name for the above two using syntax - `declare custom_condition_name condition for (mysql error code | sqlstate code)`
- statements are a set of executable lines of code like setting of variables etc. if we have multiple statements, we can enclose them within a `begin` and `end` block
- action can be to continue / exit the block or stored procedure, which is taken after executing the statements
- syntax - 
  ```
  declare (continue | exit) handler
  for (mysql error code | sqlstate code | user defined named condition)
  begin
    statement 1;
    statement 2;
    ...
  end;
  ```
- we also have stored functions. it is used to store common formulas / expressions and gets evaluated at runtime unlike stored procedures which are compiled. stored functions have not been discussed here

# Triggers

- triggers are statements that get invoked when we perform an operation like insert, update or delete
- note: if we perform an operation like truncate which is equivalent to delete, triggers won't be invoked
- triggers can be **row level** or **statement level**
- row level triggers are invoked once per row, e.g. if a statement updated 25 rows then it gets invoked 25 times, while statement level triggers are invoked once per statement
- triggers can be invoked at 6 phases - (before, after) * (insert, update, delete)
- e.g. of trigger - 
  ```sql
  delimiter **
  create trigger net_worth_check
  before insert on actors
  for each row
    if new.net_worth_in_millions < 0 or new.net_worth_in_millions is null then
    set new.net_worth_in_millions = 0;
    end if;
  **
  delimiter ;
  
  insert into actors (first_name,  net_worth_in_millions) values ('tom', 350);
  insert into actors (first_name, net_worth_in_millions) values ('young', null);
  insert into actors (first_name,  net_worth_in_millions) values ('old', -540);
  
  select * from actors; -- actors young and old will have net_worth_in_millions adjusted to 0
  ```
- show triggers - `show triggers;`
- drop triggers - `drop trigger if exists net_worth_check;`
- we can also include multiple statements by enclosing statements after `for each row` inside a begin-end block

# Transactions

- we use transactions since we want either all the statements or none of them to go through
- there can be storage engines which don't support transactions / apply locking using different methods
- irrespective of whether transactions are supported, databases should have some form of locking to disallow concurrent access from modifying the data. e.g. InnoDB supports row level locking so that multiple users can modify the data in the same table. this also makes it a little slower
- we can start and commit a transaction using - 
  ```sql
  start transaction;
  -- statements
  commit;
  ```
- we can roll back a transaction using 
  ```sql
  start transaction;
  -- statements
  rollback;
  ```
