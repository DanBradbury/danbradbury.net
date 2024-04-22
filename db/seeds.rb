# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end
#
# open each file and create a new post records
Post.destroy_all

Dir["./posts/*.md"].each do |f|
  file_name = f.gsub("./posts/", "").gsub(".md", "")
  dashes =  file_name.split("-")
  post_date = dashes[0..2].join("-").to_datetime
  post_title = dashes.drop(3).join(" ")
  Post.create! title: post_title, content: File.read(f), created_at: post_date
end
