class Expense < ApplicationRecord
  belongs_to :category

  validates :amount, numericality: { greater_than: 0 }
  validates :description, presence: true
  validates :date, presence: true
  validates :date, comparison: { less_than_or_equal_to: -> { Date.current + 1.day } }
end
