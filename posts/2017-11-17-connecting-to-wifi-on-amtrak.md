title: Connecting to Wifi on Amtrak
date: 2017-11-17 13:01:18 -0800
comments: true
categories: ['travel', 'wifi', 'browser', 'wev']
----
> I wrote this post a few months ago when I was stuck on a train and figured I'd publish it before it gets lost forever.

Today I bring you the pain in the ass process I went through to get a really shitty connection on my Amtrak ride

Connecting to the wifi network yields a proper connection (ip assigned & `network-manager` is happy)... but once you try to go to any page you are stopped..

    dan@dan-MacBookPro:~/Documents$ ping google.com
    PING google.com (172.217.6.78) 56(84) bytes of data.
    ^C
    --- google.com ping statistics ---
    19 packets transmitted, 0 received, 100% packet loss, time 18143ms

If we go to `http://172.217.6.78:80` we will magically be redirected to www.amtrakconnect.com! The login page that failed to popup when the connection was established.

Even if we manually go to the URL your browser may get tripped up and timeout over and over again. While waiting for the browser why not curl that beezy?


A quick `curl amtrakconnect.com` will yield content so WTF is going on Mr. Browser? You must be getting stuck somewhere


Lets save the contents of that page to a file (`!! > weblogin.html`) and update any links to be absolute paths so all the php files load properly when we open it locally (we dont care about getting images/stylesheets to load).

To the [source](https://gist.github.com/DanBradbury/32a81c4736c0deb28bfd8a81f4a0d317)!! On first glance it should be pretty obvious that an ajax call is happening and we just need to click on an accept link to verify ourselves after its successful.


And voila we click on the link and are able to use the trash connection for the rest of the train ride.

![](https://pbs.twimg.com/profile_images/585976233105760258/DYMZ4N_k.jpg)

