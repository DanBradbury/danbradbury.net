---
title: Playing the Twitter-game
tags:
- browser-tricks
- twitter
- stingysmoker.com
- utility belt
- javascript
- jquery
...
title: Playing the Twitter-game
comments: true
categories: [browser-tricks, twitter, stingysmoker.com, utility belt, javascript, jquery]
---
> I am not a marketer not do I have any real prior experience managing PR/social media for a company of any size. This is just a write-up of some of my learnings while out in the wild

By all accounts I am a Twitter novice; I joined a few years ago but don't really keep up with it (rage tweet a politician or media personality from time to time but not much more). From other business ventures I've learned that having a strong presence on Twitter+Facebook can be a great way to drive traffic to your site and keep folks updated with any updates but I had never invested any time in growing the profiles (outside of word of mouth and the usual social links in the footer of a site). For my most recent project I decided to take an active role in the growth of my Twitter account and to attempt to use a few of these automation tools / API to make my life a little easier.

I started the journey by trying out a product called `ManageFlitter.com`; I had gone all in and decided to buy the smallest plan they offered to maximize my "strategic follows". After about 2 days of bulk requesting it becamse obvious that the "snazzy dashboard" views were nothing more than a facade.. I was hitting rate limits and unable to process a single follow / request with the access grant I had enabled for the site.

At this point I started angrily emailing support to figure out why I was being blocked without hitting any of the actual API / request limits listed in the [twitter guidelines](https://support.twitter.com/articles/18311). Here is the initial diagnosis I recieved (steps to fix are omitted since they were useless..)

> Thank you for writing into ManageFlitter support on this. Unfortunately Twitter seems to have revoked some 3rd party app tokens over the last few weeks. This causes "invalid or expired token" in the notifications page and keeps your account from being able to process actions, post tweets into Twitter, or from allowing your ManageFlitter account to properly sync with Twitter.

Hmm so at this point I was frustrated because there is no way my token should have been revoked! Obviously they were using keys so that they could make these "analytic queries" on the twitter user base and had messed something up on their end that had made it impossible to proceed. I pressed along that line of thinking and received the following "helpful" response.

>I am sorry to hear this. There seem to be a small group of Twitter users currently having this issue with ManageFlitter and some have noted that once their account is revoked, it is far easier for their account to continue to be revoked afterwards.
>
> Some users have suggested that waiting 24 hours helps reset the account. Others have noted that the amount of actions they perform in sequence also matters greatly to avoid the revoked access. Some have noted that after they perform 100 clicks, if they wait 20-30 seconds (usually enough time to go to the Notifications page and see if Twitter is revoking access), then continuing to perform more clicks.
>
> There is no particular reason why some accounts are being affected and other are not. We have been in touch with Twitter and unfortunately Twitter haven't offered much in the way of remedy for us or our users.

TLDR; I was told to wait for the problem to fix itself..

This threw a massive wrench in my plans to bulk follow people inside the industry and hope that some percentage of them would follow me back. After a few more angry emails I was told to just wait it out.. At that moment I pulled out the classic `"I will have to proceed with a claim to Paypal / the better business bureau"` argument to get my money back and move on with another option.

After getting my money back I decided to ride the free train with `Tweepi` which had no problems for the first week of usage so I decided to buy a month of the lowest tier to use some of the analytics / follow tools that were being offered. With 2 weeks on the platform I can say that I'm very happy with what I paid for and will continue to use it in the future (until my follower count levels out a bit)

So why am I writing this article if I am just using a service to accomplish the task for me? While Tweepi does a lot for me it still imposes artificial limits on follow / unfollow in a 24 hour period. (see pic below)

![](http://i.imgur.com/lxGicMA.png)

You can see that the service has some limitations. The main one being that I can follow more people than I can unfollow in a given day. While that makes sense with Twitter's policies my goal is a raw numbers game where I'd like to follow as many people as possible in hopes they follow me back. Whether they follow me back or not I am content to unfollow and continue with my following numbers game.

Through this process I was able to drive my followed count up quite a bit (considering my actual follower count)
![](http://i.imgur.com/7lMskhe.png) ![](http://i.imgur.com/xgFbtwG.png)

but still had this problem of the unblanaced `follow:followers` that I wanted to correct. If I was active on Tweepi there was no way for me to drive this down without having to completely stop following people for a period while I unfollowed the max every day.

So today I decided to have a little fun inside the browser and see what I could do. :grin:

Since twitter has a web + mobile application I could obviously sit and click through each of the people I was following to reduce the number but..

![](http://colsblog.com/wp-content/uploads/2014/07/notime.jpg)

So let's see how well formatted the twitter follower page is (and since it's Twitter we know its going to be well organized). When arriving at the page we see the trusty un/follow button for each of the followers
![](http://i.imgur.com/WVI23gR.png)

we also notice that twitter has some infinite scroll magic going on to continuous load the 1000s of people we follow. With that knowledge in our hands it's time to craft some Jquery flavored code to do the clicking for us

    $.each($('.user-actions-follow-button'), function(value,index) {
      $(index).click();
    });

Pretty easy to click through each of the buttons on the page but that's only going to account for the ones we have manually scrolled through.. Not sufficient since we have >4000 but <20 buttons on the page. So let's handle that damned auto-scrolling

    var count = 0;
    function st(){
      $("html, body").animate({ scrollTop: $(document).height() }, "fast");
      if(count < 2000) {
        count += 1;
        setTimeout(st, 500);
      }
    }
    st()

You might be thinking; why not just for loop this shit?! The scroll animation needs a bit of time to allow for the page load; if you call it too fast the entire page will bug out and the "click button" code wont work as expected. So we just use `setTimeout` and let that sucker run (good time to take a stretch or make some coffee). When you come back you should hopefully be at the bottom of the screen (wait for `GridTimeline-footer` to show up and you know you are done) :D

Run the click code and patiently wait for your browser to slow down drastically and eventually unfollow your entire list. The result should look something like this

![](http://i.imgur.com/qTz4KtF.png)

The 1 follower there through me off since when I clicked on the link for my followers there wasn't anyone listed. At this point I was suspicious that I may have set off one of the limits that would have deactivated my accounts. I checked my emails and didn't see any warnings or notifications from Twitter but did start seeing this whenever I tried to follow someone on their website. (Learn more [here](https://support.twitter.com/articles/66885))

![](http://i.imgur.com/ot7Ouon.png)

At this point I was thinking I just fucked myself and got my account banned or locked in some way. During this time of panic I decided to refresh my browser and saw some funky behavior on my profile page....

![](http://i.imgur.com/3IUBOXT.png)

No "Following" count at all?! And I cant follow anyone because of some unknown policy breach..

After writing a short sob story to Twitter about how I had "accidentally unfollowed everyone"(cover my ass) I thought about the locking problem a bit more..Hmmm what about that Tweepi token I was using before? Who would have guessed that it would work and allow me to follow people again!

![](http://i.imgur.com/TGpVV06.png)

So with a little bit of crafted Javascript I was able to drop that Following count down without having to fight any artificial limits imposed on me by some third party. I'm incredibly happy with the results (as I am not banned and my account is working as expected) and plan to reproduce with another client in  the future.

It's always a good feeling when adding a new tool to the utility belt.
