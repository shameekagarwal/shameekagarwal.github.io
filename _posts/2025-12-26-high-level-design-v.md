---
title: High Level Design V
math: true
---

## RESHADED Approach

- it is a strategy we can use to solve problems design problems
- "requirements" - gather the requirements and scope the problem
- "estimation" - estimate the resources (hardware and infrastructure) for the number of users
- "schema" - which tables we need and what fields are part of these tables
- "high level design" - identify the main components and building blocks
- "api design" - build interfaces (typically using api calls) that allow users to interact with our systems
- "detailed design" - define the workflow, the different technologies, evolve design where applicable
- "evaluation" - discuss effectiveness and then tradeoffs
- "distinctive feature" - each design problem has unique aspects, e.g. concurrency control in google docs, wherein different users want to edit the same document simultaneously

## Youtube

### Functional Requirements

- stream videos
- upload videos
- search videos
- view thumbnails
- like / dislike videos
- add comments to videos

### Non Functional Requirements

- latency - streaming experience should be smooth
- scalability - as the number of users increases, the storage for content, the bandwidth for streaming to multiple users simultaneously, etc should also scale accordingly
- reliability - uploaded content should not be lost or damaged
- consistency - strong consistency might not be needed for all features, e.g. all users subscribed to a creator need not get notified about new uploads by them immediately

### Estimation

- daily active users - 500 million
- average length - 5 minutes
- average size - 600 mb (original), 30 mb (after compression, encoding, etc)
- size of processed video is 6 mb per minute (30 / 5)
- assuming 500 hours of video is uploaded per minute, we get total storage = 500 * 60 * 6 = 180 gb per minute
- note - storage would include several other things - thumbnail, video metadata, etc, which we may ignore, as they are much smaller in size compared to the video content. also, we might transcode the video into different formats. e.g. assuming we stored videos in 5 different qualities and average size across all of them is 6mb itself, the total size of storage becomes 900 gb
- no. of servers = assuming daily active users as no. of requests per sec, we will need 500 mil / 64 k ~= 8k servers
- size of video raw video is (600 / (5 * 60)) = 2 mb per second or 16 mbps
- so, upload bandwidth = (500 * 60 * 60 / 60) * 16 = 480 gbps
- similarly, we can calculate the bandwidth for streaming as well, assuming view:upload ratio is 300:1

### Schema

- user - id, username, email, password
- channel - id, user_id, name, description, category, subscriber_count
- video - id, channel_id, title, description, upload_date, view_count, like_count, dislike_count, video_uri
- comment - id, video_id, user_id, comment_text, comment_date, like_count, dislike_count

_this is a starting point, we can add more details, e.g. different qualities of videos etc_

### High Level Design

- client requests reach the server
- the server stores the metadata in a database
- simultaneously, the video is sent to an encoder and transcoder
- "encoding" - compressing the video
- "transcoding" - converting the video into different formats, bitrates, etc to support different devices and network conditions
- finally, this encoder sends the processed video to a blob storage
- after this, the content can be pushed to a cdn system to support streaming with low latency

### API Design

- `upload_video` - post request
  - `user_id` - id of the uploader
  - `video_file` - file to upload
  - `title`
  - `description`
  - `tags` - helps improve search results
  - `default_language` - the language shown to the user by default (for title, description, etc)
  - `privacy` - videos can be public or private
- the video is broken into smaller packets and uploaded to the server. in case of failure, the user can retry and resume from where they left off
- `stream_video` - get request
  - `video_id` - id of the video to stream
  - `user_id` - id of the user requesting the video
  - `screen_resolution` - users send their screen resolution, which helps the server determine the quality of video to stream. e.g no point sending a 4k video to a user with 720p screen resolution
  - `bitrate` - transmission capacity of the user to determine which quality of video to stream for a better user experience. e.g. if the user has a low bitrate, we can send them a lower quality video to avoid buffering
  - `device_chipset` - the hardware capabilities of the user device, as they decode videos. e.g. older devices cannot decode newer, optimized video formats
- `search_video` - get request
  - search videos based on `search_string`
  - additional parameters like `tags`, `upload_date`, etc can be used to filter the search results
- `view_thumbnails(user_id, video_id)`
- `like_video(user_id, video_id, like)`
- `add_comment(user_id, video_id, comment_text)`

### Detailed Design

- "load balancers" - divide traffic across multiple servers
- "web servers" - respond to user requests. considered as an interface to api servers
- "application server" - handles the core business logic
- "user and metadata storage" - since user data and video metadata are both different kinds of data, we can use different storage clusters for them. this helps decouple and scale them independently. we can use mysql or nosql in case of large concurrent reads and writes
- "upload storage" - temporary storage for user uploaded videos
- "encoders" - performs encoding and transcoding of videos in the upload storage
- encoders can also generate the thumbnails for videos
- they then again write to the video metadata storage to update with thumbnail etc data
- "cdn" - used for popular content
- we use a "distributed search" system for searching through videos easily - mention working of "inverted index", etc - how he categories, description, etc of the video can be tokenized etc
- then, mention how for ranking the videos, factors like view count, recency of upload, etc would be taken into account

### Distinctive Features

- "consistency" - we prefer availability over consistency (cap theorem)
- "caching" - we can use lru strategy for long tail content
- "storage" - we can use mysql for users, as users need not scale as much, and we get benefits of consistency, indexes, etc. however for thumbnails, etc, we would need a lot of scale, so we need solutions like bigtable, cassandra, etc
- "duplicate videos" -
  - duplication can happen due to several reasons, users might try to spam the system, copy content, etc
  - these can cause copyright issues, consume significant storage and compute, etc
  - so, we can use several solutions to detect duplicates
  - solution 1 - "lsh" or "locality sensitive hashing" - in hashing techniques like sha256, even a pixel change will lead to a completely different hash value. in lsh, the high dimensional data is converted to a smaller fingerprint. this is then hashed. this helps catch similar videos, e.g. same video with different quality
  - solution 2 - "bma" or "block matching algorithm" - the video is divided into smaller blocks. then, we try finding the block of video 1 in video 2 (maybe at a different position). this helps compare "motion" between the two videos - if the motion is the same, the two videos are likely to be the same
  - solution 3 - "phase correlation" - uses "fft" or "fast fourier transform" to represent images as waves. this helps capture for e.g. if a video is shifted by a few seconds or pixels easily
- google uses "vitess" to help scale databases. it is an abstraction layer that hides the complexities of sharding, replication, complex database client logic, etc away from the developers
- "web server" - use an optimized, open source solution, self managed solution like lighttpd
- use the right tech stack in the right place - c++ (and not python) for encryption, etc
- "encode" - videos are broken into smaller "segments"
- now, different segments can be encoded differently. e.g. the segments which are less dynamic and have less colors are encoded with a higher compression
- we also encode videos to support different kinds of devices and network conditions
- we can also talk about how cdns work, how tail content works in cdn, etc here
- we can also pre determine content from popular uploaders and forward it to cdn directly (e.g. mr beast)
- "popular content" -
  - different regions can have different popular content
  - formula for determining popularity - $$Th_{reg} = (w_{comments} \cdot N_{comments}) + (w_{likes} \cdot N_{likes}) + \dots$$
  - the threshold for different regions can be different
  - a video is globally popular if sum of thresholds of different regions passes a global threshold
- also mention "sharded counters", local vs global trends, sliding window for trending windows, etc here

### Recommendations

- naive approach - we do an "offline" calculation for recommendations
- we assign a "rank" / "score" to each video for each user using an "ml model"
  - user 1 video 1 - 89
  - user 1 video 2 - 63
  - ....
  - user 2 video 1 - 56
  - user 2 video 2 - 99
  - ....
- then for each user, we sort using the score, and the highest scoring ones are used for a user's timeline
- issue - we have billions of users and millions of videos, and we would want to run all the user-video combinations against this ml model
- so, we need a much more efficient solution
- so, we introduce a step called "candidate generation", where we filter the millions of videos down to a few hundred, before ranking and forwarding them to the user
- we can have multiple logic for candidate generation - all these candidate generators individually output some videos
  - candidate generator 1 - find videos by creators the user is subscribed to
  - candidate generator 2 - find recent videos that are very popular / trending videos
  - candidate generator 3 - find videos matching users interests - videos user liked, viewed recently, etc
- then, we take the union of all of them, and perform the "ranking" / "scoring" operation against them
- for candidate generator 1 and 2 - we simply need to query almost some source i.e. the logic is not as complex
- for candidate generator 3, we use the following approach -
  - we ingest all the video metadata into a "vector store" (open source example faiss, cloud example pinecone)
  - how it works - textual data like categories etc are converted into a "vector" using "embeddings"
  - then, when user requests for their timeline, we first generate a vector for e.g. for the last video that the user watched. then, we query the vector store to find vectors close to it in the vector space, and then return these results

### Upload / Download Flow Deep Dive

- videos can become very large in size
- sending them through load balancer / api gateways is impossible
- so, the client first only sends the video metadata to the service
- the service first saves the video metadata
- it also generates a "signed url" for s3 / the blob storage and returns it to the client
- then, the client directly uploads the video to s3 using this signed url
- aws sdk includes features like "multipart uploads" (chunking) which helps upload such large videos easily
- after the client uploads it, we can use one of the two methods to update the metadata -
  - the client notifies the service that the upload is complete
  - we use s3 event notifications to notify the service that the upload is complete
- similarly for downloading, the service can just send the metadata and the signed url
- the client can then use for downloading the video directly from the blob storage
- the encoding and transcoding logic can work off of s3 event notifications as well -
  - they receive the notifications when a new video is uploaded
  - they encode / transcode videos using different encodings and formats
  - they write these back to the blob storage
  - this dispatches notifications which can be used to update the video metadata
- before starting the encoding and transcoding logic, the video is "chunked". advantages -
  - these chunks can be processed in parallel
  - the client need not download the entire video at once
- note - remember that this chunking process is different from the multipart upload process. the former is for optimized encoding and streaming, while the latter is optimized for uploading large videos
- note - features like adaptive streaming, https, cdn, etc are part of streaming protocols like hls, dash, etc
- when sharding e.g. for dynamodb, we can use video id as the partition key and timestamp as the sort key
- "adaptive streaming" - as the user's network conditions change, we send the right chunks of the video for an optimal experience without buffering. first, the users download a "manifest file" - it contains urls for the different resolutions for each of the different segments. then, based on the network conditions, the client can request the segment with the right resolution from the cdn

## Quora

### Estimation

- assume 300 million daily active users
- assume each asks 1 question per day
- assume each question / answer combination contains 100 kb of textual data
- assume 15% of questions contain images, and 5% of questions contain videos
- assume 250 kb for images and 5 mb for videos
- so, total storage =
  - (300 mil * 100 kb) + (300 mil * 15% * 250 kb) + (300 mil * 5% * 5 mb)
  - 30 tb + 11.25 tb + 75 tb
  - 116.25 tb per day
- incoming bandwidth = 116.25 tb / (24 * 60 * 60) * 8 ~= 11 gbps
- outgoing bandwidth = assume a user views 20 questions a day. this way, we would need 20 * incoming bandwidth = 220 gbps for the outgoing bandwidth

### High Level Design

- most things should be the same as [youtube](#youtube)
- "data storage" - we can use a relational database like mysql for questions, answers, etc. for scaling mysql, we use the techniques discussed [here](/posts/high-level-design-iii/#databases) - we split tables of a database into multiple shards, keep partitions of different tables in the same shard to avoid querying across shards in case of joins, etc. for storing the mapping of which shards hold which partitions of which tables, which ones are primary, etc, we can use "zookeeper"
- below is more of a "case study" which we can talk about as part of other systems as well
- quora page has multiple components like feed, ads, question, comments, user info, etc
- quora wanted to build these components in parallel
- "webpara architecture" - 
  - there were a set of machines called the "webpara machines", which ran the "master processes"
  - a separate set of "webworker machines" ran the "worker processes"
  - master process would delegate to the worker processes and finally aggregate the results from them
  - disadvantage - slowness due to network calls. it compounded with scale
- "ultralisk architecture" - 
  - "ultralisk machines" ran both masters and workers
  - it used local socket / tcp for communication, and so concepts of congestion control when using tcp etc come as well
  - since all communication happened via localhost, there was a significant reduction in latency

![](/assets/img/high-level-design/quora-ultralisk-vs-webpara.png)

## Google Maps

### Functional Requirements

- identify the current location of the user
- find the best possible path to reach the destination
- track location of user as it changes
- how long does it take on each path (eta, distance in kms, etc) - it needs to factor in traffic conditions, road conditions, weather, time of day, etc

### Non Functional Requirements

- performance - calculation of eta given the source and destination should be fast
- scalability - since both users and enterprise applications use google maps, the system should scale well

### High Level Design

- "location finder" - find the user's current location and show it on the map
- "route finder" - find the paths from source to destination
- "navigator" - users can deviate from the suggested path. this service helps recalculate the path and send notifications to the user
- "gps / wifi / cellular data" - these technologies help find the user's location
- "distributed search" - helps convert place names to latitude and longitude. an index is created on the place names. e.g. users can select their destination by typing in the typeahead search box. this technique of converting human readable names to exact latitude and longitude is called "geocoding"
- "graph processing service" - runs the shortest path algorithm on the graph
- "area search service" -
  - if we know the latitude and longitude of the source and destination, we can calculate the distance using dijkstra
  - however, running it on a graph with billions of nodes, at millions of requests per second is not efficient
  - so, this service after identifying the source and destination, finds the areas close / between / around the source and destination, with the help of the distributed search service
  - now it can run the shortest path algorithm using the graph processing service
- we will store the data of roads etc in a graph database
- "pub sub system" for asynchronous communication between different services
- we have a flow that reads data from various third party sources like traffic data, roads and connectivity, etc and then updates the graph database accordingly

### Schema

- we would be receiving location updates very frequently, so we would need a key value store that can handle high throughput
- for storing location, we can use the following attributes - 
  - user id
  - timestamp
  - location - latitude and longitude
- the primary key would be (user id, timestamp). the partition key would be user id, and the clustering key would be timestamp
- this way, we can easily query for the latest location of the user

### API

- an endpoint to update the current location of the user continuously
- an endpoint to search for the exact location of the destination on the map given its name
- an endpoint to find the optimal route from source to destination, given the mode of transport, etc

### Workflow

- user initiates a request
- "location finder" finds the user's current location using gps / wifi / cellular data
- user searches for the destination using a typeahead, and the "distributed search" converts it to an exact location
- "route finder" finds the path from source to destination
- the route finder service requests the "area search service" to find the area between the source and destination
- then, the route finder service requests the "graph processing service" to run the shortest path algorithm on the graph database for this area
- the "navigator" keeps track of the user movement and keeps updating the route accordingly

### Algorithmic Considerations 

- "contraction hierarchies" - we perform two optimizations to reduce the complexity when performing dijkstra's algorithm
- optimization 1 - if an edge connecting a to b adds no value, as we can be certain that people never use it, we simply remove it from the graph
- optimization 2 - if we know that a -> e has only one path i.e. a -> b -> c -> d -> e, we can simply add the edge a -> e to avoid computation
- we need to have different "levels" of our map / graphs
- use case 1 - as we "zoom in", we see more detailed images on google maps with more smaller roads and more precise location details, but as we zoom out, we only see images with the important highways and district level names
- use case 2 - it helps us run our algorithms optimally. for going from a to b, if the two places are far apart, we can consider going from a to main roads, then travel along the main roads, and then finally main roads to b. the main road(s) can be part of a larger more zoomed out graph, on which a different dijkstra's algorithm can be run, while the smaller back roads can be a part of a finer graph, which we only need to consider at the start or end of our journey
- remember that the weights etc of all these edges would constantly keep changing as listed in requirements, [refer this](#edge-weights)
- these ideas of levels can be linked to using [geo hash described in uber](#uber). e.g. 110 would mean 3 levels, 1110 would mean four levels and so on

#### Segments

- we partition the graph into "segments" (say 5km by 5km)
- because a segment is much smaller than the whole map, it can be loaded into memory and processed easily
- each segment can be defined using four sets of latitude and longitude
  ![](/assets/img/high-level-design/google-maps-segment.png)
- we can treat the "roads" within a segment as edges, and "intersections" as nodes
- now, we can precompute the shortest paths between the different nodes in a segment and store them in the graph database
  ![](/assets/img/high-level-design/google-maps-segment-shortest-paths.png)
- typically, users would not start at a node, but somewhere on the edge. we would handle this case on the fly as follows - 
  ![](/assets/img/high-level-design/google-maps-segment-shortest-path-edge-case.png)
- the nodes at the edges of segments are called as "exit points". they help connect adjacent segments. for instance, look at how the nodes marked in blue below help connect the segment to its adjacent ones
  ![](/assets/img/high-level-design/google-maps-segment-adjacent.png)
- now, using the area search service, we would find the segments to run the algorithm on
- then, our nodes are the "exit points", while the edges are the "precomputed paths" between these exit points
- all the segment data cannot be stored in a single database, so we can use a distributed graph database, shard using the segment id, etc

### Edge Weights

- for traffic data, we use multiple things -
  - realtime data from users
  - third party data from sensors like traffic cameras
  - static data based on roads
  - historical data based on patterns
- all these are used to update the "weights" of the edges on the graph database
- this is then be used by the graph processing service to calculate the shortest path by considering traffic etc

### Analytics

- recall how we were storing the [location data](#schema-1)
- now, we can use a "cdc" pipeline on top and push the data to say "kafka"
- next, "spark streaming" can be used for realtime data processing and analytics
- this way, we can analyze how the traffic changes based on time of day, location, vehicle, etc

### Realtime Location Tracking

- persistent connections between client and server using websockets for dual communication
- here, describe other solutions like long polling, server sent events, etc and pros and cons of each
- e.g. if there is an accident on the route, the server can immediately send a notification or update the route of the client

## Yelp

### Requirements

- users can read and write reviews
- users can search by different parameters -
  - name of place (e.g. mc donalds) to list the close by branches of mc donalds
  - type of place (e.g. cafe) to list the nearby cafes
  - etc
- extension of search - search for all business within a radius of the user
- users can view a business details like reviews, location, etc
- performance / latency - search results should be returned within 500ms
- strong consistency < high availability - we need not see the new reviews immediately, we can see it eventually
- scalability - scale easily for the growing number of businesses and users
- with 100m dau and 5 search queries per user, we get 500m/100k = 5k qps

### Schema and API Design

- entities - business, reviews, users (add attributes for each of them)
- next, we cover the different apis supported 
- search - `GET /businesses?category={}&name={}&location={}&radius={} -> Partial<Business>[]`. this is using rest semantics - using get with plural form of the entity. notice how the different attributes are passed as query parameters
- the response would include only certain attributes of the business like a short description, thumbnail, name, average rating
- additionally, since the search endpoint can return a large number of results, we should add pagination support using page number and limit kind of parameters
- get business details - `GET /businesses/:id`. point out how this time we use a path parameter unlike a query parameter we used for the search api
- the reviews for a large business can be huge in number, so we can have a separate api for fetching the reviews with pagination support - `GET /businesses/:id/reviews?page={}&limit={}`
- create a review - `POST /businesses/:id/reviews`. point out how unlike the other apis, this one might need authentication

### High Level Design

- "sql databases" are used for storing user data, places, reviews, photo urls, etc
- here, talk about how to store data to avoid cross shard queries, use zookeeper to store mapping of partition to shard etc
- our queries would join the business data, reviews, etc, all of which should ideally be present on the same shard
- updating the average rating - when we add a review, we do it as part of a transaction
  - begin
  - create the row review
  - calculate the average rating using sum(ratings) / count(ratings)
  - update the business table with the new average rating
  - commit
- what if we get multiple reviews simultaneously, how would it affect our average rating calculation? - describe techniques like obtaining a lock on the business row, or using optimistic concurrency control, etc
- for ensuring 1 review per user per business, we would place a unique constraint on the (user id, business id) pair in the reviews table
- next, for handling searches, we can have a cdc pipeline from our relational database to for e.g. elasticsearch
- the other solution is to use postgres for our sql database, since it already has support for features like postgis for geospatial indexing, full text searches, etc
- we can use cqrs pattern for separating reads from writes

### Deep Dive into Geo Spatial Data

- this is also called a "proximity service / search" - find close by restaurants, gas stations, etc
- solution 1 (naive) - the places table would have the place id, and a column for storing the latitude and longitude each
- assume we want to query the places nearby to a specific location. say the location is m, n. we look for all places within a radius r, using m-r,n-r to m+r,n+r. this means we index the places table on the latitude and longitude columns
  ```
  select *
  from business
  where lat between (my_lat - r) and (my_lat + r)
  and long between (my_long - r) and (my_long + r)
  ```
- issue 1 - regular indices are optimized for 1d data, not 2d - when we perform searches as described above on two indexed columns, the searches are very slow
- issue 2 - recall that relational databases can handle around 1k rps, which is not enough for the scale of yelp
- solution 2 - we also store the segment id alongside the place. we index on this column. this way, we would only have to search against specific segments
- solution 2 optimized - we store the data in a key value store, where the key is the segment id, while the value is the list of places present in that segment
- so, we can introduce a "segments producer" component that would for each place, find the "segment id" by querying [google maps](#google-maps) and then populate the key value store

![](/assets/img/high-level-design/yelp-write-flow-segment-producer.png)

- solution 1 (naive) - a user might be searching for a radius spanning multiple segments
- so when querying, we first calculate the segments we need to query for
- then, we query the key value store for these segments to get a list of places inside these segments

![](/assets/img/high-level-design/yelp-multi-segment-naive.png)

- issue - not all segments have the same number of places. some segments might be very dense, while others sparse
- so, solution 2 - we use "quad trees"
- quad trees have four children, and each leaf node represents some interesting spatial information (in our case, it is a segment)
- we split a segment into four smaller segments, if the number of places in that segment exceeds a certain threshold, say 500. so, each leaf node in our case would be a segment with a list of places
- we also connect the child nodes using doubly linked lists as it allows us to traverse through neighboring segments easily
- we start from the root node and keep traversing down the tree until we find the desired segment. then using the doubly linked list pointers, we traverse the neighboring segments
- this is also called a "geo spatial index"
- this is also supported by postgres via "postgis"

![](/assets/img/high-level-design/yelp-quad-trees.png)

- we can add new places to our system using a cron. it would involve updating the relational database, quad trees, etc
- we can partition data based on region id
- this way, places in the same region are present on the same server
- issue - some regions might be more popular
- solution - "place details" data is partitioned on place id, while region to place mapping is partition on region id
- for availability and to scale reads, we can use a primary secondary approach
- the servers used for reading and writing are separated from one another
- "aggregator server" - aggregate results from the quad tree servers and return to the user
- it can handle concerns like "ranking" of results based on ratings, relevance, etc
- so, the read flow becomes load balancer -> read servers / aggregator server

## Uber

### Requirements

- users should be able to request rides by entering a pickup and drop location
- drivers should be able to accept these rides
- track driver location in realtime
- find available drivers nearby to the rider
- show eta (estimated time of arrival) when -
  - driver is reaching the rider
  - when rider is going towards the destination
- show estimated fare for the trip and actual fare after the trip
- manage payments
- allow for trip updates - assign driver, cancellation, successful pickup, successful drop, etc
- low latency - show eta and fares immediately, match riders and drivers as soon as possible, etc
- consistency -
  - drivers and riders should see the same data
  - one driver to one rider matching
- at this point, we can also talk about what is out of scope -
  - different types of car
  - ratings for drivers and riders
  - schedule rides for later
- availability - for everything outside the ride matching / trips - things like location updates etc
- scalability - scale with increasing number of drivers and riders

### Entities and APIs

- entities - driver, rider, trip, location
- now, we would discuss the different apis
- one way i think can be to have everything revolve around the core entity "ride"
- POST /ride - create a new ride request
  - the request body contains the source and destination
  - the response body includes the ride id, estimated time of arrival, estimated fare, etc
- this api basically creates and saves a new ride entity in the database. the status of the ride can be in "fare estimated" state at this point
- so, the ride object would have several fields like source, destination, rider id, driver id, status, eta, fare, etc
- POST /ride/{ride_id}/request - the rider requests for a ride. the request would be processed asynchronously, as some driver would have to accept it. so, a 200 status code is returned immediately
- POST /ride/{ride_id}/accept - a driver accepts the ride request
- to be able to perform the matching, we would need to know the location of the driver
- POST /driver/{driver_id}/location - so, the drivers continuously send their location updates using this
- PATCH /ride/{ride_id}/status - used by drivers to update the status of the ride -
  - when the reach the pickup
  - when they pick up the rider
  - when they drop the rider
  - when the payment is received

### High Level Design

- we would have an aws managed api gateway that handles load balancing, request routing, authentication, ssl, tls termination, rate limiting, etc
- "ride service" - it is the entry point for all ride related requests - creating a new ride request, ride updates, etc
- "eta service" - calculate the total eta for the trip given the source and destination
- it considers realtime map and traffic data
- an ml model can be put on top, that considers parameters like time of day, weather, etc as well
- this ml model can then be trained on historical data and used for realtime inference
- "location service" - it receives driver location updates every 5 seconds
- this is used to update the location database
- "ride matching service" - it is responsible for matching riders and drivers
- it talks to the location service to find drivers within a certain radius of the rider
- it also for e.g. calls the "ride service" to filter out drivers who are not available
- then, it sends out a notification to all the relevant drivers using the "notification service"
- then, the drivers hit on the accept ride button, which calls the "ride service"
- for use cases like "trip information" that require consistency, use a relational database
- for use cases like "driver location" that frequently change and require high availability, use a nosql database like cassandra
- to handle slowness or disconnections in network, the app can store the requests locally, and send it when the network comes back up. this will also help resume from app crashes

![](/assets/img/high-level-design/uber%20hld.png)

### Deep Dive - Handling Geo Spatial Data

- we can have "quad tree map service" just like [yelp](#yelp)
- however, we would have drivers instead of places
- issue - it was not designed with upgrades in mind
- now, every 5 seconds, drivers would send their location updates
- so, we might have to remove them from their previous node, add them to a new node and if it exceeds the threshold, possibly split it into four
- solution - we maintain the driver location in a key value store like redis
- the updates are batched and processed by the quad tree periodically (e.g. every minute)
- my understanding - maybe using a key value store allows us to retain the latest location of the driver only, and directly apply that instead of applying every change
- issue - even this approach is not enough for scale
- main disadvantage - quad tree is good where density is different in different regions, data is static, etc
- for a system like uber, "geo hashing" is a better algorithm
- we basically use redis for this - since it is in memory, it is significantly faster
- notice how unlike quad trees where the split was dynamic, the split here is static - e.g. we divide all 4 regions into 4 smaller regions

![](/assets/img/high-level-design/uber-redis-geohash.png)

- it has optimizations which we can use - e.g. by looking at the initial characters of the hash (say 1 of 13), we can tell which broader region it is a part of (1), and accordingly accept or reject it without reading the whole hash
- understand how close points would have similar hashes as well. geo hashes are great for range queries

### Deep Dive - Consistency when Matching

- issue 1 - a ride should not be matched to more than one driver at a time. multiple drivers should not be able to accept the same ride request at the same time
- for this, our logic can be like so - 
  ```
  while (no drivers found) {
    find next driver;
    send notification to driver;
    wait for 10s;
  }
  ```
- issue 2 - imagine that people just got out of a movie, and there are 100 ride requests. the same driver might end up getting multiple concurrent requests for a ride from different people. we want to disallow him accepting more than one ride at a time
- recall we were calling the ride service to check for driver availability before sending out notifications to drivers. this works for drivers already in a ride
- however, it does not work for the case where we show the notification to the driver for a few seconds before removing the popup
- issue 3 - also, remember that we would have multiple instances of the ride matching service as well
- so, logic similar to ticket master etc can be applied here
- we would use a "distributed lock" (like redis), which helps the different instances of ride matching service coordinate
- additionally, we would add a timeout (say of 10s) so that the lock on the driver is automatically "released" if they do not accept the ride within 10s. this helps the driver accept other ride requests / match that rider to other potential drivers

![](/assets/img/high-level-design/uber-driver-redis-distributed-lock.png)

## Twitter

### Functional Requirements

- post tweets containing text and media
- view timelines i.e. tweets from people they follow etc
- search for tweets using keywords
- like / dislike tweets
- reply to tweets
- follow / unfollow others

### Non Functional Requirements

- available - twitter is sometimes used for time sensitive information like news etc
- latency - low latency to deliver feeds, read tweets, etc
- scalability - scale with growing users and number of tweets
- consistency - we can have eventual consistency, e.g. a user need not see a newly posted tweet immediately

### High Level Design

- users post tweets via load balancers, which distribute traffic to application servers
- dns resolves domain names to ip addresses
- it uses a sequencer called snowflake to generate unique ids for tweets, users, etc
- we need to monitor traffic (e.g. new year) to automatically scale our workloads
- we need to use replication and sharding of databases to handle scale
- we need a failover strategy for resilience
- twitter uses "polyglot persistence" for its architecture
- hdfs for events and logs for analytics
- cassandra for storing tweets - we do not need to support complex queries but at the same time, we need to support very high read and write throughput
- s3 like blob storage for media files
- mysql for ad management, with sharding and replication implementation. ad management involves bidding between advertisers etc, which requires strong consistency
- redis and sharded counters to write like counts etc
- kafka for asynchronous communication and realtime processing
- neo4j for storing relationships (graph). this helps with recommendations for who to follow etc
- lucene for searching tweets. it can have two kinds of searches -
  - search for tweets in the last 7 days (stored in ram)
  - search for all historical tweets, used for historical and analytical purpose (stored in disk)
- we can use cdc to automatically capture updates in tweets etc to update the lucene index
- we use caching at different layers including usage of cdn
- segcache - it uses caching heavily. segcache is better than redis and memcached for twitter as it has small object sizes. redis and memcached store more metadata for each object, which is not as efficient for twitter's use case
- zookeeper - maintains service configurations. this in turn provides primitives like distributed locks, leader election, etc
- observability - monitoring, logging, alerting, sampling to reduce overhead, etc
- "heavy hitter problem" - public figures with millions of followers generate massive traffic spikes. a single counter cannot maintain their likes and views. so, we can use "sharded counters"
- sharded counters also help determine "top k trends", both local trends and global trends. it uses a sliding window to determine the latest trends for hashtags. it places the shared counters close to the user (like cdn) to reduce latency. disadvantage - eventual consistency i.e. the likes and views might not be updated immediately

### Client Side Load Balancing

- disadvantage of centralized load balancer - twitter operates across several heterogeneous services
- in client side load balancing, the client embeds load balancing logic and selects the server directly
- services register themselves with a "service registry" so that clients can discover them
- this means lesser infrastructure, fewer hops and therefore reduced latency, etc
- the client load balancing needs to handle two things -
  - request distribution (osi layer 7)
  - session distribution (osi layer 5)
- session distribution determines which clients connect to which servers. if the client tried to connect to all servers, there would be a lot of connection overhead for the client
- request distribution determines out of the servers which were selected by the client, which server actually gets the request

#### Request Distribution

- for "request distribution", "p2c" or "power of two choices" is used
- the client randomly picks two servers, and sends the request to the one with lesser load
- comparing two random nodes yields exponentially better results than picking a single random node

#### Session Distribution

- "session distribution" - there are different methods this can use
- "random aperture" - clients select a random subset of servers
  - issue 1 - determining subset size is hard. for this, twitter uses a "feedback controller" to dynamically adjust the subset size
  - issue 2 - this solution is not fair. it might happen that some servers get overloaded while some stay idle. this solution causes inefficient resource usage
  - e.g. notice how server 0 is overloaded while server 2 is idle
  ![](/assets/img/high-level-design/twitter-client-side-load-balancing-session-random.png)
- "deterministic aperture" - similar to "consistent hashing"
  - clients and servers are mapped to discrete coordinates
  - each client selects the next for e.g. 3 servers on the ring
  - this guarantees equal distribution of servers
  - even as number of clients or servers change, the distribution is automatically adjusted
  - e.g. client 0 goes to servers 4, 5 and 0, client 1 to servers 0, 1 and 2, and client 2 to servers 2, 3 and 4
  ![](/assets/img/high-level-design/twitter-client-side-load-balancing-session-deterministic.png)
  - disadvantage - e.g. above, servers 0, 2 and 4 were selected by two clients each, while servers 1, 3 and 5 were selected by one client each. if we had two overlapping sets of clients, the difference would double - server 0 would have 4 clients, while server 1 only 2
  - this basically shows us how we can end up having "hot partitions"
  - so even here, distribution is not as fair, just like in random
- solution 3 - we modify "deterministic aperture" to use "continuous" instead of "discrete" coordinates
  - so, the client establishes connection with all servers with any overlaps (understand from the diagram)
  - e.g. client 1 establishes connection with 0, 1 and 2
  - however, it takes into account the fraction as well - weight of server 1 is 1, while server 0 and 2 is only 0.5
  - this weight is taken into consideration when the client uses p2c to select the server for sending the request
  - then, it uses p2c to determine the server to send the request to
  ![](/assets/img/high-level-design/twitter-client-side-load-balancing-session-deterministic-continuous.png)

### Timeline Generation

- assume 500 million daily active users open the app 10 times a day
- so, we would have approximately 5,000,000,000 / (86400) ~ 50k requests per second
- assume we need to store 50kb of metadata for each user
- this means we would need 500,000,000 * 50 = 25tb
- breakdown of the storage required for posts -
  - post have average 5kb of textual data
  - 4/5th of the posts have images of average size 200kb
  - 1/5th of the posts have videos of average size 2mb
  - so, average post size = (4 / 5 * 200) + (1 / 5 * 2000) + 5 = 565kb
- assume we need to show 100 posts per user timeline
- so, total storage required for timelines is 500,000,000 * 100 * 565kb = 30pb
- "fan out on read" approach -
  - users request for timeline
  - we query the list of accounts they follow
  - then, we fetch the tweets for these accounts
  - finally, we return these tweets to the user
  - disadvantage - very high latency
- "fan out on write" approach -
  - users post tweets
  - these then go to a message queue to help with buffering
  - then, workers consume these messages
  - first, they query the list followers of the user who posted the tweet
  - then, they update the timelines of these followers with the new tweet by appending it at the end
  - timelines of users are maintained in a cache
  - advantage - low latency reads
  - disadvantage - expensive writes
- "fan out on write" will not work for users like elon with millions of followers
- it will cause a problem called "thundering herd", where we would suddenly have to process millions of writes
- so, we use a hybrid approach i.e. we use fan out on read for them, whereas fan out on write for users with lesser followers
- now just like writes, elon's tweet might get lots of reads once published from multiple users, thus causing a "hot partition" like problem on our key value store
- solution - use a cache layer for the tweet service, and use multiple read replicas in it to distribute reads
- for ranking, we can use a machine learning model that can factor in parameters like recency, no. of likes and comments, relevance to the user, etc
- for timeline, we might also need a "pagination" approach - so, an api with pagination support (page size, cursor, etc) is needed
- to be able to easily find the followers of a user, we can choose the partition key and then create secondary indices accordingly
- similarly, the posts table can also be indexed by the creator

## Instagram

### Differences from Twitter

## TinyURL

- a url shortening service creates a short link for a url
- advantage - easier to type and share, reads better in communications, etc

### Requirements

- "short url generation" - generate a short and unique alias for a url
- "redirection" - redirect users to the original url
- "expiration" of these short links
- allow for customization of the short links, expiry, etc
- deleting expired urls, even if not reused, helps keep storage costs low and queries faster
- unpredictable - generated urls should not be guessable (e.g. using sequential ids), as otherwise, attackers can otherwise guess patterns and attempt to guess other links
- availability / fault tolerance - any downtime will cause redirection to fail, so system should be highly available and fault tolerant
- scalability - easily handle redirection as traffic patterns change
- latency - since it introduces an extra hop, it should be as low and seamless as possible

### Estimations

- read to write ratio is 100:1
- 1 entry requires 1kb of data
- 200 new million url shortening requests per month
- default expiration - 5 years
- so, total storage = (200,000,000 * 12 * 5) * 1kb = 12pb
- write qps = 200,000,000 / (30 * 24 * 60 * 60) ~= 77 qps
- read qps = 100*77 = 7.7k qps
- shortening requests bandwidth (writes) = 77 qps * 1kb * 8 = 616 kbps
- shortening requests bandwidth (reads) = 7.7k qps * 1kb * 8 = 61.6 mbps
