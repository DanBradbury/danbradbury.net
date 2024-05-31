title: Turbolinks and anchors
date: 2016-06-26 14:11:09 -0700
comments: true
categories: ["turbolinks", "rails", "html"]
---
So far my journey with `turbolinks` hasn't been too bad; I write my slop and things work as I'd expect them to. I knew this streak of good luck was bound to come to an end at some point and today is the day.

I had the misfortune of attempting to implement simple anchor tags. At first I thought I had made a typo but upon checking my code everything was fine. Another test and I noticed the damned `.turbolinks-progress-bar` appearing onclick. It was clear `turbolinks` had mistook my anchor link and was intercepting the click like it should be doing with other links. Things got strange when adding `data-no-turbolinks` yielded the same results..

After googling I found a [closed issue](https://github.com/turbolinks/turbolinks-classic/issues/399) that had apparently been resolved. Checked my `turbolinks` version and we've got the latest and greatest. Hastily closed issue back in 2014 leads us to the [same issue in present day](https://github.com/turbolinks/turbolinks/issues/75). There's a bit of discussion on the issue but doesn't look like anyone has offered a PR to resolve the issue :(

There are a few snippets to override the default behavior that could prove useful but this is something that I'd expect the `turbolinks` to have ironed out.

Because I don't mind writing an `onclick` for the links I'll probably implement something like this for a similar effect
```javascript
$('html, body').animate({scrollTop: $('#anchor').offset().top}, 'slow')
```

I'm definitely disappointed in `turbolinks` for failing me on this instance but will continue on this less travelled mysterious path DHH wants me to believe in.
