require 'bundler'
Bundler.require()

require './models/fooditem'
require './models/order'
require './models/party'


require './controllers/application_controller'
require './controllers/welcome_controller'
require './controllers/fooditems_controller'
require './controllers/orders_controller'
# require './controllers/parties_controller'


# Routes
map('/'){ run WelcomeController }
map('/fooditems'){ run FoodItemsController }
map('/orders'){ run OrdersController }
# map('/parties'){ run PartiesController }
