class Employee < ApplicationRecord
  belongs_to :department
  belongs_to :country

  validates :first_name, :last_name, :email, :job_title, :hire_date, presence: true
  validates :email, :employee_code, uniqueness: true
  validates :salary, presence: true, numericality: { greater_than_or_equal_to: 0 }

  SORTABLE_COLUMNS = %w[id first_name last_name email job_title salary hire_date employee_code].freeze

  scope :search, ->(query) {
    return all if query.blank?
    q = "%#{query}%"
    where("first_name ILIKE :q OR last_name ILIKE :q OR email ILIKE :q OR job_title ILIKE :q OR employee_code ILIKE :q", q: q)
  }

  scope :by_country, ->(country_id) { country_id.present? ? where(country_id: country_id) : all }
  scope :by_department, ->(dept_name) {
    dept_name.present? ? where(department_id: Department.where(name: dept_name).select(:id)) : all
  }
  scope :by_status, ->(active) { active.present? ? where(active: active) : all }

  def self.filter(params = {})
    includes(:department, :country)
      .search(params[:search])
      .by_country(params[:country_id])
      .by_department(params[:department_name])
      .by_status(params[:active])
      .sorted(params[:sort_by], params[:sort_dir])
  end

  def self.sorted(column, direction)
    col = SORTABLE_COLUMNS.include?(column) ? column : "id"
    dir = %w[asc desc].include?(direction) ? direction : "asc"
    order("#{col} #{dir}")
  end

  def full_name
    "#{first_name} #{last_name}"
  end
end
