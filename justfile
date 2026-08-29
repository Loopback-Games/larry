# Larry — Lost Wages task runner.
#
# This is the only interface. Recipes call the tools directly rather than
# shelling through `npm run`, so there is one definition of every step and
# nothing to drift between two files. CI runs `just ci` and nothing else.
#
# Tool versions come from mise.toml. `just setup` installs them.

set shell := ["bash", "-euo", "pipefail", "-c"]

# The project's own binaries first, then mise's shims. `tsc` here is the one in
# package-lock.json rather than whatever the machine has globally, and the shims
# mean every recipe works in a shell that never sourced a profile — which is
# every shell a devcontainer runs.
#
# The parentheses matter: `/` and `+` share a precedence level in just and
# associate left, so the unbracketed form only happens to produce the right
# string.
export PATH := justfile_directory() / "node_modules/.bin" + ":" + (env("HOME") / ".local/share/mise/shims") + ":" + env("PATH")

# Where the built site is served from. GitHub Pages serves a project site under
# /<repo>/, and the default here is `/larry/` rather than `/` because the
# end-to-end suite drives that path — a root default silently breaks it.
export BASE_PATH := env_var_or_default("BASE_PATH", "/larry/")

# Port the preview server and the end-to-end suite share.
preview_port := "4173"

# List the available recipes.
default:
    @just --list

# Everything a fresh clone needs before it can run anything else.
setup: install browsers

# npm ci rather than npm install: it installs precisely what the lockfile says
# and refuses to rewrite it, which is the difference between the tree CI tested
# and one that happens to resolve the same way today. Moving a dependency on
# purpose is `just update`.

# Install the pinned toolchain and the exact tree the lockfile describes.
install:
    mise trust --quiet
    mise install --yes
    npm ci

# The only recipe that is allowed to change package-lock.json.

# Re-resolve the dependency tree and write the lockfile.
update:
    npm install

# The OS libraries have to come from somewhere, and `--with-deps` installs them
# through apt — so it works on the Ubuntu runner and in the devcontainer, and
# fails outright on a Fedora host. Detected rather than passed in, so `just ci`
# is the same command everywhere. A no-op once the browser is on the machine.
#
# The devcontainer builds on Playwright's own image, which already carries the
# browsers and says where; asking for them again there would need root and
# change nothing. This replaces the cache-hit/cache-miss `playwright install`
# pair the workflow used to carry.

# Fetch the browser the end-to-end suite drives.
browsers:
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ]]; then
        echo "browsers already in the image at ${PLAYWRIGHT_BROWSERS_PATH}"
    elif command -v apt-get >/dev/null 2>&1; then
        playwright install --with-deps chromium
    else
        playwright install chromium
    fi

# Format every file in place.
fmt:
    prettier --write .

# Type-check the project, check formatting, and lint the configuration.
lint: lint-config
    tsc --noEmit
    prettier --check .

# No "not installed, skipping" guards, and nothing fetched at run time. This was
# an npm script that assumed actionlint and zizmor were already on PATH, plus a
# CI job that installed actionlint through `curl | bash` and zizmor through
# `pipx run`. Both come from mise.toml now.

# Workflows and the YAML around them.
lint-config:
    actionlint
    zizmor --min-severity low .github/workflows
    yamllint --strict .github .yamllint

# Dependabot bumps @playwright/test and knows nothing about the container tag.
# A mismatch is not a warning: Playwright cannot find its browsers at all.

# Fail if the Playwright image and the Playwright package have drifted apart.
lint-versions:
    #!/usr/bin/env bash
    set -euo pipefail
    want="$(node -p "require('@playwright/test/package.json').version")"
    ok=1
    for f in .devcontainer/Containerfile .github/workflows/ci.yml; do
        got="$(sed -n 's|.*mcr\.microsoft\.com/playwright:v\([0-9][0-9.]*\)-noble.*|\1|p' "$f" | head -1)"
        if [[ "$got" != "$want" ]]; then
            echo "$f pins Playwright ${got:-<none>}, package.json wants $want" >&2
            ok=0
        fi
    done
    if (( ! ok )); then
        echo "Bump the image tag and its digest together, or pin the package back." >&2
        exit 1
    fi
    echo "  Playwright image and package agree on $want"

# Run the unit, world, traversal and walkthrough tests.
test:
    vitest run --config vitest.config.ts

# Watch the tests while working.
watch:
    vitest --config vitest.config.ts

# Run the end-to-end suite against a production build.
e2e: browsers
    playwright test

# The same specs, against a URL that is already serving. The deploy workflow
# uses this to check the site it has just published, which is a gate no sibling
# repository has.

# Run the end-to-end suite against a deployed site.
verify-live url: browsers
    E2E_BASE_URL={{ url }} playwright test

# Two advisory databases rather than one, where this repository previously had
# none at all. Only npm audit gates, at `high` — the game ships no runtime
# dependencies, so a moderate advisory in the build tree is not reachable by a
# player, and a gate that goes red with no fix available is a gate somebody
# eventually weakens. osv-scanner has no severity filter, so those findings stay
# visible without blocking.
#
# gitleaks reads the history rather than the working tree, because a key that
# was committed and then deleted is still a key that was published. That is what
# makes CI need a full clone.

# Secrets in the history, and advisories against the dependencies, twice.
security:
    npm audit --audit-level=high
    osv-scanner scan source --lockfile package-lock.json
    gitleaks git . --no-banner --redact

# The size budget is folded in rather than standing alone, because it measures
# dist/ — a separate recipe would either rebuild or silently measure whatever
# was last built. Folded in, it cannot be skipped.

# Build the production bundle into dist/, and check it has not ballooned.
build:
    tsc --noEmit
    vite build
    node tools/size-budget.mjs

# Serve the game with hot reload.
run:
    vite

# Serve the production build locally.
preview: build
    vite preview --host 127.0.0.1 --port {{ preview_port }} --strictPort

# Room art is written as code, so a diff of a scene says nothing about what
# changed on screen. Render the lot so an art change can be looked at rather
# than guessed at. The workflow uploads what this produces.

# Render every room to a contact sheet.
art:
    node tools/room-sheet.mjs rooms.png colour
    node tools/room-sheet.mjs rooms-walk.png walk

# Everything, from a clean checkout, exactly as CI runs it.
ci: install lint lint-versions security test build e2e art

# The same gates as `ci`, minus the provisioning.

# Every gate, for a quick loop before pushing.
check: lint lint-versions security test build e2e

# The point of this recipe is that it proves the claim: the same `just ci`, on a
# machine that is neither this laptop nor the runner, from the same mise.toml.

# Run the full gate inside the devcontainer.
container:
    devcontainer up --docker-path podman --workspace-folder .
    devcontainer exec --docker-path podman --workspace-folder . just ci

# Remove build output and test artefacts.
clean:
    rm -rf dist node_modules test-results playwright-report coverage rooms.png rooms-walk.png
