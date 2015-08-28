class ChangeTableIdToRestaurantTableId < ActiveRecord::Migration
  def change
    rename_column :parties, :table_id, :restaurant_table_id
  end

  def down
    rename_column :parties, :restaurant_table_id, :table_id
  end
end
