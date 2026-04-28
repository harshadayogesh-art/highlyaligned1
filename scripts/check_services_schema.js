import { Client } from 'pg'

const client = new Client({
  connectionString: process.env.DATABASE_URL
})

async function run() {
  await client.connect()
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'services'
  `)
  console.log(res.rows)
  await client.end()
}
run()
