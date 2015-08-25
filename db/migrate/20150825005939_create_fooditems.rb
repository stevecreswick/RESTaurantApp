class CreateFooditems < ActiveRecord::Migration

  def change

    create_table :fooditems do |t|
    t.string :name
    t.string :course
    t.string :protein
    t.integer :spice_level
    t.integer :price
    t.text :description
    end

  end
end
