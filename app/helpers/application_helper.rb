module ApplicationHelper
  def extra_safe_truncate(txt, *args)
    truncated_text = truncate(txt, *args)
    # do the safety checks
    backtick_check = (0 ... truncated_text.length).find_all do |f|
      truncated_text[f, 1] == "`"
    end
    if backtick_check.length % 2 != 0
      puts "UH OH UH OH"
      puts "BEFORE: #{truncated_text}"
      truncated_text = truncated_text[0..backtick_check[-1]-1]
      puts "AFTER: #{truncated_text}"
    end

    truncate(GitHub::Markup.render_s(GitHub::Markups::MARKUP_MARKDOWN, truncated_text), length: truncated_text.length, escape: false)
  end
end
