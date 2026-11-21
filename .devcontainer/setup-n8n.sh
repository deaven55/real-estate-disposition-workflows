#!/usr/bin/env bash
set -euo pipefail

if ! command -v n8n >/dev/null 2>&1; then
  npm install --global n8n
fi

mkdir -p /workspaces/.n8n

cat > /workspaces/.n8n/README.txt <<'EOF'
n8n data directory for the GitHub Codespace.
Do not store production secrets in the repository.
Use n8n credentials/environment secrets for real integrations.
EOF

echo ""
echo "n8n is installed."
echo "Start it with: n8n start"
echo "Then open forwarded port 5678 in the Codespace."
