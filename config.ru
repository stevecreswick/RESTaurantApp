require 'bundler'
Bundler.require()

require "active_support/all"

require './models/fooditem'
require './models/itemorder'
require './models/party'


require './controllers/application_controller'
require './controllers/welcome_controller'
require './controllers/fooditems_controller'
require './controllers/itemorders_controller'
require './controllers/parties_controller'


# Routes
map('/'){ run WelcomeController }
map('/fooditems'){ run FoodItemsController }
map('/itemorders'){ run ItemOrdersController }
map('/parties'){ run PartiesController }


# CHEF Controller
