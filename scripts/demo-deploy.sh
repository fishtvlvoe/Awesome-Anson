#!/bin/bash

# Deploy a generated demo site to Cloudflare Pages
# Usage: demo-deploy.sh <case-slug> <local-demo-dir>
# 複用待神 dashboard-deploy.sh 的部署機制寫法：單一 writer lock、--branch=main、穩定 DOM 標記驗證

set -e

LOCK_SCRIPT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/demo-deploy-lock.sh"

function die() {
  echo "❌ $@" >&2
  exit 1
}

function deploy_demo() {
  local case_slug="$1"
  local demo_dir="$2"

  [[ -z "$case_slug" ]] && die "case_slug is required"
  [[ -z "$demo_dir" ]] && die "demo_dir is required"
  [[ ! -d "$demo_dir" ]] && die "demo_dir does not exist: $demo_dir"

  echo "📦 Deploying demo for $case_slug..."

  if ! command -v wrangler &> /dev/null; then
    die "wrangler CLI not found. Install with: npm install -g wrangler"
  fi

  if ! bash "$LOCK_SCRIPT" acquire "$case_slug" >/dev/null 2>&1; then
    die "Failed to acquire lock for $case_slug. Demo may be in use."
  fi

  echo "🔒 Lock acquired, starting deployment..."

  # --branch=main 是必要的：Cloudflare Pages 只有 branch 對到專案設定的 production branch
  # 才算 Production 部署，否則會落到 Preview 網址，主網址仍是舊內容或 Cloudflare 的 soft-404
  # （soft-404 本身也回 200，純看 status code 抓不出來，所以下面用穩定 DOM 標記驗證）
  if ! wrangler pages deploy "$demo_dir" --project-name="${case_slug}-demo" --branch=main 2>&1; then
    bash "$LOCK_SCRIPT" release "$case_slug" 2>/dev/null || true
    die "Deployment failed"
  fi

  echo "✅ Deployment completed"

  bash "$LOCK_SCRIPT" release "$case_slug" >/dev/null 2>&1 || true

  local demo_url="https://${case_slug}-demo.pages.dev"
  echo ""
  echo "🎉 Demo deployed successfully!"
  echo "🔗 ${demo_url}"

  # 穩定 DOM 標記驗證：抓固定的 data-demo-marker 屬性，不是會變動的 title 文字
  local body
  body=$(curl -s "$demo_url")
  if echo "$body" | grep -q 'data-demo-marker="anson-demo"'; then
    echo "✅ DOM marker verified"
  else
    die "Deployed page missing expected DOM marker (data-demo-marker=\"anson-demo\")"
  fi
}

deploy_demo "$1" "$2"
