class RestaurantTable < ActiveRecord::Base
  has_one :parties
  has_many :itemorders, through: :parties
end
