class RenameOrdersToItemorders < ActiveRecord::Migration
  def change
    rename_table :orders, :itemorders
  end

  def down
    rename_table :itemorders, "orders"
  end
end
