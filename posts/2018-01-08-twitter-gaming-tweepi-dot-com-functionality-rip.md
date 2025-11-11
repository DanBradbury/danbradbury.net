---
title: Twitter Gaming: Tweepi.com Functionality Rip
tags:
- 'twitter'
- 'tweepi'
- 'javascript'
- 'python'
...
There are plenty of twitter management tools out that will help automate / manage your twitter account for a few bucks a month.

While most products don't add too much value I've found some particular features on Tweepi.com that have been pretty helpful. In particular there's a stat called `Follower Ratio` which lets you know how likely a user is to follow you back; > 80% is a user thats probably worth following (and unfollowing later once we have a healthy count..will lose some followers from bot automation but majority of real users won't unfollow back)

![](https://i.imgur.com/Q2niRPJ.png)

When using the free version of the site there is a tool that allows us to search up to 25 users using a comma seperated list. This definitely looks like a tasty target and upon checking the network tab we can see a clean `POST` with easily understood params and response. A test response is shown below

We can see from the response below that calculating `Follower Ratio` is as easy as `followers_count/friends_count` is all we need to process a user object in our script.

    POST https://tweepi.com/data/get_users_pp/follow_by_copy_paste.json
    ....

    RESPONSE:
    {
       "total":1,
       "page_size":20,
       "users":[
          {
             "user_id":"*****",
             "screen_name":"*************",
             "location":"",
             "full_name":"*************",
             "last_tweet_time":"1969-12-31 16:00:00 -0800", // cute
             "followers_count":1,
             "friends_count":89,
             "statuses_count":0,
             "profile_img_url":"\/\/abs.twimg.com\/sticky\/default_profile_images\/default_profile_normal.png",
             "is_verified":false,
             "utc_offset":null,
             "bio":"it's hi astonishing ocean blue eyes that iadore the most but it's his contagious bright smile that transforms my orrowful frown into something joyous",
             "url":"",
             "lang":"en",
             "is_protected":false,
             "member_since":"2017-09-06 05:02:47 -0700",
             "listed_count":0,
             "favourites_count":0,
             "default_profile":true,
             "default_profile_image":true,
             "geo_enabled":false,
             "ui_last_updated":"2018-01-01 12:36:23 -0800",
             "is_follower":false,
             "is_friend":false,
             "follower_or_following":" ",
             "history_date":"2000-01-01 00:00:00 +0000",
             "is_safelisted":false,
             "tag_names":[

             ],
             "tag_dates":[

             ]
          }
       ]
    }

As long as we can replay this request then we should be able to come up with a clever way to "smart follow" with a handy javascript snippet...

## Building the Request for Replay
And a little bit of request fiddling as we figure out what headers are necessary we go from..

    import requests
    response = requests.post("https://tweepi.com/data/get_users_pp/follow_by_copy_paste.json",params={"userSnList":"foo","offset":0,"limit":25},
    headers={
    "X-Authorization": "ZnJlZTpncmlkLmZvbGxvd0J5Q29weVBhc3RlOjk0NjM0Mjg0MzYwMTI0ODI2MQ==",
    "X-Requested-With": "angular",
    "X-Tab-Id": "7166",
    "Content-Type": "application/json;charset=utf-8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Cookie": "c111990290-79992ic=c232338-43784-319745; c111990290-280953ic=c232338-43784-574953; tr2=1; tweepiapp=slqi3ldt8upm8oitf17eke44k2; kvcd=1514838972500; km_ai=G8OrOVIF0YFYftSnBsF7Qgi8aoM%3D; km_lv=x; km_vs=1"
    })
    response.content

to

    import requests
    response = requests.post("https://tweepi.com/data/get_users_pp/follow_by_copy_paste.json",params={"userSnList":"tonishabusch281","offset":0,"limit":20},
    headers={
    "X-Authorization": "ZnJlZTpncmlkLmZvbGxvd0J5Q29weVBhc3RlOjk0NjM0Mjg0MzYwMTI0ODI2MQ==",
    "Cookie": "tr2=1; tweepiapp=slqi3ldt8upm8oitf17eke44k2;"
    })
    response.content

![](https://i.imgur.com/xWaTOXU.gif)
and we now can have some fun

## Creating Twitter User Check List
The first thing is to get a list of potential users that we would want to follow. We can use the follower page from accounts that are well established. Since we don't want to scroll for days let's use a simple scroll function that we can turn off / control with the conditional. Once we have all the user nodes loaded we can run the second chunk of code to build a comma seperated user list that we will use in our python script; you'll notice a `copyToClipboard` function at the end which allows us to easily select the entire list since `console.log` is disabled on Twitter and returns will be truncated.

    // scroll until we see all users
    var count = 0;
    function st(){
      $("html, body").animate({ scrollTop: $(document).height() }, "fast");
      if(count < 2000) {
        count += 1;
        setTimeout(st, 500);
      }
    }
    st()
    // then set count=999999

    // XXX: done since console.log is taken over.. cute but not going to stop us
    // create a div element and append twitter names to it (formatted for copy pasta in script above)
    document.body.innerHTML += '<div id="userlist"></div>';
    var eles = document.querySelectorAll('b.u-linkComplex-target');
    for(var i=4; i<eles.length-5;i++) {
      document.getElementById('userlist').innerHTML += eles[i].innerHTML+',';
    }

    // console should print out the goodies when exiting the for loop but just in case
    // never occured to me that something so simple would do the trick :D
    // https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    function copyToClipboard(text) {
      window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
    }
    copyToClipboard(document.getElementById('userlist').innerHTML)

and it works like a charm! 🎉
![](https://i.imgur.com/36OKK6H.png)

From there it's time to use that user list inside a python script that will allow us to slam that endpoint as a free user. Since I don't have a premium account there's a limit of 25 users per bulk update, 500 for premium users.. maybe we can get around this somehow... but for now the script does the trick. In addition to updating the list we will most likely need to get a new valid tweepi session which will require us to change the `tweepiapp` value in the `Cookie` header.

    import requests
    import time
    import json

    def chunks(l, n):
        for i in range(0, len(l), n):
            yield l[i:i + n]

    n = "INSERT_COPY_HERE"
    names = n.split(',')
    split_names = list(chunks(names, 25))

    count = 0
    high_prop_users = [] # will use this to store "valuable" users
    # XXX: why manage valid array index when you can try catch all the things... terrible terrible terrible but whatever im tired
    try:
      while True:
        name_list = ','.join(str(x) for x in split_names[count])
        response = requests.post("https://tweepi.com/data/get_users_pp/follow_by_copy_paste.json",params={"userSnList": name_list,"offset":0,"limit":25},
        headers={
          "X-Authorization": "ZnJlZTpncmlkLmZvbGxvd0J5Q29weVBhc3RlOjk0NjM0Mjg0MzYwMTI0ODI2MQ==",
          "Cookie": "tr2=1; tweepiapp=7tk8us7lj933i743l4mos51q10;"
        })
        if '!doctype html' in str(response.content):
          print('TRY AGAIN')
        else:
          parsed_response = json.loads(response.content)
          users_info = parsed_response['users']
          for user in users_info:
            follow_ratio = user['followers_count']/user['friends_count']
            if follow_ratio > 0.8:
              high_prop_users.append(user['screen_name'])
              print('INSERTED')
          time.sleep(2)
        print('-----------------------------------------')
    except:
      print(high_prop_users)
      exit(0)

Now that we have our final list of users we want to follow we just need another Javascript snippet to properly follow all those users.

> Im sure there's a better way to manage the parent search with jquery but it's good enough for me / twitter since this is unlikely to change during the usefullness of this script (if it does it wont work and it'll be an obvious fix). You may notice a strange `id` assignment at the beginning, this is to ensure that our simple for look can do something like lookup with `getElementById` and go from that base element to get anything else we might need..

![](https://i.imgur.com/mSFhONe.png)

    // assign id to twitter handle for easy access using the list we built up
    var names = document.querySelectorAll('.u-linkComplex-target')
    for(var i=4;i<names.length-5;i++) {
      names[i].id = names[i].innerHTML.trimLeft(); // important to trim the random spacing in the div..
    }

    // follow everyone in our magic list
    st = ['**', ..., '**']
    for(var i=0;i<st.length-1;i++) {
      // sitting in console with a beer is definitely the best way to do this..
      $($(document.getElementById(st[i])).parent().parent().parent().parent().siblings()[1]).find('.user-actions-follow-button').click();
    }

Using those 2 Javascript snipped and the hacky Python script we can succssfully re-create the functionality that Tweepi wants us to pay $9.99 a month for.

![](https://media3.giphy.com/media/qTj9yXt1njjdm/giphy.gif)

