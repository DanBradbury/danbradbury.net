---
title: "Requirements for a Text Editor"
tags:
- editors
- craftsmanship
- tooling
...

> These are my minimum requirements for a competent text editor. The list is meant to serve as a quick litmus test for true understanding of tooling in the craft of writing software.


1. Navigate with ease; jumping to line number, move to top/bottom of file, selection/deletion helpers (inside of quotes, block, function, etc)
2. Fuzzy file finder + jump to mentioned files / methods
    - I use [`ctrl-p`](https://github.com/ctrlpvim/ctrlp.vim) to fuzzy find in vim (one of my must have plugins)

    ![](https://camo.githubusercontent.com/0a0b4c0d24a44d381cbad420ecb285abc2aaa4cb/687474703a2f2f692e696d6775722e636f6d2f7949796e722e706e67)
    - For part of my day `rails.vim` provides handy helpers to jump from model to controller using custom commands like `:Emodel`, and `:Econtroller`. When not working with Rails I can typically rely on `ctags` to do the trick and allow me to `gf` around projects at will (hard to beat `Command+Click` inspection in RubyMine)
3. Run spec(s) without having to Alt+Tab
    - I use `vim-dispatch` to run tasks in the background and have the results returned in the vim quickfix window
    - When running a single test or named context I can use a custom hotkey to select the test name under the cursor and create the dispatch command to run
4. Find Regex pattern within file (replace, count, etc)
    - I'm lucky enough that my editor has `%s`. Allows for a ton of options with the same simple DSL
5. Search entire project (git grep or Ag inside the editor)
    - Results should be returned in easy to parse format with jump-to-file capabilities
6. Organize code into tabs / windows / panes
    - This should come with all editors now but please know how to `vsplit` if you claim to be a `vi` user..
7. View git changes within file (+/- on line numbers) and basic git workflow integration (git blame, commit/push without leaving editor)
    - I use [`vim-gitgutter`](https://github.com/airblade/vim-gitgutter) to track changes to the file. This has become a staple of my vim config and I couldn't imagine working without it.

    ![](https://camo.githubusercontent.com/f88161827e0cbb3144455b9e5c7582fdd5b5fc83/68747470733a2f2f7261772e6769746875622e636f6d2f616972626c6164652f76696d2d6769746775747465722f6d61737465722f73637265656e73686f742e706e67)
    - For the rest of my git functionatlity I use Tim Pope's [`vim-fugitive'](https://github.com/tpope/vim-fugitive), serves as a wonderful git wrapper for the majority of git commands.
8. Customizability
    - This is the whole reason I am a `vim` user. I love the ability to change almost all facets of the editor; from basic config options in `.vimrc` to adding `autocmds` to change functionality for events within the editor (file open, file save, etc). In my mind an editor should allow the user to tailor the tool exactly how they want it.

It's important for anyone writing software to respect the craft and maximize the effectiveness of the tools we use to create. Since the editor is such an important tool in our toolbelt we should always strive to optimize and improve our daily usage.

