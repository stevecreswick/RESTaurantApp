class AddAvailableColumnToFoodItems < ActiveRecord::Migration
  def change
    add_column(:fooditems, :available, :boolean)
  end

  def down
    remove_column(:fooditems, :available)
  end
end
