# "Simple" Ruby MCP Setup

After seeing the [Blender MCP](https://github.com/ahujasid/blender-mcp) I was curious enough to get a pro subscription to Claude and try hooking it up and start to get my hands dirty with what MCPs are / what implementation looked like.

Javascript, Python, Go, C# all have officially supported SDKs but of course no such love for Ruby. Because the spec is controlled by Anthropic it makes sense but we are left to figure things out as a second class citizen.

## Ruby implementation 
[`mcp-rb`](https://github.com/funwarioisii/mcp-rb) has a simple enough DSL and is close enough to `fast-mcp` that it was worth going down that rabbit hole

```ruby
require 'mcp'

name "hello-world"

version "1.0.0"

# Define a resource
resource "hello://world" do
  name "Hello World"
  description "A simple hello world message"
  call { "Hello, World!" }
end

# Define a resource template
resource_template "hello://{user_name}" do
  name "Hello User"
  description "A simple hello user message"
  call { |args| "Hello, #{args[:user_name]}!" }
end

# Define a tool
tool "greet" do
  description "Greet someone by name"
  argument :name, String, required: true, description: "Name to greet"
  call do |args|
    "Hello, #{args[:name]}!"
  end
end
```

I also found a post within the week of writing this showing off a [Rails MCP server that Mario Chavez has built for his own personal workflow](https://mariochavez.io/desarrollo/2025/03/21/rails-mcp-server-enhancing-ai-assisted-development/) that served as good inspiration + more code to review.

### Troubleshooting Claude Desktop MCP Configuration
> Claude Desktop launches the MCP server using my system’s default Ruby environment, bypassing version manager initialization (e.g., rbenv, RVM). The MCP server needs to use the same Ruby version where it was installed, as MCP server startup failures can occur when using an incompatible Ruby version.

#### rbenv Users
For rbenv users, creating a symlink to the rbenv shim works well:
```bash
sudo ln -s ~/.rbenv/shims/ruby /usr/local/bin/ruby
```
This works because rbenv's shim system determines the correct Ruby version at execution time, dynamically configuring the environment regardless of how the command was invoked.

#### RVM Users
RVM handles environment variables and gem paths differently than `rbenv`, which is why a simple symlink doesn't work. When you create a symlink to the RVM Ruby binary, you're bypassing RVM's environment setup. In order to get around this `rvm` offers wrapper script creation to handle this.

Most installs will have a wrapper script that should be used to properly create the system level symlink:
```bash
rvm wrapper show ruby
sudo ln -s /Users/danbradbury/.rvm/gems/ruby-3.3.4/wrappers/ruby /usr/local/bin/ruby
```
