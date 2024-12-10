title: The magic of Vim script
----
I've pulled a random bit of documentation from `:help matchadd` to show off some of the magic thats referenced in the docs.

> Matching is case sensitive and magic, unless case sensitivity or magicness are explicitly overridden in {pattern}

This line makes me smile and think of a younger me writing simple plugins to highlight Points of Interest.

[Vim-poi](https://github.com/DanBradbury/vim-poi) was my first attempt to understand how colors and highlighting really worked in vim.

I've written about [`matchadd vs match` before](/post/matchadd-vs-match) and mostly cover the nuanced difference that is important for the implementation of `vim-poi`
