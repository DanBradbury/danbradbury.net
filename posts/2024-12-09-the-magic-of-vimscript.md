title: The magic of Vim script
----
I've pulled a random bit of documentation from `:help matchadd` to show off some of the magic thats referenced in the docs.

> Matching is case sensitive and magic, unless case sensitivity or magicness are explicitly overridden in {pattern}

This line makes me smile and think of a younger me writing simple plugins to highlight Points of Interest. [Vim-poi](https://github.com/DanBradbury/vim-poi) was my first attempt to understand the innerworkings of colors and highlighting in vim. Back then I wrote about [`matchadd vs match` before](/post/matchadd-vs-match) and mostly cover the nuanced difference that was important for the implementation of `vim-poi`. There was plenty of magic in there but that's not the point of this post.

The true magic of Vim script is what Bram left us with in `vim9`; as most folks know Bram is no longer with us but vim will continue and be forever grateful for his fantastic contributions to software engineering. With his passing I think its more imporant than ever to pay attention to the suggestions he had for the future of Vim Script, luckily for us he left some fantastic notes in his [fork for vim9](https://github.com/brammool/vim9). There are 2 main things that I want to point to;

1. Vim Script is fast.
This was not always the case but since vim9 things have been pretty snappy. I've included the example from the README to demonstrate how much faster vim has become.

```vim
  let sum = 0
  for i in range(1, 2999999)
    let sum += i
  endfor
```

| how     | time in sec |
| --------| -------- |
| Vim old | 5.018541 |
| Python  | 0.369598 |
| Lua     | 0.078817 |
| Vim new | 0.073595 |

2. Removal of Interfaces
There was a period when vim functionatlity was handled with built-in script languages to make things easier. This was a cute idea but never caught on / is no longer necessary with the advancements of Vim 9. Bram encourages the phasing out the use of built-in language interfaces to help improve the maintenance of vim and allow for better backwards compatability. Since the introduction of channel/job into vim8 there is no reason to not write an external tool that just interfaces with vim as needed.

From Bram himself..

> All together this creates a clear situation: Vim with the +eval feature will be sufficient for most plugins, while some plugins require installing a tool that can be written in any language. No confusion about having Vim but the plugin not working because some specific language is missing. This is a good long term goal.

I am in full agreement with his assesment and am hoping that we can kill interfaces and make vim even better. There are plenty of plugins around that massively leverage these interfaces and it will not be easy to get the community to embrace the removal of interfaces entirely, however I think it would be short-sighted of us to not think about the long-term success and ability for new vim users to write plugins and make vim the exact editor that they want and need.

## Vim script needs love
Compared to a modern programming language it is quite obvious that Vim script is missing a few things. The strange function arguments being prefixed with `a:`, local script variables with `s:`. Vim script does things that no other language that I know of does and it needs to stop. The obvious hurdle is going to be moving existing code to Vim script; think of type checking, classes, etc that do not exist in the language currently. Bram believes that a conversion script could be written to help facilitate that transition to Vim script.

Bram clearly had goals and ideas with where he wanted Vim script to go; more like Javascript/Typescript to make writing it more digestable for folks. At this current moment writing Vim script still feels like an academic exercise and not as expressive as a Ruby/Python. It's unreasonable to expect a developer experience like Ruby but I really think folks that love vim and want to see it succeed into the future should take a real hard look at how we can make improvements to the fantastic foundation laid out the creator himself.

I'll try to do my part and start contributing to the project in any way that I can. At this point I'm looking directly at `vim9script.c` and dreaming of a world where we can bring some of Bram's ideas to reality.