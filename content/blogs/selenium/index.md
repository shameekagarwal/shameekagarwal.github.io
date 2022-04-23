---
title: Selenium
tags: ["java", "test"]
---

In this blog, I would cover my understanding of Selenium.

# Architecture

- selenium is open source for automating browser interactions
- selenium has three components - selenium web driver, selenium ide, selenium grid
- selenium rc is the older demised version, selenium web driver is the new and preferred way
- selenium grid helps execute tests in remote distributed environments
- selenium web driver is an interface, which is implemented by different vendors like chrome, firefox, edge, etc
- we invoke methods on web driver to interact with the browser
- selenium also has disadvantages like it does not support uploading files natively
- selenium now uses w3 protocol, which makes it more efficient and has more features

![architecture](architecture.drawio.png)

# Setup

- install drivers, from here - [chromedriver](https://chromedriver.chromium.org/downloads), [geckodriver](https://github.com/mozilla/geckodriver/releases), [edgedriver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/). note, my misconception: drivers are not like standalone browsers, we would still need the actual browser installed on the machine, which should be compatible with the version of the driver
- add this to pom.xml - 
  ```xml
  <selenium.version>4.1.2</selenium.version>
  ...
  <dependency>
    <groupId>org.seleniumhq.selenium</groupId>
    <artifactId>selenium-java</artifactId>
    <version>${selenium.version}</version>
  </dependency>
  ```
- to launch the browser - 
  ```java
  public class LaunchBrowser {

    public static void main(String[] args) {
      // chrome, can do similarly for firefox and edge
      System.setProperty("webdriver.chrome.driver", "...selenium/drivers/chromedriver");
      WebDriver driver = new ChromeDriver();
    }
  }
  ```
- better to use `WebDriverManager`, removes the need for installing drivers. add this to pom.xml - 
  ```xml
  <webdrivermanager.version>5.1.0</webdrivermanager.version>
  ...
  <dependency>
    <groupId>io.github.bonigarcia</groupId>
    <artifactId>webdrivermanager</artifactId>
    <version>${webdrivermanager.version}</version>
  </dependency>
  ```
  now, to launch the browser - 
  ```java
  public class LaunchBrowser {

    public static void main(String[] args) {
      WebDriverManager.chromedriver().setup();
      WebDriver driver = new ChromeDriver();
    }
  }
  ```

# Input Field

`getText()` returns `innerText`, so it was empty. so, we used `getAttribute("value")`

```java
driver.get("https://admin-demo.nopcommerce.com/login");

WebElement inputElement = driver.findElement(By.id("Email"));
System.out.println("element displayed = " + inputElement.isDisplayed()); // true
System.out.println("element enabled = " + inputElement.isEnabled()); // true
System.out.println("text = " + inputElement.getText()); // empty string
System.out.println("value = " + inputElement.getAttribute("value")); // admin@yourstore.com
inputElement.clear();
inputElement.sendKeys("john.doe@gmail.com");
```

# Radio Button

```java
driver.get("https://demo.nopcommerce.com/register");

WebElement maleRadioElement = driver.findElement(By.xpath("//input[@id='gender-male']"));
WebElement femaleRadioElement = driver.findElement(By.xpath("//input[@id='gender-female']"));
System.out.println("male radio selected = " + maleRadioElement.isSelected()); // false
System.out.println("female radio selected = " + femaleRadioElement.isSelected()); // false
maleRadioElement.click();
System.out.println("male radio selected = " + maleRadioElement.isSelected()); // true
System.out.println("female radio selected = " + femaleRadioElement.isSelected()); // false
```

# Links

selenium has functions to find links by text / partial text matches

```java
driver.get("https://www.amazon.in");

driver.findElement(By.linkText("Today's Deals")).click();
driver.findElement(By.partialLinkText("Today's Deals")).click();

List<WebElement> links = driver.findElements(By.tagName("a"));
System.out.println("total number of links = " + links.size());

links.forEach(link -> {
  System.out.println("link = " + link.getText() + ", href = " + link.getAttribute("href"));
});
```

a method find all broken links - 

```java
private static void brokenLinks() {
  driver.get("http://www.deadlinkcity.com");
  List<WebElement> links = driver.findElements(By.tagName("a"));
  List<String> brokenLinks = new ArrayList<>();
  links.forEach(link -> {
    String href = link.getAttribute("href");
    try {
      URL url = new URL(href);
      HttpURLConnection connection =  (HttpURLConnection) url.openConnection();
      connection.connect();
      if (connection.getResponseCode() >= 400) {
        brokenLinks.add(href);
      }
    } catch (Exception e) {
      brokenLinks.add(href);
    }
  });
  System.out.println(brokenLinks);
}
```

# Navigation

`driver.get(...)` and `driver.navigate().to(...)` both do the same thing

```java
driver.get("https://www.snapdeal.com");
driver.get("https://www.amazon.com");

driver.navigate().back(); // snapdeal
driver.navigate().forward(); // amazon
driver.navigate().refresh(); // amazon page reloaded
driver.navigate().to("https://www.github.com"); // github, works like driver.get()
```

# findElement vs findElements

- `findElement()` returns one element, if many elements are present then it returns the first element and if no elements are present, it throws `NoSuchElementException`
- `findElements()` returns list of elements, if many elements are present then it returns all of them and if no elements are present, it returns an empty list

```java
driver.get("https://demo.nopcommerce.com/");

By locator = By.xpath("//div[@class='footer-upper']//a");
WebElement footerLink = driver.findElement(locator);
List<WebElement> footerLinks = driver.findElements(locator);
System.out.println(footerLink.getText());
System.out.println(footerLinks.get(0).getText());
```

# Select Dropdown

```java
driver.get("https://www.opencart.com/?route=account/register");

WebElement selectElement = driver.findElement(By.xpath("//select[@id='input-country']"));
Select select = new Select(selectElement);

select.selectByIndex(2);
select.selectByVisibleText("Denmark");
select.selectByValue("4");

// get the selected option
System.out.println("selected item text = " + select.getFirstSelectedOption().getText());

// we can also select options without using builtin methods
List<WebElement> options = select.getOptions();
options.forEach(option -> {
  if (option.getText().equalsIgnoreCase("ukraine")) {
    option.click();
  }
});
```

# Dropdown which doesn't use Select

```java
private static WebDriver driver;

public static void main(String[] args) {
  WebDriverManager.chromedriver().setup();
  driver = new ChromeDriver();
  driver.manage().window().maximize();
  driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));

  driver.get("https://www.jqueryscript.net/demo/Drop-Down-Combo-Tree/");
  WebElement dropdown = driver.findElement(By.xpath("//input[@id='justAnInputBox']"));
  dropdown.click();
  selectChoices("choice 2 1", "choice 2 3");
}

// using varargs for selecting multiple options in dropdown
private static void selectChoices(String... chooseByText) {
  List<WebElement> choices = driver.findElements(By.xpath("//span[@class='comboTreeItemTitle']"));
    choices.forEach(choice -> {
      if (chooseByText[0].equals("all")
          || Arrays.stream(chooseByText).anyMatch(c -> c.equals(choice.getText()))) {
        choice.click();
      }
    });
}
```

# Window Handle

- `getWindowHandle()` returns the id of the tab which is currently controlling
- `getWindowHandles()` returns the ids of all the open tabs. its return type is `Set<String>`, which is ordered according to the time they were opened
- converting `Set` to `List` can make indexing and working with the ids easier
- we can switch between windows using `driver.switchTo().window()`
- ` driver.close()` will close the current window, `driver.quit()` will close all windows

```java
driver.get("https://opensource-demo.orangehrmlive.com");
WebElement homeLink = driver.findElement(By.xpath("//a[contains(text(), 'OrangeHRM, Inc')]"));
homeLink.click();

List<String> windowHandles = new ArrayList<>(driver.getWindowHandles());
System.out.println("parent window id = " + windowHandles.get(0));
System.out.println("child window id = " + windowHandles.get(1));

System.out.println("current window id = " + driver.getWindowHandle());
driver.switchTo().window(windowHandles.get(1));
System.out.println("current window id = " + driver.getWindowHandle());

// driver.quit();
driver.close();
```

# Alerts

alerts can have different elements like button to accept, reject or even inputs. view e.g. [here](https://the-internet.herokuapp.com/javascript_alerts)

```java
driver.findElement(By.xpath("//button[contains(text(), 'Click for JS Confirm')]")).click();
Thread.sleep(3000);
driver.switchTo().alert().accept();

driver.findElement(By.xpath("//button[contains(text(), 'Click for JS Confirm')]")).click();
Thread.sleep(3000);
driver.switchTo().alert().dismiss();

driver.findElement(By.xpath("//button[contains(text(), 'Click for JS Prompt')]")).click();
Thread.sleep(3000);
Alert alert = driver.switchTo().alert();
alert.sendKeys("Welcome");
alert.accept();
```

for basic auth alert, use the format `https://username:password@url` -

```java
driver.get("https://admin:admin@the-internet.herokuapp.com/basic_auth");
```  

sometimes, we get popups at top left from the lock icon in the address bar. to prevent them, use - 

```java
ChromeOptions options = new ChromeOptions();
options.addArgument("--disable-notifications");
...
WebDriver driver = new ChromeDriver(options);
```

# Waits in Selenium

- synchronization problem - the execution of code is faster than the application response
- in selenium, we can use - `Thread.sleep`, `ImplicitWait`, `ExplicitWait`, `FluentWait`
- implicit wait - it is like a global wait applicable throughout the code. it can be configured like this - 
  ```java
  driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
  ```
- explicit wait - for specific scenarios where load time is particularly more - 
  ```java
  WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

  WebElement element = wait.until(ExpectedConditions.visibilityOfElementLocated(
    By.xpath("//h3[contains(text(), 'Selenium Tutorial')]")));
  ```
  `ExpectedConditions` also has methods like `invisibilityOfElementLocated` etc
- fluent wait - we specify polling time i.e. how frequently the condition will be checked for. we can also choose to ignore exceptions in this case. it's like a customizable version of explicit wait
  ```java
  Wait<WebDriver> wait = new FluentWait<>(driver)
      .withTimeout(Duration.ofSeconds(30))
      .pollingEvery(Duration.ofSeconds(5))
      .ignoring(NoSuchElementException.class);

  WebElement element = wait.until(webDriver -> webDriver.findElement(
    By.xpath("//h3[contains(text(), 'Selenium Tutorial')]")));
  ```

# Table

```java
driver.get("https://the-internet.herokuapp.com/tables");

List<WebElement> rows = driver.findElements(By.xpath("//table[@id='table1']//tbody//tr"));
System.out.println("number of rows = " + rows.size());

List<WebElement> columns = driver.findElements(By.xpath("//table[@id='table1']//thead//th"));
System.out.println("number of columns = " + columns.size());

WebElement johnsEmail = driver.findElement(By.xpath("//table[@id='table1']//tbody//tr[1]//td[3]"));
System.out.println("john's email = " + johnsEmail.getText());
```

parameterize the row and column number in the locator to extract each row, store the data in `List<Model>`

# Mouse Operations

- right click
  ```java
  driver.get("https://swisnl.github.io/jQuery-contextMenu/demo.html");
  WebElement button = driver.findElement(By.xpath("//span[contains(text(), 'right click me')]"));
  Actions actions = new Actions(driver);
  actions.contextClick(button).perform();
  ```
- double click
  ```java
  driver.get("https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_ondblclick");
  driver.switchTo().frame("iframeResult");
  WebElement paragraph = driver.findElement(
      By.xpath("//p[contains(text(), 'Double-click this paragraph')]"));
  Actions actions = new Actions(driver);
  actions.doubleClick(paragraph).perform();
  ```
- hover and click, e.g. navigation using menus in some applications
  ```java
  driver.get("https://demo.opencart.com/");
  Actions actions = new Actions(driver);
  WebElement desktops = driver.findElement(By.partialLinkText("Desktops"));
  actions.moveToElement(desktops);
  WebElement mac = driver.findElement(By.partialLinkText("Mac"));
  actions.moveToElement(mac).click();
  ```
- drag and drop (note: here it has been used for a slider, but we can also use it for drag and drop uis)
  ```java
  driver.get("https://www.jqueryscript.net/demo/Price-Range-Slider-jQuery-UI");
  Actions actions = new Actions(driver);
  WebElement slider = driver.findElement(By.xpath("//span[1]"));
  actions.dragAndDropBy(slider, 100, 0).perform();
  ```

# Keyboard Operations

- sending keys to a page, not a web element - 
  ```java
  driver.get("https://the-internet.herokuapp.com/key_presses");
  Actions actions = new Actions(driver);
  actions.sendKeys("S").perform();
  Thread.sleep(2000);
  ```
- sometimes we need to send combination of keys as well, e.g. selecting, copying and then pasting text - 
  ```java
  driver.get("https://text-compare.com");
  WebElement inputOne = driver.findElement(By.xpath("//*[@id='inputText1']"));
  WebElement inputTwo = driver.findElement(By.xpath("//*[@id='inputText2']"));
  inputOne.sendKeys("selenium tutorial");
  Actions actions = new Actions(driver);
  actions.keyDown(Keys.CONTROL).sendKeys("a").keyUp(Keys.CONTROL).perform();
  actions.keyDown(Keys.CONTROL).sendKeys("c").keyUp(Keys.CONTROL).perform();
  actions.sendKeys(Keys.TAB).perform();
  actions.keyDown(Keys.CONTROL).sendKeys("v").keyUp(Keys.CONTROL).perform();
  System.out.println("copied text = " + inputTwo.getAttribute("value"));
  ```

# Class Hierarchy in Selenium

- the following is a brief overview of class hierarchy in selenium
- dotted lines are for interfaces, solid lines for classes
- arrows are for extends / implements
- because of this class hierarchy, we can typecast `WebDriver` to `TakeScreenshot` & `JavascriptExecutor`

![class-hierarchy](class-hierarchy.drawio.png)

# Screenshot

- take page screenshot - 
  ```java
  TakesScreenshot takesScreenshot = (TakesScreenshot) driver;
  File source = takesScreenshot.getScreenshotAs(OutputType.FILE);
  File target = new File("./screenshots/page-screenshot.png");
  FileUtils.copyFile(source, target);
  ```
- element screenshot - 
  ```java
  driver.get("https://demo.nopcommerce.com");
  
  WebElement element = driver.findElement(
    By.xpath("//div[@class='category-grid home-page-category-grid']"));
  File source = element.getScreenshotAs(OutputType.FILE);
  File target = new File("./screenshots/element-screenshot.png");
  FileUtils.copyFile(source, target);
  ```

# Javascript Executor

execute javascript code directly, e.g. scroll to bottom of the page using - `javascriptExecutor.executeScript("window.scrollBy(0, document.body.scrollHeight)");`

```java
JavascriptExecutor javascriptExecutor = (JavascriptExecutor) driver;
WebElement heading = driver.findElement(By.xpath("//h2"));
javascriptExecutor.executeScript("arguments[0].style.border = '3px solid red'", heading);
```

# Cookies

- reading cookies - 
  ```java
  driver.get("https://demo.nopcommerce.com");
  Set<Cookie> cookies = driver.manage().getCookies();
  System.out.println("total cookies = " + cookies.size());
  cookies.forEach(c -> System.out.println(c.getName() + " = " + c.getValue()));
  ```
- adding cookie - 
  ```java
  Cookie cookie = new Cookie("my-cookie", "tasty");
  driver.manage().addCookie(cookie);
  ```
- deleting cookie - 
  ```java
  driver.manage().deleteCookie(cookie);
  ```

# Selenium Grid

- it helps us run tests in parallel across different machines. it provides a central entry point for all tests, and things like running tests on multiple versions of browsers and different types of browsers like edge, chrome and firefox, scaling, load balancing etc.
- we can use selenium grid in three modes - 
  - **standalone** - everything bundles as one
  - **hub and node(s)** - hub consists of different components, and nodes are like vms running browsers
  - **distributed** - we manage the different components of hub on our own
- note: a node has multiple slots. slots are places where sessions can run
- the different components of hub - 
  - **event bus** - used for asynchronous communication between the different components, but components do communicate synchronously as well, depends on the configuration and use case
  - **session queue** - maintains sessions which are yet to be assigned to nodes by the distributor
  - **distributor** - assigns session requests to slots
  - **session map** - maintains mapping of session id and node where the session is running
  - **router** - the component that is exposed to the outside world to interact with the grid