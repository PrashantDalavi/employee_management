module Api
  module V1
    class CountriesController < BaseController
      before_action :set_country, only: [:show, :update, :destroy]

      def index
        countries = Country.order(:name)
        render json: { countries: countries }, status: :ok
      end

      def show
        render json: { country: @country }, status: :ok
      end

      def create
        country = Country.new(country_params)

        if country.save
          render json: { country: country }, status: :created
        else
          render json: { errors: country.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @country.update(country_params)
          render json: { country: @country }, status: :ok
        else
          render json: { errors: @country.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @country.destroy
        render json: { message: "Country deleted successfully" }, status: :ok
      end

      def bulk_import
        result = Countries::ImportService.new(params[:file]).call
        response_data = {
          imported: result[:imported],
          updated: result[:updated],
          skipped: result[:skipped],
          errors: result[:errors]
        }
        if result[:success]
          render json: response_data.merge(message: "Import completed"), status: :ok
        else
          render json: response_data.merge(message: "Import failed"), status: :unprocessable_entity
        end
      end

      private

      def set_country
        @country = Country.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["Country not found"] }, status: :not_found
      end

      def country_params
        params.require(:country).permit(:name, :code)
      end
    end
  end
end