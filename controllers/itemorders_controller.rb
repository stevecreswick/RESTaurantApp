class ItemOrdersController < ApplicationController


  # INDEX
  get '/' do
    @itemorders = Itemorder.all
    erb :'itemorders/index'
  end

  # NEW
  get '/new' do
    erb :'itemorders/new'
  end

  # CREATE
  post '/' do
    itemorder = Itemorder.create(params[:itemorder])
    redirect "/itemorders/#{ itemorder.id }"
  end

  # SHOW
  get '/:id' do
    @itemorder = Itemorder.find(params[:id])
    erb :'/itemorders/show'
  end

  # EDIT
  get '/:id/edit' do
    @itemorder = Itemorder.find(params[:id])
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
