---
title: Elasticsearch
---

## Introduction

- elasticsearch is open source
- we interact with elasticsearch using rest api and json, making it easy to work with
- elasticsearch is written in java and uses apache lucene underneath
- row in rdbms - **documents** in elasticsearch
- columns in rdbms - **fields** in elasticsearch
- table in rdbms - **index** in elasticsearch
- **index templates** - apply settings and mappings to indices that match a pattern

## Use Cases

- used for implementing search functionality, by addressing common problems like
  - filtering search results - e.g. filter products based on category, price range, brand, etc
  - sort results based on relevance - e.g. most reviewed, similarity with search parameters, etc
- we can aggregate the data stored in elasticsearch while querying. so, using elasticsearch data for analytics and not at all for searching is a perfectly valid use case
- apm or application performance management - e.g. analyze logs, monitor system metrics, etc
- machine learning -
  - forecast future values - e.g. predict sales
  - anomaly detection - e.g. alert when  number of visitors on our website suddenly drops

## Elastic Stack

- elasticsearch - the heart of the elastic stack which stores the data
- kibana -
  - serves as a web interface for configuration etc
  - visualize the data stored in elasticsearch by creating dashboards in kibana
  - note - kibana stores its data in elasticsearch. this means a new kibana instance pointing to our existing elasticsearch instance will automatically load all the configuration, dashboards, etc
- logstash - traditionally for processing logs and sending to elasticsearch. now, it has evolved into a more general purpose data processing tool, to perform etl
- x pack - add additional features like -
  - authentication and authorization to elasticsearch and kibana
  - monitoring - monitor performance of components of elasticsearch, logstash, kibana, etc and set up alerting based on issues related to these components
  - machine learning
  - graph - e.g. suggest relevant songs. popular != relevant. e.g. if 10 users use google, it is just because google is a very commonly used search engine, but if 10 users use stack overflow, it indicates something common between them. it helps us look for "uncommonly common" features
  - sql - we typically use elasticsearch's query dsl to query elasticsearch, but we can also use sql, which gets translated to the query dsl bts. this can help people used to sql to get started with using elasticsearch
- beats - light weight agents installed on servers which then ship data to elasticsearch / logstash. e.g. file beats for sending log files, metric beats for system level metrics like memory and cpu usage, etc

## Setup

- download elasticsearch from [here](https://www.elastic.co/downloads/elasticsearch)
- download kibana from [here](https://www.elastic.co/downloads/kibana)
- run `./bin/elasticsearch` to run elasticsearch. it will display the following - 
  - enrollment token - helps kibana communicate with elasticsearch securely
  - password - `pU-z6IdUirqzzUsFVlWh` for me
- run `./bin/kibana` to run kibana. we need to do the following - 
  - it would display the kibana url with a code as query parameter. open it
  - enter the enrollment token displayed in the elasticsearch console
  - authenticate using username as `elastic` and password as what is displayed in the elasticsearch console
- to interact with elasticsearch
  - in kibana using dev tools -
    - `get _cluster/health` to view cluster's health
    - `get _cat/nodes?v` to view all nodes
    - `get _cat/indices?v` to view all indices
  - using curl -
    ```txt
    curl --cacert elasticsearch-8.12.0/config/certs/http_ca.crt \
      -u elastic:pU-z6IdUirqzzUsFVlWh \
      https://localhost:9200/
    ```

## Architecture

- **node** - an instance of elasticsearch
- each node belongs to a **cluster**
- we can have different clusters based on use cases, e.g. one cluster for search, a different cluster for apm, etc

## Sharding

- elasticsearch uses **sharding** to help it scale
- sharding - splitting an index into smaller chunks
- this way, we are not limited by the storage capacity of 1 node
- sharding is done at index level for flexibility, because some indices can be very large, while others very small
- because of sharding, we can scale the cluster horizontally instead of having to do it vertically
- underneath, each shard is independent, like a fully functionally index. actually, each shard is a lucene index underneath
- sharding also helps parallelize the elasticsearch queries we issue, since the query can be broken down and run on each shard in parallel
- so two advantages - scale storage and improve throughput
- for elasticsearch < 7.0.0 -
  - default number of shards was 5 - thus leading to **over sharding** when there were many small indices in the cluster
  - changing number of shards after creating an index was not possible - to increase the number of shards, people would create a new index with the correct number of shards and move over the documents manually
- for newer versions of elasticsearch -
  - default number of shards is 1
  - we can increase / decrease the number of shards using the **split** / **shrink** api, and elasticsearch does the heavy lifting for us bts

## Replication

- the underlying nodes / hardware / storage in a cluster can easily fail
- introducing **replication** for fault tolerance in elasticsearch is very easy
- replication is also configured at index level
- copies of shards are created, called **replica shards**
- the shard that has been replicated is called the **primary shard**
- all of the shards together are called a **replication group**
- primary and replica shards are never stored on the same node, because that defeats the purpose
- so, if our cluster has only one node, no replica shards are added even if we set replication
- replicas can also serve as read replicas
- this means if we have three shards (one primary and two replicas), there can be three search requests that can be served in parallel
- so two advantages (just like sharding) - serve as standby and improve throughput
- default replication is 1
- use `get _cat/shards?v` to view all shards. it gives us which index it belongs to, its type (primary or replica), which node it is stored on, etc

## Snapshots

- helps take backups
- we can take snapshots of specific indices or of the entire cluster
- it helps us restore the state to a specific point in time

## Node Roles

- **master** -
  - the master node in a cluster performs cluster wide actions like creating and deleting indices
  - if there are several nodes with this role, one of them are elected as the master
  - larger clusters should have "dedicated masters" so that they do not perform high io tasks like serving search requests
- **data** -
  - enables it to store shards
  - thus, it can perform query / modification of data on the shards that it is responsible for
- **ml** -
  - lets a node run machine learning jobs
  - `xpack.ml.enabled` needs to be enabled as well on the node
- **coordination** -
  - node can be responsible for distributing the queries and then aggregating the data results
  - can be accomplished by disabling all other roles on the node, there is no direct role available in elasticsearch for this
- **voting only** -
  - can participate in the election of a new master, but not be elected as the master itself

## Simple CRUD

- deleting an index - `delete pages`
- by default when we call `put index_name`, we get two shards by default - one primary and one replica shard
- this is why my cluster running locally goes into yellow health after creating an index - since i was running one elasticsearch node and one of the replicas shards are still unassigned
- specify settings when creating an index - 
  ```txt
  put products
  {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 0
    }
  }
  ```
- we can index a document like below. it would return us the auto generated id for it
  ```txt
  post products/_doc
  {
    "name": "Coffee Maker",
    "price": 64,
    "in_stock": 10
  }
  ```
- for a custom id, the endpoint above could have been like so - 
  ```txt
  post products/_doc/100
  ```
- retrieving a product if we have the id - 
  ```txt
  get products/_doc/100
  ```
- now, if we for e.g. run the below "for the same id" again, the older document is "replaced" with this new document
  ```txt
  post products/_doc/100
  {
    "name": "Red Shoes"
  }
  ```
- note - we looked at two variations - `post <<index>>/_doc` for automatic ids, and `post <<index>>/_doc/<<id>>` for custom ids and create or update (basically replace). there are many more variations, not bothering right now
- elasticsearch documents are immutable - when we call post using the same id again, elasticsearch will basically create a new document and re index this document, effectively replacing the older document
- **scripted updates** - update using code, instead of us first retrieving the value, deciding the new value and then updating it. this approach for e.g. reduces network calls made to elasticsearch. we can do things like set the operation to delete if the in stock value becomes 0 etc. skipping this for now, as i would likely use an orm

## Routing

- **routing** - helps resolve the shard for a document
- basically - shard = hash(_routing) % number_of_primary_shards
- by default, _routing = id
- so, when we try performing crud operations using the id, this is how the shard resolution happens inside elasticsearch
- underneath, issues like skewed shards etc are prevented by elasticsearch automatically
- this is why changing the number of shards for an index on the fly is difficult - the shard of the existing documents might change as the number of shards change. for us as developers however, using the shrink and split api is much easier now in newer versions of elasticsearch

## Working of Reads

- the request reaches the coordinating node
- by the formula discussed in routing, it determines which primary shard is responsible for this document
- then, it directs the read request to the best replica shard in the replication of group of the primary shard
- the replica is chosen using a strategy called **ars** or **adaptive replica selection**, which is deemed best for performance
- finally, the response reaches the client back from the coordinating node

## Working of Writes

- the request reaches the coordinating node
- by the formula discussed in routing, it determines which primary shard is responsible for this document
- now, the request is sent to the primary shard, unlike in reading document where the request was sent to any replica using ars
- the primary shard validates the document - e.g. throw an error if a string value is being specified for a numeric value
- then it indexes the document
- now, it sends requests to its replica shards in parallel
- finally, the write is complete and the response is sent back to the client via the coordinating node

## Conflicts During Writes

- what if primary shard goes down after receiving a write? a replica shard would be promoted but what if the write was already committed to some other replica shards and not the newly appointed primary shard?
- what if a replica shard goes down during a write?
- many such failure scenarios can happen in distributed systems like this
- all these problems are handled by using primary term, sequence number and checkpoint in elasticsearch
- **primary term** - how many times the primary shard has changed
- **sequence number** - a counter that is incremented for each write operation. i think it is index specific
- **global checkpoint** - the minimum sequence number all the shards in the replication group have been aligned up to
- **local checkpoint** - the sequence number the current shard is at
- my understanding - the values of primary term and sequence number are also assigned to the documents to help with optimistic concurrency control
- **optimistic concurrency control** - what if an older version of document overwrites a newer version i.e. when writes happen concurrently? this situation is common, given the distributed nature of elasticsearch. e.g. two visitors on our e-commerce app try decreasing the in stock attribute by one simultaneously
- in newer versions, we are supposed to send the primary term and sequence numbers discussed earlier in order to implement optimistic concurrency control -
  ```txt
  post products/_update/100?if_primary_term=1&if_seq_no=9
  // ...
  ```
- note, my understanding - apart from primary term and sequence numbers, when we retrieve documents, they also return a version. it is just like we would expect a version column to work, i.e. increments by one. it was used for implementing optimistic concurrency control in older versions, but the newer and preferred method is to use the primary term and sequence numbers instead that is descried above

## Bulk Operations

- these are much more efficient than sending out individual requests
- we can use the `_update_by_query` and `_delete_by_query` variants, where we specify the match clause
- the operations i think work like `update ... where ...` and `delete ... where ...`
- we can also use the bulk api to perform multiple kinds of operations on an index all at once
- this format that we use is also called nd json
- example of using bulk api inside kibana - 
  ```txt
  post products/_bulk
  { "index": { "_id": 200 } }
  { "name": "Espresso Machine", "price": 150, "in_stock": 4 }
  { "create": { "_id": 201 } }
  { "name": "Espresso Machine", "price": 150, "in_stock": 4 }
  { "update": { "_id": 202 } }
  { "doc": { "name": "Espresso Machine", "price": 150, "in_stock": 4 } }
  { "delete": { "_id": 100 } }
  ```
- one line specifies the action (index, create, update, delete), the second line specifies the document contents (except in delete)
- my understanding - index vs create vs update - index works for both create and update, update fails when no document exists and create fails when document already exists
- we can also specify the primary term and sequence numbers inside the action line for optimistic concurrency control
- using curl to upload data using bulk api, where a file has all the data in the form of nd json - 
  ```txt
  curl -H "Content-Type: application/x-ndjson" \
    -XPOST \
    --cacert ~/elasticsearch-8.12.0/config/certs/http_ca.crt \
    -u elastic:pU-z6IdUirqzzUsFVlWh \
    https://localhost:9200/products/_bulk \
    --data-binary "@products-bulk.json"
  ```

## Working of Bulk Operations

- first, the query reaches the coordinating node as usual
- a snapshot of the entire index is taken
- then, the query to search for the documents and the bulk request to update them is sent to all the nodes
- if a failure occurs during this update, the failures are sent back to the client and "not rolled back"
- understand how this might be different from e.g. rdbms systems where there are features like transactions which help rollback
- idea is instead of rolling back, elasticsearch sends the failures to the client so that the client can handle it accordingly
- why was the snapshot taken - this helps elasticsearch implement optimistic concurrency control internally - it is not unlikely that since bulk request is huge, and during the processing of this bulk request, some document gets updated in the intermediary. so, elasticsearch uses this snapshot to compare the primary term and sequence number of the document it updates

## Analysis

- values are **analyzed** when indexing documents, to help with searching them
- different data types in elasticsearch will use different data structures e.g. numeric and geo spatial data might be stored inside bkd trees. however, most of them are fairly straightforward like in for e.g. rdbms, unlike text data types, what elasticsearch is known for. so, that is the focus here
- **analyzer** consists of three building blocks - character filters, a tokenizer and token filters
- **character filters** - 
  - add / remove / transform characters
  - an analyzer can have multiple character filters, and they would be run one after another
  - e.g. the html_strip character filter will filter out the html entities
    - input - `I&apos;m REALLY <b>liking</b> <i>beer</i>`
    - output - I'm REALLY liking beer
- **tokenizer** - 
  - split into tokens
  - an analyzer contains exactly one tokenizer
  - some characters e.g. punctuations can be removed as a part of this
  - important - the offset for each token is recorded as well. useful e.g. for [match phrase queries](#full-text-queries)
  - e.g. the standard analyzer splits based on special characters
    - input - "I'm REALLY liking beer"
    - output - ["I'm", "REALLY", "liking", "beer"]
- **token filters** - 
  - add / remove / modify tokens
  - an analyzer can have multiple token filters, and they would be run one after another
  - e.g. lowercase filter to make all tokens lowercase
    - input - ["I'm", "REALLY", "liking", "beer"]
    - output - ["i'm", "really", "liking", "beer"]
- **standard analyzer** - the default. it uses no character filters, the standard tokenizer and finally the lowercase token filter
- there is an easy to use api, where we specify the analyzer / its components, and elasticsearch returns us the analyzed result
  ```txt
  post _analyze
  {
    "text": "2 guys walk into   a bar, but the third... DUCKS! :-)"
  }

  post _analyze
  {
    "text": "2 guys walk into   a bar, but the third... DUCKS! :-)",
    "analyzer": "standard"
  }

  post _analyze
  {
    "text": "2 guys walk into   a bar, but the third... DUCKS! :-)",
    "char_filter": [],
    "tokenizer": "standard",
    "filter": ["lowercase"]
  }
  ```
- output is as follows - 
  ```txt
  {
    "tokens": [
      { "token": "2", "start_offset": 0, "end_offset": 1, "type": "<NUM>", "position": 0 },
      { "token": "guys", "start_offset": 2, "end_offset": 6, "type": "<ALPHANUM>", "position": 1 },
      { "token": "walk", "start_offset": 7, "end_offset": 11, "type": "<ALPHANUM>", "position": 2 },
      { "token": "into", "start_offset": 12, "end_offset": 16, "type": "<ALPHANUM>", "position": 3 },
      { "token": "a", "start_offset": 19, "end_offset": 20, "type": "<ALPHANUM>", "position": 4 },
      { "token": "bar", "start_offset": 21, "end_offset": 24, "type": "<ALPHANUM>", "position": 5 },
      { "token": "but", "start_offset": 26, "end_offset": 29, "type": "<ALPHANUM>", "position": 6 },
      { "token": "the", "start_offset": 30, "end_offset": 33, "type": "<ALPHANUM>", "position": 7 },
      { "token": "third", "start_offset": 34, "end_offset": 39, "type": "<ALPHANUM>", "position": 8 },
      { "token": "ducks", "start_offset": 43, "end_offset": 48, "type": "<ALPHANUM>", "position": 9 }
    ]
  }
  ```
- we saw above how elasticsearch constructs tokens using a three step process
- **inverted index** - a mapping between the tokens and what documents contain these tokens
- e.g. finding which documents contain a specific term is as simple as looking up the term in the inverted index
- inverted indices are scoped to a "field of an index"
- **keyword** data type - used for exact matching. e.g. status field
- for full text searches, use the **text** data type instead
- internally, keyword uses the **keyword analyzer**, which is no op i.e. does not do anything
- in the inverted index that is created for keyword data type, the key is the entire string, the values are the documents having it
- in the inverted index that is created for text data type, the keys are the tokens, the values are the documents having it, along with offsets etc to help with for e.g. `match_phrase` query
- elasticsearch comes in with a lot of built in character filters, tokenizer and token filters, and we can mix and match them
- elasticsearch also comes in with a lot of [built in analyzers](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html) which we can use. they are configurable as well, e.g. we can add the stop word to the standard analyzer
- two common token filters - 
  - **stemming** - reducing words to their root form. e.g. if the word in the description is "loved", and the client searches for "loves", they should still be able to search for the word. stemming helps reduce the word to its "root form"
  - **stop words** - common words in a language that are filtered out when a field is analyzed. e.g. articles
- note - what we search for is analyzed in the same way as the attribute! e.g. if the word drinking in the document is stemmed to drink, the word drinks in the query is also stemmed to drink
- below is an example of creating a custom analyzer inside an index. notice the four sections inside analysis - character filter, tokenizer, filter (token filter is called filter) and finally analyzer - 
  ```txt
  put analyzer_test
  {
    "settings": {
      "analysis": {
        "char_filter": { },
        "tokenizer": { },
        "filter": {
          "danish_stop": {
            "type": "stop",
            "stopwords": "_danish_"
          }
        },
        "analyzer": {
          "my_custom_analyzer": {
            "type": "custom",
            "char_filter": ["html_strip"],
            "tokenizer": "standard",
            "filter": [
              "lowercase",
              "danish_stop",
              "asciifolding"
            ]
          }
        }
      }
    }
  }
  ```

## Mapping

- **mapping** defines the structure of documents
- like a schema in rdbms
- two approaches - 
  - **explicit mapping** - we specify the fields and their data types ourselves
  - **dynamic mapping** - the field mapping is automatically created for us when elasticsearch encounters a new field
- [data types](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html) available in elasticsearch
- creating an explicit mapping - 
  ```txt
  put reviews
  {
    "mappings": {
      "properties": {
        "rating": { "type": "float" },
        "content": { "type": "text" },
        "product_id": { "type": "integer" },
        "author": {
          "properties": {
            "first_name": { "type": "text" },
            "last_name": { "type": "text" },
            "email": { "type": "keyword" }
          }
        }
      }
    },
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 0
    }
  }
  ```
- retrieving the mapping for an index - 
  ```txt
  get reviews/_mapping
  ```
- when relying on dynamic mapping e.g. for strings, first, using [type coercion](#type-coercion), it would try converting it to a number / date. if that fails, the default behavior is to use [multi field mappings](#multi-field-mappings), so that text is used for attribute, and keyword is used for attribute.keyword. e.g. -
  ```txt
  put recipes/_doc/1
  {
    "ingredients": ["potato", "tomato"]
  }

  get recipes/_mapping
  ```
- output - 
  ```txt
  {
    "recipes": {
      "mappings": {
        "properties": {
          "ingredients": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          }
        }
      }
    }
  }
  ```
- this default behavior might not be ideal for us since it consumes a lot of disk space, e.g. for ingredients, we would rarely perform text searches while for description of recipes, we would rarely perform aggregations, sorting, etc
- we can ask elasticsearch to disable dynamic mapping using -
  - `"dynamic": "strict"` - would not allow unknown fields when indexing a document
  - `"dynamic": "false"` - would allow additional fields but not analyze them. they would just be stored and be a part of the _source in the response

  ```txt
  put people
  {
    "mappings": {
      "dynamic": "strict",
      "properties": {
        "first_name": { "type": "text" }
      }
    }
  }
  ```

### Changing the Mapping

- changing the mapping might not be easy. e.g. assume we want to go from numeric to keyword data type. this is not easy for elasticsearch, since it would have to re index all the existing documents, since the underlying structure itself changes from a bkd tree to an inverted index (keyword data type uses keyword analyzer)
- so, we can use the re index api, which copies over our documents from the source to the destination index. while doing this, we specify the script, which can do some conversions for us. the syntax / working is similar to scripted updates which we mentioned earlier
  ```txt
  post _reindex
  {
    "source": { "index": "reviews" },
    "dest": { "index": "reviews_new" },
    "script": {
      "source": """
        if (ctx._source.product_id != null) {
          ctx._source.product_id = ctx._source.product_id.toString();
        }
      """
    }
  }
  ```

## Object vs Nested Data Types

- when we use **object** data type, internally, elasticsearch flattens it using **dot notation**
- e.g. assume we had a document like below i.e. we set the field type of reviews to be an object
  ```txt
  {
    "product": {
      "manufacturer": {
        "name": "xyz"
      },
      "reviews": [
        { "author": "abc", "rating": "4.7" },
        { "author": "def", "rating": "3" }
      ]
    }
  }
  ```
- how elasticsearch kind of views them internally - 
  ```txt
  {
    "product.manufacturer.name": "xyz",
    "product.reviews.author": ["abc", "def"],
    "product.reviews.rating": ["4.7", "3"]
  }
  ```
- based on above, there is a downside of using the type object - if we search for a review left by abc and with rating 3, the current document we showed above would be returned - even though abc left 4.7. this is because after the flattening done by elasticsearch internally, the correlation between the fields of an object was lost
- therefore, due to the shortcomings above, we can use the **nested** data type. this means that all the fields of that structure would be correlated
- nested data type works in a fundamentally different way compared to object data type - internally, a new document is created for each of the review - so, if we were to index a document with 10 reviews, internally 11 documents would be indexed by elasticsearch. there is no flattening inside the same document like in object data type
- assume we had an array of objects. we can create mapping for nested type as follows - 
  ```txt
  // ...
  "reviews": {
    "type": "nested",
    "properties": {
      "author": { "type": "text" },
      "rating": { "type": "float" }
    }
  }
  ```
- for object data type, we just need to omit the `"type": "nested"` line
- having two many nested objects in the array can slow down queries etc, but this might be an indicator of a bad design in the first place as well. there are limits on the maximum number of fields allowed inside a nested document, maximum number of nested objects allowed in the array, etc as a safeguard

## Arrays in Elasticsearch

- there is no concept of arrays in elasticsearch - any field can contain 0 or more values in elasticsearch by default
  ```txt
  post products/_doc/100
  {
    "tags": ["electronics"]
  }

  post products/_doc/100
  {
    "tags": "smart phone"
  }

  get products/_doc/100
  ```
- in case of text fields, values of array type are simply "concatenated" one after another
  ```txt
  post _analyze
  {
    "text": ["hello", "world"]
  }
  ```
- output - make note of the offset
  ```txt
  {
    "tokens": [
      { "token": "hello", "start_offset": 0, "end_offset": 5, "type": "<ALPHANUM>", "position": 0 },
      { "token": "world", "start_offset": 6, "end_offset": 11, "type": "<ALPHANUM>", "position": 1 }
    ]
  }
  ```
- empty array / skipping the field mean the same thing
- i don't think this is the same as explicitly providing null however

## Date Data Type

- internally, elasticsearch stores dates as milliseconds since epoch, by converting it into the utc timezone
- if we do not specify the format, we can specify it in iso-8601 format (the one that looks like `2024-01-21T04:25:21.139Z`) or a number, that is the milliseconds since epoch
- however, when creating the explicit mapping, we can also specify the format using the java date format
  ```txt
  "purchased_at": {
    "type": "date",
    "format": "dd/M/yy"
  }
  ```

## Type Coercion

- **type coercion** - if we provide `"price": "7.4"` instead of `"price": 7.4`, elasticsearch is smart enough to convert it to the float type instead of treating it as keyword, string, etc
- in the example below
  - we first create a document (the index is created automatically), and ensure that the dynamic mapping has type number for price. if we started with string itself, then of course the dynamic mapping would create it using text + keyword type
  - then, second and third calls go through due to type coercion and how [arrays](#arrays-in-elasticsearch) in elasticsearch work, while the fourth call fails because it cannot be coerced

  ```txt
  post coercion_test/_doc/100
  {
    "price": 7.4
  }

  // the mapping shows price is of type float
  get coercion_test/_mapping

  // does not throw an error
  // even though we provide a string
  post coercion_test/_doc/101
  {
    "price": "7.4"
  }

  // does not throw an error
  // even though we provide an array containing strings and numbers
  post coercion_test/_doc/101
  {
    "price": ["7.4", 8.9]
  }

  // will throw an error
  post coercion_test/_doc/102
  {
    "price": "7.4m"
  }
  ```
- when retrieving the document, we see "7.4" and not 7.4! maybe while elasticsearch does analyze the fields, it will ultimately just return us what we provided it with in the first place
- notice how this is a recurring theme, we saw it in [mapping](#mapping) when using `"dynamic": false` as well - _source is the exact same as the input by user, but bts, other processes like coercion, analyzing based on data type, etc are carried out
- to avoid all the hassle with type coercion, we can just disable it as well when creating the index
  ```txt
  put sales
  {
    "settings": {
      "index.mapping.coerce": false
    }
    // ...
  }
  ```

## Multi Field Mappings

- e.g. assume we want a field to have both type keyword and text
- problem statement
  - aggregations etc can not be run on text data type, but can be run on keyword data type
  - searching etc can not be run on keyword data type, but can be run on text data type
- e.g. we have a recipes index, and we would like to use ingredients for searching (use case for text data type) and for aggregations like popular ingredients (use case for keyword data type)
- so, elasticsearch allows us to specify multiple data types for a field
- e.g. below, text related data structures would be created for ingredients, while keyword related data structures would be created for ingredients.agg. so, when querying elasticsearch, we would use the same convention as well i.e. use ingredients when we want to use the text based queries but use ingredients.agg for keyword based queries
  ```txt
  put recipes
  {
    "mappings": {
      "properties": {
        "ingredients": {
          "type": "text",
          "fields": {
            "agg": {
              "type": "keyword"
            }
          }
        }
      }
    }
  }
  ```
- recall how when relying on dynamic mapping, this is the default i.e. using attribute for text data type and attribute.keyword for keyword data type
- other use cases might be for e.g. to optimize a field using different analyzers for different use cases

## Elastic Common Schema

- **ecs** or **elastic common schema**
- how common fields should be mapped
- e.g. doesn't matter the source of event - redis, kafka, nginx, etc, the "event timestamp" should be mapped via `@timestamp` field
- it is more useful for standard events like from web servers, databases, etc, not for custom use cases like using a product index

## Term Level Queries

- **term level queries** - term level queries are not analyzed, it is not like a part of it should match, the entire thing should match
- it does not make sense to use term level queries with text data type. it is typically used for all other data types like keyword, numbers, etc. this is because term level queries are not analyzed, while text data type is analyzed. it just does not make sense to do so, even if we get some hits
- e.g. of term level query. recall how [dynamic mapping](#mapping) created [multi field mapping](#multi-field-mappings) for both text and keyword. so, since we want to use the keyword variant, we use the below (term level queries are not meant for text data types) - 
  ```txt
  get products/_search
  {
    "query": {
      "term": {
        "tags.keyword": "Vegetable"
      }
    }
  }
  ```
- specifying multiple terms to match based on -
  ```txt
  get products/_search
  {
    "query": {
      "terms": {
        "tags.keyword": ["Vegetable", "Meat"]
      }
    }
  }
  ```
- we retrieved document by id using
  ```txt
  get products/_doc/100
  ```
- retrieve documents by multiple ids
  ```txt
  get products/_search
  {
    "query": {
      "ids": {
        "values": ["100", "200"]
      }
    }
  }
  ```
- **range searches** - useful for fields of type dates, numbers, etc 
  ```txt
  get products/_search
  {
    "query": {
      "range": {
        "in_stock": {
          "gte": 1,
          "lte": 6
        }
      }
    }
  }
  ```

### Flexibility in Term Level Queries

- while term level queries are not analyzed, they do allow for some flexibility described in this section
- still, do not forget the rule of thumb - term level queries are not analyzed, and therefore are not meant to be used for text data types
- **case insensitive** - will match documents having a tag vegetable / Vegetable. notice how the structure changes a little bit, `tags.keyword` is not a string now like earlier, but an object, with the value specified under `value`
  ```txt
  get products/_search
  {
    "query": {
      "term": {
        "tags.keyword": {
          "value": "vegetable",
          "case_insensitive": true
        }
      }
    }
  }
  ```
- **prefix** - begins with. will match documents having name both "Pasta" and "Pastry", but not "Red Pasta"
  ```txt
  get products/_search
  {
    "query": {
      "prefix": {
        "name.keyword": {
          "value": "Past"
        }
      }
    }
  }
  ```
- **wildcard** - can use `?` / `*`. `past?` will match "paste", `past*` will match "pasta" and "pastry"  however, do not do `*past`. while it will work, it might be very slow if index is huge
  ```txt
  get products/_search
  {
    "query": {
      "wildcard": {
        "name.keyword": {
          "value": "Past*"
        }
      }
    }
  }
  ```
- **regexp** - allows for regular expressions, useful when use case is more complex than what wildcard can do. remember, i get slightly confused in other places as well - `past*` is wildcard, `past.*` is regular expression. just like in wildcards, only try using it for prefix matching
  ```txt
  get products/_search
  {
    "query": {
      "regexp": {
        "tags.keyword": {
          "value": "Bee(f|r)"
        }
      }
    }
  }
  ```
- below the value, for all types like regexp, wildcard, prefix, etc, we can additionally also specify `case_insensitive`

### Exists Term Level Query

- search for all documents where a tag exists
  ```txt
  get products/_search
  {
    "query": {
      "exists": {
        "field": "tags.keyword"
      }
    }
  }
  ```
- what basically happens in exists query - it looks for all documents that are present in the inverted index
- there can be many reasons why a document would not be present in an inverted index, some common ones are - 
  - we specify null
  - we specify an [empty array](#arrays-in-elasticsearch) - recall this is the same as omitting the field
  - if for e.g. we use the `ignore_above` parameter, and the value was too long and was thus not indexed - recall this is usually keyword not text, so the entire string would be used for the inverted index and not the tokens, in which case it might have stayed below the character limit

## Full Text Queries

- term level queries are used for exact searches on structured data
- **full text queries** are used for searching through unstructured data
- the query is analyzed - if the field is analyzed, the same analyzer is used, else the standard analyzer is used
- analyzing both the query and the actual query using the same analyzer is key - otherwise, finding the document in the inverted index would not be possible
- like term level queries should be used for any data type but text
- full text queries should be used for only text data types
- querying all documents -
  ```txt
  get products/_search
  {
    "query": {
      "match_all": {}
    }
  }
  ```
- e.g. search for a particular field - note how `case_insensitive` is not needed like in term level queries, since the standard analyzer already contains the lowercase filter
  ```txt
  get products/_search
  {
    "query": {
      "match": {
        "name": "PAsTa"
      }
    }
  }
  ```
- if we specify multiple words, e.g. below, we get all products having either pasta **or** chicken in their name
  ```txt
  get products/_search
  {
    "query": {
      "match": {
        "name": "pasta chicken"
      }
    }
  }
  ```
- this is because the default operator is or. we can however change it to and as below. notice how the structure changes a little bit, `name` is not a string now like earlier, but an object, with the value specified under `query`
  ```txt
  get products/_search
  {
    "query": {
      "match": {
        "name": {
          "query": "pasta chicken",
          "operator": "and"
        }
      }
    }
  }
  ```
- **multi match** - match using multiple fields i.e. either name or tags should have vegetable
  ```txt
  get products/_search
  {
    "query": {
      "multi_match": {
        "query": "vegetable", 
        "fields": ["name", "tags"]
      }
    }
  }
  ```

### Controlling Scores in Full Text Queries

- **relevance scoring** - typically in term level queries, the score is just 1, so this concept is not present there. this is not true in full text queries though. e.g. in the or variant of pasta chicken example discussed above, the recipes having both pasta and chicken come before recipes having either of them. this is because recipes containing both are deemed more relevant by elasticsearch
- **relevance boost** - e.g. boost the score of recipes having vegetable in its name. notice how everything is almost the same except the caret symbol
  ```txt
  get products/_search
  {
    "query": {
      "multi_match": {
        "query": "vegetable", 
        "fields": ["name^2", "tags"]
      }
    }
  }
  ```
- by default, the score and therefore the sorting happens using the "best matching field". e.g. assume a recipe has vegetable both in its name and its tag. if the name above leads to a score of 12.3 and tags lead to a score of 3, "the final score is not 15.3, but 12.3". we can change this behavior by specifying for e.g. **tie breaker**. so, its like the default value of tie breaker is 0. if we specify for e.g. 0.3, the final score = field_with_highest_score + (0.3 * (sum_of_scores_of_other_fields)). so, all other fields will contribute 0.3 of its score, while the field with the highest score will contribute its entire value
  ```txt
  get products/_search
  {
    "query": {
      "multi_match": {
        "query": "vegetable", 
        "fields": ["name^2", "tags"],
        "tie_breaker": 0.3
      }
    }
  }
  ```

### Full Text Queries - Match Phrase

- **match phrase** - a phrase is a sequence of one or more words. till now, the examples we saw did not consider the order of the words, e.g. if we search for "chicken pasta", "pasta xyz chicken" and "chicken pasta" should have the same score. using match phrase, words should appear in the "correct order" and "one after another". e.g. if we search for "complete guide", "a complete and useful guide" would not match. this why [offsets](#analysis) was stored as a part of analysis in the first place. again since it is a full text query, the field would be analyzed using the same analyzer used for field, and all recipes having juice and mango in its name one after another would match
  ```txt
  get products/_search
  {
    "query": {
      "match_phrase": {
        "name": "juice (mango)"
      }
    }
  }
  ```
- but, what if we want to allow for e.g. "spicy tomato sauce" to match "spicy sauce"?
- so, we can add the **slop** parameter to the query as follows - 
  ```txt
  get proximity/_search
  {
    "query": {
      "match_phrase": {
        "title": {
          "query": "spicy sauce",
          "slop": 1
        }
      }
    }
  }
  ```
- when we say slop = 1, it basically means that the term can moved around once. we can move sauce
- lets say slop is 2. this means we are allowed two moves. in this case, "spicy sauce" will also match "sauce spicy"

  | **original** | spicy | sauce        |       |
  | **slop 1**   |       | spicy, sauce |       |
  | **slop 2**   |       | sauce        | spicy |

- **edit distance** is another synonym for this concept
- e.g. of building a naive search - use a [bool query](#compound-queries---bool)
  - `must` can use `match` with spicy sauce - recall how by default, or operator would be used
  - `should` can use `match_phrase` with spicy sauce, and have some slop as well, to help boost documents with spicy sauce close by

## Compound Queries - Bool

- we can combine **leaf queries** to form complex **compound queries**
- we can have multiple nested compound queries
- **must** - must be present
- **must not** - must not be present
- **should** - their presence is not mandatory, but they help boost the relevance scores
- e.g. look for alcohol, not wine, and we are particularly interested in beer. note - while we do not provide multiple queries, each of must, must not and should is an array, thus allowing for multiple term level / full text queries
  ```txt
  get products/_search
  {
    "query": {
      "bool": {
        "must": [
          {
            "term": {
              "tags.keyword": "Alcohol"
            }
          }
        ],
        "must_not": [
          {
            "term": {
              "tags.keyword": "Wine"
            }
          }
        ],
        "should": [
          {
            "multi_match": {
              "query": "beer",
              "fields": ["name", "description"]
            }
          }
        ]
      }
    }
  }
  ```
- a special note - if we do not have must / must not clauses and only the should clause, one of all the queries inside should "should" match (no pun intended). maybe because if this was not the case, technically all documents of the index would be a part of the result set, and would just have different relevance scores. so for e.g. if we wanted to model scenarios like "or", we can just specify them inside the should query. at least one of the conditions inside or (i.e. inside should) would match, and documents specifying more number of conditions in the or clause would be ranked higher
- recall how we said should only affects the scoring if either must or must not is present. we can change this behavior by providing **minimum should match** clause
- **filter** - will just filter documents. unlike must, it would not contribute to the relevance score. e.g. if we are just looking for all products of type alcohol, we do not need it to contribute to the relevance score
- **filter execution context** - filter execution context does not contribute to the relevance score. thus, it is more optimal. additionally, queries inside the filter execution context can be cached for higher performance. e.g. must not and filter
- **query execution context** - contributes to the relevance score. thus, slower and cannot be cached. e.g. must and should

## Compound Queries - Boosting

- **boosting** - e.g. we want the functionality of should, but it should reduce the relevance score
- what we specify inside **positive** has to match (like must of bool)
- the scores of documents that match what we specify inside **negative** is reduced (opposite of should in bool)
- "the factor" by which we want the score to be reduced can be specified via **negative boost**
- e.g. "i want" juice, but i "do not like" not apple - 
  ```txt
  get products/_search
  {
    "query": {
      "boosting": {
        "positive": {
          "match": {
            "name": "juice"
          }
        },
        "negative": {
          "match": {
            "name": "apple"
          }
        },
        "negative_boost": 0.2
      }
    }
  }
  ```
- e.g. i like pasta, but not bacon. so, both are optional, unlike above where juice was mandatory. so, we need to combine both boosting (for its negative) and bool (for its should). additionally, notice how we use match_all inside must of bool (if only should is present, it would become mandatory)
  ```txt
  get products/_search
  {
    "query": {
      "boosting": {
        "positive": {
          "bool": {
            "must": [
              {
                "match_all": {}
              }
            ],
            "should": [
              {
                "term": {
                  "tags.keyword": "Pasta"
                }
              }
            ]
          }
        },
        "negative": {
          "term": {
            "tags.keyword": "Bacon"
          }
        },
        "negative_boost": 0.2
      }
    }
  }
  ```

## Compound Queries - Disjunction Max

- **disjunction max** - we can specify multiple queries
- the query with highest relevance score is the one that is used ultimately
- we can however, use a **tie breaker** for the other matches
- recall how the working of this is exactly like [multi match](#full-text-queries). there, we specify multiple fields, here we specify multiple queries
- in fact a multi match query is converted into a dis max query. multi match query - 
  ```txt
  get products/_search
  {
    "query": {
      "multi_match": {
        "query": "vegetable",
        "fields": ["name", "description"],
        "tie_breaker": 0.7
      }
    }
  }
  ```
- equivalent dis max query -
  ```txt
  get products/_search
  {
    "query": {
      "dis_max": {
        "queries": [
          { "match": { "name": "vegetable" } },
          { "match": { "description": "vegetable" } }
        ],
        "tie_breaker": 0.7
      }
    }
  }
  ```

## Nested Queries

- if we have nested objects, dot notation works just fine
- recall how we should use nested type and not object type if we want correlation between the different fields for an array of objects
- how to search through an array of nested type - 
  ```txt
  get recipes/_search
  {
    "query": {
      "nested": {
        "path": "ingredients",
        "query": {
          "bool": {
            "must": [
              {
                "match": {
                  "ingredients.name": "parmesan"
                }
              },
              {
                "range": {
                  "ingredients.amount": {
                    "gte": 100
                  }
                }
              }
            ]
          }
        }
      }
    }
  }
  ```
- how the score of the matching child documents effect the score of the parent document is determined via **score mode**. it is average by default (average of the scores of all the matching child documents), but it can be changed to min, max, sum. we just need to add `"score_mode": "max"` to the `nested` object for this
- if we add the **inner hits** parameter, we get all the nested documents that matched, with what score etc. understand that by default, we will get only one score which is for the parent document. this parameter helps us dig deeper into what nested document matched, with what score, etc. we just need to add `"inner_hits": {}` to the `nested` object for this

## Controlling Query Results

- specify format using ?format. can be for e.g. yaml
- use ?pretty if using curl so that the json response is properly formatted. response when using kibana is anyways always formatted, this is more when using for e.g. shell
  ```txt
  curl --cacert ~/elasticsearch-8.12.0/config/certs/http_ca.crt \
    -u elastic:7Nb_iz3DKsvOgWirudWq \
    -XGET "https://localhost:9200/_cat/nodes?format=json&pretty"
  ```
- we can specify `_source` key to decide what attributes the result should return. by default, the entire document is returned. use case - we only need the ids and want to fetch the original data from another source. it is like projection in sql. set it to false for just the ids, or specify the attributes to include / exclude
- control the number of results returned using the `size` parameter. the default is 10 -  
  ```txt
  get products/_search
  {
    "size": 100,
    "query": {
      "match_all": {}
    }
  }
  ```
- to implement pagination, we can implement the offset using `from` - 
  ```txt
  get products/_search
  {
    "size": 1,
    "from": 2,
    "query": {
      "match_all": {}
    }
  }
  ```
- implementing pagination
  - total_pages = ceil(total_hits / page_size)
  - `size` is page size
  - `from` is page_size * (current_page - 1)
- sorting results - default is sorting by score. also note that sorting by name would throw an exception like - `Text fields are not optimized ...`, so use name.keyword. recall that [default dynamic mapping](#mapping) would generate [multi field mapping](#multi-field-mappings) for strings, with both text and keyword variant
  ```txt
  get products/_search
  {
    "size": 10,
    "from": 2,
    "sort": [
      { "price": "desc" },
      { "name.keyword": "asc" }
    ],
    "query": {
      "match_all": {}
    }
  }
  ```
- assume field is multi valued (elasticsearch does not care if a field is an [array](#arrays-in-elasticsearch)). we can then inside the sort array, structure the object like so - 
  ```txt
  {
    "price": {
      "order": "desc",
      "mode": "avg"
    }
  }
  ```

## Metric Aggregations

- **metric aggregations** - calculate metric like sum, average, etc on the field we specify. e.g. - 
  ```txt
  get orders/_search
  {
    "size": 0,
    "aggs": {
      "total_sales": {
        "sum": {
          "field": "total_amount"
        }
      }
    }
  }
  ```
- `total_sales` is the name of the aggregation, inside which we specify the type of aggregation e.g. `sum`, and inside `sum`, we provide the name of the field to perform the aggregation on
- we set the size to 0 because retrieving the documents is of no use to us. i  the case above, just all documents would be fetched / based on size specified
- similarly, we can use `avg`, `min`, `max`, `cardinality` (for distinct values)
- note - we can also specify `query` etc to filter out the documents on which we want to perform the aggregation
- so, to get the number of documents on which our aggregation was performed, we can use `value_count`
- we can use `stats` for a summary that includes aggregations like min, max, etc

## Bucket Aggregations

- **bucket aggregations** - we calculate aggregations for buckets of documents. documents fall into a bucket, and aggregations are not calculated for a specific field like in metric aggregation
- my brain cannot remember this syntax, so just understand and remember the idea for reference, but refer docs for the actual syntax
- there are many more bucket aggregations like [range](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-range-aggregation.html) for custom ranges of numbers / dates, [histogram](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-histogram-aggregation.html) to automate this bucket creation, etc, refer documentation based on use case

### Term in Bucket Aggregation

- [term](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html) - based on the field we specify, it will dynamically create the buckets for us. e.g. log level for logs, status for order like below, etc
  ```txt
  get orders/_search
  {
    "size": 0,
    "aggs": {
      "status_agg": {
        "terms": {
          "field": "status"
        }
      }
    }
  }
  ```
- this helps us get different buckets for each order status, where each bucket contains the number of documents present in it
- additionally, to get the documents which have for e.g. the status field set to null / do not have the status field, we can add the following inside `terms` above - 
  ```txt
  "missing": "N/A", // 
  "min_doc_count": 0 // 
  ```
- `missing` helps set name of bucket with documents containing missing status field to "N/A"
- why set `min_doc_count` - the bucket would not be returned if no faulty documents are present. setting it to 0 helps ensure even buckets with 0 documents are returned
- note - bucket aggregations are not always accurate. when our query reaches the coordinating node, it asks each shard for the top 10 documents. now, the count of status pending can be in top 10 of the first shard, but not necessarily in the second shard. so, all of the pending orders might not be present in the bucket once the coordinating node aggregates the result from both first and second shard. solution - increase the size parameter so that the default of 10 is not used. issue - it will effect performance

### Nested in Bucket Aggregations

- unlike metric aggregations, bucket aggregations allow for nesting
- in fact, we can nest a metric aggregation inside a bucket aggregation as well
- e.g. below, we will have stats like min, max, etc for each bucket. we create bucket using term discussed above
  ```txt
  get orders/_search
  {
    "size": 0,
    "aggs": {
      "status_agg": {
        "terms": {
          "field": "status"
        },
        "aggs": {
          "status_stats": {
            "stats": {
              "field": "total_amount"
            }
          }
        }
      }
    }
  }
  ```

### Filter in Bucket Aggregations

- [filter](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-filter-aggregation.html) - e.g. i want the avg price of all sales, and i also the average price for sales of t-shirt
  ```txt
  get /sales/_search?size=0&filter_path=aggregations
  {
    "aggs": {
      "avg_price": { "avg": { "field": "price" } },
      "t_shirts": {
        "filter": { "term": { "type": "t-shirt" } },
        "aggs": {
          "avg_price": { "avg": { "field": "price" } }
        }
      }
    }
  }
  ```
- response will contain both the average price of t-shirt's sales and average price of all sales
- remember - if we for e.g. wanted just the average sales of t-shirts, we would run the below i.e. a query will filter the documents then the aggs would only run on the filtered documents
  ```txt
  get /sales/_search?size=0&filter_path=aggregations
  {
    "query": { "term": { "type": "t-shirt" } },
    "aggs": {
      "avg_price": { "avg": { "field": "price" } }
    }
  }
  ```

### Filters in Bucket Aggregations

- [filters](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-filters-aggregation.html) - helps us perform aggregations on custom buckets
- e.g. max length of log for errors and warnings
  ```txt
  get logs/_search
  {
    "size": 0,
    "aggs": {
      "messages": {
        "filters": {
          "filters": {
            "errors": { "match": { "body": "error" }},
            "warnings": { "match": { "body": "warning" }}
          }
        },
        "aggs": {
          "max_length": {
            "max": {
              "field": "message_length"
            }
          }
        }
      }
    }
  }
  ```

## Kibana

- open source ui to visualize elasticsearch data
- it also stores its data inside elasticsearch itself, thus helping us avoid issues around backups, easily scale kibana horizontally, etc
- dashboards are dynamic as well with interactivity
- **data views** - 
  - was called **index patterns** in the past
  - we specify an index pattern here, and all indexes matching this pattern will be queried by kibana
  - e.g. for logs, it is typical to have one index per month to help with scaling, as having all the data inside one index might not scale well
  - optionally, we can also set the timestamp field when configuring a data view which helps filter the data in dashboards by time
- kibana has different apps like apm, maps, dashboard, etc
- **kql** or **kibana query language** - quickly put together some querying to filter documents instead of the verbose elasticsearch's query dsl. kql is internally converted to the equivalent elasticsearch query dsl. some tips - 
  - simply type some words to search for them in all fields - `products fischer`
  - search for the exact phrase by surrounding using double quotes - `"products fischer"`
  - search for documents with specific values for a field using operators - `http.response.status_code : 400`
  - `:` is for equals, we can also use `>`, `<=`, etc
  - we can have multiple conditions and combine them using boolean operators like `and` and `or`
  - invert condition using `not`
  - make groups using parentheses `()` to for e.g. avoid relying on the default precedence
  - we can use wildcards for values - `url.path : /brands*`
- kibana -> discover for browsing through index data as is. it is meant for adhoc analysis of data
  1. data view - select the data view to use
  2. kql - enter kql
  3. time - enter time range, absolute or relative. recall the timestamp field we set when creating the data view. this is a common feature in different apps across kibana
  4. histogram - based on our time range, elasticsearch will automatically create the histogram. e.g. since my time range was of three days, it generated buckets of an hour, and shows number of documents inside each bucket
  5. fields - by default all fields are displayed. e.g. to only see values of certain fields in 6., we can select the fields here
  6. messages - the actual documents (log messages in this case)
  
  ![discover](/assets/img/elasticsearch/discover.drawio.png)

- note about time - throughout the ui, time is in our timezone, but when queries are sent from kibana, they are sent in utc format
  - why is it good - e.g. if i want to see the logs in the last 5 hours. i will simply see the values in my timezone / query using my timezone, without having to care about the conversion myself
  - when it can be a problem - i want to see the logs for 1st of january. ist of january can mean different times in different timezones. so, i might want to adjust the times in my query / change the timezone itself in kibana
- to create visualizations - from the sidebar, go to analytics -> visualize library -> create visualization
  - my understanding - the kql and time filters at the top are available at the top - the kql we enter is a part of the visualization, but the timestamp we select is not
- we configure from the right pane
- the left pane shows us the actual values
- in the right pane, there are two sections
  - metrics - for the actual metric - average of total in this case
  - buckets - for the parameter to bucket based on - product category in this case
- metric visualization example -<br />
  ![metrics](/assets/img/elasticsearch/metrics.png)
- when doing nested aggregations, a typical example can be - 
  - bucket using date histogram and timestamp field
  - create the sub aggregation using [term](#term-in-bucket-aggregation) and e.g. status code field
- in visualizations like line chart etc, we can select the bucket type to be **split series** or **split chart**. split series will show for e.g. in the same chart, whereas split chart will create separate charts in the same visualization
- the order of aggregations might matter sometimes - e.g. if i want the date histogram of the top 5 most accessed url paths throughout - 
  - if i first bucket by date and then by url path, kibana would show the top 5 urls for every interval
  - however, if i reverse this order of bucketing, i get the right output
- example of line chart. notice the configuration on the right, with the right ordering explained above<br />
  ![line chart](/assets/img/elasticsearch/line-chart.png)
- note - bar, area and line chart are configured in the same way, they are just different to look at
- recall [filters](#filters-in-bucket-aggregations) in bucket aggregations. we use kql to specify custom buckets<br />
  ![filters](/assets/img/elasticsearch/filters.png)
- note - for above use case, we could have used range as well, but terms might be useful for more custom bucketing use cases
- when using date histogram, the interval can be set to **auto** - kibana decides the best interval automatically, e.g. a day if the range is a few months, or an hour if it is a day, etc
- **data table** - e.g. we want total sales for all salesmen
  - we should use terms aggregation (since the buckets are dynamic). the field to use would be salesmen's id
  - just like in bar chart etc, data table would have **split rows** and **split table**
  - we add the metric to be sum of total
  - now, just the salesmen's id and total might not be good to look at - we might want to add the salesmen's name. so, we use a "no op" metric like "top hits". this way, the top document of the bucket is used, and we use the field as salesman's name. in our case, that hardly matters because all orders in the same bucket have the same salesman
  - we can order the buckets using one of the metrics - when configuring the bucket using salesmen's id, we configure it to order using the metric we added - sum of total (refer 3rd point)
  - we can configure the data table to for e.g. display the total at the end

  ![data table](/assets/img/elasticsearch/data-table.png)

- **heat maps** - the basic one which we might probably use is matrix based, but other use cases include - 
  - actual maps - e.g. which region has the most activity on our website
  - on websites - e.g. like eye tracker - which areas of our website draw the most attention
- e.g. we would like to see the peak hours on the different pages of our website
  - we already have an "hour of day" field to use histogram aggregation on. this way, we get it for each hour
  - now, we use terms aggregation for the "url path" field
  - each cell shows how many visits were there for a particular hour and url path. clearly, activity is more around 8am to 8pm

  ![heat map](/assets/img/elasticsearch/heat-map.png)

- **tag clouds** - bubbles would be larger for the tags with higher values. e.g. bucket using cities, and measure sum of order totals<br />
  ![tag clouds](/assets/img/elasticsearch/tag-clouds.png)
- **dashboards** - orchestration of visualizations. they typically show all the visualizations from the same data view
- when we edit the visualizations for a dashboard, we can either modify the visualization itself, or override the settings of the visualization at the dashboard level, thus leaving the visualization as is
- **interactivity** - when we click on the chart, it automatically adds **filters** (they are like ksql i.e. present at the top) and update other visualizations using these filters as well. similarly, if we select some areas (like rectangles) on the charts, it will automatically set the timestamp filters on the dashboard and update other visualizations using this time range as well. e.g. refer the filter below on the left and the time range on the right, which were added based on our interactivity with the visualizations
  ![interactivity](/assets/img/elasticsearch/interactivity.png)
