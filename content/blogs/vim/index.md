---
title: Vim
tags: ["editor"]
---

In this blog, I would cover my understanding of Vim.

# About

- vim stands for vi improved. it is the successor of vi
- it is available in most systems by default and can also be used in popular ides like jetbrains and vscode
- neovim is like an ide. its advantage is that it is highly customizable through plugins, and it has a lot of plugins

# Modes

- normal mode - we enter this mode by default. press esc key to enter it
- insert mode - to make changes. press `i` in normal mode to enter it. note: inserts before where the cursor is
- command mode - to enter commands. press `:` in normal mode to enter it, enter key to execute the command
- replace mode, visual mode discussed later

# Open, Write and Quit

- `vim file_name` to open a file / create and open the file if it does not exist
- `:w` - write changes
- `:wq` - write changes and quit
- `:q` - quit, only works if no changes were made
- `:q!` - ignore the changes that were not written and quit

# Navigation

- i plan to use arrow keys to move. vim users prefer `h` (left), `j` (down), `k` (up) and `l` (right)
- for navigating between words, i plan to use shift + arrow keys. vim users prefer `w` for forward, `b` for backward
- for beginning / end of line, i plan to use home / end keys. vim users prefer `^` and '$' respectively
- for page up / page down, i plan to use the page up and page down keys. vim users prefer ctrl + `f`, ctrl + `b`
- go to beginning of file using `gg`
- go to end of file using `G`
- go to a specific line using line number + (`gg` / `G`)
- prefix with numbers to repeat commands in vim, e.g. 3 + down arrow key to move down thrice
- `z` + enter to move the line where the cursor is to the top of the window
- `zz` to move the line where the cursor is to the middle of the window
- jump to closing bracket e.g. ) or } using `%`

# Deleting

- `dd` to delete line
- `dw` to delete from cursor to end of current word
- `diw` to delete the word inside which the cursor is
- similarly, if inside (), {}, etc, we can use `di(`, `di{`, etc. to delete blocks of code
- can prefix with numbers e.g. `3dw` to delete three words
- `d` + end key to delete upto end of line
- `d` + `G` to delete upto end of file
- deleting saves to registers too
- can also select using visual mode then press `d` to delete everything that was selected
- to delete upto some character, `d` + `f` + `<<that_character>>`
- note: in most commands that were discussed, we are combining `d` with another command 

# Yanking

- used for copying text
- `yy` to delete line, and so on all patterns same as delete

# Changing

- `cc` to change line, and so on all patterns same as delete

# Replace Mode

- used for overwriting over existing text
- when in normal mode, to change one letter, use `r` + the new character
- `R` to enter replace mode - for now i will probably delete and insert

# Pasting

- `p` to paste after cursor
- `P` to paste before cursor

# Visual Mode

- to select particular words, sections, press `v` then use navigation commands
- for selecting full lines, `V` is better, as it either selects the whole line or does not select it
- ctrl + `v` to enter column select mode

# Undo and Redo

- `u` to undo
- ctrl + `r` to redo
- `.` to repeat commands, e.g. use `diw` then go within another word then press `.`

# Registers

- to view contents of the registers, we use `:registers` + enter
- to use a register, we can use register_name + command, e.g. `"1p`, `"zdw`, etc

### Unnamed

- default register i.e. when no register is specified while making modifications
- stores the most recently yanked / deleted / changed text

### Numbered

- it is named using format `"0`, `"1`, etc
- `"0` - stores the last yanked test
- `"1` - stores the last deleted / changed text
- when text is deleted / changed again, contents of `"1` go to `"2`, and so on

### Named

- instead of relying on numbered registers, we can use named registers like `"a`, `"b`, etc
- now we can move text into / put text from these registers

### Clipboard

- can be accessed using `"+` register
- e.g. when we right-click and copy from chrome and then want to paste in vim

# Indenting

- `>>` to indent right
- `<<` to indent left
- `==` to fix indentation of a line
- select text then press `=` to fix indentation
- e.g. to fix indentation of the file, `gg` + `v` + `G` + `=`
- select text and then press just `<` or `>`

# Finding

- `f` + `<<character>>` to go to the next occurrence of that character
- `F` + `<<character>>` to go to the previous occurrence of that character
- `/` + enter to search for a word, `n` to go to its next occurrence, `N` to go to previous occurrence

# Replacing

- `[range]s/old_word/new_word/[flags]` to substitute
- so, `:1,$s/old_word/new_word/g` to replace all words in the current file
- select using `V`, then just `:s/old_word/new_word/g` to replace

# Settings

- we can specify settings using `:` + the commands
- they are lost when we quit vim
- to preserve them, use ~/.vimrc file. below are the current contents of my vimrc file

```
set number

set tabstop=2
set shiftwidth=2
set expandtab
set autoindent

set mouse=a
set clipboard=unnamedplus
```

# Help Mode

- `:help` + command to get help for
- whatever is inside `[]` is optional

# Change Case

- `~` - toggle case of current character
- `g~~` - toggle case of current line
- `g~w` - toggle case of current word
