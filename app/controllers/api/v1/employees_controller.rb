module Api
  module V1
    class EmployeesController < BaseController
      before_action :set_employee, only: [:show, :update, :destroy]

      def index
        employees = Employee.filter(params)
                            .page(params[:page])
                            .per(params[:per_page] || 25)

        render json: {
          employees: employees.as_json(methods: [:full_name], include: employee_includes),
          total: employees.total_count,
          page: employees.current_page,
          per_page: employees.limit_value,
          total_pages: employees.total_pages
        }, status: :ok
      end

      def show
        render json: { employee: @employee.as_json(methods: [:full_name], include: employee_includes) }, status: :ok
      end

      def create
        employee = Employee.new(employee_params)
        if employee.save
          render json: { employee: employee.as_json(methods: [:full_name], include: employee_includes) }, status: :created
        else
          render json: { errors: employee.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @employee.update(employee_params)
          render json: { employee: @employee.as_json(methods: [:full_name], include: employee_includes) }, status: :ok
        else
          render json: { errors: @employee.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @employee.destroy
        render json: { message: "Employee deleted successfully" }, status: :ok
      end

      def bulk_import
        result = Employees::ImportService.new(params[:file]).call
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

      def set_employee
        @employee = Employee.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { errors: ["Employee not found"] }, status: :not_found
      end

      def employee_params
        params.require(:employee).permit(
          :first_name, :last_name, :email, :phone, :employee_code,
          :department_id, :country_id, :job_title, :hire_date,
          :salary, :currency, :active
        )
      end

      def employee_includes
        { department: { only: [:id, :name, :code] }, country: { only: [:id, :name, :code] } }
      end
    end
  end
end
