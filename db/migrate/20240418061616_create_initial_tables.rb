class CreateInitialTables < ActiveRecord::Migration[7.1]
  def change
    create_table :posts do |t|
      t.string :title
      t.text :content
      t.string :slug

      t.timestamps
    end
  end
end
