class Post < ApplicationRecord
  default_scope { order(created_at: :desc) }

  def render_preview
    markdown_render.render("#{content.first(256)}...").html_safe
  end

  def render_markdown
    markdown_render.render(content).html_safe
  end

  def markdown_render
    default_renderer_options = {
      filter_html: false
    }

    default_markdown_extensions = {
      autolink: true,
      highlight: true,
      no_intra_emphasis: true,
      fenced_code_blocks: true,
      lax_spacing: true,
      strikethrough: true,
      tables: true
    }

    renderer = Redcarpet::Render::HTML.new(default_renderer_options)
    Redcarpet::Markdown.new(renderer, default_markdown_extensions)
  end
end
