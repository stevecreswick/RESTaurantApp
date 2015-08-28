class WelcomeController < ApplicationController
  get '/' do
    @tables = RestaurantTable.all
    erb :index
  end
end
