class Itemorder < ActiveRecord::Base
  belongs_to :fooditem
  belongs_to :party
end
