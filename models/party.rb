class Party < ActiveRecord::Base
  has_many :itemorders
  has_many :fooditems, through: :itemorders
end
