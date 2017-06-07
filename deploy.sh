#!/bin/sh

ssh app@sharpen << EOF
  mkdir -p sharpen
  cd sharpen
  git pull
  npm install
EOF

scp .env app@sharpen:sharpen/.

ssh root@sharpen << EOF
  cd /home/app/sharpen
  nf export -t systemd -o /lib/systemd/system/ web=8
  systemctl daemon-reload
  systemctl enable foreman.target
  systemctl restart foreman.target
EOF
