class ChangePriceInFooditemsToDecimal < ActiveRecord::Migration
  def up
    change_column :fooditems, :price, :decimal
  end

  def down
    change_column :fooditems, :price, :integer
  end
end
