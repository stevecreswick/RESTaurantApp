class ChangeBillInPartiesToDecimal < ActiveRecord::Migration
  def up
    change_column :parties, :bill, :decimal
  end

  def down
    change_column :parties, :bill, :integer
  end
end
