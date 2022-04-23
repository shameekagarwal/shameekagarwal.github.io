---
title: Spring Actuator
tags: ["java", "spring"]
---

In this blog, I would cover my understanding of Spring Actuator.

# About

- actuator helps us in monitoring and managing our applications through http endpoints
- it can integrate with many other monitoring systems like cloudwatch, datadog, prometheus, etc. by using micrometer which is vendor neutral
- we can see all available endpoints [here](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.endpoints)

# Adding Actuator in Spring Boot

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

# Exposing and Enabling Endpoints

- by default, all endpoints are enabled but not exposed, only the health endpoint is exposed
- for better control, we can simply expose all endpoints and enable them selectively - 
  ```properties
  management.endpoints.web.exposure.include=*
  management.endpoints.enabled-by-default=false

  management.endpoint.health.enabled=true
  management.endpoint.info.enabled=true
  management.endpoint.metrics.enabled=true
  ```

# Health Endpoint

- we can see the health at /actuator/health
- it would return `{ status: "UP" }` if it works fine
- add property `management.endpoint.health.show-details=ALWAYS`, [docs](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.endpoints.health) to show more details
- we can also add health checks to show up when we hit the health endpoint
  ```java
  @Component
  public class DBHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
      if (isDBConnectionHealthy()) {
        return Health.up().withDetail("postgres", "running").build();
      } else {
        return Health.down().withDetail("postgres", "down").build();
      }
    }

    private boolean isDBConnectionHealthy() {
      System.out.println("connection to postgres is up and running...");
      return true;
    }

  }
  ```
  this would show up under the /actuator/health as -
  ```json
  "DB": {
            "status": "UP",
            "details": {
                "postgres": "running"
            }
        }
  ```

# Info Endpoint

### Build Information

- we can see arbitrary information about the app at /actuator/info
- inside pom.xml inside `spring-boot-maven-plugin`, add below - 
  ```xml
  <executions>
    <execution>
      <goals>
        <goal>build-info</goal>
      </goals>
    </execution>
  </executions>
  ```
- this gives build time, version, maven coordinates of the project, etc
- it generates a file at target/classes/META-INF/build-info.properties

### Git Information

- add the plugin below - 
  ```xml
  <plugin>
    <groupId>pl.project13.maven</groupId>
    <artifactId>git-commit-id-plugin</artifactId>
  </plugin>
  ```
- to enable all git related information like branches, last commit, etc., [add below](https://docs.spring.io/spring-boot/docs/2.6.6/reference/html/actuator.html#actuator.endpoints.info.git-commit-information)
  ```properties
  management.info.git.mode=full
  ```
- it generates a file at target/classes/git.properties

# Custom Endpoint

- we can add custom endpoints to actuator as well
- `@Endpoint` is used to specify the path to use
- we can use `@ReadOperation` for get request, `@WriteOperation` for post request, etc
- e.g. below code mimics a scenario where we want to get the number of rows for a table in our database - 
  ```java
  @Endpoint(id = "number-of-rows")
  @Component
  public class DBEndpoint {
    
    @ReadOperation
    public Map<String, String> numberOfRows(String table) {
      Map<String, String> map = new HashMap<>();
      map.put(table, "5012");
      return map;
    }
  }
  ```
  request uri - /actuator/number-of-rows?table=user-accounts

# Securing Endpoints

e.g. allow all users to access the health endpoint and only users with a role of admin to access other endpoints

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {

  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
      .requestMatchers(EndpointRequest.to(HealthEndpoint.class)).permitAll()
      .requestMatchers(EndpointRequest.toAnyEndpoint()).hasRole("ADMIN");

    http.csrf().and().httpBasic();
  }
}
```

# Metrics Endpoint

- it would return information like jvm memory usage, system cpu usage, etc
- hitting `/actuator/metrics/` will show what all endpoints we can hit, then we can hit them via for instance `/actuator/metrics/application.ready.time`
