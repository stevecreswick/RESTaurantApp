class AddActiveToParties < ActiveRecord::Migration
  def change
    add_column(:parties, :is_active, :boolean)
  end

  def down
    remove_column(:parties, :is_active)
  end
end
