---
title: Object-Oriented Programming
tags: ["oop", "java", "theory"]
---

In this blog, I would cover my understanding of Object-Oriented Programming in Java.

# Classes and Objects

- in procedural programming, the code is written through methods which allow for re-usability
- in object-oriented programming, we interact through objects which have state and behavior
- the state can be maintained through fields and the behavior can be defined using methods
- behavior = modifying fields / performing computation using fields
- classes are a blueprint to create objects
- fields and methods are also called members of the class
- fields can be **static** i.e. all objects share the same field. static fields are tied to the class. so, we don't need to create an object to access the field and can access it through the class itself
- fields can also be **non-static** i.e. we need to create an object to access them, and they are tied to an object
- fields can be **final** i.e. their values cannot be modified once they are assigned a value
- **constructors** are used to construct an object. they have a special syntax as they use the same name as that of the class, and they do not have a return type
- **default constructor** - also called no args constructor since it has no parameters in its type signature. we assign default values to the different fields
- _if we don't create a constructor_, java itself will create a default constructor and assign values as null / 0
- we can also have a **parameterized constructor** and pass it a subset of fields
- if the parameter names are the same as the field names, we can prefix the fields with **this**
- we can also call other constructors using **this**

# Data Hiding

- **encapsulation** - abstract away the inner working details and provide an interface to interact with. the state and the methods operating on that state are exposed as a single unit
- **getters** are used to get the value of fields, **setters** are used to set the value of fields
- we can have access modifiers on the members of the class to control access to members from outside
- **private** - not accessible from outside the class, but can be used accessed from inside the class
- **public** - can be accessed from everywhere
- **protected** - can be accessed by subclasses through inheritance or from other classes inside the same package
- **default** - this is the access assigned if nothing is mentioned explicitly. can be only accessed from inside the package, so a little more restrictive than protected

# Inheritance

- with inheritance, we avoid duplication of code and build on top of existing classes
- there are two categories of classes in inheritance -
  - super class / parent class / base class
  - subclass / child class / derived class
- whenever there is an **is-a relationship**, we can use inheritance, e.g. a square is a shape
- all non-private members of the super class are inherited by the subclass
- all classes in java, directly or indirectly, extend the `Object` class
- we can inherit members of the super class using the `extends` keyword
- classes declared `final` cannot be inherited
- the keyword `super` is used to access members of the immediate super class. the members can be fields / methods. it is useful when the names of the members in the super class and subclass are same
- the super keyword can also be used to call the constructor of the super class
- if we don't call the super class constructor ourselves, the default constructor of the super class i.e. `super()` gets called automatically
- if we decide to create a parameterized constructor for some reason, there no longer exists a no argument constructor in the super class by default. this would result in an error unless we call the parameterized super class constructor manually
- call to super class constructor should be the first line in the subclass constructor
- **single level inheritance** - when there is only one level of inheritance, e.g. car is a vehicle
- **multi level inheritance** - when there are multiple levels of inheritance, e.g. scorpio is a car, car is a vehicle
- **hierarchical inheritance** - when a super class has multiple subclasses, e.g. car is a vehicle, truck is a vehicle
- **multiple inheritance** - when subclass inherits from multiple super classes e.g. car is a vehicle & a four-wheeler
- **hybrid inheritance** - combination of multi level inheritance and multiple inheritance
- in java, multiple (and hybrid) inheritance is only possible through interfaces

# Polymorphism

- polymorphism means the same object exhibiting different behavior
- **method overloading** - the same method name gets reused by changing the type signature. in java, the parameters need to be different i.e. only a difference in the return type isn't enough. the implementation to use is decided during compile time. this is also called static polymorphism
- **method overriding** - the method with the same signature is defined in the subclass, it can call the method on super class using `super.meth()`. they can also define their own implementation from scratch. the implementation to use is decided during runtime. this is also called dynamic polymorphism
- unlike method overloading, **private / final methods cannot be overridden**

# Abstraction

- abstraction - hide the inner implementation details, and we just need to know the method to call
- abstraction in java can be achieved in two ways - **abstract classes** and **interfaces**
- the `abstract` keyword is used for abstract classes and abstract methods
- abstract methods can only be present in abstract classes / interfaces
- abstract methods can not be private or final, which is obvious since they have to be overridden
- abstract methods do not have a body
- abstract classes can not be instantiated
- so in order to use abstract classes, they have to act like a super class
- an interface can only have `public static final` fields
- interface methods are public and abstract by default
- if we declare `private` or `default` methods in an interface, we have to provide a body
- interfaces can `extend` other interfaces, subclasses can `implement` multiple interfaces
- just like abstract classes, interfaces can not be instantiated
- subclasses should implement all abstract methods in the interface / abstract classes that they inherit from

# Association

association is of two types - aggregation and composition

### Aggregation

- follows the **has-a** relationship
- the lifetime of the owned object does not depend on the lifetime of the owner
- the owner object just contains a reference to the owned object, so deleting the owner object has no effect on the owned object whatsoever
- e.g. person object containing a reference to country

### Composition

- follows the **part-of** relationship
- the lifetime of the owned object depends on the lifetime of the owner
- the owner object itself creates and maintains the objects of the owned classes
- e.g. car object maintaining objects of windows, wheels, etc.
