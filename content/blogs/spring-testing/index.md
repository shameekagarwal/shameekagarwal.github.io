---
title: Spring Testing
tags: ["java", "spring", "test"]
---

In this blog, I would cover my understanding of testing in Spring.

# Services

- unit tests should be very fast and lightweight
- for unit tests of service layer, we just use junit and mockito, and use mocks for data access objects, i.e. `@Mock` for repositories and `@InjectMocks` for services

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTests {
  @Mock
  private OrderRepository orderRepository;

  @Mock
  private PaymentRepository paymentRepository;

  @InjectMocks
  private OrderService orderService;

  ...
}
```

- the above method works, but does not make use of spring. the method below uses spring
```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration({ OrderService.class })
class OrderServiceTests {
  @MockBean
  private OrderRepository orderRepository;
  
  @MockBean
  private PaymentRepository paymentRepository;
  
  @Autowired
  private OrderService orderService;
  
  ...
}
```

# Controllers

- for unit tests of controller layer, we use `@WebMvcTest`, which scans classes like `@RestController`, `@ControllerAdvice`, etc. `@WebMvcTest` won't scan the service layer, so we have to use `@MockBean` for services
- we can specify the controller to use via `@WebMvcTest(OrderController.class)`. otherwise, we may have to use `@MockBean` for all classes that any of the controllers depend on

```java
@WebMvcTest(OrderController.class)
class OrderControllerTests {
  @MockBean
  private OrderService orderService;
  
  @Autowired
  private MockMvc mockMvc;
  
  @Test
  public void test() {
    ...
    mockMvc.perform(get("/order/{id}/receipt", 1L))
        .andExpect(jsonPath("$.creditCardNumber").value("4532756279624064"))
        .andExpect(status().isOk());
  }
}
```

# Validation

- we should write unit tests for different combinations to ensure our validation rules on pojos are correct
- they should be very fast and should not require loading up the spring context

```java
class ValidationTests {
  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  public void creditCardNumberMustNotBeNull() {
    PaymentRequest request = new PaymentRequest(null);
    Set<ConstraintViolation<PaymentRequest>> violations = validator.validate(request);
    assertTrue(violations.isNotEmpty());
  }
}
```

# Data Layer

- `@DataJpaTest` configures all dependencies related to database layer like repositories, `JdbcTemplate`, etc.
- it also configures the in memory database if it can find one
- we can leave the migrations scripts of liquibase / flyway in place
- however, since there are different flavours of sql, our migration scripts can fail on h2
- so, we can use `TestContainers`, which can help in spinning up docker containers for database easily
- spring can catch errors related to query dsl itself, even catch syntax errors in jpql
- however, it cannot catch errors in native queries
- `@DataJpaTest` has `@Transactional`, which makes it go to the initial state after every test
- `TestEntityManager` can be used to save objects
- we might have to use `persistAndFlush` to write to the database, otherwise the changes just stay in the persistence context and are not necessarily synchronized to the database
- e.g. below helps get errors related to constraints -

```java
@DataJpaTest
public class PaymentRepositoryTests {
  @Autowired
  private TestEntityManager testEntityManager;

  @Autowired
  private PaymentRepository paymentRepository;

  @Test
  public void test() {
    ...
    assertThrows(PersistenceException.class, () -> testEntityManager.persistAndFlush(payment));
  }
}
```

# Serialization and Deserialization

- we can only test serialization using `@JsonTest`
- this is important as many times, we override the behavior of what is there in java pojo vs what gets sent
- `@JsonTest` configures the context related to jackson like creating classes with `@JsonComponent`, etc.

```java
@JsonTest
public class OrderRequestTests {
  @Autowired
  private JacksonTester<OrderRequest> jacksonTester;
  
  @Test
  public void deserializeTest() {
    String json = "{\"amount\": \"USD50.00\"}";
    OrderRequest orderRequest = jacksonTester.parseObject(json);
    assertEquals(50, orderRequest.getAmount());
  }

  @Test
  public void serializeTest() {
    OrderRequest orderRequest = new OrderRequest(50);
    JsonContent<OrderRequest> json = jacksonTester.write(orderRequest);
    assertEquals("USD50.00", json.extractingJsonPathStringValue("$.amount"));
  }
}
```

# Integration Tests

- use `@SpringBootTest` to load the entire spring context
- have to separately add `@AutoConfigureMockMvc` for using MockMvc
- have to separately add `@Transactional` to roll back changes after every test
- we can still use `@MockBean` for classes e.g. some service which makes calls to an external api
- if we want to actually involve the http stack as well, we can use `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)`
- however we cannot use `MockMvc` any longer, so we can autowire `WebTestClient` or `TestRestTemplate`
- another issue when spinning up the environment this way is that `@Transactional` may not work as desired, i.e. server and client threads are different. so, transactions for the two have different meaning. this means if we actually save stuff manually via repositories, we may need to call `deleteAll` on the repositories in `@BeforeEach`

```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Slf4j
@ActiveProfiles({"test"})
public class AccountServiceApplicationTest {

  @LocalServerPort
  private Integer port;

  @Autowired
  private TestRestTemplate testRestTemplate;

  @Autowired
  private AccountDao accountDao;

  @BeforeEach
  public void setup() {
    accountDao.deleteAll();
  }

  private String baseUrl() {
    return "http://localhost:" + port;
  }
  
  // ...
}
```

# Miscellaneous

- spring caches application context to share between tests to avoid recreating the context everytime
- we can always add additional properties to the tests using `@TestPropertySource`, its like overriding the properties inside the properties file for specific tests
- we can also use the `@ActiveProfiles` on a test class to read from a specific properties file, e.g. `@ActiveProfiles({"embedded"})` would look for application-embedded.yml
- read about `MockWebServer` to handle code which makes calls to an external api
- `@RunWith` has been replaced with `@ExtendWith`
- so, the older way was `@RunWith(SpringRunner.class)` and now it is `@ExtendWith(SpringExtension.class)`. this is a way of telling junit and to add spring support
- `@SpyBean` works like [spies in mockito](http://localhost:9000/junit-&-mockito) i.e. mock a subset of methods
- `@DataJpaTest` was not working for me i.e. it was trying to configure all my configuration classes and components and not just the ones related to dao layer. solution was to remove the annotation related to `@ComponentScan` from class with `@SpringBootApplication` and refactor to it another `@Configuration` class. refer the [first comment](https://stackoverflow.com/q/62652516/11885333) for details on this