title: Git Auth when Windows Credentials are Locked
date: 2018-03-23 15:12:00 -0500
comments: true
categories: ['windows', 'git']
---
Most Windows users won’t run into this problem because they don’t have a system administrator controlling their machine but for anyone who is experiencing weirdness while using `wincred` here’s a brief explanation of the problem + an easy fix to get things back up and running.

The wincred issue that I was facing was anytime I ran powershell as a non-administrator I would be prompted for my Username/Password and rather than it being persisted I would get a fun CredWrite failed error and would be prompted again on each subsequent git related call. At first I was at a total loss and was running everything as an admin just to avoid that annoying prompt when trying to pull/push/etc. I finally decided enough is enough and started doing some digging on how windows creds were being persisted on my machine.

Upon looking up the CredWrite failure it became clear that this was a Windows specific Git credential manager that I was oblivious to. The default storage on Windows is something called `wincred`, which is essentially a Windows built-in credential manager that can be accessed via Control Panel

![](https://i.imgur.com/6JOkcvB.png)

Unfortunately for me when I drill into the manage page I get the following

![](https://i.imgur.com/1nIm84V.png)

Welp that explains the CredWrite failure I was seeing all over the place. Since I was unable to use the recommended a [git-credential-store helper](https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage) I had to resort to using the `store –file` option to get things working as I’d expect on any other machine (less than ideal but worth it to not be forced to type my username/password every time I wanted to git)

There are a few options to disable the Git Credential Manager (detailed [here](https://stackoverflow.com/questions/37182847/how-to-disable-git-credential-manager-for-windows/37185202#37185202)) but here’s the method I used to get unblocked:

- `git config –global credential.helper “store –file ~/.gitcredentials”`
- Create gitcredentials file and place my creds in there according to the specified format

    username=myuser
    password=mypass

- `git config –edit –system`
- Remove the `helper = manager` line that is still in the system even though we specified to use the file for cred info
- Celebrate because we can git without being prompted every time!

The main issue I had was that I thought setting the file store in (1) would be enough but still ran into the problem where the cred manager was still being used. Checking the global config is critical to ensure that things are going to work as expected and it’s not a bad idea to know exactly what’s going on at the global level
