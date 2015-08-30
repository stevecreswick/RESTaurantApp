class FoodItemsController < ApplicationController

  require "active_support/all"

  # INDEX
  get '/' do
    @fooditems = Fooditem.all
    @drinks = Fooditem.where(course: "Drink").order("id ASC")
    @apps = Fooditem.where(course: "Appetizer").order("id ASC")
    @entrees = Fooditem.where(course: "Entree").order("id ASC")
    @sides = Fooditem.where(course: "Sides").order("id ASC")
    @desserts = Fooditem.where(course: "Dessert").order("id ASC")
    @parties = Party.where(paid_bill: false).order("restaurant_table_id ASC")
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
    fooditem = Fooditem.find(params[:id])
    fooditem.update(params[:fooditem])
    redirect "/admin"
  end

  # DESTROY
  delete '/:id' do
    Fooditem.delete(params[:id])
    redirect '/admin'
  end

end
