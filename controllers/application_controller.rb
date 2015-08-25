class ApplicationController < Sinatra::Base

  set :root, File.expand_path('../../', __FILE__)
  enable :method_override

end
