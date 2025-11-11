---
title: Vim Tricks - Googling with keywordprg
tags:
- vim
- keywordprogram
- various.txt
- workflow
- utility-belt
- vim-tricks
...
Most vim users are familiar with the man page lookup; `K` under the cursor or on visual selection. For anyone who needs a quick refrersher lets take a look at the help docs (`help :K`)

    K     Run a program to lookup the keyword under the
          cursor.  The name of the program is given with the
          'keywordprg' (kp) option (default is "man").  The
          keyword is formed of letters, numbers and the
          characters in 'iskeyword'.  The keyword under or
          right of the cursor is used.  The same can be done
          with the command
            :!{program} {keyword}

So we can see that the default program (`keywordprg` / `kp`) is defaulted to "man" and the keyword is determined by what is right under the cursor when it is used. The other important thing to not is the fact we could invoke man or whatever program we want using `:!program_name` but that's not as fun as reconfiguring the default behavior to do what we want.

Let's imagine that for some reason we find ourselves copying sections of text and searching google for the results. Rather than doing this over and over why not just change the `keywordprg` to a custom bash script to do what we want. First thing's first lets write a simple bash script to open up the browser (I assume every OS has some way to open a browers with a given URL; This is written on an Ubuntu machine but if I were on a Mac I'd use `open` and test / google to make sure the syntax works as expected)

    #!/bin/bash
    firefox "https://www.google.com/serach?q=$1"

Give it a handy name like `googleShit`, move it into your PATH and  and pop open that `~/.vimrc` to change your default `keywordprg`

    set keywordprg=googleShit

And now when you use `K` inside a new vim session you will be googling contents rather than looking up the man pages! If you find yourself repeating a task under the cursor or in visual mode pretty handy trick to have in the utility belt. Use a little imagination and you can come up with something to improve your daily workflow.
