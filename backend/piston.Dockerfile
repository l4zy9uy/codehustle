FROM ghcr.io/engineer-man/piston:latest

WORKDIR /piston

# Install ppman and C++ runtime at build time
RUN set -eux; \
    (apk add --no-cache curl bash || true); \
    (curl -fsSL https://raw.githubusercontent.com/engineer-man/piston/master/scripts/ppman-install.sh | sh) || true; \
    if command -v ppman >/dev/null 2>&1; then \
      ppman update || true; \
      (ppman install 'c++/17' || ppman install 'cpp/17' || true); \
      ppman list || true; \
    fi

