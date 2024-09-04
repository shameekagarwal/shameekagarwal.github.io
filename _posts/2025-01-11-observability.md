---
title: Observability
---

## Introduction

- earlier, we had "monoliths", so they had to be developed using "waterfall model"
- now "microservices" are developed using "ci cd", so each module can be deployed and maintained individually
- "monitoring" - collect data about systems regularly
- success is measured using mttd and mttr 
- "mttd" - mean time to detect - time between when issue actually happens and when teams become aware of it
- "mttr" - mean time to resolution - time between between detection and when system is operating normally
- now, we discuss some methods for monitoring - "red", "use", "four golden signals" and "core web vitals"
- "red" method - useful for monitoring "requests" - 
  - "rate" - requests per second. also called "throughput", "traffic"
  - "error" - failed requests
  - "duration" - transaction response time. also called "latency"
- "use method" - used for monitoring "resources" i.e. infra - 
  - "utilization" - amount of resources being used - e.g. cpu % etc
  - "saturation" - requests being queued or dropped - should be closer to 0
  - "error" - failed operations, e.g. disk writes
- "four golden signals" - by google - if you can focus on only 4 metrics, focus on these four - red + s from above
- "core web vitals" - for monitoring performance for end users experience in browsers - 
  - "lcp" - largest contentful paint - how quickly the main content of the page loads
  - "fid" - first input delay - how long it takes for the browser to respond to the user's first interaction
  - "cls" - cumulative layout shift - how often the users experience unexpected layout shifts
- note - websites with lower values of "core web vitals" are ranked lower in search results
- monitoring works when we know what to monitor / we know the metrics beforehand. however, with distributed systems, this might not always be the case
- hence, we have "observability" - it helps us dig deep into the issues, when we do not know about it beforehand
- monitoring can help us with "when" something is wrong. observability helps us with "why" something is wrong
- for observability, we collect "melt" data - 
  - "events" - discrete occurrences in our application. e.g. selling of a product, delivering of a product, etc
  - "metrics" - events are expensive to store and more importantly, query. so, we use metrics, which are pre aggregated views. note - due to these aggregation, we loose out on granularity when using metrics
  - "log" - logs can have a lot more details. an event can have multiple logs
  - "traces" - traces track a series of "causal events" across distributed microservices

## Platform

- new relic is an "observability platform"
- it helps organize, analyze, alert, etc on the data we send that we discussed above
- this is done by adding an "agent" to the services. this process is called "instrumentation"
- below, we discuss the different types of agents new relic supports
- "apm agents" - 8 languages like java, php, etc [supported by new relic](https://docs.newrelic.com/docs/apm/new-relic-apm/getting-started/introduction-apm/). along with that, we can use otel too
- it already does "automatic instrumentation" for most things like tracing and instrumenting popular libraries, but we can "manual instrumentation" as well
- "browser agents" - for core web vitals and other kpis. it also supports "spas" (single page applications) and sending business data. similarly, we have "mobile agents" as well
- "infrastructure agents" - we add these agents to our hosts, and then it gets access to things like system resources, processes etc
- infrastructure agents also have a separate log forwarding component embedded inside, just for logs
- finally, infrastructure agents also act as the intermediary between new relic and "on host integrations"
- "on host integrations" or "ohi" - for third party services like postgres, redis, etc, since we do not have access to their code directly
- if they have an endpoint that can be queried / files that the ohi can read, the data can be sent to new relic
- below is the entire architecture of agents sending data to new relic. notice how the working of logs is a little different. this is important, because in most architectures, shipping of logs is carried out separately just like this

![](/assets/img/observability/new-relic-architecture.webp)

- new relic helps with "end to end" observability. there are some more features present inside new relic
- "synthetics" - developers can run complex user journeys in the form of automated tests to ensure that the application is working as intended. this way, we run into issues automatically before an end user. the idea would be to create "alert conditions" at the back of these synthetic monitors, and be alerted in case of failures
- "new relic code stream" is a plugin for the ides like jetbrains and vs code, with which we are able to easily jump between the logs and code from within the ide. it also allows us to visualize the performance of parts of our code, anomaly detection features to detect issues since latest releases, etc
- all the telemetry data is ingested into the "new relic database"
- "entities" - 
  - anything that reports data to new relic. e.g. the agents report data to new relic
  - anything that has data that new relic has access to. e.g. new relic can pull data from cloud services
- entities are identified using a unique id called "entity guid"
- go to the "all entities" tab from the left sidebar. there, select "see metadata and tags" for an entity. here, we can see the metadata like the "entity guid" we discussed above, and the tags for that entity
  ![](/assets/img/observability/multiple-entities.png)
- navigate to the "service map" tab for an entity. this shows us the relation between the entities, and distributes it in the right layer - ui, services and infrastructure
  ![](/assets/img/observability/service-map.png)
- we can use "distributed traces" to view the path and various interactions between the different services
- there are "three views" which we can go to from both "all entities" or "apm and services" tab - list, navigator and lookout views
- my understanding - the apm and services tab is basically the "all entities" tab with the added filter of entity type being "Service - APM" or "Service - OpenTelemetry"
- "list view" - see all the entities in a tabular form and filter them
- "navigator view" - see the entities which are healthy vs have active alerts at a glance
- example of navigator view - the one in green has no alerts in progress, others do not have alerting setup
  ![](/assets/img/observability/navigator-view.png)
- "lookout view" - spot the unusual performance changes across entities at a glance. e.g. ones in purple have recent spikes, while ones in yellow have decreased usage. we can also enable the option of "size by volume" to look at the services with spikes by size
  ![](/assets/img/observability/lookout-view.png)
- we can define relationships between entities using "tags". then, when we enter a tag, say team=cloud, we will only see cloud related entities below
- a logical grouping of entities is called a "workload", and workloads have a "workload guid". we can add different entities and even dashboards to a workload, and then this workload itself becomes like an entity that we can query using the workload guid
- when adding entities to a workload, instead of adding every entity manually, we can instantiate a workload using a "query", e.g. we can tell that cloud workload will have all entities tagged using team=cloud. this means that whenever a new entity is tagged with team=cloud, it becomes a part of this workload automatically

## Performance Monitoring 

- "browser agents" - only a few lines of javascript code needs to be injected into our webapp to enable this
- the idea is to first to look at the "summary" tab of the browser tab, and eventually start drilling into specific tabs like "page views", "ajax", etc

![](/assets/img/observability/browser-tab.png)

- there are charts for the time taken, broken down into the time taken for the server to respond, the dom processing, the time taken for the app to render, etc
- the ajax response calls can show us the kind of api calls that are made, and how much time is spent on them
- a lot of these prebuilt charts also allow switching between mean, median, mode
- the "page view" tab can tell us the pages that were visited and for each of them, the different api calls that those pages made and the times they took
- tip - here, sort by "most time consuming" to understand which optimizing which pages is worth our time
- "session traces" - like a distributed traces but specific to browsers. it shows us times taken by dns lookups, times taken for each of the assets to load, time taken by the ajax calls, etc
- we can also see details like the systems the browser is being accessed from, the geography of the user, etc
- we can view errors grouped by error message and inspect the details
- we can also see the "session replay" of these errors that occur to inspect into the errors further
- again, there is a "summary" tab just like in case of browser, which can give us basic details about currently ongoing "issues", changes since "last deployment", "critical vulnerabilities" in our app, etc

![](/assets/img/observability/apm-&-services-tab.png)

- about issues - one or more "incidents" create an "issue"
- incidents are created when we set up "thresholds" using "alerts conditions"
- my understanding - we can label them as "high" or "critical"
- recall that host related metrics can contain data from both "new relic infrastructure agent" and "on host integration"
- we can jump to the metrics of a host from a particular service in the "apm & services" tab, or go to it from the "infrastructure" tab directly

![](/assets/img/observability/infrastructure-tab.png)

## Configuring Observability

- we can go to new relic -> integrations & agents tab from the left sidebar. it will show us how to perform the instrumentation for our particular use case. e.g. if i type nodejs and click on it, it shows me the various options like below, and i can chose any one of them to start instrumenting my nodejs applications
  ![](/assets/img/observability/configuring-observability.png)
- i chose "on a host", which would mean i would run `npm install newrelic` manually. then, the two options that need to be set are `NEW_RELIC_APP_NAME` and `NEW_RELIC_LICENSE_KEY`
- finally, we can run the server code using `node -r newrelic file_name.js`
- adding custom instrumentation will look like so - 
  ```js
  var newrelic = require('newrelic');

  newrelic.addCustomAttributes({
    'customer': order.deliverTo.name,
    'restaurant': order.restaurant.name,
    'itemCount': itemCount,
    'orderTotal': orderTotal
  });
  ```
- then, we can check if this is working using the following nrql -
  ```sql
  SELECT count(*) FROM Transaction FACET restaurant
  ```
- similarly, we can also add custom instrumentation to the browser code as follows - 
  ```js
  self.items.forEach(
    function(item) {
      newrelic.addPageAction('orderItem', { 
        restaurant: self.restaurant.name, 
        item: item.name,
        qty: item.qty
      });
    }
  );
  ```
- and then, query this as follows - 
  ```sql
  SELECT count(*) FROM PageAction FACET restaurant
  ```
- we can create "synthetic monitors" as [discussed here](#introduction). we need to provide locations to run these from, the frequency to run these monitors on, etc
- they can be as simple as "availability" (ping), or we can run complex logic using "scripted browser monitor". i think for scripted browser monitor, we need to provide a script that interfaces with "webdriverjs"
  ![](/assets/img/observability/synthetic-monitor-types.png)
- "apdex" - stands for "application performance index". it measures the satisfaction of users
- it is between 0 and 1. a score of 1 might actually mean our thresholds are too high, and we need to reduce them. a good apdex score is between 0.9-0.95
- let us say that the threshold is t. transactions <= t are satisfied, > 4t are frustrated and in between the two are tolerating
- so, apdex = ((satisfied requests) + (tolerating requests / 2)) / (total requests)
- we can set the value for the apdex threshold from inside "APM & Services" -> select the application -> "Application"
  ![](/assets/img/observability/apdex.png)
- my understanding - what if we get back a 500 response code very fast? is it considered "satisfied" by apdex, thus increasing our apdex and giving us a false sense of security? - no, apdex classes errors as frustrated as well

## OpenTelemetry

- opentelemetry is a vendor neutral data collection standard
- this allows us to instrument first and choose our "observability backend" later
- note - how new relic stores data from opentelemetry agents vs its proprietary agents is different. because of this, the underlying nrql queries used for the visualizations we see by default change as well
- "otel specification" - specification is a document that highlights how the core components should be developed. e.g. in case of otel, this helps us implement it across languages in a standardized manner
- "otel api" - used to for e.g. "generate melt data"
- "otel sdk" is the implementation of otel api. otel sdk helps us "configure otel" in our environment
- "otel collector" - how data is "received", "processed" and "exported" to the observability backend. we can have the "otel sdk" forward it to the observability backend directly, but this approach is not recommended at scale. using an otel collector also helps us configure retries, batching, encryption in the collector and avoid this overhead in the application itself
- "manual instrumentation" can be done by adding "custom attributes" to spans etc

## Infrastructure Monitoring

- recap of features - 
  - host resources and processes
  - log forwarding
  - cloud integration - for major cloud providers
  - on host integration - for docker, k8s, etc
- new relic has "guided installs" for most things. e.g. for say an ubuntu vm, we install the "new relic cli" and the "infrastructure agent"
- the new relic infrastructure agent can "auto discover" the applications and logs in our environment. e.g. my vm had the apache web server configured, and new relic could automatically detected this. it was visible under the "third part services" tab - 
  ![](/assets/img/observability/third-party-services.png)
- for kubernetes, there is a new relic helm chart which we can to install in our clusters in order to monitor all the applications etc in it
- apparently, new relic can also correlate the "apm transactions" of the applications present in the kubernetes cluster. i can see the different deployments here under the "apm & services" tab

## Alerts

- "alert policy" - organize "alert conditions", and define "issue" preferences, e.g. enable or disable issue correlation
- "alert conditions" - watch a "data source", and create "incidents" when the behavior of the data source crosses a "threshold"
- "incidents" - created when "alert condition" "thresholds" are breached. they contain the individual state, and are grouped into "issues"
- "issues" - group of one or more "incidents". they determine when users are "notified"
- "decisions" - correlate "issues" using intelligence. this helps reduce noise
- "workflows" - help with "notifications". they map "issues" to "destinations". they also control what data gets sent in this notification etc
- "destination" - communication channels

![](/assets/img/observability/alert-architecture.png)

### Creating Alert Condition

- i selected the "guided install" option when creating an "alert condition"
- first, we need to select what to monitor. here, we choose one of "services - apm", "hosts", etc
  ![](/assets/img/observability/alert-condition-create-step-i.png)
- then, we select the particular entity / entities to monitor
- then, we select the metric to monitor - cpu percent, throughput, error rate, etc
  ![](/assets/img/observability/alert-condition-create-step-ii.png)
- now, we "fine tune the signal" using the inputs described below
  ![](/assets/img/observability/fine-tune-the-signal.png)
- "window duration" - configure based on frequency of data. e.g. 1 minute for page views, 1 hour for hourly signals
- we can configure it to use "sliding window aggregation". it helps smoothen out graphs with a lot of spikes. the idea is we increase the window duration, but to avoid delays, we keep a small sliding window. e.g. "timeseries 1 minute" becomes "timeseries 5 minutes slide by 1 minute"
  ![](/assets/img/observability/without-sliding.webp)
  ![](/assets/img/observability/with-sliding.webp)
- then, we choose the "streaming method"
  - use "event flow" for steady and frequent signals, having one or more data points per aggregation window
  - use "event timer" for sparse, inconsistent signals, having one or fewer data points per aggregation window
- then, there is a "delay" that we configure. i think this is basically like the watermark feature of spark
- after the above, we "set the alert condition thresholds"
  ![](/assets/img/observability/alert-condition-threshold.png)
- we can choose "static" or "anomaly" for our alert condition threshold
- using static, we can say that use a severity level of "warning" if our query returns a value of 2 in at least 5 minutes, and use a severity level of "critical" if our query returns a value of 5 in at least 10 minutes
- however, when we use anomaly, this is my understanding of what happens - we say that we would like to create incidents when the value goes above or below the "baseline" prediction. the baseline will adjust based on patterns dynamically, and we configure how much deviation from this baseline we can tolerate
- finally, we connect this alert condition to an "alert policy", give it a name, description, etc and hit save
- this creates an alert condition for us

### Creating Alert Policy

- recall that "alert policy" determines how to group "incidents" into an "issue"
- so, we can choose from the following three options when creating an alert policy
- "one issue per policy" - group all incidents for this policy into one open issue at a time
- "one issue per condition" - group incidents from each condition into a separate issue
- "one issue per condition and signal" - group incidents sharing the same condition and signal into an issue

### Workflows and Destinations

- creating a destination is easy - 
