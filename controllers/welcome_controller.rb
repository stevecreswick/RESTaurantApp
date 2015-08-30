class WelcomeController < ApplicationController
  get '/' do
    @tables = RestaurantTable.all
    @sortedtables = RestaurantTable.where(table_location: "main_dining_room").order("id ASC")
    @maintables = RestaurantTable.where(table_location: "main_dining_room").order("id ASC")
    @bartables = RestaurantTable.where(table_location: "bar").order("id ASC")
    @outsidetables = RestaurantTable.where(table_location: "outside").order("id ASC")
    erb :index
  end
end
