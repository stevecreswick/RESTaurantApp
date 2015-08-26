class RenameOrdersIdToItemordersId < ActiveRecord::Migration
  def change
    rename_column :parties, :order_id, :itemorder_id
  end

  def down
    rename_column :parties, :itemorder_id, :order_id
  end
end
