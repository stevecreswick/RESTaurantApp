class Party < ActiveRecord::Base
  belongs_to :table
  has_many :itemorders
  has_many :fooditems, through: :itemorders
end
