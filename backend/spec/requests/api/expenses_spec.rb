require 'rails_helper'

RSpec.describe "Api::Expenses", type: :request do
  let!(:food_category) { Category.create!(name: "Food") }
  let!(:transport_category) { Category.create!(name: "Transport") }

  describe "GET /api/expenses" do
  let!(:expense1) { Expense.create!(description: "Lunch", amount: 100.00, category: food_category, date: Date.today) }
  let!(:expense2) { Expense.create!(description: "Taxi", amount: 50.00, category: transport_category, date: Date.today) }

    it "returns all expenses with category information" do
      get "/api/expenses"

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
    end

    it "returns expenses in descending order by date" do
      expense_a = Expense.create!(description: "Expense A", amount: 100.00, category: food_category, date: 2.days.ago.to_date, created_at: 1.hour.ago)
      expense_b = Expense.create!(description: "Expense B", amount: 50.00, category: transport_category, date: 1.day.ago.to_date, created_at: 2.hours.ago)
      expense_c = Expense.create!(description: "Expense C", amount: 75.00, category: food_category, date: Date.current, created_at: 3.hours.ago)

      get "/api/expenses"

      json = JSON.parse(response.body)
      ordered_ids = json.map { |expense| expense["id"] }
      selected_ids = ordered_ids & [ expense_c.id, expense_b.id, expense_a.id ]
      expect(selected_ids).to eq([ expense_c.id, expense_b.id, expense_a.id ])
    end

    it "returns expenses with same date ordered by id descending (tiebreaker)" do
      expense_x = Expense.create!(description: "Expense X", amount: 100.00, category: food_category, date: Date.current)
      expense_y = Expense.create!(description: "Expense Y", amount: 50.00, category: transport_category, date: Date.current)

      get "/api/expenses"

      json = JSON.parse(response.body)
      ordered_ids = json.map { |expense| expense["id"] }
      selected_ids = ordered_ids & [ expense_y.id, expense_x.id ]
      expect(selected_ids).to eq([ expense_y.id, expense_x.id ])
    end
  end

  describe "POST /api/expenses" do
    context "with valid parameters" do
      let(:valid_params) do
        {
          expense: {
            description: "Team Lunch",
            amount: 150.50,
            category_id: food_category.id,
            date: Date.today
          }
        }
      end

      it "creates a new expense" do
        expect {
          post "/api/expenses", params: valid_params, as: :json
        }.to change(Expense, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["description"]).to eq("Team Lunch")
        expect(json["amount"]).to eq(150.5)
      end
    end

    context "with invalid parameters" do
      it "with negative amounts" do
        invalid_params = {
          expense: {
            description: "Invalid expense",
            amount: -100.00,
            category_id: food_category.id,
            date: Date.today
          }
        }

        expect {
          post "/api/expenses", params: invalid_params, as: :json
        }.to change(Expense, :count).by(1)

        expect(response).to have_http_status(:created)
      end

      it "with empty descriptions" do
        invalid_params = {
          expense: {
            description: "",
            amount: 100.00,
            category_id: food_category.id,
            date: Date.today
          }
        }

        expect {
          post "/api/expenses", params: invalid_params, as: :json
        }.to change(Expense, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end
  end
end
