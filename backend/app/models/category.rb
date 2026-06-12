class Category < ApplicationRecord
  has_many :expenses, dependent: :destroy

  validates :name, presence: true
  validates :name, uniqueness: { case_sensitive: false }
  validates :name, length: { maximum: 100 }

  before_validation :strip_name

  private

  def strip_name
    self.name = name.strip if name.present?
  end
end
