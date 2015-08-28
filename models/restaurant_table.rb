class RestaurantTable < ActiveRecord::Base
  has_many :parties
  has_many :itemorders, through: :parties
end
