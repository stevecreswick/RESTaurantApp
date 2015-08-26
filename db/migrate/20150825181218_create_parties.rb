class CreateParties < ActiveRecord::Migration
  def change

    create_table :parties do |t|
    t.integer :order_id
    t.integer :table_id
    t.string :table_location
    t.integer :number_of_guests
    t.integer :bill
    t.boolean :paid_bill
    t.timestamp
    end

  end
end
