class AddQuantityToItemOrders < ActiveRecord::Migration
  def change
    add_column(:itemorders, :quantity, :integer)
  end

  def down
    remove_column(:itemorders, :quantity)
  end
end
