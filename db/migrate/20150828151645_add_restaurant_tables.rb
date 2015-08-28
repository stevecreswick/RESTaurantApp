class AddRestaurantTables < ActiveRecord::Migration
  def change

    create_table :restaurant_tables do |t|
    t.integer :party_id
    t.integer :server_id
    t.string :table_location
    t.boolean :is_occupied
    t.timestamps
    end

  end
end
