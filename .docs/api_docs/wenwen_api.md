# 聊天

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1/chat/completions:
    post:
      summary: 聊天
      deprecated: false
      description: |-
        基础文本对话
        所有对话模型，都可使用此接口， 修改 model 属性为模型名
      tags:
        - OpenAI接口(/chat/completions)
      parameters:
        - name: Content-Type
          in: header
          description: ''
          required: true
          example: application/json
          schema:
            type: string
        - name: Authorization
          in: header
          description: ''
          required: true
          example: Bearer {YOUR_API_KEY}
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                model:
                  type: string
                  description: 要使用的模型的名字
                messages:
                  type: array
                  items:
                    type: object
                    properties:
                      role:
                        type: string
                      content:
                        type: string
                    required:
                      - role
                      - content
                    x-apifox-orders:
                      - role
                      - content
                  description: 至今为止对话所包含的消息列表。参考右边json示例。
              required:
                - model
                - messages
              x-apifox-orders:
                - model
                - messages
            example:
              model: gpt-3.5-turbo
              messages:
                - role: system
                  content: You are a helpful assistant.
                - role: user
                  content: Hello!
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  object:
                    type: string
                  created:
                    type: integer
                  choices:
                    type: array
                    items:
                      type: object
                      properties:
                        index:
                          type: integer
                        message:
                          type: object
                          properties:
                            role:
                              type: string
                            content:
                              type: string
                          required:
                            - role
                            - content
                          x-apifox-orders:
                            - role
                            - content
                        finish_reason:
                          type: string
                      x-apifox-orders:
                        - index
                        - message
                        - finish_reason
                  usage:
                    type: object
                    properties:
                      prompt_tokens:
                        type: integer
                      completion_tokens:
                        type: integer
                      total_tokens:
                        type: integer
                    required:
                      - prompt_tokens
                      - completion_tokens
                      - total_tokens
                    x-apifox-orders:
                      - prompt_tokens
                      - completion_tokens
                      - total_tokens
                required:
                  - id
                  - object
                  - created
                  - choices
                  - usage
                x-apifox-orders:
                  - id
                  - object
                  - created
                  - choices
                  - usage
              example:
                id: chatcmpl-123
                object: chat.completion
                created: 1677652288
                choices:
                  - index: 0
                    message:
                      role: assistant
                      content: |-


                        Hello there, how may I assist you today?
                    finish_reason: stop
                usage:
                  prompt_tokens: 9
                  completion_tokens: 12
                  total_tokens: 21
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: OpenAI接口(/chat/completions)
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/7041221/apis/api-343683300-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```