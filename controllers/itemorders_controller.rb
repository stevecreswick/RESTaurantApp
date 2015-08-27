class ItemOrdersController < ApplicationController


  # INDEX
  get '/' do
    @itemorders = Itemorder.all
    erb :'itemorders/index'
  end

  # NEW
  get '/new' do
    @fooditems = Fooditem.all
    @parties = Party.all
    erb :'itemorders/new'
  end

  # CREATE
  post '/' do

  party_id = params['party_id']
  fooditems =  params['fooditems']

    fooditems.each do |fooditem|
      Itemorder.create({
        fooditem_id: fooditem,
        party_id: party_id
        })

        party = Party.find(party_id)
        food = Fooditem.find(fooditem)
        party.bill += food.price
        party.update({
          bill: party.bill
        })
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
    redirect "/itemorders/#{itemorder.id}"
  end

  # DESTROY
  delete '/:id' do
    Itemorder.delete(params[:id])
    redirect '/itemorders'
  end

end
