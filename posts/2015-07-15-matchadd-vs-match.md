---
title: Matchadd Vs Match
tags:
...
The target of this post is to clear up any confusion about the subtle differences between `matchadd` and `match`/`2match`/`3match`. This is not meant for the novice vim user but folks that have some experience with vimL. I'll try to keep it as simple as possible for anyone interested in some of vim's inner workings.

From `:help match` we get the following information:


    :mat[ch] {group} /{pattern}/
    		Define a pattern to highlight in the current window.  It will
    		be highlighted with {group}.  Example:
    			:highlight MyGroup ctermbg=green guibg=green
    			:match MyGroup /TODO/
    		Instead of // any character can be used to mark the start and
    		end of the {pattern}.  Watch out for using special characters,
    		such as '"' and '|'.

    		{group} must exist at the moment this command is executed.

    		The {group} highlighting still applies when a character is
    		to be highlighted for 'hlsearch', as the highlighting for
    		matches is given higher priority than that of 'hlsearch'.
    		Syntax highlighting (see 'syntax') is also overruled by
    		matches.

From the definition it should be pretty clear that match is responsible for applying defined highlights to the current window. The `{group}` argument is simply the name of the highlight group definition you would like to use on a given `{pattern}`.

To visualize a list of all available highlight groups you can use `:highlight`. This is really handy when programatically trying to add hightlight groups for a plugin. As you can see from the screenshot below our colorscheme has redefined the majority of the groups and `:hi` does a great job showing all of the possibile combinations.

![](http://i.imgur.com/64zlIqN.png)

Using that information we could use any one of the groups and apply a match in our current buffer. Let's take a look at using the `ErrorMsg` highlight group to match the entire contents of a line.

    :match ErrorMsg /\%13l/

If you have not used `match` before take a moment now to play around with it in your own vim session and get a feel for how vim reacts to all different types of scenarios. Which match takes priority when running consecutive matches on the same pattern?

One of the main limitations with using `match` is that you cannot continuously apply new matches and have the previous ones stick. Because of this it is not the most suitable option for creating any sort of full fledged highlighting plugin. If you read the help section below match you will encounter `:2match` and `:3match` which is meant to provide a way to manage 3 seperate highlight groups. Unfortunately these functions suffer from the same shortcoming we saw with the original match.

In order to compensate for the limitation on match you can create more complex patterns to include multiple line selections (`/patern1\&pattern2/`) or whatever else you would normally do inside of the typical vim search regex (remember a touch of magic is only a `\M` away with this type of searching). If you'd like to see evidence of the hacks that are possible while using check out the [first iteration of vim-poi](https://github.com/DanBradbury/vim-poi/blob/29d7d5aec131595c0249f4a96cf5eee8af98cbde/plugin/poi.vim) (`fresh-start` branch is ready for testing and this logic will all be replaced with the smarter and better `matchadd` pattern)

```vim
  for i in b:poi_lines{a:group}
    let c += 1
    if c == 1
      let s:build_string = s:build_string.'/\%'.string(i["line_num"]).'l\&\M'.i["content"]
    else
      let s:build_string = s:build_string.'\%'.string(i["line_num"]).'l\&\M'.i["content"]
    endif
    if c == len(b:poi_lines{a:group})
      let s:build_string = s:build_string.'/'
    else
      let s:build_string = s:build_string.'\|'
    endif
  endfor
```
