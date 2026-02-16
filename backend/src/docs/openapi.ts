const openApiDocument: Record<string, unknown> = {
  openapi: '3.0.3',
  info: {
    title: 'OpEx 5.0 API',
    version: '1.0.0',
    description: 'OpenAPI documentation for OpEx 5.0 Suggestion Management API.',
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Local development',
    },
  ],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Health', description: 'Service health endpoint' },
    { name: 'Auth', description: 'Authentication operations' },
    { name: 'Suggestions', description: 'Suggestion lifecycle operations' },
    { name: 'Committee', description: 'Committee evaluation operations' },
    { name: 'Approvals', description: 'Approval workflow operations' },
    { name: 'Projects', description: 'Project management operations' },
    { name: 'Reports', description: 'Reporting and export operations' },
    { name: 'Users', description: 'Current user profile and notifications' },
    { name: 'Admin', description: 'Administrative operations' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    parameters: {
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
      },
      UserIdParam: {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
      },
      MilestoneIdParam: {
        name: 'milestoneId',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
      },
      SettingKeyParam: {
        name: 'key',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
      NotificationIdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer' },
      },
    },
    schemas: {
      ApiSuccessResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        required: ['success', 'message', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Request failed' },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'BAD_REQUEST' },
              message: { type: 'string', example: 'Validation failed' },
              details: {
                type: 'object',
                nullable: true,
                additionalProperties: true,
              },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['employeeId', 'password'],
        properties: {
          employeeId: { type: 'string', example: 'USER001' },
          password: { type: 'string', format: 'password', example: 'Test1234' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password' },
          newPassword: { type: 'string', format: 'password' },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', format: 'password' },
        },
      },
      SuggestionCreateRequest: {
        type: 'object',
        required: ['title', 'description', 'currentSituation', 'proposedSolution', 'gainCategories'],
        properties: {
          title: { type: 'string', minLength: 3 },
          description: { type: 'string', minLength: 10 },
          currentSituation: { type: 'string' },
          proposedSolution: { type: 'string' },
          gainCategories: {
            type: 'array',
            items: { type: 'string' },
            example: ['QUALITY', 'COST'],
          },
        },
      },
      SuggestionUpdateRequest: {
        allOf: [
          { $ref: '#/components/schemas/SuggestionCreateRequest' },
        ],
      },
      SuggestionCommitteeReviewRequest: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['APPROVE', 'REJECT', 'REVISION_REQUEST'],
          },
          category: { type: 'string' },
          projectLeaderId: { type: 'integer' },
          teamMemberIds: {
            type: 'array',
            items: { type: 'integer' },
          },
          notes: { type: 'string' },
          rejectionReason: { type: 'string' },
          revisionRequestReason: { type: 'string' },
        },
      },
      ApprovalActionRequest: {
        type: 'object',
        properties: {
          notes: { type: 'string' },
        },
      },
      ApprovalRejectRequest: {
        type: 'object',
        required: ['rejectionReason'],
        properties: {
          rejectionReason: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      ApprovalReturnRequest: {
        type: 'object',
        required: ['reason'],
        properties: {
          reason: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      ProjectProgressRequest: {
        type: 'object',
        required: ['progress'],
        properties: {
          progress: { type: 'number', minimum: 0, maximum: 100 },
          status: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      CompleteProjectRequest: {
        type: 'object',
        properties: {
          completionNotes: { type: 'string' },
          totalCostSavings: { type: 'number' },
          actualGain: { type: 'number' },
        },
      },
      AddTeamMemberRequest: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'integer' },
          role: { type: 'string' },
        },
      },
      CreateMilestoneRequest: {
        type: 'object',
        required: ['title', 'dueDate'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
        },
      },
      UpdateMilestoneRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
        },
      },
      UserProfileUpdateRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      AdminCreateUserRequest: {
        type: 'object',
        required: ['employeeId', 'email', 'firstName', 'lastName', 'role'],
        properties: {
          employeeId: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string' },
          position: { type: 'string' },
          companyId: { type: 'integer' },
          departmentId: { type: 'integer' },
          unitId: { type: 'integer' },
        },
      },
      AdminBulkCreateUsersRequest: {
        type: 'object',
        required: ['users'],
        properties: {
          users: {
            type: 'array',
            items: { $ref: '#/components/schemas/AdminCreateUserRequest' },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
          },
        },
      },
      NotFound: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with employee credentials',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Reset request accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current user',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change current user password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password changed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        responses: {
          '200': {
            description: 'Current user profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/suggestions': {
      get: {
        tags: ['Suggestions'],
        summary: 'List suggestions',
        responses: {
          '200': {
            description: 'Suggestions list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Suggestions'],
        summary: 'Create suggestion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuggestionCreateRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Suggestion created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/suggestions/my': {
      get: {
        tags: ['Suggestions'],
        summary: 'List current user suggestions',
        responses: {
          '200': {
            description: 'Current user suggestions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/suggestions/{id}': {
      get: {
        tags: ['Suggestions'],
        summary: 'Get suggestion by id',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': {
            description: 'Suggestion detail',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Suggestions'],
        summary: 'Update suggestion',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuggestionUpdateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Suggestion updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Suggestions'],
        summary: 'Delete suggestion',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': {
            description: 'Suggestion deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/suggestions/{id}/submit': {
      post: {
        tags: ['Suggestions'],
        summary: 'Submit suggestion for committee review',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': {
            description: 'Suggestion submitted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/suggestions/{id}/committee-review': {
      post: {
        tags: ['Suggestions'],
        summary: 'Committee manager review action for a suggestion',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuggestionCommitteeReviewRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Committee review completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/suggestions/{id}/approve': {
      post: {
        tags: ['Suggestions'],
        summary: 'Approve suggestion (legacy action endpoint)',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApprovalActionRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Suggestion approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/suggestions/{id}/reject': {
      post: {
        tags: ['Suggestions'],
        summary: 'Reject suggestion (legacy action endpoint)',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApprovalRejectRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Suggestion rejected',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/suggestions/{id}/documents': {
      post: {
        tags: ['Suggestions'],
        summary: 'Upload suggestion documents',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  files: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Files uploaded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },

    '/committee/pending': {
      get: {
        tags: ['Committee'],
        summary: 'List pending committee suggestions',
        responses: {
          '200': {
            description: 'Pending committee items',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/committee/evaluated': {
      get: {
        tags: ['Committee'],
        summary: 'List already evaluated committee suggestions',
        responses: {
          '200': {
            description: 'Evaluated committee items',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/committee/stats': {
      get: {
        tags: ['Committee'],
        summary: 'Committee dashboard stats',
        responses: {
          '200': {
            description: 'Committee stats',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/committee/evaluate/{id}': {
      post: {
        tags: ['Committee'],
        summary: 'Evaluate suggestion as committee member',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuggestionCommitteeReviewRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Committee action applied',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/committee/assign-project/{id}': {
      put: {
        tags: ['Committee'],
        summary: 'Assign project leader and team to approved suggestion',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  projectLeaderId: { type: 'integer' },
                  teamMemberIds: {
                    type: 'array',
                    items: { type: 'integer' },
                  },
                  projectName: { type: 'string' },
                  projectDescription: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project assignment done',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },

    '/approvals/pending': {
      get: {
        tags: ['Approvals'],
        summary: 'List pending approvals for current approver',
        responses: {
          '200': {
            description: 'Pending approvals',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/approvals/history': {
      get: {
        tags: ['Approvals'],
        summary: 'Get approval history for current approver',
        responses: {
          '200': {
            description: 'Approval history',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/approvals/stats': {
      get: {
        tags: ['Approvals'],
        summary: 'Get approval stats for current approver',
        responses: {
          '200': {
            description: 'Approval stats',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/approvals/{id}': {
      get: {
        tags: ['Approvals'],
        summary: 'Get approval step details',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': {
            description: 'Approval step detail',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/approvals/{id}/approve': {
      post: {
        tags: ['Approvals'],
        summary: 'Approve current approval step',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApprovalActionRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Approval step approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/approvals/{id}/reject': {
      post: {
        tags: ['Approvals'],
        summary: 'Reject current approval step',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApprovalRejectRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Approval step rejected',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/approvals/{id}/return': {
      post: {
        tags: ['Approvals'],
        summary: 'Return suggestion to committee',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApprovalReturnRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Suggestion returned to committee',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },

    '/projects/stats': {
      get: {
        tags: ['Projects'],
        summary: 'Get project statistics',
        responses: {
          '200': {
            description: 'Project stats',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/projects/my': {
      get: {
        tags: ['Projects'],
        summary: 'Get my projects',
        responses: {
          '200': {
            description: 'Current user projects',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects',
        responses: {
          '200': {
            description: 'Projects list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by id',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': {
            description: 'Project details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/projects/{id}/progress': {
      patch: {
        tags: ['Projects'],
        summary: 'Update project progress',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectProgressRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project progress updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/projects/{id}/complete': {
      post: {
        tags: ['Projects'],
        summary: 'Complete project',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CompleteProjectRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/projects/{id}/team': {
      post: {
        tags: ['Projects'],
        summary: 'Add project team member',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddTeamMemberRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Team member added',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/projects/{id}/team/{userId}': {
      delete: {
        tags: ['Projects'],
        summary: 'Remove team member from project',
        parameters: [
          { $ref: '#/components/parameters/IdParam' },
          { $ref: '#/components/parameters/UserIdParam' },
        ],
        responses: {
          '200': {
            description: 'Team member removed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/projects/{id}/milestones': {
      post: {
        tags: ['Projects'],
        summary: 'Create milestone for project',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateMilestoneRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Milestone created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/projects/milestones/{milestoneId}': {
      patch: {
        tags: ['Projects'],
        summary: 'Update milestone',
        parameters: [{ $ref: '#/components/parameters/MilestoneIdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateMilestoneRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Milestone updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete milestone',
        parameters: [{ $ref: '#/components/parameters/MilestoneIdParam' }],
        responses: {
          '200': {
            description: 'Milestone deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },

    '/reports/dashboard': {
      get: {
        tags: ['Reports'],
        summary: 'Get dashboard report data',
        responses: {
          '200': {
            description: 'Dashboard report',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/reports/suggestions': {
      get: {
        tags: ['Reports'],
        summary: 'Get suggestion report',
        responses: {
          '200': {
            description: 'Suggestion report',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/reports/top-performers': {
      get: {
        tags: ['Reports'],
        summary: 'Get top performers report',
        responses: {
          '200': {
            description: 'Top performers report',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/reports/projects': {
      get: {
        tags: ['Reports'],
        summary: 'Get project report',
        responses: {
          '200': {
            description: 'Project report',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/reports/financial': {
      get: {
        tags: ['Reports'],
        summary: 'Get financial summary report',
        responses: {
          '200': {
            description: 'Financial report',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/reports/approvals': {
      get: {
        tags: ['Reports'],
        summary: 'Get approval statistics report',
        responses: {
          '200': {
            description: 'Approval report',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/reports/export/excel': {
      get: {
        tags: ['Reports'],
        summary: 'Export reports as Excel file',
        responses: {
          '200': {
            description: 'Excel file',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
      },
    },
    '/reports/export/pdf': {
      get: {
        tags: ['Reports'],
        summary: 'Export reports as PDF file',
        responses: {
          '200': {
            description: 'PDF file',
            content: {
              'application/pdf': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
      },
    },
    '/reports/export/suggestions': {
      get: {
        tags: ['Reports'],
        summary: 'Legacy suggestions export endpoint',
        deprecated: true,
        responses: {
          '200': {
            description: 'Legacy export result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/reports/export/projects': {
      get: {
        tags: ['Reports'],
        summary: 'Legacy projects export endpoint',
        deprecated: true,
        responses: {
          '200': {
            description: 'Legacy export result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },

    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        responses: {
          '200': {
            description: 'Current user profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update current user profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserProfileUpdateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/password': {
      post: {
        tags: ['Users'],
        summary: 'Change current user password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password changed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/avatar': {
      post: {
        tags: ['Users'],
        summary: 'Update avatar URL for current user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Avatar updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/stats': {
      get: {
        tags: ['Users'],
        summary: 'Get current user stats',
        responses: {
          '200': {
            description: 'User stats',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/suggestions': {
      get: {
        tags: ['Users'],
        summary: 'Get recent suggestions of current user',
        responses: {
          '200': {
            description: 'Recent suggestions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/pending-approvals': {
      get: {
        tags: ['Users'],
        summary: 'Get pending approvals for current user',
        responses: {
          '200': {
            description: 'Pending approvals',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/notifications/unread-count': {
      get: {
        tags: ['Users'],
        summary: 'Get unread notification count',
        responses: {
          '200': {
            description: 'Unread count',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/notifications/read-all': {
      post: {
        tags: ['Users'],
        summary: 'Mark all notifications as read',
        responses: {
          '200': {
            description: 'Notifications marked read',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/notifications': {
      get: {
        tags: ['Users'],
        summary: 'Get notifications',
        responses: {
          '200': {
            description: 'Notifications list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/notifications/{id}/read': {
      patch: {
        tags: ['Users'],
        summary: 'Mark notification as read',
        parameters: [{ $ref: '#/components/parameters/NotificationIdParam' }],
        responses: {
          '200': {
            description: 'Notification marked read',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/notifications/{id}': {
      delete: {
        tags: ['Users'],
        summary: 'Delete notification',
        parameters: [{ $ref: '#/components/parameters/NotificationIdParam' }],
        responses: {
          '200': {
            description: 'Notification deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },

    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users (admin)',
        responses: {
          '200': {
            description: 'User list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create user (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminCreateUserRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/users/bulk': {
      post: {
        tags: ['Admin'],
        summary: 'Bulk create users (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminBulkCreateUsersRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Bulk create result',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get user by id (admin)',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update user (admin)',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminCreateUserRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete user (admin)',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': {
            description: 'User deleted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/users/{id}/reset-password': {
      post: {
        tags: ['Admin'],
        summary: 'Reset user password (admin)',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': {
            description: 'Password reset',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/companies': {
      get: {
        tags: ['Admin'],
        summary: 'List companies (admin)',
        responses: {
          '200': {
            description: 'Company list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create company (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Company created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/companies/{id}': {
      put: {
        tags: ['Admin'],
        summary: 'Update company (admin)',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Company updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/departments': {
      get: {
        tags: ['Admin'],
        summary: 'List departments (admin)',
        responses: {
          '200': {
            description: 'Department list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create department (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'companyId'],
                properties: {
                  name: { type: 'string' },
                  companyId: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Department created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/units': {
      get: {
        tags: ['Admin'],
        summary: 'List units (admin)',
        responses: {
          '200': {
            description: 'Unit list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create unit (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'departmentId'],
                properties: {
                  name: { type: 'string' },
                  departmentId: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Unit created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/settings': {
      get: {
        tags: ['Admin'],
        summary: 'Get system settings (admin)',
        responses: {
          '200': {
            description: 'System settings',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/settings/{key}': {
      put: {
        tags: ['Admin'],
        summary: 'Update system setting (admin)',
        parameters: [{ $ref: '#/components/parameters/SettingKeyParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['value'],
                properties: {
                  value: {
                    oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Setting updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/logs': {
      get: {
        tags: ['Admin'],
        summary: 'Get audit logs (admin)',
        responses: {
          '200': {
            description: 'Audit logs',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/roles': {
      get: {
        tags: ['Admin'],
        summary: 'List available roles (admin)',
        responses: {
          '200': {
            description: 'Role list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin dashboard stats',
        responses: {
          '200': {
            description: 'Admin stats',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccessResponse' },
              },
            },
          },
        },
      },
    },
  },
};

export default openApiDocument;
