class ItemOrdersController < ApplicationController


  # INDEX
  get '/' do
    @itemorders = Itemorder.all
    @activeorders = []
    @inactiveorders = []

    @itemorders.each do |itemorder|
      if (itemorder.is_active == true)
        @activeorders.push(itemorder)
      elsif (itemorder.is_active == false)
        @inactiveorders.push(itemorder)
      end
    end
    erb :'itemorders/index'
  end

  # NEW
  get '/new' do
    @fooditems = Fooditem.all
    @drinks = Fooditem.where(course: "Drink").order("id ASC")
    @apps = Fooditem.where(course: "Appetizer").order("id ASC")
    @entrees = Fooditem.where(course: "Entree").order("id ASC")
    @sides = Fooditem.where(course: "Sides").order("id ASC")
    @desserts = Fooditem.where(course: "Dessert").order("id ASC")
    @parties = Party.where(paid_bill: false).order("restaurant_table_id ASC")
    erb :'itemorders/new'
  end

  # CREATE
  post '/' do

  party_id = params['party_id']
  fooditems =  params['fooditems']
  special_requests =  params['special_requests']
  quantities =  params['quantities']
  storedquants = []
  binding.pry
  if (quantities.length > 0)
    quantities.each do |quantity|
      if (quantity.length > 0)
        storedquants.push(quantity)
      end
    end
  else
    storedquants.push(quantities)
  end
  binding.pry

  i = 0;
    fooditems.each do |fooditem|
      Itemorder.create({
        fooditem_id: fooditem,
        party_id: party_id,
        is_active: true,
        special_request: special_requests,
        quantity: storedquants[i]
        })

        party = Party.find(party_id)
        food = Fooditem.find(fooditem)
        party.bill += (food.price * storedquants[i].to_i)
        party.update({
          bill: party.bill
        })
        binding.pry
        i += 1
    end

  redirect '/itemorders'
  end

  # SHOW
  get '/:id' do
    @itemorder = Itemorder.find(params[:id])
    erb :'/itemorders/show'
  end

  # EDIT
  get '/:id/edit' do
    @itemorder = Itemorder.find(params[:id])
    @fooditems = Fooditem.all
    erb :'/itemorders/edit'
  end

  # UPDATE
  put '/:id' do
    itemorder = Itemorder.find(params[:id])
    itemorder.update(params[:itemorder])
    redirect "/itemorders"
  end

  # DESTROY
  delete '/:id' do
    Itemorder.delete(params[:id])
    redirect '/itemorders'
  end

end
