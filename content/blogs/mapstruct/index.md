---
title: MapStruct
tags: ["java", "spring"]
---

In this blog, I would cover my understanding of Mapstruct.

# About

- [mapstruct](https://mapstruct.org/) helps implement mappings between java beans
- when we try to write this implementation ourselves, we can miss out on fields, make errors, etc
- mapstruct uses a convention over configuration approach and uses sensible defaults, but we can override them according to use

# Installation

- getting spring boot, mapstruct and lombok to work together isn't straightforward
- at the time of writing, in [spring initializr](https://start.spring.io/), the latest stable version of spring boot is 2.6.3
- i feel a right way to declare versions in pom.xml is to refer something like [this](https://search.maven.org/remotecontent?filepath=org/springframework/boot/spring-boot-dependencies/2.6.3/spring-boot-dependencies-2.6.3.pom) and instead of manually specifying versions of everything, make use of spring boot wherever possible

properties block - 

```xml
<properties>
  <java.version>11</java.version>
  <mapstruct.version>1.4.2.Final</mapstruct.version>
  <lombok-mapstruct-binding.version>0.2.0</lombok-mapstruct-binding.version>
</properties>
```

dependencies block - 

```xml
<dependencies>
  <!-- ... -->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>

  <dependency>
      <groupId>org.mapstruct</groupId>
      <artifactId>mapstruct</artifactId>
      <version>${mapstruct.version}</version>
  </dependency>

  <dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>${mapstruct.version}</version>
  </dependency>

  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok-mapstruct-binding</artifactId>
    <version>${lombok-mapstruct-binding.version}</version>
  </dependency>

  <!-- ... -->
</dependencies>
```

build block - 

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
      <configuration>
        <excludes>
          <exclude>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
          </exclude>
        </excludes>
      </configuration>
    </plugin>

    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <version>${maven-compiler-plugin.version}</version>
      <configuration>
        <source>${java.version}</source>
        <target>${java.version}</target>
        <annotationProcessorPaths>
          <path>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>${lombok.version}</version>
          </path>

          <path>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok-mapstruct-binding</artifactId>
            <version>${lombok-mapstruct-binding.version}</version>
          </path>

          <path>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct-processor</artifactId>
            <version>${mapstruct.version}</version>
          </path>
        </annotationProcessorPaths>
      </configuration>
    </plugin>
  </plugins>
</build>
```

# An Example

an example of converting `ProductDto` to `Product` - 

ProductDto.java - 

```java
@Data
public class ProductDto {

  private Integer id;
  private String name;
  private String about;
  private List<Item> items = new ArrayList<>();
}
```

Product.java - 

```java
@Data
public class Product {

  @Data
  public static class Details {
    private List<Item> items = new ArrayList<>();
  }

  private String id;
  private String uuid;
  private String name;
  private String description;
  private Date createdAt;
  private Date updatedAt;
  private Details details;
}
```

DateHandlerService.java - 

```java
@Service
public class DateHandlerService {
  public Date getDate() {
    return new Date();
  }
}
```

note: this example is just to explore different functionality of mapstruct, may not make sense

- **id** - when converting ProductDto to Product, I want the id specified by ProductDto to be ignored. id should be - 
  - manually set in case of routes like delete, put, etc. using `@PathVariable` from `/products/{id}`
  - null for create route
- **uuid** - assign a different random value using `UUID.randomUUID().toString()` everytime
- **name** - we can use the default conversion provided my mapstruct
- **description** - needs to be mapped from **about**
- **createdAt** - assign a value if createdAt is null
- **updatedAt** - assign a new value to **updatedAt**
- **items** - change non-nested items in `ProductDto` to nested items in `Product`

ProductMapper.java - 

- set componentModel as spring to use spring features like autowiring
- specify imports e.g. see UUID when using `java()` inside `@Mapping`
- `@BeforeMapping` - runs before the generated mapping method
- we can use abstract class / interface. use abstract class always as it gives more functionality
- we can ignore fields using `ignore`
- we can even use java code using `expression`

ProductMapper.java - 

```java
@Mapper(componentModel = "spring", imports = { UUID.class })
public abstract class ProductMapper {

  @Autowired
  protected DateHandlerService dateHandlerService;

  @BeforeMapping
  protected void handleDate(ProductDto productDto, @MappingTarget Product product) {
    if (product.getCreatedAt() == null) {
      product.setCreatedAt(dateHandlerService.getDate());
    }
    product.setUpdatedAt(dateHandlerService.getDate());
  }

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "description", source = "about")
  @Mapping(target = "uuid", expression = "java(UUID.randomUUID().toString())")
  @Mapping(target = "details.items", source = "items")
  public abstract Product productDtoToProduct(ProductDto productDto);

}
```

the implementation `ProductMapperImpl` is generated automatically inside `target/generated-sources/annotations/com/example/mapstruct/ProductMapperImpl.java`

```java
// ...
import java.util.UUID;
// ...

@Component
public class ProductMapperImpl extends ProductMapper {
  public ProductMapperImpl() {
  }

  public Product productDtoToProduct(ProductDto productDto) {
    if (productDto == null) {
      return null;
    } else {
      Product product = new Product();
      this.handleDate(productDto, product);
      product.setDetails(this.productDtoToDetails(productDto));
      product.setDescription(productDto.getAbout());
      product.setName(productDto.getName());
      product.setUuid(UUID.randomUUID().toString());
      return product;
    }
  }

  protected Product.Details productDtoToDetails(ProductDto productDto) {
    if (productDto == null) {
      return null;
    } else {
      Product.Details details = new Product.Details();
      List<Item> list = productDto.getItems();
      if (list != null) {
        details.setItems(new ArrayList(list));
      }

      return details;
    }
  }
}
```

now, we can use it! ProductController.java - 

```java
@RestController
@RequestMapping("/products")
public class ProductController {

  @Autowired
  private ProductMapper productMapper;

  // ......
}
```

# Miscellaneous

- we can use `@Mapping(... defaultValue = ...)`, which gets used if source attribute is null
- `qualifiedByName` can be used for using some custom logic for just one field, can be an alternative to `@BeforeMapping` and `@AfterMapping` for more modularity, e.g. - 
  ```java
  public interface Mapper {
    
    // ...
    @Mapping(target = "value", qualifiedByName = "calculateValue")
    Stock stockDtoToStock(StockDto stockDto);
  
    @Named("calculateValue")
    BigDecimal predictValueOfNextDay(StockDto stockDto) {
      // ...
    }
  }
  ```
- mapper methods can receive multiple arguments
  ```java
  public interface Mapper {
    
    // ...
    @Mapping(target = "about", source = "autobiography.about")
    Person dtosToPerson(Autobiography autobiography, Interview interview);
  }
  ```