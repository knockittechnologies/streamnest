#!/usr/bin/env bash
# Run this once on a fresh EC2 instance (Amazon Linux 2023 or Ubuntu 22.04+)
# to install Docker + Docker Compose. Usage:
#   ssh into the instance, then: curl -fsSL <raw-url-to-this-file> | bash
# or copy this file up and run it directly.
set -e

echo "==> Installing Docker…"
if command -v apt-get >/dev/null; then
  # Ubuntu
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg git
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
else
  # Amazon Linux
  sudo yum update -y
  sudo yum install -y docker git
  sudo systemctl enable --now docker
  sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
    -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

echo "==> Done. Log out and back in for the docker group to take effect, then:"
echo "    git clone <your-repo-url> streamnest && cd streamnest"
echo "    cp .env.production.example .env"
echo "    # edit .env with a real POSTGRES_PASSWORD and JWT_SECRET"
echo "    docker compose up -d --build"
