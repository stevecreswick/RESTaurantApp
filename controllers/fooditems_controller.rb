class FoodItemsController < ApplicationController

  require "active_support/all"

  # INDEX
  get '/' do
    @fooditems = Fooditem.all
    erb :'fooditems/index'
  end

  # NEW
  get '/new' do
    erb :'fooditems/new'
  end

  # CREATE
  post '/' do
    fooditem = Fooditem.create(params[:fooditem])
    redirect "/fooditems/#{ fooditem.id }"
  end

  # SHOW
  get '/:id' do
    @fooditem = Fooditem.find(params[:id])
    erb :'/fooditems/show'
  end

  # EDIT
  get '/:id/edit' do
    @fooditem = Fooditem.find(params[:id])
    erb :'/fooditems/edit'
  end

  # UPDATE
  put '/:id' do
    binding.pry
    fooditem = Fooditem.find(params[:id])
    fooditem.update(params[:fooditem])
    redirect "/fooditems"
  end

  # DESTROY
  delete '/:id' do
    Fooditem.delete(params[:id])
    redirect '/fooditems'
  end

end
