class AdminController < ApplicationController
  get '/' do
    @tables = RestaurantTable.all
    @parties = Party.all
    @itemorders= Itemorder.all
    @fooditems = Fooditem.all
    @totalsales = 0
    @barsales = 0
    @mainsales = 0
    @outsidesales = 0
    @parties.each do |party|
      @totalsales += party.bill
    end
    @sortedtables = RestaurantTable.where(table_location: "main_dining_room").order("id ASC")
    @maintables = RestaurantTable.where(table_location: "main_dining_room").order("id ASC")
    @bartables = RestaurantTable.where(table_location: "bar").order("id ASC")
    @outsidetables = RestaurantTable.where(table_location: "outside").order("id ASC")

    @tables = RestaurantTable.all

    @seatedtables = []
    @emptytables =[]

    @tables.each do |table|
      if (table.is_occupied == true)
        @seatedtables.push(table)
      elsif (table.is_occupied  == false)
        @emptytables.push(table)
      end
    end

    @activeorders = []
    @inactiveorders = []

    @itemorders.each do |itemorder|
      if (itemorder.is_active == true)
        @activeorders.push(itemorder)
      elsif (itemorder.is_active == false)
        @inactiveorders.push(itemorder)
      end
    end
    erb :'admin/index'
  end
end
