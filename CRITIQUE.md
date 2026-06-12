# Codebase Critique — LiKHA-IT Technical Test

**Date:** 2026-06-11
**Author:** Code Review

---

## 1. Missing Model Validations on Expense

- **Severity:** Critical
- **File:** `backend/app/models/expense.rb:1-3`
- **Description:** The `Expense` model defines only the `belongs_to :category` association with no validations whatsoever. There are no checks for presence, numericality, length, or format on any field.
- **Impact:** The API accepts negative amounts (e.g., `-100.00`), empty descriptions, and records with no category. This corrupts financial data and breaks downstream calculations like totals and averages. The controller returns `:unprocessable_entity` when save fails, but since validations are absent, bad data silently persists.
- **Suggested Fix:** Add ActiveRecord validations for `presence`, `numericality` (amount `> 0`), and `length` constraints. Example:
  ```ruby
  validates :description, presence: true, length: { minimum: 1, maximum: 255 }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :date, presence: true
  validates :category_id, presence: true
  ```

---

## 2. Destructive Seed Script

- **Severity:** Critical
- **File:** `backend/db/seeds.rb:3-4`
- **Description:** Lines 3 and 4 call `Expense.destroy_all` and `Category.destroy_all` unconditionally at the start of every `rails db:seed` run. This wipes all production or development data without warning.
- **Impact:** Accidentally running `db:seed` in a staging or production-like environment destroys all expense records permanently. There is no guard clause, no prompt, and no backup mechanism.
- **Suggested Fix:** Remove the `destroy_all` calls, or guard them behind an environment check:
  ```ruby
  if Rails.env.development?
    Expense.destroy_all
    Category.destroy_all
  end
  ```
  Alternatively, use `find_or_create_by` for idempotent seeds.

---

## 3. Tests Assert Wrong Behavior for Invalid Input

- **Severity:** Major
- **File:** `backend/spec/requests/api/expenses_spec.rb:54-86`
- **Description:** The "with invalid parameters" context contains two tests: one for negative amounts (lines 54-69) and one for empty descriptions (lines 71-86). Both tests expect `change(Expense, :count).by(1)` and `have_http_status(:created)`, which means they assert that invalid data is successfully saved.
- **Impact:** These tests validate buggy behavior rather than preventing it. If someone later adds model validations, these tests will fail even though the application would be behaving correctly. This gives false confidence in the test suite.
- **Suggested Fix:** Update both tests to expect `change(Expense, :count).by(0)` and `have_http_status(:unprocessable_entity)`. Add assertions that the response body contains the expected error messages.

---

## 4. Factory References Nonexistent Column

- **Severity:** Major
- **File:** `backend/spec/factories/expenses.rb:6`
- **Description:** The factory assigns `payer_name { "MyString" }`, but `payer_name` does not exist in the `expenses` table schema (`backend/db/schema.rb:21-29`).
- **Impact:** Any test using this factory will raise an `ActiveModel::UnknownAttributeError` when the attribute is mass-assigned. This makes the entire factory unusable and breaks any spec that depends on it.
- **Suggested Fix:** Remove the `payer_name` line from the factory. If the intent was to track who paid, add a migration for the column first, then update the factory.

---

## 5. createExpense Re-fetches Categories on Every Submit

- **Severity:** Major
- **File:** `frontend/src/services/api.ts:52-56`
- **Description:** Inside `createExpense`, `fetchCategories()` is called to map a category name to an ID. This happens on every expense creation, even though categories are static data.
- **Impact:** Unnecessary network round-trip on every form submission. In slow network conditions this adds perceptible latency. It also wastes bandwidth and server resources.
- **Suggested Fix:** Cache categories in a React context or query client (e.g., TanStack Query) and reuse the cached mapping. Alternatively, accept `category_id` directly in the form so no lookup is needed at all.

---

## 6. Manual URL Management Instead of React Router

- **Severity:** Major
- **File:** `frontend/src/pages/HistoryPage.tsx:40`
- **Description:** `window.history.pushState` and `URLSearchParams` are used manually to manage the `year` and `month` query parameters. The project has `react-router-dom@6.22.0` in `package.json` but it is not imported or used anywhere.
- **Impact:** Bypassing React Router breaks declarative routing, deep-linking guarantees, and future route transitions. It also means the app cannot easily add new pages or navigation features without rewriting URL logic.
- **Suggested Fix:** Replace `window.history.pushState` with `useNavigate` and `useSearchParams` from `react-router-dom`. Wrap the app in a `BrowserRouter` and use `<Routes>` for page definitions.

---

## 7. Frontend Categories Hardcoded and Out of Sync with Seeds

- **Severity:** Minor
- **File:** `frontend/src/constants/categories.ts:5-16`
- **Description:** `EXPENSE_CATEGORIES` is a static array defined in the frontend. The seed script (`backend/db/seeds.rb:8-19`) creates categories dynamically on the server. If the backend categories change, the frontend dropdown will show stale or mismatched options.
- **Impact:** Users may select a category in the UI that does not exist on the backend, causing the `createExpense` lookup to fail silently (it resolves to `undefined` and sends `category_id: undefined`).
- **Suggested Fix:** Fetch categories from `/api/categories` on app load and drive the UI from the server response.
  **Note:** This is resolved in the PR for FEATURE-001.

---

## 8. Inline Style Objects Rebuilt on Every Render

- **Severity:** Minor
- **Files:** `frontend/src/pages/HistoryPage.tsx:105-139`, `frontend/src/components/CalendarExpenseTable.tsx:72-108`, `frontend/src/components/CategoryBreakdown.tsx:28-133`
- **Description:** Inline `style={{ ... }}` objects are declared inside component bodies. React creates new object references on every render, forcing reconciliation work and preventing browser style caching.
- **Impact:** Unnecessary re-renders and layout recalculations. The code is also harder to maintain because styles are scattered across JSX rather than centralized in CSS modules or a styled-system library.
- **Suggested Fix:** Extract styles to CSS modules, use a CSS-in-JS library with static extraction, or at minimum define `const` style objects outside the component so references are stable.

---

## 9. API Errors Are Lost to the User

- **Severity:** Minor
- **File:** `frontend/src/services/api.ts:72-76`
- **Description:** When the backend rejects a request, it returns `{ errors: expense.errors.full_messages }` with a 422 status. The frontend catches this and throws a generic `Error("Failed to create expense")`, discarding the server-provided messages entirely.
- **Impact:** Users see only a vague failure message. They cannot tell whether the error is a validation issue, a network problem, or a server bug. This harms the user experience and makes debugging harder.
- **Suggested Fix:** Parse the response body before throwing:
  ```typescript
  const data = await response.json();
  throw new Error(data.errors?.join(", ") || "Failed to create expense");
  ```
  Better yet, return a structured result object `{ success: boolean; data?: T; errors?: string[] }` so callers can handle errors gracefully.

---

## 10. Category Deletion Cascades Silently to Expenses

- **Severity:** Minor
- **File:** `backend/app/models/category.rb:2`
- **Description:** `has_many :expenses, dependent: :destroy` means deleting a category automatically deletes every associated expense record without any warning or confirmation.
- **Impact:** A single `category.destroy` call can wipe out hundreds or thousands of expenses permanently. This is especially dangerous in an admin panel or console where the user may not realize the consequence.
- **Suggested Fix:** Change to `dependent: :restrict_with_error` so the category cannot be deleted while expenses still reference it. If cascading deletion is truly required, log it or require explicit confirmation in the controller.
