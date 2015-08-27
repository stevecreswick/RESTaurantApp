class Fooditem < ActiveRecord::Base
  has_many :itemorders
  has_many :parties, through: :itemorders
end
