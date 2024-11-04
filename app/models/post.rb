class Post < ApplicationRecord
  include MarkdownRender

  default_scope { order(created_at: :desc) }

  def render_preview
    markdown_render.render("#{content.first(256)}...").html_safe
  end

  def render_markdown
    markdown_render.render(content).html_safe
  end
end
