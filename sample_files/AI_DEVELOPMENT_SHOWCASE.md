# Building a Full-Stack App with AI: A Developer's Journey

> How I used AI pair programming to build a complete Employee Salary Management tool from scratch — from initial scaffold to production-ready code with 50+ RSpec tests, bulk import optimization, and real-time analytics.

---

## The Approach

Rather than writing every line manually, I treated the AI as a senior pair programmer. I provided:
- **High-level direction** — what to build
- **Design opinions** — how it should be structured
- **Quality feedback** — pushing back on bad patterns
- **Domain knowledge** — what columns, validations, and business logic makes sense

The AI handled:
- Boilerplate generation
- File creation across the full stack
- Test writing
- Bug fixing when things broke

---

## Phase 1: Foundation — Countries Module

### Prompt 1: Starting the Base
> *"lets create a basic crud operation for countries along with model, controller and rspec"*

This kicked off the entire project. The AI generated:
- Migration, model, controller, factory, request spec
- Bulk import endpoint with CSV/Excel support
- React frontend component

### Prompt 2: Spotting Reusable Code
> *"this can be made common right?"*
> *(pointing at CSRF skip logic in countries controller)*

I noticed the CSRF token skip was duplicated. This led to creating a `BaseController` that all API controllers inherit from — a classic Rails pattern the AI initially missed.

### Prompt 3: Questioning Unnecessary Complexity
> *"do we have anything like this? we are just using direct calls right without any csrf or any authentication?"*
> *(pointing at CSRF token logic in api.js)*

I challenged the frontend code that was adding CSRF tokens unnecessarily. This cleaned up the API service layer.

### Prompt 4: Organizing Sample Data
> *"can we make sample_files folder and save this country csv in there?"*

Small but important — keeping sample data organized instead of scattered.

### Prompt 5: Debugging Test Failures
> *Pasted 3 RSpec failure outputs directly*

When tests failed, I didn't debug manually. I pasted the exact error output and let the AI fix the import service logic (upsert behavior, updated count tracking).

### Prompt 6: Debugging Frontend
> *"Unexpected token '<', '<!DOCTYPE'... is not valid JSON — Imported: 0, Updated: 0, Skipped: 0 when importing"*

The frontend was receiving HTML instead of JSON for file uploads. This identified the CSRF issue with `FormData` requests and led to the `BaseController` fix.

---

## Phase 2: Departments Module

### Prompt 7: Leveraging Existing Patterns
> *"now lets fix department? lets create a basic crud operation for department along with model, controller and rspec as well. same like countries"*

Key phrase: **"same like countries"**. By referencing the pattern already built, the AI replicated the entire stack consistently.

### Prompt 8: Designing the Schema Together
> *"i think we need department and its attributes should be name, country_id as it belongs to the country, description, code — and let me know if you can think of anything else"*

I proposed the core columns and asked the AI to suggest additions. It suggested `budget` and `employee_count` — I pushed back:

### Prompt 9: Refining the Design
> *"naa budget is not required i feel. and the uniqueness should be name and country id. yes and an active flag too. do u think we need no of employees?"*

This is collaborative design. I rejected what didn't make sense, confirmed what did, and asked for the AI's opinion. The result was a clean schema we both agreed on.

### Prompt 10: Green Light
> *"yes, lets do it then, it looks perfect to me, lets build it the same way as we did for countries"*

One prompt. Full department stack generated: migration, model, controller, import service, factory, 3 spec files, sample CSV, React component, API service functions.

### Prompt 11: Adding Country Data to Response
> *"we need country name as well in here"*
> *(pointing at departments controller index)*

The AI pointed out it was already included via `as_json(include: { country: ... })`. Good — it caught that I'd missed it.

### Prompt 12: Missing Search
> *"We dont have search functionality in here"*

A one-line observation. The AI added a full search bar with country filter and status filter dropdowns.

---

## Phase 3: Employees Module

### Prompt 13: Schema Design
> *"now lets move on to employee table? tell me what columns do we need for employee?"*

I asked the AI to propose the schema. It came back with a solid list. I approved and we moved forward.

### Prompt 14: Full Build
> *"yes, perfect, go for it and lets have a complete integration with complete rspec as well"*

One prompt → 12 files: migration, model, controller, import service, factory, 3 spec files, sample CSV, updated React components, API functions.

### Prompt 15: Code Quality — Consolidating Validations
> *"all the presence true can go in one line right?"*
> *(pointing at 6 separate validation lines)*

```ruby
# Before (6 lines)
validates :first_name, presence: true
validates :last_name, presence: true
validates :email, presence: true
...

# After (1 line)
validates :first_name, :last_name, :email, :job_title, :hire_date, presence: true
```

### Prompt 16: Continuing the Cleanup
> *"these 2 can also go in one line right"*
> *(pointing at 2 uniqueness validations)*

```ruby
validates :email, :employee_code, uniqueness: true
```

### Prompt 17: Pushing Back on Fat Controllers
> *"this is so messed up, follow design principles and also make use of models.. we cannot be having such fat controller with such fat method? if we need pagination then we use gem right will paginate or something?"*

This was a turning point. I called out:
- 35-line index method
- Hand-rolled pagination
- All query logic in the controller

This led to:
- Adding **Kaminari** gem for pagination
- Moving all filtering to **model scopes**
- The controller going from 35 lines to 3

### Prompt 18: Preferring Class Methods
> *"lets go for a method rather than a scope, its easier to write rspec for this"*
> *(pointing at the sorted scope)*

```ruby
# Scope → Class method (easier to test)
def self.sorted(column, direction)
  col = SORTABLE_COLUMNS.include?(column) ? column : "id"
  dir = %w[asc desc].include?(direction) ? direction : "asc"
  order("#{col} #{dir}")
end
```

### Prompt 19: Sanity Check
> *"correct me if i am over engineering this"*

AI's response: "No, you're not. This is textbook Rails." — Sometimes you need that validation.

### Prompt 20: Even Thinner Controller
> *"rather than such big query, cant we have one method in model and that accepts all params and does querying and all, this is basic rails right?"*

This led to the `Employee.filter(params)` class method — the controller just calls one method:

```ruby
def index
  employees = Employee.filter(params)
                      .page(params[:page])
                      .per(params[:per_page] || 25)
end
```

---

## Phase 4: Performance & Optimization

### Prompt 21: Fixing Filter Bugs
> *"i think filters dont work properly, there are duplicate values in department, can we have unique names in it and countries, i want to list out only those countries where employees are present?"*

Real-world observation. Led to deriving filter options from actual employee data.

### Prompt 22: The Bulk Import Challenge
> *"Can you generate dummy csv data with 10000 records and this excel import should be flash fast, make it more optimised or bulk insert the things, this is the real challenge"*

This was the big one. The import service was rewritten:
- **Before**: 10K individual INSERT statements (~30K queries)
- **After**: `insert_all`/`upsert_all` in batches of 1000 (~13 queries)
- Preloaded lookup hashes for countries/departments
- In-memory validation (no DB roundtrips)

### Prompt 23: Calling Out Bad Code Structure
> *"100 line one method? seriously?"*

Fair point. The `import_rows` method was broken into 8 focused methods:
- `preload_lookups`
- `process_spreadsheet`
- `extract_row_attrs`
- `validate_and_classify`
- `classify_record`
- `persist_records`

Longest method went from 100 lines to ~15.

### Prompt 24: Fixing Broken Filters
> *"the screen goes blank when i select Design department"*

`joins(:department)` conflicted with `includes(:department)`. Fixed with subquery:
```ruby
where(department_id: Department.where(name: dept_name).select(:id))
```

---

## Phase 5: Analytics & Polish

### Prompt 25: Backend Insights
> *"lets start salary insights page?"*

Moved salary analytics from client-side JS (fetching 10K rows) to SQL aggregations:
- `pluck` with `GROUP BY` — 3 queries total
- Response went from ~5MB to ~2KB

### Prompt 26: Debugging Production Error
> *Pasted the actual Rails error log:*
> `ActiveModel::MissingAttributeError (missing attribute 'country_id' for Employee)`

The `select()` was creating partial AR objects. Fixed by switching to `pluck()` which returns raw arrays.

### Prompt 27: Catching Data Inconsistency
> *"there are totally 19 departments but the data is only 8 department"*

Spotted that `COUNT(DISTINCT department_id)` was counting 19 (IDs across countries) instead of 8 (unique names). Fixed to `COUNT(DISTINCT departments.name)`.

### Prompt 28: Ensuring Test Coverage
> *"then rspec must also be wrong if this is wrong?"*

Absolutely right. Added an edge case test with same-name departments across countries to prevent regression.

---

## Key Takeaways

### What Worked Well
1. **Incremental building** — Countries → Departments → Employees, each building on the last
2. **Pattern replication** — "build it the same way as countries" saved massive time
3. **Immediate feedback** — Calling out bad code as soon as I saw it
4. **Pasting errors directly** — No need to describe bugs, just paste the output

### How I Guided the AI
1. **Design decisions were mine** — I chose the columns, validations, and uniqueness rules
2. **Code quality was enforced** — I rejected fat controllers, long methods, and hand-rolled pagination
3. **Business logic was validated** — I caught the department count bug that tests missed
4. **Architecture was intentional** — Fat model/thin controller, scopes, class methods, service objects

### The Numbers
| Metric | Count |
|--------|-------|
| Total prompts | ~30 |
| Backend files created | 25+ |
| Frontend files created/updated | 8 |
| RSpec test cases | 50+ |
| Lines of production code | ~1500 |
| Time to build | ~2 hours |

### The Result
A fully functional Employee Salary Management app with:
- 3 CRUD modules (Countries, Departments, Employees)
- Bulk CSV/Excel import with optimized batch inserts
- Server-side search, filtering, sorting, and pagination
- Real-time salary analytics via SQL aggregations
- Comprehensive test coverage
- Clean, maintainable code following Rails conventions

---

*Built with AI pair programming — the human provides direction, design, and quality control; the AI handles implementation velocity.*
