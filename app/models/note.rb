class Note < ApplicationRecord
  include MarkdownRender
  #has_rich_text :content
  before_create :set_uuid
  default_scope { order(created_at: :desc) }

  def set_uuid
    self.id = SecureRandom.uuid if self.id.blank?
  end

  def render_note
    markdown_render.render(content).html_safe
  end
end
