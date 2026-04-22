Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :countries do
        collection do
          post :bulk_import
        end
      end
      resources :departments do
        collection do
          post :bulk_import
        end
      end
      resources :employees do
        collection do
          post :bulk_import
        end
      end
      get :salary_insights, to: "insights#salary"
    end
  end
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  root "home#index"
end
