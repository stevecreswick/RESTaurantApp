class PartiesController < ApplicationController


  # INDEX
  get '/' do
    @parties = Party.all
    erb :'parties/index'
  end

  # NEW
  get '/new' do
    erb :'parties/new'
  end

  get '/new/:id' do
    @table = Party.create(table_id: params[:id])
    erb :'parties/new'
  end

  # CREATE
  post '/:id' do
    party = Party.find(table_id: params[:id]).update(params[:party])

    redirect "/parties/#{ party.table_id }"
  end

  # SHOW
  get '/:id' do
    @party = Party.find(table_id: params[:id])
    erb :'/parties/show'
  end

  # EDIT
  get '/:id/edit' do
    @party = Party.find(params[:id])
    erb :'/parties/edit'
  end

  # UPDATE
  put '/:id' do
    party = Party.find(params[:id])
    party.update(params[:party])
    redirect "/parties/#{party.id}"
  end

  # DESTROY
  delete '/:id' do
    Party.delete(params[:id])
    redirect '/parties'
  end

end
