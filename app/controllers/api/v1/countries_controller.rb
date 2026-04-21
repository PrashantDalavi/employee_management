module Api
  module V1
    class CountriesController < ApplicationController
      def index
        countries = Country.order(:name)
        render json: { countries: countries }, status: :ok
      end
    end
  end
end 
