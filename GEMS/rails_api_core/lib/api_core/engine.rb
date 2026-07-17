# frozen_string_literal: true

module ApiCore
  class Engine < ::Rails::Engine
    isolate_namespace ApiCore
  end
end
