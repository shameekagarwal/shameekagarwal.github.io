---
title: Spark Advanced
---

## Stream Processing Motivation

- popular spark cloud platform - databricks
- popular spark on prem platform - cloudera
- setup for databricks and local is already covered [here](/posts/spark)
- when our iterations are done on a weekly, daily or even an hourly basis, we are fine with using **batch processing**
- issue 1 - **backpressure problem**
  - it means data is coming at a faster rate than we can process it
  - if we use batch processing, we need to do the following every time within the small window
    - starting of the on demand cluster / resources
    - processing the entire volume of data every time
    - cleanup of the resources
- issue 2 - **scheduling**
  - with batch processing, we can set a schedule / cron
  - but that will not work if we want to process data in realtime
- issue 3 - **incremental data processing**
  - we should process only the new data
  - we can achieve this using **checkpoints**
  - we will know using previous checkpoint what we have already processed and what we are yet to process
- issue 4 - **handling failures**
  - what if during the processing, there is a failure?
  - this is why we only commit our checkpoint after the entire processing is complete
  - so, we read the previous checkpoint, perform the processing and if successful, commit the current checkpoint
  - small issue here as well - we have two different transactions - committing of checkpoint and processing of data
  - so, it can happen that processing of data is successful, while the committing of checkpoint fails
- issue 5 - **late events**
  - e.g. we have 15 minute windows to display the stock prices
  - we show the output according to the data we have at 10am
  - then, when processing the data for 10.15am, we receive an event for 9.58am as well
  - this means our previously computed result for 10am needs to be updated as well
- **spark streaming** can address all these 5 issues for us

## Stream Processing Databricks Example

- initial cleanup cell - delete table, cleanup checkpoint directory, cleanup and recreate the text directory
  ```py
  spark.sql('drop table if exists word_counts')
  
  dbutils.fs.rm(f'dbfs:/FileStore/learning/chekpoint', True)
  
  dbutils.fs.rm(f'dbfs:/FileStore/learning/text', True)
  dbutils.fs.mkdirs(f'dbfs:/FileStore/learning/text')
  ```
- processing logic - 
  ```py
  from pyspark.sql.functions import *

  lines = (
    spark.readStream
    .format('text')
    .load('dbfs:/FileStore/learning/text')
  )
  
  words = (
    lines
    .select(explode(split('value', '[ ,]')).alias('word'))  # slit by ' ' and ','
    .select(lower('word').alias('word'))  # lowercase the words
    .where(regexp_like('word', lit('\\w')))  # discard special characters etc
  )
  
  word_counts = (
    words
    .groupBy('word')
    .count()
  )
  
  query = (
    word_counts.writeStream
    .option('checkpointLocation', 'dbfs:/FileStore/learning/chekpoint')
    .outputMode('complete')
    .toTable('word_count')
  )
  ```
- some minor api changes for stream and batch processing - 
  - `spark.read` to `spark.readStream`
  - `spark.write` to `spark.writeStream`
  - `saveAsTable` to `toTable`
  - `mode('overwrite')` to `outputMode('complete')`
- notice how the code for processing however still stays the same like batch processing
- TODO - apparently, writing stream only works in databricks, not in local. my understanding, to validate - 
  - `.format('delta')` is used by default in databricks
  - `.format('parquet')` is used in local
  - so, local throws this error - `Data source parquet does not support Complete output mode.`
- note, my understanding - since this was text, we were good. but if it was for e.g. json, we would have to specify the schema upfront. also, remember that we cannot rely on `inferSchema` or something, now that this is a streaming source and we might not have any readily available data
- copying files slowly to the target location to simulate streaming data - 
  ```py
  import time
  
  for i in range(1, 4):
    time.sleep(10)
    print(f'processing {i}th iteration')
    dbutils.fs.cp(f'dbfs:/FileStore/learning/text_data_{i}.txt', f'dbfs:/FileStore/learning/text')
  ```
- stopping the query - 
  ```py
  query.stop()
  ```

## Stream Processing Model

- spark will start a **background thread** called **streaming query**
- the streaming query will start monitoring the **streaming source** - text directory in our case
- the streaming query will also initialize the **checkpoint** location
- each execution of the streaming plan is called a **micro batch**
- micro batch is basically responsible for the small piece of data in the stream
- a micro batch is triggered every time a new file is added to the text directory
- our data is processed and written to the **streaming sink**
- finally, the streaming query will commit to the checkpoint location
- recall how all the [issues](#stream-processing-motivation) we discussed - scheduling, incremental data processing, handling checkpoints, are all being done by the streaming query

## Reading / Writing

- sources supported -  
  - file / directory
  - delta table
  - kafka
- sinks supported - 
  - file / directory
  - delta table (what we used in the [databricks example](#stream-processing-databricks-example) above)
  - kafka
  - for each - useful if an external connector is not available
- other external connectors are available for both source and sinks, but we need to configure them separately and they are not shipped with spark by itself
- we saw how streaming query triggers the micro batches for our processing flow using checkpoints
- we have three options for **triggers** types
  - **unspecified** (the default) - trigger the next micro batch once the previous micro batch execution is over
  - **fixed interval / processing time** - trigger the next micro batch once the specified interval is over
    - if previous micro batch takes less time than the interval, wait till the interval is over
    - if previous micro batch takes more time than the interval, kick off the next micro batch immediately
  - **available now** - one micro batch to process all the available data, and then stop on its own
    - analogy - it is like batch processing but with only incremental data processing unlike the traditional batch processing jobs

  ```py
  query = (
    word_counts.writeStream
    .option('checkpointLocation', 'checkpoint')
    .outputMode('update')
    .trigger(availableNow=True)
    .toTable('word_count')
  )
  ```
- miscellaneous option - **max files per trigger** - helps keep micro batches small in case a lot of files get queued up, and thus produce outputs faster
  ```py
  word_counts.writeStream
    .option('maxFilesPerTrigger', 3)
  # ...
  ```
- so, if we have max files per trigger set to 1, available now set to true and we have 10 files in the queue, our job stops after 10 micro batches are processed successfully
- files that have been read can be deleted by setting the **clean source** property to **delete**. we can also archive it, but we would need to specify the archive location as well using **source archive dir**
  ```py
  spark.readStream
    .format('text')
    .option('cleanSource', 'archive')
    .option('sourceArchiveDir', 'dbfs:/FileStore/learning/invoices_archive')
  # ...
  ```
- recall what [**streaming query**](#stream-processing-model) is. identifying what streaming query belongs to what job can be difficult. e.g. now, we can have a streaming query for gold layer, a streaming query for silver layer and so on. we can therefore name it in the ui as follows - 
  ```py
  word_counts.writeStream
    .queryName('bronze-layer')
  # ...
  ```
- reading from a table - e.g. bronze layer reads from the sources using the right delimiter etc and writes it to tables. now, the silver layer can read from these tables as follows - 
  ```py
  spark.readStream
    .table('bronze-table')
  ```

## Working with Kafka

- for databricks, in the **libraries** tab of the **compute**, we can add new libraries
- based on the [documentation](https://spark.apache.org/docs/latest/structured-streaming-kafka-integration.html) for integrating with kafka, and the version of spark cluster of my compute, i added `org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0`
  ![kafka installation](/assets/img/spark/kafka-installation.png)
- to do the same thing via spark conf, if for e.g. running locally - 
  ```py
  conf = SparkConf()
  conf.set('spark.jars.packages', 'org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1')

  spark = (
    SparkSession.builder
    .appName('kafka consumer')
    .master('local[*]')
    .config(conf=conf)
    .getOrCreate()
  )
  ```
- because my kafka had ssl, i had to use **key tool** to create a **trust store** with the certificate as input
- step 1 - copying the certificate to the cluster - 
  ```py
  %%sh
  
  cat << 'EOF' > kafka_ca.pem
  -----BEGIN CERTIFICATE-----
  <<cert contents>>
  -----END CERTIFICATE-----
  EOF
  ```
- step 2 - generating the trust store -
  ```py
  %%sh
  
  keytool -import -storepass spark_streaming -noprompt -file kafka_ca.pem -alias CA -keystore client.truststore.jks
  ```
- finally, using it via the trust store -
  ```py

  jaas_config = (
    "org.apache.kafka.common.security.scram.ScramLoginModule required "
    + f'username="{kafka_connect_opt["user"]}" password="{kafka_connect_opt["password"]}";'
  )
  
  df = (
    spark.readStream.format("kafka")
    .option("kafka.bootstrap.servers", kafka_connect_opt["bootstrap_server"])
    .option("kafka.security.protocol", "SASL_SSL")
    .option("kafka.sasl.mechanism", "SCRAM-SHA-256")
    .option("kafka.sasl.jaas.config", jaas_config)
    .option("subscribe", "invoices")
    .option("kafka.ssl.truststore.type", "jks")
    .option("kafka.ssl.endpoint.identification.algorithm", "")
    .option("kafka.ssl.truststore.location", "client.truststore.jks")
    .option("kafka.ssl.truststore.password", "spark_streaming")
    .load()
  )
  
  display(df)
  ```
- spark will process data using micro batches. some micro batches can be huge, others very small. so, just like we saw the option **max files per trigger** in [reading / writing](#reading--writing), to stay in control over the records being processed, we can use **max offsets per trigger**
  ```py
  .option("maxOffsetsPerTrigger", 10)
  ```
- we might also want to specify the starting timestamp when our job starts. we can do that via **starting timestamp**. below will start pretty much from the beginning - 
  ```py
  .option("startingTimestamp", 0)
  ```
- issues when restarting / creating newer versions of spark streaming jobs - 
  - case 1 - we use checkpoint directory. our spark streaming job continues from where it had left off
  - case 2 - we had an issue in our previous code. we merge the fix and deploy our job again. we rely on **starting timestamp** and an empty checkpoint directory this time around to be able to reprocess events since the faulty deployment was made
- so, we need to implement **idempotence** in our sink

## Spark Cluster on Kubernetes

- install spark - `helm install spark bitnami/spark`
- modify the number of workers - `helm upgrade spark bitnami/spark --set worker.replicaCount=4`
- access the ui - `kubectl port-forward --namespace default svc/spark-master-svc 30080:80`
- submitting the example application - 
  ```
  spark-submit \
    --master spark://spark-master-svc:7077 \
    --class org.apache.spark.examples.SparkPi \
    /opt/bitnami/spark/examples/jars/spark-examples_2.12-3.5.3.jar 5
  ```
- my understanding - this approach is spark standalone cluster, i.e. pods for workers and master are there. it is not the same, or maybe as preferred as the [kubernetes operator](#kubernetes-operator) approach

## Spark Kubernetes Operator

- we can use spark-submit command directly, which uses the spark native k8s scheduler
- however, a special kubernetes operator for spark is there
- google introduced the "spark operator", which was later migrated to kubeflow
- so, we write spark applications in the form of yaml using crd (custom resource definition)
- we do not need to use spark submit now - it runs bts when we create the `SparkApplication` resource using the crd
- allows exposing application, driver and executor metrics to prometheus
- restart, retries, backoff etc supported
- note - apparently, `SparkScheduledApplication` is supported as well, wherein we can specify a cron etc. however, i would probably rather use airflow

### Architecture

- the operator has four parts - controller, submission runner, pod monitor, mutating admission webhook
- "controller" - 
  - like api server of k8s i.e. both clients and the different internal components interact with it
  - receives the creation, deletion etc events for "spark application"
  - sends spark applications to "submission runner" with the arguments
  - receives health of driver and executor pods from "pod monitor" and accordingly updates the status of the "spark application"
- "submission runner" - talks to k8s to spin up the driver pod, and then executor pods are spun up by the driver pod
- "pod monitor" - watch status of the driver and executor pods, and send updates to the controller
- "mutating admission webhook" - use annotations to -
  - mount volume(s) on the driver / executor pods
  - control pod affinity etc - e.g. schedule driver on on demand instances, executor on scheduled instances
- we can use "sparkctl" instead of kubectl for more functionality as well

### Getting Started

- adding the helm repository and installing the chart -
  ```
  helm repo add spark-operator https://kubeflow.github.io/spark-operator

  helm repo update

  helm install spark-operator spark-operator/spark-operator \
    --namespace=spark-operator \
    --create-namespace
  ```
- includes things like setting up service account called `spark-operator-spark` with rbac so that driver can spawn executors etc
- now we can run `kubectl get sparkapplications`
- use the value `sparkJobNamespaces` to decide which namespace the spark jobs run inside. based on this value, resources like the service account mentioned above would be created
- we can run the operator in high availability mode i.e. multiple replicas of the operator. there is "leader election" in play in this case, and a lock resource needs is maintained in this case
- we can run multiple instances of the operator itself as well. we just need to ensure that they watch different namespaces, specified using `sparkJobNamespaces`
  - my understanding - this is not the same as multiple replicas, this is entirely different instances

### Spark Application Configurations

- a yaml definition - create using kubectl / sparkctl
- type - scala, python, etc
- deployment mode - cluster or client. we should be using cluster only, i think client is not supported yet
- the same image gets used by the driver and executor pods, since we do not have to code them separately as developers
- a very basic example - 
  ```yml
  apiVersion: sparkoperator.k8s.io/v1beta2
  kind: SparkApplication
  metadata:
    name: spark-pi
    namespace: default
  spec:
    type: Scala
    mode: cluster
    image: spark:3.5.1
    mainClass: org.apache.spark.examples.SparkPi
    mainApplicationFile: local:///opt/spark/examples/jars/spark-examples_2.12-3.5.1.jar
  ```
- we can specify a separate init container image, otherwise the same image gets used for init container as well
- spark-submit supports `--jars` and `--files` command for external dependencies and data files. we can use `spec.deps.jars` and `spec.deps.files` for the same here
- we can do things like download from hdfs, s3, specify maven coordinates, etc for these jars
  ```yml
  spec:
    deps:
      jars:
        - local:///opt/spark-jars/gcs-connector.jar
      files:
        - gs://spark-data/data-file-1.txt
        - gs://spark-data/data-file-2.txt
  ```
- we can also specify `.spec.deps.pyFiles`, which translates to `--py-files` of spark-submit
- we can set either specify individual spark configuration under `spec.sparkConf` in a key value format, or specify `spec.sparkConfigMap`, which mounts the config map storing spark-defaults.conf, spark-env.sh, log4j.properties at /etc/spark/conf, and also sets `SPARK_CONF_DIR` to the same
  - note, my understanding - prefer using `spec.executor.javaOptions` and `spec.driver.javaOptions` in the crd directly over specifying `spark.driver.extraJavaOptions` and `spark.executor.extraJavaOptions` here
- the same thing applies to `spec.hadoopConf` and `spec.hadoopConfigMap`
- use `spec.driver` - 
  - resources - memory and cpu
  - labels, annotations
  - environment variables - use `env` or `envFrom` for config maps / secrets
  - to set a custom pod name
  - a service account with the right permissions to generate executors
  - a driver specific image. it overrides the one specified inside `spec.image`
  - mount secrets. additionally, we can specify a type, e.g. if we specify type as `GCPServiceAccount`, it would set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` for us automatically
  - mount config maps
  - set the affinity and toleration. my understanding of what this translates to - allows us to think about things like cost savings, by scheduling drivers on on demand instances and executors on spot instances
  - set volumes for scratch space. my understanding of what this translates to - during shuffle etc, spark can store to disk. the pod storage might not be enough for this, and so we need volumes. to validate - additionally, maybe if an executor has to be restarted, the new executor can reuse this data?
- `spec.executor` is be pretty similar. but additionally, it allows specifying number of executor instances via `spec.executor.instances`, which defaults to 1
- optionally, dynamic allocation is supported as well, which can be configured using `dynamicAllocation`
- status of "spark application" = 
  - "failed" if status of driver pod has status failed
  - "completed" if status of driver pod has status completed
  - "failed_submission" if somewhere around "submission runner" there is a failure
- restart policies - never, always or on_failure. also notice how we can configure backoff etc for the restarts
  ```yml
  restartPolicy:
     type: OnFailure
     onFailureRetries: 3
     onFailureRetryInterval: 10
     onSubmissionFailureRetries: 5
     onSubmissionFailureRetryInterval: 20
  ```
