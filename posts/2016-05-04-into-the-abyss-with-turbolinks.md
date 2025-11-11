---
title: Into the Abyss with Turbolinks
tags:
- 'turbolinks'
- 'rails'
...
title: Into the Abyss with Turbolinks
comments: true
categories: ['turbolinks', 'rails']
---
Previous attempts to adopt `turbolinks` during upgrades or new projects led me to the conclusion that I have a burning hatred for everything the project stands for (rage hatred is the worst kind..). From conversations with other Rails folks + former CTOs it seemed like turbolinks was something I could avoid without batting an eyelash (see [comparisons to Windows 8 decision making](http://corlewsolutions.com/articles/article-9-remove-uninstall-delete-turbolinks-in-rails-4) or just ask a local Rails expert what their experience with `turbolinks` has been like)

As someone who previously ignored the efforts being made by DHH and the core team I would just start a new project with `--skip-turbolinks` to ensure my own sanity and continue with the hammering.

Since I'm a bit late to this conversation it's nice to read posts like [Yahuda Katz' problem with turbolinks](https://plus.google.com/+YehudaKatz/posts/A65agXRynUn) and [3 reasons why I shouldn't use Turbolinks](http://cobwwweb.com/turbolinks-not-worth-the-effort) to get my hopes and dreams crushed.. Here is just the beginning of the headache that one can look forward to if they are to continue down through the thorns

> ### Duplicate Bound Events
> Because JavaScript is not reloaded, events are not unbound when the body is replaced. So, if you're using generic selectors to bind events, and you're binding those events on every Turbolinks page load. [This] often leads to undesirable behavior.

Alright so to be honest this isn't that bad. People can bitch about global state all they want but as someone who enjoys thinking in a "game loop" I don't mind this and feel like I can easily write my own code to these standards

> ### Audit Third-Party code
> You audit all third-party code that you use to make sure that they do not rely on DOM Ready events, or if they do, that they DOM Ready events are idempotent.

And this is where it starts to get fun.. I just stumbled upon a bug that reared its head beacuse of these two issues and I wanted to post a solution that I may find myself using more moving forward..

Imagine we are using [`typeahead.js`](https://twitter.github.io/typeahead.js/) we want to go ahead and initialize our typeahead input on a given page. Here's what the JS might look like

    $('#searchBar .typeahead').typeahead({
      hint: true,
      highlight: true,
      minLength: 2
    },
    {
      name: 'estados',
      source: matcher(items)
    });

A pretty harmless call that you are probably going to copy paste in to try the first time you mess with `typeahead.js`. It works and you move on.. But be careful because `turbolinks` will give you some intereseting behaviour if we navigate between the page that has this piece of JS and another page. .

`Turbolinks` will invoke this each time the page is "loaded". Because of this we will spawn a new instance of the typeahead input and the associated hint div.. For some reason (one I don't care to look into) `typeahead.js` will spawn a new instance and hide the others rather than truly cleaning up. No matter what we are left to fend for ourselves in the wilds of `turbolinks` so we search for a solution.

I figure we can just handle global state a little better than your typical inline JS would. To do this we simply wrap the initializer in a conditional to verify the number of typeahead divs that are present on the screen. With proper naming we should be able to expand this approach to multiple typeahead instances.

    if($('.typeahead.tt-input').size() < 1) {
      $('#searchBar .typeahead').typeahead({
        ...
      }
    }

With that extra check we are able to handle the global state that turbolinks will create when natrually navigating and attempting to speed up our page.

A recent webcast featuring DHH got me thinking about how simple the problem of a web application really is. The server demands are not a problem whatsoever (30ms response times are all you need to be perfect anything lower is not truly noticable or necessary). We have an issue when it comes to how the rest of the "page-load" occurs for the user.

We all know the "hard refresh" links, the ones that clearly jump you to a new page with new content. Loading a new page is the same old same old that we've been doing since we could serve shit up. Of course the new way is the "one page app" that allows the user to navigate without ever having to disengage from the page they were on. IMO the trend is getting a bit insane (always felt the JS community was a bit heavy handed with trying new things..) and trying to keep up with the latest quarrels and trends is tiring. Where is the solution to the seamless application?

It's clear that some will say Ember or React are the way forward to building beautiful apps that will take over the world but I'm not sure I believe a JS Framework is what will carry an application. So why learn all that unecessary complexity when HTML5 is here?

If `Turbolinks` lives up to the into of the `README` I will be a happy Rails camper.

> Turbolinks makes navigating your web application faster. Get the performance benefits of a single-page application without the added complexity of a client-side JavaScript framework. Use HTML to render your views on the server side and link to pages as usual. When you follow a link, Turbolinks automatically fetches the page, swaps in its <body>, and merges its <head>, all without incurring the cost of a full page load.

C'mon Turbolinks don't let me down again..
