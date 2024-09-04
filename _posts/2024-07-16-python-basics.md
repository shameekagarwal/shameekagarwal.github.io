---
title: Python Basics
---

## Getting Started

- python3 vs python2 - python3 is **not** backwards compatible - a lot of big changes were made
- it addresses a lot of issues with python2, and the world has moved to python3 now
- checking the version - `python3 --version`
- entering the interactive shell in python - type `python3` and hit enter
- this is are also call **repl** - read, evaluate, print loop
- this is why, when we enter 43 + 1, it will read, evaluate and finally print the result. then, the prompt comes up again
- exiting the interactive shell - ctrl + D
- run a python file using `python3 file_name.py`

## Numbers & Operators

- three data types of numbers in python - int, floats and complex numbers - 
  ```txt
  print(type(1))  # <class 'int'>
  print(type(1.1))  # <class 'float'>
  ```
- type coercion - an operation between an int and a float returns a float
- division returns a float, unlike other programming languages
  ```txt
  print(1 / 2) # 0.5
  ```
- for exponents (or roots by raising to fractions) - 
  ```txt
  print(2 ** 3)  # 8
  print(8 ** (1 / 3))  # 2.0
  ```
- modulo - gives the remainder
  ```txt
  print(8 % 3)  # 2
  ```
- integer division - 
  ```txt
  print(10 // 3)  # 3
  ```

## Variables and Data Types

- **variables** - store some data and pull it out later
- some reasons why we need variables
  - data can dynamic and need not be static - e.g. when we pull the data from database
  - even for static data, it makes code more readable - e.g. imagine using a variable pi vs the actual number itself in code
- points about assignment of variables - 
  - variables can be reassigned
  - variables can be assigned to other variables
- variable naming restrictions - 
  - start with letter or underscore
  - rest of it can be letters, numbers, underscores
- variable naming conventions - 
  - snake case is preferred
  - lowercase is preferred (use uppercase for constants)
  - typically, variables starting or ending with two underscores (called dunder) indicate that it is used for something internal and should not be fiddled with
- some **data types** - boolean, [number related data types](#numbers--operators), strings, lists, dictionary, etc
- **dynamic typing** - variables can change data types. most other languages are **statically typed**
  ```txt
  variable = True
  print(type(variable))  # <class 'bool'>

  variable = "shameek"
  print(type(variable))  # <class 'str'>
  ```
- **None** - used to represent nothingness - equivalent of null in other languages
  ```txt
  nothing = None
  print(type(nothing))  # <class 'NoneType'>
  ```
- strings can be represented using single or double quotes
- strings in python are **unicode** (not just ascii)
- **escape sequences** like `\n` etc are supported as well
- string concatenation - 
  ```txt
  print("hello, " + "shameek")  # hello, shameek
  ```
- **formatted strings** - used to **interpolate** variables
  ```txt
  username = "shameek"
  password = "keemahs"
  print(f'logging in user {username} using password {password}')
  # logging in user shameek using password keemahs
  ```
- **string indexing** - remember that python supports negative indices as well
  ```txt
  name = "hello"
  print(name[0])  # h
  print(name[-1])  # o
  print(name[5])  # IndexError: string index out of range
  ```
- **type conversion** - we already saw this in coercion, string interpolation, etc. but we can do this **explicitly** as well - 
  ```txt
  variable = 50.456
  print(int(variable))  # 50

  variable = [1, 2, 3, 4]
  print(str(variable))  # [1, 2, 3, 4]
  ```
- example of taking an input from a user. notice how we use type conversion to convert the string input to a float
  ```txt
  kms = float(input("enter kms: "))

  miles = kms / 1.6
  miles_formatted = round(miles, 2)

  print(f"{kms} kms = {miles_formatted} miles")
  ```

## Boolean and Conditional Logic

- **conditional statements** - take different paths based on comparison of input
  ```txt
  if name == "arya stark":
      print("all men must die")
  elif name == "jon snow":
      print("you know nothing")
  else:
      print("carry on")
  ```
- apart from **comparison operators** that resolve to truthy or falsy, the following examples resolve to falsy as well - 
  - empty (strings, lists, objects, etc)
  - None
  - zero
  
  ```txt
  if 0:
    print("falsy")
  else:
      print("truthy")  # this gets printed
  ```

- **comparison operators** - `==`, `!=`, `>`, `<`, `>=`, `<=`
- **logical operators** - combine booleans. `and`, `or`, `not`
- `is` vs `==` - feels like the same as **comparing by reference** vs **comparing by value**
  ```txt
  print(1 == 1)  # True
  print(1 == 1)  # True

  print([1, 2, 3] == [1, 2, 3])  # True
  print([1, 2, 3] is [1, 2, 3])  # False

  my_list = [1, 2, 3]
  my_list_clone = my_list
  print(my_list_clone is my_list)  # True
  ```

## Looping

- **for loops** - loop over a collection of data like every item of a list, every character of a string, etc
- [**iterable object**](#iterators) - the collection of data we loop over
  ```txt
  for letter in "coffee":
      print(letter)
  # c o f f e e
  ```
- **range** - quickly generate numbers in a certain range - 
  - range(7) - 0 to 6
  - range(1, 8) - 1 to 7
  - range(1, 10, 2) - 1 3 5 7 9
 
  ```txt
  for i in range(1, 5):
      print(i)
  # 1 2 3 4
  ```
- **while loop** - continue executing while the conditional statement is truthy
  ```txt
  password = input("enter password: ")
  
  while password != "bananas":
      password = input("wrong, please re-enter password: ")
  
  print("authenticated successfully!")
  ```
- we also have **break** in python if we need it

## Lists

- **lists** - **ordered** collection of items
- it is a **data structure** - a combination of [**data types**](#variables-and-data-types)
- we can add / remove items, reorder items, etc in a list
- a list can contain different data types
- e.g. of using len - 
  ```txt
  demo_list = [1, True, 4.5, "bca"]

  print(len(demo_list))  # 4
  ```
- iterable objects like a range can be converted to a list as well - 
  ```txt
  rng = range(1, 4)
  print(rng)  # range(1, 4)

  lst = list(rng)
  print(lst)  # [1, 2, 3]
  ```
- **accessing data** - remember that negative indexing is supported in python as well. on exceeding the bounds, we get an index error
  ```txt
  friends = ["Ashley", "Matt", "Michael"]

  print(friends[1])  # Matt
  print(friends[3])  # IndexError: list index out of range

  print(friends[-1])  # Michael
  print(friends[-4])  # IndexError: list index out of range
  ```
- use **in** too check if a value is present in a list
  ```txt
  print("Ashley" in friends)  # True
  print("Violet" in friends)  # False
  ```
- **iterating** over lists - 
  ```txt
  friends = ["Ashley", "Matt", "Michael"]

  for friend in friends:
      print(friend)
  ```
- use **append** for adding a single element / **extend** for adding multiple elements
  ```txt
  nums = [1, 2, 3]

  nums.append(4)
  print(nums)  # [1, 2, 3, 4]

  nums.extend([5, 6, 7])
  print(nums)  # [1, 2, 3, 4, 5, 6, 7]
  ```
- use **insert** to add an element at a specific position
  ```txt
  nums = [1, 2, 3]
  
  nums.insert(2, 4)
  print(nums)  # [1, 2, 4, 3]
  ```
- **clear** - delete all items from the list
  ```txt
  nums = [1, 2, 3]
  
  nums.clear()
  print(nums)  # []
  ```
- **pop** - remove the last element / remove element from the specified index
  ```txt
  nums = [1, 2, 3, 4]
  
  removed_element = nums.pop()
  print(f"removed = {removed_element}, nums = {nums}")  # removed = 4, nums = [1, 2, 3]
  
  removed_element = nums.pop(1)
  print(f"removed = {removed_element}, nums = {nums}")  # removed = 2, nums = [1, 3]
  ```
- **remove** - specify the element to delete, and its first occurrence is removed
  ```txt
  nums = [1, 2, 3, 2, 1]
  nums.remove(1)
  print(nums)  # [2, 3, 2, 1]
  ```
- **index** - return the (first?) index where the specified value is present
  - we can specify the range of indices - start and end between which it should look for
  - throws an error if not present

  ```txt
  numbers = [1, 2, 4, 3, 5, 4, 5, 2, 1]
  
  print(numbers.index(4))  # 2
  print(numbers.index(4, 3, 6))  # 5
  print(numbers.index(21))  # ValueError: 21 is not in list
  ```
- **count** - number of times the element occurs in the list
  ```txt
  numbers = [1, 2, 4, 3, 5, 4, 5, 2, 1]
  
  print(numbers.count(4))  # 2
  print(numbers.count(21))  # 0
  ```
- **reverse** to reverse the list - in place
- **sort** - sort the elements, again in place
  ```txt
  numbers = [2, 1, 4, 3]
  numbers.sort()
  print(numbers)  # [1, 2, 3, 4]
  ```
- **join** - concatenate the elements of the string using the specified separator
  ```txt
  words = ["hello", "to", "one", "and", "all", "present"]
  sentence = ' '.join(words)
  print(sentence)  # hello to one and all present
  ```
- **slicing** (works on strings as well) - allows us to make copies. we provide three *optional* pieces of information - start, stop and step
  ```txt
  numbers = [1, 2, 3, 4, 5, 6]

  print(numbers[:])  # [1, 2, 3, 4, 5, 6]
  print(numbers[1:])  # [2, 3, 4, 5, 6]
  print(numbers[:2])  # [1, 2]
  print(numbers[1:5])  # [2, 3, 4, 5]
  print(numbers[1:5:2])  # [2, 4]
  ```
- we can use negative steps to go backwards as well when slicing. a common use case - reverse the list (not in place)
  ```txt
  nums = [1, 2, 3, 4]
  print(nums[::-1])  # [4, 3, 2, 1]
  ```
- shorthand in python for swapping elements of a list - 
  ```txt
  numbers = [1, 2, 3]

  numbers[0], numbers[2] = numbers[2], numbers[0]
  print(numbers)  # [3, 2, 1]
  ```
- destructuring lists - 
  ```txt
  a, b, c = [1, 2, 3]
  print(f"{a} {b} {c}")
  ```

### Comprehensions

- also applicable to tuples etc
- shorthand of doing it via for loop manually. basic syntax - 
  ```txt
  nums = [1, 2, 3]
  nums_mul_10 = [x * 10 for x in nums]
  print(nums_mul_10)  # [10, 20, 30]
  ```
- list comprehension with conditionals - 
  ```txt
  nums = list(range(1, 10))
  odds = [num for num in nums if num % 2 != 0]
  print(odds)  # [1, 3, 5, 7, 9]
  ```
- the first condition below determines how to map the element. think of it like a ternary expression. the second condition acts like a filter, like the one we saw in the example above
  ```txt
  nums = list(range(1, 10))
  mapped = ["3x" if num % 3 == 0 else str(num) for num in nums if num % 2 == 1]
  print(mapped)  # ['1', '3x', '5', '7', '3x']
  ```
- list comprehension with strings - 
  ```txt
  all_characters = "the quick big brown fox jumps over the lazy dog"
  vowels = [character for character in all_characters if character in "aeiou"]
  print(vowels)  # ['e', 'u', 'i', 'i', 'o', 'o', 'u', 'o', 'e', 'e', 'a', 'o']
  ```
- nested list comprehensions - e.g. we would like to generate a combination of all suits and values for generating cards - 
  ```txt
  possible_suits = ("Hearts", "Diamonds", "Clubs", "Spades")
  possible_values = ("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K")

  cards = [f"{value} of {suit}" for suit in possible_suits for value in possible_values]

  print(cards)

  # ['A of Hearts',
  # '2 of Hearts',
  # '3 of Hearts',
  # ...
  # 'J of Spades',
  # 'Q of Spades',
  # 'K of Spades']
  ```
- note - because we did not surround the first list inside square braces, we got a flattened list automatically. for obtaining a list of lists, we could use the following instead - 
  ```txt
  cards = [[f"{value} of {suit}" for suit in possible_suits] for value in possible_values]

  # [['A of Hearts', 'A of Diamonds', 'A of Clubs', 'A of Spades'],
  # ...
  # ['K of Hearts', 'K of Diamonds', 'K of Clubs', 'K of Spades']]
  ```

## Dictionaries

- helps describing data with detail - e.g. item in a shopping cart has attributes like product, quantity
- it uses **key value pairs** - in lists, keys are the indices
  ```txt
  cat = {
      "name": "bubbles",
      "age": 3.5,
      "color": "blue"
  }
  
  print(type(cat))  # <class 'dict'>
  print(cat)  # {'name': 'bubbles', 'age': 3.5, 'color': 'blue'}
  ```
- we can pass an iterable of iterables of length 2 to dict as well. it will create a dictionary for us automatically, by using the first element as the key and the second element as the value - 
  ```txt
  print(dict([("shameek", 25), ("colt", "45")]))  # {'shameek': 25, 'colt': '45'}
  ```
- so, if we had a list of keys and another list of values, we can construct a dictionary out of them as follows - `dict(zip(keys, values))`
- accessing data - similar to how we do it in lists. notice the `KeyError` if the key is not present 
  ```txt
  cat = {"name": "bubbles", "age": 3.5, "color": "blue"}
  
  print(cat["name"])  # bubbles
  print(cat["not_present"])  # KeyError: 'not_present'
  ```
- accessing all elements of dictionary - 
  ```txt
  cat = {"name": "bubbles", "age": 3.5, "color": "blue"}

  print(cat.values())  # dict_values(['bubbles', 3.5, 'blue'])
  print(cat.keys())  # dict_keys(['name', 'age', 'color'])
  print(cat.items())  # dict_items([('name', 'bubbles'), ('age', 3.5), ('color', 'blue')])
  ```
- now, we can use for loops for the iterables we saw above - 
  ```txt
  cat = {"name": "bubbles", "age": 3.5, "color": "blue"}
 
  for key, value in cat.items():
      print(f'{key} => {value}')
  
  # name => bubbles
  # age => 3.5
  # color => blue
  ```
- check the presence of a key in the dictionary - 
  ```txt
  cat = {"name": "bubbles", "age": 3.5, "color": "blue"}

  print("name" in cat)  # True
  print("phone" in cat)  # False
  ```
- check if a value is present in a dictionary - since values returns an iterable data structure, we can use in again, like we used in [**lists**](#lists)
  ```txt
  cat = {"name": "bubbles", "age": 3.5, "color": "blue"}

  print("blue" in cat.values())  # True
  print("purple" in cat.values())  # False
  ```
- **clear** - to clear a dictionary
- **copy** - to clone a dictionary. notice the difference in outputs between outputs of `is` vs `==`, discussed [here](#boolean-and-conditional-logic)
  ```txt
  cat = {"name": "bubbles", "age": 3.5, "color": "blue"}
  copy_cat = cat.copy()
  
  print(cat is copy_cat)  # False
  print(cat == copy_cat)  # True
  ```
- **get** - return value if key is present, else return None
  ```txt
  user = {"name": "shameek", "age": 25}

  print(user.get("name"))  # shameek
  print(user.get("phone"))  # None
  ```
- now, get can also accept a default value - 
  ```txt
  print(user.get("phone", "+916290885679"))  # +916290885679
  ```
- **pop** - remove the key value pair from the dictionary for the key passed. it also returns the value removed
  ```txt
  user = {"name": "shameek", "age": 25}
 
  print(user.pop("name"))  # shameek
  print(user)  # {'age': 25}
  print(user.pop("email"))  # KeyError: 'email'
  ```
- we can add / update values like this - 
  ```txt
  user = {"name": "shameek"}
  
  user["age"] = 25
  user["name"] = "shameek agarwal"
  print(user)  # {'name': 'shameek agarwal', 'age': 25}
  ```
- **update** - modify value if the key is already present, else add the key value pair to the dictionary
  ```txt
  user = {"first_name": "shameek", "age": 2}
  user.update({"last_name": "agarwal", "age": 25})
  print(user)  # {'first_name': 'shameek', 'age': 25, 'last_name': 'agarwal'}
  ```
- dictionary comprehension example - look how we obtain both key and value, use `.items` and use curly instead of square braces. rest of the things stay the same
  ```txt
  numbers = {'one': 1, 'two': 2, 'three': 3}
  powers = {f'{key}^{value}': value ** value for key, value in numbers.items()}
  print(powers)  # {'one^1': 1, 'two^2': 4, 'three^3': 27}
  ```
- map values in list 1 to values in another list - 
  ```txt
  list1 = ["CA", "NJ", "RI"]
  list2 = ["California", "New Jersey", "Rhode Island"]

  answer = {list1[i]: list2[i] for i in range(0,3)}
  ```

## Tuples

- difference from list - it is **immutable** - we cannot simply insert / remove elements etc
  ```txt
  numbers = (1, 2, 3, 4)

  print(type(numbers))  # <class 'tuple'>
  numbers[0] = 5  # TypeError: 'tuple' object does not support item assignment
  ```
- due to features like immutability, tuples are generally faster than lists
- note - tuples can also be used as keys in a dictionary, while lists cannot. so, tuples are useful if we want to have an ordered collection as a key in a dictionary
  ```txt
  hotels_tuple = {
      (23.4, 90.1): "taj",
      (75.11, 69.2): "oberoi"
  }
  
  print(hotels_tuple)  # {(23.4, 90.1): 'taj', (75.11, 69.2): 'oberoi'}
  
  hotels_list = {
      [23.4, 90.1]: "taj",
      [75.11, 69.2]: "oberoi"
  }
  
  print(hotels_list)  # TypeError: unhashable type: 'list'
  ```
- accessing elements using square braces, using a for loop to iterate, using methods like count, index, len, slicing, etc work the same way like they do in [**lists**](#lists)
- inter conversions in python is easy - 
  ```txt
  my_list = [1, 2, 3]
  print(tuple(my_list))  # (1, 2, 3)
  
  my_tuple = (1, 2, 3)
  print(list(my_tuple))  # [1, 2, 3]
  ```
- note - if we want to make a tuple with one element only, python treats it as the parentheses used for explicit priority in mathematical expressions etc. so, put a comma at the end as well
  ```txt
  tuple_incorrect = (1)
  print(tuple_incorrect)  # 1
  
  tuple_correct = (1,)
  print(tuple_correct)  # (1,)
  ```

## Sets

- **no duplicates**
- **no ordering**, so we cannot access elements by index etc
- e.g. of creating a set - 
  ```txt
  uniques = {1, 1, 2, 1, 2, 3, 1, 2, 3, 3, 3, 2, 1, 1, 2}
  print(uniques)
  ```
- methods like add, remove, etc work like in list whilst ensuring no duplicates
- discard vs remove - discard does not fail, but returns null instead
  ```txt
  numbers = {1, 2, 3}

  print(numbers.discard(4))  # None
  print(numbers.remove(4))  # KeyError: 4
  ```
- set math - things like intersection, union, difference, etc
  ```txt
  nums_a = {1, 2, 3, 4}
  nums_b = {3, 4, 5, 6}
  
  print(nums_a.intersection(nums_b))  # {3, 4}
  print(nums_a.union(nums_b))  # {1, 2, 3, 4, 5, 6}
  print(nums_a.difference(nums_b))  # {1, 2}
  ```

## Functions

- reusable piece of logic, which we can call using different inputs to get different outputs
  - helps keep code dry
  - helps abstract away complexities
- example of a basic function - notice the default return value is None
  ```txt
  def sing_happy_birthday():
      print("happy birthday dear you")
  
  
  result = sing_happy_birthday()  # happy birthday dear you
  print(result)  # None
  ```
- functions with parameters - 
  ```txt
  def sing_happy_birthday(name):
      print(f"happy birthday dear {name}")
  
  
  sing_happy_birthday("shameek")  # happy birthday dear shameek
  ```
- **parameters** - variables used in the method definitions
- **arguments** - data we pass to the parameters
- **default parameters** - promotes defensive programming, can improve flexibility and readability, e.g. pop in lists pops from end if an index is not specified
  ```txt
  def exponent(base, power=2):
      return base ** power
  
  
  print(exponent(5, 3))  # 125
  print(exponent(3))  # 9
  ```
- **keyword arguments** - what we saw till now is called **positional arguments**. the following style of passing arguments is called **keyword arguments**, and it allows for even more flexibility - 
  ```txt
  def exponent(base, power=2):
    return base ** power


  print(exponent(power=5, base=2))  # 32
  ```
- **scope** - variables created in a function are scoped to that function only
  ```txt
  def speak():
      sound = "hello"


  speak()
  print(sound)  # NameError: name 'sound' is not defined. Did you mean: 'round'?
  ```
- **global** - variables not defined inside a function are global. however, we get an error below - 
  ```txt
  total = 0
  
  
  def increment():
      total += 1  # UnboundLocalError: local variable 'total' referenced before assignment
  
  
  increment()
  print(total)
  ```
- we need to tell our function at the beginning that it actually refers to the global variable - 
  ```txt
  total = 0
  
  
  def increment():
      global total
      total += 1
  
  
  increment()
  print(total)  # 1
  ```
- similarly, for inner functions to access variables of outer functions, we use **non local** - 
  ```txt
  def outer():
      counter = 1

      def inner():
          nonlocal counter
          counter += 1

      inner()

      return counter


  print(outer())
  ```
- python example to check if a string is a palindrome. note - "a man a plan a canal Panama" is a palindrome as well - since we ignore white spaces and want case insensitive
  ```txt
  def is_palindrome(sentence):
      characters = [x.lower() for x in sentence if x != ' ']
      return characters == list(reversed(characters))
      # or return characters == characters[::-1]
  ```

### Args, Kwargs and Unpacking

- `*args` - allows us to pass **variable number** of **positional arguments**
  ```txt
  def sum_except_first(num1, *args):
      print(f"skipping {num1}")
      return sum(args)


  print(sum_except_first(1))  # 0
  print(sum_except_first(1, 2, 3, 4))  # 9
  ```
- `**kwargs` - allows us to pass **variable number** of **keyword arguments**
  ```txt
  def fav_colors(**kwargs):
      print(kwargs)
  
  
  fav_colors(shameek="red", colt="purple")  # {'shameek': 'red', 'colt': 'purple'}
  ```
- e.g. use case - combine a word with its prefix and suffix if provided - 
  ```txt
  # Define combine_words below:
  def combine_words(word, **kwargs):
      return kwargs.get("prefix", "") + word + kwargs.get("suffix", "")


  print(combine_words("child"))  # 'child'
  print(combine_words("child", prefix="man"))  # 'manchild'
  print(combine_words("child", suffix="ish"))  # 'childish'
  print(combine_words("work", suffix="er"))  # 'worker'
  print(combine_words("work", prefix="home"))  # 'homework'
  ```
- note - args and kwargs are just conventions inside python, we can name them differently as well
- the order of parameters should be as follows - 
  - normal parameters
  - `*args`
  - default parameters
  - `**kwargs`
- **unpacking args** - we can unpack the arguments in a list while passing it to a function as follows - 
  ```txt
  def unpack_add(a, b, c):
    return a + b + c


  numbers = [1, 2, 3]
  print(unpack_add(*numbers))
  ```
- now, we can extend this functionality to `*args` as well. when we pass a list without unpacking, args ends up being a tuple, with the first argument as the list itself. however, we get the desired functionality when we unpack the list while passing it to the function
  ```txt
  def adder(*args):
      return sum(args)
  
  
  numbers = [1, 2, 3, 4]
  print(adder(numbers))  # TypeError: unsupported operand type(s) for +: 'int' and 'list'
  print(adder(*numbers))  # 10
  ```
- similarly, we can unpack dictionaries as well -
  ```txt
  def get_display_name(first_name, last_name):
      return f"{first_name} {last_name}"
  
  
  user = {"first_name": "shameek", "last_name": "agarwal"}
  
  print(get_display_name(**user))  # shameek agarwal
  ```
- notice how though unpacking and args / kwargs can be combined, they are separate things
- combining unpacking and kwargs - 
  ```txt
  def get_display_name(**kwargs):
      return f"{kwargs.get('first_name')} {kwargs.get('last_name')}"
  
  
  user = {"first_name": "shameek", "last_name": "agarwal"}
  
  print(get_display_name(**user))  # shameek agarwal
  ```

### Lambdas & Builtin Functions

- **lambdas** - functions that are short, one line expressions
  ```txt
  square = lambda num: num ** 2
  add = lambda a, b: a + b
  
  print(square(3))  # 9
  print(add(4, 9))  # 13
  ```
- lambdas are useful when we for e.g. want to pass small functions as a callback to other functions
- **map** - accepts a function and an iterable. it then runs the function for each value in the iterable
- my understanding - it returns a map object which while iterable, has limited functionality. that is why we again convert it to a list. this is a common theme in all functions we see now - zip returns zip object, map returns map object and so on. we convert these special objects to a list manually
  ```txt
  numbers = [1, 2, 3, 4]
  doubled = list(map(lambda x: x * 2, numbers))
  print(doubled)
  ```
- **filter** - filter out elements of the iterable that do not satisfy the condition
- it is possible to do this map and filter using [comprehensions](#comprehensions) as well, which is a bit more readable. it depends on use case
- **all** - return true if all elements of the iterable are truthy. if iterable is empty, return true
- **any** - return true if any element of the iterable is truthy. if iterable is empty, return false
  ```txt
  numbers = [1, 2, 3, 4]
  print([num > 0 for num in numbers])  # [True, True, True, True]
  
  print(all([num > 0 for num in numbers]))  # True
  print(all([num > 1 for num in numbers]))  # False
  
  print(any([num > 0 for num in numbers]))  # True
  print(any([num > 4 for num in numbers]))  # False
  ```
- **sorted** - accept an iterable and returns a new iterable with the sorted elements. notice the difference between sorted and the **sort** we saw in [lists](#lists) - sorted is not in place, sort is
  ```txt
  numbers = [1, 2, 3, 4]
  
  print(sorted(numbers))  # [1, 2, 3, 4]
  print(f'stays the same: {numbers}')  # stays the same: [1, 2, 3, 4]
  print(sorted(numbers, reverse=True))  # [4, 3, 2, 1]
  ```
- specify custom sorting logic -
  ```txt
  users = [
      {"username": "samuel", "tweets": ["I love cake", "I love pie", "hello world!"]},
      {"username": "katie", "tweets": ["I love my cat"]},
      {"username": "jeff", "tweets": [], "color": "purple"},
      {"username": "bob123", "tweets": [], "num": 10, "color": "teal"},
      {"username": "doggo_luvr", "tweets": ["dogs are the best", "I'm hungry"]},
      {"username": "guitar_gal", "tweets": []}
  ]

  print(sorted(users, key=lambda user: user["username"]))
  # [
  #     {'username': 'bob123', 'tweets': [], 'num': 10, 'color': 'teal'},
  #     {'username': 'doggo_luvr', 'tweets': ['dogs are the best', "I'm hungry"]},
  #     {'username': 'guitar_gal', 'tweets': []},
  #     {'username': 'jeff', 'tweets': [], 'color': 'purple'},
  #     {'username': 'katie', 'tweets': ['I love my cat']},
  #     {'username': 'samuel', 'tweets': ['I love cake', 'I love pie', 'hello world!']}
  # ]
  ```
- **max** - find the max in iterable etc. i think works for *args as well based on the first example
  ```txt
  print(max(3, 1, 4, 2))  # 4
  print(max([3, 1, 4, 2]))  # 4
  ```
- custom logic for max - 
  ```txt
  names = ['arya', 'samson', 'tim', 'dory', 'oleander']
  print(max(names, key=lambda name: len(name)))  # oleander
  ```
- **reversed** - again, unlike the **reverse** we saw in [lists](#lists), this does not do it in place
  ```txt
  numbers = [1, 2, 3, 4]
  print(list(reversed(numbers)))  # [4, 3, 2, 1]

  for i in reversed(range(5)):
      print(i)
  # 4 3 2 1 0
  ```
- **len** - length of iterable. e.g. calling it on a dictionary will return the number of keys it has -
  ```txt
  print(len({"name": "shameek", "age": 25, "profession": "IT"}))  # 3
  print(len([1, 2, 3, 4, 5]))  # 5
  ```
- **abs**, **round**, **sum** - all self explanatory. notice how we can provide sum with an initial value as well
  ```txt
  print(abs(-4))  # 4
  print(abs(4))  # 4
  
  print(sum([1, 2, 3, 4], 5))  # 15
  print(sum((2.0, 4.5)))  # 6.5

  print(round(5.4123, 2))  # 5.41
  print(round(1.2, 3))  # 1.2
  ```
- **zip** - makes an iterator that aggregates elements from each of the iterators i.e. ith tuple contains the ith element from each of the iterator. the iterator stops when the shortest iterator is exhausted
  ```txt
  numbers = [1, 2, 3, 4, 5]
  squares = [1, 4, 9]
  print(zip(numbers, squares))  # <zip object at 0x797350050f00>
  print(list(zip(numbers, squares)))  # [(1, 1), (2, 4), (3, 9)]
  ```
- a slightly complex example of combining zip with [unpacking](#args-kwargs-and-unpacking). we unpacks the list, and it essentially means we are passing several tuples to zip. so, first element of all tuples are combined to form the first element, and second element of all tuples are combined to form the second element
  ```txt
  tuples = [(1, 2), (3, 4), (5, 6), (7, 8), (9, 10)]
  print(list(zip(*tuples)))  # [(1, 3, 5, 7, 9), (2, 4, 6, 8, 10)]
  ```
- e.g. we have a list of students, and their attempts in two exams. we want a dictionary keyed by student names, and their final score which is the best of the two attempts - 
  ```txt
  # question
  attempt_1 = [80, 91, 78]
  attempt_2 = [98, 89, 53]
  students = ["dan", "ang", "kate"]
 
  # solution
  final_scores = map(max, zip(attempt_1, attempt_2))
  final_scores_by_student = dict(zip(students, final_scores))
  print(final_scores_by_student)  # {'dan': 98, 'ang': 91, 'kate': 78}
  ```  

## Error Handling

- we can raise our own error using `raise`
  ```txt
  raise ValueError("a value error")  # ValueError: a value error
  ```
- if we raise an error like this, the code execution stops immediately. we can use try blocks to handle errors and then continue the program execution
  ```txt
  try:
      foobar
  except:
      print("an error occurred")
  print("after try block")

  # an error occurred
  # after try block
  ```
- the above is an example of a **catch all** block - it will handle all errors the same way, which is not advisable. we can handle specific errors as follows - 
  ```txt
  def get(d, key):
      try:
          return d[key]
      except KeyError:
          print("key does not exist")
          return None
  
  
  user = {"name": "shameek"}
  
  print(get(user, "name"))  # shameek
  print(get(user, "phone"))  # key does not exist, None
  ```
- if the whole **try** block runs successfully, the **else** part is executed, otherwise the except part is executed if an error matches
- **finally** is always executed no matter what
- we can capture the actual error using **as**
  ```txt
  def divide(a, b):
      try:
          result = a / b
      except TypeError as err:
          print("arguments should be ints or floats")
          print(err)
      except ZeroDivisionError:
          print("do not divide by zero")
      else:
          print(f"{a}/{b} = {result}")
      finally:
          print("execution complete")
  ```
  - divide(5, 2) - 
    ```txt
    5/2 = 2.5
    execution complete
    ```
  - divide("a", 2)
    ```txt
    arguments should be ints or floats
    unsupported operand type(s) for /: 'str' and 'int'
    execution complete
    ```
  - divide(5, 0)
    ```txt
    do not divide by zero
    execution complete
    ```
- catching multiple errors using a single catch block - 
  ```txt
  except (TypeError, ZeroDivisionError) as err:
      print(err)
  ```

## Debugging

- debugging using ides is straightforward, we just create breakpoints and run the program in debug mode
- but we can also use a tool called **pdb** - **python debugger**
- the code up to before `pdb.set_trace()`
  ```txt
  import pdb
  
  first = "shameek"
  last = "agarwal"
  
  pdb.set_trace()
  
  prefix = "mr."
  greeting = f"hi {prefix} {first} {last}, how can i help you?"
  print(greeting)
  ```
- common commands - 
  - **n** - **next** - i think this is like step over in intellij
  - **c** - **continue** - i think it continues execution normally, and maybe stops at the next breakpoint?
  - **l** - shows us the line in code where the execution is paused
- we can enter expressions like we do in the top bar in intellij to inspect variables, evaluate expressions, etc

## Modules

- **reuse code** across different files by importing, improves readability, etc
- **built in modules** - come with python, so we do not need to download them. but, we do need to import them explicitly to be able to use them
  ```txt
  import random
  
  print(random.choice(["rock", "paper", "scissors"]))
  ```
- we can alias the import to use it under a different name as well
  ```txt
  import random as rand
 
  print(rand.choice(["rock", "paper", "scissors"]))
  ```
- instead of importing everything, we can also import only parts that we need. note - also refer below for different functionality inside random module - 
  ```txt
  from random import choice, randint, shuffle
  
  print(choice(["rock", "paper", "scissors"]))  # paper
  print(randint(0, 2))  # 2

  numbers = [1, 2, 3, 4, 5]
  shuffle(numbers)
  print(numbers)  # [5, 4, 1, 2, 3]
  ```
- note - we can use `*` to import everything, but this is generally not advisable
- we can also alias these specific parts just like we aliased `random` using `rand`
- **custom modules** - we can simply import functions without exporting them -  
  - bananas.py - 
    ```txt
    def get_banana():
        return "yummy banana dipped in chocolate"
    ```
  - modules.py - 
    ```txt
    import bananas

    print(bananas.get_banana())
    ```
- **external modules** - we can download them from pypi - **python package index**. they are 3rd party modules which we can use
- command to install - `python -m pip install autopep8`
- **autopep8** - formats python code. to format, use - `autopep8 --in-place --aggressive --aggressive external_modules.py`
- note - above, we configure aggressiveness with level 2. a lower level would for e.g. only make whitespace changes and nothing else

### name

- `__name__` - it is set to `__main__` if the current file is run i.e. we use `python3 file.py`, else it is set to the name of the file
- say_sup.py - 
  ```txt
  def say_sup():
      print(f"sup! i am in {__name__}")


  say_sup()
  ```
- say_hi.py - 
  ```txt
  from say_sup import say_sup


  def say_hi():
      print(f"hi! i am in {__name__}")


  say_hi()
  say_sup()
  ```
- output - 
  ```txt
  sup! i am in say_sup
  hi! i am in __main__
  sup! i am in say_sup
  ```
- output line 1 - the code inside the module(s) being imported are run first. say_sup.py is run, which calls `say_sup`
- output line 2 and 3 - current file is being executed. say_hi.py is run, where we call `say_hi` and `say_sup`
- to prevent line 1, we can change say_sup.py as follows - 
  ```txt
  def say_sup():
      print(f"sup! i am in {__name__}")


  if __name__ == "__main__":
      say_sup()
  ```
- now, running say_hi.py gives the following output - 
  ```txt
  hi! i am in __main__
  sup! i am in say_sup
  ```
- while running say_sup.py gives continues to give the following output - 
  ```txt
  sup! i am in __main__
  ```

## HTTP Requests

- **requests** - the library that is commonly used for making requests
- when we call `response.json()`, the response is converted to a python dictionary
- an example combining requests parameters etc below

```txt
import requests
from random import choice

url = "https://icanhazdadjoke.com/search"

topic = input("enter topic to get jokes for: ")

response = requests.get(
    url,
    headers={"Accept": "application/json"},
    params={"term": topic}
)

if response.status_code == 200:

    data = response.json()
    jokes = list(map(lambda joke: joke["joke"], data['results']))

    if len(jokes) > 0:
        print(f"i got {len(jokes)} joke(s) for the topic you searched for. here is one:")
        print(choice(data["results"])["joke"])
    else:
        print(f"uh oh, no jokes found for '{topic}', try another topic")

# enter topic to get jokes for: rat
# i got 2 joke(s) for the topic you searched for. here is one:
# Why couldn't the kid see the pirate movie? Because it was rated arrr!
```

## Object Oriented Programming

- **classes** - attempts to model anything in the real world that is tangible (or non-tangible) via programming
- **classes** are like blueprints for **objects**. **objects** are instances of a **class**
- when we were creating lists or even int, we were basically creating objects of int / list classes
- goal - make a hierarchy of the classes after identifying the different entities
- note - visibility modifiers like private etc are not supported by python - so, we prefix variables and methods not meant to be touched from outside the class with underscores instead
- defining a class. note - `pass` acts like a placeholder, it helps us stay syntactically correct, and the idea is that we revisit it later
  ```txt
  class User:
    pass
  ```
- creating objects for this class -
  ```txt
  user1 = User()
  print(user1)  # <__main__.User object at 0x77e693863040>
  ```
- **self** - refers to the instance. technically, we can name it something else, but self is pretty much the standard everywhere
- self must be the first parameter to all the methods of a class
- **init** - called when we instantiate the class
  ```txt
  class User:
      def __init__(self, name):
          self.name = name


  user1 = User("shameek", 25)
  print(user1.name)  # shameek
  ```
- methods starting and ending with `__` are typically used by built in methods of python, and we typically override them
- so, for custom private methods / variables, we can prefix with a single `_`
- **name mangling** - when we prefix attributes with a `__`, python internally prepends it with the class name. helps distinguish in case they are overridden by child class. this has been discussed later
  ```txt
  class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        self._secret = "hint (convention): do not access me directly"
        self.__profession = "unemployed"


  user1 = User("shameek", 25)
  print(user1._secret)  # hint (convention): do not access me directly
  print(user1._User__profession)  # unemployed
  print(user1.__profession)  # AttributeError: 'User' object has no attribute '__profession'. Did you mean: '_User__profession'?
  ```
- adding **instance methods** - 
  ```txt
  # ....
    def greeting(self):
        return f"hi {self.name}!"

  print(user1.greeting())  # hi shameek!
  ```
- till now, we have seen **instance attributes** and **instance methods**, now we discuss **class attributes** and **class methods**
- class attributes / methods exist directly on the class and are shared across instances
- defining class attributes - 
  ```txt
  class User:
      active_users = 0
    
      # ...
  ```
- accessing class attributes from instance methods or outside - 
  ```txt
  # ...
    def __init__(self, name, age):
        self.name = name
        self.age = age
        User.active_users += 1

  print(f"active users = {User.active_users}")  # active users = 0
  user1 = User("shameek", 25)
  user2 = User("colt", 50)
  print(f"active users = {User.active_users}")  # active users = 2
  ```
- all objects in python get their unique id which python assigns. we can check that both users point to the same active_users int object as follows. note - this also makes me think that python probably doesn't really differentiate between primitive and non primitive types
  ```txt
  print(id(user1.active_users))  # 134256650092816
  print(id(user2.active_users))  # 134256650092816
  ```
- note - above shows that we can access class attributes via the instance as well. even self inside the class can be used to access the class attributes. accessing via the class however, improves readability
- class methods - decorate with `@classmethod`. the first argument it receives is **cls** and not self. look at the print statements below to understand the difference
  ```txt
  class User:
      active_users = 0

      def __init__(self, name, age):
          print(self)
          self.name = name
          self.age = age
          User.active_users += 1

      @classmethod
      def get_active_users(cls):
          print(cls)
          return cls.active_users


  user1 = User("shameek", 25)
  user2 = User("colt", 50)
  print(User.get_active_users())

  # <__main__.User object at 0x718a83b63eb0>
  # <__main__.User object at 0x718a83b63e50>
  # <class '__main__.User'>
  # 2
  ```
- another example, like a factory method - 
  ```txt
  # ...

    @classmethod
    def create(cls, csv_row):
        name, age = csv_row.split(",")
        return cls(name, age)

  user3 = User.create("shameek,25")
  print(user3.name)  # shameek
  print(user3.age)  # 25
  ```
- **repr** is one of the several ways to provide a string representation - 
  ```txt
  # ...
    def __repr__(self):
        return f"{self.name} aged {self.age}"

  print(user3)  # shameek aged 25
  string_repr = str(user3)
  print(string_repr)  # shameek aged 25
  ```
- **properties** - helps use getter and setter methods underneath, while clients interact with them like normal attributes. advantage - when our getter / setter logic has some complexity underneath and simple assignment / accessing is not enough
  ```txt
  class Human:
      def __init__(self, first_name, last_name):
          self.first_name = first_name
          self.last_name = last_name

      @property
      def full_name(self):
          return f"{self.first_name} {self.last_name}"

      @full_name.setter
      def full_name(self, full_name):
          self.first_name, self.last_name = full_name.split(" ")


  shameek = Human("", "")
  print(f"{shameek.first_name}, {shameek.last_name}, {shameek.full_name}")  # , ,

  shameek.full_name = "shameek agarwal"
  print(f"{shameek.first_name}, {shameek.last_name}, {shameek.full_name}")  # shameek, agarwal, shameek agarwal
  ```
- there is a handy **dict** attribute we can access to look at the instance attributes of the class - 
  ```txt
  class Human:
      def __init__(self, first_name, last_name):
          self.first_name = first_name
          self.last_name = last_name


  human = Human("shameek", "agarwal")
  print(human.__dict__)  # {'first_name': 'shameek', 'last_name': 'agarwal'}
  ```

### Inheritance

- notice how instance variables / methods of superclass are accessible from child class -
  ```txt
  class Animal:

      def __init__(self):
          self.is_animal = True

      def make_sound(self, sound):
          print(f"i say {sound}")


  class Cat(Animal):
      pass


  cat = Cat()
  print(cat.is_animal)  # True
  cat.make_sound("meow")  # i say meow
  ```
- **is instance** returns true for the parent class as well
  ```txt
  print(isinstance(cat, Cat))  # True
  print(isinstance(cat, Animal))  # True
  ```
- calling superclass init from subclass
  ```txt
  class Animal:

      def __init__(self, species, name):
          self.species = species
          self.name = name

      def __repr__(self):
          return f"{self.name} is a {self.species}"


  class Cat(Animal):

      def __init__(self, name, breed, favourite_toy):
          super().__init__("cat", name)
          self.breed = breed
          self.favourite_toy = favourite_toy


  blue = Cat("blue", "scottish fold", "string")
  print(blue)  # blue is a cat
  ```
- multiple inheritance explained with output - 
  ```txt
  class Aquatic:
      def __init__(self, name):
          print("init of aquatic")
          self.name = name

      def swim(self):
          print(f"{self.name} is swimming")

      def greet(self):
          print(f"{self.name}, king of the ocean")


  class Ambulatory:
      def __init__(self, name):
          print("init of ambulatory")
          self.name = name

      def walk(self):
          print(f"{self.name} is walking")

      def greet(self):
          print(f"{self.name}, king of the land")


  class Penguin(Aquatic, Ambulatory):
      def __init__(self):
          print("init of penguin")
          super().__init__("pingu")


  pingu = Penguin()  # init of penguin, init of aquatic

  pingu.swim()  # pingu is swimming
  pingu.walk()  # pingu is walking

  pingu.greet()  # pingu, king of the ocean
  ```
- instance methods from both are inherited - we are able to call both walk and swim
- in cases of instance methods like greet defined in both, aquatic is taking preference
- aquatic's init is being called when we use super in subclass
- **mro** or **method resolution order** - the order in which python is going to look for methods
- the underlying algorithm is complex, but we can inspect it using the mro method on classes
  ```txt
  print(Penguin.__mro__)
  # (<class '__main__.Penguin'>, <class '__main__.Aquatic'>, <class '__main__.Ambulatory'>, <class 'object'>)
  ```
- so maybe this decides what order to traverse superclasses in when super is used / what superclass will be ultimately used when an instance method is referenced
- as a resolve, e.g. if we want to call init for both classes, instead of using super, we can reference the class directly
  ```txt
  # ...
  class Penguin(Aquatic, Ambulatory):
 
      def __init__(self):
          print("init of penguin")
          # super().__init__("pingu")
          Aquatic.__init__(self, "pingu")
          Ambulatory.__init__(self, "pingu")
  # ...

  pingu = Penguin()  # init of penguin, init of aquatic, init of ambulatory
  ```
- now, if we understand mro further - if the init in our superclass is enough - we can skip the init in the subclass altogether, because due to mro, the superclass init will be automatically called by python if its subclass does not have an init

### Polymorphism

- **method overriding** - method in superclass rewritten in subclass
- **polymorphism** - same method works in different ways depending on the object
  ```txt
  class Animal:
      def speak(self):
          raise NotImplementedError("subclasses need to override this method")


  class Dog(Animal):
      def speak(self):
          return "woof"


  class Cat(Animal):
      def speak(self):
          return "meow"


  dog = Dog()
  print(dog.speak())  # woof

  cat = Cat()
  print(cat.speak())  # meow
  ```
- probably an extension of this is seen in **magic methods** - when we use `+`, it behaves differently depending on the [**data type**](#variables-and-data-types) - int vs string. `+` calls `__add__` underneath. `len` works in a similar manner
  ```txt
  class Human:

      def __init__(self, name, height):
          self.name = name
          self.height = height

      def __len__(self):
          return self.height

      def __add__(self, other):
          return Human("newborn", self.height + other.height)


  human = Human("kevin", 65)
  print(len(human))  # 65

  new_human = human + Human("jenny", 60)
  print(len(new_human))  # 125
  ```

## Iterators

- **iterator** - it returns one element at a time when **next** is called on it
- **iterable** - an object that can return an iterator
- at the end, **stop iteration** error is raised
- this is also the working mechanism of for each loops that we use
- a custom for loop implementation - 
  ```txt
  def custom_for(iterable, function):
      custom_iterator = iter(iterable)

      while True:
          try:
              element = next(custom_iterator)
          except StopIteration:
              print("end of iteration...")
              break
          else:
              function(element)


  custom_for("hey", print)

  # h
  # e
  # y
  # end of iteration...
  ```
- making a custom class as iterable - 
  ```txt
  class Counter:

      def __init__(self, low, high):
          self.low = low
          self.high = high

      def __iter__(self):
          return iter(range(self.low, self.high))


  counter = Counter(1, 5)
  for x in counter:
      print(x, end=' ')  # 1 2 3 4
  ```
- going a step further and customizing next. my understanding - calling `iter()` will now give the counter instance itself. now, python will keep calling next on the iterator. basically, our iterator and iterable instances are the same now
  ```txt
  def __iter__(self):
      return self

  def __next__(self):
      if self.low < self.high:
          self.low += 1
          return self.low - 1
      raise StopIteration
  ```
- one issue i felt with the approach above - we can only iterate through it once. reason - maybe because we return the "same iterator instance" every time, once the low becomes equal to high, we cannot start iterating once again. e.g. see how the second call to iterate does not print anything - 
  ```txt
  def iterate(custom_iterator):
      for x in custom_iterator:
          print(x, end=' ')
      print()


  counter = Counter(1, 5)
  iterate(counter)  # 1 2 3 4
  iterate(counter)  #
  ```
- so, i instead tried returning a copy of the current instance from `__iter__`, and it worked - 
  ```txt
  from copy import copy

  # ...

    def __iter__(self):
        return copy(self)

  # ...

  iterate(counter)  # 1 2 3 4
  iterate(counter)  # 1 2 3 4
  ```

## Generators

- **generators** - a subset of **iterators**
- **generator functions** - use **yield** instead of return keyword, and can yield **multiple** times
- once python sees the yield keyword anywhere in the function, it knows that it needs to return a **generator**
- summary - generator functions return a generator, and generators are a type of iterator
- yield is like a pause - the function stops executing, and resumes from after the yield statement when **next** is called on the generator again
- i am guessing that the usual `StopIteration` is raised when the end of function is reached and no more yields are found
  ```txt
  def counter(up_to):
      count = 1

      while count <= up_to:
          yield count
          count += 1


  three_counter = counter(3)

  print(three_counter)  # <generator object counter at 0x7bfa2e542420>

  print(next(three_counter))  # 1
  print(next(three_counter))  # 2
  print(next(three_counter))  # 3
  print(next(three_counter))  # StopIteration
  ```
- we can also use our usual for loop now, since a generator is an iterator - 
  ```txt
  three_counter = counter(3)

  for i in three_counter:
      print(i, end=' ')  # 1 2 3
  ```
- an example of a use case for a generator - assume as a client, i were to iterate over all fibonacci numbers from 1 to n by making a call to a library, so the library has to return an iterator
  - option 1 - return a populated list
  - option 2 - use a generator
- to toggle between the options below, comment / uncomment lines related to result / yield. we measure the memory usage between the two. reason for the difference - generators only need to store the state of the current execution's variables, while the list needs to be pre populated entirely upfront
  ```txt
  import resource


  def fibonacci(n):
      x, y, count = 0, 1, 1
      # result = []

      while count <= n:
          yield x
          # result.append(x)
          x, y = y, x + y
          count += 1

      # return result


  def show_usage(label):
      usage = resource.getrusage(resource.RUSAGE_SELF)
      print(f"{label}: mem={usage[2] / 1024.0}mb")


  show_usage("before")
  for i in fibonacci(100000):
      pass
  show_usage("after")
  ```
  ![generators iterators](/assets/img/python-basics/generators-iterators.png)
- **generator expressions** - it is a shorter way of using generators compared to generator functions
  - using generator functions - 
    ```txt
    def get_multiples(base=1, number_of_multiples=10):
        result = base
    
        while number_of_multiples > 0:
            yield result
            result += base
            number_of_multiples -= 1
    
    
    for i in get_multiples(2, 3):
        print(i)
    ```
  - using generator expressions - 
    ```txt
    def get_multiples(base=1, number_of_multiples=10):
        return (base * multiple for multiple in range(1, number_of_multiples + 1))
    
    
    for i in get_multiples(2, 3):
        print(i)
    ```
- we already saw this in the fibonacci example, but in general, prefer generators if possible instead of lists etc - using generators would be more efficient in terms of memory, performance, etc, if we only want to iterate through it once. use lists if we want to perform complex operations like append etc further down the line - 
  ```txt
  print(sum(i for i in range(100000000)))  # faster / more optimal than
  print(sum([i for i in range(100000000)]))
  ```

## File IO

- **reading files** - we read files using **open** function, which returns a **file** object. then, the file object can be used to access metadata / access its content using **read**
  ```txt
  file = open("story.txt")
  content = file.read()

  print(content)  # prints the contents of the file
  ```
- if we call read twice, the second read returns an empty string, because the **cursor** has already reached the end of the file after the first read
  ```txt
  file = open("story.txt")
  print("read1: ", file.read())  # read1: contents of the file
  print("read2: ", file.read())  # read2: <<empty>> 
  ```
- this also means that for e.g. if we add two lines to story.txt between the first and the second read, the second read will only display these two new lines
- we can use **seek** to set the position of the cursor
  ```txt
  file = open("story.txt")
  print("read1: ", file.read())  # read1: contents of the file
  file.seek(0)
  print("read2: ", file.read())  # read2: contents of the file
  ```
- **read line** - read line by line - it reads till a new line character is encountered - 
  ```txt
  file = open("story.txt")
  print(f"line 1: {file.readline()}")
  print(f"line 2: {file.readline()}")
  print(f"line 3: {file.readline()}")
  ```
- **read lines** - returns us a list, where each element represents a line in the file
- we need to close files manually to avoid using system resources - `file.close()`
- **with** blocks - we do not have to handle closing of resource etc when using with blocks - 
  ```txt
  with open("story.txt") as file:
      lines = file.readlines()
      print(f"total lines in file = {len(lines)}")
  ```
- **writing to files** -it also creates the file anew if it does not already exist 
  ```txt
  with open("story.txt", "w") as file:
      file.write("this was added via python\n")
      file.write("this overwrites the file completely")
  ```
- write also overwrites the file completely, and does not append to the end. to append to the end, use "a" for the append mode flag
- we can use "r+" for mode to both read and write simultaneously

## Pickling

- imagine we have a class as follows - 
  ```txt
  class Human:

      def __init__(self, name, age):
          self.name = name
          self.age = age

      def celebrate_birthday(self):
          print(f"happy birthday {self.name}")
          self.age += 1
  ```
- **pickling** serializing and storing the state of python objects. use case - saving the state across application restarts etc
  ```txt
  shameek = Human("shameek", 24)

  with open("human.pickle", "wb") as file:
      pickle.dump(shameek, file)
  ```
- **unpickling** is the reverse, deserialization process. understand how python is constructing an object of the right class for us, so we are able to interact with instance methods etc as well
  ```txt
  with open("human.pickle", "rb") as file:
      shameek = pickle.load(file)
      shameek.celebrate_birthday()  # happy birthday shameek
      print(f"{shameek.name} aged {shameek.age}")  # shameek aged 25
  ```
- simply change method calls to `pickle.dump(iterable, file)` etc when interacting with a collection
- [**jsonpickle**](https://pypi.org/project/jsonpickle/) - the pickle library works with binary - e.g. the modes we used were **rb** / **wb**, etc. if we want the file to be json instead, we use this library. advantage - readable, useful for serving via rest api etc. disadvantage - less efficient compared to binary

## CSV

- we use [file io](#file-io) in combination with the **csv module** to interact with csvs
- if we use the **reader**, each row is represented as a list of strings. first row is included as well. the trick used here is to manually call next once on the iterator
  ```txt
  with open("fighters.csv") as file:
      fighters_csv = reader(file)
      header = next(fighters_csv)

      for row in fighters_csv:
          print(row)

  # ['Ryu', 'Japan', '175']
  # ['Ken', 'USA', '175']
  # ['Chun-Li', 'China', '165']
  # ['Guile', 'USA', '182']
  ```
- if we use **dict reader**, each row is represented as a dictionary. keys are constructed using the first row
  ```txt
  with open("fighters.csv") as file:
      fighters_csv = DictReader(file)

      for row in fighters_csv:
          print(row)

  # {'Name': 'Ryu', 'Country': 'Japan', 'Height (in cm)': '175'}
  # {'Name': 'Ken', 'Country': 'USA', 'Height (in cm)': '175'}
  # {'Name': 'Chun-Li', 'Country': 'China', 'Height (in cm)': '165'}
  # {'Name': 'Guile', 'Country': 'USA', 'Height (in cm)': '182'}
  ```
- writing to csv files - since i wanted to just add a row and not overwrite the row entirely, i opened it in **append mode**. opening using **write mode** would have overwritten the file entirely with just the one row that i specified - 
  ```txt
  with open("fighters.csv", "a") as file:
      fighters_csv = writer(file)
      fighters_csv.writerow(["Shameek", "India", "165"])
  ```
- writing using **dict writer** - 
  ```txt
  with open("people.csv", "w") as file:

      fieldnames = ["name", "age"]

      fighters_csv = DictWriter(file, fieldnames=fieldnames)
      fighters_csv.writeheader()

      fighters_csv.writerow({"name": "shameek", "age": 25})
      fighters_csv.writerow({"name": "colt", "age": 50})
  ```
- assume csv has two columns - first and last name. return the row number of the row that matches the given values. note how we use the **enumerate** function 
  ```txt
  import csv

  def find_user(first_name, last_name):
      with open("users.csv") as file:
          csv_reader = csv.reader(file)
          header = next(csv_reader)
          for index, row in enumerate(csv_reader):
              if row[0] == first_name and row[1] == last_name:
                  return index + 1
          return 'Not Here not found.'
  ```
- note, my understanding - we should iterate one by one for efficiency since it is an iterator, instead of converting the iterator to a list

## Decorators

- **decorators** are **higher order functions** i.e. functions that wrap other functions to enhance their behavior
- doing this manually - e.g. we create a polite version of our introduction function 
  ```txt
  def be_polite(fn):
      def wrapped():
          print("what a pleasure to meet you")
          fn()
          print("have a great day")

      return wrapped


  def introduction():
      print("my name is shameek")


  polite_introduction = be_polite(introduction)
  polite_introduction()

  # what a pleasure to meet you
  # my name is shameek
  # have a great day
  ```
- using decorators - i just need to annotate `introduction` with `be_polite`, and python takes care of the rest. notice how we simply call introduction now for the same functionality 
  ```txt
  @be_polite
  def introduction():
      print("my name is shameek")

  introduction()

  # what a pleasure to meet you
  # my name is shameek
  # have a great day
  ```
- right now, `introduction` does not accept any arguments, therefore `wrapped` could also stay empty. what if we had multiple functions with different **method signatures**? how can we make the `wrapped` returned from `be_polite` flexible? using [**args and kwargs**](#args-kwargs-and-unpacking)
  ```txt
  def be_polite(fn):
      def wrapped(*args, **kwargs):
          print("what a pleasure to meet you")
          result = fn(*args, **kwargs)
          print("have a great day")
          return result

      return wrapped


  @be_polite
  def introduction():
      print("my name is shameek")


  @be_polite
  def greet(name, age):
      print(f"i am {name} aged {age}, you?")


  introduction()  # what a pleasure to meet you | my name is shameek | have a great day
  greet("shameek", 25)  # what a pleasure to meet you | i am shameek aged 25, you? | have a great day
  ```
- one problem - when we print the name of the decorated function, try accessing the docstring of the decorated function, etc - we see details for `wrapped`, and not `introduction` -
  ```txt
  print(introduction.__name__)  # wrapped
  ```
- solution - we use **wraps** decorator on wrapped
  ```txt
  from functools import wraps


  def be_polite(fn):
      @wraps(fn)
      def wrapped(*args, **kwargs):
      # ...

  print(introduction.__name__)  # introduction
  ```

- a practical example - benchmarking to see difference between lists and generators - 
  ```txt
  import time
  from functools import wraps


  def speed_test(fn):
      @wraps(fn)
      def wrapped(*args, **kwargs):
          start_time = time.time()
          print(f"executing {fn.__name__}")
          result = fn(*args, **kwargs)
          time_taken = time.time() - start_time
          print(f"time taken: {time_taken}")
          return result

      return wrapped


  @speed_test
  def using_lists(end):
      return sum([i * i for i in range(end)])


  @speed_test
  def using_generators(end):
      return sum(i * i for i in range(end))


  print(using_lists(100_000_000))
  print(using_generators(100_000_000))
  ```  
  ![python basics](/assets/img/python-basics/decorators.png)

### Decorators with Arguments

- my understanding - till now, we were using this - `@decorator`
- but now we want to do this - `@decorator(arg1, arg2, ...)`
- so, it is almost like now, we are making a function call. so, another layer of function needs to be returned
- below is a complex example i took a stab at, so not sure about the correctness 😛
- we want to ensure the types of arguments passed to a function using a decorator - 
  ```txt
  from functools import wraps


  def enforce(*types):
      def outer_wrapper(fn):
          @wraps(fn)
          def inner_wrapper(*args, **kwargs):
              arg_types = types[:len(args)]
              kwarg_types = types[len(args):]

              arg_types_match = all(isinstance(arg, type_of_arg) for type_of_arg, arg in zip(arg_types, args))
              kwarg_types_match = all(isinstance(arg, type_of_kwarg) for type_of_kwarg, arg in zip(kwarg_types, kwargs.values()))

              if (not arg_types_match) or (not kwarg_types_match):
                  raise ValueError("argument types do not match")

              return fn(*args, **kwargs)

          return inner_wrapper

      return outer_wrapper
  ```
- e.g. of using this decorator - the second one fails because the type expected for the second argument is integer, while we send in a string -
  ```txt
  @enforce(str, int)
  def printer(name, age):
      print(f"i am {name} aged {age}")

  printer("shameek", age=25)  # i am shameek aged 25
  printer("shameek", age="25")  # ValueError: argument types do not match
  ```

## Testing

- helps reduce bugs - e.g. when changes are made to existing code that results in unintended effects. our tests can help catch these bugs early
- **tdd** or **test driven development** - write tests first, and write code to have these tests pass
- we can use **assert** to make assertions - it returns None if the expression is truthy, raises an AssertionError otherwise. we can also specify the error message to use inside the assertion error
  ```txt
  assert 1 == 1
  assert 1 == 2
  assert 1 == 2, "validation failed"
  ```
- problem with assert - if we run it in optimized mode (`python3 -O test_example.py`), all the assert statements are ignored, and the code continues to execute normally
  ```txt
  def say_hi(name):
      assert name == "Colt", "I only say hi to Colt!"
      return f"Hi, {name}!"

  print(say_hi("Charlie"))  # Hi, Charlie!
  ```
- **doctests** - also improves readability of modules exposed to clients - 
  ```txt
  def add(a, b):
      """
      >>> add(2,3)
      6

      >>> add(2,"shameek")
      Traceback (most recent call last):
      ...
      TypeError: unsupported operand type(s) for +: 'int' and 'str'
      """
      return a + b
  ```
- to run doctests, use the following command - `python3 -m doctest -v test_example.py`. it will show that first test will fail, since expected is 6 but actual is 5
- disadvantage - very finicky - even a simple whitespace can fail a perfect valid test
- **unit testing** - test small standalone components of classes, instead of testing interaction between different components / entire applications in one go
- assume we have the below file -
  ```txt
  def eat(food, is_healthy):
      reason = "it is good for me" if is_healthy else "you only live once"
      return f"i am eating {food} because {reason}"
  ```
- we create a new test file, where we import the different functionalities and test it as follows
  ```txt
  from test_example import eat
  import unittest


  class ActivitiesTest(unittest.TestCase):

      def test_eat_healthy(self):
          self.assertEqual(eat("broccoli", True), "i am eating broccoli because it is good for me")

      def test_eat_unhealthy(self):
          self.assertEqual(eat("pizza", False), "i am eating pizza because you only live once")


  if __name__ == "__main__":
      unittest.main()
  ```
- note - i think unittest looks for methods with prefix test
- we run the file containing tests like we would normally run a python file. if we add the verbose flag, the name of the tests being executed are also displayed
  ```txt
  python3 test_example_tests.py -v
  ```
- we also have other variations of assert like **true** / **false**, **in** / **not in**, **raises** (for asserting on type of error thrown) etc. e.g. below, we deal all the cards first, and then expect a value error to be thrown if we try dealing a card
  ```txt
  # ...
    def test__given_full_deck__when_5_cards_are_dealt__then_5_cards_are_returned(self):
        self.deck.deal_hand(self.deck.count())

        with self.assertRaisesRegex(ValueError, 'All cards have been dealt'):
            self.deck.deal_card()
  ```
- **hooks** - run code before or after tests - creating database connections, adding fake data, etc. we need to override methods for this - 
  ```txt
  # ...
    def setUp(self):
        self.deck = Deck()

    def test__given_deck__when_count__then_52_is_returned(self):
        self.assertEqual(self.deck.count(), 52)
  
    def tearDown(self):
        pass
  ```

## Web Scraping

- programmatically download web pages, extract it and then use that data
- used when data from servers is not in the form of json
- as a best practice, we should refer the robots.txt of websites to see what paths they want to allow vs disallow scraping. e.g. refer [this](https://www.imdb.com/robots.txt) before scraping imdb. however, this is just a best practice, and nothing is stopping us from scraping publicly available websites
- the library used is **beautiful soup** - `python -m pip install bs4`
- we read from an html file and interact with the beautiful soup object
  ```txt
  from bs4 import BeautifulSoup

  with open("mocked.html") as html_file:
      html_content = html_file.read()

  soup = BeautifulSoup(html_content, "html.parser")

  print(soup.find("div"))  # <div data-example="yes">bye</div>
  print(type(soup.find("div")))  # <class 'bs4.element.Tag'>
  ```
- notice that while it prints the exact div when we use the print statement, it is not stored as a string, but a beautiful soup tag underneath
- i think using `find` returns the first match, while using `find_all` returns all matches. here, we see matching using id, class and a custom attribute
  ```txt
  print(soup.find_all(class_="special"))  # [<li class="special">This list item is special.</li>]
  print(soup.find_all(id="first"))  # [<div id="first"></div>]
  print(soup.find_all(attrs={"data-example": "yes"}))  # [<h3 data-example="yes">hi</h3>]
  ```
- we can use css selectors as well. my understanding - `select` works like `find_all`, `select_one` works like `find`
  ```txt
  print(soup.select(".special"))  # [<li class="special">This list item is special.</li>]
  print(soup.select("#first"))  # [<div id="first"></div>]
  print(soup.select("[data-example='yes']"))  # [<h3 data-example="yes">hi</h3>]
  ```
- understanding selectors more - to check if an attribute is "present", use one of the below - 
  ```txt
  print(soup.find_all(attrs={"data-example": True}))  # [<h3 data-example="yes">hi</h3>]
  print(soup.select("[data-example]"))  # [<h3 data-example="yes">hi</h3>]
  ```
- getting the inner text of an element - 
  ```txt
  print(soup.select_one("#first").get_text())
  ```
- accessing attributes like class, id, etc - `attrs`, which is a dict, has access to all of them
  ```txt
  print(soup.select_one("#first").attrs["id"])  # first
  print(soup.select_one("[data-example]").attrs)  # {'data-example': 'yes'}
  ```
- **contents** - shows the contents of a tag. if we see carefully, it also considers new line as children
  ```txt
  print(soup.body.contents)
  # ['\n', <div id="first"></div>, '\n', <ol></ol>, '\n', <div data-example="yes">bye</div>, '\n']
  ```
- we might need to navigate to siblings. remember the new lines we saw in the previous point, it is reflected in the example below
  ```txt
  print(soup.select_one("#first").next_sibling)  # <<empty line>>
  print(soup.select_one("#first").next_sibling.next_sibling)  # <ol>...</ol>
  ```
- this is why, the **find** variants might be better, since they ignore the new line characters. notice how we did not have to chain the **next sibling** call twice this time around, since **find next sibling** is sufficient
  ```txt
  print(soup.select_one("#first").find_next_sibling())  # <ol>...</ol>
  ```
- find next sibling using a specific selector - 
  ```txt
  print(soup.select_one("#first").find_next_sibling(attrs={"data-example": True}))  # <div data-example="yes">bye</div>
  ```
- till now, we were navigating to next sibling(s). similarly, we can do for previous sibling(s), parent, etc

## Virtual Environment

- helps maintain separate and isolated environments for python projects
- manage dependencies and different versions across projects without conflicts
- had to first install this for venv functionality - `sudo apt install python3.10-venv`
- command to create a virtual environment - `python3 -m venv env`
- we can name it anything, env is the convention
- activate the virtual environment - `source ./env/bin/activate`. the shell prompt is now prefixed with `(env)`
- to deactivate the virtual environment, simply run `deactivate`
- listing the installed packages - `pip ls`
- installing packages - `pip install requests`
- now, the idea is we typically save all the dependencies in a file like requirements.txt
- we commit this file to version control, for others to be able to use the exact same version
- generating requirements.txt - `pip freeze > requirements.txt`
- my understanding - the workflow for someone else starting afresh will look like this - 
  - clone the git repository
  - create the virtual environment in the same folder
  - activate the virtual environment
  - run `pip install -r requirements.txt`
