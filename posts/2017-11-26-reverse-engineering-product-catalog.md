---
title: Reverse Engineering 'Product Catalog'
tags:
- 'reverse engineering'
...
Recently I've been looking at an application that has some data that I'd like to scrape and use/format for my own selfish desires. The application we are targeting is on iOS + Android so I went through the usual flow on my iPhone
- mitmproxy - no good. traffic must be SSL / non-HTTP. Android cert-pinning stops app on init
- wireshark w/ rvictl on iOS device - SSL traffic pulling initial data catalog / no API fetches once app is initialized (sqlite init)

After getting blocked and giving up for about a month I decided to root my OG Nvidia Shield and dig a little deeper..

## Digging Deeper
Prereqs
> Root phone -> Install [Xposed Framework](http://repo.xposed.info/module/de.robv.android.xposed.installer) -> Download [Inspeckage] Module -> Get Started

![](https://houseofthegeeks.com/wp-content/uploads/2017/01/IndianaJones.gif)

My initial hope was that Inspeckage would solve all my problems and I wouldnt have to dig too much into Xposed but in the ended up being the launching pad to the golden catalog.

After turning on Inspeckage and letting the app boot up for the first time we can see a few things. (1) https traffic, (2) files created zip/certs/js+img assets. I was hoping the SQLite tab would light up and we could query against .db file immediately but that would be too easy
![](https://i.imgur.com/VUac9vS.png)


## Ripping things apart
Before getting into the .apk I figured it would be worthwhile to see what was stored on my device
    adb shell && cd /data/data/com.package.name/
and… explore!

The main thing I was looking for here was something in the databases/ or files/ directories. Luckily we were able to spot a `TARGET.db` within `files/databases` but it was definitely encrypted (dreaded “file is encrypted or not a database” when querying)
> Remember that if the app is not debuggable you won't be able to `adb pull /pathtoDBFile.db` instead you’ll have to `adb shell && su && mkdir /sdcard/data && cp /pathoDBFile /sdcard/data` and then pull that file

Inspeckage has the handy download .apk so there’s a few things we can do here (starting with the most obvious)
- unzip it and take a look at what we’ve got

    dan@dan-MacBookPro:~/riperino$ unzip og.apk
    Archive:  og.apk
      inflating: META-INF/MANIFEST.MF
      inflating: META-INF/CATEXTKY.SF
      inflating: META-INF/CATEXTKY.RSA
      inflating: AndroidManifest.xml
      inflating: assets/_where-is-www.txt
      ...
     extracting: assets/icudt46l.zip
     extracting: assets/www/assets/
     .... a ton of assets (selected some potential highlights)
      inflating: assets/www/config/config.json
      inflating: assets/www/cordova.js
      inflating: assets/www/css/bootstrap/
      inflating: assets/www/js/
     extracting: res/drawable/icon.png
      inflating: res/xml/config.xml
     extracting: resources.arsc
      inflating: classes.dex
    ...
      inflating: lib/armeabi/libsqlcipher.so
      inflating: lib/armeabi-v7a/libsqlcipher.so
      inflating: lib/x86/libsqlcipher.so

From looking at the contents we can tell the basic structure but we are mostly interested in a few files
- libsqlcipher.so & assets/icudt46l.zip ([interesting fallback zip for sqlcipher](https://stackoverflow.com/questions/22024657/sqlcipher-for-android-icudt46l-zip-really-needed)..possible fun attack vector)
- classes.dex (exactly what it says)

This confirms our hunch about SQLite and explains the missing contents from the SQLite tab while using Inspeckage. Now the hope is that classes.dex reveals something blatantly obvious..

### Reading some code
There are quite a few tools for digging into the contents of that .dex file but I’ll go over my comfortable flow (unnecessary .dex -> .jar step with tools like Bytecode Viewer but the extra step does provide some extra possibilities if we really need to build a custom apk)

Using the [dex2jar](https://github.com/pxb1988/dex2jar) toolkit we can use the classic `d2j-dex2jar` to give us the handy .class files zipped to .jar (while not perfect this is almost always “good enough” for what we need)

After creating the .jar its time to pop open [Java Decompiler](http://jd.benow.ca/) and dig into the package in question.. And after a little while we run into this section of code (`masterKey` makes us happy and definitely worth hooking into?)
![](https://i.imgur.com/a7oTmpu.png)

After reading the docs for [`getReadableDatabase`](https://developer.android.com/reference/android/database/sqlite/SQLiteOpenHelper.html#getReadableDatabase()) it’s clear that’s indeed the SQLite password and if the developer also followed the documentation they would also have called `createAndGetDBPath` which would serve as the initialization.. Lo and behold the `DBHelper.class` implements that class and we can add a hook to ensure we catch the key when we reboot the app
### Hooking and Winning
Without getting too tangential Xposed is great and the [documentation is outstanding for anyone interesting in getting started](https://github.com/rovo89/XposedBridge/wiki/Development-tutorial). If the development tutorial is not enough the content online was more than enough to clear up any potential blockers.

    public class Main implements IXposedHookLoadPackage {
        public void handleLoadPackage(final LoadPackageParam lpparam) throws Throwable {
            findAndHookMethod("com.****.core.db.DBHelper", lpparam.classLoader, "createAndGetDBPath", Context.class, String.class, new XC_MethodHook() {
                @Override
                protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                    XposedBridge.log("Hooked em': DBHelper#createAndGetDBPath ");
                    XposedBridge.log("----------------------------------------");
                    XposedBridge.log(param.args[1].toString());
                    XposedBridge.log("----------------------------------------");
                }
            });
        }
    }

We load our hook module, reboot our device and when we rerun the app we see something beautiful in the logs

    Hooked em': DBHelper#createAndGetDBPath
    ----------------------------------------
    base64masterKey== (totally legit..)
    ----------------------------------------

Now I should be able to

    Sqlcipher rippedDB.db
    PRAGMA key=”base64masterKey==”
    .tables

And get something other than `file is encrypted or not a database`. Unfortunately this didn’t work on my machine and I thought I was getting juked out and went to bed.

![](https://media.giphy.com/media/HzgfYh5H3MR0s/giphy.gif)

After thinking about questions like these ([1](http://sqlite.1065341.n5.nabble.com/Getting-error-quot-file-is-encrypted-or-is-not-a-database-quot-when-trying-simple-C-example-td75837.html), [2](https://stackoverflow.com/questions/44161713/sqlite-file-is-encrypted-or-is-not-a-database), [3](https://github.com/sqlcipher/sqlcipher/issues/205)) all night + the following day of family time it became clear versions must be the issue in my case. After figuring out the difference between [Commercial and Community](https://www.zetetic.net/sqlcipher/buy/) it became clear this was just a time save and the same version was being used for both and the commercial folks were just given the latest binaries without having to work for them. Since we have some compatriots who dont like working much either I ran `brew install sqlcipher` and of course things just worked..

    Mac - 3.15.2
    Ubuntu 16.04 - 3.8.6

As an additional aside there are some open source “sqlbrowser applications” that have sqlcipher as a feature but dont do a great job revealing the versioning. Just build community versions as they are released and things should be fine / bank on everyone being on commercial and brew updating at the same time :D

Upon using the correct version we see a beautiful table list and can query to our heart's content.


### Retro
The entire sqlcipher seems incredibly trivial given the release strategy and knowing what we know about hooking. The fact that the key is going to be passed around no matter what makes things quite easy unless some additional precautions are taken but unfortunately it just moves the problem a step deeper. In the end the Android SQLDatabase methods are going to used and we can hook them no matter how many Proxys/Helpers are introduced to the codebase. After digging further into the Xposed modules [someone wrote a generalized hook](https://github.com/jakev/SqlCipherHook) that looks for the specific sqlcipher native package to hook into.. This seems to reinforce my belief that it’s general uselessness but there must be a reason big companies are giving them money (other than the desire to avoid building it themselves)

