class RestaurantTable < ActiveRecord::Base
  has_one :party
  has_many :itemorders, through: :parties
end
