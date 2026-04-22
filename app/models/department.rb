class Department < ApplicationRecord
  belongs_to :country
  has_many :employees, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :country_id }
  validates :code, presence: true
end
