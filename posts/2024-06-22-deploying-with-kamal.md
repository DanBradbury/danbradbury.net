---
title: Deploying with Kamal
tags:
...
After seeing the costs from 2 months of ECS running on my personal AWS account it was time to tryout something that doesn’t cost more than $15 a month to get a minimalist website up and running (this personal site)

I had listened to a podcast from DHH where he was talking about the simplicity of something like Kamal to become the out-of-box way for Rails 8 to provide deploy capabilities. The high-level sell goes as follows;

“Kamal offers everything you need to deploy and manage your web app in production with Docker. Originally built for Rails apps, Kamal will work with any type of web app that can be containerized.”

If you have every worked with Capistrano in the past you will be familiar with with Kamal is trying to offer with the `deploy.yml` configuration + gem level commands to run `capistrano/sshkit` (https://github.com/capistrano/sshkit) under the covers. As someone who vividly remembers capistrano deploy` I am very much into the baseline work that was done by the Capistrano team and am curious how that simplicity plays out in the case of this abstraction.

Attempting to put my biases aside I went ahead and `bundle add kamal` in the current personal site application you are on right now (here’s the commit that initially transitioned to using kamal over ECS deploy). All that was done here was following along with the install docs that were currently available

1. Run `bundle add kamal`
2. `bundle exec kamal init` (createds the `config/deploy.yml` template)
3. Edit the details for my server
4. Run `kamal setup`
5. Summertime… sadness

    INFO [392febf3] Running docker container start traefik || docker run --name traefik --detach --restart unless-stopped --publish 80:80 --volume /var/run/docker.sock:/var/run/docker.sock --env-file .kamal/env/traefik/traefik.env --log-opt max-size="10m" traefik:v2.9 --providers.docker --log.level="DEBUG" on vagrant-box
    Releasing the deploy lock...
    Finished all in 16.9 seconds
    ERROR (SSHKit::Command::Failed): Exception while executing on host vagrant-box: docker exit status: 125
    docker stdout: Nothing written
    docker stderr: Error response from daemon: No such container: traefik
    Error: failed to start containers: traefik
    docker: open .kamal/env/traefik/traefik.env: no such file or directory.

Had this issue here which was luckily already created by someone else https://github.com/basecamp/kamal/issues/538

I added some debugging help for the maintainers in hopes that I was just using the commands incorrectly (https://github.com/basecamp/kamal/issues/538#issuecomment-2165096272)

After a bit of a wait we got confirmation that this was a bug and would be fixed with a revert of a feature that was pushed (https://github.com/basecamp/kamal/pull/845/files). Unfortunate not to get a contribution to the project but it will not work for others who are giving it a shot.. In the end the fix wasn’t terrible and I was able to get around it with the help from others who were stuck before me.

I am now deploying danbradbury.net using Kamal and considering transitioning a few legacy projects that are still somehow running on Heroku to Kamal in the future.

Overall I enjoy the goals of the project and will keep using it as it gets ready for the move to Rails 8.
