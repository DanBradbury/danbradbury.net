title: Vim9 Script
----
In my late night hours I've been doing some more digging into Vim internals and been lately interested in the performance gains and changes introduced by Vim9 script. I've been pleasently surprised by more and more features as I've gone through this journey of writing more Vim script for personal plugins (org mode port [pland.vim][], [copilot-chat.vim])

Tonight I want to write-up a bit of an aha moment that I've had with modern Vim9 script and what we will call legacy vim script.. Might be a bit embarassing as an avid vim user who thought they knew things about how vim internals works but I had no idea that classes, interfaces, or new style functions is net new to Vim9 script. Time to sit down with some help docs and learn some things and leverage some of this goodness in my own projects

## Legacy vs Vim9
Why should people even care about Vim9 script when lua has seemingly become the defacto choice for anyone writing plugins?

Bram lays it out pretty nicely in the beginning of the docs.
```
:help vim9
----
1. What is Vim9 script?					*Vim9-script*

Vim script has been growing over time, while preserving backwards
compatibility.  That means bad choices from the past often can't be changed
and compatibility with Vi restricts possible solutions.  Execution is quite
slow, each line is parsed every time it is executed.

The main goal of Vim9 script is to drastically improve performance.  This is
accomplished by compiling commands into instructions that can be efficiently
executed.  An increase in execution speed of 10 to 100 times can be expected.

A secondary goal is to avoid Vim-specific constructs and get closer to
commonly used programming languages, such as JavaScript, TypeScript and Java.

The performance improvements can only be achieved by not being 100% backwards
compatible.  For example, making function arguments available in the "a:"
dictionary adds quite a lot of overhead.  In a Vim9 function this dictionary
is not available.  Other differences are more subtle, such as how errors are
handled.

The Vim9 script syntax and semantics are used in:
- a function defined with the `:def` command
- a script file where the first command is `vim9script`
- an autocommand defined in the context of the above
- a command prefixed with the `vim9cmd` command modifier

```
### Takeaways
- Legacy scripts won't automatically become faster
- Vim9 script syntax is an acknowledgement that legacy script was arcane
- Improved performance does not achieve 100% backwards compatability
- We have ways to introduce Vim9 script into existing plugins without requiring full rewrites

Probably not enough to get everyone excited enough to drop lua but lets dig into some of these things

## New function syntax
### The Old way
```viml
function OldFoo(thing)
  let a = 1
  echo a
  echo a:thing
endfunction

OldFoo('test')
```

The main weirdness here being arguments requiring `a:` prefix to be accessed. Everyone who has written vim script before has not enjoyed this bit.. this is fixed with new functions + the syntax is shorter across the board

### The Vim9 Way aka. `fast-functions`
Yes if you `:help fast-functions` you will get the new vim9 docs with a ton of goodies
```viml
def NewFoo(thing)
  var a = 1
  echo a
  echo thing
enddef
NewFoo('test')
```
1. No more use of `let`
```
- Assign values without `:let` *E1126* , declare variables with `:var`: >
	var count = 0
	count += 3
```
2. Say goodbye to the use of `a:` and the dictionary overhead that came with that

Also good to callout that this is the laziest port from `function` to `def` but we have additional abilities that should be leveraged by Vim9 script writers; arg and return types are a win.

```
def Foo(thing: string, count: number): bool
  var a = 1 + count
  return true
enddef
```

### Disassembling Fast-functions
![image](https://github.com/user-attachments/assets/f3bad698-c81c-4c2e-93e4-b464c002db39)

Assume we have the following simple function
```
def Thing()
  var a = 1
  echo a
enddef
```

Using `:disa Thing` after sourcing the file we get some pretty handy output. The focus / priority on providing profiling and debugging tools is a big improvement for how I like to work with a given language.

![image](https://github.com/user-attachments/assets/56a3f7cd-74fb-436d-8fb6-1a7db03b12ca)

### Where to go from here?
It might be time to rethink / do some digging into legacy scripts that have been historically problematic / not feature rich enough for our initial needs and wants as a dev community. I'm excited and find myself reading more and more vim internal c code + being excited by not having to reluctantly join the lua/nvim folks. Forever a gvim weirdo. 

[pland.vim]: https://github.com/DanBradbury/pland.vim
[copilot-chat.vim]: https://github.com/DanBradbury/copilot-chat.vim
