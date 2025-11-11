---
title: Replacing SimpleCov
tags:
- ruby
- testing
- tdd
- goliath
- simplecov
- coverage
...
title: Replacing SimpleCov
categories: ruby, testing, tdd, goliath, simplecov, coverage
---
After fighting with [`simplecov`](https://github.com/colszowka/simplecov) for a little longer that I would like to admit; was attempting to get it to start analyzing a group of files that were the meat and potatoes of my application(Golaith application). Unfortunately none of the default configs (`Simplecov.start 'rails'`, etc) nor the filters were allowing my files to be tracked and printed in the handy coverage html file. Because of all this struggling I decided to go ahead and create my own crude coverage module; I'll be using this post to discuss my learnings and share an early working iteration.

To get started I wanted to have the invocation of coverage be exactly the same as `simplecov`; so let's start with the goal of adding `CrudeCov.start` inside of our `spec_helper.rb` to keep track of the files we care about.

Before diving into the code I did a little research on how `Simplecov.start` worked. I was mainly looking for information on how it was able to keep track of files with only a single invokation inside of the `spec_helper`. Inside of [`lib/simplecov.rb`](https://github.com/colszowka/simplecov/blob/master/lib/simplecov.rb#L40-L53) we find a definition of the `start` method; which checks to see if the water is friendly (`SimpleCov.usable?`) and then starts the tracking with a call to `Coverage.start`. At this point during my investigation I was pretty sure that `Coverage` was a `Class`/`Module` defined within the `simplecov` source; after some grepping within the repo I only found one other reference to `Coverage` inside of [`lib/simplecov/jruby_fix.rb`](https://github.com/colszowka/simplecov/blob/master/lib/simplecov/jruby_fix.rb). Unfortunately that reference is just as the name implies, a `jruby` specific fix for the `Coverage` module that overrides the `result` method. When I was that in the only reference to the module I ran off to google and was incredibly pleased to find that `Coverage` is a `Ruby` module! According to the [Ruby 2.0 Coverage doc](http://ruby-doc.org/stdlib-2.0.0/libdoc/coverage/rdoc/Coverage.html)

>Coverage provides coverage measurement feature for Ruby. This feature is experimental, so these APIs may be changed in future.

With that note about this being an experimental feature let's be flexible and see what we can do (`simplecov` uses it and it's a pretty successful gem). The usage note in the doc also looks fairly promising:

> 1. require “coverage.so”
>
> 1. do ::start
>
> 1. require or load Ruby source file
>
> 1. ::result will return a hash that contains filename as key and coverage array as value. A coverage array gives, for each line, the number of line execution by the interpreter. A nil value means coverage is disabled for this line (lines like else and end).

So we don't have to worry about #1 (will be loaded by Ruby) and can start with #2 and call `Coverage#start`, load all the files that matter, and then use `Coverage.result` (which `Returns a hash that contains filename as key and coverage array as value and disables coverage measurement.`) to see how well the files have been covered.

As a note Coverage will pickup **any** file that has been required after `do ::start` so it's a good idea to have a way to selectively find the files that you want to get the coverage results on (e.g. Array of keys `Dir['./app/apis/*rb']` to grab the coverage results you want)

Since we don't have any intention of supporting `JRuby` we should be able to use `Coverage` as is for our `CrudeCov` example. Let's start off with the `#start` and `#print_result`(used after our test suite finishes)

    module CrudeCov
      class << self
        def start
          @filelist = []
          Coverage.start
        end

        def print_result
          cov_results = Coverage.result

          root = File.dirname(__FILE__)[0..-6]
          filelist = [
            "./app/apis/untested_endpoint.rb",
            "./app/apis/covered_endpoint.rb"
          ]

          filelist.each do |file|
            # process file results
            # coverage results returns Array([1,0,..,nil,3] where val = # of times line was hit & size = # of lines)
            # this makes for easy matching when creating the pretty html result file
            file_results = cov_results[file]
            results = file_results.compact.sort # remove all nil entries & sort to help with calculations

            puts "Results for: #{file}"
            total_lines = (results.length*1.00).to_f
            covered_lines = total_lines-results.find_index(1)
            percentage = (covered_lines/total_lines).round(2)*100
            puts "#{percentage}% Covered (#{covered_lines} of #{total_lines} Lines Covered)"
          end

          # create html for easy viewing outside of shell
        end
      end
    end

Our `CrudeCov` module above is pretty straightforward and covers our basic needs of (1)Having a one-line call to add to our `spec_helper`, and (2) a print method that we can call after our suite is finished running (ideally the module would figure out which test framework is being used and ensure that the hook is made to print results at the end of the suite). With the example above we will have to explicityly ensure that the `print_result` method is called.

Assuming that we are testing with `RSpec` our `spec_helper` will look something like this

    require 'crudecov'

    CrudeCov.start
    # require project files..

    Rspec.configure do |config|
      # your other config..
      config.after(:suite) do
        CrudeCov.print_result
      end
    end

With that basic setup you will get a print out of the coverage percentages for all files that have been included in the `filelist`. In less than 30 lines of code we were able to have an incredibly simple coverage module that we could use in a project to sanity check a file that may potentially lacking coverage or confirm proper testing. From that simple example you can start to see how a project like `simplecov` would come into being and how something as simple as `CrudeCov` could become a full ruby coverage suite.

With the legitimate need to get data on the effectiveness of your tests; SaSS solutions like [`Coveralls`](https://coveralls.io/) (which did not recognize a Goliath application) + gems like `simplecov`, `rcov` and `cover_me` have all become relied upon staples for the TDD community.

What's the point of even doing TDD if you aren't covering new lines of code that could result in bugs down the road? For that reason alone I'd say it's worthwhile to implement some sort of coverage tool when all the rest have failed.
