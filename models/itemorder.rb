class Itemorder < ActiveRecord::Base
  has_many :fooditems
  belongs_to :party
end
