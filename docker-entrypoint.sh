#!/bin/sh
# The analytics snippet belongs to the deployment, not to the build: an unset
# `TRACKING_SCRIPT` means no counter is loaded at all.
set -e

BUILD=/public-src
SERVED=/public

if [ -n "$TRACKING_SCRIPT" ]; then
  # `-R`, not `-a`: the destination is a tmpfs the server user does not own.
  cp -R "$BUILD/." "$SERVED/"
  # One HTML file per routed address is prerendered, so every one carries it.
  find "$SERVED" -name '*.html' -type f | while IFS= read -r file; do
    awk '
      !injected && index($0, "</head>") {
        at = index($0, "</head>")
        printf "%s%s\n%s\n", substr($0, 1, at - 1), ENVIRON["TRACKING_SCRIPT"], substr($0, at)
        injected = 1
        next
      }
      { print }
    ' "$file" >"$file.tmp" && mv "$file.tmp" "$file"
  done
  SERVER_ROOT="$SERVED"
else
  SERVER_ROOT="$BUILD"
fi
export SERVER_ROOT

exec /usr/local/bin/entrypoint.sh "$@"
