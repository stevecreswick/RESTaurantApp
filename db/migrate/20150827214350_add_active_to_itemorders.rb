class AddActiveToItemorders < ActiveRecord::Migration
  def change
    add_column(:itemorders, :is_active, :boolean)
  end

  def down
    remove_column(:itemorders, :is_active)
  end
end
