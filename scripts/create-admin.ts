#!/usr/bin/env tsx
/**
 * 어드민 계정 최초 생성 스크립트
 *
 * ─────────────────────────────────────────────
 * 사용법 (로컬)
 * ─────────────────────────────────────────────
 *
 *   npx tsx scripts/create-admin.ts --id "admin" --password "비밀번호"
 *
 * ─────────────────────────────────────────────
 * 사용법 (CI / 환경변수 방식)
 * ─────────────────────────────────────────────
 *
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   ADMIN_ID=admin
 *   ADMIN_PASSWORD=비밀번호
 *   npx tsx scripts/create-admin.ts
 *
 * ─────────────────────────────────────────────
 * 동작
 * ─────────────────────────────────────────────
 *
 *   - 동일한 admin_id 가 이미 존재하면 비밀번호를 덮어씁니다 (upsert)
 *   - 로컬 실행 시 .env.local 을 자동으로 읽습니다
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// ─── .env.local 로드 (로컬 전용) ────────────────────────────────────────────
function loadEnvLocal(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env.local')
  try {
    const content = readFileSync(envPath, 'utf-8')
    const env: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !(key in process.env)) process.env[key] = value
    }
    return env
  } catch {
    return {}
  }
}

// ─── 인수 파싱 ─────────────────────────────────────────────────────────────
function parseArgs(): { id?: string; password?: string } {
  const args = process.argv.slice(2)
  const result: { id?: string; password?: string } = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) result.id = args[++i]
    if (args[i] === '--password' && args[i + 1]) result.password = args[++i]
  }
  return result
}

// ─── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  loadEnvLocal()

  const args = parseArgs()
  const adminId = args.id ?? process.env.ADMIN_ID ?? 'admin'
  const password = args.password ?? process.env.ADMIN_PASSWORD

  if (!password) {
    console.error('❌ 비밀번호를 지정해야 합니다.')
    console.error('   --password "비밀번호"  또는  ADMIN_PASSWORD=... 환경변수로 전달하세요.')
    process.exit(1)
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다.')
    console.error('   .env.local 파일을 확인하거나 환경변수를 설정하세요.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log(`\n어드민 계정 생성 중 (admin_id: ${adminId}) ...`)

  const hash = await bcrypt.hash(password, 12)

  const { error } = await supabase
    .from('admins')
    .upsert({ admin_id: adminId, password_hash: hash }, { onConflict: 'admin_id' })

  if (error) {
    console.error('❌ 생성 실패:', error.message)
    process.exit(1)
  }

  console.log(`✅ 어드민 계정 준비 완료 (admin_id: ${adminId})`)
  console.log('   /admin/login 에서 로그인하세요.\n')
}

main().catch((err) => {
  console.error('❌ 예기치 않은 오류:', err)
  process.exit(1)
})
