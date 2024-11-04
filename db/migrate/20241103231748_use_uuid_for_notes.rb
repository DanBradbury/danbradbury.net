class UseUuidForNotes < ActiveRecord::Migration[8.1]
  def change
    drop_table :notes

    create_table :notes, id: :uuid do |t|
      t.text :content

      t.timestamps
    end
  end
end
