# How the objects are created to represent posts / the data that is displayed on the main website
# Iterate on all posts/*.md -> process based on a standardized format
# FILENAME: YYYY-MM-DD-short-slug.md
# ----
# header_key: value
# title: Long Name of the Post Title to be Displayed
# ----
# post_content
Post.destroy_all

Dir["./posts/*.md"].each do |f|
  file_name = f.gsub("./posts/", "").gsub(".md", "")
  dashes =  file_name.split("-")
  post_date = dashes[0..2].join("-").to_datetime
  post_title = dashes.drop(3).join(" ")
  post_slug = post_title.gsub(" ", "-")

  #raw_file_contents = File.read(f)

  state = 0
  content = ""
  File.readlines(f).each do |line|
    if state == 0
      if line.include? "---"
        state += 1
      elsif line.include? "title:"
        post_title = line.split(": ")[1]
        puts "UPDATED TITLE"
      end
    else
      content += line
    end
  end
  # first lets parse the header details out
  # lets get the content now
  Post.create!(
    title: post_title,
    content: content,
    created_at: post_date,
    slug: post_slug
  )
end
