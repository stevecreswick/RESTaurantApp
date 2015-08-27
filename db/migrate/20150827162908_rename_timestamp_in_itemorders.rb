class RenameTimestampInItemorders < ActiveRecord::Migration
  def change
    add_column(:itemorders, :created_at, :datetime)
    add_column(:itemorders, :updated_at, :datetime)
  end

  def down
    remove_column(:itemorders, :created_at)
    remove_column(:itemorders, :updated_at)
  end
end
