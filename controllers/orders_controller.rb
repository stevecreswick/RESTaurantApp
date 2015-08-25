class OrdersController < ApplicationController


  # INDEX
  get '/' do
    @orders = Order.all
    erb :'orders/index'
  end

  # NEW
  get '/new' do
    erb :'orders/new'
  end

  # CREATE
  post '/' do
    order = Order.create(params[:order])
    redirect "/orders/#{ order.id }"
  end

  # SHOW
  get '/:id' do
    @order = Order.find(params[:id])
    erb :'/orders/show'
  end

  # EDIT
  get '/:id/edit' do
    @order = Order.find(params[:id])
    erb :'/orders/edit'
  end

  # UPDATE
  put '/:id' do
    order = Order.find(params[:id])
    order.update(params[:order])
    redirect "/orders/#{order.id}"
  end

  # DESTROY
  delete '/:id' do
    Order.delete(params[:id])
    redirect '/orders'
  end

end
