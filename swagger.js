const swaggerJSDoc = require('swagger-jsdoc')

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job Seeking App API',
      version: '1.0.0',
      description:
        'REST API for the Job Seeking App (SEN2241 OOADI project). ' +
        'Covers authentication, job listings, applications, favorites, and notifications.'
    },
    servers: [{ url: '/', description: 'Current server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  // Scans these files for `@openapi` JSDoc blocks and builds the spec from them.
  apis: ['./routes/*.js']
})

module.exports = swaggerSpec
