---
title: Junit and Mockito
tags: ["java", "test"]
---

In this blog, I would cover my understanding of testing using Junit and Mockito.

# Junit

- the code being tested is called subject under test / system under test
- junit platform helps launch tests from ide, using build tool, console, etc
- junit jupiter is used for the newer junit 5
- junit vintage provides backward compatibility for junit 3 and junit 4
- maven dependency to use - 
  ```xml
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>${junit.version}</version>
    <scope>test</scope>
  </dependency>
  ```
- we can use `Assertions` to ensure the results match with what we expect
- e.g. `Assertions.assertEquals(1, contactManager.getAllContacts().size())`
- we can verify if exceptions are being thrown, using suppliers
  ```java
  Assertions.assertThrows(
    RuntimeException.class,
    () -> contactManager.addContact(null, "doe", "0123456789")
  );
  ```
- we can use lifecycle methods -
  - `@BeforeAll` and `@BeforeEach` for initialization tasks
  - `@AfterAll` and `@AfterEach` for cleanup tasks
- order in which they run - `@BeforeAll` &#10137; `@BeforeEach` &#10137; `@Test` &#10137; `@AfterEach` &#10137; `@AfterAll`
- junit by default creates a new instance of the class for each test method, and methods annotated with `@BeforeAll` & `@AfterAll` need to be `static`
- we can change this so that junit creates only one instance of the class for all test methods, and methods annotated with `@BeforeAll` & `@AfterAll` need **not** be `static`. this can be done by annotating the class with `@TestInstance(TestInstance.Lifecycle.PER_CLASS)`
- we have annotations to conditionally execute tests else the test would be "skipped"
  ```java
  @EnabledOnOs(value = OS.WINDOWS)
  @Test
  public void whenOnWindows_thenShouldRun() {
    System.out.println("on windows, therefore running");
  }
  ```
- assumptions - if the criteria for the condition is not met, then the test is skipped and not executed further, instead of failing the test
  ```java
  @Test
  public void whenProfileIsDev_thenShouldRun() {
    Assumptions.assumeTrue("dev".equals(System.getenv("profile")));
    System.out.println("running since inside dev environment");
  }
  ```
- we can run tests multiple times. use case: random number generation
  ```java
  @RepeatedTest(5)
  public void whenRandomNumberGenerated_thenShouldSucceed() {
    System.out.println("generated random number successfully");
  }
  ```
- parameterized tests - sending different sets of arguments to the same test to avoid code duplication
  - we can provide values directly using `@ValueSource`
    ```java
    @ParameterizedTest
    @ValueSource(strings = {"123456", "012-3456-789", "+0123456789"})
    public void whenInvalidPhoneNumber_thenShouldFail(String phoneNumber) {
      Assertions.assertThrows(
          RuntimeException.class,
          () -> contactManager.addContact("john", "doe", phoneNumber)
      );
    }
    ```
  - we can provide values through a method using `@MethodSource`
    ```java
    @ParameterizedTest
    @MethodSource("getInvalidPhoneNumbers")
    public void whenInvalidPhoneNumber_thenShouldFail(String phoneNumber) {
      Assertions.assertThrows(
          RuntimeException.class,
          () -> contactManager.addContact("john", "doe", phoneNumber)
      );
    }

    public List<String> getInvalidPhoneNumbers() {
      return List.of("123456", "012-3456-789", "+0123456789");
    }
    ```
  - we can also use `@CsvFileSource`, if we have multiple arguments and want to run the test 10 or more times
- we can use nested tests to organize code and outputs
  ```java
  public class ValidationTests {
    @Nested
    class InvalidPasswordsTest {
      @Test
      public void whenPasswordIsShort_thenFail() {..}

      @Test
      public void whenPasswordHasNoSpecialCharacters_thenFail() {..}
    }
  }
  ```
- use `@Disabled` to disable test, e.g. using if test is expected to fail during active development

# Mockito

- helps in testing functionality of code in isolation without relying on its external dependencies, which makes the test execution faster. developers don't have to manually create test doubles as mockito does this
- maven dependencies to use - 
  ```xml
  <dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>${mockito.version}</version>
    <scope>test</scope>
  </dependency>

  <dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>${mockito.version}</version>
    <scope>test</scope>
  </dependency>
  ```
- stubbing methods - we provide configured responses for the dependencies. this way, the system under test doesn't throw errors on calling methods on the dependencies
- e.g. of stubbing methods
  ```java
  @Test
  public void whenFindNumberOfBooksIsCalled_thenCallMethodOnBookRepo() {
    BookRepo bookRepo = mock(BookRepo.class);
    BookService bookService = new BookService(bookRepo);
    Book book1 = new Book(1L, "mockito in action", 250, LocalDate.now());
    Book book2 = new Book(2L, "junit in action", 250, LocalDate.now());
    Collection<Book> bookList = List.of(book1, book2);
    when(bookRepo.findAll()).thenReturn(bookList);

    assertEquals(2, bookService.findNumberOfBooks());
  }
  ```
- mock - we verify how many times the stubbed method was called, arguments passed to the stub, etc
- e.g. of mock
  ```java
  @Test
  public void whenAddBookIsCalled_thenCallMethodOnBookRepo() {
    BookRepo bookRepo = mock(BookRepo.class);
    BookService bookService = new BookService(bookRepo);
    Book book1 = new Book(1L, "mockito in action", 250, LocalDate.now());
    Book book2 = new Book(2L, "junit in action", 250, LocalDate.now());
    bookService.addBook(book1);

    verify(bookRepo, times(1)).save(book1);
    verify(bookRepo, times(0)).save(book2);
    verify(bookRepo, times(1)).save(any());
  }
  ```
- we can make tests more succinct by using annotations like `@Mock` and `@InjectMocks`, but for using them we need to annotate the class with `@ExtendWith(MockitoExtension.class)`
  ```java
  @ExtendWith(MockitoExtension.class)
  public class BookServiceTest {

    @Mock
    private BookRepo bookRepo;

    @InjectMocks
    private BookService bookService;

  }
  ```
- if we dont have a pre configured response, mockito returns default responses for stubs like empty lists
- we can stub in three ways - 
  - `when` and `thenReturn` - i prefer this
    ```java
    @Test
    public void whenGetTotalPrice_thenSuccess() {
      List<Book> bookList = getTestBooks();
      bookList.forEach((book) -> when(bookRepo.findById(book.getId())).thenReturn(book));
      List<Long> bookIds = bookList.stream().map(Book::getId).collect(Collectors.toList());
      Long totalPrice = bookService.getTotalPrice(bookIds);

      assertEquals(1050, totalPrice);
    }
    ```
  - `doReturn` and `when`
  - `given` and `willReturn`
- we can configure multiple responses for stubs through one function call
  ```java
  @Test
  public void whenGetTotalPrice_thenSuccess() {
    Book book1 = getTestBooks().get(0);
    Book book2 = getTestBooks().get(1);
    when(bookRepo.findById(any()))
        .thenReturn(book1)
        .thenReturn(book2);
    List<Long> bookIds = List.of(book1.getId(), book2.getId());
    Long totalPrice = bookService.getTotalPrice(bookIds);

    assertEquals(550, totalPrice);
  }
  ```
- mockito uses `equals` method for comparison, so provide implementation / use lombok for objects
- in my opinion, for better tests, we should never use pass by reference for pojos
- we can instead everytime use `getTestBooks.get(0)`, and `getTestBooks` would everytime generate new pojos
- an equivalent of `verify(bookRepo, times(0)).save(bookList.get(1));` can also be  
  `verify(bookRepo, never()).save(bookList.get(1));`
- `verifyNoInteractions` is used to check that there were no calls to any of the methods of a mock
- in e.g. below, `updateBook` calls bookRepo methods either 2 or 0 times
  ```java
  public void updateBook(Book book) {
    if (book.getId() == null) return;

    Book savedBook = bookRepo.findById(book.getId());
    savedBook.setPrice(book.getPrice());
    savedBook.setName(book.getName());
    bookRepo.save(book);
  }
  
  ...

  @Test
  public void whenBookUpdateCalledWithNullId_thenBookRepoNotCalled() {
    Book book = getTestBooks().get(0);
    book.setId(null);
    bookService.updateBook(book);
    verifyNoInteractions(bookRepo);
  }
  ```
- after all verifications, use `verifyNoMoreInteractions()` to ensure no more methods were called on the mock
- we can also verify the order in which method calls were made with the help of `InOrder`
  ```java
  @Test
  public void whenBookUpdateCalled_thenBookRepoCalledTwice() {
    when(bookRepo.findById(any())).thenReturn(books().get(0));
    bookService.updateBook(books().get(0));

    InOrder inOrder = Mockito.inOrder(bookRepo);
    inOrder.verify(bookRepo, times(1)).findById(books().get(0).getId());
    inOrder.verify(bookRepo, times(1)).save(books().get(0));
  }
  ```
- we can simulate throwing of exceptions using `when` and `thenThrow`, e.g. `when(bookRepo.findById(any())).thenThrow(SQLException.class);`
- `ArgumentCaptor` can be used to capture arguments received by mocks
  ```java
  @Test
  public void whenAddBookIsCalled_thenSuccess() {
    List<Book> bookList = books();
    bookService.addBook(bookList.get(0));

    ArgumentCaptor<Book> argumentCaptor = ArgumentCaptor.forClass(Book.class);
    verify(bookRepo, times(1)).save(argumentCaptor.capture());
    Book book = argumentCaptor.getValue();
    assertEquals(bookList.get(0), book);
  }
  ```
- if a lot of tests use this, we can create a private field in the class
  ```java
  @Captor
  private ArgumentCaptor<Book> bookCaptor;
  ```
  now, no need to write `ArgumentCaptor.forClass(Book.class);` in tests
- in mockito, we use spies when we want to use the actual dependency yet track interactions on it
- so, unlike mock where a test double is used and stubbed methods are called, actual methods get called here
- however, we can if we want to stub methods of spied objects
  ```java
  @ExtendWith(MockitoExtension.class)
  class BookManagerTest {

    @Spy
    private BookService bookService;

    @InjectMocks
    private BookManager bookManager;

    @Test
    public void whenGetDiscountedPrice_thenOk() {
      Book book = new Book(1L, "spring in action", 500L);
      when(bookService.findById(any())).thenReturn(book);

      Long discountedPrice = bookManager.getDiscountedPrice(book.getId(), 10L);
      assertEquals(450, discountedPrice);
    }
  }
  ```
- argument matchers - instead of specifying specific inputs while stubbing methods, we can use argument matchers to specify a range of inputs and corresponding to that return a specific output
- e.g. `any()` where we can pass any object or null
- e.g. `any(Class<T> class)` where we can pass any object of given type or null and so on
- we cannot use objects in some arguments and argument matchers in other arguments
- e.g. `when(bookRepo.findByNameAndAuthorName("spring in action", any()))` would fail
- instead, we should use `when(bookRepo.findByNameAndAuthorName(eq("spring in action"), any()))`
- we can use argument matchers like `anyString()`, `anyBoolean()`, `anyList()` etc. as well
- for strings, we also have matchers like `matches(Sting regex)`, `endsWith(Sting s)`, `contains(Sting s)`, etc
