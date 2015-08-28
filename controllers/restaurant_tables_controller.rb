class RestaurantTablesController < ApplicationController

  require 'active_support/all'

  # INDEX
  get '/' do
    @tables = RestaurantTable.all

    erb :'restaurant_tables/index'
  end


  get '/new' do
    erb :'restaurant_tables/new'
  end

  # CREATE
  post '/' do
    party = RestaurantTable.create(params[:restaurant_table])
    redirect "/"
  end

  # SHOW
  get '/:id' do
    @table = RestaurantTable.find(params[:id])
    erb :'/restaurant_tables/show'
  end

  # EDIT
  get '/:id/edit' do
    @table = RestaurantTable.find(params[:id])
    erb :'/restaurant_tables/edit'
  end

  # UPDATE
  put '/:id' do
    table = RestaurantTable.find(params[:id])
    table.update(params[:restaurant_table])
    redirect "/restaurant_tables"
  end

  # DESTROY
  delete '/:id' do
    RestaurantTable.delete(params[:id])
    redirect '/restaurant_tables'
  end

end
