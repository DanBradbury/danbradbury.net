---
title: Turbolinks: Leaving the Abyss
tags:
- 'turbolinks'
- 'rails5'
...
Just trying to do things like

    <a href=”#” onclick=”alert(1)”>ZZZ</a>

Expected behavior here?.. Scroll to top of the page right? Not if turbolinks is doing its thang.

From my previous write-ups on Turbolinks ([1](http://danbradbury.net/blog/2016/05/04/into-the-abyss-with-turbolinks/) [2](http://danbradbury.net/blog/2016/06/26/turbolinks-fail/)) I was pretty understanding about the inherent behavioural differences for all things links.

If I wasn’t aware of Turbolinks I’d be incredibly confused by this incredibly simple bit of code. This time I was lucky enough to spot the Turbolinks loarder bar attempting to do unnecessary work and knew what the issue was

![](https://i.imgur.com/tHc6QwI.png)

On top of initial confusion the fact that something like href=”#” doesn’t work according to spec is pretty frustrating and difficult to understand.

![](https://i.imgur.com/4LZ7Ci8.gif)

### If we really want a link what do we do
`<button>` is your friend. Include Bootstrap and link style that SOB if you really want that link feel.. a bit annoying but easy enough to add to a project and remember `class="btn btn-link"`...

The reason that works is because by default Turbolinks is only looking for `<a href>` **links** pointing to the current domain (of course we can turn this off w/ `data-no-turbolinks='true'`

All this additional knowledge for such little gain is not worth it. I don’t care to remember or reason about how Turbolinks will be handling history or trying to optimize potential page loads. Unless I’m building a single page app that has the same feel across all browsers and devices I’m not interested in the [additional complexities](https://github.com/turbolinks/turbolinks#building-your-turbolinks-application).

No disrespect or hating on the idea for Rails 5 to include turbolinks by default; it’s understandable that to remain relevant in the app academy days of development folks are looking to build single page apps that will become the next hot thing.

I am officially on the `rails new my_app --skip-turbolinks` 🚂 now

