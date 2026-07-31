---
title: Behavioral
---

## Introduction

- "authenticity" - content should be true, delivery can be rehearsed
- if you feel you are sounding rehearsed, just point it mid answer - "i prepared for this interview because it is important to me. you can count on my answers being genuine"
- do research about the company beforehand - mission statement, recent news (e.g. product launches), etc
- for google -
  - focus on the user, and everything else follows — a2q alerting / dbt cloud migration
  - great just isn't good enough — good for growth mindset
  - fast is better than slow — performance work on spark
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
  - resolved risks by introducing a custom authentication layer for the thrift server
  - ran performance testing using tpch benchmark which involved 22 e-commerce queries
  - added a custom ci cd workflow as zero copy cloning is not supported. uses slim ci, defer logic, build the new tables inside pr specific databases, etc
- "result" -
  - projected to save $1M+ costs in compute and licensing
  - right now in staging, hard cut over to production in the next few months
- alternate questions -
  - give me an example of a time that you felt you went above and beyond at work - highlight performance testing, observability to display query history in nr like snowflake, custom authentication layer, etc
  - what assignment was too difficult for you, and how did you resolve the issue? - highlight how i broke it into smaller parts - separating compute, storage, ci cd, authentication, performance, etc and delivering the features iteratively
  - give an example of an idea you implemented - describe this project
  - tell me about your proudest achievement - describe this project. mention how my name was highlighted in the ahm as a result

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

## Example 5 - Describe a mentor who has impacted you in a positive way

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
