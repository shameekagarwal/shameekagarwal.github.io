---
title: Python Data Analysis
---

## Jupyter Notebooks

- **jupyter** - web based environment for notebook documents
- allows to have python code along with headings, charts, tables, etc
- the entire flow -
  - there is a notebook server running on our terminal bts
  - what we do in the browser is communicated to this server to be executed
  - finally, the output is returned to be displayed in the browser
- **anaconda** - automates setup of a lot of data science related libraries etc on our computer
- the steps i used to install anaconda on my linux pc is [here](https://docs.anaconda.com/anaconda/install/linux/)
- i also had to run `conda config --set auto_activate_base False` to prevent the environment from being activated on terminal startup
- activate the environment in shell using `source ~/anaconda3/bin/activate`
- to [install packages](https://docs.anaconda.com/working-with-conda/packages/install-packages/), use `conda install <<package-name>>`
- to run the jupyter notebook, type `jupyter-notebook` in shell
- i am doing all of this from the folder where i want to store my notebooks
- when i created a new **notebook**, i could see that importing pandas and matplotlib was working by default without me installing anything
- execute a cell by using the run button / using shift + enter. it executes the current cell and
  - inserts a new cell below if it is the last cell
  - moves to the next cell below if it is not the last cell
- to only execute the current cell, use cmd + enter
- jupyter notebooks have autosave
- to shut down, use - file -> shutdown or cmd + c on the terminal where we ran jupyter-notebook
- all the code in a cell is executed, but the output is only shown for the last line in the cell
- there are two kinds of mode - **command mode** and **editing mode**
  - go into command mode by clicking anywhere outside / hitting escape
  - go into editing mode by clicking inside a cell / hitting enter when focus is on a cell
- actions like inserting cells etc can be done using shortcuts when in command mode
- we can navigate through cells using up and down arrow keys when in command mode
- use "a" insert a cell above, "b" to insert a cell below
- use "dd" to delete a cell
- undo cell operation e.g. undo deleting a cell using "z", redo a cell operation using shift + z
- a notebook can have different kinds of **cells** - e.g. code cells, markdown cells, etc. there is a dropdown that lets us select the type of the current cell
- we have a little restart icon which we can use to restart the kernel / stop button to interrupt the kernel. use case - e.g. if one cell ends up executing an infinite loop, we will not be able to execute any other cell
- we can run all the cells from top to bottom using run -> run all cells
- to see the documentation of something -
  - `pd.read_csv` - ensure cursor is somewhere on read_csv and do shift + tab - this opens the documentation in a popup
  - `pd.read_csv?` - this can be the last statement in a cell, and then the documentation is displayed in the output. the output cell might be bigger and easier to browse through than a popup

## Dataframes and Datasets

- textual data can be stored in csv, json, sql, etc
- **dataframes** - 2 dimensional data - rows and columns
- in jupyter, we can take a brief look at the data as seen by pandas using the following - 
  ```txt
  house_data = pd.read_csv("data/kc_house_data.csv")
  house_data
  ```
- by default, pandas shows us the first 5 and last 5 rows, and first 10 and last 10 columns in jupyter. we can configure this however
- to view all the columns - `house_data.columns`
- to view the number of rows - `len(house_data)`
- to see the number of rows and columns in one go - 
  ```txt
  house_data.shape
  # (21613, 21)
  ```
- we can construct a new dataframe using the for e.g. first x / last x rows of the existing dataframe
  ```txt
  first_7 = house_data.head(7)
  last_6 = house_data.tail(6)
  ```
- by default, pandas will assign data types using the following logic - if it is numeric, assign int if data has no decimals, else float. everything else is assigned to the object data type
- we can view these datatypes assigned by pandas using `info`. note it also shows the number of rows having null value for that column, the index information, the memory used, etc
  ```txt
  house_data.info()
  
  # <class 'pandas.core.frame.DataFrame'>
    # RangeIndex: 21613 entries, 0 to 21612
  # Data columns (total 21 columns):
  #  #   Column         Non-Null Count  Dtype  
  # ---  ------         --------------  -----  
  #  0   id             21613 non-null  int64  
  #  1   date           21613 non-null  object 
  #  2   price          21613 non-null  float64
  #  3   bedrooms       21613 non-null  int64  
  # ...
  # memory usage: 3.5+ MB
  ```
- specifying a separator manually if the separator used in csv is not comma -
  ```txt
  netflix = pd.read_csv("data/netflix_titles.csv", sep="|")
  netflix
  ```
- if we want to provide custom column names, we use `names`. in this case, the first row already had the headers but not in a format we liked, so we also pass 0 for the `header` attribute, so that pandas can skip the first row, and use the column names we provide
  ```txt
  headers = ('sumlev', 'region', 'division', 'state', 'name')

  nst = pd.read_csv("data/nst-est2020.csv", names=headers, header=0)
  nst
  ```
- finally, if we would like to use one of the existing columns as the index column, we can specify that as well using the index parameter
  ```txt
  mount_everest_deaths = pd.read_csv("data/mount_everest_deaths.csv", index_col="No.")
  mount_everest_deaths
  ```
- note - we can also pass in the column position instead of the column name for index col, like this - `index_col=0`

## Basic Operations

- finding the minimum / maximum - it returns a **series** data structure, and we get the min / max for every column when we perform this operation
  ```txt
  house_data.min()

  # id                       1000102
  # date             20140502T000000
  # price                    75000.0
  # bedrooms                       0
  # bathrooms                    0.0
  ```
- **sum** - sum all values. e.g. if a column has only holds a 1 or a 0, it gives us the number of values with a 1 for that attribute. for string like columns, it might concatenate them like strings. to prevent that, we also pass in the **numeric only** attribute
  ```txt
  house_data.sum(numeric_only=True)

  # price            1.167293e+10
  # bedrooms         7.285400e+04
  # bathrooms        4.570625e+04
  # sqft_living      4.495287e+07
  # sqft_lot         3.265069e+08
  # floors           3.229650e+04
  ```
- similarly, we also have **count** (gives the non null values for all columns), **mean**, **median** and **mode**
- **describe** - automatically gives a bunch of statistics around all numeric columns - 
  ```txt
  titanic.describe()

  #            pclass    survived       sibsp       parch
  # count 1309.000000 1309.000000 1309.000000 1309.000000
  # mean     2.294882    0.381971    0.498854    0.385027
  # std      0.837836    0.486055    1.041658    0.865560
  # min      1.000000    0.000000    0.000000    0.000000
  # 25%      2.000000    0.000000    0.000000    0.000000
  # 50%      3.000000    0.000000    0.000000    0.000000
  # 75%      3.000000    1.000000    1.000000    0.000000
  # max      3.000000    1.000000    8.000000    9.000000
  ```
- to get stats around non-numeric columns, we can set **include** to **object**. **top** gives the value that occurs the most number of times, while **freq** gives the number of times 
  ```txt
  titanic.describe(include = 'object')

  #                         name   sex   age    ticket  fare  cabin  embarked  boat  body  home.dest
  # count                   1309  1309  1309      1309  1309  1309       1309  1309  1309       1309
  # unique                  1307     2    99       929   282   187          4    28   122        370
  # top     Connolly, Miss. Kate  male     ?  CA. 2343  8.05     ?          S     ?     ?          ?
  # freq                       2   843   263        11    60  1014        914   823  1188        564
  ```

## Series and Columns

- selecting a single column -
  ```txt
  titanic["name"]

  # 0                         Allen, Miss. Elisabeth Walton
  # 1                        Allison, Master. Hudson Trevor
  #                              ...                       
  # 1307                                Zakarian, Mr. Ortin
  # 1308                                 Zimmerman, Mr. Leo
  ```
- note - this is of type **pandas series**
  ```txt
  type(titanic["name"])

  # pandas.core.series.Series
  ```
- **series** - one dimensional array with labels
- for instance, i think when we select a column, the labels are the index column of the dataframe. e.g. if i index the dataframe using show id -
  ```txt
  netflix_titles["type"]

  # show_id
  # s1         Movie
  # s2       TV Show
  #           ...   
  # s8806      Movie
  # s8807      Movie
  ```
- when we call functions like **sum** for instance (refer [above](#basic-operations))
  - the value in the series is the sum for every column
  - the labels are the column names
- functions like **describe** which returned a dataframe when called on a dataframe, will return a series when called on a series
- for functions like `sum` -
  - when calling sum on a dataframe, we got a series
  - when calling sum on a series, we will get a single value
  
  ```txt
  houses["price"].sum()  # 11672925008.0
  ```
- we can access the labels of a series using **index**, and the underlying values using **values** - 
  ```txt
  houses_min = houses.min()
  houses_min
  # id                       1000102
  # date             20140502T000000
  # price                    75000.0

  houses_min.index
  # Index(['id', 'date', 'price'], dtype='object')

  houses_min.values
  # array([1000102, '20140502T000000', 75000.0], dtype=object)
  ```

## Intermediate Operations

- **unique** - give the unique value in a series. the return type of such methods is numpy array
  ```txt
  houses["bedrooms"].unique()  # array([ 3,  2,  4,  5,  1,  6,  7,  0,  8,  9, 11, 10, 33])
  type(houses["bedrooms"].unique())  # numpy.ndarray
  ```
- **nunique** - number of unique values. by default, **dropna** is True
  ```txt
  netflix_titles["director"].nunique(), netflix_titles["director"].nunique(dropna=False)
  # (4528, 4529)
  ```
- **nlargest** - n largest values. by default, n is 5
  ```txt
  houses['price'].nlargest(n=7)

  # 7252    7700000.0
  # 3914    7062500.0
  # 9254    6885000.0
  # 4411    5570000.0
  # 1448    5350000.0
  # 1315    5300000.0
  # 1164    5110800.0
  ```
- caveat - handling duplicates - e.g. imagine class has 3 unique values - 1st class, 2nd class and 3rd class. when we call nlargest with n set to 709, we get 709 values, each with value 3. when we call it with 710, we get 709 values for 3, and 1 value for 2. but what if we wanted all values for the last value that comes when using nlargest? we can set the **keep** parameter. when keep is **all**, we get 986 total values, even though n was 710. other possible values for keep are **first** (default) and **last** (probably the last row with the value as 2nd class would be returned in this case?)
  ```txt
  len(titanic['pclass'].nlargest(709)), len(titanic['pclass'].nlargest(709, keep='all'))  # (709, 709)
  len(titanic['pclass'].nlargest(710)), len(titanic['pclass'].nlargest(710, keep='all'))  # (710, 986)
  ```
- similarly, we can call it on dataframes as well - we will need to specify the column names as well this time around though - 
  ```txt
  houses.nlargest(5, "price")

  #              id            date     price bedrooms
  # 7252 6762700020 20141013T000000 7700000.0        6
  # 3914 9808700762 20140611T000000 7062500.0        5
  # 9254 9208900037 20140919T000000 6885000.0        6
  ```
- we access a single column like this - `netflix_titles["title"]`. to access multiple columns, we can use the following syntax. note that even though we just pass one parameter, what we get back is still a dataframe, and not a series like we would get when using `netflix_titles["title"]`. note - remember that this creates a new dataframe
  ```txt
  netflix_titles[["title"]]

  #                         title
  # show_id
  # s1       Dick Johnson Is Dead
  # s2       Blood & Water
  # s3       Ganglands

  houses[["bedrooms", "bathrooms"]]

  #     bedrooms	bathrooms
  # 0          3       1.00
  # 1          3       2.25
  # 2          2       1.00
  ```
- **value counts** - counts of unique values. sorts in descending order of counts by default. we can use the **ascending** parameter to sort it in ascending order of counts
  ```txt
  houses["bedrooms"].value_counts()

  # 3     9824
  # 4     6882
  # 2     2760
  ```
- we can also have **value counts** for a **dataframe**. if we do it for all columns, we might end up having 1 value per row, as any two rows having same values for all columns is rare. we would typically perform this on a subset of columns like below. note - we still get back a series - it feels like the **label** of the series is comprised of multiple attributes, but it is still a pandas series and not a dataframe
  ```txt
  houses[["bedrooms", "bathrooms"]].value_counts()

  # bedrooms  bathrooms
  # 4         2.50         2502
  # 3         2.50         2357
  # 2         1.00         1558
  ```
- small note - there are multiple ways of doing a thing, maybe we should try being efficient. i make these mistakes frequently - using the first value in the output of value counts instead of using mode directly, etc - 
  - `sort_values("Attack").head(20)` vs `nsmallest(20, "Attack")`
  - `.value_counts().head(1).index[0]` vs `mode`

## Plotting Basics

- in case of a **series**, we plot **values** against **labels**. if i try to for e.g. do `houses["bedrooms"].plot()`, it would not make much sense, since we would be plotting number of bedrooms against an index that might be like a house identifier
- so, we can for e.g. plot value counts of bedrooms - this way, we would be plotting number of houses with the given number of bedrooms against number of bedrooms - as we see below, 3 bedrooms are the most common
  ```txt
  houses['bedrooms'].value_counts().plot(kind='bar')
  ```
  ![](/assets/img/python-data-analysis/plotting-basics-bedroom-value-counts.png)
- above, we tried plotting a pandas **series**. we can also plot **dataframes**
- e.g. try looking at the general distribution between bedrooms and bathrooms, by plotting one against another. we will have to customize both the x and y axis in this case, otherwise again, we might end up plotting all attributes against the autogenerated index
  ```txt
  houses.plot(x="bedrooms", y="bathrooms", kind="scatter")
  ```
  ![](/assets/img/python-data-analysis/houses-bedrooms-vs-bathrooms-scatter-plot.png)

## Index

- both **dataframes** and **series** in pandas have **labels** / **indices**
- by default, a **range index** is used - auto incrementing index that goes 0, 1, 2, and so on
- when we select a column in a dataframe, the labels used for the series is the same as the one used for the original dataframe
- e.g. if we have a csv containing the stock related data for a particular stock, we can set the index column to be date, to easily get the low and high price for a particular date. we can set the index to a column manually by calling **set index**. note - like most things, this too returns a new dataframe instead of mutating the original dataframe
  ```txt
  bitcoin["High"]
  # 0      147.488007
  # 1      146.929993
  # 2      139.889999


  bitcoin = bitcoin.set_index("Date")
  #                       High         Low          Open         Close
  # Date
  # 2013-04-29 23:59:59   147.488007   134.000000   134.444000   144.539993
  # 2013-04-30 23:59:59   146.929993   134.050003   144.000000   139.000000
  # 2013-05-01 23:59:59   139.889999   107.720001   139.000000   116.989998

  bitcoin["High"]
  # Date
  # 2013-04-29 23:59:59      147.488007
  # 2013-04-30 23:59:59      146.929993
  # 2013-05-01 23:59:59      139.889999
  ```
- if for e.g. we were to call `bitcoin["High"].plot()` after setting the index, the plot would make a lot more sense - high price against date, so how the price of bitcoin changed over days / years. without the re-indexing, it would display the price of bitcoin against an auto-incrementing integer, which would not have made much sense
- we can also do it when reading the csv using the **index col** parameter as seen [earlier](#dataframes-and-datasets)
  ```txt
  happiness_indexed = pd.read_csv("data/world-happiness-report-2021.csv", index_col="Country name")
  happiness_indexed

  #                   Healthy life expectancy  Freedom to make life choices
  # Country name  
  #      Finland                       72.000                         0.949
  #      Denmark                       72.700                         0.946
  #  Switzerland                       74.400                         0.919
  ```

## Sorting

- **sort values** - it is present both in series and dataframe. the default sort order is ascending. but, it is not in place. with most commands, i was reassigning the actual variable itself. there is another way to achieve this though when using these functions - passing in true for the **in place** argument
  ```txt
  happiness_indexed.sort_values("Healthy life expectancy", ascending=False, inplace=True)
  
  #               Healthy life expectancy  Freedom to make life choices
  # Country name
  #    Singapore                   76.953                         0.927
  #    Hong Kong                   76.820                         0.717
  #    Japan                       75.100                         0.796
  ```
- sorting by multiple columns - descending by number of bedrooms, ascending by number of bathrooms - 
  ```txt
  houses = pd.read_csv("data/kc_house_data.csv")
  houses.sort_values(["bedrooms", "bathrooms"], ascending=[False, True])

  #        bedrooms  bathrooms
  # 15870        33       1.75
  # 8757         11       3.00
  # 15161        10       2.00
  ```
- when sorting by a text column, e.g. name, the sorting will use the ascii value, so `Arjun` comes before `abhishek`. we can use the **key** function in pandas to provide a custom lambda to use when sorting rows - 
  ```txt
  titanic.sort_values("name", inplace=True, key=lambda name: name.str.lower())
  ```
- **sort index** - helps sort the data by the index / labels - 
  ```txt
  happiness.sort_index(inplace=True)
  ```
- we can call **sort values** / **sort index** on pandas series as well - the difference here is providing the column would not be required when sorting by values
- by default, value counts sorts on frequency. however, this might not make sense when we try to plot it - houses with 3 bedrooms would appear before houses with 1 bedroom on the x axis. so, we sort by the number of bedrooms i.e. the **index**
  ```txt
  bedrooms_stats = houses["bedrooms"].value_counts()
  bedrooms_stats

  # bedrooms
  # 3         9824
  # 4         6882
  # 2         2760
  # 5         1601
  # 6          272
  # 1          199

  bedrooms_stats.sort_index(inplace=True)
  bedrooms_stats.plot(kind="bar")
  ```
  ![](/assets/img/python-data-analysis/bedroom_sort_index_example.png)

## Indexing

- we already tried accessing data using columns. [using one column](#series-and-columns) gives us a pandas series, while [using multiple columns](#intermediate-operations) gives a dataframe. we only need a pair of square braces for accessing columns
- to access particular rows, we can use **loc** / **iloc**
- e.g. our data is indexed using country name. we can access the data for a particular country using loc. output format i believe is a series, where the labels are the column names
  ```txt
  happiness
  #                Healthy life expectancy   Freedom to make life choices
  # Country name
  # Afghanistan    52.493                    0.382
  # Albania        68.999                    0.785
  # Algeria        66.005                    0.480
  # Argentina      69.000                    0.828

  happiness.loc["Yemen"]
  # Healthy life expectancy        57.122
  # Freedom to make life choices   0.602
  ```
- just like when accessing columns, if we use an additional pair of square braces, we start getting a dataframe instead
  ```txt
  happiness.loc[["Yemen"]]

  #               Healthy life expectancy   Freedom to make life choices
  # Country name
  # Yemen                          57.122                          0.602
  ```
- we can also use **slicing** with **loc** - e.g. get all the rows between denmark to france. note - remember to sort using index first for this to work properly
  ```txt
  happiness.sort_index(inplace=True)
  happiness.loc["Denmark" : "France"]

  #                Healthy life expectancy   Freedom to make life choices
  # Country name  
  #      Denmark                    72.700                          0.946
  #      Ecuador                    68.800                          0.842
  #        Egypt                    61.998                          0.749
  #      Finland                    72.000                          0.949
  #       France                    74.000                          0.822
  ```
- **iloc** - access rows using **integer position-based indexing**
- e.g. i want the 20th country alphabetically - i may not know what it is. i can however access it using iloc. again, i get back a series
  ```txt
  happiness.iloc[19]

  # Healthy life expectancy         62.000
  # Freedom to make life choices     0.959
  ```
- e.g. if i wanted the 1st 3rd and 5th countries, i add an additional pair of square braces, and again, get back a dataframe this time around - 
  ```txt
  happiness.iloc[[0, 2, 4]]
  
  #                Healthy life expectancy   Freedom to make life choices
  # Country name
  #  Afghanistan                    52.493                          0.382
  #      Algeria                    66.005                          0.480
  #      Armenia                    67.055                          0.825
  ```
- finally, again with iloc, we can also use slicing. we will use integer positions, where we can specify start, end and optionally a step
  ```txt
  happiness.iloc[0:5]
  ```
- so, loc uses values of index, iloc uses numeric position
- again, we can use both **loc** and **iloc** on **series** as well

## Filtering

- carefully look at the three steps we follow below for **filtering** - we can use a column to get a series, we generate a boolean series from it by using conditions, and finally we get the rows that hold true for the corresponding position in the boolean series
  ```txt
  df

  #     name                            sex      age
  # 0   Allen, Miss. Elisabeth Walton   female   29
  # 1   Allison, Master. Hudson Trevor  male     0.9167
  # 2   Allison, Miss. Helen Loraine    female   2
  
  
  df['sex']

  # 0    female
  # 1      male
  # 2    female


  df['sex'] == 'female'

  # 0     True
  # 1    False
  # 2     True


  df[df['sex'] == 'female']

  #                                              name      sex  age
  # 0                   Allen, Miss. Elisabeth Walton   female   29
  # 2                    Allison, Miss. Helen Loraine   female    2
  ```
- we saw `==` above. we can also use the other **comparison** operators like `!=`, `>=`, `>`, `<=`, `<`, etc
  ```txt
  houses[houses['price'] > 5000000]

  #               id             date      price  bedrooms  bathrooms
  # 1164  1247600105  20141020T000000  5110800.0         5       5.25
  # 3914  9808700762  20140611T000000  7062500.0         5       4.50
  # 7252  6762700020  20141013T000000  7700000.0         6       8.00
  # 9254  9208900037  20140919T000000  6885000.0         6       7.75
  ```
- series have a method called **between** which we can use. e.g. find houses with bedrooms in the range 5 to 7 -
  ```txt
  houses[houses['bedrooms'].between(5, 7)].value_counts('bedrooms')

  # bedrooms
  # 5         1601
  # 6         272
  # 7         38
  ```
- we can use **isin**, e.g. find netflix movies in india or south korea - 
  ```txt
  netflix[netflix['country'].isin(['India', 'South Korea'])].value_counts('country')

  # country
  # India          972
  # South Korea    199
  ```
- we can combine conditions using boolean operators - 
  ```txt
  women = titanic['sex'] == 'female'
  died = titanic['survived'] == 0
  titanic[women & died]

  #         sex  survived  pclass    cabin
  #   2  female         0       1  C22 C26
  #   4  female         0       1  C22 C26
  # 105  female         0       1      A29
  ```
- note - doing it in one line - do not forget parentheses, otherwise python cannot parse it correctly due to priority - 
  ```txt
  titanic[(titanic['sex'] == 'female') & (titanic['survived'] == 0)]
  ```
- similarly, we can use `|` for or, `~` for negation
- **isna** - returns true for rows where the column is missing a value - 
  ```txt
  netflix[netflix['director'].isna()]

  #      show_id   type                                      title   director
  # 1         s2     TV   Show Blood & Water                              NaN
  # 3         s4     TV   Show Jailbirds New Orleans                      NaN
  # 4         s5     TV   Show Kota Factory                               NaN
  # 10       s11     TV   Show Vendetta: Truth, Lies and The Mafia        NaN
  # 14       s15     TV   Show Crime Stories: India Detectives            NaN
  ```
- my understanding - everywhere above, we are trying to filter using a column value. we can use the index as well though - recall - we saw in [series](#series-and-columns) that we can access the labels using **index**. my understanding - the point is, whatever we did using `dataframe[column]`, can be done using `dataframe.index` as well -
  ```txt
  countries[countries.index != 'Denmark']
  ```

## Modifying Columns and Indices

- **dropping columns** - we use the **drop** method. we need to specify the columns to drop, and the **axis**. the same drop method can be used to drop rows as well, hence we need to specify the axis. axis can be set to - 
  - 0 / **index** to drop rows
  - 1 / **columns** to drop columns
  
  ```txt
  bitcoin.drop(labels=['Name', 'Symbol'], axis='columns')
  ```
- another way to do this is to just pass in the **columns** parameter directly, instead of passing in **labels** and **axis**
  ```txt
  bitcoin.drop(columns=['Name', 'Symbol'])
  ```
- till now, we saw dropping columns. we can also **drop rows** using one of the following ways - 
  ```txt
  # method 1
  countries.drop(labels=['Denmark', 'Finland', 'Iceland'], axis='index')

  # method 2 - shorthand and my favorite of the three
  countries.drop(index=['Denmark', 'Finland', 'Iceland'])

  # method 3 - it is the first positional argument
  # so we can skip providing the "index" kwarg
  countries.drop(['Denmark', 'Finland', 'Iceland'])
  ```
- drop all countries except the first 10. we can pass an index series as well
  ```txt
  countries.drop(countries.index[10:])
  ```
- creating a new column with a **constant value** - 
  ```txt
  titanic['constant'] = 'something'
  ```
- creating a new column with **dynamic values** - 
  ```txt
  # number of relatives = number of parents and children + number of siblings and spouses
  titanic["relatives"] = titanic["parch"] + titanic["sibsp"]
  ```
- **renaming columns** - i think the arguments are similar to **drop** - instead of **labels** and **axis**, we pass **mapper** and **axis**
  ```txt
  mapper = { 'Regional indicator': 'regional_indicator', 'Ladder score': 'ladder_score' }
  
  countries.rename(mapper=mapper, axis='columns')
  countries.rename(columns=mapper)
  ```
- similarly, we can **rename indices** - 
  ```txt
  mapper = { 'Netherlands': 'the_netherlands' }

  countries.rename(mapper=mapper, axis='index')
  countries.rename(index=mapper)
  countries.rename(mapper)
  ```
- a complex problem - find the show called "Evil", and change its index label to s6666 inplace
  ```txt
  evil_index = netflix[netflix['title'] == 'Evil'].index[0]
  netflix.rename(index={ evil_index: 's6666' }, inplace=True)
  ```

## Updating Values

- my understanding - we have already seen tricks to change column names / index names using **rename**. now we look at **replace** - the way of renaming the actual values inside
- we can use **replace** as follows. again, it is not **in place** by default, so we need to pass true for in place explicitly
  ```txt
  titanic.replace({'sex': { 'female': 'F', 'male': 'M' }}, inplace=True)
  ```
- this method is supported for **series** as well and not just **dataframes**. so, we can use the technique below as well - 
  ```txt
  titanic['sex'] = titanic['sex'].replace({ 'female': 'F', 'male': 'M' })
  # OR
  titanic['sex'].replace({ 'female': 'F', 'male': 'M' }, inplace=True)
  ```
- in the titanic dataset, all unknown values in the age column hold `?`. we can replace them with **none**. note the use of **dropna** in **value counts**, i do not think this was mentioned earlier
  ```txt
  titanic.value_counts('age')
  # age
  # ?         263
  # 24         47
  # ...

  titanic.replace({ 'age': { '?': None } }, inplace=True)
  titanic.value_counts('age', dropna=False)
  # age
  # NaN       263
  # 24         47
  # ...
  ```
- we can use **replace** when all values that match "x" in a column "a" need to be replaced
- but imagine i want to replace values in a column "a", but only for specific rows - 
  - we know the [indices](#indexing) of the rows
  - we have a [filtering condition](#filtering) to filter the desired rows
- we can use **loc** for both use cases above
  ```txt
  countries.loc[['Denmark', 'Sweden', 'Norway'], ['Regional indicator']] = 'Scandinavia'
  ```
- setting multiple columns to a single value - 
  ```txt
  countries.loc[['Finland', 'Denmark'], ['upperwhisker', 'lowerwhisker']] = 4.5
  ```
- setting multiple columns, each to its own specific value - 
  ```txt
  countries.loc[['Finland', 'Denmark'], ['upperwhisker', 'lowerwhisker']] = [4.5, 2.8]
  ```
- till now, even in [here](#indexing), we have tied accessing rows whose indices we know
- however, loc can be passed the boolean pandas series we saw in [filtering](#filtering) as well -
  ```txt
  houses.loc[houses['bedrooms'] >= 10]
  #         id           date              price       bedrooms   bathrooms
  # 8757    1773100755   20140821T000000   520000.0    11         3.00
  # 13314   627300145    20140814T000000   1148000.0   10         5.25
  # 15161   5566100170   20141029T000000   650000.0    10         2.00
  # 15870   2402100895   20140625T000000   640000.0    33         1.75
  ```
- advantage of the above - we can now conditionally update certain rows. we have already seen how to update rows using loc, and we know how to filter rows based on conditions
  ```txt
  houses.loc[houses['bedrooms'] >= 10, ['bedrooms']] = 9999 
  houses.loc[houses['bedrooms'] == 9999]
  #         id           date              price       bedrooms   bathrooms
  # 8757    1773100755   20140821T000000   520000.0    9999       3.00
  # 13314   627300145    20140814T000000   1148000.0   9999       5.25
  # 15161   5566100170   20141029T000000   650000.0    9999       2.00
  # 15870   2402100895   20140625T000000   640000.0    9999       1.75
  ```
- a complex problem - add a new column 'luxurious' - set it to 'yes' for houses with grade > 12 and view = 4, and set it to 'no' for others -
  ```txt
  good_view = houses['view'] == 4
  good_quality = houses['grade'] > 12
  houses[good_view & good_quality]
  #        price      view  grade
  # 9254   6885000.0  4     13
  # 14556  2888000.0  4     13
  # 19017  3800000.0  4     13

  houses['luxurious'] = 'no'
  houses.loc[good_view & good_quality, ['luxurious']] = 'yes'
  
  houses[houses['luxurious'] == 'yes']
  #        price      view  grade  luxurious
  # 9254   6885000.0  4     13     yes
  # 14556  2888000.0  4     13     yes
  # 19017  3800000.0  4     13     yes
  ```

## Data Types

- we have a dataset that holds `?` for columns for missing values in the csv
  ```txt
  titanic.info()
  # #   Column     Non-Null Count  Dtype 
  #---  ------     --------------  ----- 
  # 0   pclass     1309 non-null   int64 
  # 1   survived   1309 non-null   int64 
  # 2   name       1309 non-null   object
  # 4   age        1309 non-null   object

  titanic['age'].value_counts()
  # age
  # ?         263
  # 24         47
  # 22         43
  # 21         41
  ```
- issue - we cannot do things like finding the mean age
- solution - we convert the data type of the age column. first, we **replace** `?` with **none**, then we **cast** it to type float - 
  ```txt
  titanic['age'] = titanic['age'].astype('float')
  # ValueError: could not convert string to float: '?'

  titanic['age'] = titanic.replace({ 'age': { '?' : None } }).astype('float')

  titanic.info()
  # #   Column     Non-Null Count  Dtype
  #---  ------     --------------  -----
  # 0   pclass     1309 non-null   int64
  # 1   survived   1309 non-null   int64
  # 2   name       1309 non-null   object
  # 4   age        1046 non-null   float64

  titanic['age'].value_counts(dropna=False)
  # age
  # NaN        263
  # 24.0000     47
  # 22.0000     43
  ```
- now, we can use numeric functions like for e.g. `titanic['age'].mean()`
- another option - **to numeric** - it is a more aggressive alternative to the one we saw earlier. earlier, we manually ran replace for all the question marks to be replaced by none, and then did the type conversion from **object** to **float**. now, with the below approach, we will say try converting it to numeric, and if you cannot, just put a none in there. the default value of **errors** is **raise** i.e. raise an exception when you encounter an error. we typically change it to **coerce** for getting the behavior we described
  ```txt
  titanic['body'] = pd.to_numeric(titanic['body'], errors='coerce')
  ```
- **category** type - useful when a column has a set of **finite** possible values, e.g. gender
- advantage - less memory usage etc
- by default, this is the situation. specially look at the **dtype** column and **memory usage** in the output 
  ```txt
  titanic['sex'].value_counts()
  # sex
  # male      843
  # female    466

  titanic.info()
  #  #   Column     Non-Null Count  Dtype
  # ---  ------     --------------  -----
  #  3   sex        1309 non-null   object
  # memory usage: 143.3+ KB
  ```
- when we manually cast gender to type of **category**, the output looks like follows. look how the type is now changed and the memory usage too has reduced
  ```txt
  titanic['sex'] = titanic['sex'].astype('category')

  titanic['sex'].value_counts()
  # sex
  # male      843
  # female    466

  titanic.info()
  #  #   Column     Non-Null Count  Dtype  
  # ---  ------     --------------  -----  
  #  3   sex        1309 non-null   category
  # memory usage: 134.5+ KB
  
  titanic['sex']
  # 0       female
  # 1         male
  #          ...  
  # 1307      male
  # 1308      male
  # Name: sex, Length: 1309, dtype: category
  # Categories (2, object): ['female', 'male']
  ```

## NA Values

- **is na** - returns true for cells that do not contain a value. can be called on both the dataframe and series. look at the last statement, where we generate a boolean series that represent all rows which contain null for league, and then use it as a filter condition
  ```txt
  game_stats = pd.read_csv('data/game_stats.csv')
  game_stats
  #    name      league      points  assists  rebounds
  # 0  bob       nba         22.0    5.0      10.0
  # 1  jessie    NaN         10.0    NaN      2.0
  # 2  stu       euroleague  NaN     NaN      NaN
  # 3  jackson   aba         9.0     NaN      2.0
  # 4  timothee  NaN         8.0     NaN      NaN
  # 5  steph     nba         49.0    8.0      10.0
  # 6  NaN       NaN         NaN     NaN      NaN

  game_stats.isna()
  #    name   league  points  assists  rebounds
  # 0  False  False   False   False    False
  # 1  False  True    False   True     False
  # 2  False  False   True    True     True
  # 3  False  False   False   True     False
  # 4  False  True    False   True     True
  # 5  False  False   False   False    False
  # 6  True   True    True    True     True

  game_stats['league'].isna()
  # 0    False
  # 1     True
  # 2    False
  # 3    False
  # 4     True
  # 5    False
  # 6     True

  game_stats[game_stats['league'].isna()]
  #    name      league      points  assists  rebounds
  # 1  jessie    NaN         10.0    NaN      2.0
  # 4  timothee  NaN         8.0     NaN      NaN
  # 6  NaN       NaN         NaN     NaN      NaN
  ```
- **drop na** - dropping rows with missing values. it too creates a new copy unless we specify **in place** explicitly
- to drop rows where any of the columns hold null, specify the **how** parameter as **any**. note - this is also the default i.e. when we call **drop na** without any parameters
  ```txt
  game_stats.dropna(how='any')

  #    name   league  points  assists  rebounds
  # 0  bob    nba     22.0    5.0      10.0
  # 5  steph  nba     49.0    8.0      10.0
  ```
- drop only rows where all the columns hold null - specify the **how** parameter as **all**
  ```txt
  game_stats.dropna(how='all')

  #    name      league      points  assists  rebounds
  # 0  bob       nba         22.0    5.0      10.0
  # 1  jessie    NaN         10.0    NaN      2.0
  # 2  stu       euroleague  NaN     NaN      NaN
  # 3  jackson   aba         9.0     NaN      2.0
  # 4  timothee  NaN         8.0     NaN      NaN
  # 5  steph     nba         49.0    8.0      10.0  
  ```
- drop rows where any of the specified columns are not present
  ```txt
  game_stats.dropna(subset=['points', 'rebounds'])

  #    name     league  points  assists  rebounds
  # 0  bob      nba     22.0    5.0      10.0
  # 1  jessie   NaN     10.0    NaN      2.0
  # 3  jackson  aba     9.0     NaN      2.0
  # 5  steph    nba     49.0    8.0      10.0
  ```
- finally, we can drop columns as well by setting the **axis** parameter, e.g. drop all columns where any of the rows contain missing values for it
  ```txt
  netflix.dropna(how='any', axis=1)
  ```
- note - **drop na** works for **series** as well
- we can use **fill na** to fill the cells missing values with a particular value
- if we call it directly with a value, it would apply to all columns - 
  ```txt
  game_stats.fillna(0)

  #    name      league      points  assists  rebounds
  # 0  bob       nba         22.0    5.0      10.0
  # 1  jessie    0           10.0    0.0      2.0
  # 2  stu       euroleague  0.0     0.0      0.0
  # 3  jackson   aba         9.0     0.0      2.0
  # 4  timothee  0           8.0     0.0      0.0
  # 5  steph     nba         49.0    8.0      10.0
  # 6  0         0           0.0     0.0      0.0
  ```
- we can however specify specific columns like so - 
  ```txt
  game_stats.fillna({ 'points': 10.0, 'assists': 0 })

  #    name       league      points  assists  rebounds
  # 0  bob        nba         22.0    5.0      10.0
  # 1  jessie     NaN         10.0    0.0      2.0
  # 2  stu        euroleague  NaN     0.0      NaN
  # 3  jackson    aba         9.0     0.0      2.0
  # 4  timothee   NaN         8.0     0.0      NaN
  # 5  steph      nba         49.0    8.0      10.0
  # 6  anonymous  NaN         NaN     0.0      NaN
  ```
- fun exercise - instead of using **fill na**, use [**loc**](#updating-values) for updating values where it is missing
  ```txt
  netflix.loc[netflix['rating'].isna(), 'rating'] = 'TV-MA'
  netflix.fillna({ 'rating': 'TV-MA' })
  ```
- assume we have two columns in a sales table for shipping and billing addresses. we would like to default the shipping address to the billing address wherever shipping address is missing. we can do it as follows - 
  ```txt
  sales.fillna({ 'shipping_zip': sales['billing_zip'] }, inplace=True)
  ```
- my understanding - based on above point, we can specify a **series** as well for the value, and it will fill using the corresponding value in the series wherever a null is encountered

## Dates and Times

- dates an be present in lots different formats - months can be in words or numbers, days can come before months or the other way around, separator can be - or /, etc
- my understanding - the **to datetime** function does a (mostly) great job at auto detecting the date time format
  ```txt
  pd.to_datetime('31 Dec. 2019')  # Timestamp('2019-12-31 00:00:00')
  pd.to_datetime('12/31/2019')  # Timestamp('2019-12-31 00:00:00')
  ```
- we can however pass it parameters to configure its behavior as well in case of ambiguity
- e.g. look below how we use **day first** and **year first** to get different outputs for the same input - 
  ```txt
  pd.to_datetime('10-11-12')  # Timestamp('2012-10-11 00:00:00')
  pd.to_datetime('10-11-12', dayfirst=True)  # Timestamp('2012-11-10 00:00:00')
  pd.to_datetime('10-11-12', yearfirst=True, dayfirst=True)  # Timestamp('2010-12-11 00:00:00')
  ```
- we can use the more powerful **format** as well. [format codes reference](https://docs.python.org/3/library/datetime.html#format-codes)
  ```txt
  pd.to_datetime('10-11-12', format='%y-%d-%m')  # Timestamp('2010-12-11 00:00:00')

  meetings = ['Dec 11 2019 Meeting', 'Jan 15 2024 Meeting', 'Mar 7 2024 Meeting']
  pd.to_datetime(meetings, format='%b %d %Y Meeting')
  # DatetimeIndex(['2019-12-11', '2024-01-15', '2024-03-07'], dtype='datetime64[ns]', freq=None)
  ```
- python's default behavior - try parsing it like a numeric column if possible, else change to object. so, converting a dataframe column to datetime format using **astype** - 
  ```txt
  ufos.info()
  # ...
  # 1   city            87888 non-null  object 
  # 2   state           82890 non-null  object 
  # 3   date_time       86938 non-null  object

  ufos['date_time'] = pd.to_datetime(ufos['date_time'])

  ufos.info()
  # ...
  # 1   city            87888 non-null  object 
  # 2   state           82890 non-null  object 
  # 3   date_time       86938 non-null  datetime64[ns]
  ```
- we can also specify the datetime columns upfront while reading a csv, instead of converting it later - 
  ```txt
  ufos = pd.read_csv('data/nuforc_reports.csv', parse_dates=['date_time'])
  ufos.info()
  # ...
  # 1   city            87888 non-null  object        
  # 2   state           82890 non-null  object        
  # 3   date_time       86938 non-null  datetime64[ns]
  ```
- there are also keyword arguments for specifying the datetime format etc in the read csv call, refer documentation
- we can access the **date time properties** object on the column of type datetime64. we access it using **dt**. [full list of properties available](https://pandas.pydata.org/docs/user_guide/timeseries.html#time-date-components)
- e.g. view the top 10 years with the most ufo sightings. we first need to extract just the year from the datetime column, and then, we can chain **value counts** with **nlargest** to get the top 10 years
  ```txt
  ufos['date_time'].dt.year.value_counts().nlargest(10).plot(kind='bar')
  ```
  ![](/assets/img/python-data-analysis/value-counts-ufo-sightings-by-year-datetime.png)
- **comparing datetime columns**
  - notice how we provide strings and pandas can parse it for us automatically. the example below will give us all the ufo sightings since 12am on 22 december, 2019
    ```txt
    ufos[ufos['date_time'] > '2019-12-22']
    ```
  - we already saw how we can access properties on a datetime column. we can use it to perform filtering as well. the example below will give us all sightings where the hour was 2 .i.e. it could have happened at 2.30am, 2.49am etc
    ```txt
    ufos[ufos['date_time'].dt.hour == 2.0]
    ```
- **time deltas** - we get this when we subtract two datetime objects. e.g. get the people who waited the longest to report after seeing a ufo 
  ```txt
  ufos['posted'] - ufos['date_time']
  # 0          9 days 05:17:00
  # 1          6 days 05:30:00
  #                ...        
  # 88123      1 days 02:00:00
  # 88124      1 days 02:00:00
  # Length: 88125, dtype: timedelta64[ns]

  (ufos['posted'] - ufos['date_time']).nlargest(5)
  # 86762   18463 days 00:00:00
  # 87145   18353 days 22:30:00
  # 721     18314 days 03:00:00
  # 1576    18287 days 00:00:00
  # 1580    18240 days 08:00:00
  # dtype: timedelta64[ns]
  ```
- just like in datetime, we can also access properties of time deltas. [full list here](https://pandas.pydata.org/docs/user_guide/timedeltas.html#attributes)
- a complex example - 
  - find the homes sold between may 1st 2014 and may 1st 2015
  - create a bar plot showing the total number of sales per month in that period
  - the x axis should be in calendar order (1-12)
- we filter to get all houses sold in the time period. then, we extract the month and perform value counts on it. finally, we sort by index i.e. by months since by default, value counts will sort by counts. finally, we plot it
  ```txt
  houses_sold = houses[houses['date'].between('05-01-2014', '05-01-2015')]
  houses_sold['date'].dt.month.value_counts().sort_index().plot(kind='bar')
  ```
  ![](/assets/img/python-data-analysis/houses-sold-in-period-monthwise.png)
- i wanted to get the **week of year**. i could not access any such property on dt. so, i instead tried to format the date into a string. then, we can use the [format codes](https://docs.python.org/3/library/datetime.html#format-codes) we mentioned earlier as well
- e.g. create a line plot showing the total number of sales by week of the year number (1-52)
- first we obtain the week number the house was sold in. then, we obtain the value counts for each of the week. then we sort by the index i.e. the week number, because otherwise the x axis of the line plot will not be sorted and look weird - recall that value counts will sort by counts and not index
  ```txt
  plt.figure(figsize=(15, 5))
  plt.xticks(range(52))
  houses['date'].dt.strftime('%V').value_counts().sort_index().plot(kind='line')
  ```
  ![](/assets/img/python-data-analysis/houses-sold-by-week-datetime-line.png)

## Matplotlib

- till now, whenever we called **plot** on pandas series, it was actually calling matplotlib bts
- however, it can have limitations, which is when we might want to interact with matplotlib
- most common way of importing matplotlib - 
  ```txt
  import matplotlib.pyplot as plt
  ```
- when we do the following, it defaults values on the x axes to be 0, 1, 2, ...
  ```txt
  plt.plot([2, 6, 2, 4, 8])
  ```
  ![](/assets/img/python-data-analysis/matplotlib-very-basic.png)
- we can specify values for both x and y as follows - 
  ```txt
  salaries = [20000, 50000, 60000, 100000, 250000, 150000]
  ages = [20, 25, 30, 32, 45, 65]
  plt.plot(ages, salaries)
  ```
  ![](/assets/img/python-data-analysis/matplotlib-basics-specifying-both-axes.png)
- note - when we call **plot** in jupyter notebook, before the actual graph, we see a line like this - `[<matplotlib.lines.Line2D at 0x7cd66c249180>]`. this is actually the output of plot, but jupyter is smart enough to show us the output at the back of it as well. we will have to call `plt.show()` if we are not working on a jupyter notebook
- matplotlib terminology - the top level container is a **figure**
- a figure can have multiple **axes**
- each axes is a combination of **labels**, **data**, etc
- assume we have the following sample data - 
  ```txt
  nums = range(6)
  nums_squared = [num**2 for num in nums]
  nums_cubed = [num**3 for num in nums]
  ```
- when we have the following code, all of them are plotted on the **same figure** and the **same axes**
  ```txt
  plt.plot(nums)
  plt.plot(nums_squared)
  plt.plot(nums_cubed)
  ```
  ![](/assets/img/python-data-analysis/same-figure-same-axes.png)
- we call **figure** to create a new figure and make it the current figure. so when we call **plot**, it basically plots on the current active figure. so, with the code below, all of them are plotted on **different figures**
  ```txt
  plt.figure(figsize=(4,3))
  plt.plot(nums)

  plt.figure(figsize=(4,3))
  plt.plot(nums_squared)

  plt.figure(figsize=(4,3))
  plt.plot(nums_cubed)
  ```
  ![](/assets/img/python-data-analysis/different-figure-i.png)
  ![](/assets/img/python-data-analysis/different-figure-ii.png)
  ![](/assets/img/python-data-analysis/different-figure-iii.png)
- note how we control the size of a figure in matplotlib - we can pass **figsize** and **dpi** or **dots per inch** to figure. i usually just touch figsize, which defaults to 6.4, 4.8
- we can specify the linestyle when plotting as follows. notice the shorthand at the third call as well
  ```txt
  plt.plot(nums, nums, linestyle='dashed')
  plt.plot(nums, nums_squared, linestyle='dotted')
  plt.plot(nums, nums_cubed, linestyle='-.')
  ```
  ![](/assets/img/python-data-analysis/plot-line-styles.png)
- when calling plot, we can specify parameters like **color**, **linewidth**, etc as well if needed
- we can also specify **markers** and their styling
  ```txt
  plt.plot(nums, nums_cubed, marker='o')
  ```
  ![](/assets/img/python-data-analysis/plot-with-markers.png)
- we can use **title** to set a title for the **axes**, and **labels** to set labels for the x and y axis individually
  ```txt
  plt.plot(nums, nums_squared)
  plt.title("Squares of Numbers")
  plt.xlabel("Input")
  plt.ylabel("Squares")
  ```
  ![](/assets/img/python-data-analysis/plot-with-title.png)
- remember - all these methods we see - plot, title, xlabel and ylabel, and others that we see later - also accept a ton of options to control the size, spacing, color, positioning, etc. refer documentation as and when needed
- when we try to plot the below, look at the default graph. notice how on x axis for e.g., matplotlib itself decided that it should start the **ticks** from 3 etc
  ```txt
  nums = [3, 3.5, 4, 7, 9]
  nums_squared = [num**2 for num in nums]
  plt.plot(nums, nums_squared, marker='o')
  ```
  ![](/assets/img/python-data-analysis/default-without-ticks.png)
- option 1 - we can add custom ticks using **xticks** and **yticks**. it serves two purposes -
  - we can only provide the first argument. this controls what ticks should show up
  - we can provide the second argument as well. this controls what the actual tick should be named inside the graph

  ```txt
  plt.plot(nums, nums_squared, marker='o')
  plt.xticks([1, 2, 3, 4, 7, 8, 9], ['one', 'two', 'three', 'four', 'seven', 'eight', 'nine'])
  ```
  ![](/assets/img/python-data-analysis/custom-ticks.png)
- option 2 - we can only modify the **limits**. e.g. we would like the x axis start from -2 and end at 20 for some reason
  ```txt
  plt.plot(nums, nums_squared, marker='o')
  plt.xlim(-2, 15)
  ```
  ![](/assets/img/python-data-analysis/custom-tick-limits.png)
- **legend** - helps distinguish between the different graphs using **labels** when they are on the same **axes** in the same **figure**
  ```txt
  nums = [1, 2, 3, 4]
  nums_squared = [num ** 2 for num in nums]
  nums_cubed = [num ** 3 for num in nums]
  
  plt.plot(nums, nums, label='linear')
  plt.plot(nums, nums_squared, label='squared')
  plt.plot(nums, nums_cubed, label='cubed')
  
  plt.legend()
  ```
  ![](/assets/img/python-data-analysis/same-figure-same-axes-with-legend.png)
- plotting **bar** charts. assume we have the following data - 
  ```txt
  plants = ['spinach', 'turnip', 'rhubarb', 'broccoli', 'kale']
  died = [10, 25, 5, 30, 21]
  germinated = [74, 88, 56, 69, 59]
  ```
- by default, the different charts would be one on top of another - 
  ```txt
  plt.bar(plants, germinated)
  plt.bar(plants, died)
  ```
  ![](/assets/img/python-data-analysis/plotting-bar-basics.png)
- this is how i got them to show one beside another - 
  - i ensured **width** of the first graph is positive while the second one is negative, so that they appear on either sides of the x **tick**
  - i also ensured they are **0.25%** of their actual width, as this ensures the right spacing. if for e.g. i did 0.5, the second bar of a tick will touch the first bar of the next tick
  - i set **align** to **edge**. this alsigns them to the edge of the tick. the default is **center** (refer the graph created by default above)

  ```txt
  plt.bar(plants, germinated, width=0.25, align='edge')
  plt.bar(plants, died, width=-0.25, align='edge')
  ```
  ![](/assets/img/python-data-analysis/multiple-bar-graph-alignment-side-by-side.png)
- bar also receives another keyword argument - **bottom**
  ```txt
  plt.bar(plants, germinated, bottom=[20, 20, 20, 20, 20])
  plt.ylim(0, 120)
  ```
  ![](/assets/img/python-data-analysis/bar-graph-with-custom-bottom.png)
- use case of the stupidity above 🤣 - we can get the different bars to **stack** one on top of another. the y coordinates of one graph becomes the bottom of another
  ```txt
  plt.bar(plants, died, bottom=germinated, label='died')
  plt.bar(plants, germinated, label='germinated')
  plt.legend()
  ```
  ![](/assets/img/python-data-analysis/stacked-bar-graph.png)
- we can use **barh** instead of bar for horizontal bar graphs. notice how for **stacking**, the **bottom** changes to **left**
  ```txt
  plt.barh(plants, died, left=germinated, label='died')
  plt.barh(plants, germinated, label='germinated')
  plt.legend()
  ```
  ![](/assets/img/python-data-analysis/stacked-horizontal-bar-graph.png)
- **histogram** - assume we have the following data. note - i did a value count to explain the distribution of data - 
  ```txt
  nums = [1,2,2,3,5,4,2,2,1,1,3,4,4,2,1,5,2,3,4,5]

  { num: nums.count(num) for num in nums }
  # {1: 4, 2: 6, 3: 3, 4: 4, 5: 3}
  ```
- when i try to create a histogram on this data, it looks as follows by default - 
  ```txt
  plt.hist(nums)
  ```
  ![](/assets/img/python-data-analysis/default-histogram-without-binning.png)
- we can configure the **bins** as follows. my understanding - 1 and 2 together have frequency of 10, 3 has frequency of 3 while 4 and 5 together have frequency of 7. now, the range has been divided into three parts 1-2.33, 2.33-3.66, 3.66-4.99, and the histogram has been plotted accordingly
  ```txt
  plt.hist(nums, bins=3)
  ```
  ![](/assets/img/python-data-analysis/histogram-with-custom-binning.png)
- **histograms** are a little different i feel because unlike pie chart, bar graph, etc where we give the actual values to be plotted, here, we only give a series of values and it autmatically calculates the frequency and bins them accordingly
- a realisitic example - comparing the distribution of ages of people travelling in first class vs third class in the titanic. observation - more younger people were travelling in third class, wheras more older people were travelling in first class. also, note how we change the alpha to visualize them simultaneously
  ```txt
  titanic = pd.read_csv('/content/drive/MyDrive/Python - Basic Data Analysis/titanic.csv')
  
  # clean the age column
  titanic.replace({ 'age': { '?': None } }, inplace=True)
  titanic['age'] = titanic['age'].astype('float')
  
  # extract the ages of first and third class
  first_class_ages = titanic[titanic['pclass'] == 1]['age']
  third_class_ages = titanic[titanic['pclass'] == 3]['age']
  
  # plot the ages
  plt.hist(first_class_ages, alpha=0.5, label='first')
  plt.hist(third_class_ages, alpha=0.5, label='third')
  
  plt.legend()
  ```
  ![](/assets/img/python-data-analysis/histogram-basic-project.png)
- **pie charts**
  - we use the **explode** parameter to disconnect the sectors from the pie chart. the fraction determines how far out the sectors would be from the pie. the order is the same as the order of the labels
  - we use the **autopct** parameter to add percentages inside the sectors. we are using `autopct='%.0f%%'` here, if we would have used for e.g. `autopct='%.2f'`, it would have shown in this form - `57.73` (with 2 decimal places and without the `%`)
  
  ```txt
  plt.pie(costs, labels=labels, autopct='%0.0f%%', explode=(0, 0.1, 0, 0, 0.1))
  plt.show()
  ```
  ![](/assets/img/python-data-analysis/pie-chart-example.png)
- **subplots** - multiple **axes** in the same **figure**
  - we use **subplot** to tell the **dimensions** and the correct **subplot index**. in the example below, we say 1 row, 3 columns, and go 1, 2 and 3 respectively for the index
  - **title** is used for individual **axes** headings while **suptitle** is used for the **figure** heading
  - we call **tight layout**, as it helps python adjust the padding around subplots

  ```txt
  nums = [1, 2, 3, 4, 5]
  nums_squared = [num ** 2 for num in nums]
  nums_cubed = [num ** 3 for num in nums]
  
  plt.figure(figsize=(12, 4))
  plt.suptitle("Polynomials")
  
  plt.subplot(1, 3, 1)
  plt.title("X")
  plt.plot(nums, nums)
  
  plt.subplot(1, 3, 2)
  plt.title("X Squared")
  plt.plot(nums, nums_squared)
  
  plt.subplot(1, 3, 3)
  plt.title("X Cubed")
  plt.plot(nums, nums_cubed)
  
  plt.tight_layout()
  plt.show()
  ```
  ![](/assets/img/python-data-analysis/subplots-example.png)
- now, imagine if we go back to our titanic example, and we want to plot all three classes - first second and third in different subplots - 
  ```txt
  titanic = pd.read_csv('/content/drive/MyDrive/Python - Basic Data Analysis/titanic.csv')
  titanic['age'] = pd.to_numeric(titanic['age'], errors='coerce')
  
  first_class_ages = titanic[titanic['pclass'] == 1]['age']
  second_class_ages = titanic[titanic['pclass'] == 2]['age']
  third_class_ages = titanic[titanic['pclass'] == 3]['age']
  
  plt.figure(figsize=(12, 4))
  plt.suptitle('titanic class vs age distribution')
  
  plt.subplot(1, 3, 1)
  plt.title('1st class')
  plt.hist(first_class_ages)
  
  plt.subplot(1, 3, 2)
  plt.title('2nd class')
  plt.hist(second_class_ages)
  
  plt.subplot(1, 3, 3)
  plt.title('3rd class')
  plt.hist(third_class_ages)
  
  plt.tight_layout()
  plt.show()
  ```
  ![](/assets/img/python-data-analysis/titanic-subplot-without-shared-axes.png)
- issue - we know that the scale in the third vs other plots are different i.e. a lot more people are travelling in the third class than in the 2nd and 1st class. this is not evident right off the bat by looking at the graph. hence, we can specify the **sharey** parameter
  ```txt
  # ...
  axes = plt.subplot(1, 3, 1)
  # ...
  plt.subplot(1, 3, 2, sharey=axes)
  # ...
  plt.subplot(1, 3, 3, sharey=axes)
  ```
  ![](/assets/img/python-data-analysis/titanic-subplot-with-shared-axes.png)
- question - write the code for achieving the below. note - do not use the plot method of pandas series and dataframes 
  ![](/assets/img/python-data-analysis/final-matplotlib-example.png)
  ```txt
  houses = pd.read_csv('/content/drive/MyDrive/Python - Basic Data Analysis/kc_house_data.csv', parse_dates=['date'])

  sales_by_month = houses['date'].dt.month.value_counts().sort_index()
  # date
  # 1      978
  # 2     1250
  # 3     1875
  # 4     2231
  # 5     2414
  # 6     2180
  # 7     2211
  # 8     1940
  # 9     1774
  # 10    1878
  # 11    1411
  # 12    1471

  sales_by_week_day = houses['date'].dt.day_of_week.value_counts().sort_index()
  # date
  # 0    4099
  # 1    4715
  # 2    4603
  # 3    3994
  # 4    3685
  # 5     287
  # 6     230

  plt.figure(figsize=(10, 4))

  plt.subplot(1, 2, 1)
  week_days = ['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
  plt.title('Sales by Week Day')
  plt.xticks(sales_by_week_day.index, week_days)
  plt.bar(sales_by_week_day.index, sales_by_week_day.values)

  plt.subplot(1, 2, 2)
  plt.xticks(range(1, 13))
  plt.title('Sales by Month')
  plt.plot(sales_by_month.index, sales_by_month.values)

  plt.tight_layout()
  plt.show()
  ```
- note how we use **index** and **values** that we disccussed [here](#series-and-columns)
- we also had to sort by index first before beginning to plot, because value counts sorts by values by default
- notice the use of **xticks** for renaming the labels for weekdays. i had to do the same thing for months as well, otherwise the default was 2, 4, 6, 8...

## Maptlotlip + Pandas

- plotting a pandas **series**
  ```txt
  titanic['sex'].value_counts().plot(kind='pie')
  ```
  ![](/assets/img/python-data-analysis/pandas-series-example.png)
- plotting a pandas **dataframe** - note how it is making a bar for all columns automatically
  ```txt
  house_area
  #        sqft_living  sqft_lot
  # 12777  13540        307752
  # 7252   12050        27600
  # 3914   10040        37325
  # 9254   9890         31374
  # 8092   9640         13068

  house_area.plot(kind='bar')
  ```
  ![](/assets/img/python-data-analysis/pandas-dataframe-example.png)
- ufo sightings by month - we use this series in the next few points, and this is what our data looks like - 
  ```txt
  ufo_sightings_by_month
  # 1.0      5979
  # 2.0      4559
  # 3.0      5494
  # 4.0      5817
  # 5.0      6063
  # 6.0      8357
  # 7.0     10682
  # 8.0      8997
  # 9.0      8498
  # 10.0     8371
  # 11.0     7596
  # 12.0     6525
  ```
- for providing parameters like **title**, we have two options - 
  - option 1 - in the same line. disadvantage - lesser options to configure styling etc
    ```txt
    ufo_sightings_by_month.plot(kind='bar', title='UFO Sightings by Month', xlabel='month', ylabel='num. of sightings')
    ```
  - option 2 - i think the central idea is instead of interacting only with pandas plot api, we mix with calls to matplotlib apis directly like we saw in [matplotlib](#matplotlib). advantage - now, we can configure styling etc
    ```txt
    ufo_sightings_by_month.plot(kind='bar')

    plt.title('UFO Sightings by Month')
    plt.xlabel('month')
    plt.ylabel('num. of sightings')
    ```

  ![](/assets/img/python-data-analysis/ufo-sightings-by-month-numeric-month-labels.png)
- now, we would like to use months abbreviations instead. we have multiple options - 
  - option 1 - use [**rename**](#modifying-columns-and-indices) to rename indices
    ```txt
    months_lookup = { idx + 1: months[idx] for idx in range(12) }
    # {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'}
    
    ufo_sightings_by_month_abbrev = ufo_sightings_by_month.rename(index=months_lookup)
    ufo_sightings_by_month_abbrev.plot(kind='bar', title='UFO Sightings by Month')
    ```
  - option 2 - use [**xticks**](#matplotlib). this is useful if we just want to modify plots but it might make testing etc difficult
    ```txt
    ufo_sightings_by_month.plot(kind='bar', title='UFO Sightings by Month')
    plt.xticks(range(12), labels=months)
    ```

  ![](/assets/img/python-data-analysis/ufo-sightings-by-month-abbrev-month-labels.png)
- by default, bar charts for dataframes looks as follows. understand that pandas is coming with reasonable defaults and helpers. there was so much effort was required from our end when doing this manually using [matplotlib](#matplotlib) - specifying **labels** and **legends**, specifying the **align** property with a negative **width**, etc
  ```txt
  salaries
  #                    BasePay    OvertimePay  OtherPay
  # EmployeeName
  # NATHANIEL FORD     167411.18  0.00         400184.25
  # GARY JIMENEZ       155966.02  245131.88    137811.38
  # ALBERT PARDINI     212739.13  106088.18    16452.60
  # CHRISTOPHER CHONG  77916.00   56120.71     198306.90

  salaries.plot(kind='barh')
  ```
  ![](/assets/img/python-data-analysis/pandas-salaries-default-side-by-side.png)
- making a stacked version too is so much easier compared to doing it via [matplotlib](#matplotlib) manually by specifying **bottom** / **left** etc
  ```txt
  salaries.plot(kind='barh', stacked=True)
  ```
  ![](/assets/img/python-data-analysis/pandas-salaries-stacked.png)
- the usual way - `.plot(kind='hist')`. it creates all graphs in the same axes
  ```txt
  salaries.plot(kind='hist')
  ```
  ![](/assets/img/python-data-analysis/histogram-using-same-axes.png)
- calling `.hist()` directly. it creates different **axes** for the different columns - feels like **subplots**
  ```txt
  salaries.hist()
  ```
  ![](/assets/img/python-data-analysis/histogram-using-different-axes.png)
- **box plot** - this too helps visualize distribution of values like histogram. summary according to me, might be wrong - 
  - we have a line at the **median** (the green line)
  - the general distribution of data lies between the two **whiskers** (the two standalone blue lines)
  - the **fliers** depict the outliers (the circles). e.g. one house had 33 or so bedrooms, so look at the boxplot

  ```txt
  houses['bedrooms'].plot(kind='box')
  ```
  ![](/assets/img/python-data-analysis/default-box-plot.png)
- we can view the list of configuration parameters [here](https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.boxplot.html). e.g. we can disable the fliers
  ```txt
  houses[['bedrooms', 'bathrooms']].plot(kind='box', showfliers=False)
  ```
  ![](/assets/img/python-data-analysis/configured-box-plot.png)
- **scatter plot** - how different variables, e.g. bedrooms and bathrooms correlate to eachother. refer [this](https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.scatter.html) for different configuration options
  ```txt
  houses.plot(kind='scatter', x='bedrooms', y='bathrooms', marker='x', c='#2ca02c')
  ```
  ![](/assets/img/python-data-analysis/scatter-plot-bedrooms-vs-bathrooms.png)
- adding multiple graphs to the same **axes** on the same **figure** - same as we saw in [matplotlib](#matplotlib) i.e. we need to call **figure** on plt for creating a new figure, else the current active figure is used
- e.g. - ufo sightings have a shape attribute. find the 5 most common shapes, and plot them on the same axes. use a legend to differentiate between them. plot them for the range 2000-2018
  ```txt
  common_shapes = ufos['shape'].value_counts().nlargest(5)

  for common_shape in common_shapes.index:
      years = ufos[ufos['shape'] == common_shape]['date_time'].dt.year
      years.value_counts().sort_index().plot(kind='line', label=common_shape)

  plt.legend()
  plt.xlim(2000, 2018)
  plt.title('UFO Sightings by Shape (2000-2018)')
  ```
  ![](/assets/img/python-data-analysis/ufo-value-counts-by-shape.png)
- e.g. plot how blinding lights performed on the charts. note how we can specify the x and y attributes when plotting dataframes. also, note how we can invert the y axis - a rank is better when lower, and we want to show a higher rank using a peak / lower rank using a trench
  ```txt
  billboard_charts = pd.read_csv('/content/drive/MyDrive/Python - Basic Data Analysis/billboard_charts.csv', parse_dates=['date'])
  blinding_lights = billboard_charts[billboard_charts['song'] == 'Blinding Lights']
  
  blinding_lights.plot(y='rank', x='date')
  plt.gca().invert_yaxis()
  plt.title('Blinding Lights Chart Performance')
  ```
  ![](/assets/img/python-data-analysis/blinding_lights_chart_performance.png)
- when we try plotting a dataframe, the different columns would be plotted on the same axes by default
  ```txt
  salaries.plot(kind='hist')
  ```
  ![](/assets/img/python-data-analysis/dataframe-default-without-subplots.png)
- we can create subplots instead just by passing in keyword arguments
  ```txt
  salaries.plot(kind='hist', subplots=True)
  ```
  ![](/assets/img/python-data-analysis/dataframe-with-subplots.png)
- we can configure other parameters like **layout** (the **dimensions**), **sharex** / **sharey**, etc as well, already discussed in [matplotlib](#matplotlib)
  ```txt
  salaries.plot(kind='hist', subplots=True, layout=(1, 3), figsize=(20, 5), sharex=True, bins=30)
  plt.tight_layout()
  ```
  ![](/assets/img/python-data-analysis/dataframe-with-subplots-configured.png)
- note, my understanding - the above method of passing in true for the **subplots** keyword argument works because we wanted to plot the different columns of the same dataframe. what if we wanted to plot entirely different series etc on the same **figure** on different **axes**. we use a combination of interacting with matplotlib apis directly and through pandas apis. apis used - 
  - **subplots** can be called for setting the dimensions of the subplot, setting figure size, etc. it returns both the **figure** and the **axes** created in the process. the axes we receive has the same rows / columns as the dimensions we specify. note that parameters like `sharex` / `sharey` can be passed into this subplots call as well
  - note how we pass in **axes** argument to **plot** of pandas series / dataframe

  ```txt
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  fig, axes = plt.subplots(2, 3, figsize=(15, 10))
  
  data_2000 = ufos[ufos['date_time'].dt.year == 2000]['date_time'].dt.month.value_counts().sort_index()
  data_2000.plot(kind='barh', ax=axes[0][0], ylabel='', title=2000)
  axes[0][0].set_yticks(range(12), labels=months)
  
  data_2001 = ufos[ufos['date_time'].dt.year == 2001]['date_time'].dt.month.value_counts().sort_index()
  data_2001.plot(kind='barh', ax=axes[0][1], ylabel='', title=2001)
  axes[0][1].set_yticks(range(12), labels=months)
  
  data_2002 = ufos[ufos['date_time'].dt.year == 2002]['date_time'].dt.month.value_counts().sort_index()
  data_2002.plot(kind='barh', ax=axes[0][2], ylabel='', title=2002)
  axes[0][2].set_yticks(range(12), labels=months)
  
  data_2003 = ufos[ufos['date_time'].dt.year == 2003]['date_time'].dt.month.value_counts().sort_index()
  data_2003.plot(kind='barh', ax=axes[1][0], ylabel='', title=2003)
  axes[1][0].set_yticks(range(12), labels=months)
  
  data_2004 = ufos[ufos['date_time'].dt.year == 2004]['date_time'].dt.month.value_counts().sort_index()
  data_2004.plot(kind='barh', ax=axes[1][1], ylabel='', title=2004)
  axes[1][1].set_yticks(range(12), labels=months)
  
  data_2005 = ufos[ufos['date_time'].dt.year == 2005]['date_time'].dt.month.value_counts().sort_index()
  data_2005.plot(kind='barh', ax=axes[1][2], ylabel='', title=2005)
  axes[1][2].set_yticks(range(12), labels=months)
  
  plt.suptitle(f'UFO Sightings by Months (2000-2005)')
  
  plt.tight_layout()
  ```
  ![](/assets/img/python-data-analysis/custom-subplots-using-pandas.png)
- for e.g. reproduce the graph below - 
  ![](/assets/img/python-data-analysis/christmas-songs-project.png)
  - this time around, there is just one axes. so, we can call set xticks, set title, etc on this one axes itelf
  - again, since this is ranks of songs, we invert the y axis
  - the labels on x axes was another challenge here, but easy when using **xticks**
  - pandas, matplotlib, etc are smart enough to understand dates even if we specify them like strings - note how we specify strings for dates when using **in between** and setting **xticks**

  ```txt
  years = [2016, 2017, 2018, 2019, 2020]
  christmases = [f'{year}-12-25' for year in years]
  # ['2016-12-25', '2017-12-25', '2018-12-25', '2019-12-25', '2020-12-25']
  
  songs = [
      { 'song': 'All I Want For Christmas Is You', 'artist': 'Mariah Carey' },
      { 'song': 'Rockin\' Around The Christmas Tree', 'artist': 'Brenda Lee' },
      { 'song': 'Jingle Bell Rock', 'artist': 'Bobby Helms' }
  ]
  
  period = billboard_charts['date'].between(christmases[0], christmases[-1])
  
  _, axes = plt.subplots(1, 1, figsize=(10, 7))
  
  plt.gca().invert_yaxis()
  
  years = [2016, 2017, 2018, 2019, 2020]
  christmas_values = [pd.to_datetime(f'12-25-{year}') for year in years]
  christmas_labels = [f'Xmas {year}' for year in years]
  
  axes.set_xticks(christmas_values, christmas_labels)
  axes.set_title('Christmas Songs on the Hot')
  
  for song in songs:
      condition = (billboard_charts['song'] == song['song']) & (billboard_charts['artist'] == song['artist'])
      billboard_charts[condition & period].plot(kind='line', x='date', y='rank', ax=axes, label=song['song'], xlabel='')
  
  plt.legend(loc='upper left')
  plt.tight_layout()
  plt.show()
  ```
- for saving a figure to a local file, use `savefig(path.png)`

## Grouping and Aggregation

- assume i have data for stocks of different cars like below -
  ```txt
  car_stocks

  #    Symbol  Date        Open        High        Low         Close       Adj Close   Volume
  # 0  RIVN    2021-11-10  106.750000  119.459999  95.199997   100.730003  100.730003  103679500
  # 1  RIVN    2021-11-11  114.625000  125.000000  108.010002  122.989998  122.989998  83668200
  # 2  RIVN    2021-11-12  128.645004  135.199997  125.250000  129.949997  129.949997  50437500
  ```
- to get the mean of a particular stock, i can do the following - 
  ```txt
  car_stocks[car_stocks['Symbol'] == 'RIVN']['Close'].mean()  # 127.523
  ```
- but what if i wanted the mean of all of the stocks individually in a dataframe? i can do it as follows
  ```txt
  car_stocks.groupby('Symbol')['Close'].mean()

  # Symbol
  # GM       62.164615
  # LCID     49.829231
  # RIVN    127.523077
  # Name: Close, dtype: float64
  ```
- notice how **groupby** gives us a pandas **data frame group by object**
  ```txt
  car_stocks.groupby('Symbol')

  # <pandas.core.groupby.generic.DataFrameGroupBy object at 0x77f885d61a90>
  ```
- we can call **ngroups** to see the number of groups - 
  ```txt
  car_stocks.groupby('Symbol').ngroups  # 3
  ```
- we can call **groups** to see the actual groups. it is a dictionary, where the keys are the actual keys we used to group, while the values are the **indices** of the rows
  ```txt
  car_stocks.groupby('Symbol').groups

  # {'GM': [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
  # 'LCID': [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
  # 'RIVN': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
  ```
- iterating over the **dataframe group by object** using a for each group - we get back a tuple of the form group name, dataframe. ofcourse, the dataframe only contains rows belonging to the group. the columns used in the **group by** clause would not be present in the dataframe. use case - useful when the aggregation functions available to us by default are not enough, and we want to run some custom functionality
  ```txt
  for name, group in car_stocks.groupby('Symbol'):
      print(name)
      print('--------------------')
      print(group[['Low', 'High']].describe())
      print('\n')
 
  # GM
  # --------------------
  #              Low       High
  # mean   61.051539  63.129231
  # min    57.730000  60.560001
  # max    62.630001  65.180000
  # 
  # 
  # LCID
  # --------------------
  #              Low       High
  # mean   46.442539  51.811538
  # min    39.341000  45.000000
  # max    50.709999  57.750000
  # 
  # 
  # RIVN
  # --------------------
  #               Low        High
  # mean   119.150000  135.309230
  # min     95.199997  114.500000
  # max    153.779999  179.470001
  ```
- when we tried calculating the mean of the closing price earlier -
  - when we did `car_stocks.groupby('Symbol')`, we got back a **dataframe group by object**
  - when we added a `car_stocks.groupby('Symbol')['Close']`, we got back a **series group by object**
  - we finally called `car_stocks.groupby('Symbol')['Close'].mean()` to get back the mean of closing price for each symbol (i.e. stock)
- if we would have called mean on the **dataframe group by object** directly, we would have gotten back a **dataframe** - 
  ```txt
  car_stocks.groupby('Symbol').mean()
  
  #         Open        High        Low
  # Symbol
  # GM      61.937693   63.129231   61.051539
  # LCID    48.761538   51.811538   46.442539
  # RIVN    127.710000  135.309230  119.150000
  ```
- **split**, **apply**, **combine** - this is a workflow. going back to the closing price mean by stock example -
  - we split into different parts - e.g. forming groups using groupby
  - we then apply a function on each of the parts - e.g. performing a mean on each of these groups individually
  - we finally combine the results from each of these parts - we get back a series containing means for each of the group
- we can also run multiple aggregation functions at once - below, we run it on both **dataframe group by object** and **series group by object**. running it on the dataframe group by object results in [hierarchical columns](#hierarchical-columns) - 
  ```txt
  car_stocks.groupby('Symbol')['Close'].agg(['mean', 'min', 'max'])

  #         mean        min         max
  # Symbol   
  # GM      62.164615   59.270000   64.610001
  # LCID    49.829231   40.750000   55.520000
  # RIVN    127.523077  100.730003  172.009995

  car_stocks.groupby('Symbol').agg(['mean', 'min', 'max'])
  #         Open                                High                                Low
  #         mean        min         max         mean        min         max         mean        min        max
  # Symbol
  # GM      61.937693   57.849998   64.330002   63.129231   60.560001   65.180000   61.051539   57.730000  62.630001
  # LCID    48.761538   42.299999   56.200001   51.811538   45.000000   57.750000   46.442539   39.341000  50.709999
  # RIVN    127.710000  106.750000  163.800003  135.309230  114.500000  179.470001  119.150000  95.199997  153.779999
  ```
- we can go more granular as well - we can run specific aggregation functions for specific columns as well - 
  ```txt
  car_stocks.groupby('Symbol').agg({ 'Open': ['min', 'max'],  'Close': ['mean'] })

  #         Open                    Close
  #         min         max         mean
  # Symbol     
  # GM      57.849998   64.330002   62.164615
  # LCID    42.299999   56.200001   49.829231
  # RIVN    106.750000  163.800003  127.523077
  ```  
- we can provide custom functions to agg as well - understand that this could very well have been a function from a library, and we would just have to pass its reference - 
  ```txt
  def range(x):
      return x.max() - x.min()
  
  car_stocks.groupby('Symbol')['Open'].agg(range)

  # Symbol
  # GM       6.480004
  # LCID    13.900002
  # RIVN    57.050003
  ```
- x is a **pandas series**, and range is called for every group - for all open prices for a particular stock, one at a time
- another example - this time, our custom aggregation function is called for multiple attributes, but everything is still the same. just that the output changes from a series to a dataframe, but the aggregation function is still called on a per attribute, per group basis
  ```txt
  def count_nulls(x):
      return len(x) - x.count()
  
  titanic.groupby('pclass').agg(count_nulls)

  #         survived  age  sex
  # pclass
  # 1       0         39   0
  # 2       0         16   0
  # 3       0         208  0
  ```
- **named aggregations** - we just saw nested columns above, when we try to do multiple aggregations on multiple columns at once. this can make accessing data more complicated, since we would have to use [hierarchical columns](#hierarchical-columns). in general, we might want to give a custom name to the result of our aggregation. we can do so using **named aggregations** - 
  ```txt
  car_stocks.groupby('Symbol').agg(
      close_avg=('Close', 'mean'),
      close_max=('Close', 'max'),
  )

  #         close_avg   close_max
  # Symbol
  # GM      62.164615   64.610001
  # LCID    49.829231   55.520000
  # RIVN    127.523077  172.009995
  ```
- example - we have statisctics on a per player basis for laliga, having columns for team name, shots taken, shots on target
- we would like to generate the plot below - x axis of the plot is shared
  ![](/assets/img/python-data-analysis/grouping-and-aggregations-project.png)
- generating the relevant data - 
  - first, we find total shots and shots on target by a team
  - for this, we group by team, and perform sum aggregations for shots and shots on target
  - we calculate accuracy using these two
  - finally, we sort the data based on accuracy

  ```txt
  team_stats = laliga.groupby('Team').agg(
      total=('Shots', 'sum'),
      on_target=('Shots on target', 'sum')
  )
  team_stats['accuracy'] = team_stats['on_target'] / team_stats['total']
  team_stats.sort_values(['accuracy'], inplace=True)
  team_stats

  #                   total  on_target  accuracy
  # Team   
  # SD Eibar          422    153        0.362559
  # D. Alavés         299    109        0.364548
  # CD Leganés        334    132        0.395210
  # R. Valladolid CF  319    131        0.410658
  # SD Huesca         343    142        0.413994
  ```
- generating the plot - 
  - most accurate teams - top 5 rows, least accurate teams - bottom 5. use **head** and **tail** to obtain them
  - we have entirely different pandas plots that we would like to plot on the same figure on different axes. so, we use **subplots**. subplots can apart from dimensions, receive the **sharex** parameter
  - note how we pass the axes received from **subplots** to **plot**
  - we can set the xticks on (any) axes i guess

  ```txt
  fig, axes = plt.subplots(2, 1, sharex=True)

  team_stats.tail(5).plot(kind='barh', y='accuracy', ax=axes[0], legend=False, title='Most Accurate Teams', color='green')
  team_stats.head(5).plot(kind='barh', y='accuracy', ax=axes[1], legend=False, title='Least Accurate Teams', color='red')

  axes[0].set_xticks([0.1, 0.2, 0.3, 0.4, 0.5])

  plt.tight_layout()
  ```
- we discuss [hierarchical indexing](#hierarchical-indexing) next, but we can group by levels of hierarchical indices as well. we need to specify the **levels** **keyword argument** for that
  ```txt
  state_pops

  #              population
  # state  year 
  # AK     1990  553290.0
  #        1991  570193.0
  #        1992  588736.0
  # ...    ...   ...
  # WY     2009  559851.0
  #        2010  564222.0
  #        2011  567329.0

  state_pops.groupby(level=['year']).sum()

  # year  
  # 1990  499245628.0
  # 1991  505961884.0
  # ...
  # 2012  631398915.0
  # 2013  635872764.0
  ```
- note - we specify name in this case, but we could have specified the **level** - 0, 1 etc as well
- if we see, the components of the **hierarchical index** are **named**, so specifying their names directly without the level keyword argument inside of groupby would have worked as well
  ```txt
  state_pops.groupby('year').sum()

  # year  
  # 1990  499245628.0
  # 1991  505961884.0
  # ...
  # 2012  631398915.0
  # 2013  635872764.0
  ```
- summary - 
  - we saw grouping using attributes by now
  - but then we might want to group by index / components of hierachical index as well
  - hence we could use the **level** keyword argument
  - but then, we could use the same syntax as attributes for indices as well i.e. omit the **level** keyword argument

## Hierarchical Indexing

- also called **multi indexing**
- when we group by a single column, we get the following result - 
  ```txt
  mean_by_sex = titanic.groupby('sex')['age'].mean()

  mean_by_sex.index

  # Index(['female', 'male'], dtype='object', name='sex')
  
  mean_by_sex

  # sex
  # female    28.687071
  # male      30.585233
  ```
- however, when we group by multiple columns, we get the following result - 
  ```txt
  mean_by_pclass_and_sex = titanic.groupby(['pclass', 'sex'])['age'].mean()

  mean_by_pclass_and_sex.index

  # MultiIndex([(1, 'female'),
  #             (1,   'male'),
  #             (2, 'female'),
  #             (2,   'male'),
  #             (3, 'female'),
  #             (3,   'male')],
  #            names=['pclass', 'sex'])

  mean_by_pclass_and_sex

  # pclass  sex
  # 1       female    37.037594
  #         male      41.029250
  # 2       female    27.499191
  #         male      30.815401
  # 3       female    22.185307
  #         male      25.962273
  ```
- so, labels instead of being a plain **index** are now **multi index**
- above, we showed a multi index with a **series**, below is an example of a **multi index** with a **dataframe**. the index in this case is the same as the one we got when doing a mean of age, only the entire data structure changes from a series to a dataframe
  ```txt
  titanic.groupby(['pclass', 'sex']).mean(numeric_only=True)

  #                 survived  age        sibsp     parch     fare
  # pclass  sex
  # 1       female  0.965278  37.037594  0.555556  0.472222  37.037594
  #         male    0.340782  41.029250  0.340782  0.279330  41.029250
  # 2       female  0.886792  27.499191  0.500000  0.650943  27.499191
  #         male    0.146199  30.815401  0.327485  0.192982  30.815401
  # 3       female  0.490741  22.185307  0.791667  0.731481  22.185307
  #         male    0.152130  25.962273  0.470588  0.255578  25.962273
  ```
- typically when seting up an index, we want it to -
  - be unique - having the same index for multiple rows in a dataframe does not give an error. but, it is typically not advisable - e.g. [**loc**](#indexing) would give us multiple rows
  - make our data easily accessible - use for e.g. semantic index / natural key
- imagine we have the following dataframe - 
  ```txt
  state_pops = pd.read_csv('data/state_pops.csv')
  state_pops

  #       state  year  population
  # 0     AL     2012  4817528.0
  # 1     AL     2010  4785570.0
  # ...   ...    ...   ...
  # 1270  USA    2011  311582564.0
  # 1271  USA    2012  313873685.0
  ```
- we can set up a [custom](#index) **hierarchical index** for this dataset
  ```txt
  state_pops.set_index(['state', 'year'], inplace=True)
  state_pops

  #              population
  # state  year  
  # AL     2012  4817528.0
  #        2010  4785570.0
  #        2011  4801627.0
  # USA    2013  316128839.0
  #        2009  306771529.0
  #        2010  309326295.0
  ```
- if we try [sorting the index](#sorting), by default, the data is sorted in the order of **levels** - e.g. the data is sorted first by state, and for a state, the rows are sorted by years
  ```txt
  state_pops.sort_index()

  #              population
  # state  year
  # AK     1990  553290.0
  #        1991  570193.0
  #        1992  588736.0
  # WY     2009  559851.0
  #        2010  564222.0
  #        2011  567329.0
  ```
- assume we want to sort the data by years only. so, all the data for the lowest year should come first and so on. we can do the below - 
  ```txt
  state_pops.sort_index(level=1)

  #             population
  # state year 
  # AK    1990  553290.0
  # AL    1990  4050055.0
  # ...   ...   ...
  # WV    2013  1854304.0
  # WY    2013  582658.0
  ```
- finally, assume we would like to sort in ascending order of state but then descending order of year. we can do the below - 
  ```txt
  state_pops.sort_index(level=[0, 1], ascending=[True, False])

  #              population
  # state  year
  # AK     2013  735132.0
  #        2012  730307.0
  # ...    ...   ...
  # WY     1994  480283.0
  #        1993  473081.0
  ```
- finally - we were using numbers for levels till now, but names are supported as well - e.g. we can use `state_pops.sort_index(level=['year'], inplace=True)`
- **indexing** - behavior around slicing etc is pretty similar to what we studied [here](#indexing), just that we need to be wary of **levels**
- accessing by the first level only - we get back a **dataframe**, and not a **series**
  ```txt
  state_pops.loc['WY']

  #       population
  # year
  # 1990  453690.0
  # 1991  459260.0
  # 1992  466251.0
  ```
- accessing by all levels - we get back a series, where the indices are the columns. we need to provide a **tuple** with the values for all the levels.
  ```txt
  state_pops.loc[('WY', 2013)]

  # population    582658.0
  ```
- note - we can still use **slicing** etc when using tuples - 
  ```txt
  state_pops.loc[('WY', 2010) : ('WY', 2013)]

  #              population
  # state  year
  # WY     2010  564222.0
  #        2011  567329.0
  #        2012  576626.0
  #        2013  582658.0
  ```
- till now, we saw accessing using the 1st level and all levels. what if we would like to access using some intermediate level(s)?
- first, recall from [updating](#updating-values), if we have a normal dataframe without the hierarchical indexing, we would use **loc** as follows (remember that `:` by itself means everything - all indices / all columns depending on where it is used) - 
  ```txt
  titanic
  #    pclass  survived
  # 0  1       1
  # 1  1       1
  # 2  1       0

  titanic.loc[:, 'pclass']
  # 0       1
  # 1       1
  # 2       1

  titanic.loc[:, ['pclass']]
  #   pclass
  # 0 1
  # 1 1
  # 2 1

  titanic.loc[:, :]
  #    pclass  survived
  # 0  1       1
  # 1  1       1
  # 2  1       0
  ```
- so, extending on the above for a **dataframe** with **hierarchical indexing**, my understanding is we will need extra commas for the extra levels. so, back to our original question of how to access using selective levels when we have hierarchical indexing - we can for e.g. just use `:` for the levels for which we want everything, and specify singular values using `a`, specify ranges like `a:b`, specify selected values using `[a,b]` etc based on use case
  ```txt
  state_pops.loc[:,:,]
  #             population
  # state year
  # AK    1990  553290.0
  #       1991  570193.0
  # ...   ...   ...
  # WY    2009  559851.0
  #       2010  564222.0

  # since we specify only one year
  # pandas would eliminate this column altogether
  state_pops.loc[:,2010,:]
  #        population
  # state
  # AK     713868.0
  # AL     4785570.0
  # AR     2922280.0
  # AZ     6408790.0
  # CA     37333601.0
  # CO     5048196.0

  state_pops.loc[:,[2010,2013],:]
  #              population
  # state  year 
  # AK     2010  713868.0
  #        2013  735132.0
  # AL     2010  4785570.0
  #        2013  4833722.0
  # ...    ...   ...
  # WV     2010  1854146.0
  #        2013  1854304.0
  # WY     2010  564222.0
  #        2013  582658.0

  state_pops.loc[:,2010:2012,:]
  #              population
  # state  year  
  # AK     2010  713868.0
  #        2011  723375.0
  #        2012  730307.0
  # AL     2010  4785570.0
  #        2011  4801627.0
  # ...    ...   ...
  # WV     2011  1855184.0
  #        2012  1856680.0
  # WY     2010  564222.0
  #        2011  567329.0
  #        2012  576626.0
  ```
- **cross section** or `xs` is another useful alternative to the **loc** syntax when using **hierarhcical indexing**. i will stick to loc for now though

### Accessing Hierachical Index Values

- for accessing all values of a column, we use the syntax `df['col_name']`, but this would not work for index column(s)
- to access the [values of an index](#series-and-columns) when a dataframe does not have hierarchical indexing, we use `df.index`
- what if we wanted to access the components of a **hierarchical index**? assume our dataframe looks like this -
  ```txt
  #              population
  # state  year
  # AK     1990  553290.0
  #        1991  570193.0
  #        1992  588736.0
  # ...    ...   ...
  # WY     2009  559851.0
  #        2010  564222.0
  #        2011  567329.0
  ```
- to access the index values of a particular position, we can use the following - 
  ```txt
  state_pops.index[0]  # ('AK', 1990)
  state_pops.index[1]  # ('AK', 1991)
  state_pops.index[2]  # ('AK', 1992)
  ```
- to access all the index values, we have two options according too my understanding - 
- option 1 - access via the **levels** property. but, it will only have the unique values - it would not be an accurate representation of our data
  ```txt
  state_pops.index.levels
  # FrozenList([['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'VT', 'WA', 'WI', 'WV', 'WY'],
  #             [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013]]

  state_pops.index.levels[0]
  # Index(['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI',
  #       'VT', 'WA', 'WI', 'WV', 'WY']

  state_pops.index.levels[1]
  # Index([1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001,
  #        2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013],
  ```
- option 2 - accessing via **get level values**. usecase - recall how we performed [filtering](#filtering) using column attributes - `df[df['col'] > 500]`. we can do the same when using option 2. our conditions will look like this now - `df[df.index.get_level_values(1) > 500]`
  ```txt
  state_pops.index.get_level_values(0)
  # Index(['AK', 'AK', 'AK', 'AK', 'AK', 'AK', 'AK', 'AK', 'AK', 'AK',
  #        ...
  #        'WY', 'WY', 'WY', 'WY', 'WY', 'WY', 'WY', 'WY', 'WY', 'WY'],

  state_pops.index.get_level_values(1)[:50]
  # Index([1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001,
          # 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
          # 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001,
          # 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
          # 1990, 1991],
  ```

### Hierarchical Columns

- we typically work with them when we use [groupings and aggregations](#grouping-and-aggregation) without for e.g. flattening them using **named aggregations**. assume we have created the following dataframe -
  ```txt
  titanic_stats = titanic.groupby(['pclass', 'sex']).agg({ 
      'fare': ['sum', 'mean'],
      'age': ['min', 'max', 'mean']
  })
  titanic_stats

  #                 fare                  age
  #                 sum        mean       min     max   mean
  # pclass  sex
  # 1       female  4926.0000  37.037594  2.0000  76.0  37.037594
  #         male    6195.4167  41.029250  0.9167  80.0  41.029250
  # 2       female  2832.4167  27.499191  0.9167  60.0  27.499191
  #         male    4868.8333  30.815401  0.6667  70.0  30.815401
  # 3       female  3372.1667  22.185307  0.1667  63.0  22.185307
  #         male    9060.8333  25.962273  0.3333  74.0  25.962273
  ```
- now, if we try inspecting the **columns** property of the **dataframe**, we see the below -
  ```txt
  titanic_stats.columns
  # MultiIndex([('fare',  'sum'),
  #             ('fare', 'mean'),
  #             ( 'age',  'min'),
  #             ( 'age',  'max'),
  #             ( 'age', 'mean')],
  #            )
  ```
- to access the individual columns, we can access them using the two options below. recall that when we try accessing a column, we get back a series - the labels of this series is the same as the original dataframe (which in this case is a **hierarchical index**), while the values of the series are the values of the column. note - the second option is preferred / more efficient i think, because we access the desired data in one go -
  ```txt
  titanic_stats['fare']['sum']  # option 1
  titanic_stats[('fare', 'sum')]  # option 2

  # pclass  sex
  # 1       female  4926.0000
  #         male    6195.4167
  # 2       female  2832.4167
  #         male    4868.8333
  # 3       female  3372.1667
  #         male    9060.8333
  ```

### Unstack

- helps pivot the index to columns. if we do not specify the level, the **largest** / **innermost** level is used
- assume we have the following **series** - 
  ```txt
  titanic_age_stats = titanic.groupby(['pclass', 'sex'])['age'].mean()
  titanic_age_stats

  # pclass  sex
  # 1       female  37.037594
  #         male    41.029250
  # 2       female  27.499191
  #         male    30.815401
  # 3       female  22.185307
  #         male    25.962273
  ```
- when we try plotting it, we get the following. recollection of how ploting of pandas **series** works by default - x axis is the **index** (which is **hiearchical index** / **multi index** in this case), y axis is the values
  ```txt
  titanic_age_stats.plot(kind='bar')
  ```
  ![](/assets/img/python-data-analysis/plotting-hierarchical-index-without-unstack.png)
- when we unstack without any arguments, the below is what happens - the innermost level of sex becomes a column
  ```txt
  titanic_age_stats.unstack()

  # sex     female    male
  # pclass
  # 1       37.037594  41.029250
  # 2       27.499191  30.815401
  # 3       22.185307  25.962273
  ```
- now when we try plotting this, we get the below. recollection of how plotting for a dataframe works - we get a bar for every attribute for every index. the values of these attributes is the y axis, the labels are the x axis
  ```txt
  titanic_age_stats.unstack().plot(kind='bar')
  ```
  ![](/assets/img/python-data-analysis/plotting-hierarchical-index-with-unstack.png)
- we can also specify the **level** we would like to unstack using - 
  ```txt
  titanic_age_stats.unstack(level='pclass')

  # pclass  1          2          3
  # sex
  # female  37.037594  27.499191  22.185307
  # male    41.029250  30.815401  25.962273

  titanic_age_stats.unstack(level='pclass').plot(kind='bar')
  ```
  ![](/assets/img/python-data-analysis/plotting-hierarchical-index-with-custom-unstack.png)
- note, my understanding - we have till now performed **unstack** on a **series** with **hierarchical index**. this results in a  **dataframe**, where the column is the level that we unstack, and a **level** from the **hierarhcical index** is removed
- complicating things because i am bored - when we try unstacking a **dataframe** with **hierarchical columns** - we get an additional level of **hierarchical columns**
  ```txt
  titanic_age_stats = titanic.groupby(['pclass', 'sex']).agg({
      'age': ['min', 'max', 'mean']
  })
  titanic_age_stats
  #                               age
  #                 min     max   mean
  # pclass  sex
  # 1       female  2.0000  76.0  37.037594
  #         male    0.9167  80.0  41.029250
  # 2       female  0.9167  60.0  27.499191
  #         male    0.6667  70.0  30.815401
  # 3       female  0.1667  63.0  22.185307
  #         male    0.3333  74.0  25.962273

  titanic_age_stats.unstack()
  #                                       age
  #         min             max           mean
  # sex     female  male    female  male  female     male
  # pclass
  # 1       2.0000  0.9167  76.0    80.0  37.037594  41.029250
  # 2       0.9167  0.6667  60.0    70.0  27.499191  30.815401
  # 3       0.1667  0.3333  63.0    74.0  22.185307  25.962273
  ```

## Textual Data

- by default, pandas assigns type object to columns if they cannot be assigned numeric data types. object data type encompasses strings, numbers, arrays, etc everything
- my understanding - even if a column is of type object, we can access string methods on it. the other option i believe is to convert it to string type first using [**astype**](#data-types)
- we can access string methods using **str**
  ```txt
  titanic['name'].str.lower()

  # 0      allen, miss. elisabeth walton
  # 1     allison, master. hudson trevor
  #                                  ...
  # 1307             zakarian, mr. ortin
  # 1308              zimmerman, mr. leo
  ```
- understand that we just used lower on the column, but pandas was smart enough to apply it to the entire series. this is also applicable to **string indexing**. e.g. the cabin column looks like below - it is a combination of deck and cabin number, and we make a new column just for deck as follows
  ```txt
  titanic['cabin']

  # 0       B5
  # 1  C22 C26
  # 2  C22 C26
  # 3  C22 C26

  titanic['deck'] = titanic['cabin'].str[0]
  titanic['deck']
  # 0  B
  # 1  C
  # 2  C
  # 3  C
  ```
- we can use slicing etc as well
- **strip** - strips whitespaces by default
  ```txt
  s = pd.Series(['1. Hawk.   ', '2. Pickle!\n', '3. Melonhead?\t'])
  s

  # 0        1. Hawk.   
  # 1       2. Pickle!\n
  # 2    3. Melonhead?\t

  s.str.strip()

  # 0         1. Hawk.
  # 1       2. Pickle!
  # 2    3. Melonhead?
  ```
- note - more features of the **strip** api - 
  - specify the characters to strip using the **to_strip** parameter
  - it also has different versions - **lstrip** and **rstrip** to only strip from beginning / end
- **split** - split strings into components. by default, the output would be a list for every string
  ```txt
  titanic['home.dest'].str.split('/')

  # 0                      [St Louis, MO]
  # 1  [Montreal, PQ ,  Chesterville, ON]
  # 2  [Montreal, PQ ,  Chesterville, ON]
  # 3  [Montreal, PQ ,  Chesterville, ON]
  # 4  [Montreal, PQ ,  Chesterville, ON]
  ```
- we can make each element its own **series** / **column** by setting the **expand** option to true
  ```txt
  titanic['home.dest'].str.split('/', expand=True)

  #    0             1                 2
  # 0  St Louis, MO  None              None
  # 1  Montreal, PQ  Chesterville, ON  None
  # 2  Montreal, PQ  Chesterville, ON  None
  ```
- note - more features of the **split** api -
  - a regex instead of a normal sring to split based on
  - we can specify the maximum limit i.e. the maximum number of columns the split should go upto. no more splits would be created, and everything would be put into the last column
- **replace** - we have already seen [replace](#modifying-columns-and-indices), but this is the replace method available for string data type
  ```txt
  ufos['duration']
  # 0    5 seconds
  # 1  3-5 seconds
  # 2          NaN
  # 3   10 seconds

  ufos['duration'].str.replace('seconds', 's')
  # 0    5 s
  # 1  3-5 s
  # 2    NaN
  # 3   10 s
  ```
- above was a simple use case, but we can get very complicated with **replace** - refer [docs](https://pandas.pydata.org/docs/reference/api/pandas.Series.str.replace.html) - we can match using **regex**, and instead of passing in what to replace with, we can pass a **callable** which would be called using the for e.g. regex that was matched
- **contains** - returns a boolean
- again instead of a plain string, we can pass in a regex to match as well
- a complex example - imagine the movies in our dataset have a "genres" column, which are separated by pipes. we can find the genre value counts as follows using **explode** - 
  ```txt
  movies['genres']

  # 0   Animation|Comedy|Family
  # 1  Adventure|Fantasy|Family
  # 2            Romance|Comedy
  # 3      Comedy|Drama|Romance

  movies['genres'].str.split('|').explode().value_counts()

  # Drama            20054
  # Comedy           13067
  # Thriller          7565
  # Romance           6662
  # Action            6542
  ```

## Apply and Map

- **apply** - run on every value of the **series**
  ```txt
  titanic['age']
  # 0  29.0000
  # 1   0.9167
  # 2   2.0000
  # 3  30.0000
  # 4  25.0000
  
  titanic['age'].apply(lambda x: (x, x * 365))
  # 0               (29.0, 10585.0)
  # 1  (0.9167, 334.59549999999996)
  # 2                  (2.0, 730.0)
  # 3               (30.0, 10950.0)
  # 4                (25.0, 9125.0)
  ```
- in case our function requires arguments, we can pass them as so - 
  ```txt
  titanic['fare']

  # 0  211.3375
  # 1  151.5500
  # 2  151.5500

  def currency_conveter(amount, denomination, multiplier):
      return f'{denomination}{amount * multiplier}'
  
  titanic['fare'].apply(currency_conveter, args=('$', 23))

  # 0  $4860.7625
  # 1    $3485.65
  # 2    $3485.65
  ```
- till now, we saw **apply** for **series**. when using **apply** on a **dataframe**, it will call the function for all **columns** by default. so, if we return back one value per column, we get back a **series**, where the labels are column names
  ```txt
  titanic[['age', 'fare', 'pclass']].apply(lambda col: col.max() - col.min())

  # age        79.8333
  # fare      512.3292
  # pclass      2.0000
  ```
- we can change it to be called for all **rows** instead. usecase - we have a complex calculation that involves multiple columns of the row. e.g. we have two columns, representing (number of siblings and spouses) and (number of parents and children) respectively. we can get the family size by adding the two. we need to pass in the **axis** argument, which is **index** by default
  ```txt
  titanic['relatives'] = titanic.apply(lambda row: row['sibsp'] + row['parch'], axis='columns')
  ```
- note - doing `titanic['relatives'] = titanic['sibsp'] + titanic['parch']` would also have worked in this case
- **map** (for **series**) - we pass it a dictionary, and it will replace any values matching the key of the dictionary with the value for that key
  ```txt
  titanic['pclass']
  
  # 0       1
  # 1       1
  #         ...
  # 1307    3
  # 1308    3
  
  titanic['pclass'].map({ 1: '1st', 2: '2nd', 3: '3rd' })
  
  # 0       1st
  # 1       1st
  #         ... 
  # 1307    3rd
  # 1308    3rd
  ```
- we can also pass a function to **map**, and **map** and **apply** will work in the same way in this case
- when we use **map** on **dataframes**, the function is run on all cells of the **dataframe**. recall how **apply** was only run along one of the axis - so, the function was either passed the entire row or the entire column
  ```txt
  titanic[['name', 'home.dest']]

  #    name                            home.dest
  # 0  Allen, Miss. Elisabeth Walton   St Louis, MO
  # 1  Allison, Master. Hudson Trevor  Montreal, PQ / Chesterville, ON
  # 2  Allison, Miss. Helen Loraine    Montreal, PQ / Chesterville, ON

  titanic[['name', 'home.dest']].map(lambda str: str.capitalize())

  #    name                            home.dest
  # 0  Allen, miss. elisabeth walton   St louis, mo
  # 1  Allison, master. hudson trevor  Montreal, pq / chesterville, on
  # 2  Allison, miss. helen loraine    Montreal, pq / chesterville, on
  ```

## Combining Dataframes

### Concat

- **concat** - concatenate series / dataframes
  ```txt
  import pandas as pd

  s1 = pd.Series(['a', 'b', 'c'])
  s2 = pd.Series(['d', 'e', 'f'])

  pd.concat([s1, s2])
  # 0    a
  # 1    b
  # 2    c
  # 0    d
  # 1    e
  # 2    f
  ```
- we can set **ignore index** to true if our index was not semantic. notice the difference in the index values above and below
  ```txt
  pd.concat([s1, s2], ignore_index=True)
  # 0    a
  # 1    b
  # 2    c
  # 3    d
  # 4    e
  # 5    f
  ```
- we can concatenate **by index** follows - 
  ```txt
  pd.concat([s1, s2], axis='columns')
  #   0 1
  # 0 a d
  # 1 b e
  # 2 c f
  ```
- however, this is not just putting side by side - it is actually using the index values to join. e.g. - 
  ```txt
  food = pd.Series(
      data=['avocado', 'blueberry', 'cucumber'],
      index=['a', 'b', 'c']
  )
  
  animals = pd.Series(
      data=['dolphin', 'bear', 'chameleon'],
      index=['d', 'b', 'c']
  )
  
  pd.concat([food, animals], axis='columns')

  #    0          1
  # a  avocado    NaN
  # b  blueberry  bear
  # c  cucumber   chameleon
  # d  NaN        dolphin
  ```
- notice the column names would be numeric by default. we can change that using the **keys** keyword argument
  ```txt
  pd.concat([food, animals], axis='columns', keys=['khana', 'janwar'])

  #    khana      janwar
  # a  avocado    NaN
  # b  blueberry  bear
  # c  cucumber   chameleon
  # d  NaN        dolphin
  ```
- note - we saw NaN earlier, because the join is **outer** by default. we can set it to **inner** as well
  ```txt
  pd.concat([food, animals], axis='columns', join='inner')

  #    0          1
  # b  blueberry  bear
  # c  cucumber   chameleon
  ```    
- till now, we were combining **series**. now, we combine **dataframes**. assume we have the data below - 
  ```txt
  harvest_21 = pd.DataFrame(
      [['potatoes', 9001], ['garlic', 1350], ['onions', 87511]],
      columns=['crop', 'qty']
  )
  #    crop      qty
  # 0  potatoes  9001
  # 1  garlic    1350
  # 2  onions    87511

  harvest_22 = pd.DataFrame(
      [[1600, 'garlic'], [560, 'spinach'], [999, 'turnips'], [1000, 'onions']],
      columns=['qty', 'crop']
  )
  #    qty   crop
  # 0  1600  garlic
  # 1  560   spinach
  # 2  999   turnips
  # 3  1000  onions
  ```
- when we try to concatenate the two dataframes, we get the below. note - even though the ordering of columns for the two dataframes were different, pandas combines them using the column names
  ```txt
  pd.concat([harvest_21, harvest_22])
  #    crop      qty
  # 0  potatoes  9001
  # 1  garlic    1350
  # 2  onions    87511
  # 0  garlic    1600
  # 1  spinach   560
  # 2  turnips   999
  # 3  onions    1000
  ```
- assume we have another dataframe with an extra column - 
  ```txt
  harvest_23 = pd.DataFrame(
      [['potatoes', 900, 500], ['garlic', 1350, 1200], ['onions', 875, 950]],
      columns=['crop', 'qty', 'profit']
  )
  #    crop      qty   profit
  # 0  potatoes  900   500
  # 1  garlic    1350  1200
  # 2  onions    875   950
  ```
- if we now try concatenating two dataframes with difference in columns, we get NaN for the missing columns
  ```txt
  pd.concat([harvest_22, harvest_23])
  #    qty   crop      profit
  # 0  1600  garlic    NaN
  # 1  560   spinach   NaN
  # 2  999   turnips   NaN
  # 3  1000  onions    NaN
  # 0  900   potatoes  500.0
  # 1  1350  garlic    1200.0
  # 2  875   onions    950.0
  ```
- to change this behavior, we can specify **inner** for the join type
  ```txt
  pd.concat([harvest_22, harvest_23], join='inner')
  #    qty   crop
  # 0  1600  garlic
  # 1  560   spinach
  # 2  999   turnips
  # 3  1000  onions
  # 0  900   potatoes
  # 1  1350  garlic
  # 2  875   onions
  ```
- the **ignore index** parameter behaves in the same way, already discussed
- we can also set up **hierarchical indexing** using the **keys** parameter - e.g. it is typical to analyze files for different years simultaneously, and we might want to encode this information in the form of a hierarchical index for the dataframe
  ```txt
  pd.concat([harvest_21, harvest_22, harvest_23], join='inner', keys=[2021, 2022, 2023])
  #          crop      qty
  # 2021  0  potatoes  9001
  #       1  garlic    1350
  #       2  onions    87511
  # 2022  0  garlic    1600
  #       1  spinach   560
  #       2  turnips   999
  #       3  onions    1000
  # 2023  0  potatoes  900
  #       1  garlic    1350
  #       2  onions    875
  ```

### Merge

- its closer to a database style join and is more flexible than [**concat**](#concat) since we can combine using columns instead of relying on the index
  ```txt
  teams = pd.DataFrame(
      [
          ["Suns", "Phoenix", 20, 4], 
          ["Mavericks", "Dallas", 11, 12], 
          ["Rockets", "Houston", 7, 16],
          ["Nuggets", "Denver", 11, 12]
      ], 
      columns=["team", "city", "wins", "losses"]
  )
  #    team       city     wins  losses
  # 0  Suns       Phoenix  20    4
  # 1  Mavericks  Dallas   11    12
  # 2  Rockets    Houston  7     16
  # 3  Nuggets    Denver   11    12
  
  cities = pd.DataFrame(
      [
          ["Houston", "Texas", 2310000], 
          ["Phoenix", "Arizona", 1630000], 
          ["San Diego", "California", 1410000],
          ["Dallas", "Texas", 1310000]
      ],
      columns=["city", "state", "population"]
  )
  #    city       state       population
  # 0  Houston    Texas       2310000
  # 1  Phoenix    Arizona     1630000
  # 2  San Diego  California  1410000
  # 3  Dallas     Texas       1310000
  ```
- now, if we perform a merge, an inner join is performed using the common column name automatically - 
  ```txt
  teams.merge(cities)
  #    team       city     wins  losses  state    population
  # 0  Suns       Phoenix  20    4       Arizona  1630000
  # 1  Mavericks  Dallas   11    12      Texas    1310000
  # 2  Rockets    Houston  7     16      Texas    2310000
  ```
- we can set the **how** parameter for join type. as we saw, it is **inner** by default, but we can set it to **outer**, **left**, **right**, etc
  ```txt
  teams.merge(cities, how='left')

  #    team       city     wins  losses  state    population
  # 0  Suns       Phoenix  20    4       Arizona  1630000.0
  # 1  Mavericks  Dallas   11    12      Texas    1310000.0
  # 2  Rockets    Houston  7     16      Texas    2310000.0
  # 3  Nuggets    Denver   11    12      NaN      NaN
  ```
- cross join is also there - all rows of one dataframe with all rows of the other dataframe
- by default, the same column name was used explicitly. we can however, specify the column(s) explicitly using the **on** keyword argument
  ```txt
  teams.merge(cities, on='city')
  ```
- note - we can specify multiple columns for the on parameter as well based on use case
- what if the two dataframes have similar column names, and are not being used for joining? pandas will suffix them with _x and _y by default. e.g. below, the name column is being used for the join, so it is only present once. however, the score column is not, and therefore it is preset with a suffix
  ```txt
  midterm = pd.DataFrame(
      [['shameek', 42], ['colt', 45]],
      columns=['name', 'score']
  )

  final = pd.DataFrame(
      [['shameek', 85], ['colt', 97]],
      columns=['name', 'score']
  )

  midterm.merge(final, on='name')

  #     name    score_x  score_y
  # 0  shameek  42       85
  # 1  colt     45       97
  ```
- we can however, specify the **suffixes** to append - 
  ```txt
  midterm.merge(final, on='name', suffixes=['_midterm', '_final'])

  #    name     score_midterm  score_final
  # 0  shameek  42             85
  # 1  colt     45             97
  ```
- also note how we had to specify **on** explicitly, otherwise both name and score would be used. since there is no data with the same value in both tables, we end up with an empty result set

## Seaborn

### Relational Plots

- uses [matplotlib](#matplotlib) underneath, and works well with pandas
- typically imported as sns
  ```txt
  import seaborn as sns
  ```
- to play around with seaborn, we can use any of the datasets present [here](https://github.com/mwaskom/seaborn-data) via **load dataset**. it returns the pandas dataframe
  ```txt
  tips = sns.load_dataset('tips')
  tips

  #    total_bill  tip   sex     smoker  day  time    size
  # 0  16.99       1.01  Female  No      Sun  Dinner  2
  # 1  10.34       1.66  Male    No      Sun  Dinner  3
  # 2  21.01       3.50  Male    No      Sun  Dinner  3
  ```
- note - for the default theme of sns to kick in which kind of looks good, run the following
  ```txt
  sns.set_theme()
  ```
- for a scatterplot, we can do the following - 
  ```txt
  sns.scatterplot(tips, x='total_bill', y='tip')
  ```
  ![](/assets/img/python-data-analysis/seaborn-getting-started.png)
- note - the exact above result could have been achieved without seaborn as well - 
  ```txt
  tips.plot(kind='scatter', x='total_bill', y='tip')
  ```
- but, now, look how we can simply pass **hue** for different scatter plots based on color on the same axes - 
  ```txt
  sns.scatterplot(tips, x='total_bill', y='tip', hue='sex')
  ```
  ![](/assets/img/python-data-analysis/seaborn-scatter-plot-with-hue.png)
- further, we can pass in **style** for different scatter plots based on marker on the same axes
  ```txt
  sns.scatterplot(tips, x='total_bill', y='tip', hue='sex', style='smoker')
  ```
  ![](/assets/img/python-data-analysis/seaborn-scatter-plot-with-hue-and-style.png)
- note - if we use the same column for **hue** and **style**, the marker and color both change, thus maybe improving readability
  ```txt
  sns.scatterplot(tips, x='total_bill', y='tip', hue='sex', style='sex')
  ```
  ![](/assets/img/python-data-analysis/seaborn-scatter-plot-with-same-column-for-hue-and-style.png)
- e.g. assume tips have a size column, which represents the number of people together. we can add the **size** keyword argument, which changes the size of the marker
  ```txt
  sns.scatterplot(tips, x='total_bill', y='tip', size='size')
  ```
  ![](/assets/img/python-data-analysis/seaborn-scatter-plot-with-size.png)
- assume we have a dataset for flights like so i.e. we have 12 records per year for each of the months - 
  ```txt
  flights = sns.load_dataset('flights')
  flights

  #    year  month  passengers
  # 0  1949  Jan    112
  # 1  1949  Feb    118
  # 2  1949  Mar    132
  ```
- e.g. we try to create a lineplot below. but, we do not specify how it should plot the multiple records that it gets for a passenger in a year. it plots using the **estimator** as **mean** by default
  ```txt
  sns.lineplot(flights, x='year', y='passengers')
  ```
  ![](/assets/img/python-data-analysis/seaborn-line-plot-default.png)
- if we wanted to achieve this ourselves using matplotlib, we would have to group it and then use the aggregation function like below -
  ```txt
  flights.groupby('year')['passengers'].mean().plot()
  ```
  ![](/assets/img/python-data-analysis/seaborn-line-plot-matplotlib-equivalent.png)
- estimators are pandas functions. we can also provide a custom estimator, e.g. `sum` as so - 
  ```txt
  sns.lineplot(flights, x='year', y='passengers', estimator='sum')
  ```
  ![](/assets/img/python-data-analysis/seaborn-line-plot-default-with-estimator.png)
- note how there is also a **confidence interval** that seaborn also adds to the plot. we can control its width, method, etc using **error bar**. setting it to None would remove it completely
  ```txt
  sns.lineplot(flights, x='year', y='passengers', estimator='sum', errorbar=None)
  ```
- my understanding - seaborn has two kinds of plots - **figure level plots** and **axes level plots**. the ones we saw above - **lineplot** and **scatterplot** are **axes level plots** their corresponding **figure level plot** is **relplot** or **relational plot**
  ```txt
  # initial
  sns.scatterplot(data=tips, x='total_bill', y='tip')

  # using relplot
  sns.relplot(data=tips, x='total_bill', y='tip', kind='scatter')
  ```
- but now, we can easily put different subplots / different axes on the same figure
- e.g. assume we would like to have different columns for the different values of sex
  ```txt
  sns.relplot(data=tips, x='total_bill', y='tip', row='time', col='sex', hue='smoker')
  ```
  ![](/assets/img/python-data-analysis/seaborn-relplot-introduction.png)
- a more involved example. break into - 
  - columns using sex
  - rows using time - lunch or dinner
  - different colors for smokers and non smokers
  
  ```txt
  sns.relplot(data=tips, x='total_bill', y='tip', row='time', col='sex', hue='smoker')
  ```
  ![](/assets/img/python-data-analysis/seaborn-relplot-involved-example.png)
- controlling figure size for **axes level plots** - we make the figure call first
  ```txt
  plt.figure(figsize=(4, 3))
  sns.scatterplot(data=tips, x='total_bill', y='tip')
  ```
- controlling figure size for **figure level plots** - relplot creates a figure for us bts, so we cannot call the figure ourselves. instead, we control size of each **facet** i.e. subplot using **height** and **aspect** (ratio between height and width)
  ```txt
  sns.relplot(data=tips, x='total_bill', y='tip', row='time', col='sex', hue='smoker', height=3, aspect=2)
  ```

### Distribution Plots

- [**relation plots**](#relational-plots) - relation between two things x and y
- **distribution plots** - distribution of data, e.g. histogram
- histogram example - assume we try to visualize the tips dataset - 
  ```txt
  sns.histplot(data=tips, x='tip')
  ```
  ![](/assets/img/python-data-analysis/seaborn-histogram-introduction.png)
- if we use **hue**, by default, they would come one on top of another. the opacity is such that they are see through - 
  ```txt
  sns.histplot(data=tips, x='tip', hue='smoker')
  ```
  ![](/assets/img/python-data-analysis/seaborn-histogram-with-hue.png)
- we can configure it to be **stacked** instead of appearing one on top of another
  ```txt
  sns.histplot(data=tips, x='tip', hue='smoker', multiple='stack')
  ```
  ![](/assets/img/python-data-analysis/seaborn-histogram-with-hue-and-multiple.png)
- we can also set multiple to be **dodge**, so that appear one beside another. note how i also configure **bins** in this case
  ```txt
  sns.histplot(data=tips, x='tip', hue='smoker', multiple='dodge', bins=5)
  ```
  ![](/assets/img/python-data-analysis/seaborn-histogram-with-hue-and-multiple-dodge.png)
- finally, we can add the **kde curve** to the histogram plot as well by setting kde to true
  ```txt
  sns.histplot(data=tips, x='tip', hue='smoker', kde=True)
  ```
  ![](/assets/img/python-data-analysis/seaborn-histogram-with-kde.png)
- above, we ovrlayed the **kde curve** on top of the histogram. however, we can add a standalone **kde curve** as well. below, we try to visualize the weights of different species of penguins simultaneously
  ```txt
  sns.kdeplot(data=penguins, x='body_mass_g', hue='species')
  ```
  ![](/assets/img/python-data-analysis/seaborn-kde-introduction.png)
- finally, we can also configure the precision by **adjusting the bandwidth**
  ```txt
  sns.kdeplot(data=penguins, x='body_mass_g', hue='species', bw_adjust=0.4)
  ```
  ![](/assets/img/python-data-analysis/seaborn-kde-with-bandwidth-adjustment.png)
- **histograms** / **kde plots** are also called as **univariate distribution plots** i.e. we only look at the distribution of a single feature
- we can look at **bivariate distribution plots** as well i.e. analyze two features at once, both on x and y axis
- **kde bivariate distribution plots** - try looking for smoother curves (like the hollow i believe?)
  ```txt
  sns.kdeplot(data=penguins, x='bill_length_mm', y='flipper_length_mm', hue='species')
  ```
  ![](/assets/img/python-data-analysis/seaborn-bivariate-kde-plot.png)
- **histogram bivariate distribution plots** - try looking for the concentrated coloring (like a heat map)
  ```txt
  sns.histplot(data=penguins, x='bill_length_mm', y='flipper_length_mm', hue='species')
  ```
  ![](/assets/img/python-data-analysis/seaborn-bivariate-histogram-plot.png)
- **rugplots** - ticks along the x or y axis to show the presence of an observation
  ```txt
  sns.rugplot(data=penguins, x='body_mass_g')
  ```
  ![](/assets/img/python-data-analysis/seaborn-rugplot-basics.png)
- this is not very useful by itself. because rugplots are useful when used with other plots. e.g. below, from our scatterplot, it is difficult to find out where the majority of the values lie, so we supplement it with a rugplot
  ```txt
  sns.scatterplot(data=diamonds, x='carat', y='price', s=2)
  sns.rugplot(data=diamonds, x='carat', y='price', alpha=0.005)
  ```
  ![](/assets/img/python-data-analysis/seaborn-rugplot-supplementing-scatterplot.png)
- we use **displot** for the **figure level plot** of distibution plots, no surprises here
  ```txt
  sns.displot(data=penguins, kind='kde', x='body_mass_g', col='species', row='island', height=2, aspect=2, hue='sex')
  ```
  ![](/assets/img/python-data-analysis/seaborn-displot-example.png)

### Categorical Plots

- **count plot** - displays count. but unlike **histograms** which typically used for numerical data, **count plots** are typically used for non numerical data
  ```txt
  sns.countplot(data=penguins, x='species', hue='sex')
  ```
  ![](/assets/img/python-data-analysis/seaborn-countplot-introduction.png)
- to achieve something similar when using matplotlib by itself, i did the following - 
  ```txt
  penguins[['species', 'sex']].value_counts().unstack('sex').plot(kind='bar')
  ```
  ![](/assets/img/python-data-analysis/seaborn-countplot-simulation-using-matplotlib.png)
- issue - if we tried to make a **scatterplot** for categorical data - it would be hard to comment on the density - 
  ```txt
  sns.scatterplot(data=titanic, x='pclass', y='age')
  ```
  ![](/assets/img/python-data-analysis/seaborn-scatterplot-for-categorical-data.png)
- solution 1 - we can use **stripplot** - it introduces a little bit of **jitter** to improve readability - 
  ```txt
  sns.stripplot(data=titanic, x='pclass', y='age')
  ```
  ![](/assets/img/python-data-analysis/seaborn-stripplot-example.png)
- solution 2 - we can use **swarmplot** - it ensures points are **non overlapping** to improve readability. my understanding - use this only for smaller / sampled datasets, otherwise achieving this can become difficult
  ```txt
  plt.figure(figsize=(10, 4))
  sns.swarmplot(data=titanic, x='pclass', y='age')
  ```
  ![](/assets/img/python-data-analysis/seaborn-swarmplot-example.png)
- note how i had to adjust the figuresize, otherwise i get the warning - `UserWarning: 15.2% of the points cannot be placed; you may want to decrease the size of the markers or use stripplot.`
- **box plots** - helps visualize distribution of categorical data easily. features - 
  - **q1** represents the 25% value
  - **q3** represents the 75% value
  - we have the **median** value plotted in between
  - the range between q1 to q3 is called **iqr** or **inter quartile range**
  - the lines surrounding iqr are called **whiskers**. they are placed relative to q1 and q3, and default to 1.5 i believe
  - finally, we have **outliers** outside these whiskers
  
  ```txt
  sns.boxplot(data=titanic, x='age')
  ```
  ![](/assets/img/python-data-analysis/seaborn-boxplot.png)
- using boxplot for categorical data - 
  ```txt
  sns.boxplot(data=titanic, x='pclass', y='age', hue='sex')
  ```
  ![](/assets/img/python-data-analysis/seaborn-boxplot-for-catgeories.png)
- combining boxplot and swarmplot. small reminder from [matplotlib](#matplotlib) that they go into the same figure and axes since we do not call a `plt.figure()` in between 
  ```txt
  sns.boxplot(data=penguins, y='body_mass_g', x='species')
  sns.swarmplot(data=penguins, y='body_mass_g', x='species', color='black')
  ```
  ![](/assets/img/python-data-analysis/seaborn-boxplot-and-swarmplot.png)
- **violin plot** - has the **box plot** at the center along with the **kde curve**. carefully look at the black line to see the median, inter quartile range and whiskers
  ```txt
  sns.violinplot(data=titanic, x='pclass', y='age')
  ```
  ![](/assets/img/python-data-analysis/seaborn-violinplot-introduction.png)
- note - if we add a hue, it creates different violin plots side by side
  ```txt
  sns.violinplot(data=titanic, x='pclass', y='age', hue='sex')
  ```
  ![](/assets/img/python-data-analysis/seaborn-violinplot-with-hue-without-split.png)
- we can however, change this behavior by providing the **split** parameter
  ```txt
  sns.violinplot(data=titanic, x='pclass', y='age', hue='sex', split=True)
  ```
  ![](/assets/img/python-data-analysis/seaborn-violinplot-with-hue-and-split.png)
- **bar plot** - again, compare the difference from [matplotib](#matplotlib), where there is no calculation - it just plots, while seaborn grouping and using an **estimator** like we saw in [**line plots**](#relational-plots)
  ```txt
  sns.barplot(data=titanic, y='pclass', x='survived', hue='sex', estimator='sum', orient='h')
  ```
  ![](/assets/img/python-data-analysis/seaborn-barplot.png)
- the black line i believe helps with approximation and thus faster plotting and calculations
- plotting the same thing using matplotlib - 
  ```txt
  titanic.groupby(['pclass', 'sex'])['survived'].sum().unstack().plot(kind='barh')
  ```
  ![](/assets/img/python-data-analysis/seaborn-barplot-simulation-using-matplotlib.png)
- **categorical plot** - figure level plot, not bothering as there is nothing new
