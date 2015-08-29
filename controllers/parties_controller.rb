class PartiesController < ApplicationController

  require 'active_support/all'

  # INDEX
  get '/' do
    @parties = Party.all
    @activeparties = []
    @inactiveparties =[]

    @parties.each do |party|
      if (party.paid_bill == false)
        @activeparties.push(party)
      elsif (party.paid_bill  == true)
        @inactiveparties.push(party)
      end
    end
    erb :'parties/index'
  end

  # NEW
  # get '/new' do
  #   erb :'parties/new'
  # end

  get '/new' do
    erb :'parties/new'
  end

  # CREATE
  post '/' do
    party = Party.create(params[:party])
    table = RestaurantTable.find(params[:table_id]);
    table.update(params[:restaurant_table]);
    table.update({
      party_id: party.id
      })
    redirect "/itemorders/new"
  end

  # SHOW
  get '/:id' do
    @party = Party.find(params[:id])
    @tax = @party.bill * 0.08875
    @eighteen_percent = @party.bill * 0.18
    @twenty_percent = @party.bill * 0.20
    @twentyfive_percent =  @party.bill * 0.25
    erb :'/parties/show'
  end

  # EDIT
  get '/:id/edit' do
    @party = Party.find(params[:id])
    @itemorder = @party.itemorders
    erb :'/parties/edit'
  end

  # UPDATE
  put '/:id' do
    party = Party.find(params[:id])
    party.update(params[:party])
    table = RestaurantTable.find(party.restaurant_table_id)
    table.update({
      is_occupied: false
      })
    redirect "/parties"
  end

  # DESTROY
  delete '/:id' do
    Party.delete(params[:id])
    redirect '/parties'
  end

end
