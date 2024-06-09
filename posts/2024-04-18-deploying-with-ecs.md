title: Deploying Rails Application to ECS with GitHub Actions
----
I recently had the pleasure of figuring out a deploy scenario without any of my favorite deploy tools `kamal`, `Capistrano` were not options as we are not allowed to SSH to any box that we want to deploy. In the scenario I'm describing you are being forced to use AWS without being able to spin up an EC2 instance and just dump the code there.

As a big fan of the `heroku deploy` style the journey to get ECS setup was one that is worth documenting for any others who may be venturing down this path. I stumbled on a few articles along the way that were varying degrees of correct and helpful ([Link 1](https://www.honeybadger.io/blog/rails-docker-aws-fargate/), [Link 2](https://scoutapm.com/blog/deploying-to-aws-part-i-running-a-rails-app-on-fargate)), unfortunately many of these articles are years old and aren't exactly the setup we are looking for.

Our setup is going to be pretty straightforward:
  - AWS Infra; ALB -> ECS (1 container / 1 task)

## Initial Setup of AWS Infrastructure
Was done manually within the AWS console but could / should be done with CDK for easy reusability. Beacuse of this there is currently no associated GitHub action/code to spin up the infra from scratch.

When setting up the ALB it's important to make sure to route traffic from `443` -> `3000` (whatever port you are running the Rails server on within the task definition)
