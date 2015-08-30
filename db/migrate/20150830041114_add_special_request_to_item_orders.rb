class AddSpecialRequestToItemOrders < ActiveRecord::Migration
  def change
    add_column(:itemorders, :special_request, :string)
  end

  def down
    remove_column(:itemorders, :special_request)
  end
end
