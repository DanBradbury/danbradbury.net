----
After deploying over 10 applications with Heroku I think that I can finally make a fair assessment on the general developer / Heroku relationship.

After watching an excellent talk by Matz at Waza (link at the bottom) I was taken aback by how much he seemed to respect Heroku's ability to support the developer that wants to build. Heroku's use of  AWS to anyone to standup a system to run their code at no cost is an absolutely stunning accomplishment .

My skepticism with this idealistic view is that at the end of the day Heroku is a business that needs to make money. But they also need to keep their image and offer the "playground" to build and prototype without needing a budget.

During the talk Matz mentions this ability to spin up a prototype at no cost which as being something fundamentally new and exciting. Having this ability eliminates a the large risk of money puts people in a new age; one where there is no barrier of hardware costs preventing concepts to come to life.

Heroku as a company proves that hardware is cheap and that it is feasible to remove the hardware barrier that used to exist less than 10 years ago(someone tell me if I'm wrong, I was 13 and it was too expensive for me). For developers that like to build things from the ground up Heroku is a wonderful tool that should be utilized to its fullest for as long as you can use it for free.

I am not sure about the exact price model of Heroku's production ready systems are but I think that it becomes clear pretty quickly that if you are building to grow and scale Heroku may not be the best option.

I will use a real world example of a small sinatra app that is currently hosted on Heroku for the steep price of $0.

I have 1 Dyno with 512 MB of RAM that likes to shut off when it becomes inactive for a certain period of time (smart on Heroku's part for sure to keep costs down), 1 MongoHQ instance with 512 MB of storage (they call it sandbox mode so this is an expectedly low amount of storage).

When upgrading from the Standard (free) dyno it would cost me $34.50 to essentially double my computer power and have a cycling set of dynos that will work together as a failsafe mechanism. I have just recently started crashing dynos and am thinking that it would be nice to have a backup that is reliable without having to do any system work to setup proper restarting and recovery (no god debugging for me sounds pretty sweet).

For any additional storage I would be paying around $18 per GB of SSD storage hosted through MongoHQ (of course an Amazon service wrapped in an add-on pricing model). I am not sure what the going rate for a mongoDB hosted solution but that seems a bit pricey to me if you are going to do large lazy data storage like I have been enjoying. But to be fair that could easily be moved to another database since in reality it's just a minor detail.

When laying out the costs to double the performance of my small application it would be ~$52 a month. TBH that isn't a horrible price for no extra work scaling. I am curious what the minimal cost of this setup would be on AWS directly (I do know that if you want to run tests on postgres instances it will cost you a pretty penny at the end of the month).

References

Matz at Heroku's Waza (2013)
