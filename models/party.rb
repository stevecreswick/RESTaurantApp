class Party < ActiveRecord::Base
  has_one :itemorder
  has_many :fooditems, through: :itemorder
end
