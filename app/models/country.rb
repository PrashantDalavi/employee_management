class Country < ApplicationRecord
  has_many :departments, dependent: :restrict_with_error
  has_many :employees, dependent: :restrict_with_error

  validates :name, presence: true
  validates :code, presence: true
  validates :name, uniqueness: { scope: :code }
end
