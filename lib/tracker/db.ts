import 'server-only'
import { randomUUID } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import type { Application, ApplicationInput } from './schema'

// Table layout (single table, on-demand billing):
//   pk (S, partition key) = "OWNER"            — one partition, it's just you
//   sk (S, sort key)      = "APP#<uuid>"
// Every other attribute is the Application itself.
//
// Env: TRACKER_TABLE (table name), TRACKER_AWS_REGION, TRACKER_AWS_ACCESS_KEY_ID,
// TRACKER_AWS_SECRET_ACCESS_KEY. Custom names because Vercel reserves AWS_*.
// If the TRACKER_ keys are unset, the SDK's default credential chain is used.

const PK = 'OWNER'
const sk = (id: string) => `APP#${id}`

let client: DynamoDBDocumentClient | undefined

function db() {
  if (client) return client
  const accessKeyId = process.env.TRACKER_AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.TRACKER_AWS_SECRET_ACCESS_KEY
  const base = new DynamoDBClient({
    region: process.env.TRACKER_AWS_REGION || process.env.AWS_REGION || 'ap-south-1',
    // Local dev: point at Floci (http://localhost:4566). Leave unset in production.
    ...(process.env.TRACKER_DYNAMODB_ENDPOINT ? { endpoint: process.env.TRACKER_DYNAMODB_ENDPOINT } : {}),
    ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
  })
  client = DynamoDBDocumentClient.from(base, {
    marshallOptions: { removeUndefinedValues: true },
  })
  return client
}

function table() {
  const name = process.env.TRACKER_TABLE
  if (!name) throw new Error('TRACKER_TABLE is not set')
  return name
}

function toApp(item: Record<string, unknown>): Application {
  const { pk: _pk, sk: _sk, ...rest } = item
  return rest as Application
}

export async function listApplications(): Promise<Application[]> {
  const items: Record<string, unknown>[] = []
  let ExclusiveStartKey: Record<string, unknown> | undefined
  do {
    const res = await db().send(
      new QueryCommand({
        TableName: table(),
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': PK, ':prefix': 'APP#' },
        ExclusiveStartKey,
      }),
    )
    items.push(...(res.Items ?? []))
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)

  // Newest activity first: applied date, else created date.
  return items
    .map(toApp)
    .sort((a, b) => (b.appliedDate ?? b.createdAt).localeCompare(a.appliedDate ?? a.createdAt))
}

export async function getApplication(id: string): Promise<Application | null> {
  const res = await db().send(new GetCommand({ TableName: table(), Key: { pk: PK, sk: sk(id) } }))
  return res.Item ? toApp(res.Item) : null
}

export async function createApplication(input: ApplicationInput): Promise<Application> {
  const now = new Date().toISOString()
  const app: Application = { ...input, id: randomUUID(), createdAt: now, updatedAt: now }
  await db().send(
    new PutCommand({
      TableName: table(),
      Item: { pk: PK, sk: sk(app.id), ...app },
      ConditionExpression: 'attribute_not_exists(pk)',
    }),
  )
  return app
}

/** Fields set to null are removed. Returns null if the application doesn't exist. */
export async function updateApplication(id: string, patch: Record<string, unknown>): Promise<Application | null> {
  const names: Record<string, string> = { '#updatedAt': 'updatedAt' }
  const values: Record<string, unknown> = { ':updatedAt': new Date().toISOString() }
  const sets = ['#updatedAt = :updatedAt']
  const removes: string[] = []

  for (const [k, v] of Object.entries(patch)) {
    names[`#${k}`] = k
    if (v === null) removes.push(`#${k}`)
    else {
      values[`:${k}`] = v
      sets.push(`#${k} = :${k}`)
    }
  }

  try {
    const res = await db().send(
      new UpdateCommand({
        TableName: table(),
        Key: { pk: PK, sk: sk(id) },
        UpdateExpression: `SET ${sets.join(', ')}${removes.length ? ` REMOVE ${removes.join(', ')}` : ''}`,
        ConditionExpression: 'attribute_exists(pk)',
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    )
    return res.Attributes ? toApp(res.Attributes) : null
  } catch (err) {
    if ((err as Error).name === 'ConditionalCheckFailedException') return null
    throw err
  }
}

export async function deleteApplication(id: string): Promise<boolean> {
  try {
    await db().send(
      new DeleteCommand({
        TableName: table(),
        Key: { pk: PK, sk: sk(id) },
        ConditionExpression: 'attribute_exists(pk)',
      }),
    )
    return true
  } catch (err) {
    if ((err as Error).name === 'ConditionalCheckFailedException') return false
    throw err
  }
}

// ---- Login rate limiting -------------------------------------------------
// Failed attempts per IP are counted in the same table (sk = "LOGIN#<ip>").
// Enable TTL on the `ttl` attribute so old counters delete themselves.

const LOGIN_WINDOW_SECONDS = 15 * 60
export const MAX_LOGIN_FAILURES = 5

export async function loginFailures(ip: string): Promise<number> {
  const res = await db().send(new GetCommand({ TableName: table(), Key: { pk: PK, sk: `LOGIN#${ip}` } }))
  const item = res.Item
  if (!item || (item.ttl as number) < Math.floor(Date.now() / 1000)) return 0
  return (item.count as number) ?? 0
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db().send(
    new UpdateCommand({
      TableName: table(),
      Key: { pk: PK, sk: `LOGIN#${ip}` },
      // Start a fresh window if the old one expired (TTL deletion can lag).
      UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :one, #ttl = if_not_exists(#ttl, :ttl)',
      ConditionExpression: 'attribute_not_exists(#ttl) OR #ttl > :now',
      ExpressionAttributeNames: { '#count': 'count', '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':zero': 0, ':one': 1, ':ttl': now + LOGIN_WINDOW_SECONDS, ':now': now },
    }),
  ).catch(async (err) => {
    if ((err as Error).name !== 'ConditionalCheckFailedException') throw err
    await db().send(
      new PutCommand({ TableName: table(), Item: { pk: PK, sk: `LOGIN#${ip}`, count: 1, ttl: now + LOGIN_WINDOW_SECONDS } }),
    )
  })
}

export async function clearLoginFailures(ip: string): Promise<void> {
  await db().send(new DeleteCommand({ TableName: table(), Key: { pk: PK, sk: `LOGIN#${ip}` } }))
}
