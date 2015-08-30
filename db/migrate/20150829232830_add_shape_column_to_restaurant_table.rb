class AddShapeColumnToRestaurantTable < ActiveRecord::Migration
  def change
    add_column(:restaurant_tables, :shape, :string)
  end

  def down
    remove_column(:restaurant_tables, :shape)
  end
end
