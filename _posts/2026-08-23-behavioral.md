---
title: Behavioral
---

## Introduction

- "authenticity" - content should be true, delivery can be rehearsed
- if you feel you are sounding rehearsed, just point it mid answer - "i prepared for this interview because it is important to me. you can count on my answers being genuine"
- do research about the company beforehand - mission statement, recent news (e.g. product launches), etc
- "star" - structured way of responding to questions
- always use "i" and not "we"
- "situation" - describe the specific circumstances
- "task" - your responsibilities in that situation
- "action" - describe what you did and your contributions
- "result" - describe the outcome. do not be modest. even when things are negative, good things can come from them
- do not include irrelevant details, interviewers loose their interest
- do not talk using "always" or "never" -
  - ~i am always on time~ - i prefer being on time when possible
- do not hesitate on seeing "proudest", "worst", "best", "fastest". if the situation is not the biggest, say something like "this failure was not the biggest in terms of the business impact, but it was significant for me as it revealed a blind spot"

## Example 1 - Tell me about a time when you had to give someone difficult feedback

- "situation" - i was leading the a2q project. i assigned a junior teammate on handling its alerting logic. issues -
  - it was not reusable as it was created directly using the ui
  - the alerts were not firing timely
- "task" - had to get the project over the line and at the same time, help him learn and get something out of it. it was his probation period's project
- "action" -
  - i sat down with him and wrote the cdd for the alerts
  - terraform with config driven yaml based configuration for reusability - people provide slack chanel webhook, thresholds, etc in the yaml and the alert resources are automatically created from it
  - use a hybrid approach for static vs anomaly based alerts
  - analyze previous data for setting max and min based static alerts
  - use anomaly alerts which uses standard deviation like techniques underneath
- "result" -
  - important - he went on to build the alerts for all the features independently, after a solid framework was in place
  - we had live alerting across 50+ new relic features
- alternative questions -
  - have you ever been on a team where someone was not doing their part

## Example 2 - Give me an example of a time you did something wrong

- "situation" - i was running a cost saving initiative on snowflake
- "task" - auditing and shutting down unused warehouses / consolidating warehouses
- "action" -
  - i shut down a warehouse which was being used by a scheduled task
  - the queries for the warehouse were not showing up in the query history
  - the table stopped getting data actively, flagged 2 to 3 days later
  - i communicated the issue to all downstream teams by tracking using an incident
  - i first fixed the downstream data by replaying the data
  - recall the flow - kafka -> kafka connect -> sf raw table -> sf merge task -> sf clean table
  - i changed the dates in the task definition of the incremental load to replay the data for the last 3 days. normally it would only read and merge the data for the last one hour
  - i also had to scale up the warehouse for this backfill, and then scale it back down
- "result" -
  - i ensured that the auto resume flag is enabled on all the warehouses - it was off for this warehouse
  - i documented all the warehouses and where they are being used. this documentation is meant to be actively maintained going forward
  - added freshness and volume checks to all the tables to ensure that issues are caught much earlier
- alternative questions -
  - describe a time when your work was criticized, how you responded, and what happened as a result
  - the most difficult period of your life - how it got escalated, we had multiple review sessions afterwards, efforts to replay the data and correct the invoices that were generated, etc

## Example 3 - What was the last project you led, and what was its outcome?

- "situation" - migrating off of dbt cloud and snowflake to spark, iceberg, dbt core and airflow
- "task" - maintain feature parity with the existing workflow, enhance developer productivity, etc
- "action" -
  - leading a team of 3 members, breaking down tasks and assigning them
  - back and forth with downstream teams, as there were changes to their workflow - e.g. ci cd etc
- "action" (technical) -
  - resolved blockers by making the thrift server work using kubeflow by introducing a custom wrapper
  - add custom observability on top by using hooks for every query plan, execution details, etc
  - matching performance - while exact performance cannot be matched, we can get it close
    - not in was using broadcast joins which was causing out of memory errors, so switch to anti join
    - large shuffles were causing gc spikes, so tuned the jvm gc to reclaim memory proactively - lowered value of `InitiatingHeapOccupancyPercent` to clean up earlier, so that we hit a major gc less
    - mention how query accelerators like velox were added (details in [spark-advanced](/posts/spark-advanced/))
  - resolved risks by introducing a custom authentication layer for the thrift server
  - ran performance testing using tpch benchmark which involved 22 e-commerce queries
  - added a custom ci cd workflow as zero copy cloning is not supported. uses slim ci, defer logic, build the new tables inside pr specific databases, etc
- "result" -
  - projected to save $1M+ costs in compute and licensing
  - right now in staging, hard cut over to production in the next few months
- common question - how did you do the migration
  - run pipelines in parallel with a cut over date
  - some checks - 
    - row counts
    - row level diff - e.g. full outer join using primary key
    - then, run them in an automated manner e.g. using dbt tests etc
- alternate questions -
  - give me an example of a time that you felt you went above and beyond at work - highlight performance testing, observability to display query history in nr like snowflake, custom authentication layer, etc
  - what assignment was too difficult for you, and how did you resolve the issue? - highlight how i broke it into smaller parts - separating compute, storage, ci cd, authentication, performance, etc and delivering the features iteratively
  - give an example of an idea you implemented - describe this project
  - tell me about your proudest achievement - describe this project. mention how my name was highlighted in the ahm as a result
  - a project which required you to dive deep - can mention multiple portions like zero coy vs branching, performance testing pointers specially, nessie, etc. we can also mention the short term and long term fixes related portions here

## Example 4 - Give me an example of a difficult decision you had to make

- "situation" - mid migration, downstream team wanted nessie instead of glue for iceberg catalog
  - catalog wide branching
  - multi table atomic commits, thus avoid seeing partially updated tables
  - tagging instead of tracking unreadable commit shas
- "task" -
  - switching to nessie for bronze / silver layer meant a lot of rework
  - not using nessie meant missing out on the additional features
- "action" -
  - i weighed the tradeoffs and kept a split
  - keep bronze and silver on glue
  - move only the gold layer to nessie
  - the additional features nessie provides are not even relevant for ingestion workflows
  - some experimentation to come up with the configuration for the spark thrift server to read from glue and write to nessie
- "result" - successfully reading from glue and writing to nessie
- alternate questions -
  - tell me about a time when you had to deal with conflict on the job

## Example 5 - Tell me about a time when deadlines forced you into a short-term solution

- "situation" - 
  - i was maintaining a kafka connect iceberg ingestion billing pipeline
  - teams would end up pushing malformed records to the pipeline - string for amounts instead of floating points
  - these errors would end up halting the entire pipeline "for hours"
  - this would then breach our sla of 10 minutes
  - then as the lag grew, we would have to upscale our compute to fix the errors, then downscale it
- "tasks" / "action" -
  - short term -
    - i was the first person to face this error
    - so, i created a runbook for the same
    - step 1 - stop the kafka connect cluster
    - step 2 - change the kafka connect consumer offsets manually
    - step 3 - start and scale up the kafka connect to reduce the lag
    - step 4 - downscale the kafka connect cluster once the lag goes away
    - step 5 - would involve replays of older data for downstream teams
  - longer term - added alerts on the error log
    - tweaked logging configuration to log bad records with their errors
    - set up an alert on that log
    - the log would not tell the exact record etc, but it would have a specific exception class
    - this way, errors could be caught earlier instead of downstream notifying us hours later
    - initially, fixing the lag later is much more cumbersome and expensive, due to upscaling, lags, etc
  - longer term - skip the malformed record entirely instead of halting the pipeline
    - kafka connect supports error tolerance parameter
    - however, iceberg had not added the support for it
    - so, i extended the iceberg sink connector - caught the failure per record, logged it and then skipped it
    - this involved building my own classes on top of the iceberg library, creating my own jar and docker image, etc
    - gap - still, the rejected data was lost in logs itself
  - longest term - move it to a dlq and the dlt
    - rejected records go to a dead letter queue and from there a dead letter table with the error reason and metadata
    - this helped downstream teams look at the exact records and errors and reprocess the data accordingly
    - i also added alerts on dlq depth
- "result" -
  - short term - met the deadline for the time being, made on call support much easier
  - long term - ensured no data loss
- lps covered - deliver results, bias for action, insist on highest standards, ownership
- alternative questions -
  - tell me about a time you traded off speed vs quality
  - tell me about a time you took a calculated risk under a deadline
- follow ups -
  - why was the short term fix safe? needed for on call, because otherwise replays etc lot of rework
  - why not build the dlq first? understanding, debugging, reproducing the issue locally took 1 sprint. then, building the custom image etc required security review etc
  - how did you make sure the long term fix happened? communicated to stakeholder the importance of the same

## Example 6 - Tell me about a time you directly interacted with the stakeholder of your project

- "situation" -
  - old system - do the entire wallcross process (reaching out investors with deals) and then track them later on in the system manually
  - issue - compliance faced friction with audits - manual process is error prone etc
  - the core "intelligent execution" platform was becoming a monolith, so this piece had to be developed individually to avoid bloat. multiple such applications like roadshows were coming up, and they needed to be developed separately to help scale
- "task" / "action" -
  - partner with stakeholders to validate the entire workflows, state transitions, etc
  - again - partner with stakeholders on the complex ui / ux requirements
  - went ahead myself to suggest components like timeline charts, rich text editors, etc
  - build it as a decoupled microservice / microfrontend
  - spring boot for the backend - using strangler fig pattern, where the traffic for the new service went to this separately deployed backend, while the remaining traffic continued to go to intelligent execution
  - similarly for frontend, explain how using webpack module federation, it is an independently deployed application, mounted as a component, while intelligent execution acts as a container application
  - define the schemas and tables - versioning, tombstone records, etc
  - define the state machine for the investors statuses - wallcross initiated, compliance met, etc
  - migrate legacy data to display old wallcross data into new system - built a cron job driven backfill / forward fill to bring old manually tracked wallcrosses into the new ui
  - developed an email notification microservice for handling templating, multithreading, added object storage support for uploading and sending out attachments, etc
  - introduced e2e testing from scratch using cypress and best practices like page object model (pom), etc, as the inhouse platform was reaching eol
- "result" -
  - replaced old error prone manual tracking with an automated state machine driven workflow
  - eliminated release bottlenecks by separating out into different microservices and microfrontends

## Example 7 - Describe a mentor who has impacted you in a positive way

- yogesh patki - a colleague from goldman sachs
- no ego and always makes time - my go to person for big calls in life
- instance 1 (technical) - i was stuck introducing observability using opentelemetry on goldman's on prem systems, as i was unfamiliar with their custom scripts
- he did not just hand me the answer, but pointed me to the right documentation
- lesson - i used a similar approach when leading a2q compute project and helping a junior teammate for alerting setup
- instance 2 (career) - i had multiple offers during my first switch, including companies offering a higher salary
- talking it through with him helped me get clarity and i picked new relic anyway as it meant working on the data platform itself, a new domain versus more full-stack work i had already done earlier
- lesson - optimizing for growth over pure compensation
- because of how available he always was for every one, i try to be that person for others now
- alternate questions -
  - was there a person in your career who really made a difference

## Hypothetical Questions

- within a 5-minute span, a vp, your manager, and a customer come to you for something urgent. how do you prioritize?
  - ask for more information to make an informed decision on what to prioritize
  - communicate it to others on how and when they plan to address their needs
- if your manager asked you to do something you disagreed with -
  - use respectful push back. ask for the reasoning and impact. do not just comply or refuse outright
- your team is giving a presentation in two hours and one member just called in sick
  - what part did they own? can it be redistributed / cut, or can one person cover it. communicate status to stakeholders
- choose between a work environment always has chaos and one where nothing ever changed
  - pick chaos - shows adaptability, but i would push to bring some structure to it
- if you inherited so much money that you never had to work again, how would you spend your time?
  - building / learning / mentoring what i love and not sit idle
- if you could create a fictional company to make the world a better place, what would that company do?
  - ed tech that has personalized learning using ai
- you are the product manager for a consumer device that just launched, but 20% of the devices are breaking
  - communicate to leadership and customers
  - pause shipping new features
  - diagnose the root cause
  - fix the issues by performing rollback etc
  - put the necessary checks and tests in place
- how do you handle working with people who annoy you?
  - not letting it affect my output or professionalism
  - address it directly using facts and not emotionally

## Why are you Looking for a Change

- i want to tackle more - 
  - scale
  - challenges
  - scope
  - impact
  - ownership
- looking for a place with -
  - focus on speed and quality both
  - customer obsession
  - strong bias for action
  - collaborative environment
- then, add a few lines from the job description, the company, etc

## How do you Incorporate tools like Claude in Daily Workflow

- "situation" - i was building a registry for public mcp tools
- "task" - have validations like tool should be tagged as public, present in mcp server, should have associated jira tickets, etc
- "action" -
  - initially i asked ai to write the validations, it wrote slop, tightly coupled code in 2-3 files
  - i scrapped it and wrote a plan first
  - an mcp server object, tools attribute, config file path, etc
  - have caching / lazy computation to avoid repeated network calls, use asynchronous logic
  - chain of responsibility pattern for running the different validations
  - strategy design pattern for running the different validations
  - then, the refactored code was much more extensible and maintainable
  - introduced multithreading to populate different mcp objects in parallel
- "result" -
  - shipped a highly extensible validation framework
  - core realization - "plan before you do" - ai is good at generating code but we should be the architect

## Questions to Ask at the End

- what are the greenfield projects coming up? what is the charter for the next few months?
- what would i own end to end? what does success look like for me as an individual?
- who would i report to? team / organization structure?

## What is the Scale of Data you Work With?

- ~500 TB of table size (usage_compute production) if asked about the scale of tables you manage
- ~60 GBPS of throughput of incoming data if asked about amount of throughput

## Amazon Leadership Principles

- "customer obsession" - start with the customers and move backwards
- "ownership" - act on behalf of the entire company beyond your own team. never say "thats not my job"
- "invent and simplify" - look externally for new ideas, invent and simplify
- "are right, a lot" - strong judgement and good instincts
- "learn and be curious" - always looking to learn and improve
- "hire and develop the best" - raise the bar with every hire and promotion
- "insist on the highest standard" - unreasonably high standards for high quality products, services, and processes
- "think big" - think bold, not small
- "bias for action" - speed matters. most decisions are reversible. have risk taking ability
- "frugality" - accomplish more with less. resourcefulness, self sufficiency, etc
- "earn trust" - speak candidly, be vocally self critical even if its embarrassing, treat everyone respectfully
- "dive deep" - leaders operate at all levels
- "have backbone; disagree and commit" - respectfully challenge decisions
- "deliver results" - deliver results with quality and timely, despite setbacks
- "strive to be earth's best employer" - create fun, inclusive, growth environment for others
- "success and scale bring broad responsibility" - as amazon is very big, be humble and thoughtful of the secondary effects of actions
