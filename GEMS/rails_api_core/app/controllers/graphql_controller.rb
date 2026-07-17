# frozen_string_literal: true

class GraphqlController < ApplicationController
  def execute
    render json: gql_response
  rescue StandardError => e
    raise e unless Rails.env.development?

    handle_error_in_development(e)
  end

  private

  # Example of Usage Two way Encryption
  # def keychain
  #   @keychain ||= ApiCore::Models::Keychain.find('61fab06b7d5f91348652d234')
  # end

  # def server_encryptor
  #   @server_encryptor ||= ApiCore::Encryptor.new(
  #     keychain.decoded_server_keys[:prv],
  #     keychain.decoded_server_keys[:pub],
  #     keychain.signature,
  #     'string'
  #   )
  # end

  # def clent_encryptor
  #   @clent_encryptor ||= ApiCore::Encryptor.new(
  #     keychain.decoded_client_keys[:prv],
  #     keychain.decoded_client_keys[:pub],
  #     keychain.signature,
  #     'string'
  #   )
  # end

  # def decrypted_gql_query
  #   return gql_query unless ApiCore.config.encrypt_request

  #   @decrypted_gql_query ||= server_encryptor.decrypt(gql_query)
  # end

  # def encrypted_gql_response
  #   return gql_response unless ApiCore.config.encrypt_response

  #   @encrypted_gql_response ||= server_encryptor.encrypt(gql_response.to_json)
  #   # @encrypted_gql_response ||= \
  #   #   {
  #   #     encrypted: {
  #   #       query: gql_query,
  #   #       response: server_encryptor.encrypt(gql_response.to_json),
  #   #     },
  #   #     decrypted: {
  #   #       query: server_encryptor.decrypt(gql_query),
  #   #       response: gql_response
  #   #     }
  #   #   }
  # end

  def gql_response
    @gql_response ||= \
      DefaultApiSchema.execute(
        gql_query,
        variables: gql_variables,
        context: gql_context,
        operation_name: gql_operation_name
      )
  end

  def gql_variables
    @gql_variables ||= prepare_variables(params[:variables])
  end

  def gql_query
    @gql_query ||= params[:query]
  end

  def gql_operation_name
    @gql_operation_name ||= params[:operationName]
  end

  def gql_context
    @gql_context ||= {
      # Query context goes here, for example:
      # current_user: current_user,
    }
  end

  # Handle variables in form data, JSON body, or a blank value
  def prepare_variables(variables_param)
    case variables_param
    when String
      if variables_param.present?
        JSON.parse(variables_param) || {}
      else
        {}
      end
    when Hash
      variables_param
    when ActionController::Parameters
      variables_param.to_unsafe_hash # GraphQL-Ruby will validate name and type of incoming variables.
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{variables_param}"
    end
  end

  def handle_error_in_development(err)
    logger.error err.message
    logger.error err.backtrace.join("\n")

    render json: { errors: [{ message: err.message, backtrace: err.backtrace }], data: {} }, status: 500
  end
end
