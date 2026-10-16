#!/usr/bin/env bash
set -Eeuo pipefail

# HZ Retail POS — end-to-end verification
# Uses a real admin account and creates test data.
# Does not reset the database or process card payments.

cd "$(dirname "$0")/.."

for cmd in curl jq docker npm node; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "FAIL: Required command missing: $cmd"
    exit 1
  }
done

TMP_DIR="$(mktemp -d)"
chmod 700 "$TMP_DIR"
COOKIE_JAR="$TMP_DIR/cookies.txt"
RESPONSE="$TMP_DIR/response.json"
BODY="$TMP_DIR/request.json"
PRODUCT_ID=""
PRODUCT_SKU="E2E-$(date +%s)-$$"
PRODUCT_PRICE=12345
INITIAL_STOCK=5
API_PORT="${API_PORT:-$(node --input-type=module -e \
  "import dotenv from './backend/node_modules/dotenv/lib/main.js'; dotenv.config({path:'backend/.env',quiet:true}); console.log(Number(process.env.PORT)||5000)" 2>/dev/null || echo 5000)}"
API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:${API_PORT}}"
API_BASE_URL="${API_BASE_URL%/}"
PASSED=0
FAILED=0
AUTHENTICATED=0
SALE_ID=""

cleanup() {
  if [[ "$AUTHENTICATED" -eq 1 ]]; then
    # Leave the test product inactive so it cannot be sold accidentally.
    if [[ -n "$PRODUCT_ID" ]]; then
      curl -sS --max-time 5 -o /dev/null \
        -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
        -X PATCH "$API_BASE_URL/api/v1/products/$PRODUCT_ID" \
        -H 'Content-Type: application/json' \
        --data '{"status":"inactive"}' || true
    fi
    curl -sS --max-time 5 -o /dev/null \
      -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -X POST "$API_BASE_URL/api/v1/auth/logout" || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

pass() {
  printf 'PASS: %s\n' "$1"
  PASSED=$((PASSED + 1))
}

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  FAILED=$((FAILED + 1))
}

request() {
  local method="$1" path="$2" expected="$3"
  shift 3
  local status
  status="$(curl -sS --max-time 15 \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -o "$RESPONSE" -w '%{http_code}' \
    -X "$method" "$API_BASE_URL$path" "$@" || true)"
  if [[ "$status" == "$expected" ]]; then
    return 0
  fi
  printf '  Expected HTTP %s; received HTTP %s\n' "$expected" "${status:-no response}" >&2
  if jq -e . "$RESPONSE" >/dev/null 2>&1; then
    jq -c '{code:.code,message:.message,error:.error}' "$RESPONSE" >&2 || true
  fi
  return 1
}

check() {
  local description="$1"
  shift
  if "$@"; then
    pass "$description"
  else
    fail "$description"
    return 1
  fi
}

echo
echo "=================================================="
echo " HZ RETAIL POS — END-TO-END VERIFICATION"
echo "=================================================="
echo "API: $API_BASE_URL"
echo "Test SKU: $PRODUCT_SKU"
echo

echo "========== 1. STATIC CHECKS =========="
check "Backend syntax and app checks" npm --prefix backend run check || true
check "Frontend production build" npm --prefix frontend run build || true

echo
echo "========== 2. DATABASE AND API =========="
if docker inspect -f '{{.State.Health.Status}}' hz-retail-pos-mongo 2>/dev/null |
   grep -qx healthy; then
  pass "MongoDB container is healthy"
else
  fail "MongoDB container is healthy"
fi

if docker exec hz-retail-pos-mongo mongosh --quiet \
   --eval 'db.hello().isWritablePrimary' 2>/dev/null | grep -qx true; then
  pass "MongoDB replica-set primary is ready"
else
  fail "MongoDB replica-set primary is ready"
fi

if curl -fsS --max-time 5 "$API_BASE_URL/api/v1/health" \
   -o "$RESPONSE" && jq -e '.status == "ok"' "$RESPONSE" >/dev/null; then
  pass "Backend health endpoint"
else
  fail "Backend health endpoint — start the backend and retry"
  echo
  echo "Summary: $PASSED passed, $FAILED failed."
  exit 1
fi

echo
echo "========== 3. ADMIN AUTHENTICATION =========="
read -r -p "Administrator email: " ADMIN_EMAIL </dev/tty
read -r -s -p "Administrator password: " ADMIN_PASSWORD </dev/tty
printf '\n'

jq -n --arg email "$ADMIN_EMAIL" --arg password "$ADMIN_PASSWORD" \
  '{email:$email,password:$password}' > "$BODY"
unset ADMIN_PASSWORD

if request POST /api/v1/auth/login 200 \
   -H 'Content-Type: application/json' --data-binary "@$BODY"; then
  if jq -e '.data.user.id and .data.user.role == "admin"' \
     "$RESPONSE" >/dev/null; then
    AUTHENTICATED=1
    pass "Administrator login"
  else
    fail "Login returned an administrator account"
    exit 1
  fi
else
  fail "Administrator login"
  echo "Check the account credentials and API availability."
  exit 1
fi

check "Authenticated session (/auth/me)" \
  request GET /api/v1/auth/me 200 || true

if request GET /api/v1/products 200; then
  check "Authenticated product listing" \
    jq -e '.data | type == "array"' "$RESPONSE" >/dev/null || true
else
  fail "Authenticated product listing"
fi

echo
echo "========== 4. CREATE ISOLATED TEST PRODUCT =========="
jq -n \
  --arg name "E2E Verification Product" \
  --arg sku "$PRODUCT_SKU" \
  '{name:$name,sku:$sku,category:"E2E Verification",
    pricePaisa:12345,stockQty:5,lowStockThreshold:1,status:"active"}' > "$BODY"

if request POST /api/v1/products 201 \
   -H 'Content-Type: application/json' --data-binary "@$BODY"; then
  PRODUCT_ID="$(jq -r '.data._id // .data.id // empty' "$RESPONSE")"
  if [[ -n "$PRODUCT_ID" ]]; then
    pass "Create test product"
  else
    fail "Create test product returned an ID"
    exit 1
  fi
else
  fail "Create test product"
  exit 1
fi

get_product_stock() {
  request GET "/api/v1/products?search=$PRODUCT_SKU" 200 &&
    jq -er --arg sku "$PRODUCT_SKU" \
      '[.data[] | select(.sku == $sku)][0].stockQty' "$RESPONSE"
}

if [[ "$(get_product_stock)" == "$INITIAL_STOCK" ]]; then
  pass "Initial stock equals 5"
else
  fail "Initial stock equals 5"
fi

echo
echo "========== 5. PAYMENT VALIDATION =========="

# Insufficient cash must not create a sale or consume stock.
jq -n --arg id "$PRODUCT_ID" \
  '{items:[{productId:$id,quantity:1}],
    paymentMethod:"cash",amountReceivedPaisa:12344}' > "$BODY"

if request POST /api/v1/sales 400 \
   -H 'Content-Type: application/json' --data-binary "@$BODY" &&
   jq -e '.error.code == "INSUFFICIENT_PAYMENT"' "$RESPONSE" >/dev/null; then
  pass "Insufficient cash rejected"
else
  fail "Insufficient cash rejected with expected error"
fi

if [[ "$(get_product_stock)" == "$INITIAL_STOCK" ]]; then
  pass "Insufficient payment leaves stock unchanged"
else
  fail "Insufficient payment leaves stock unchanged"
fi

# Card payment must remain unavailable and must not consume stock.
jq -n --arg id "$PRODUCT_ID" \
  '{items:[{productId:$id,quantity:1}],
    paymentMethod:"card",amountReceivedPaisa:13000}' > "$BODY"

if request POST /api/v1/sales 409 \
   -H 'Content-Type: application/json' --data-binary "@$BODY" &&
   jq -e '.error.code == "CARD_PAYMENT_NOT_CONFIGURED"' "$RESPONSE" >/dev/null; then
  pass "Card payment rejected as unconfigured"
else
  fail "Card payment rejected with expected error"
fi

if [[ "$(get_product_stock)" == "$INITIAL_STOCK" ]]; then
  pass "Rejected card payment leaves stock unchanged"
else
  fail "Rejected card payment leaves stock unchanged"
fi

echo
echo "========== 6. SUCCESSFUL CASH CHECKOUT =========="

# Product price: Rs 123.45; received: Rs 130.00; change: Rs 6.55.
jq -n --arg id "$PRODUCT_ID" \
  '{items:[{productId:$id,quantity:1}],
    paymentMethod:"cash",amountReceivedPaisa:13000}' > "$BODY"

if request POST /api/v1/sales 201 \
   -H 'Content-Type: application/json' --data-binary "@$BODY"; then
  SALE_ID="$(jq -r '.data._id // .data.id // empty' "$RESPONSE")"
  if jq -e \
    '.data.status == "completed" and
     .data.paymentMethod == "cash" and
     .data.totalPaisa == 12345 and
     .data.amountReceivedPaisa == 13000 and
     .data.changePaisa == 655' "$RESPONSE" >/dev/null; then
    pass "Cash sale totals, received amount, and change are correct"
  else
    fail "Cash sale financial values"
    jq -c '.data | {status,paymentMethod,totalPaisa,amountReceivedPaisa,changePaisa}' \
      "$RESPONSE" || true
  fi
else
  fail "Successful cash checkout"
fi

if [[ -n "$SALE_ID" ]]; then
  if [[ "$(get_product_stock)" == "$((INITIAL_STOCK - 1))" ]]; then
    pass "Successful sale decrements stock by one"
  else
    fail "Successful sale decrements stock by one"
  fi

  if request GET /api/v1/sales 200; then
    if jq -e --arg id "$SALE_ID" \
      '[.data[] | select((._id // .id | tostring) == $id)] | length > 0' \
      "$RESPONSE" >/dev/null; then
      pass "Completed sale appears in transaction history"
    else
      fail "Completed sale appears in transaction history"
    fi
  else
    fail "Read transaction history"
  fi
else
  fail "Sale ID available for history verification"
fi

echo
echo "========== 7. CLEANUP =========="
if [[ -n "$PRODUCT_ID" ]]; then
  if request PATCH "/api/v1/products/$PRODUCT_ID" 200 \
    -H 'Content-Type: application/json' \
    --data '{"status":"inactive"}'; then
    if jq -e '.data.status == "inactive"' "$RESPONSE" >/dev/null; then
      pass "Test product marked inactive"
    else
      fail "Test product marked inactive"
    fi
  else
    fail "Test product marked inactive"
  fi
fi

if request POST /api/v1/auth/logout 200; then
  AUTHENTICATED=0
  pass "Logout"
else
  fail "Logout"
fi

echo
echo "=================================================="
printf 'RESULT: %s passed, %s failed\n' "$PASSED" "$FAILED"
echo "=================================================="
echo "Note: The test sale and inventory movements remain as audit records."
echo "The test product is marked inactive; no database reset was performed."

[[ "$FAILED" -eq 0 ]]
