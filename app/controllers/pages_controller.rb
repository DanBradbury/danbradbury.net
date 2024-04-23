require 'github/markup'

class PagesController < ApplicationController
  def home
    @posts = Post.all
  end

  def post
    @post = Post.find_by(slug: params[:slug])
  end
end
