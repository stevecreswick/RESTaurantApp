class WelcomeController < ApplicationController
  get '/' do
    erb :index
  end
end
