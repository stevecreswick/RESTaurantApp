class Party < ActiveRecord::Base
  has_many :orders
  has_many :fooditems, through: :orders
end
