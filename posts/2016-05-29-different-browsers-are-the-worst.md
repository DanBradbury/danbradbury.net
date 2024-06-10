title: Different browsers are the worst
date: 2016-05-23 14:16:23 -0700
comments: true
categories: ["web", "bootstrap", "css", "javascript", "FE", "browsers", "safari", "browser bugs"]
---
While working on a personal project I ran into an issue with a bootstrap navbar collapse. In my local testing everything went fine and I decided to push and hoped everything would behave properly.. I grab my iPhone 5 and take a look only to see that the dropdown is not working at all.

After doing some googling I came across a [SO post](http://stackoverflow.com/questions/20960405/bootstrap-3-dropdown-on-ipad-not-working) that accurately described the shitty situation I found myself in (the dropdown working in all browsers (including IE) and failing on all iOS devices)

The guy was apparently using a `<a>` tag without the `href` attribute which would fail to trigger the collapseable menu. That's all fine and good but I'm trying to use a span and am too lazy to wrap my one line in a tag so I hunt for a better solution..

My original (almost functional code) trigger looks like this

    <span class="glyphicon glyphicon-menu-hamburger navbar-toggle" "style"="color:white;", "data-toggle"= "collapse", "data-target"=".navbar-collapse" />

Can you spot what's missing with this simple `data-toggle`? It turns out you need to add `cursor: pointer` to the style of whatever the element might be..

If the majority of people are usin links and buttons to trigger collapsable content then everything will work as expected and no problems will be had. For people who do what they want there's shit like this to deal with.

And that's the web for you. Use some CSS/JS library like Bootstrap in hopes of saving yourself time and then tackle random shit like this. For the novice I'd imagine this would be an aggravating roadblock that would make hault all progress for a few solid hours until they give up and use a button or link to accomplish the same thing as adding the `cursor: pointer` styling.

If you want to do work with web applications enjoy things like this because this is what we deal with on the daily.
