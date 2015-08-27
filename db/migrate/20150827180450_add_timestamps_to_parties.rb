class AddTimestampsToParties < ActiveRecord::Migration
  def change
    add_column(:parties, :created_at, :datetime)
    add_column(:parties, :updated_at, :datetime)
  end

  def down
    remove_column(:parties, :created_at)
    remove_column(:parties, :updated_at)
  end
end
