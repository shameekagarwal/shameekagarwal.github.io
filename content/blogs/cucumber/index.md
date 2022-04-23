---
title: Cucumber
tags: ["java", "test"]
---

In this blog, I would cover my understanding of Cucumber.

# About

- cucumber helps us implement bdd patterns
- we write tests using scenarios
- scenarios are a list of steps
- we write scenarios in english like syntax called gherkin in .feature files
- step definitions help connect gherkin steps to executable code

# Different Approaches of Testing

- tdd or test driven development is about white box testing, mostly done by developers themselves
- bdd or behavior driven development is about black box testing, po (product owners) and developers collaborate to develop bdd testcases. this is what cucumber helps achieve
- atdd or acceptance test driven development is about verifying the application via manual testing

# Considerations

- features' steps and step definitions should not be coupled, as coupling results in lack of re-usability
- instead, step definitions should be organized according to domains and not scenarios or features
- write atomic steps in order to prevent them from being specialized, as specialized steps are harder to reuse
- state shouldn't be shared across scenarios, each test should start with a clean slate

# Step Definitions

- it helps link gherkin steps to executable code
- to match it against steps, we can use both cucumber expressions and regular expressions
- step definitions can manage state by storing data in instance variables
- we can use step arguments to make step definitions reusable
- example -
  ```java
  public class StepDefinitions {
    @Given("I have {int} cukes in my belly")
    public void i_have_n_cukes_in_my_belly(int cukes) {
      System.out.format("Cukes: %n\n", cukes);
    }
  }
  ```
  or using java8 -
  ```java
  public class StepDefinitions implements En {
    public StepDefinitions() {
      Given("I have {int} cukes in my belly", (Integer cukes) -> {
        System.out.format("Cukes: %n\n", cukes);
      });
    }
  }
  ```

# Hooks

- hooks can be run at certain points in cucumber's execution cycle
- note: for all examples below, there is a java8 lambda version as well
- we can execute hooks before the first step and after the last step of each scenario -
  ```java
  @Before
  public void doSomethingBefore() { ... }
  ```
- we can execute hooks before and after every step -
  ```java
  @BeforeStep
  public void doSomethingBeforeStep(Scenario scenario) { ... }
  ```
- we can execute hooks conditionally as well based on tags -
  ```java
  @After("@browser and not @headless")
  public void doSomethingAfter(Scenario scenario) { ... }
  ```
- global hooks run before any scenario has been run or after all scenarios have been run -
  ```java
  @BeforeAll
  public static void beforeAll() { ... }
  ```
- we can specify an order while writing hooks, e.g. `@Before(order = 1)`. execution order is described as follows - `@Before(order = 1)` &#10137; `@Before(order = 2)` &#10137; `@After(order = 2)` &#10137; `@After(order = 1)`

# Tags

- tags help in running a subset of scenarios or hooks at a time
- they help in organizing scenarios and features
- we can have multiple tags as well
- feature files -
  ```gherkin
  @billing @bicker @annoy
  Feature: Verify billing
  ```
- java files -
  ```java
  @After("@browser")
  public void doSomethingAfter(Scenario scenario) { ... }
  ```
- **tag expressions**, e.g. - `(@smoke or @ui) and (not @slow)` can be used in hooks
- tags get inherited by child elements, e.g. scenarios inherit tags on features
- we can use `@IncludeTags` or `@ExcludeTags` on runners
- to run tests based on tag expressions, we can use - `./mvnw -Dcucumber.filter.tags="@smoke and not @slow"`

# Type Registry

- parameter types help convert parameters to pojos easily
- like step definitions, they are a part of glue path
- below are a few examples of parameterization - data table type, using object mapper and parameter type

### Data Table Type

- feature file -
  ```gherkin
  Scenario: pass via data table type
    Given data table type for following books
      | name   | author   | price |
      | book a | author a | 10    |
      | book b | author b | 20    |
  ```
- step argument -
  ```java
  @DataTableType
  public Book bookDataTableType(Map<String, String> bookDetails) {
    return new Book(
        bookDetails.get("name"),
        bookDetails.get("author"),
        Integer.parseInt(bookDetails.get("price"))
    );
  }
  ```
- step -
  ```java
  @Given("data table type for following books")
  public void dataTableTypeForFollowingBooks(List<Book> books) { ... }
  ```

### Object Mapper

- the step argument can be replaced by the below and everything would work automatically
  ```java
  @DefaultParameterTransformer
  @DefaultDataTableEntryTransformer
  @DefaultDataTableCellTransformer
  public Object transformer(Object fromValue, Type toValueType) {
    return objectMapper.convertValue(fromValue, objectMapper.constructType(toValueType));
  }
  ```
- my understanding - use data table type when column headers != pojo attribute names

### Parameter Type

- feature file - 
  ```gherkin
  Scenario: pass via parameter type
    Given parameter type for book book a, author a, 10
  ```
- step argument - 
  ```java
  @ParameterType(name = "book", value = ".*")
  public Book bookParameterType(String bookDetails) {
    String[] bookDetailsArray = bookDetails.split(", ");
    return new Book(
        bookDetailsArray[0],
        bookDetailsArray[1],
        Integer.parseInt(bookDetailsArray[2])
    );
  }
  ```
- step -
  ```java
  @Given("parameter type for book {book}")
  public void parameterTypeForBookBook(Book book) { ... }
  ```

# Keywords

- keywords can be primary or secondary
- **feature** - it is used to group related scenarios. we can provide title and description. we can also add tags to it
  ```gherkin
  Feature: guess the word
    a turn based game for two players
    Scenario: ...
  ```
- **description** - free form text which can get picked up by for e.g. html reporter plugin. we can place it with feature, background, scenario, etc. it supports markdown
- **steps** - steps can start with given, when, then, and, but, etc. cucumber doesn't consider keywords when looking for step definitions, so `Given: abcd` is the same as `When: abcd` when searching for a corresponding step definition irrespective of the annotation e.g. `@Given(...)` used on step definitions
- **given** - putting the system into a known state
- **when** - having more than one `when` step in a scenario is an anti-pattern
- **then** - verifying observable output
- **and** & **but** - instead of multiple given and then, we can join them using conjunctions
  ```gherkin
  Scenario: all done
    Given i am out shopping
    And i have eggs
    And i have milk
    When i check my list
    Then i don't need anything
    And i get back home
  ```
- **\*** - we can also use asterisk to make scenarios more readable
  ```gherkin
    Scenario: all done
    Given i am out shopping
    * i have eggs
    * i have milk
    ...
  ```
- **data table** - useful for sending a list of values, passed as the last argument of the step definition. we can either receive it as a `List<Map<String, String>>` or use type registry as described above for getting a list of pojos. cucumber automatically handles column headers and using it as keys in key value pairs
  ```gherkin
  Given the following users exist:
  | name   | email              | twitter      |
  | Aslak  | aslak@cucumber.io  | @91aslak     |
  | Julien | julien@cucumber.io | @julien_kt   |
  ```
- **background** - instead of repeating givens in all scenarios in a feature, we can refactor the common setup. note: they are run after the before hooks
  ```gherkin
  Feature: xyz
    Background:
      Given a
      Given b
      Given c
    Scenario: pqr
    ...
    Scenario: xyz
    ...
  ```
- **scenario outline** - to run the same scenario multiple times with different values
  ```gherkin
  Feature: 
    Scenario Outline:
      Given <a> and <b>
      Then sum is <c>
      Examples:
        | a | b | c  |
        | 1 | 2 | 3  |
        | 6 | 7 | 13 |
  ```
- these were primary keywords, secondary keywords include `@` for tags, `|` for data tables, `#` for comments, etc.
- we may need to use `\` sometimes to escape stuff
