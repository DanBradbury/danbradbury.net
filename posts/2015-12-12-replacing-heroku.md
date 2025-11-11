---
title: Replacing Heroku
tags:
- heroku
- digitalocean
- droplet
- graphite
- statsD
...
categories: heroku digitalocean droplet graphite statsD
---
For anyone still on Heroku and throwing addons at your application please stop and seriously reconsider what you are doing. Across the board things are getting a bit ridiculous for the average hobbyist / fincially conscious company. I used to be quite the Heroku fanboy but after my recent experience with Hosted Graphite I have changed my tone completely.

I was recently looking to add some Graphite metrics to a Heroku application that I'm working on and stumbled across a solution called Hosted Graphite. There was of course a starter package which shows off the beauty of Grafana and a few metrics to give you an idea of the potential. The current pricing can be found [here](https://elements.heroku.com/addons/hostedgraphite) (this prices do fluctuate quite regularly depending on the service); I've also gone ahead and added the current prices as of writing this below:

![](http://i.imgur.com/Zg1r3PI.png)

Each price point adds a few key features to the mix + increases your metric limit (this is a bullshit number stored by whatever service you are using so feel free to push it without too much fear. I'll do a follow-up post on my experience with a MongoDB solution that had a document "limit"). The paid features for Hosted Graphite are as follows:

- Daily Backups (>Tiny)
- Data Retention (>Tiny)
- Hosted StatsD (>Small)
- Account Sharing (>Medium)

For most folks that are looking to use Graphite in their application they are probably looking to use some StatsD wrapper to report metrics. If you only have a few data points that you care about and can deal with the low retention rate / backup policy then maybe you could add an aditional worker to handle the task and not have to deal with a "hosted StatsD" solution. Even with that stretch of the imagination you are looking at a $19 monthly solution but most likely going to be suckered into a higher cost if you seriously start to add metrics.

Rather than paying for a plugable addon I'd highly recommend spinning up your own Digitalocean server for $10 bucks and get as much value as the Small package (this is being very generous..) being offered on Heroku. If you don't know how to spin up a Graphite+StatsD server there is no excuse with the resources provided by DO alone:

- [Installing Graphite](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-graphite-on-an-ubuntu-14-04-server)
- [Configure StatsD to Collect Data for Graphite](https://www.digitalocean.com/community/tutorials/how-to-configure-statsd-to-collect-arbitrary-stats-for-graphite-on-ubuntu-14-04)

Assuming that you can get through a basic set of steps then you should have a working Graphite+StatsD service at your disposal with 1/2 the monthly cost. The interface will be exactly the same (API key/namespace + service endpoint) and you will have the freedom to manage the server as you please. And when you are measuring things you sure as hell don't want things to stop reporting because a reporting mechanism fails and you have no way to tell..

This is another major gripe that I have with Hosted Graphite; why would I pay for a service like "hosted statsD" when it will fall over and I have no debug info into why that might have happened. When testing with a Small instance of Hosted Graphite the StatsD endpoint would become unresponsive for minutes at a time while UDP/TCP were working as expected. On the other hand with a droplet you have the freedom of config (and Graphite, Carbon, and StatsD have a lot of configuration).

Configuration brings me to the final point I want to make. "Features" like Data retention length are nothing more than configuration that can be managed when setting up your Graphite instance. By [configuring carbon](http://graphite.readthedocs.org/en/latest/config-carbon.html#storage-schemas-conf) you can set custom retention policies on different data points (regex matching FTW) and ensure that you have the policy in place that makes sense for the data being stored. This gives you the freedom of full flexibility inside of a problem-set that you are actively engaged in when adding measurements (naming new metrics). As a best practice you should set a reasonable default and add new metrics into the appropriate policies as needed.
