---
title: Vimscript isn't bad. You are just dumb.
tags:
    - vim
    - vimscript
    - viml
    - vim9script
...
I want to talk about folks complaining without knowing anything. The topic for today will be vimscript / vimL and particularly vim9script.

There has been a lot of stupidity around vimscript lately and I wanted to just share one that triggered this post.

![](https://github.com/user-attachments/assets/1aec4e6c-d662-44bc-b484-3952b49159ea)

He is right that vimscript (pre vim8 / right around the `nvim` fork) was not in a great place. At the time Bram was not working full-time on Vim but was clear about his goals and direction for the language for vim8 and beyond. If you haven't read the plans for vim8/9 my last post covered the vision that Bram had for the language and addressing the legitimate concerns with the state of the language and modernizing it for a new generation of developers.

Unfortunately the `nvim` wave was already in full-swing and it became vogue to bash vim users while claiming LUA was the future of plugin writing. Nvim folks have been living in their bubble without much consideration for where Bram left the original project that started this all. Rather than having constructive conversations on the future of vim/nvim we have decided that the split is too far gone; vim9 features never made it into nvim and many never will.


The desire to dunk on classic vim users and continue the lie that vimscript is terrible is just lame. I'd be surprisded if the folks who are bashing vimscript have written compliant vim9script, used vim8-popups, or any features introduced nearly 10 years ago in vim 8.0 (async, jobs, lambdas)

As someone who's written vimscript for 10+ years I'd like to think I am far more qualified to have this conversation then the tech influencer community who starts to shake when they see `a:args`.. people love dunking on variable scoping in vim but don't know vim9 got rid of all that. When you are writing plugin code there is an expectation that you have to understand quite a bit of the underworkings to effectively make things happen. Vimscript is not `python` or `javascript` where you use whatever library will magically solve your problem with a clean DSL; it is a specific language for a very specific purpose and it does it well.
