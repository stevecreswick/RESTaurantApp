class CreateOrders < ActiveRecord::Migration
  def change


    create_table :orders do |t|
    t.integer :fooditem_id
    t.integer :party_id
    t.timestamp
    end


  end
end
