class CreateNote < ActiveRecord::Migration[8.1]
  def change
    create_table :notes do |t|
      t.text :content

      t.timestamps
    end
  end
end
