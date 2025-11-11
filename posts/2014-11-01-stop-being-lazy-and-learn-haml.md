---
title: Stop Being Lazy And Learn Haml
tags:
...
The desire to write familiar view code, similar to the same `html` you were writing to support your shitty LAMP apps is completely understandable but it's time to move on from the glory days..

There seems to be this idea that using `erb` is "good enough" in all scenarios because so many of web devs are accustomed to seeing their old friend html.. As someone who knowingly opted out of using Haml because HTML always felt like option that would give me the most flexibility. Since the actual engine driving the browser has a simple set of responsibilites (*MASSIVE OVERSIMPLIFICATION*: fetch a document from a URL and render the contents of that document onto the page) the document that we are going to be providing to the browser's engine must adhere to standards that allow many browsers to function with their various implementations. Because of this fact debugging/learning a templating engine is actually a walk in the park if your HTML skills are as sharp as they should be..

To be fair; when researching Haml it may not be clear what you are getting yourself into.

    <section class=”container”>
      <h1><%= post.title %></h1>
      <h2><%= post.subtitle %></h2>
      <div class=”content”>
        <%= post.content %>
      </div>
    </section>

To be honest the above code doesn't look to be that bad to me but I've never really had an "eye for design". As an additional bonus I know exactly what the browser output is going to be (assuming no CSS + JS messing with things). But let's take a look at some haml code..

    %section.container
      %h1= post.title
      %h2= post.subtitle
        .content
          = post.content

The raw number of keystrokes should be striking to get the same browser output. The declarative simplicity that Haml provides is unbelievable when you consider all the bullshit we deal with when writing HTML. Anyone who written web apps can tell you at least one tail of a missing closed tag.

I was hesitant about writing something that wasn't what I knew and used for a long time. The notion of "what works for me" is not a good enough reason to write code that is sub par. Since most devs are bright enough folk I don't think learning Haml is more than a 1 micro-project away from being your new favorite way to write your views.

For more information on Haml check out the Haml Homepage. All links to get started should be easily accessible from there.

The beauty of using haml in every day development is that your code shape will be forced to be much nicer and cleaner. Consider writing a container div with a header, body, and footer.  One would hope for clear structure that tells a "foreign eye" exactly what is going on in the given view.

Just imagine the skeleton that would evolve in the html version of this as a clean slate to start from.

    <div class="container">
        <div class="header"></div>

        <div class="content">
        ...
        </div> <!-- end of content -->

        <div class="footer"><%= render "footer" %></div>

    </div> <!-- end container -->

As anything gets added to this skeleton you hope that the structure stays readable. I think that the forced structure prevents you from being your own worst enemy . Because of this simple fact I am turning into a Haml guy and think a weekend using it will convert any non-believers.
