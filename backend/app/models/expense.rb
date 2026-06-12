class Expense < ApplicationRecord
  belongs_to :category

  validates :date, presence: true
  validates :date, comparison: { less_than_or_equal_to: -> { Date.current + 1.day } }
end
