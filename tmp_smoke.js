const http = require('http')

function req(options, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, (res) => {
      let data = ''
      res.on('data', (d) => (data += d))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }))
    })
    r.on('error', reject)
    if (body) r.write(JSON.stringify(body))
    r.end()
  })
}

;(async () => {
  try {
    console.log('GET /health')
    console.log(await req({ hostname: 'localhost', port: 5000, path: '/health', method: 'GET' }))

    console.log('\nGET /api/jobs')
    console.log(await req({ hostname: 'localhost', port: 5000, path: '/api/jobs', method: 'GET' }))

    const user = { name: 'Smoke Test', email: 'smoke+test@example.com', password: 'password123', role: 'jobseeker' }
    console.log('\nPOST /api/auth/register')
    console.log(await req({ hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } }, user))

    console.log('\nPOST /api/auth/login')
    const login = { email: user.email, password: user.password }
    const loginRes = await req({ hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, login)
    console.log(loginRes)
    let token = null
    try { token = JSON.parse(loginRes.body).token } catch(e) {}

    if (token) {
      console.log('\nGET /api/users/me with token')
      console.log(await req({ hostname: 'localhost', port: 5000, path: '/api/users/me', method: 'GET', headers: { Authorization: 'Bearer ' + token } }))
    } else {
      console.log('\nNo token returned; skipping protected endpoint test')
    }
  } catch (err) {
    console.error('Smoke test error:', err.message)
    process.exit(1)
  }
})()
