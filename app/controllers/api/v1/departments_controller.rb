module Api
  module V1
    class DepartmentsController < BaseController
      before_action :set_department, only: [:show, :update, :destroy]

      def index
        departments = Department.includes(:country).order(:name)
        render json: { departments: departments.as_json(include: { country: { only: [:id, :name, :code] } }) }, status: :ok
      end

      def show
        render json: { department: @department.as_json(include: { country: { only: [:id, :name, :code] } }) }, status: :ok
      end

      def create
        department = Department.new(department_params)

        if department.save
          render json: { department: department.as_json(include: { country: { only: [:id, :name, :code] } }) }, status: :created
        else
          render json: { errors: department.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @department.update(department_params)
          render json: { department: @department.as_json(include: { country: { only: [:id, :name, :code] } }) }, status: :ok
        else
          render json: { errors: @department.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @department.destroy
        render json: { message: "Department deleted successfully" }, status: :ok
      end

      def bulk_import
        result = Departments::ImportService.new(params[:file]).call
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

      def set_department
        @department = Department.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["Department not found"] }, status: :not_found
      end

      def department_params
        params.require(:department).permit(:name, :code, :country_id, :description, :active)
      end
    end
  end
end
